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
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmObstacleBones } from "./HumanArmObstacleBones";
import { HumanArmOvershoot } from "./HumanArmOvershoot";
import { HumanLimbAt } from "./HumanLimbAt";
import { HumanLimbMirror } from "./HumanLimbMirror";
import { fitHumanLimbContact } from "./fitHumanLimbContact";
import { poseBones } from "./poseBones";
import { prepareHumanLimbFit } from "./prepareHumanLimbFit";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import { solveHumanLimbFit } from "./solveHumanLimbFit";

/**
 * The fit of one limb onto its goal, which `resolveHumanPosture` runs for
 * each limb after the trunk: the goal carried into the world by the bone
 * it is attached to, the engine's two-bone fit clear of the trunk and the
 * other arm, and the end joint re-aimed so a contact stays put. Every fit is
 * solved from its own inputs; nothing is remembered between fits.
 */
export namespace HumanLimbFit {
  /**
   * The engine's three required mutable bone identities: upper, lower and
   * effector. `chain` chooses their Human names from the limb's side and kind.
   */
  export type IChain = IAutoMoviePlantChain;

  /**
   * The chain of a limb.
   *
   * @param limb The limb.
   * @returns Its three bones.
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
    const own: IChain = chain(limb);
    if (on === own.upper || on === own.lower || on === own.effector)
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
    const { on: _attached, clearanceOn, ...rest }: IAutoMovieHumanLimbGoal = goal;
    const collider: (segment: IAutoMovieMotionHumanColliders.IPlaced) => IAutoMovieMotionHumanColliders.IPlaced = (segment: IAutoMovieMotionHumanColliders.IPlaced): IAutoMovieMotionHumanColliders.IPlaced => ({
      ...segment,
      pose: {
        position: place(segment.pose.position),
        rotation: Quaternion.normalize(Quaternion.multiply(frame.worldRotation, segment.pose.rotation)),
      },
    });
    return {
      ...rest,
      point: place(goal.point),
      bend: place(goal.bend),
      ...(clearanceOn === undefined ? {} : {
        clear: [...(rest.clear ?? []), ...clearanceOn.clear.map(collider)],
        rests: [...(rest.rests ?? []), ...clearanceOn.rests.map(collider)],
      }),
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
   */
  export function fit(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, limb: AutoMovieHumanLimb, attached: IAutoMovieHumanLimbGoal,
    placed: readonly ("left" | "right")[], rival?: IAutoMovieVector3, near?: IAutoMovieSwivelNear,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieSeededChainFit {
    return solveHumanLimbFit.world(body, pose, limb, attached, placed, rival, near, resolution, "ordinary");
  }

  /**
   * Fit a constructor-owned continuous curve through current hinged correction.
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
   */
  export function direct(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, limb: AutoMovieHumanLimb, attached: IAutoMovieHumanLimbGoal,
    placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined, near: IAutoMovieSwivelNear | undefined,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0], policy: "ordinary" | "continuous",
    admit?: () => void, incumbent?: IAutoMovieSwivelSeed): IAutoMovieSeededChainFit {
    return solved(body, pose, limb, attached, placed, rival, near, resolution,
      policy === "ordinary" ? ordinary : correcting, admit, incumbent);
  }

  /** The chain's own solve in the pose given: the world goal, the obstruction, the prepared fit and the contact re-aim. */
  function solved(body: IAutoMovieMotionHumanBody, pose: IAutoMoviePose, limb: AutoMovieHumanLimb, attached: IAutoMovieHumanLimbGoal,
    placed: readonly ("left" | "right")[], rival: IAutoMovieVector3 | undefined, near: IAutoMovieSwivelNear | undefined,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0], read: typeof ordinary,
    admit?: () => void, incumbent?: IAutoMovieSwivelSeed): IAutoMovieSeededChainFit {
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
      (point: IAutoMovieVector3, continued?: IAutoMovieSwivelNear, capture?: fitHumanLimbContact.ICapture): IAutoMovieSeededChainFit =>
        read(fitter, point, near, continued, incumbent, capture));
  }

  /**
   * The limb posed at a prescribed swivel and bend branch, with no search or
   * score (`HumanLimbAt.at`): mirrored and attached as `fit` is.
   */
  export function at(...args: Parameters<typeof HumanLimbAt.at>): ReturnType<typeof HumanLimbAt.at> {
    return HumanLimbAt.at(...args);
  }

  /**
   * The swivel and bend branch of a posed limb in its fits' seed frame
   * (`HumanLimbAt.seed`).
   */
  export function seed(...args: Parameters<typeof HumanLimbAt.seed>): ReturnType<typeof HumanLimbAt.seed> {
    return HumanLimbAt.seed(...args);
  }

  /**
   * A limb goal's mirror image (`HumanLimbMirror.goal`).
   *
   * @param goal The goal.
   * @returns Its mirror image.
   */
  export function reflected(goal: IAutoMovieHumanLimbGoal): IAutoMovieHumanLimbGoal {
    return HumanLimbMirror.goal(goal);
  }

  /** Public near/cold fitting retains its original workspace entry and order; a re-aim pass continues its first pass, prescribed where the fit's own seed is. */
  function ordinary(workspace: ReturnType<typeof prepareHumanLimbFit>, point: IAutoMovieVector3,
    near: IAutoMovieSwivelNear | undefined, continued?: IAutoMovieSwivelNear,
    incumbent?: IAutoMovieSwivelSeed, capture?: fitHumanLimbContact.ICapture): IAutoMovieSeededChainFit {
    // A re-aim pass of a prescribed fit keeps the prescription at the swivel
    // the instant's first pass settled on: re-aiming moves the target, never
    // the swivel the course chose.
    const pass: IAutoMovieSwivelNear | undefined =
      continued !== undefined && near?.prescribed === true ? { ...continued, prescribed: true } : continued;

    // A held seed only starts a swept fit's bounded search (HumanLimbIncumbent).
    return workspace.fit(point, pass, pass === undefined ? incumbent : undefined, capture);
  }

  /** Only the actual continuous-curve constructor selects current hinged correction. */
  function correcting(workspace: ReturnType<typeof prepareHumanLimbFit>, point: IAutoMovieVector3,
    given: IAutoMovieSwivelNear | undefined, continued?: IAutoMovieSwivelNear): IAutoMovieSeededChainFit {
    const near: IAutoMovieSwivelNear | undefined = continued ?? given;
    if (near === undefined) return workspace.fit(point);
    return workspace.continued(point, near);
  }

  /** What a limb's fit must keep clear of: the degrees a mid joint and an end joint, world metres, count as out of range. */
  type IObstruction = (
    mid: IAutoMovieVector3,
    end: IAutoMovieVector3,
  ) => number;
}
