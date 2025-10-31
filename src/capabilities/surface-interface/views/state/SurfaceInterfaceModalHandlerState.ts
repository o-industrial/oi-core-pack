import type { SurfaceInterfaceHandlerPlanStep } from '../SurfaceInterfaceHandlerCode.ts';

export type SurfaceInterfaceModalHandlerState = {
  body: string;
  enabled: boolean;
  description: string;
  messagesText: string;
  fullCode: string;
  plan: SurfaceInterfaceHandlerPlanStep[];
  setPlan: (steps: SurfaceInterfaceHandlerPlanStep[]) => void;
  onBodyChange: (next: string) => void;
  onEnabledChange: (next: boolean) => void;
  onDescriptionChange: (next: string) => void;
  onMessagesChange: (next: string) => void;
};
