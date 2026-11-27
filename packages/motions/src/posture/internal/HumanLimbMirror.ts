import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanEffectorPointLimit,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmMirror } from "./HumanArmMirror";

/*
 * A limb's fit seen in the median plane's mirror: the pose, the goal, the limb
 * and the side each taken to the other side, so a left limb is solved as the
 * right limb of its mirror image (`HumanLimbFit`, `solveHumanLimbFit`) and a
 * fit and its mirror are one to the bit.
 */
export namespace HumanLimbMirror {
  /*
   * A pose's mirror image in the median plane (`HumanArmMirror.mirrored`), its
   * own inverse.
   */
  export function pose(pose: IAutoMoviePose): IAutoMoviePose {
    return HumanArmMirror.mirrored({ pose, others: [] }).pose;
  }

  /*
   * One joint record's mirror image, as `pose` mirrors each of a pose's: a
   * side's record renamed to the other side with its clinical angles as they
   * are, a midline record's lateral bend and twist negated.
   * Parameter joint: The record.
   * Returns: Its mirror image, a fresh record.
   */
  export function joint(joint: IAutoMovieJointPose): IAutoMovieJointPose {
    return HumanArmMirror.mirrored({
      pose: { skeleton: "", root: null, joints: [joint] },
      others: [],
    }).pose.joints[0]!;
  }

  /*
   * A limb goal's mirror image: its points and its contact with their lateral
   * component negated (world, or local to the bone it is attached to, which a
   * median-plane mirror maps alike), its rotation mirrored, the bone it rides
   * and the colliders it keeps clear of or lies on taken to the other side. A
   * reference's clinical angles are a side's own, so the mirrored limb reads
   * them as they are.
   * Parameter goal: The goal.
   * Returns: Its mirror image.
   */
  export function goal(goal: IAutoMovieHumanLimbGoal): IAutoMovieHumanLimbGoal {
    // One reflector, so a segment the goal both clears and lies on keeps one
    // reflected shape list (`HumanArmMirror.IReflector`).
    const by: HumanArmMirror.IReflector = HumanArmMirror.reflector();
    return {
      ...goal,
      point: HumanArmMirror.flip(goal.point),
      bend: HumanArmMirror.flip(goal.bend),
      ...(goal.rotation === undefined
        ? {}
        : { rotation: HumanArmMirror.turn(goal.rotation) }),
      ...(goal.contact === undefined
        ? {}
        : { contact: HumanArmMirror.flip(goal.contact) }),
      ...(goal.limits === undefined
        ? {}
        : {
            limits: goal.limits.map(
              (
                limit: IAutoMovieHumanEffectorPointLimit,
              ): IAutoMovieHumanEffectorPointLimit => ({
                ...limit,
                contact: HumanArmMirror.flip(limit.contact),
              }),
            ),
          }),
      ...(goal.on === undefined
        ? {}
        : { on: HumanArmMirror.opposite(goal.on) }),
      ...(goal.clear === undefined
        ? {}
        : { clear: goal.clear.map(by.reflected) }),
      ...(goal.clearExternal === undefined
        ? {}
        : { clearExternal: goal.clearExternal.map(
            (
              external: NonNullable<IAutoMovieHumanLimbGoal["clearExternal"]>[number],
            ): NonNullable<IAutoMovieHumanLimbGoal["clearExternal"]>[number] =>
              by.framed(external),
          ) }),
      ...(goal.rests === undefined
        ? {}
        : { rests: goal.rests.map(by.reflected) }),
      ...(goal.clearanceOn === undefined
        ? {}
        : {
            clearanceOn: {
              clear: goal.clearanceOn.clear.map(by.reflected),
              rests: goal.clearanceOn.rests.map(by.reflected),
            },
          }),
    };
  }

  /*
   * The same limb on the other side.
   */
  export function limb(limb: AutoMovieHumanLimb): AutoMovieHumanLimb {
    return (
      limb.startsWith("left") ? `right${limb.slice(4)}` : `left${limb.slice(5)}`
    ) as AutoMovieHumanLimb;
  }

  /*
   * The other side.
   */
  export function side(side: AutoMovieHumanSide): AutoMovieHumanSide {
    return side === "left" ? "right" : "left";
  }
}
