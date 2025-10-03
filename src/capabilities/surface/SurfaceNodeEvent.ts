import { BaseNodeEvent } from '../../.deps.ts';

export type SurfaceNodeEvent = BaseNodeEvent & {
  Type: 'manage' | 'preview';
};
