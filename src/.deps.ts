import type { FunctionalComponent } from 'npm:preact@10.20.1';
export type { ComponentType, FunctionComponent, JSX } from 'npm:preact@10.20.1';

export type {
  EaCAgentDetails,
  EaCAzureDockerSimulatorDetails,
  EaCAzureIoTHubDataConnectionDetails,
  EaCCompositeSchemaDetails,
  EaCDataConnectionAsCode,
  EaCDataConnectionDetails,
  EaCFlowNodeMetadata,
  EaCInterfaceAsCode,
  EaCInterfaceCodeBlock,
  EaCInterfaceDetails,
  EaCInterfaceGeneratedDataSlice,
  EaCInterfacePageDataAction,
  EaCInterfacePageDataType,
  EaCRootSchemaDetails,
  EaCSchemaAsCode,
  EaCSchemaDetails,
  EaCSimulatorAsCode,
  EaCSimulatorDetails,
  EaCSurfaceAsCode,
  EaCSurfaceDetails,
  EverythingAsCodeOIWorkspace,
  MultiProtocolIngestOption,
  Position,
  SurfaceAgentSettings,
  SurfaceDataConnectionSettings,
  SurfaceInterfaceSettings,
  SurfaceSchemaSettings,
  SurfaceWarmQuerySettings,
} from 'jsr:@o-industrial/common@0.0.496/eac';
export { memo } from 'npm:preact@10.20.1/compat';
export {
  type Dispatch,
  type StateUpdater,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'npm:preact@10.20.1/hooks';

export type { NodeProps } from 'npm:reactflow@11.11.4';
export { Position as ReactPosition } from 'npm:reactflow@11.11.4';

export { merge, type NullableArrayOrObject } from 'jsr:@fathym/common@0.2.274';
export { z } from 'jsr:@fathym/common@0.2.274/third-party/zod';
import { classSet, IS_BROWSER } from 'jsr:@fathym/atomic@0.0.184';
export { classSet, IS_BROWSER };

export type { EaCEnterpriseDetails, EverythingAsCode } from 'jsr:@fathym/eac@0.2.131';

export {
  type EaCWarmQueryDetails,
  type EverythingAsCodeClouds,
} from 'jsr:@fathym/eac-azure@0.0.115';

export type { EverythingAsCodeLicensing } from 'jsr:@fathym/eac-licensing@0.0.58';

import type { CodeMirrorEditorProps as FathymCodeMirrorEditorProps } from 'jsr:@fathym/code-editor@0.0.35';

const FallbackCodeMirrorEditor: FunctionalComponent<FathymCodeMirrorEditorProps> = () => null;

let CodeMirrorEditor: FunctionalComponent<FathymCodeMirrorEditorProps> = FallbackCodeMirrorEditor;

if (IS_BROWSER) {
  const mod = await import('jsr:@fathym/code-editor@0.0.35');
  CodeMirrorEditor = mod.CodeMirrorEditor as FunctionalComponent<FathymCodeMirrorEditorProps>;
}

type ExtractCodeMirrorProps = FathymCodeMirrorEditorProps;

export { CodeMirrorEditor };
export type { ExtractCodeMirrorProps as CodeMirrorEditorProps };

export {
  Action,
  ActionStyleTypes,
  Badge,
  CopyInput,
  Input,
  NodeHandle,
  NodeStatTile,
  Select,
  ToggleCheckbox,
} from 'jsr:@o-industrial/atomic@0.0.39/atoms';
export {
  CloudConnectAzureForm,
  type CloudConnectAzureFormProps,
  EaCCreateSubscriptionForm,
  EaCManageCloudForm,
  EaCSelectSubscriptionForm,
  LicenseCard,
  MarketingHighlightCard,
  type MenuRoot,
  Modal,
  TabbedPanel,
} from 'jsr:@o-industrial/atomic@0.0.39/molecules';
export {
  EaCCreateSubscriptionController,
  type EaCCreateSubscriptionControllerProps,
} from 'jsr:@o-industrial/atomic@0.0.39/organisms';
export {
  CloseIcon,
  DeleteIcon,
  LoadingIcon,
  RedoIcon,
  SaveIcon,
  SearchIcon,
  SettingsIcon,
  TriggerMatchIcon,
  UndoIcon,
} from 'jsr:@o-industrial/atomic@0.0.39/icons';

export { ConnectionInfoPanel } from './capabilities/connection/views/ConnectionInfoPanel.tsx';
export { ConnectionManagementForm } from './capabilities/connection/views/ConnectionManagementForm.tsx';
export { SurfaceManagementForm } from './capabilities/surface/views/SurfaceManagementForm.tsx';
export { SurfaceConnectionManagementForm } from './capabilities/surface-connection/views/SurfaceConnectionManagementForm.tsx';
export { SimulatorManagementForm } from './capabilities/simulator/views/SimulatorManagementForm.tsx';
export { TemplateEditor } from './capabilities/simulator/views/TemplateEditor.tsx';
export { VariablesEditor } from './capabilities/simulator/views/VariablesEditor.tsx';
export { LinePreviewWithValue } from './capabilities/shared/LinePreviewWithValue.tsx';
export { parseTimeAgoString } from './capabilities/shared/utils/parseTimeAgoString.ts';

export {
  AziPanel,
  InspectorBase,
  SimulatorCard,
  SimulatorPackCard,
  SurfaceWarmQueryModal,
  WorkspaceNodeRendererBase,
} from 'jsr:@o-industrial/atomic@0.0.39/organisms';
// } from '../../open-industrial-atomic/src/organisms/.exports.ts';

export * from './runtime/modals/.exports.ts';

export { type NodeEventRouter, type NodePreset } from 'jsr:@o-industrial/common@0.0.496/flow';

export { interfacePageDataToSchema } from 'jsr:@o-industrial/common@0.0.496/utils';
export { shaHash } from 'jsr:@o-industrial/common@0.0.496/utils/client';

export { OpenIndustrialAPIClient } from 'jsr:@o-industrial/common@0.0.496/api';

export { IntentTypes, RuntimeStatsSchema } from 'jsr:@o-industrial/common@0.0.496/types';
export type {
  AccountProfile,
  IngestOption,
  TeamMembership,
} from 'jsr:@o-industrial/common@0.0.496/types';

export { Pack, PackModuleBuilder } from 'jsr:@o-industrial/common@0.0.496/fluent/packs';

export type {
  AziState,
  BaseNodeEvent,
  CapabilityValidationResult,
  EaCNodeCapabilityAsCode,
  EaCNodeCapabilityContext,
  EaCNodeCapabilityPatch,
  FlowGraphEdge,
  FlowGraphNode,
  FlowNodeData,
  InspectorCommonProps,
  SimulatorDefinition,
  SimulatorPackDefinition,
} from 'jsr:@o-industrial/common@0.0.496/flow';
export {
  EaCNodeCapabilityManager,
  SurfaceEventRouter,
  WorkspaceManager,
} from 'jsr:@o-industrial/common@0.0.496/flow';

export type { JSONSchema7 } from 'npm:jsonschema7@0.8.0';
