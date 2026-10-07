import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type * as THREE from "three";
import type { IAutoMovieExpressionTarget } from "./IAutoMovieExpressionTarget";
import type { IAutoMovieViewerFrame } from "./IAutoMovieViewerFrame";

/** Host-owned map or partial slot record; null and missing nodes are omitted during normalization. */
type BoneMapInput =
  | ReadonlyMap<AutoMovieHumanoidBone, THREE.Object3D | null | undefined>
  | Partial<Record<AutoMovieHumanoidBone, THREE.Object3D | null | undefined>>;

/**
 * Runtime adapter for an already-loaded `three.js`/VRM/glTF object.
 *
 * The loader stays with the host application. The viewer only needs a root
 * object, a normalized humanoid bone map, and optional expression/frame hooks
 * so {@link AutoMoviePlayer} can drive imported assets through the same path as
 * generated automovie models.
 *
 * @evidence requirements/external-inputs/adoption-modes-and-composition.md#external-adoption-direct-placement Adapts this already-loaded object by direct placement without decoding it.
 * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-direct-placement-boundary Implements the direct-placement boundary while preserving caller ownership.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Wraps imported caller state without transferring or overwriting its ownership.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Implements the runtime ownership side of isolated scene lowering.
 * @author Samchon
 */
export interface IAutoMovieImportedModelOptions {
  /**
   * Loaded scene or avatar root. Always wrapped in a viewer-owned group, so
   * pose roots never overwrite caller state (a GLTFLoader `gltf.scene`, a VRM0
   * root with three-vrm's baked π yaw).
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-scene-graph-preservation Preserves the caller's loaded scene graph under a viewer-owned wrapper.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-external-adoption-alternatives Implements direct adoption without rewriting the imported hierarchy.
   */
  object: THREE.Object3D;

  /**
   * Optional normalized humanoid bone map for pose playback.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Adds normalized semantic bone bindings without changing the source nodes.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-external-adoption-retarget-characterization Implements semantic enrichment as a separate adopted-rig mapping.
   */
  bones?: BoneMapInput;

  /**
   * Optional expression sinks such as a VRM expression manager.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-semantic-enrichment Adds expression controls as semantic bindings separate from source geometry.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-external-adoption-retarget-characterization Implements that adopted-rig enrichment without claiming source-native semantics.
   */
  expressionTargets?: readonly IAutoMovieExpressionTarget[];

  /**
   * Optional runtime flush after pose and expression are written.
   *
   * @evidence requirements/external-inputs/adoption-modes-and-composition.md#external-adoption-direct-placement Adapts this already-loaded object by direct placement without decoding it.
   * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-direct-placement-boundary Implements the direct-placement boundary while preserving caller ownership.
   */
  afterAutoMovieFrame?: (frame: IAutoMovieViewerFrame) => void;
}
