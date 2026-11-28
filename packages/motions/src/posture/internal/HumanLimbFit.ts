import { AutoMovieEngineQuaternion, AutoMovieEngineMotionPlanting } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePlantChain,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmObstacleBones } from "./HumanArmObstacleBones";
import { HumanArmOvershoot } from "./HumanArmOvershoot";
import { HumanLimbAt } from "./HumanLimbAt";
import { HumanLimbMirror } from "./HumanLimbMirror";
import { HumanLimbVanishedRefusal } from "./HumanLimbVanishedRefusal";
import { fitHumanLimbContact } from "./fitHumanLimbContact";
import { humanLimbGoalWorld } from "./humanLimbGoalWorld";
import { humanLimbReference } from "./humanLimbReference";
import { poseBones } from "./poseBones";
import { prepareHumanLimbFit } from "./prepareHumanLimbFit";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { solveHumanLimbFit } from "./solveHumanLimbFit";

/*
 * The fit of one limb onto its goal, which `resolveHumanPosture` runs for each
 * limb after the trunk: the goal carried into the world by the bone it is
 * attached to, the engine's two-bone fit clear of the trunk and the other arm,
 * and the end joint re-aimed so a contact stays put. Every fit is solved from
 * its own inputs; nothing is remembered between fits.
 */
export namespace HumanLimbFit {
  /*
   * The engine's three required mutable bone identities: upper, lower and
   * effector. `chain` chooses their Human names from the limb's side and kind.
   */
  export type IChain = IAutoMoviePlantChain;

