import type {
  AutoMovieHumanoidBone,
  IAutoMovieChainBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { preparePoseResolution } from "../kinematics/preparePoseResolution";
import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import type { IAutoMovieChainContinuationObserver } from "./IAutoMovieChainContinuationObserver";
import { continueHingedOrientation } from "./continueHingedOrientation";
import { fitChainBend } from "./fitChainBend";
import { fitHingedChainAt } from "./fitHingedChainAt";
import { fitHingedChainBend } from "./fitHingedChainBend";
import { orientChainEffector } from "./orientChainEffector";
import { prepareChainFit } from "./prepareChainFit";
import { resolveBoneMap } from "./resolveBoneMap";
import { resolvePreparedChainFrames } from "./resolvePreparedChainFrames";

/**
 * Fit a reachable two-bone chain to a model-frame target under the rig's
 * effective ROM, retaining authored non-chain joints. A deterministic finite
 * bend-plane search scores clamped FK and keeps the source bend-stage pose
 * unless its 1e-7-metre residual bucket improves or equal-bucket continuity
 * improves toward an explicit prior pose; it is a bounded search, not a
 * global-optimum guarantee.
 *
 * For a hinged mid joint (an elbow or a knee, whose abduction is immobile) the
 * swivel parameterisation of Tolani, Goswami and Badler (2000) comes first and
 * wins whenever it reaches: the hinge angle follows from the span and the
 * swivel about the root-to-target axis is swept for the least range-of-motion
 * overshoot and then the least continuous cost of effector-rotation error,
 * swing from the hint's side and turn from the `referencePose`
 * (`fitHingedChainCandidate`), because a free-swing candidate turns the hinge
 * about the plane normal and the clamp of its abduction moves the effector.
 * Otherwise, and for other chains, the bend hint's plane and then the 32-plane
 * sweep follow, the first exact one winning. When nothing reaches, the least
 * clamped residual is returned, so an unreachable target leaves the effector on
 * the reachable shell, not a pretended reach.
 *
 * A hinged chain's answer comes with its seed, the branch and swivel its
 * candidate was chosen at and the mid bone's twist it chose, which a fit of a
 * nearby target continues from (`near`, `IAutoMovieSwivelNear`): that fit
 * refines the seed alone instead of sweeping, and keeps the twist's basin
 * (`solveDistalTwist`'s `reference`). The seed is null when another candidate
 * is the answer.
 *
 * With `effectorRotation`, a mid bone that declares a distal twist (a forearm)
 * first takes the twist share of the requested rotation about its own length
 * (swing-twist decomposition), clamped to its range, and the effector the
 * remaining swing, so pronation and supination are the forearm's and the wrist
 * keeps its place.
 *
 * Failed bend preparation or analytic admission keeps the source pose at that
 * stage. A requested rotation still runs the orientation pass and may change
 * the lower twist and effector articulation.
 *
 * The prepared workspace's explicit continued entry serves a deterministic
 * constrained-curve owner. After original source admission it tests the native
 * two-axis orientation roots before the existing near hinge. Actual
 * clamp/FK/ROM/pole/rotation admission precedes return; unsupported or failed
 * roots keep near refinement and its original cold fallback. Its owner must
 * independently validate final orientation, pole side, ROM, contact and branch
 * continuity; a local basin is not the cold global-score certificate.
 */
export function fitSeededChainToTarget(
  input: IAutoMovieFitChainToTargetProps,
): IAutoMovieSeededChainFit {
  const { target, ...source }: IAutoMovieFitChainToTargetProps = input;
  return fitSeededChainToTarget.prepare(source).fit(target);
}

/** Scoped preparation for repeated targets of one unchanged source request. */
export namespace fitSeededChainToTarget {
  /**
   * Read actual single-local-root provenance before an owned result copy. Only
   * the producer's exact result identity can supply these facts, and changed
   * pose/seed scalars decline. The return is an independent scalar copy;
   * callers cannot register, alter or confer provenance on another fit.
   * Checking original own-data output slots costs O(J) work; the read allocates
   * only its scalar result and retains no query, callback or handle.
   */
  export function orientationRoot(
    result: IAutoMovieSeededChainFit & continueHingedOrientation.IRooted,
  ): continueHingedOrientation.IRoot | undefined {
    return continueHingedOrientation.root(result);
  }

  /**
   * A fit operation's borrowed source dependencies and exact chain-frame
   * reader. Keep the rig, topology, source/reference poses, mappings and
   * callback dependencies unchanged for this workspace's lifetime. Results
   * borrow the source root and unrelated joints, which must also remain
   * unchanged while the workspace is in use. Release the workspace when that
   * operation ends.
   *
   * States input stability, borrowed result members, caller-owned lifetime and
   * the two operations' frames. Fixed source dependencies admit several
   * independent model-metre targets without making the previous answer a new
   * source or continuation seed. The contact re-aim consumer needs only another
   * fit and its actual reached rotation; internal preparation and lazy caches
   * stay private. fit keeps its source's fixed cold/near policy. Explicit
   * continued accepts a deterministic curve owner's candidate seed; it does not
   * certify the cold global winner, curve continuity or current final
   * orientation/contact.
   */
  export interface IWorkspace {
    /**
     * Fit one target using the original source pose and unchanged search
     * policy. Keep that target's coordinate record unchanged until the fit
     * returns. An optional `near` replaces the source's cold/near mode for this
     * target only: the fit continues that seed (a later contact re-aim pass
     * continuing its first pass's answer for a target millimetres away). A
     * prescribed seed (`IAutoMovieSwivelNear.prescribed`) is placed in closed
     * form where that placement reaches the target within range and clear of
     * the obstruction, and refined from otherwise; this call's prescribed
     * `near` wins over the source's, so a re-aim pass keeps the swivel its
     * first pass settled on. An optional `incumbent` (ignored with `near`) is a
     * seed the caller holds for this swept fit: it only starts the bounded
     * sweep's stop (`IAutoMovieFitChainToTargetProps.incumbent`), so the answer
     * is the swept fit's either way.
     *
     * States model-metre input, fixed source/search meaning and the per-target
     * continuation. Signature only; prepare owns the fit composition. No body
     * is declared here. The signature performs no solve. The producer documents
     * shared preparation and unchanged candidate work. The producer owns
     * invariant sharing. The signature acquires nothing.
     */
    fit(
      target: IAutoMovieVector3,
      near?: IAutoMovieSwivelNear,
      incumbent?: IAutoMovieSwivelSeed,
      capture?: orientChainEffector.IReading,
    ): IAutoMovieSeededChainFit;

    /**
     * Evaluate an explicit continuous-curve candidate at the current target.
     * The curve owner supplies a deterministic branch/swivel with positive
     * degree-valued bracket tolerance and verifies current final effector
     * orientation, pole side, ROM, contacts/clearance and branch events.
     * Eligible native two-axis orientation roots first receive actual
     * post-clamp point, rotation, ROM and pole checks. Unsupported or failed
     * roots retain near fitting, whose actual post-clamp shell must pass the
     * ordinary bend residual gate; otherwise the complete cold fit runs on this
     * same source. The original source/root still receives actual ordered
     * admission. An explicit rig uses an empty FK demand; a raw source keeps
     * full authored FK. Only the unchanged fixed source may share successful
     * admission. Invalid seed numbers also decline the candidate and run cold.
     * No last query is retained and no global cold-score equivalence is
     * promised. An optional observer reports actual orientation-root
     * trials/acceptance and near/cold attempts; its events never control
     * physical admission.
     */
    continued(
      target: IAutoMovieVector3,
      near: IAutoMovieSwivelNear,
      observe?: IAutoMovieChainContinuationObserver,
    ): IAutoMovieSeededChainFit;

    /**
     * Read a fit result's actual effector rotation in the same resolved model
     * frame. The pose must be this workspace's result, with its root, ancestors
     * and intermediate joints unchanged; a result with null preparation uses
     * full FK.
     *
     * States actual rotation, fit-result admission and unchanged non-chain
     * dependencies. Signature only; prepare delegates to the chain-frame
     * reader. No body is declared here. The signature computes no frame. The
     * producer documents the joint scan and constant-size FK. The producer owns
     * prepared-frame reuse. The signature acquires nothing.
     */
    rotation(pose: IAutoMoviePose): IAutoMovieQuaternion;

    /**
     * Actual joint centre and rotation after projection, in the same model
     * frame as fit targets.
     */
    effector(pose: IAutoMoviePose): IAutoMovieChainBone;
  }

  /**
   * Prepare one source request for a synchronous operation that varies only its
   * target, such as contact re-aim. The source owns its cold/near mode; neither
   * the previous target nor its answer becomes a new seed. A supplied authored
   * reader must include the source effector frame under this exact
   * rig/pose/clinical mapping and admit every authored joint in order; extra
   * frames may serve the caller. It shares completed FK at first use. An
   * optional resolution reader belongs to the same synchronous operation and
   * shares exact computation across its source, zeroed and reference FK. A
   * supplied poseResolution must snapshot this exact source rig, topology and
   * clinical tables; it enables requested-ancestor FK with fresh outputs.
   * Omission preserves the raw full-FK admission path. An optional plant places
   * the chain from its rig constants (`placeChainPlant`); such a chain carries
   * its rig-only readers, built for these same clinical tables, and the
   * workspace reads through them.
   *
   * States fixed dependencies, synchronous ownership and target-independent
   * cold/near policy. Shares exactly the prepared rigid frames, domains, bases,
   * clamps, fixed projector coefficients, source/reference FK and angle maps
   * whose inputs remain fixed, then invokes the same bend search and final
   * orientation for each target. prepareChainFit owns invariant data;
   * fitChainBend owns candidate search and orientChainEffector owns final
   * articulation; the rotation reader uses the same prepared frames. No
   * obstruction/strain result, target-dependent candidate score, seed, target
   * or final pose is memoized across targets; only fixed preparation, exact
   * authored-FK readings, prior conversion and source continuity are shared.
   * Invalid preparation retains the one-shot fallback and full FK rotation
   * read. Rig preparation and at most two lazy source/reference FK reads occur
   * once per workspace; an authored reader can reuse its exact FK. An explicit
   * immutable rig computes only requested source/zeroed/reference ancestry and
   * null-preparation effector rotation, with O(J) ordered joint admission and
   * exact dependency reuse. Without it, raw full-FK admission remains. Each
   * target retains its search; valid chain rotation uses a joint scan and
   * constant chain FK. The fixed input scope proves equivalence; rig
   * preparation getters and an optional exact authored-FK reader retain their
   * original lazy admission sites, returned poses preserve fixed non-chain
   * dependencies, and every target invokes all required candidate callbacks and
   * projection queries. The three returned methods own one preparation
   * workspace with O(J+B) borrowed input reachability and O(J) derived maps; no
   * global cache or handle survives caller release.
   */
  export function prepare(
    source: Omit<IAutoMovieFitChainToTargetProps, "target">,
    readAuthored?: Parameters<typeof prepareChainFit>[1],
    resolution: ReturnType<
      typeof preparePoseResolution
    > = preparePoseResolution(),
    poseResolution?: prepareSkeletonPoseResolution.IRig,
    plant?: Parameters<typeof prepareChainFit>[5],
  ): IWorkspace {
    const workspace: prepareChainFit.IWorkspace = prepareChainFit(
      source,
      readAuthored,
      resolution,
      poseResolution,
      undefined,
      plant,
    );
    return preparedWorkspace(workspace, resolution, poseResolution);
  }

  /**
   * Fixed rig, original pose, chain and clinical mappings of a synchronous goal
   * search.
   */
  export type ISource = Pick<
    IAutoMovieFitChainToTargetProps,
    "skeleton" | "pose" | "chain" | "topology" | "jointAxes" | "restFrames"
  >;

  /**
   * Live goal/search fields; target points remain the bound workspace's fit
   * input.
   */
  export type IOptions = Omit<
    IAutoMovieFitChainToTargetProps,
    keyof ISource | "target"
  >;

  /**
   * Prepare one unchanged source for a synchronous search whose goals may
   * change bend, rotation, reference, obstruction, strain or near mode. Source
   * creation performs no rig/FK admission; the first actual binding prepares it
   * at the ordinary prepare site. Keep every source dependency, source joint
   * and supplied authored reader unchanged until release.
   *
   * Each options binding owns fresh reference/weight admission, continuity,
   * cold/near and callback scope. It shares only source geometry, merged axes,
   * admitted bases/clamps/projector coefficients, source FK/joint maps and
   * original non-bend prefix. It retains no point, candidate or solved pose.
   * Options stay unchanged until that bound workspace is released; later
   * bindings never replace an earlier workspace's source or goal fields. The
   * optional authored reader, exact operation reader and immutable rig have
   * prepare's same admission and matching-source requirements.
   */
  export function prepareSource(
    source: ISource,
    readAuthored?: Parameters<typeof prepareChainFit>[1],
    resolution: ReturnType<
      typeof preparePoseResolution
    > = preparePoseResolution(),
    poseResolution?: prepareSkeletonPoseResolution.IRig,
  ): (options: IOptions) => IWorkspace {
    let fixed: prepareChainFit.IWorkspace | undefined;
    return (options: IOptions): IWorkspace => {
      const {
        bend,
        effectorRotation,
        referencePose,
        referenceWeight,
        obstruction,
        strain,
        near,
      }: IOptions = options;
      if (fixed === undefined) {
        const {
          skeleton,
          pose,
          chain,
          topology,
          jointAxes,
          restFrames,
        }: ISource = source;
        fixed = prepareChainFit(
          { skeleton, pose, chain, topology, jointAxes, restFrames },
          readAuthored,
          resolution,
          poseResolution,
        );
      }
      const props: Omit<IAutoMovieFitChainToTargetProps, "target"> = {
        ...fixed.props,
        bend,
        effectorRotation,
        referencePose,
        referenceWeight,
        obstruction,
        strain,
        near,
      };
      return preparedWorkspace(
        prepareChainFit(props, readAuthored, resolution, poseResolution, fixed),
        resolution,
        poseResolution,
      );
    };
  }
}

/**
 * A fit's seed with the mid bone's twist it chose
 * (`IAutoMovieSwivelSeed.twist`), which a fit continued from the seed keeps its
 * basin of; the seed as it is where the mid bone has no twist or there is no
 * seed.
 */
function twisted(
  seed: IAutoMovieSwivelSeed | null,
  pose: IAutoMoviePose,
  lower: AutoMovieHumanoidBone,
): IAutoMovieSwivelSeed | null {
  if (seed === null) return null;
  const twist: number | null | undefined = pose.joints.find(
    (joint: IAutoMovieJointPose): boolean => joint.bone === lower,
  )?.twist;
  return typeof twist === "number" ? { ...seed, twist } : seed;
}

/**
 * One owner of actual search/orientation and result rotation for both
 * preparation scopes.
 */
function preparedWorkspace(
  workspace: prepareChainFit.IWorkspace,
  resolution: ReturnType<typeof preparePoseResolution>,
  poseResolution?: prepareSkeletonPoseResolution.IRig,
): fitSeededChainToTarget.IWorkspace {
  const finish: (
    props: IAutoMovieFitChainToTargetProps,
    bend: IAutoMovieSeededChainFit,
    capture?: orientChainEffector.IReading,
  ) => IAutoMovieSeededChainFit = (
    props: IAutoMovieFitChainToTargetProps,
    bend: IAutoMovieSeededChainFit,
    capture?: orientChainEffector.IReading,
  ): IAutoMovieSeededChainFit => {
    const pose: IAutoMoviePose = orientChainEffector(
      props,
      bend.pose,
      workspace.prepared ?? undefined,
      workspace.rig,
      capture,
    );
    return {
      pose,
      seed: twisted(bend.seed, pose, props.chain.lower),
      ...(bend.value === undefined ? {} : { value: bend.value }),
    };
  };
  return {
    fit: (
      target: IAutoMovieVector3,
      near?: IAutoMovieSwivelNear,
      incumbent?: IAutoMovieSwivelSeed,
      capture?: orientChainEffector.IReading,
    ): IAutoMovieSeededChainFit => {
      // A prescribed seed, this call's or else the workspace's own, is
      // placed in closed form at every target (a contact's re-aims
      // included): the course chose the swivel, so nothing is searched or
      // refined. This call's wins, so a re-aim pass keeps the swivel its
      // first pass settled on, even where that pass had to refine away
      // from the workspace's.
      const prescribed: IAutoMovieSwivelNear | undefined =
        near?.prescribed === true
          ? near
          : workspace.props.near?.prescribed === true
            ? workspace.props.near
            : undefined;
      if (prescribed !== undefined) {
        // The placement's orientation continues the prescribed seed's twist.
        const placed: ReturnType<typeof fitHingedChainAt> = fitHingedChainAt(
          { ...workspace.props, target, near: prescribed },
          prescribed.swivel,
          prescribed.branch,
        );
        // The closed form stands only where it reaches the target within the
        // range of motion and keeps clear of the request's obstruction, the
        // one probe that confirms the swivel; elsewhere the fit continues
        // from the course's seed.
        if (
          placed !== null &&
          placed.shortfall <= 0 &&
          !placed.clamped &&
          placed.blocked <= 0
        )
          return {
            pose: placed.pose,
            seed: twisted(
              placed.seed,
              placed.pose,
              workspace.props.chain.lower,
            ),
          };

        // Refine a refused placement but keep its prior distal twist as the
        // orientation reference (Tolani, Goswami and Badler 2000, section 3.2.4).
        // When a reachable, clear placement clamps, follow the proximal
        // interval the course fitted to the same bend branch.
        const feasible: IAutoMovieSwivelNear["feasible"] =
          placed?.clamped === true &&
          placed.seed?.branch === prescribed.branch &&
          placed.shortfall === 0 &&
          placed.blocked <= 0
            ? prescribed.feasible
            : undefined;
        const continued: IAutoMovieSwivelNear = {
          swivel: prescribed.swivel,
          branch: prescribed.branch,
          tolerance: prescribed.tolerance,
          ...(prescribed.twist === undefined ? {} : { twist: prescribed.twist }),
          ...(feasible === undefined ? {} : { feasible }),
        };
        const props: IAutoMovieFitChainToTargetProps = {
          ...workspace.props,
          target,
          near: continued,
        };
        return finish(props, fitChainBend(props, workspace), capture);
      }
      const props: IAutoMovieFitChainToTargetProps =
        near === undefined
          ? {
              ...workspace.props,
              target,
              ...(incumbent === undefined ? {} : { incumbent }),
            }
          : { ...workspace.props, target, near };
      return finish(props, fitChainBend(props, workspace), capture);
    },
    continued: (
      target: IAutoMovieVector3,
      near: IAutoMovieSwivelNear,
      observe?: IAutoMovieChainContinuationObserver,
    ): IAutoMovieSeededChainFit => {
      const props: IAutoMovieFitChainToTargetProps = {
        ...workspace.props,
        target,
        near,
      };
      const admitted: boolean =
        near.branch >= 0 && near.branch <= 1 && near.tolerance > 0;
      let candidate: ReturnType<typeof fitHingedChainBend> = null;
      if (admitted) {
        // A new curve policy may omit an unused pole candidate, but it
        // cannot bypass the original source's joint/root admission. An
        // explicit fixed rig need not materialize unused authored frames.
        workspace.admitSource();
        const oriented: IAutoMovieSeededChainFit | null =
          continueHingedOrientation(props, workspace, near, observe);
        if (oriented !== null) return oriented;
        observe?.("nearAttempt");
        candidate = fitHingedChainBend(props, workspace);
      }
      if (candidate !== null && candidate.fitted !== null)
        return finish(props, candidate.fitted);
      const cold: IAutoMovieFitChainToTargetProps = {
        ...props,
        near: undefined,
      };
      observe?.("coldAttempt");
      return finish(cold, fitChainBend(cold, workspace));
    },
    effector: (pose: IAutoMoviePose): IAutoMovieChainBone =>
      workspace.prepared !== null
        ? resolvePreparedChainFrames({
            prepared: workspace.prepared,
            joints: pose.joints,
            jointAxes: workspace.props.jointAxes,
            restFrames: workspace.props.restFrames,
            rig: workspace.rig,
          }).effector
        : poseResolution === undefined
          ? resolveBoneMap(
              workspace.props.skeleton,
              pose,
              workspace.props.topology,
              workspace.props.jointAxes,
              workspace.props.restFrames,
              resolution,
            ).get(workspace.props.chain.effector)!
          : poseResolution.resolve(
              pose,
              resolution,
              new Set([workspace.props.chain.effector]),
            )[0]!,
    rotation: (pose: IAutoMoviePose): IAutoMovieQuaternion =>
      workspace.prepared === null
        ? poseResolution === undefined
          ? resolveBoneMap(
              workspace.props.skeleton,
              pose,
              workspace.props.topology,
              workspace.props.jointAxes,
              workspace.props.restFrames,
              resolution,
            ).get(workspace.props.chain.effector)!.worldRotation
          : poseResolution.resolve(
              pose,
              resolution,
              new Set([workspace.props.chain.effector]),
            )[0]!.worldRotation
        : resolvePreparedChainFrames.rotation({
            prepared: workspace.prepared,
            joints: pose.joints,
            jointAxes: workspace.props.jointAxes,
            restFrames: workspace.props.restFrames,
            rig: workspace.rig,
          }),
  };
}
