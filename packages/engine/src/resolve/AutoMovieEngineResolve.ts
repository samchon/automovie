import { type IAutoMovieIKDriver, type IAutoMovieTransform, type IAutoMovieNode, type IAutoMovieSpringState, type IAutoMovieLowerSkeletonNodes, type IAutoMovieDriver, type IAutoMovieSampledChannel, type IAutoMovieResolveOutput, type IAutoMovieResolveInput, type IAutoMovieLight, type IAutoMovieShotLightingInput, type IAutoMovieSceneToNodes } from "@automovie/interface";
import { applyIterativeIK as applyIterativeIKImplementation } from "./internal/applyIterativeIK";
import { composeScene as composeSceneImplementation } from "./internal/composeScene";
import { createSpringState as createSpringStateImplementation } from "./internal/createSpringState";
import { lowerSkeletonNodes as lowerSkeletonNodesImplementation } from "./internal/lowerSkeletonNodes";
import { resolveDrivers as resolveDriversImplementation } from "./internal/resolveDrivers";
import { resolveFrame as resolveFrameImplementation } from "./internal/resolveFrame";
import { resolveShotLighting as resolveShotLightingImplementation } from "./internal/resolveShotLighting";
import { resolveWorldDrivers as resolveWorldDriversImplementation } from "./internal/resolveWorldDrivers";
import { sceneToNodes as sceneToNodesImplementation } from "./internal/sceneToNodes";

/** Public operations for Auto Movie Engine Resolve. */
export namespace AutoMovieEngineResolve {
  /**
   * Solve an admitted world-space chain by CCD or FABRIK with a positive
   * safe-integer iteration budget, default 10, and a 1e-6 metre residual
   * early-out. Blend positions and shortest-arc rotations by influence, then
   * recompose the tip subtree. Iterative solvers ignore pole and apply no
   * anatomical ROM; failed later writes may follow earlier mutations.
   */
  export function applyIterativeIK(d: IAutoMovieIKDriver, world: Map<string, number[]>, localById: Map<string, IAutoMovieTransform>, childrenById: Map<string, string[]>): void {
    applyIterativeIKImplementation(d, world, localById, childrenById);
  }

  /**
   * The COMPOSE pass: turn a flat list of nodes (each with a parent-local TRS)
   * into a world matrix per node, walking parent-before-child.
   *
   * `localOverrides` carries the transforms the sample/constrain passes produced
   * for animated nodes; a node absent from the map keeps its rest-pose
   * {@link IAutoMovieNode} transform. Resolution is memoized and parent-driven, so
   * the input list may be in any order. A child seen before its parent pulls the
   * parent in on demand.
   *
   * Composition is a real matrix product (via {@link Matrix4}) rather than TRS
   * concatenation, so a non-uniformly scaled parent rotating a child shears
   * correctly instead of approximately.
   */
  export function composeScene(nodes: IAutoMovieNode[], localOverrides?: Map<string, IAutoMovieTransform>): Map<string, number[]> {
    return composeSceneImplementation(nodes, localOverrides);
  }

  /** A fresh, empty spring state. */
  export function createSpringState(): IAutoMovieSpringState {
    return createSpringStateImplementation();
  }

  /**
   * Lower an admitted skeleton into a fresh identity group root and bone rest
   * nodes. Prefixes concatenate onto node/parent ids and rootParent seats the
   * synthetic root under a placement. Root records are independent; bone rest
   * translation/rotation are borrowed and bone scales are fresh unit vectors.
   */
  export function lowerSkeletonNodes(props: IAutoMovieLowerSkeletonNodes.IProps): IAutoMovieNode[] {
    return lowerSkeletonNodesImplementation(props);
  }

  /**
   * Evaluate copy and driven channels in stable dependency order, mutating
   * samples before constraints. Return world/stateful descriptors in original
   * order. Unknown kinds and reciprocal dependencies throw; a null/absent curve
   * selects linear range mapping.
   */
  export function resolveDrivers(drivers: IAutoMovieDriver[], sampled: Map<string, IAutoMovieSampledChannel>, nodesById: Map<string, IAutoMovieNode>): IAutoMovieDriver[] {
    return resolveDriversImplementation(drivers, sampled, nodesById);
  }

  /**
   * Resolve a numerical frame by sampling, profile binding, value driving,
   * ordered clamping, matrix composition and world driving. Optional explicit
   * spring state advances afterward; otherwise springs remain deferred. Results
   * and state ownership are explicit, and a later failure is not rollback of
   * earlier world/state effects.
   */
  export function resolveFrame(input: IAutoMovieResolveInput): IAutoMovieResolveOutput {
    return resolveFrameImplementation(input);
  }

  /**
   * Sample admitted shot light clips and apply their canonical light-pointer
   * channels to staged lights. Output preserves staging order and untouched light
   * identity; touched light wrappers borrow unanimated fields.
   * Missing/unsupported targets throw and shot admission forbids repeated
   * properties across the clip list.
   */
  export function resolveShotLighting(input: IAutoMovieShotLightingInput): IAutoMovieLight[] {
    return resolveShotLightingImplementation(input);
  }

  /**
   * Apply world-space aim, parent and analytic/iterative IK in producer order,
   * updating matrices and recomposing affected descendants. Springs and malformed
   * two-bone chains remain deferred. Geometry must be admitted
   * finite/nondegenerate and TRS-decomposable; partial influence and epsilon
   * reach shells are numerical policies rather than anatomical ROM guarantees.
   */
  export function resolveWorldDrivers(drivers: IAutoMovieDriver[], world: Map<string, number[]>, localById: Map<string, IAutoMovieTransform>, childrenById: Map<string, string[]>): IAutoMovieDriver[] {
    return resolveWorldDriversImplementation(drivers, world, localById, childrenById);
  }

  /**
   * Lower scene rest placements, cameras/lights and registered
   * skeleton/prop-articulation subtrees into general nodes. Supplied registries
   * must resolve each required model and may not conflict; explicit partial-model
   * callers retain placements while omitting unregistered subtrees. composeScene
   * separately rejects duplicate ids, missing parents and cycles.
   */
  export function sceneToNodes(props: IAutoMovieSceneToNodes.IProps): IAutoMovieNode[] {
    return sceneToNodesImplementation(props);
  }
}
