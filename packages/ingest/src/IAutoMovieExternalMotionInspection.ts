import { AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE } from "./AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE";
import type { IAutoMovieExternalMotionNodeInspection } from "./IAutoMovieExternalMotionNodeInspection";
import type { IAutoMovieClip } from "@automovie/interface";

/**
 * Animation facts normalized from one exact glTF, GLB or VRM byte revision.
 *
 * @evidence contracts/common.md#principled-implementation Takes are rewritten from FLOAT accessors to node tracks with exact copied keyframes under one declared spatial interpretation, so motion data is reproducible from the bytes alone.
 * @evidence contracts/common.md#clear-and-simple-design `nodeIds` duplicates the node ids as a plain list because mapping authors and the inventory consume the list without the transforms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The literal constrains typed producers to one declared convention; the inspector emits it and adoption checks it at runtime, while this erased interface alone cannot authenticate externally supplied transforms or their units.
 * @evidence contracts/common.md#meaningful-documentation The comments state that the path and length repeat for adoption checks, the length excludes sidecars, and how takes are ordered, named, timed and flagged as non-looping.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The motion record is a result type with no code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Motion facts are a data shape; the inspector shares decoded accessors while building them.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retained size is proportional to nodes and keyframe values, owned by the inspection result; no handle or task.
 * @author Samchon
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
