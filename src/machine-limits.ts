import type Profile from './profile';
import type { MachineLimits } from './types/machine-limits';

export const applyMachineLimits = (profile: Profile, machineLimits: MachineLimits) => {
  if (machineLimits.maxFeedrate) {
    if (machineLimits.maxFeedrate.x !== undefined) {
      profile.machineMaxFeedrateX = [machineLimits.maxFeedrate.x, machineLimits.maxFeedrate.x];
    }
    if (machineLimits.maxFeedrate.y !== undefined) {
      profile.machineMaxFeedrateY = [machineLimits.maxFeedrate.y, machineLimits.maxFeedrate.y];
    }
    if (machineLimits.maxFeedrate.z !== undefined) {
      profile.machineMaxFeedrateZ = [machineLimits.maxFeedrate.z, machineLimits.maxFeedrate.z];
    }
    if (machineLimits.maxFeedrate.e !== undefined) {
      profile.machineMaxFeedrateE = [machineLimits.maxFeedrate.e, machineLimits.maxFeedrate.e];
    }
  }
  if (machineLimits.maxAcceleration) {
    if (machineLimits.maxAcceleration.x !== undefined) {
      profile.machineMaxAccelerationX = [machineLimits.maxAcceleration.x, machineLimits.maxAcceleration.x];
    }
    if (machineLimits.maxAcceleration.y !== undefined) {
      profile.machineMaxAccelerationY = [machineLimits.maxAcceleration.y, machineLimits.maxAcceleration.y];
    }
    if (machineLimits.maxAcceleration.z !== undefined) {
      profile.machineMaxAccelerationZ = [machineLimits.maxAcceleration.z, machineLimits.maxAcceleration.z];
    }
    if (machineLimits.maxAcceleration.e !== undefined) {
      profile.machineMaxAccelerationE = [machineLimits.maxAcceleration.e, machineLimits.maxAcceleration.e];
    }
    if (machineLimits.maxAcceleration.extruding !== undefined) {
      profile.machineMaxAccelerationExtruding = [
        machineLimits.maxAcceleration.extruding,
        machineLimits.maxAcceleration.extruding,
      ];
    }
    if (machineLimits.maxAcceleration.retracting !== undefined) {
      profile.machineMaxAccelerationRetracting = [
        machineLimits.maxAcceleration.retracting,
        machineLimits.maxAcceleration.retracting,
      ];
    }
  }
  if (machineLimits.maxJerk) {
    if (machineLimits.maxJerk.x !== undefined) {
      profile.machineMaxJerkX = [machineLimits.maxJerk.x, machineLimits.maxJerk.x];
    }
    if (machineLimits.maxJerk.y !== undefined) {
      profile.machineMaxJerkY = [machineLimits.maxJerk.y, machineLimits.maxJerk.y];
    }
    if (machineLimits.maxJerk.z !== undefined) {
      profile.machineMaxJerkZ = [machineLimits.maxJerk.z, machineLimits.maxJerk.z];
    }
    if (machineLimits.maxJerk.e !== undefined) {
      profile.machineMaxJerkE = [machineLimits.maxJerk.e, machineLimits.maxJerk.e];
    }
  }
};
