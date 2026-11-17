import type { IAutoMovieClip } from "../../core/IAutoMovieClip";
import type { AutoMovieGltfMotionInterpretationProfile } from "./AutoMovieGltfMotionInterpretationProfile";
import type { IAutoMovieExternalMotionNodeInspection } from "./IAutoMovieExternalMotionNodeInspection";

/**
 * Animation facts normalized from one exact glTF, GLB or VRM byte revision.
 * The ingest motion profile owns admission and returns detached mutable arrays.
 * Adoption requires the unmodified result; editing it invalidates that premise.
 *
 * @evidence contracts/development/design.md#principled-representation Takes are rewritten from FLOAT accessors to node tracks with exact copied keyframes under one declared spatial interpretation, so motion data is reproducible from the bytes alone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface nodeIds exposes source-order stable identities for mapping authors and inspection tests, while adoption consumes nodes with their transforms.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal constrains typed producers to one declared convention; the inspector emits it and adoption checks it at runtime, while this erased interface alone cannot authenticate externally supplied transforms or their units.
 * @evidence contracts/development/common.md#meaningful-documentation The comments state that the path and length repeat for adoption checks, the length excludes sidecars, and how takes are ordered, named, timed and flagged as non-looping.
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

  /** Nonempty list: one clip clip_{index} per animation in source order, tracks in channel order, FLOAT keyframes copied exactly, duration the latest keyframe time in seconds, and loop false. The motion profile refuses empty takes/channels, nonfinite data, nonincreasing or negative times, unsupported interpolation and duplicate target paths. */
  takes: IAutoMovieClip[];
}
