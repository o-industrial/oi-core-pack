export type SurfaceInterfaceModalPageState = {
  prefix: string;
  suffix: string;
  body: string;
  fullCode: string;
  description: string;
  messagesText: string;
  onBodyChange: (next: string) => void;
  onDescriptionChange: (next: string) => void;
  onMessagesChange: (next: string) => void;
};
