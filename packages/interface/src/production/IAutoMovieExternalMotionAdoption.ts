import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieExternalMotionAdoptionMode } from "./IAutoMovieExternalMotionAdoptionMode";
import type { IAutoMovieExternalMotionMappingEntry } from "./IAutoMovieExternalMotionMappingEntry";

/**
 * User-owned decision to adopt one external motion take in one shot.
 *
 * This retains production intent; the production conversion host is retired.
 * Ingest's executable adoption API uses its own separate local contract and
 * does not automatically consume this record.
 */
export interface IAutoMovieExternalMotionAdoption {
  /** Stable adoption identity. */
  id: string;

  /** Manifest-owned external motion asset path. */
  asset: string;

  /** Take id from the asset's inspected motion record. */
  take: string;

  /** Shot contract in which the adoption is available. */
  shot: string;

  /** Actor participant that performs the adopted take. */
  actor: string;

  /** Stable clip id exposed to the shot source after successful adoption. */
  clip: string;

  /** Authored semantic source rig reconciled with the byte-inspected basis. */
  sourceRig: IAutoMovieSkeleton;

  /** Explicit source-node to target-semantic-bone mappings. */
  mapping: IAutoMovieExternalMotionMappingEntry[];

  /** Explicit native or humanoid-retarget adoption decision. */
  mode: IAutoMovieExternalMotionAdoptionMode;
}
