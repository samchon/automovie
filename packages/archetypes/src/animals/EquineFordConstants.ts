import type { IAutoMovieVector3 } from "@automovie/interface";

/** The support frame and sampling parameters of the equine ford clearance check. */
export namespace EquineFordConstants {
/** One-sided difference, seconds, for the offset rates at a cut. */
export const STEP: number = 1e-5;

/** World up. */
export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** A limb or trunk bar's solid, metres. */
export interface IBar {
  /** Whether its ends are rounded. */
  capsule: boolean;
  /** Its radius. */
  radius: number;
  /** Its length along its axis. */
  height: number;
}

/** Stroke phases sampled per cycle when the stroke's lowest sole is read. */
export const SWEEP: number = 96;
}
