import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ProcessResponse {
  success: boolean
  message: string
  webhookUrl: string
  payloadSent: object
  result?: any
  errorDetails?: string
}

interface RequestPayload {
  sourceId: string
  filePath: string
  sourceType: string
}

interface WebhookPayload {
  source_id: string
  file_url: string
  file_path: string
  source_type: string
  callback_url: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const validateRequestPayload = (payload: any): { isValid: boolean; error?: string } => {
  const { sourceId, filePath, sourceType } = payload

  if (!sourceId || !filePath || !sourceType) {
    return {
      isValid: false,
      error: 'sourceId, filePath, and sourceType are required'
    }
  }

  return { isValid: true }
}

const validateEnvironmentVariables = (): { isValid: boolean; webhookUrl?: string; authHeader?: string; error?: string } => {
  const webhookUrl = Deno.env.get('DOCUMENT_PROCESSING_WEBHOOK_URL')
  const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

  if (!webhookUrl) {
    return {
      isValid: false,
      error: 'Document processing webhook URL not configured'
    }
  }

  return {
    isValid: true,
    webhookUrl,
    authHeader
  }
}

const createSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

const updateSourceStatus = async (sourceId: string, status: 'processing' | 'failed') => {
  const supabaseClient = createSupabaseClient()
  
  await supabaseClient
    .from('sources')
    .update({ processing_status: status })
    .eq('id', sourceId)
}

const buildWebhookPayload = (requestPayload: RequestPayload): WebhookPayload => {
  const { sourceId, filePath, sourceType } = requestPayload
  const fileUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/sources/${filePath}`
  const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-document-callback`

  return {
    source_id: sourceId,
    file_url: fileUrl,
    file_path: filePath,
    source_type: sourceType,
    callback_url: callbackUrl
  }
}

const callWebhookService = async (
  webhookUrl: string, 
  payload: WebhookPayload, 
  authHeader?: string
): Promise<{ success: boolean; result?: any; error?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      return {
        success: false,
        error: `Webhook call failed with status ${response.status}: ${errorText}`
      }
    }

    const result = await response.json()
    console.log('Webhook success response:', result)
    return {
      success: true,
      result
    }
  } catch (error) {
    console.error('Webhook call exception:', error)
    return {
      success: false,
      error: `Webhook call failed: ${error.message}`
    }
  }
}

const createResponse = (data: ProcessResponse, status: number = 200): Response => {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  )
}

const handleOptionsRequest = (): Response => {
  return new Response('ok', { headers: corsHeaders })
}

const processDocument = async (requestPayload: RequestPayload): Promise<ProcessResponse> => {
  const { sourceId } = requestPayload

  console.log('Processing document request:', { 
    source_id: sourceId, 
    file_path: requestPayload.filePath, 
    source_type: requestPayload.sourceType 
  })

  // Validate environment variables
  const envValidation = validateEnvironmentVariables()
  if (!envValidation.isValid) {
    await updateSourceStatus(sourceId, 'failed')
    return {
      success: false,
      message: envValidation.error!,
      webhookUrl: 'N/A',
      payloadSent: {},
      errorDetails: 'Missing required environment variable: DOCUMENT_PROCESSING_WEBHOOK_URL'
    }
  }

  const { webhookUrl, authHeader } = envValidation
  const webhookPayload = buildWebhookPayload(requestPayload)

  console.log('Calling webhook service:', webhookUrl)

  // Call external webhook
  const webhookResult = await callWebhookService(webhookUrl!, webhookPayload, authHeader)

  if (!webhookResult.success) {
    await updateSourceStatus(sourceId, 'failed')
    return {
      success: false,
      message: 'Document processing failed',
      webhookUrl: webhookUrl!,
      payloadSent: webhookPayload,
      errorDetails: webhookResult.error
    }
  }

  console.log('Webhook executed successfully')

  return {
    success: true,
    message: 'Document processing initiated successfully',
    webhookUrl: webhookUrl!,
    payloadSent: webhookPayload,
    result: webhookResult.result
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest()
  }

  try {
    const requestPayload = await req.json()

    // Validate request payload
    const validation = validateRequestPayload(requestPayload)
    if (!validation.isValid) {
      const errorResponse: ProcessResponse = {
        success: false,
        message: validation.error!,
        webhookUrl: 'N/A',
        payloadSent: {},
        errorDetails: 'Invalid request parameters'
      }
      return createResponse(errorResponse, 400)
    }

    // Process the document
    const result = await processDocument(requestPayload)
    const statusCode = result.success ? 200 : 500

    return createResponse(result, statusCode)

  } catch (error) {
    console.error('Unexpected error in process-document function:', error)
    
    const errorResponse: ProcessResponse = {
      success: false,
      message: 'Internal server error',
      webhookUrl: 'N/A',
      payloadSent: {},
      errorDetails: error.message || 'Unknown internal error'
    }

    return createResponse(errorResponse, 500)
  }
})