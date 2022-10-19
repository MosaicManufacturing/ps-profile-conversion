export type DriveColorStrength = -1 | 0 | 1;

interface VariableTransitionsBasic {
  advancedMode: false;
  minTransitionLength: number;
  maxTransitionLength: number;
  driveColorStrengths: DriveColorStrength[];
}

interface VariableTransitionsAdvanced {
  advancedMode: true;
  transitionLengths: (number | null)[][];
}

export type VariableTransitions = VariableTransitionsBasic | VariableTransitionsAdvanced;

export interface TransitionTower {
  position: [number, number];
  size: [number, number];
}
