Actúa como un desarrollador senior experto en **React**, **TypeScript** y **arquitectura limpia**, con dominio en principios **KISS** y buenas prácticas.
Estás trabajando en una aplicación moderna llamada `smartbase-notebooklm`, que replica las funciones de Google NotebookLM usando **React + Vite + TypeScript**.

---

### 🎯 Objetivo

Desacopla completamente el uso de **Supabase** en la lógica de subida de archivos implementada en `useNotebookUpdate.tsx`, reemplazando la lógica directa por un **servicio o repositorio inyectable y reutilizable**.
Esto permitirá sustituir fácilmente Supabase por otros mecanismos de almacenamiento en el futuro y **evitar vendor lock-in**.

---

### 📍 Instrucciones

* **No expliques nada. Solo devuelve el código necesario.**
* Refactoriza el código en `useNotebookUpdate.tsx` para **eliminar la dependencia directa de Supabase**.
* Crea un repositorio independiente y reutilizable que encapsule la lógica actual crear,editar,eliminar (donde aplique).
* Aplica buenas prácticas, separación de responsabilidades y principios KISS.
* **Es válido agregar comentarios en el código donde sea necesario** para mejorar su comprensión y mantenibilidad.
* Usa nombres consistentes con el estilo del proyecto (`camelCase`, `PascalCase` donde corresponda).

---

### 🧠 Contexto clave

* Proyecto: `smartbase-notebooklm`
* Framework: React + TypeScript
* Herramienta de bundling: Vite
* Lógica actual acoplada a Supabase en: `frontend/src/hooks/useNotebookUpdate.tsx`
* Supabase client actual: `@/integrations/supabase/client.ts`
* Logger: `@/services/logger`
* Notificación UI: `@/hooks/use-toast`
* Variables de entorno: `VITE_SUPABASE_BUCKET_SOURCE`

---

### 🛠️ Estructura esperada

1. **Nuevo repositorio y servicio desacoplado**
2. **Interfaz para el repositorio y servicio**
3. **Refactor del hook `useNotebookUpdate.tsx`** para usar el nuevo servicio
---

## Contenido del archivo useNotebookUpdate.tsx

```tsx  

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNotebookUpdate = () => {
  const queryClient = useQueryClient();

  const updateNotebook = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { title?: string; description?: string } }) => {
      console.log('Updating notebook wtf:', id, updates);
      
      const { data, error } = await supabase
        .from('notebooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating notebook:', error);
        throw error;
      }
      
      console.log('Notebook updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Mutation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['notebook', data.id] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  return {
    updateNotebook: updateNotebook.mutate,
    isUpdating: updateNotebook.isPending,
  };
};

```

### Estructura del proyecto:

