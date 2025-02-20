export interface MachineLimits {
  maxFeedrate?: {
    x?: number;
    y?: number;
    z?: number;
    e?: number;
  };
  maxAcceleration?: {
    x?: number;
    y?: number;
    z?: number;
    e?: number;
    extruding?: number;
    retracting?: number;
    travel?: number;
  };
  maxJerk?: {
    x?: number;
    y?: number;
    z?: number;
    e?: number;
  };
}
