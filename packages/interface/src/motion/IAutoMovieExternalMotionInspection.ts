import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { AutoMovieGltfMotionInterpretationProfile } from "./AutoMovieGltfMotionInterpretationProfile";
import type { IAutoMovieExternalMotionNodeInspection } from "./IAutoMovieExternalMotionNodeInspection";

/**
 * Animation facts normalized from one exact glTF, GLB or VRM byte revision. The
 * ingest motion profile owns admission and returns detached mutable arrays.
 * Adoption requires the unmodified result; editing it invalidates that
 * premise.
 */
export interface IAutoMovieExternalMotionInspection {
  /** Path whose suffix selected the decoder, repeated for adoption checks. */
  path: string;

  /** Length of the inspected container bytes, excluding sidecars. */
  byteLength: number;

  /** The fixed interpretation every node and track is read under. */
  interpretation: AutoMovieGltfMotionInterpretationProfile;

  /** Every node in source order with its hierarchy and rest basis. */
  nodes: IAutoMovieExternalMotionNodeInspection[];

  /** The node ids in source order, for an explicit source-rig mapping. */
  nodeIds: string[];

  /**
   * Nonempty list: one clip clip_{index} per animation in source order, tracks
   * in channel order, FLOAT keyframes copied exactly, duration the latest
   * keyframe time in seconds, and loop false. The motion profile refuses empty
   * takes/channels, nonfinite data, nonincreasing or negative times,
   * unsupported interpolation and duplicate target paths.
   */
  takes: IAutoMovieClip[];
}
