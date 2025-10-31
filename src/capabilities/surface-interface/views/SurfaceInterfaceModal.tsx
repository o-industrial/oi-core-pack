import { AziPanel, Modal, TabbedPanel, useMemo, WorkspaceManager } from '../../../.deps.ts';
import type { EaCInterfaceDetails, JSX, SurfaceInterfaceSettings } from '../../../.deps.ts';
import { SurfaceInterfaceGeneratedCodeTab } from './SurfaceInterfaceGeneratedCodeTab.tsx';
import { SurfaceInterfaceHandlerTab } from './SurfaceInterfaceHandlerTab.tsx';
import { SurfaceInterfaceImportsTab } from './SurfaceInterfaceImportsTab.tsx';
import { SurfaceInterfaceDataTab } from './SurfaceInterfaceDataTab.tsx';
import { SurfaceInterfacePageTab } from './SurfaceInterfacePageTab.tsx';
import { SurfaceInterfacePreviewTab } from './SurfaceInterfacePreviewTab.tsx';
import { useSurfaceInterfaceModalState } from './state/.exports.ts';

export type SurfaceInterfaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  interfaceLookup: string;
  surfaceLookup?: string;
  details: EaCInterfaceDetails;
  settings?: SurfaceInterfaceSettings;
  workspaceMgr: WorkspaceManager;
  onDetailsChange?: (next: Partial<EaCInterfaceDetails>) => void;
};

export type SurfaceInterfaceTabKey =
  | 'imports'
  | 'data'
  | 'handler'
  | 'page'
  | 'preview'
  | 'code';

const TAB_IMPORTS: SurfaceInterfaceTabKey = 'imports';
const TAB_DATA: SurfaceInterfaceTabKey = 'data';
const TAB_HANDLER: SurfaceInterfaceTabKey = 'handler';
const TAB_PAGE: SurfaceInterfaceTabKey = 'page';
const TAB_PREVIEW: SurfaceInterfaceTabKey = 'preview';
const TAB_CODE: SurfaceInterfaceTabKey = 'code';

