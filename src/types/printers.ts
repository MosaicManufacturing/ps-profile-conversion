export enum Firmware {
  FIRMWARE_BFB = 0,
  FIRMWARE_5D_REL = 1,
  FIRMWARE_5D_ABS = 2,
  FIRMWARE_5D_ABS_NO_RESET = 3,
  FIRMWARE_FLASHFORGE = 10,
  FIRMWARE_GRIFFIN = 11,
}

export enum ClearBufferCommand {
  G4P0 = 0, // G4 P0
  M400 = 1, // M400
}

export enum Direction {
  North = 0,
  South = 1,
  West = 2,
  East = 3,
}

export interface MachineSettings {
  name: string;
  extension: string;
  extruderCount: number;
  chromaExtruder?: number;
  nozzleDiameter: number[];
  filamentDiameter: number[];
  circular: boolean;
  bedSize: [number, number, number];
  originOffset: [number, number];
  bowdenTubeLength: number;
  firmwareType: Firmware;
  clearBufferCommand?: ClearBufferCommand;
  firmwarePurge: number;
  addComments?: boolean;
  firmwareRetraction: number;
  jogPauses: boolean;
  gpxProfile?: string;
  aStepsPerMM?: number;
  bStepsPerMM?: number;
  startSequence: string;
  endSequence: string;
  layerChangeSequence?: string;
  sideTransitionSequence?: string;
  preSideTransitionSequence?: string;
  postSideTransitionSequence?: string;
  pingOffTower: boolean;
  sideTransitionPurgeInPlace: boolean;
  sideTransitionCoordinates: [number, number];
  sideTransitionEdge: Direction;
  sideTransitionEdgeOffset: number;
}
