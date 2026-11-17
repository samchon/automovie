import { Quaternion, Vector3, placeChainPlant } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePlantChain,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmObstacleBones } from "./HumanArmObstacleBones";
import { HumanArmOvershoot } from "./HumanArmOvershoot";
import { HumanLimbAt } from "./HumanLimbAt";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanLimbMirror } from "./HumanLimbMirror";
import { HumanLimbRootProvenance } from "./HumanLimbRootProvenance";
import type { HumanLimbView } from "./HumanLimbView";
import { fitHumanLimbContact } from "./fitHumanLimbContact";
import { poseBones } from "./poseBones";
import { prepareHumanLimbFit } from "./prepareHumanLimbFit";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { solveHumanLimbFit } from "./solveHumanLimbFit";

/**
 * The fit of one limb onto its goal, which `resolveHumanPosture` runs for
 * each limb after the trunk: the goal carried into the world by the bone
 * it is attached to, the engine's two-bone fit clear of the trunk and the
 * other arm, the end joint re-aimed so a contact stays put, and the fits
 * remembered per body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four parts of a limb's fit and who runs it.
 * @evidence contracts/development/design.md#principled-representation The fit of one limb is one responsibility, apart from the assembly of a whole pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The chain, the world goal, the fit, the remembered fit and the memory's switch, all read by `resolveHumanPosture`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The solver is the engine's; nothing here sets an angle past the rig's range.
 */
export namespace HumanLimbFit {
  /**
   * The engine's three required mutable bone identities: upper, lower and
   * effector. `chain` chooses their Human names from the limb's side and kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three identities and distinguishes their engine-owned structure from the Human naming policy.
   * @evidence contracts/development/design.md#principled-representation The existing engine descriptor has exactly the same three required mutable AutoMovieHumanoidBone fields as this Human chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Aliases IAutoMoviePlantChain instead of maintaining a parallel structure; the fit and reference keep their existing IChain name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias changes no field, optionality or bone union; chain still selects names from the limb's side and kind.
   */
  export type IChain = IAutoMoviePlantChain;

