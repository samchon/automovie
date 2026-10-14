import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieExpressionTarget } from "./IAutoMovieExpressionTarget.js";
import type { IAutoMovieViewerFrame } from "./IAutoMovieViewerFrame.js";

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
 * @evidence contracts/common.md#principled-implementation Adapts an already-loaded root with optional semantic bone mapping and expression/frame hooks; createImportedModelObject wraps the root so pose application does not overwrite caller-authored root transforms.
 * @evidence contracts/common.md#clear-and-simple-design Loading and imported SDK ownership remain with the host, while the viewer consumes only Object3D and callback seams required for the common player path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or null bone entries are omitted by normalization rather than fabricated; all imported roots receive the same owned wrapper regardless of incidental runtime class.
 * @evidence contracts/common.md#meaningful-documentation States loaded-root wrapping, optional normalized bone input, expression sink ownership and post-pose/expression flushing order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The options interface performs no loading or bone normalization; the adapter owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Callback and root references are supplied inputs and define no shared loader or request equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Hosts retain loaded appearance and SDK lifetime ownership; the options record opens no I/O or GPU allocation.
 *
 * @author Samchon
 */
export interface IAutoMovieImportedModelOptions {
  /**
   * Loaded scene or avatar root. Always wrapped in a viewer-owned group, so
   * pose roots never overwrite caller state (a GLTFLoader `gltf.scene`, a VRM0
   * root with three-vrm's baked π yaw).
   */
  object: THREE.Object3D;

  /** Optional normalized humanoid bone map for pose playback. */
  bones?: BoneMapInput;

  /** Optional expression sinks such as a VRM expression manager. */
  expressionTargets?: readonly IAutoMovieExpressionTarget[];

  /**
   * Optional runtime flush after pose and expression are written.
   *
   * @evidence contracts/common.md#principled-implementation Receives the same sampled frame after AutoMoviePlayer applies pose and expression, allowing an imported runtime to advance its own dependent state in the shared frame clock.
   * @evidence contracts/common.md#clear-and-simple-design An optional frame callback exposes runtime integration without adding imported SDK update methods to the common model object.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Hosts supply the callback explicitly and receive elapsed/delta seconds; no foreign update loop or global clock is replaced.
   * @evidence contracts/common.md#meaningful-documentation States optionality and ordering after pose and expression writes; the frame type documents the sampled time and applied state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback contract chooses no imported-runtime processing strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Frame flushing is effectful and the player invokes it per update rather than sharing a cached result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host owns any runtime state retained or scheduled by its callback; the options type starts no task itself.
   */
  afterAutoMovieFrame?: (frame: IAutoMovieViewerFrame) => void;
}
