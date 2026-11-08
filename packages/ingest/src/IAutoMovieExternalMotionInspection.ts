import type { IAutoMovieClip } from "@automovie/interface";

import { AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE } from "./AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE";
import type { IAutoMovieExternalMotionNodeInspection } from "./IAutoMovieExternalMotionNodeInspection";

/**
 * Animation facts normalized from one exact glTF, GLB or VRM byte revision.
 *
 * @evidence contracts/development/design.md#principled-representation Takes are rewritten from FLOAT accessors to node tracks with exact copied keyframes under one declared spatial interpretation, so motion data is reproducible from the bytes alone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `nodeIds` duplicates the node ids as a plain list because mapping authors and the inventory consume the list without the transforms.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal constrains typed producers to one declared convention; the inspector emits it and adoption checks it at runtime, while this erased interface alone cannot authenticate externally supplied transforms or their units.
 * @evidence contracts/development/common.md#meaningful-documentation The comments state that the path and length repeat for adoption checks, the length excludes sidecars, and how takes are ordered, named, timed and flagged as non-looping.
 */
export interface IAutoMovieExternalMotionInspection {
  /** Path whose suffix selected the decoder, repeated for adoption checks. */
  path: string;

  /** Length of the inspected container bytes, excluding sidecars. */
  byteLength: number;

  /** The fixed interpretation every node and track is read under. */
  interpretation: typeof AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE;

  /** Every node in source order with its hierarchy and rest basis. */
  nodes: IAutoMovieExternalMotionNodeInspection[];

  /** The node ids in source order, for an explicit source-rig mapping. */
  nodeIds: string[];

  /** One clip `clip_{index}` per animation in source order, its tracks in channel order with FLOAT keyframes copied exactly, duration the latest keyframe time, and `loop` false. */
  takes: IAutoMovieClip[];
}