```carpetas
smartbase-notebooklm/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── architecture/
│   ├── n8n-integration/
│   │   └── debugging/
│   │       └── workflows/
│   │           └── wf-01/
│   │               └── 1.generate-notebook-details/
│   │                   ├── 3.extract-text-workflow/
│   │                   │   ├── 1.when-executed-by-another-workflow.json
│   │                   │   └── 2.generate-signed-url.json
│   │                   ├── 1.webhook-input.json
│   │                   ├── 2.if-false-branch.json
│   │                   ├── 3.extract-text-workflow.json
│   │                   ├── 4.1.structured-output-parser.json
│   │                   ├── 4.generate-title-description.json
│   │                   └── 5.respond-to-webhook.json
│   └── README.md
├── backend/
│   ├── n8n/
│   │   ├── Import_Insights_LM_Workflows.json
│   │   ├── InsightsLM___Chat.json
│   │   ├── InsightsLM___Extract_Text.json
│   │   ├── InsightsLM___Generate_Notebook_Details.json
│   │   ├── InsightsLM___Podcast_Generation.json
│   │   ├── InsightsLM___Process_Additional_Sources.json
│   │   └── InsightsLM___Upsert_to_Vector_Store.json
│   └── README.md
├── frontend/
│   ├── docs/
│   │   └── attachments/
│   │       ├── supabase-access-token.png
│   │       ├── supabase-account-preferences.png
│   │       ├── supabase-copy-paste-sql-query.png
│   │       ├── supabase-dashboard-check-tables.png
│   │       ├── supabase-migration-list.png
│   │       ├── supabase-migration-success.png
│   │       ├── supabase-migration-Y.png
│   │       ├── supabase-project-link-temp-folder.png
│   │       └── supabase-project-link.png
│   ├── prompts/
│   │   ├── asistente-dev-rag.md
│   │   └── webprodigies-ai-prompt-guide.md
│   ├── public/
│   │   ├── file-types/
│   │   │   ├── DOC (1).png
│   │   │   ├── MP3 (1).png
│   │   │   ├── PDF (1).svg
│   │   │   ├── TXT (1).png
│   │   │   └── WEB (1).svg
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   ├── scripts/
│   │   ├── check-functions.js
│   │   └── deploy-functions.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── AuthForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── chat/
│   │   │   │   ├── CitationButton.tsx
│   │   │   │   ├── MarkdownRenderer.tsx
│   │   │   │   ├── SourceContentViewer.tsx
│   │   │   │   └── SourceViewer.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardHeader.tsx
│   │   │   │   ├── EmptyDashboard.tsx
│   │   │   │   ├── NotebookCard.tsx
│   │   │   │   └── NotebookGrid.tsx
│   │   │   ├── notebook/
│   │   │   │   ├── AddSourcesDialog.tsx
│   │   │   │   ├── AudioPlayer.tsx
│   │   │   │   ├── ChatArea.tsx
│   │   │   │   ├── CopiedTextDialog.tsx
│   │   │   │   ├── MobileNotebookTabs.tsx
│   │   │   │   ├── MultipleWebsiteUrlsDialog.tsx
│   │   │   │   ├── NotebookHeader.tsx
│   │   │   │   ├── NoteEditor.tsx
│   │   │   │   ├── PasteTextDialog.tsx
│   │   │   │   ├── RenameSourceDialog.tsx
│   │   │   │   ├── SaveToNoteButton.tsx
│   │   │   │   ├── SourcesSidebar.tsx
│   │   │   │   ├── StudioSidebar.tsx
│   │   │   │   ├── WebsiteUrlInput.tsx
│   │   │   │   └── YouTubeUrlInput.tsx
│   │   │   └── ui/
│   │   │       ├── accordion.tsx
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── alert.tsx
│   │   │       ├── aspect-ratio.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── breadcrumb.tsx
│   │   │       ├── button.tsx
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── carousel.tsx
│   │   │       ├── chart.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── command.tsx
│   │   │       ├── context-menu.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── drawer.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── form.tsx
│   │   │       ├── hover-card.tsx
│   │   │       ├── input-otp.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── Logo.tsx
│   │   │       ├── menubar.tsx
│   │   │       ├── navigation-menu.tsx
│   │   │       ├── pagination.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── radio-group.tsx
│   │   │       ├── resizable.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── table.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── toast.tsx
│   │   │       ├── toaster.tsx
│   │   │       ├── toggle-group.tsx
│   │   │       ├── toggle.tsx
│   │   │       ├── tooltip.tsx
│   │   │       └── use-toast.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-toast.ts
│   │   │   ├── useAudioOverview.tsx
│   │   │   ├── useChatMessages.tsx
│   │   │   ├── useDocumentProcessing.tsx
│   │   │   ├── useFileUpload.tsx
│   │   │   ├── useIsDesktop.tsx
│   │   │   ├── useNotebookDelete.tsx
│   │   │   ├── useNotebookGeneration.tsx
│   │   │   ├── useNotebooks.tsx
│   │   │   ├── useNotebookUpdate.tsx
│   │   │   ├── useNotes.tsx
│   │   │   ├── useSourceDelete.tsx
│   │   │   ├── useSources.tsx
│   │   │   └── useSourceUpdate.tsx
│   │   ├── integrations/
│   │   │   └── supabase/
│   │   │       ├── client.ts
│   │   │       └── types.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Auth.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Index.tsx
│   │   │   ├── Notebook.tsx
│   │   │   └── NotFound.tsx
│   │   ├── repositories/
│   │   │   ├── interfaces/
│   │   │   │   └── auth.repository.interface.ts
│   │   │   └── supabase-auth.repository.ts
│   │   ├── services/
│   │   │   ├── auth.factory.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── authService.ts
│   │   │   └── logger.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   └── message.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── supabase/
│   │   ├── .temp/
│   │   │   ├── cli-latest
│   │   │   ├── gotrue-version
│   │   │   ├── pooler-url
│   │   │   ├── postgres-version
│   │   │   ├── project-ref
│   │   │   ├── rest-version
│   │   │   └── storage-version
│   │   ├── functions/
│   │   │   ├── audio-generation-callback/
│   │   │   │   └── index.ts
│   │   │   ├── generate-audio-overview/
│   │   │   │   └── index.ts
│   │   │   ├── generate-note-title/
│   │   │   │   └── index.ts
│   │   │   ├── generate-notebook-content/
│   │   │   │   └── index.ts
│   │   │   ├── process-additional-sources/
│   │   │   │   └── index.ts
│   │   │   ├── process-document/
│   │   │   │   └── index.ts
│   │   │   ├── process-document-callback/
│   │   │   │   └── index.ts
│   │   │   ├── refresh-audio-url/
│   │   │   │   └── index.ts
│   │   │   ├── send-chat-message/
│   │   │   │   └── index.ts
│   │   │   └── webhook-handler/
│   │   │       └── index.ts
│   │   ├── migrations/
│   │   │   └── 20250606152423_v0.1.sql
│   │   └── config.toml
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── .prettierrc
│   ├── bun.lockb
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── LICENSE
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── POSTGRES_SETUP.md
│   ├── README.md
│   ├── SUPABASE_SETUP.md
│   ├── tailwind.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
└── README.md
```

