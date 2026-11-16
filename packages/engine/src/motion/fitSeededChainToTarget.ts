import type {
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { preparePoseResolution } from "../kinematics/preparePoseResolution";
import type { IAutoMovieSeededChainFit } from "./IAutoMovieSeededChainFit";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { fitChainBend } from "./fitChainBend";
import { orientChainEffector } from "./orientChainEffector";
import { prepareChainFit } from "./prepareChainFit";
import { resolveBoneMap } from "./resolveBoneMap";
import { resolvePreparedChainFrames } from "./resolvePreparedChainFrames";

/**
 * Fit a reachable two-bone chain to a model-frame target under the rig's effective ROM, retaining authored non-chain joints. A deterministic finite bend-plane search scores clamped FK and keeps the source bend-stage pose unless its 1e-7-metre residual bucket improves or equal-bucket continuity improves toward an explicit prior pose; it is a bounded search, not a global-optimum guarantee.
 *
 * For a hinged mid joint (an elbow or a knee, whose abduction is immobile) the swivel parameterisation of Tolani, Goswami and Badler (2000) comes first and wins whenever it reaches: the hinge angle follows from the span and the swivel about the root-to-target axis is swept for the least range-of-motion overshoot and then the least continuous cost of effector-rotation error, swing from the hint's side and turn from the `referencePose` (`fitHingedChainCandidate`), because a free-swing candidate turns the hinge about the plane normal and the clamp of its abduction moves the effector. Otherwise, and for other chains, the bend hint's plane and then the 32-plane sweep follow, the first exact one winning. When nothing reaches, the least clamped residual is returned, so an unreachable target leaves the effector on the reachable shell, not a pretended reach.
 *
 * A hinged chain's answer comes with its seed, the branch and swivel its candidate was chosen at, which a fit of a nearby target continues from (`near`, `IAutoMovieSwivelNear`): that fit refines the seed alone instead of sweeping. The seed is null when another candidate is the answer.
 *
 * With `effectorRotation`, a mid bone that declares a distal twist (a forearm) first takes the twist share of the requested rotation about its own length (swing-twist decomposition), clamped to its range, and the effector the remaining swing, so pronation and supination are the forearm's and the wrist keeps its place.
 *
 * Failed bend preparation or analytic admission keeps the source pose at that stage. A requested rotation still runs the orientation pass and may change the lower twist and effector articulation.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Prepares actual chain frames, solves analytic two-bone candidates, clamps upper/lower joints to rig ROM and measures their actual effector; residual buckets rank first, then squared sign-insensitive quaternion geodesic distance to the prior pose and finally exact residual.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The bend search (`fitChainBend`) and the effector's orientation (`orientChainEffector`), composed here, while preparation, analytic candidate solve and fast candidate FK have single owners; this split exposes the geometry shared by all bend candidates.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Failed bend admission preserves only the bend-stage source pose; requested orientation still applies afterward. No ideal target measurement replaces post-clamp FK. A 32-angle sweep and ten local halvings bound the heuristic, with 1e-12 continuity and 1e-6 normal-degeneracy thresholds.
 * @evidence contracts/development/common.md#meaningful-documentation States model-metre target, unchanged joints, residual-bucket ranking, prior-pose tie meaning and the bounded-search limitation without claiming every unreachable pin can be solved.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation and authored/reference FK scale with rig/joints; fitChainBend owns the unchanged bounded bend/swivel search and its constant-size candidate FK, while candidate pose copies scale with authored joints. The prepared companion permits several targets of one source to share the invariant work; no speedup has been measured here.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The one-shot fit uses the same prepared companion as repeated targets, with one owner for search and ranking; changed parent/source/reference/callback dependencies require new preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Sweep/minima arrays are bounded by32 entries and all temporary poses/maps are released after completion; the caller owns the selected pose, which may be the original, and no handles or background tasks exist.
 */
export function fitSeededChainToTarget(
  input: IFitChainToTargetProps,
): IAutoMovieSeededChainFit {
  const { target, ...source }: IFitChainToTargetProps = input;
  return fitSeededChainToTarget.prepare(source).fit(target);
}

/**
 * Scoped preparation for repeated targets of one unchanged source request.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the companion's shared-input scope.
 * @evidence contracts/development/design.md#principled-representation One workspace separates unchanged rig/pose semantics from model-metre target positions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanLimbFit's contact re-aim reads fit and actual effector rotation from the same preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No global identity cache, quantization, alternate search or remembered solution is exposed.
 */
export namespace fitSeededChainToTarget {
  /**
   * A fit operation's borrowed source dependencies and exact chain-frame reader.
   * Keep the rig, topology, source/reference poses, mappings and callback
   * dependencies unchanged for this workspace's lifetime. Results borrow the
   * source root and unrelated joints, which must also remain unchanged while
   * the workspace is in use. Release the workspace when that operation ends.
   *
   * States input stability, borrowed result members, caller-owned lifetime and the two operations' frames.
   * Fixed source dependencies admit several independent model-metre targets without making the previous answer a new source or continuation seed.
   * The contact re-aim consumer needs only another fit and its actual reached rotation; internal preparation and lazy caches stay private.
   * Cold or near is fixed by the source request; target order does not change it and no prior result replaces a global sweep.
   */
  export interface IWorkspace {
    /**
     * Fit one target using the original source pose and unchanged search policy.
   * Keep that target's coordinate record unchanged until the fit returns.
     *
     * States model-metre input and fixed source/search meaning.
     * Signature only; prepare owns the fit composition.
     * No body is declared here.
     * The signature performs no solve.
     * The producer documents shared preparation and unchanged candidate work.
     * The producer owns invariant sharing.
     * The signature acquires nothing.
     */
    fit(target: IAutoMovieVector3): IAutoMovieSeededChainFit;

    /**
     * Read a fit result's actual effector rotation in the same resolved model frame.
     * The pose must be this workspace's result, with its root, ancestors and
     * intermediate joints unchanged; a result with null preparation uses full FK.
     *
     * States actual rotation, fit-result admission and unchanged non-chain dependencies.
     * Signature only; prepare delegates to the chain-frame reader.
     * No body is declared here.
     * The signature computes no frame.
     * The producer documents the joint scan and constant-size FK.
     * The producer owns prepared-frame reuse.
     * The signature acquires nothing.
     */
    rotation(pose: IAutoMoviePose): IAutoMovieQuaternion;
  }

  /**
   * Prepare one source request for a synchronous operation that varies only
   * its target, such as contact re-aim. The source owns its cold/near mode;
   * neither the previous target nor its answer becomes a new seed.
   * A supplied authored reader must use the exact source rig, pose and
   * clinical mappings; it shares already completed full FK at first use.
   * An optional resolution reader belongs to the same synchronous operation
   * and shares exact computation across its source, zeroed and reference FK.
   *
   * States fixed dependencies, synchronous ownership and target-independent cold/near policy.
   * Shares exactly the prepared rigid frames, domains, bases, clamps, fixed projector coefficients, source/reference FK and angle maps whose inputs remain fixed, then invokes the same bend search and final orientation for each target.
   * prepareChainFit owns invariant data; fitChainBend owns candidate search and orientChainEffector owns final articulation; the rotation reader uses the same prepared frames.
   * No obstruction/strain result, target-dependent candidate score, seed, target or final pose is memoized across targets; only fixed preparation, exact authored-FK readings, prior conversion and source continuity are shared. Invalid preparation retains the one-shot fallback and full FK rotation read.
   * Rig preparation and at most two lazy full FK reads occur once per workspace; an authored reader can reuse one full FK the caller already needs. One resolution reader also shares identical articulation and ancestor/rest computations among full poses, including null-preparation rotation's full-FK fallback, while preserving their ordered scans and fresh outputs. Each target retains its search; valid prepared rotation uses a joint scan and constant chain FK.
   * The fixed input scope proves equivalence; rig preparation getters and an optional exact authored-FK reader retain their original lazy admission sites, returned poses preserve fixed non-chain dependencies, and every target invokes all required candidate callbacks and projection queries.
   * The two returned closures own one preparation workspace with O(J+B) borrowed input reachability and O(J) derived maps; no global cache or handle survives caller release.
   */
  export function prepare(
    source: Omit<IFitChainToTargetProps, "target">,
    readAuthored?: Parameters<typeof prepareChainFit>[1],
    resolution: ReturnType<typeof preparePoseResolution> = preparePoseResolution(),
  ): IWorkspace {
    const workspace: prepareChainFit.IWorkspace = prepareChainFit(
      source,
      readAuthored,
      resolution,
    );
    return {
      fit: (target: IAutoMovieVector3): IAutoMovieSeededChainFit => {
        const props: IFitChainToTargetProps = { ...workspace.props, target };
        const bend: IAutoMovieSeededChainFit = fitChainBend(props, workspace);
        return {
          pose: orientChainEffector(
            props,
            bend.pose,
            workspace.prepared ?? undefined,
            workspace.rig,
          ),
          seed: bend.seed,
          ...(bend.value === undefined ? {} : { value: bend.value }),
        };
      },
      rotation: (pose: IAutoMoviePose): IAutoMovieQuaternion =>
        workspace.prepared === null
          ? resolveBoneMap(
              workspace.props.skeleton,
              pose,
              workspace.props.topology,
              workspace.props.jointAxes,
              workspace.props.restFrames,
              resolution,
            ).get(workspace.props.chain.effector)!.worldRotation
          : resolvePreparedChainFrames.rotation({
              prepared: workspace.prepared,
              joints: pose.joints,
              jointAxes: workspace.props.jointAxes,
              restFrames: workspace.props.restFrames,
              rig: workspace.rig,
            }),
    };
  }
}
