import type { IAutoMovieFurnishingPoint } from "./IAutoMovieFurnishingPoint";

/** Explicit room-frame position replacing a generated role's default placement. */
export interface IAutoMovieFurnishingOverride {
  /** Model origin in room-frame XZ metres; its underside stays on the floor. */
  readonly at: IAutoMovieFurnishingPoint;

  /** Turn about local +Y in degrees. The default is zero. */
  readonly heading?: number;
}
