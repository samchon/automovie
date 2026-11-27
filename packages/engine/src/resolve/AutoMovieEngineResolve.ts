import { applyChannelLimit as applyChannelLimitImplementation } from "./internal/applyChannelLimit";
import { applyLightOverride as applyLightOverrideImplementation } from "./internal/applyLightOverride";
import { bindProfile as bindProfileImplementation } from "./internal/bindProfile";
import { blendVec as blendVecImplementation } from "./internal/blendVec";
import { channelIsRotation as channelIsRotationImplementation } from "./internal/channelIsRotation";
import { channelKey as channelKeyImplementation } from "./internal/channelKey";
import { childrenIndex as childrenIndexImplementation } from "./internal/childrenIndex";
import { evaluateDrivenCurve as evaluateDrivenCurveImplementation } from "./internal/evaluateDrivenCurve";
import { formatLightPointer as formatLightPointerImplementation } from "./internal/formatLightPointer";
import { isLightProperty as isLightPropertyImplementation } from "./internal/isLightProperty";
import { orderValueDrivers as orderValueDriversImplementation } from "./internal/orderValueDrivers";
import { parseLightPointer as parseLightPointerImplementation } from "./internal/parseLightPointer";
import { placementChildNode as placementChildNodeImplementation } from "./internal/placementChildNode";
import { placementNodePrefix as placementNodePrefixImplementation } from "./internal/placementNodePrefix";
import { profileSemanticKeys as profileSemanticKeysImplementation } from "./internal/profileSemanticKeys";
import { readLocal as readLocalImplementation } from "./internal/readLocal";
import { readWorld as readWorldImplementation } from "./internal/readWorld";
import { recompose as recomposeImplementation } from "./internal/recompose";
import { validateInfluence as validateInfluenceImplementation } from "./internal/validateInfluence";

import { stepSpring as stepSpringImplementation } from "./internal/stepSpring";

