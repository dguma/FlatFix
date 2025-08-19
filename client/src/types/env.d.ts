// Minimal env typings so we can reference process.env without importing full Node types
// Extend as needed for additional custom vars.
interface ImportMetaEnv {
  readonly REACT_APP_API_URL?: string;
  readonly REACT_APP_GOOGLE_MAPS_KEY?: string;
}

interface ImportMeta { env: ImportMetaEnv }

declare namespace NodeJS {
  interface ProcessEnv extends ImportMetaEnv {}
  interface Process { env: ProcessEnv }
}

declare const process: NodeJS.Process;
