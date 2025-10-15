import { OpenIndustrialAPIClient, Pack, type PackModuleBuilder } from './.deps.ts';
import { DataConnectionNodeCapabilityManager } from './capabilities/connection/DataConnectionNodeCapabilityManager.ts';
import { SimulatorNodeCapabilityManager } from './capabilities/simulator/SimulatorNodeCapabilityManager.ts';
import { SurfaceAgentNodeCapabilityManager } from './capabilities/surface-agent/SurfaceAgentNodeCapabilityManager.ts';
import { SurfaceConnectionNodeCapabilityManager } from './capabilities/surface-connection/SurfaceConnectionNodeCapabilityManager.ts';
// import { SurfaceSchemaNodeCapabilityManager } from './capabilities/surface-schema/SurfaceSchemaNodeCapabilityManager.ts';
import { SurfaceNodeCapabilityManager } from './capabilities/surface/SurfaceNodeCapabilityManager.ts';
import { SurfaceWarmQueryNodeCapabilityManager } from './capabilities/surface-warmquery/SurfaceWarmQueryNodeCapabilityManager.tsx';
import { SurfaceInterfaceNodeCapabilityManager } from './capabilities/surface-interface/SurfaceInterfaceNodeCapabilityManager.tsx';

export default Pack().Capabilities(async (ioc) => {
  const oiSvc = await ioc.Resolve<OpenIndustrialAPIClient>(ioc.Symbol('OpenIndustrialAPIClient'));

  return {
    surface: [
      // new SurfaceSchemaNodeCapabilityManager(oiSvc),
      new SurfaceAgentNodeCapabilityManager(oiSvc),
      new SurfaceConnectionNodeCapabilityManager(oiSvc),
      new SurfaceWarmQueryNodeCapabilityManager(oiSvc),
      new SurfaceInterfaceNodeCapabilityManager(oiSvc),
    ],
    workspace: [
      new SimulatorNodeCapabilityManager(oiSvc),
      new DataConnectionNodeCapabilityManager(oiSvc),
      new SurfaceNodeCapabilityManager(oiSvc),
    ],
  };
}) as PackModuleBuilder;