  /**
   * The chain of a limb.
   *
   * @param limb The limb.
   * @returns Its three bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The side and the kind name the bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every limb of the posture's union has its chain.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function chain(limb: AutoMovieHumanLimb): IChain {
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    return limb.endsWith("Arm")
      ? {
          upper: `${side}UpperArm`,
          lower: `${side}LowerArm`,
          effector: `${side}Hand`,
        }
      : {
          upper: `${side}UpperLeg`,
          lower: `${side}LowerLeg`,
          effector: `${side}Foot`,
        };
  }

  /**
   * The former switch of the limb-fit memory. No fit is remembered any more:
   * every fit is solved directly (`solveHumanLimbFit`), with the switch on or
   * off, so this call changes nothing. It stays only while specifications
   * written against the memory still call it.
   *
   * @param _on Unread.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the switch has no effect, why, and why it remains.
   * @evidence contracts/development/implementation.md#principled-implementation With no memory there is nothing to turn on or off; every fit is the direct solve either way.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An empty body.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Claims no effect and keeps no hidden state.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms No work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function memory(_on: boolean): void {}

  /**
   * A limb goal in world terms: unchanged when it has no `on` bone, otherwise
   * its point and bend carried from the bone's posed frame to the world
   * (`p_world = P + R p`) and its rotation composed after the bone's
   * (`R q`), with the bone placed by the given pose. The attachment is
   * refused for a bone of the limb's own chain (its upper bone, its lower
   * bone or its end), because fitting the limb moves that bone and the goal
   * would chase itself.
   *
   * @param body The performer's body.
   * @param pose The pose that places the attachment bone, before the limb is fitted.
   * @param limb The limb the goal is for.
   * @param goal The goal, attached or not.
   * @param readAuthored Optional exact FK containing the attachment bone for this body/pose and canonical mappings, shared only within the current fit operation.
   * @returns The goal with world point, bend and rotation and no `on`.
   * @throws {Error} When the goal is attached to a bone of its own limb's chain, or to a bone the rig lacks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the transform, the refusal and its reason.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid transform of the goal by the bone's posed frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame read and one transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A goal on its own chain or on a missing bone throws instead of chasing itself.
   * @evidence contracts/development/implementation.md#efficient-algorithms An attached goal requests only its carrying bone and ancestor FK while preserving ordered authored-joint admission; a supplied exact reading shares that completed frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses poseBones, or the same exact authored-FK reader the fit's clearance and engine source read consume; a self-chain refusal precedes that read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function world(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    goal: IAutoMovieHumanLimbGoal,
    readAuthored?: () => ReadonlyMap<
      AutoMovieHumanoidBone,
      IAutoMovieResolvedBone
    >,
  ): IAutoMovieHumanLimbGoal {
    const on: AutoMovieHumanoidBone | undefined = goal.on;
    if (on === undefined) return goal;
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    const chain: readonly AutoMovieHumanoidBone[] = limb.endsWith("Arm")
      ? [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`]
      : [`${side}UpperLeg`, `${side}LowerLeg`, `${side}Foot`];
    if (chain.includes(on))
      throw new Error(
        `A ${limb} goal cannot be attached to ${on}, a bone of its own chain`,
      );
    const frame: IAutoMovieResolvedBone | undefined = (
      readAuthored === undefined ? poseBones(body, pose, undefined, new Set([on])) : readAuthored()
    ).get(on);
    if (frame === undefined)
      throw new Error(
        `A ${limb} goal is attached to ${on}, which the rig lacks`,
      );
    const place: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        frame.worldPosition,
        Quaternion.rotateVector(frame.worldRotation, p),
      );
    const { on: _attached, ...rest }: IAutoMovieHumanLimbGoal = goal;
    return {
      ...rest,
      point: place(goal.point),
      bend: place(goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : {
            rotation: Quaternion.normalize(
              Quaternion.multiply(frame.worldRotation, goal.rotation),
            ),
          }),
    };
  }

  /**
   * The fit of one limb by the engine's two-bone solver; with a contact, the end
   * joint is re-aimed until the contact stays put, within `REAIM_TOLERANCE`,
   * under the rotation the limb actually reached (`HumanFoot.heelOff`), and a
   * foot's toes take back the pitch that fit lost. The re-aim is a fixed-point
   * iteration with Anderson's mixing of depth one (Anderson 1965, "Iterative
   * procedures for nonlinear integral equations", J. ACM 12; Walker and Ni
   * 2011, SIAM J. Numer. Anal. 49), at most `REAIM_PASSES` fits. A goal attached to a bone (`on`) is first carried into
   * the world by that bone as the pose being fitted places it, so whatever
   * moved the bone before the fit (a trunk joint, a layer, a transition
   * offset) moves the goal with it. An arm fitted after the other arm (one
   * whose goal rides the other, `resolveHumanPosture.order`) keeps clear of
   * it too; two arms with goals that ride neither are fitted as one coupled
   * problem (`HumanLimbPair`), each first on its own with the other only a
   * coming wrist (`rival`). An arm keeps clear of the
   * other bodies its goal names (`HumanPosture.IGoal.clear`) and of the ones it lays the hand on (`rests`).
   * A left limb is fitted as the right limb in the mirror image of its world
   * (the pose, the goal, the colliders it keeps clear of and the other arm)
   * and mirrored back, so a mirrored posture's fit is the mirror of the
   * original's to the bit: the solver's rounding is not sign-symmetric, and
   * each side solved on its own parted them by up to 6.4e-14 degrees.
   *
   * With `near`, the fit continues a nearby one (`IAutoMovieSwivelNear`):
   * every pass refines that seed instead of sweeping the swivel. The seed
   * returned is the kept pass's, in the frame the limb is solved in (a left
   * limb's in its mirror image), which is the frame a `near` for the same
   * limb is read in.
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param attached Its goal, attached or not.
   * @param placed The arms already placed, whose room the arm keeps.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
   * @param resolution Optional exact reader or lazy supplier borrowed from this synchronous person evaluation; otherwise the first FK demand creates one.
   * @returns The pose with the limb fitted, and the seed that continues it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fit, the re-aim with its sources and bounds, the attachment and the clearance.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's two-bone fit, a fixed-point re-aim with Anderson mixing, and the clearance as the fit's obstruction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One world goal, one obstruction, one fit, then the re-aim loop and the toes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The re-aim keeps the fit whose contact lay nearest, not its last pass, and stops at `REAIM_PASSES`.
   * @evidence contracts/development/implementation.md#efficient-algorithms One lazy canonical source read requests only the actual effector, attachment and selected trunk/thigh/placed-arm obstacle frames plus their ancestors, preserving all authored admission. At most REAIM_PASSES targets share rig work, a re-aim pass after the first continuing the previous pass's seed instead of searching again, and every obstruction candidate shares fixed shape-frame preparation; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One authored reader, limb workspace and prepared obstruction serve the fixed body/source pose, placed colliders, goal bend/rotation/reference and cold/near mode; only fit targets and candidate points vary. No callback value, distance or fitted answer is shared across distinct candidates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns one source-FK map, fit workspace and at most one opaque distance reader per queried fixed shape through synchronous return or failure. Its lazy reader is local or borrowed; only pose/seed/value escape, and no returned plan or body-memory entry captures readers or callbacks.
   */
  export function fit(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, limb: AutoMovieHumanLimb, attached: IAutoMovieHumanLimbGoal,
    placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3, near?: IAutoMovieSwivelNear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit {
    return solveHumanLimbFit.world(body, pose, limb, attached, placed, rival, near, resolution, "ordinary");
  }

  /**
   * Fit a constructor-owned continuous curve through current hinged correction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names explicit continuous-curve point fitting and unchanged source, goal, near and result units.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the engine's prepared current-target hinged correction before generic cold work; the owned curve separately checks actual current constraints and deterministic branch continuity. Public fit keeps original ordering.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares one attachment/clearance/contact kernel and changes only its point-fitting entry; no duplicate limb solver or contact algorithm is introduced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No public prepared bit, changed goal, skipped source admission or altered tolerance; unsupported correction falls back through the engine's same-source cold owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms Avoids generic pole/source ranking before a valid current hinged correction, while retaining actual FK/ROM/orientation and curve checks. Runtime gains are unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the same goal-specific workspace and actual source reader; every current/re-aimed point is fitted, with no prior pose answer reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Point-policy closures and workspaces remain synchronous, and independent output/cache ownership stays with the existing fitting owner.
   */
  export function continued(...args: Parameters<typeof fit>): IAutoMovieSeededChainFit {
    return solveHumanLimbFit.world(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], "continuous");
  }

