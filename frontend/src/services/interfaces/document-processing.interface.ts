export interface DocumentProcessingRequest {
  sourceId: string;
  filePath: string;
  sourceType: string;
}

export interface DocumentProcessingResponse {
  success: boolean;
  message: string;
  result?: any;
}

export interface IDocumentProcessingService {
  processDocument(request: DocumentProcessingRequest): Promise<DocumentProcessingResponse>;
}