import { type IAutoMovieIKDriver, type IAutoMovieTransform, type IAutoMovieNode, type IAutoMovieSpringState, type IAutoMovieLowerSkeletonNodes, type IAutoMovieDriver, type IAutoMovieSampledChannel, type IAutoMovieResolveOutput, type IAutoMovieResolveInput, type IAutoMovieLight, type IAutoMovieShotLightingInput, type IAutoMovieSceneToNodes, type IAutoMovieSpringDriver, type IAutoMovieSphere, type IAutoMovieClampOutcome, type IAutoMovieChannelLimit, type IAutoMovieLightOverride, type IAutoMovieBoundProfile, type IAutoMovieProfileApplication, type IAutoMovieVector3, type IAutoMovieChannel, type IAutoMovieDrivenCurve, type AutoMovieLightProperty, type IAutoMovieValueDriver, type IAutoMovieLightPointer, type IAutoMovieProfile } from "@automovie/interface";
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

  /**
   * Advance non-root spring joints with Verlet inertia, gravity, stiffness and
   * length projection, then sphere collision projection. Caller state and world
   * positions mutate in place; joint rotation/scale remain unchanged. Each
   * centre/ordered-chain tuple transports its own previous translation, and
   * collision projection can stretch the length projected earlier in the step.
   */
  export function stepSpring(d: IAutoMovieSpringDriver, world: Map<string, number[]>, state: IAutoMovieSpringState, dt: number, localById: Map<string, IAutoMovieTransform>, colliders?: readonly IAutoMovieSphere[]): void {
    stepSpringImplementation(d, world, state, dt, localById, colliders);
  }

  /**
   * Clamp one sampled channel component-wise and report crossed bounds with
   * original values. Null bounds and omitted tails leave directions free;
   * sparse/nonfinite supplied bounds and reversed intervals throw. This does not
   * normalize a quaternion or impose coupled anatomical ROM.
   */
  export function applyChannelLimit(value: number[], limit: IAutoMovieChannelLimit): IAutoMovieClampOutcome {
    return applyChannelLimitImplementation(value, limit);
  }

  /**
   * Reconstruct an admitted light kind from staged fields and present overrides,
   * preserving optional shadow policy and area extents. Unanimated nested values
   * remain borrowed; the direct helper returns a new light record while shot
   * resolution bypasses untouched lights.
   */
  export function applyLightOverride(light: IAutoMovieLight, override: IAutoMovieLightOverride): IAutoMovieLight {
    return applyLightOverrideImplementation(light, override);
  }

  /**
   * Bind every supported semantic node reference through an own boneMap entry and
   * optional placement prefix. Pointer channels retain their global addresses.
   * Mismatched profile ids and missing node mappings throw before a bound result
   * returns; unchanged nested bounds and curve data remain borrowed.
   */
  export function bindProfile(application: IAutoMovieProfileApplication): IAutoMovieBoundProfile {
    return bindProfileImplementation(application);
  }

  /** Linearly interpolate two vectors by influence `t`. */
  export function blendVec(a: IAutoMovieVector3, b: IAutoMovieVector3, t: number): IAutoMovieVector3 {
    return blendVecImplementation(a, b, t);
  }

  /**
   * Whether a channel carries a rotation (a quaternion), which the sample pass
   * must interpolate with slerp rather than component-wise lerp, the glTF rule
   * for LINEAR rotation tracks.
   */
  export function channelIsRotation(channel: IAutoMovieChannel): boolean {
    return channelIsRotationImplementation(channel);
  }

  /**
   * Canonical key for a channel. Node channels and pointer channels live in
   * disjoint namespaces (`node:…` vs `ptr:…`) so they can never alias even if a
   * pointer string happened to look like a node path.
   */
  export function channelKey(channel: IAutoMovieChannel): string {
    return channelKeyImplementation(channel);
  }

  /** Build the parent → children adjacency the recompose walk needs. */
  export function childrenIndex(nodes: IAutoMovieNode[]): Map<string, string[]> {
    return childrenIndexImplementation(nodes);
  }

  /**
   * Evaluate a nonlinear driven-key curve.
   *
   * The curve is validated here because it is authored data crossing the engine
   * boundary. Missing source values default to the first authored source point,
   * so nonlinear curves do not depend on the linear driver's `inRange`.
   */
  export function evaluateDrivenCurve(source: number | undefined, curve: IAutoMovieDrivenCurve): number {
    return evaluateDrivenCurveImplementation(source, curve);
  }

  /** The canonical pointer addressing one light's property. */
  export function formatLightPointer(light: string, property: AutoMovieLightProperty): string {
    return formatLightPointerImplementation(light, property);
  }

  /** Whether a string names an animatable light property. */
  export function isLightProperty(property: string): property is AutoMovieLightProperty {
    return isLightPropertyImplementation(property);
  }

  /** Order value drivers by channel dependencies with the existing DFS tie order. */
  export function orderValueDrivers(drivers: readonly IAutoMovieValueDriver[]): IAutoMovieValueDriver[] {
    return orderValueDriversImplementation(drivers);
  }

  /**
   * Parse canonical /lights/<id>/<property> addresses, returning null for wrong
   * shape, unsupported property, empty id or invalid/noncanonical RFC-6901
   * escaping. Light ids are stable scene identifiers; actual target existence is
   * checked by the consumer.
   */
  export function parseLightPointer(pointer: string): IAutoMovieLightPointer | null {
    return parseLightPointerImplementation(pointer);
  }

  /**
   * Name one bone or articulation child by the shared placement prefix followed
   * by its child id. Clips, bound profiles and viewer lookup use the same
   * concrete string.
   */
  export function placementChildNode(placement: string, child: string): string {
    return placementChildNodeImplementation(placement, child);
  }

  /**
   * Append slash to a placement id for scene lowering, profile binding, actor
   * clips and articulated-object channels. This is the shared literal naming law;
   * concrete graph admission still owns uniqueness.
   */
  export function placementNodePrefix(placement: string): string {
    return placementNodePrefixImplementation(placement);
  }

  /**
   * List every supported profile node reference in first-reference order,
   * deduplicated, so forgeProp can report all missing mappings. Pointer channels
   * are global and excluded; unknown driver kinds throw.
   */
  export function profileSemanticKeys(profile: IAutoMovieProfile): string[] {
    return profileSemanticKeysImplementation(profile);
  }

  /**
   * Return a borrowed required local transform from the supplied map, or throw
   * its diagnostic role and node id on absence. The default role preserves
   * world-driver descendant errors; springs supply their own role.
   */
  export function readLocal(localById: Map<string, IAutoMovieTransform>, id: string, role?: string): IAutoMovieTransform {
    return readLocalImplementation(localById, id, role);
  }

  /**
   * Return a borrowed required world matrix, or throw the supplied owner/role and
   * node id on absence. The default owner is world driver; springs use their
   * existing diagnostic owner.
   */
  export function readWorld(world: Map<string, number[]>, id: string, role: string, owner?: string): number[] {
    return readWorldImplementation(world, id, role, owner);
  }

  /**
   * Replace each descendant world matrix after its ancestor changes, using
   * borrowed admitted local transforms and acyclic child adjacency. Full matrix
   * products preserve composition shear; lookup failure can occur after earlier
   * descendants were updated.
   */
  export function recompose(id: string, world: Map<string, number[]>, localById: Map<string, IAutoMovieTransform>, childrenById: Map<string, string[]>): void {
    recomposeImplementation(id, world, localById, childrenById);
  }

  /** Require a finite solver influence within the closed unit interval. */
  export function validateInfluence(label: string, influence: number): void {
    validateInfluenceImplementation(label, influence);
  }
}
