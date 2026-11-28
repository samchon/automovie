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
   * Apply CCD or FABRIK to a world-space chain and update the caller's
   * matrices.
   *
   * Provide at least two admitted chain nodes with positive link lengths. An
   * omitted iteration budget uses 10, and a residual within 1e-6 metres can
   * stop the solve early. Position and shortest-arc rotation updates use the
   * requested influence. The tip subtree is recomposed afterward.
   *
   * The solve uses geometric reach and authored chain order. Callers apply any
   * pole constraints or anatomical limits separately. A failure can follow
   * earlier writes.
   */
  export function applyIterativeIK(
    d: IAutoMovieIKDriver,
    world: Map<string, number[]>,
    localById: Map<string, IAutoMovieTransform>,
    childrenById: Map<string, string[]>,
  ): void {
    applyIterativeIKImplementation(d, world, localById, childrenById);
  }

  /**
   * Compose a fresh map of node world matrices from parent-local transforms.
   *
   * An optional local override replaces the corresponding rest transform. Nodes
   * can be supplied in any order. Duplicate identifiers, missing parents and
   * parent cycles throw. Matrix composition preserves shear from nested scales
   * and rotations.
   */
  export function composeScene(
    nodes: IAutoMovieNode[],
    localOverrides?: Map<string, IAutoMovieTransform>,
  ): Map<string, number[]> {
    return composeSceneImplementation(nodes, localOverrides);
  }

  /**
   * Create an empty mutable spring state for one sequence of frame reads.
   *
   * Keep the returned state with its caller. It stores previous joint
   * positions, moving-centre history and the joints updated by the spring
   * pass.
   */
  export function createSpringState(): IAutoMovieSpringState {
    return createSpringStateImplementation();
  }

  /**
   * Create rest-pose nodes for an admitted skeleton, under one synthetic
   * identity group.
   *
   * The optional prefix qualifies root, bone and parent identifiers. The group
   * can be parented at the supplied placement. Bone rest translation and
   * rotation are borrowed, and each output transform gets a fresh scale.
   */
  export function lowerSkeletonNodes(
    props: IAutoMovieLowerSkeletonNodes.IProps,
  ): IAutoMovieNode[] {
    return lowerSkeletonNodesImplementation(props);
  }

  /**
   * Apply copy and driven descriptors to the sampled channel map in dependency
   * order.
   *
   * The function updates the supplied samples in place. Other descriptors are
   * returned in their original order for later passes. Dependency cycles throw.
   * A driven descriptor with no curve uses its linear input and output ranges.
   */
  export function resolveDrivers(
    drivers: IAutoMovieDriver[],
    sampled: Map<string, IAutoMovieSampledChannel>,
    nodesById: Map<string, IAutoMovieNode>,
  ): IAutoMovieDriver[] {
    return resolveDriversImplementation(drivers, sampled, nodesById);
  }

  /**
   * Resolve a scene frame from its staged nodes, clips, profiles, limits and
   * drivers.
   *
   * Sample track values, bind profile references, evaluate value drivers and
   * apply channel limits before composing world matrices. Profile limits and
   * drivers precede direct inputs. World drivers then update matrices, and
   * springs advance only with supplied state. A later failure can follow
   * earlier state writes.
   */
  export function resolveFrame(
    input: IAutoMovieResolveInput,
  ): IAutoMovieResolveOutput {
    return resolveFrameImplementation(input);
  }

  /**
   * Apply sampled shot-light channels to staged lights in staging order.
   *
   * Each track must name a canonical pointer to an existing light and an
   * animatable property carried by its light kind. Untouched lights are
   * returned by reference. Reconstructed lights retain unanimated fields. Admit
   * shots before resolving their producer uniqueness.
   */
  export function resolveShotLighting(
    input: IAutoMovieShotLightingInput,
  ): IAutoMovieLight[] {
    return resolveShotLightingImplementation(input);
  }

  /**
   * Apply aim, parent and supported analytic or iterative IK descriptors to
   * world matrices.
   *
   * Producer order determines which updates later drivers read. Changed
   * descendants are recomposed in the supplied child index. Springs and
   * unsupported descriptors remain deferred. Aim and IK expect admitted finite,
   * nondegenerate geometry and use solver tolerances.
   */
  export function resolveWorldDrivers(
    drivers: IAutoMovieDriver[],
    world: Map<string, number[]>,
    localById: Map<string, IAutoMovieTransform>,
    childrenById: Map<string, string[]>,
  ): IAutoMovieDriver[] {
    return resolveWorldDriversImplementation(
      drivers,
      world,
      localById,
      childrenById,
    );
  }

  /**
   * Lower staged placements, cameras, lights and registered articulation
   * subtrees to resolver nodes.
   *
   * Placements retain their rest transform. A registered model and prop
   * specification cannot both supply the same placement. Missing entries throw
   * when registries are supplied, unless partial models are enabled. Without
   * registries, placements are emitted without model subtrees.
   *
   * The composition pass separately checks the resulting parent graph.
   */
  export function sceneToNodes(
    props: IAutoMovieSceneToNodes.IProps,
  ): IAutoMovieNode[] {
    return sceneToNodesImplementation(props);
  }

  /**
   * Advance a spring chain by one supplied time step using caller-owned world
   * matrices and history.
   *
   * The root stays pinned. Later joints use Verlet inertia, gravity, stiffness
   * and length projection, followed by any sphere collision projection. Joint
   * rotations and scales remain in the world matrices. A collision can stretch
   * a link after its length was projected.
   *
   * History follows the declared moving centre and ordered chain.
   */
  export function stepSpring(
    d: IAutoMovieSpringDriver,
    world: Map<string, number[]>,
    state: IAutoMovieSpringState,
    dt: number,
    localById: Map<string, IAutoMovieTransform>,
    colliders?: readonly IAutoMovieSphere[],
  ): void {
    stepSpringImplementation(d, world, state, dt, localById, colliders);
  }

  /**
   * Clamp a sampled channel component by component and report each violated
   * bound.
   *
   * A null bound or omitted trailing bound leaves its side free. A missing
   * slot, nonfinite bound, bound beyond the value width, or minimum above its
   * maximum throws. The result is a fresh values array with violations in
   * component order.
   */
  export function applyChannelLimit(
    value: number[],
    limit: IAutoMovieChannelLimit,
  ): IAutoMovieClampOutcome {
    return applyChannelLimitImplementation(value, limit);
  }

  /**
   * Construct a light record of the staged kind with the supplied overrides.
   *
   * Apply only the fields that kind carries. Preserve unanimated nested fields
   * and any staged shadow policy. The returned light is a new wrapper.
   */
  export function applyLightOverride(
    light: IAutoMovieLight,
    override: IAutoMovieLightOverride,
  ): IAutoMovieLight {
    return applyLightOverrideImplementation(light, override);
  }

  /**
   * Bind profile limits and drivers to concrete scene node IDs.
   *
   * A binding must name the applied profile and map each semantic node through
   * its own boneMap entries. An optional prefix qualifies mapped IDs. Pointer
   * channels retain their global addresses, and unchanged bound and curve data
   * are borrowed.
   */
  export function bindProfile(
    application: IAutoMovieProfileApplication,
  ): IAutoMovieBoundProfile {
    return bindProfileImplementation(application);
  }

  /**
   * Linearly blend two vectors by the supplied influence.
   *
   * Each coordinate ordinarily adds the first value to the scaled endpoint
   * difference. For progress from zero through one, a difference that
   * overflows between finite endpoints uses their weighted sum instead.
   */
  export function blendVec(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    t: number,
  ): IAutoMovieVector3 {
    return blendVecImplementation(a, b, t);
  }

  /**
   * Decide whether an admitted channel carries quaternion rotation values.
   *
   * A node rotation path or a pointer channel typed as quaternion is
   * rotational. Invalid channel descriptions throw.
   */
  export function channelIsRotation(channel: IAutoMovieChannel): boolean {
    return channelIsRotationImplementation(channel);
  }

  /**
   * Build a canonical sample-map key for an admitted channel.
   *
   * Node targets use the node identifier and transform path. Pointer targets
   * use their pointer text. The two kinds have distinct prefixes.
   */
  export function channelKey(channel: IAutoMovieChannel): string {
    return channelKeyImplementation(channel);
  }

  /**
   * Build a parent-to-children index from the supplied nodes.
   *
   * Roots contribute no parent entry. Child IDs are appended in input order.
   * Use graph admission separately for duplicate IDs, missing parents and
   * cycles.
   */
  export function childrenIndex(
    nodes: IAutoMovieNode[],
  ): Map<string, string[]> {
    return childrenIndexImplementation(nodes);
  }

  /**
   * Evaluate a piecewise-linear driven-key curve.
   *
   * Supply a nonempty curve with strictly increasing finite source positions
   * and finite outputs. An absent source uses the first key. The endpoints hold
   * outside the authored interval. Interior samples use linear interpolation.
   */
  export function evaluateDrivenCurve(
    source: number | undefined,
    curve: IAutoMovieDrivenCurve,
  ): number {
    return evaluateDrivenCurveImplementation(source, curve);
  }

  /**
   * Format the animation pointer for a light's property.
   *
   * Escape the ID as one RFC 6901 token and append the typed property name.
   * Supply a nonempty light ID if the pointer must round-trip through the
   * parser.
   */
  export function formatLightPointer(
    light: string,
    property: AutoMovieLightProperty,
  ): string {
    return formatLightPointerImplementation(light, property);
  }

  /** Check whether a string is a declared animatable light property. */
  export function isLightProperty(
    property: string,
  ): property is AutoMovieLightProperty {
    return isLightPropertyImplementation(property);
  }

  /**
   * Order value drivers so each producer precedes the drivers that read its
   * channels.
   *
   * Independent entries use the existing depth-first input order. A dependency
   * cycle throws. The result is a new list of the original descriptors.
   */
  export function orderValueDrivers(
    drivers: readonly IAutoMovieValueDriver[],
  ): IAutoMovieValueDriver[] {
    return orderValueDriversImplementation(drivers);
  }

  /**
   * Read a canonical light property pointer, or return null for a malformed
   * address.
   *
   * The light ID must be nonempty and the property must be animatable. The
   * parser checks canonical RFC 6901 escaping. Callers resolve the resulting ID
   * against their staged lights.
   */
  export function parseLightPointer(
    pointer: string,
  ): IAutoMovieLightPointer | null {
    return parseLightPointerImplementation(pointer);
  }

  /**
   * Join a placement ID and a local child ID into the scene node name used by
   * scene lowering and animation.
   */
  export function placementChildNode(placement: string, child: string): string {
    return placementChildNodeImplementation(placement, child);
  }

  /**
   * Return the shared node-name prefix for children of a placement.
   *
   * Append one slash to the supplied placement ID. Scene lowering, profile
   * binding and clip channels use this spelling.
   */
  export function placementNodePrefix(placement: string): string {
    return placementNodePrefixImplementation(placement);
  }

  /**
   * List the semantic node keys required to bind a profile.
   *
   * Preserve their first occurrence while deduplicating. Ignore global pointer
   * channels. Unsupported driver kinds throw.
   */
  export function profileSemanticKeys(profile: IAutoMovieProfile): string[] {
    return profileSemanticKeysImplementation(profile);
  }

  /**
   * Read a required local transform by node ID from the supplied map.
   *
   * The returned transform is borrowed. If absent, the error names the ID and
   * diagnostic role. The default role describes a world-driver descendant.
   */
  export function readLocal(
    localById: Map<string, IAutoMovieTransform>,
    id: string,
    role?: string,
  ): IAutoMovieTransform {
    return readLocalImplementation(localById, id, role);
  }

  /**
   * Read a required world matrix by node ID from the supplied map.
   *
   * The returned matrix is borrowed. If absent, the error names the ID, role
   * and owner. The owner defaults to world driver.
   */
  export function readWorld(
    world: Map<string, number[]>,
    id: string,
    role: string,
    owner?: string,
  ): number[] {
    return readWorldImplementation(world, id, role, owner);
  }

  /**
   * Rebuild descendants after an ancestor's world matrix changes.
   *
   * Use admitted local transforms and acyclic child lists. The supplied world
   * map is updated in place, and the ancestor entry is retained. A missing
   * descendant transform can throw after other descendants were updated.
   */
  export function recompose(
    id: string,
    world: Map<string, number[]>,
    localById: Map<string, IAutoMovieTransform>,
    childrenById: Map<string, string[]>,
  ): void {
    recomposeImplementation(id, world, localById, childrenById);
  }

  /**
   * Check the numeric range of a world-driver influence.
   *
   * Zero and one are admitted. Nonfinite values and values outside that
   * interval throw with the supplied driver label.
   */
  export function validateInfluence(label: string, influence: number): void {
    validateInfluenceImplementation(label, influence);
  }
}