  /**
   * The fit of a limb's own chain in the pose and frame given, with no
   * mirror image and no reduction of the pose: what `solveHumanLimbFit`
   * runs on the reduced pose of a right limb, or of a left limb's mirror
   * image, after moving it into the frame it solves in.
   *
   * @param body The performer's body.
   * @param pose The pose the chain is solved in, holding at least the records the fit reads (`HumanLimbView.of`).
   * @param limb The limb whose own chain is solved.
   * @param attached Its goal, attached or not.
   * @param placed The arms already placed.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
   * @param resolution Optional exact reader or lazy supplier borrowed from this synchronous evaluation.
   * @param policy The ordinary fit, or the owned continuous curve's current hinged correction.
   * @param admit Run before the fit's first forward-kinematics read, where the whole pose was admitted when the fit read every joint.
   * @returns The given pose with the limb fitted, and the seed that continues it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved, what the pose must hold, the two policies and when `admit` runs.
   * @evidence contracts/development/implementation.md#principled-implementation The world goal, the arm's obstruction, the engine's prepared two-bone fit placed from the body's chain constants, and the contact re-aim, as `fit` documents them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One kernel serves both policies; the mirror image, the root-position frame and the reduction belong to `solveHumanLimbFit`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal, tolerance or admission is changed; `admit` runs at the first read's own place, after an attachment's refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fit's own search over the records given; every scan is linear in those records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One authored reader, limb workspace and prepared obstruction serve every target of the contact re-aim; the body lends the limb's rig-only readers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its source reading and workspace until return or throw; only the pose, seed and value escape.
   */
  export function direct(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, limb: AutoMovieHumanLimb, attached: IAutoMovieHumanLimbGoal,
    placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined, near: IAutoMovieSwivelNear | undefined,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0], policy: "ordinary" | "continuous",
    admit?: () => void): IAutoMovieSeededChainFit {
    return solved(body, pose, limb, attached, placed, rival, near, resolution,
      policy === "ordinary" ? ordinary : correcting, admit);
  }

  /** The chain's own solve in the pose given: the world goal, the obstruction, the prepared fit and the contact re-aim. */
  function solved(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, limb: AutoMovieHumanLimb, attached: IAutoMovieHumanLimbGoal,
    placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined, near: IAutoMovieSwivelNear | undefined,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0], read: typeof ordinary,
    admit?: () => void): IAutoMovieSeededChainFit {
    const readResolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const side: "left" | "right" = limb.startsWith("left") ? "left" : "right";
    let authoredBones:
      | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
      | undefined;

    // The chain as the rig alone fixes it: placed under this pose from the
    // frame of its root's parent, which the source's one read gives, in
    // place of a second read of the whole pose with the chain left out.
    const constants: IAutoMovieMotionHumanBody["chains"][AutoMovieHumanLimb] = body.chains[limb];

    // These consumers all read the unchanged source pose. Keep the reader
    // lazy so attachment refusals and degenerate leg fits keep their original
    // admission order, and never let a fitted pose replace this source.
    const readAuthored: () => ReadonlyMap<
      AutoMovieHumanoidBone,
      IAutoMovieResolvedBone
    > = (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      if (authoredBones === undefined) {
        // The body's bound demand of these bones (`IHumanBody.reads`) for a
        // goal on no bone, or on one the demand already holds; another
        // attachment reads its own set.
        const arm: boolean = limb.endsWith("Arm");
        const kept: IAutoMovieMotionHumanBody["reads"][AutoMovieHumanLimb][number] =
          body.reads[limb][arm && placed.some((other: "left" | "right"): boolean => other !== side) ? 1 : 0];
        if (attached.on === undefined || kept.requested.has(attached.on)) {
          admit?.();
          authoredBones = kept.demand.map(pose, readResolution());
        } else {
          const requested: Set<AutoMovieHumanoidBone> = new Set(arm
            ? HumanArmObstacleBones(placed.filter((other: "left" | "right"): boolean => other !== side)) : []);
          requested.add(chain(limb).effector);
          requested.add(attached.on);
          if (constants !== undefined && constants.parent !== null) requested.add(constants.parent);
          admit?.();
          authoredBones = poseBones(body, pose, readResolution(), requested);
        }
      }
      return authoredBones;
    };
    const goal: IAutoMovieHumanLimbGoal = world(
      body,
      pose,
      limb,
      attached,
      readAuthored,
    );
    // An arm's forearm stays clear of the trunk, the thighs and an arm fitted
    // before it as the pose being fitted places them (`HumanArmClearance`),
    // whatever the hint or the hand's turn prefer.
    const trunk: IAutoMovieMotionHumanColliders.IPlaced[] | null = limb.endsWith("Arm")
      ? HumanArmClearance.obstacles(
          body,
          readAuthored(),
          placed.filter((arm: "left" | "right"): boolean => arm !== side),
        )
      : null;
    const clear: IObstruction | undefined =
      trunk === null
        ? undefined
        : HumanArmOvershoot.prepare(
            body,
            trunk,
            side,
            attached.clear ?? [],
            true,
            rival,
            goal.bend,
            attached.rests ?? [],
          );
    const fitter: ReturnType<typeof prepareHumanLimbFit> = prepareHumanLimbFit(
      body,
      pose,
      chain(limb),
      goal,
      clear,
      near,
      readAuthored,
      readResolution(),
      constants === undefined
        ? undefined
        : (): ReturnType<typeof placeChainPlant> | null => {
            const parent: Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation"> | undefined =
              constants.parent === null
                ? {
                    worldPosition: pose.root?.translation ?? { x: 0, y: 0, z: 0 },
                    worldRotation: pose.root?.rotation ?? Quaternion.identity(),
                  }
                : readAuthored().get(constants.parent);
            return parent === undefined ? null : placeChainPlant(constants, parent);
          },
    );
    return fitHumanLimbContact(fitter, goal, side, limb.endsWith("Leg"),
      (point: IAutoMovieVector3, continued?: IAutoMovieSwivelNear): IAutoMovieSeededChainFit => {
        const fitted: IAutoMovieSeededChainFit = read(fitter, point, near, body, continued);

        // A workspace of a shared source solves on its own snapshot; its
        // unchanged records are handed back as this pose's own, so the
        // caller that merges the fit recognises the records it lent.
        return fitter.lent === undefined ? fitted : { ...fitted, pose: fitter.lent(fitted.pose) };
      });
  }

  /**
   * The fit of one limb in the mirror image and root-position frame,
   * solved directly every time (`solveHumanLimbFit`). The name is the
   * former memory's; nothing is remembered.
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param goal Its goal, attached or not.
   * @param placed The arms already placed.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
   * @param resolution Optional parent FK reader or lazy supplier, borrowed by the solve.
   * @param admission The admission the fits of one pose share (`HumanLimbView.IAdmission`); absent, this fit admits the whole pose itself.
   * @returns The pose with the limb fitted, and the seed that continues it; untouched records are shared with the input pose, which callers treat as immutable.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the direct solve, its frames, the shared admission and the shared-record result.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to solveHumanLimbFit, the memory's former miss path: mirror reflection and the rigid root frame leave the fit equivariant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call forwards every argument.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key, lookup or stored answer; every request is solved from its own inputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fit's own search on the records it reads, as solveHumanLimbFit states; no serialization or result clone.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each request is solved afresh.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function remembered(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, limb: AutoMovieHumanLimb, goal: IAutoMovieHumanLimbGoal,
    placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3, near?: IAutoMovieSwivelNear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    admission?: HumanLimbView.IAdmission): IAutoMovieSeededChainFit {
    return solveHumanLimbFit(body, pose, limb, goal, placed, rival, near, resolution, "ordinary", admission);
  }

  /**
   * The limb posed at a prescribed swivel and bend branch, with no search or
   * score (`HumanLimbAt.at`): mirrored and attached as `fit` is.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the owner of the closed-form placement.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to HumanLimbAt.at, the engine's fitHingedChainAt on the fit's own request.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forwarding call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The given swivel is kept; nothing is searched.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(...args: Parameters<typeof HumanLimbAt.at>): ReturnType<typeof HumanLimbAt.at> {
    return HumanLimbAt.at(...args);
  }

  /**
   * The swivel and bend branch of a posed limb in its fits' seed frame
   * (`HumanLimbAt.seed`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the owner of the seed reading.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to HumanLimbAt.seed, the engine's readHingedChainSeed on the fit's own request.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forwarding call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No search.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function seed(...args: Parameters<typeof HumanLimbAt.seed>): ReturnType<typeof HumanLimbAt.seed> {
    return HumanLimbAt.seed(...args);
  }

  /**
   * A limb goal's mirror image (`HumanLimbMirror.goal`).
   *
   * @param goal The goal.
   * @returns Its mirror image.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies HumanLimbMirror.goal as the owner of median-plane goal reflection, including attachments and external colliders.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the shared median-plane reflection of points, rotations, attached bone and colliders; clinical reference angles keep their side convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation keeps every reflected goal field in HumanLimbMirror.goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal part or side is special-cased by this wrapper; the shared owner reflects limits, clear and rests as well as the main target.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work is linear in limits, placed segments/shapes and uncached hull vertices; already mirrored source hull arrays reuse their points. The wrapper adds no scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses common goal/shape reflection and HumanArmMirror's mirrored hull points while source point arrays remain unchanged, without a new goal cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned goal and mirrored records; unchanged fields are borrowed and shared hull points follow their source-array weak cache. This wrapper owns no retained state, handles or tasks.
   */
  export function reflected(goal: IAutoMovieHumanLimbGoal): IAutoMovieHumanLimbGoal {
    return HumanLimbMirror.goal(goal);
  }

  /** Public near/cold fitting retains its original workspace entry and order; a re-aim pass continues its previous pass. */
  function ordinary(workspace: ReturnType<typeof prepareHumanLimbFit>, point: IAutoMovieVector3,
    _near: IAutoMovieSwivelNear | undefined, _body: IAutoMovieMotionHumanBody, continued?: IAutoMovieSwivelNear): IAutoMovieSeededChainFit {
    return workspace.fit(point, continued);
  }

  /** Only the actual continuous-curve constructor selects current hinged correction. */
  function correcting(workspace: ReturnType<typeof prepareHumanLimbFit>, point: IAutoMovieVector3,
    given: IAutoMovieSwivelNear | undefined, body: IAutoMovieMotionHumanBody, continued?: IAutoMovieSwivelNear): IAutoMovieSeededChainFit {
    const near: IAutoMovieSwivelNear | undefined = continued ?? given;
    if (near === undefined) return workspace.fit(point);
    const fitted: IAutoMovieSeededChainFit = workspace.continued(point, near,
      (event: Parameters<NonNullable<Parameters<typeof workspace.continued>[2]>>[0]): void => {
        switch (event) {
          case "orientationRootTrial": HumanLimbFitFrame.work(body, "orientationRootTrials"); break;
          case "orientationRootAccepted": HumanLimbFitFrame.work(body, "orientationRootAccepted"); break;
          case "nearAttempt": HumanLimbFitFrame.work(body, "continuationNearAttempts"); break;
          case "coldAttempt": HumanLimbFitFrame.work(body, "continuationColdAttempts"); break;
        }
      });
    HumanLimbRootProvenance.capture(fitted);
    return fitted;
  }

  /** What a limb's fit must keep clear of: the degrees a mid joint and an end joint, world metres, count as out of range. */
  type IObstruction = (
    mid: IAutoMovieVector3,
    end: IAutoMovieVector3,
  ) => number;
}
