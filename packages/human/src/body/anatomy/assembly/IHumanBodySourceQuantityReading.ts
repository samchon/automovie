import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/** Actual source-boundary quantity and its independent raw anatomical record. */
export interface IHumanBodySourceQuantityReading {
  /** Existing anatomical record path consumed by its source binding. */
  path: string;
  /** Owned raw target or acquisition record, never converted between kinds. */
  input: IAutoMovieHumanBodyAnatomicalVolume;
  /** Measured source boundary volume in mL, or null if acquisition comparison is undefined. */
  sourceMillilitres: number | null;
  /** Float32 source boundary volume in mL before posing; null for an undefined acquisition comparison. */
  sourceFloat32Millilitres?: number | null;
  /** Actual posed output boundary volume in mL at export precision; absent before final geometry is emitted. */
  finalFloat32Millilitres?: number | null;
  /** Source field coefficient for an achieved target; absent for raw observation. */
  coefficient?: number;
  /** Named source/acquisition availability or coarse authoring qualification. */
  qualification: string;
}