type AziPanelProps = Parameters<typeof AziPanel>[0];
export function SurfaceInterfaceModal({
  isOpen,
  onClose,
  interfaceLookup,
  surfaceLookup,
  details,
  settings,
  workspaceMgr,
  onDetailsChange,
}: SurfaceInterfaceModalProps): JSX.Element | null {
  const {
    resolvedDetails,
    activeTab,
    setActiveTab,
    imports,
    onImportsChange,
    importsInvalid,
    setImportsInvalid,
    generatedSliceEntries,
    handler,
    page,
    preview,
    handleAccessModeChange,
    handleDataConnectionFeaturesChange,
    handleActionModeChange,
    interfaceAzi,
    renderAziMessage,
    debouncedExtraInputs,
  } = useSurfaceInterfaceModalState({
    isOpen,
    interfaceLookup,
    surfaceLookup,
    details,
    settings,
    workspaceMgr,
    onDetailsChange,
  });

  const {
    plan: handlerPlan,
    setPlan: setHandlerPlan,
    body: handlerBody,
    enabled: handlerEnabled,
    description: handlerDescription,
    messagesText: handlerMessagesText,
    fullCode: handlerFullCode,
    onBodyChange: handleHandlerBodyChange,
    onEnabledChange: handleHandlerEnabledChange,
    onDescriptionChange: handleHandlerDescriptionChange,
    onMessagesChange: handleHandlerMessagesChange,
  } = handler;

  const {
    prefix: pagePrefix,
    suffix: pageSuffix,
    body: pageBody,
    fullCode: pageFullCode,
    description: pageDescription,
    messagesText: pageMessagesText,
    onBodyChange: handlePageBodyChange,
    onDescriptionChange: handlePageDescriptionChange,
    onMessagesChange: handlePageMessagesChange,
  } = page;

  const { nonce: previewNonce, refresh: refreshPreview } = preview;

  const resolvedAziMgr = interfaceAzi as AziPanelProps['aziMgr'];
  const resolvedExtraInputs = debouncedExtraInputs as AziPanelProps['extraInputs'];

  const tabData = useMemo(
    () => [
      {
        key: TAB_IMPORTS,
        label: 'Imports',
        content: (
          <SurfaceInterfaceImportsTab
            imports={imports}
            onChange={onImportsChange}
            onValidityChange={setImportsInvalid}
          />
        ),
      },
      {
        key: TAB_DATA,
        label: 'Data',
        content: (
          <SurfaceInterfaceDataTab
            generatedSlices={generatedSliceEntries}
            onAccessModeChange={handleAccessModeChange}
            onDataConnectionChange={handleDataConnectionFeaturesChange}
            onActionModeChange={handleActionModeChange}
          />
        ),
      },
      {
        key: TAB_HANDLER,
        label: 'Handler',
        content: (
          <SurfaceInterfaceHandlerTab
            generatedSlices={generatedSliceEntries}
            steps={handlerPlan}
            onStepsChange={setHandlerPlan}
            onDataConnectionChange={handleDataConnectionFeaturesChange}
            handlerBody={handlerBody}
            handlerEnabled={handlerEnabled}
            handlerDescription={handlerDescription}
            handlerMessages={handlerMessagesText}
            onHandlerBodyChange={handleHandlerBodyChange}
            onHandlerEnabledChange={handleHandlerEnabledChange}
            onHandlerDescriptionChange={handleHandlerDescriptionChange}
            onHandlerMessagesChange={handleHandlerMessagesChange}
          />
        ),
      },
      {
        key: TAB_PAGE,
        label: 'Page',
        content: (
          <SurfaceInterfacePageTab
            imports={imports}
            prefix={pagePrefix}
            body={pageBody}
            suffix={pageSuffix}
            description={pageDescription}
            messages={pageMessagesText}
            onBodyChange={handlePageBodyChange}
            onDescriptionChange={handlePageDescriptionChange}
            onMessagesChange={handlePageMessagesChange}
          />
        ),
      },
      {
        key: TAB_PREVIEW,
        label: 'Preview',
        content: (
          <SurfaceInterfacePreviewTab
            interfaceLookup={interfaceLookup}
            surfaceLookup={surfaceLookup}
            previewNonce={previewNonce}
            onRefreshPreview={refreshPreview}
          />
        ),
      },
      {
        key: TAB_CODE,
        label: 'Code Preview',
        content: (
          <SurfaceInterfaceGeneratedCodeTab
            isActive={activeTab === TAB_CODE}
            interfaceLookup={interfaceLookup}
            imports={imports}
            handlerPlan={handlerPlan}
            generatedSlices={generatedSliceEntries}
            handlerCode={handlerFullCode}
            handlerDescription={handlerDescription}
            handlerMessages={handlerMessagesText}
            pageCode={pageFullCode}
            pageDescription={pageDescription}
            pageMessages={pageMessagesText}
          />
        ),
      },
    ],
    [
      generatedSliceEntries,
      handleAccessModeChange,
      handleActionModeChange,
      handleDataConnectionFeaturesChange,
      handleHandlerBodyChange,
      handleHandlerDescriptionChange,
      handleHandlerEnabledChange,
      handleHandlerMessagesChange,
      handlePageBodyChange,
      handlePageDescriptionChange,
      handlePageMessagesChange,
      handlerBody,
      handlerDescription,
      handlerEnabled,
      handlerFullCode,
      handlerMessagesText,
      handlerPlan,
      imports,
      interfaceLookup,
      onImportsChange,
      pageBody,
      pageDescription,
      pageFullCode,
      pageMessagesText,
      pagePrefix,
      pageSuffix,
      previewNonce,
      refreshPreview,
      setHandlerPlan,
      setImportsInvalid,
      surfaceLookup,
      activeTab,
    ],
  );

  if (!isOpen) return null;

  return (
    <Modal
      title={`Interface: ${resolvedDetails.Name ?? interfaceLookup}`}
      onClose={onClose}
      class='max-w-[1200px] border border-neutral-700 bg-neutral-900'
      style={{ height: '90vh' }}
    >
      <div
        class='flex h-full min-h-0 flex-row gap-4 bg-neutral-900'
        style={{ height: '75vh' }}
      >
        <div class='w-2/3 flex min-h-0 flex-col gap-3'>
          {importsInvalid && (
            <div class='rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300'>
              Resolve import validation issues to persist interface updates.
            </div>
          )}

          <TabbedPanel
            tabs={tabData}
            activeTab={activeTab}
            onTabChange={(key) => {
              if (
                key === TAB_IMPORTS ||
                key === TAB_DATA ||
                key === TAB_HANDLER ||
                key === TAB_PAGE ||
                key === TAB_PREVIEW ||
                key === TAB_CODE
              ) {
                setActiveTab(key as SurfaceInterfaceTabKey);
              }
            }}
            stickyTabs
            scrollableContent
            class='flex-1 min-h-0'
          />
        </div>

        <div class='w-1/3 min-h-0 border-l border-gray-700 pl-4 overflow-y-auto'>
          {interfaceAzi
            ? (
              <AziPanel
                workspaceMgr={workspaceMgr}
                aziMgr={resolvedAziMgr}
                renderMessage={renderAziMessage}
                extraInputs={resolvedExtraInputs}
              />
            )
            : (
              <div class='flex h-full items-center justify-center text-sm text-neutral-500'>
                Initializing interface collaborator...
              </div>
            )}
        </div>
      </div>
    </Modal>
  );
}