  /*
   * The chain of a limb.
   * Parameter limb: The limb.
   * Returns: Its three bones.
   */
  export function chain(limb: AutoMovieHumanLimb): IChain {
    const side: AutoMovieHumanSide = limb.startsWith("left") ? "left" : "right";
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

  /*
   * The joints a limb was solved to, as a reference for the strokes about it
   * (`humanLimbReference`).
   */
  export const reference: typeof humanLimbReference = humanLimbReference;

  /*
   * A limb goal in world terms (`humanLimbGoalWorld`).
   */
  export const world: typeof humanLimbGoalWorld = humanLimbGoalWorld;

  /*
   * The fit of one limb by the engine's two-bone solver; with a contact, the
   * end joint is re-aimed until the contact stays put, within
   * `REAIM_TOLERANCE`, under the rotation the limb actually reached
   * (`HumanFoot.heelOff`), and a foot's toes take back the pitch that fit lost.
   * The re-aim is a fixed-point iteration with Anderson's mixing of depth one
   * (Anderson 1965, "Iterative procedures for nonlinear integral equations", J.
   * ACM 12; Walker and Ni 2011, SIAM J. Numer. Anal. 49), at most
   * `REAIM_PASSES` fits. A goal attached to a bone (`on`) is first carried into
   * the world by that bone as the pose being fitted places it, so whatever
   * moved the bone before the fit (a trunk joint, a layer, a transition offset)
   * moves the goal with it. An arm fitted after the other arm (one whose goal
   * rides the other, `orderHumanLimbs`) keeps clear of it too; two arms with
   * goals that ride neither are fitted as one coupled problem
   * (`HumanLimbPair`), each first on its own with the other only a coming wrist
   * (`rival`). An arm keeps clear of the other bodies its goal names
   * (`HumanPosture.IGoal.clear`) and of the ones it lays the hand on (`rests`).
   * A left limb is fitted as the right limb in the mirror image of its world
   * (the pose, the goal, the colliders it keeps clear of and the other arm) and
   * mirrored back, so a mirrored posture's fit is the mirror of the original's
   * to the bit: the solver's rounding is not sign-symmetric, and each side
   * solved on its own parted them by up to 6.4e-14 degrees.
   *
   * With `near`, the fit continues a nearby one (`IAutoMovieSwivelNear`): every
   * pass refines that seed instead of sweeping the swivel. The seed returned is
   * the kept pass's, in the frame the limb is solved in (a left limb's in its
   * mirror image), which is the frame a `near` for the same limb is read in.
   * Parameter body: The performer's body.
   * Parameter pose: The pose before the fit.
   * Parameter limb: The limb.
   * Parameter attached: Its goal, attached or not.
   * Parameter placed: The arms already placed, whose room the arm keeps.
   * Parameter rival: Where the other arm's wrist will be, while it is still to be
   * fitted.
   * Parameter near: A nearby fit of the same limb to continue; omitted, the fit is
   * solved cold.
   * Parameter resolution: Optional exact reader or lazy supplier borrowed from this
   * synchronous person evaluation; otherwise the first FK demand creates
   * one.
   * Returns: The pose with the limb fitted, and the seed that continues it.
   * When a continued arm's arc of swivels admitting the
   * hand's asked turn vanished (`IAutoMovieSwivelSeed.vanished`).
   */
  export function fit(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    attached: IAutoMovieHumanLimbGoal,
    placed: readonly AutoMovieHumanSide[],
    rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieSeededChainFit {
    return solveHumanLimbFit.world(
      body,
      pose,
      limb,
      attached,
      placed,
      rival,
      near,
      resolution,
      "ordinary",
    );
  }

  /*
   * Fit a limb at one sample of a continuous curve. A nearby fit supplies the
   * hinge path to continue.
   */
  export function continued(
    ...args: Parameters<typeof fit>
  ): IAutoMovieSeededChainFit {
    return solveHumanLimbFit.world(
      args[0],
      args[1],
      args[2],
      args[3],
      args[4],
      args[5],
      args[6],
      args[7],
      "continuous",
    );
  }

  /*
   * The fit of a limb's own chain in the pose and frame given, with no mirror
   * image and no reduction of the pose: what `solveHumanLimbFit` runs on the
   * reduced pose of a right limb, or of a left limb's mirror image, after
   * moving it into the frame it solves in.
   * Parameter body: The performer's body.
   * Parameter pose: The pose the chain is solved in, holding at least the records
   * the fit reads (`HumanLimbView.of`).
   * Parameter limb: The limb whose own chain is solved.
   * Parameter attached: Its goal, attached or not.
   * Parameter placed: The arms already placed.
   * Parameter rival: Where the other arm's wrist will be, while it is still to be
   * fitted.
   * Parameter near: A nearby fit of the same limb to continue; omitted, the fit is
   * solved cold.
   * Parameter resolution: Optional exact reader or lazy supplier borrowed from this
   * synchronous evaluation.
   * Parameter policy: The ordinary fit, or the owned continuous curve's current
   * hinged correction.
   * Parameter admit: Run before the fit's first forward-kinematics read, where the
   * whole pose was admitted when the fit read every joint.
   * Returns: The given pose with the limb fitted, and the seed that continues
   * it.
   */
  export function direct(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    attached: IAutoMovieHumanLimbGoal,
    placed: readonly AutoMovieHumanSide[],
    rival: IAutoMovieVector3 | undefined,
    near: IAutoMovieSwivelNear | undefined,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    policy: DirectPolicy,
    admit?: () => void,
    incumbent?: IAutoMovieSwivelSeed,
  ): IAutoMovieSeededChainFit {
    return solved(
      body,
      pose,
      limb,
      attached,
      placed,
      rival,
      near,
      resolution,
      policy === "ordinary" ? ordinary : correcting,
      admit,
      incumbent,
    );
  }

  /*
   * A plan-time query of the arc continuation: the fit `fit` gives, or null
   * where the continued arm's admitted arc vanished
   * (`IAutoMovieSwivelSeed.vanished`), so a law choosing among targets (a
   * grasp's turn, a site) keeps only those its arm reaches on one elbow path
   * from the seed it continues. One continued fit, no search beyond the fit's
   * own; every other refusal is thrown as `fit` throws it.
   * Parameter args: The arguments of `fit`; `near` is the seed continued, its
   * `admitted` arc the one to keep.
   * Returns: The fit, or null where its admitted arc vanished.
   */
  export function continues(
    ...args: Parameters<typeof fit>
  ): IAutoMovieSeededChainFit | null {
    try {
      return fit(...args);
    } catch (error) {
      if (error instanceof HumanLimbVanishedRefusal) return null;
      throw error;
    }
  }

  /*
   * The limb posed at a prescribed swivel and bend branch, with no search or
   * score (`HumanLimbAt.at`): mirrored and attached as `fit` is.
   */
  export function at(
    ...args: Parameters<typeof HumanLimbAt.at>
  ): ReturnType<typeof HumanLimbAt.at> {
    return HumanLimbAt.at(...args);
  }

  /*
   * The swivel and bend branch of a posed limb in its fits' seed frame
   * (`HumanLimbAt.seed`).
   */
  export function seed(
    ...args: Parameters<typeof HumanLimbAt.seed>
  ): ReturnType<typeof HumanLimbAt.seed> {
    return HumanLimbAt.seed(...args);
  }

  /*
   * A limb goal's mirror image (`HumanLimbMirror.goal`).
   * Parameter goal: The goal.
   * Returns: Its mirror image.
   */
  export function reflected(
    goal: IAutoMovieHumanLimbGoal,
  ): IAutoMovieHumanLimbGoal {
    return HumanLimbMirror.goal(goal);
  }

  /*
   * The chain's own solve in the pose given: the world goal, the obstruction,
   * the prepared fit and the contact re-aim.
   */
  function solved(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    limb: AutoMovieHumanLimb,
    attached: IAutoMovieHumanLimbGoal,
    placed: readonly AutoMovieHumanSide[],
    rival: IAutoMovieVector3 | undefined,
    near: IAutoMovieSwivelNear | undefined,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    read: typeof ordinary,
    admit?: () => void,
    incumbent?: IAutoMovieSwivelSeed,
  ): IAutoMovieSeededChainFit {
    const readResolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const side: AutoMovieHumanSide = limb.startsWith("left") ? "left" : "right";
    let authoredBones:
      | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
      | undefined;

    // The chain as the rig alone fixes it: placed under this pose from the
    // frame of its root's parent, which the source's one read gives, in
    // place of a second read of the whole pose with the chain left out.
    const constants: IAutoMovieMotionHumanBody["chains"][AutoMovieHumanLimb] =
      body.chains[limb];

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
          body.reads[limb][
            arm &&
            placed.some((other: AutoMovieHumanSide): boolean => other !== side)
              ? 1
              : 0
          ];
        if (attached.on === undefined || kept.requested.has(attached.on)) {
          admit?.();
          authoredBones = kept.demand.map(pose, readResolution());
        } else {
          const requested: Set<AutoMovieHumanoidBone> = new Set(
            arm
              ? HumanArmObstacleBones(
                  placed.filter(
                    (other: AutoMovieHumanSide): boolean => other !== side,
                  ),
                )
              : [],
          );
          requested.add(chain(limb).effector);
          requested.add(attached.on);
          if (constants !== undefined && constants.parent !== null)
            requested.add(constants.parent);
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
    const trunk: IAutoMovieMotionHumanColliders.IPlaced[] | null =
      limb.endsWith("Arm")
        ? HumanArmClearance.obstacles(
            body,
            readAuthored(),
            placed.filter((arm: AutoMovieHumanSide): boolean => arm !== side),
          )
        : null;
    const clear: IObstruction | undefined =
      trunk === null
        ? undefined
        : HumanArmOvershoot.prepare(
            body,
            trunk,
            side,
            // Another body's colliders and those of what no human body carries
            // (a prop, an animal) alike.
            goal.clearExternal === undefined
              ? (goal.clear ?? [])
              : [...(goal.clear ?? []), ...goal.clearExternal],
            true,
            rival,
            goal.bend,
            goal.rests ?? [],
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
        : (): ReturnType<typeof AutoMovieEngineMotionPlanting.placeChainPlant> | null => {
            const parent:
              | Pick<IAutoMovieResolvedBone, SolvedFitterParent>
              | undefined =
              constants.parent === null
                ? {
                    worldPosition: pose.root?.translation ?? {
                      x: 0,
                      y: 0,
                      z: 0,
                    },
                    worldRotation: pose.root?.rotation ?? AutoMovieEngineQuaternion.identity(),
                  }
                : readAuthored().get(constants.parent);
            return parent === undefined
              ? null
              : AutoMovieEngineMotionPlanting.placeChainPlant(constants, parent);
          },
    );
    const fitted: IAutoMovieSeededChainFit = fitHumanLimbContact(
      fitter,
      goal,
      side,
      limb.endsWith("Leg"),
      (
        point: IAutoMovieVector3,
        continued?: IAutoMovieSwivelNear,
        capture?: fitHumanLimbContact.ICapture,
      ): IAutoMovieSeededChainFit =>
        read(fitter, point, near, continued, incumbent, capture),
    );
    // A continued arm whose admitted arc vanished cannot keep the hand's
    // requested turn on its elbow path. A leg returns its solved pose and
    // seed so the caller can check the actual ankle and support constraints.
    if (
      fitted.seed?.vanished === true &&
      (limb === "leftArm" || limb === "rightArm")
    )
      throw new HumanLimbVanishedRefusal(limb);
    return fitted;
  }

  /*
   * Public near/cold fitting retains its original workspace entry and order; a
   * re-aim pass continues its first pass, prescribed where the fit's own seed
   * is.
   */
  function ordinary(
    workspace: ReturnType<typeof prepareHumanLimbFit>,
    point: IAutoMovieVector3,
    near: IAutoMovieSwivelNear | undefined,
    continued?: IAutoMovieSwivelNear,
    incumbent?: IAutoMovieSwivelSeed,
    capture?: fitHumanLimbContact.ICapture,
  ): IAutoMovieSeededChainFit {
    // A re-aim pass of a prescribed fit keeps the prescription at the swivel
    // the instant's first pass settled on: re-aiming moves the target, never
    // the swivel the course chose.
    const pass: IAutoMovieSwivelNear | undefined =
      continued !== undefined && near?.prescribed === true
        ? { ...continued, prescribed: true }
        : continued;

    // A held seed only starts a swept fit's bounded search (HumanLimbIncumbent).
    return workspace.fit(
      point,
      pass,
      pass === undefined ? incumbent : undefined,
      capture,
    );
  }

  /*
   * Continue the seed from the preceding fit stage or the supplied seed. When
   * neither is available, fit the point directly.
   */
  function correcting(
    workspace: ReturnType<typeof prepareHumanLimbFit>,
    point: IAutoMovieVector3,
    given: IAutoMovieSwivelNear | undefined,
    continued?: IAutoMovieSwivelNear,
  ): IAutoMovieSeededChainFit {
    const near: IAutoMovieSwivelNear | undefined = continued ?? given;
    if (near === undefined) return workspace.fit(point);
    return workspace.continued(point, near);
  }

  /*
   * What a limb's fit must keep clear of: the degrees a mid joint and an end
   * joint, world metres, count as out of range.
   */
  type IObstruction = (
    mid: IAutoMovieVector3,
    end: IAutoMovieVector3,
  ) => number;
}

/*
 * The alternatives of `SolvedFitterParent`'s site.
 */
type SolvedFitterParent = "worldPosition" | "worldRotation";

/*
 * The alternatives of `DirectPolicy`'s site.
 */
type DirectPolicy = "ordinary" | "continuous";
