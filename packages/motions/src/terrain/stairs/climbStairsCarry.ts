import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieMotionHumanChannel, IAutoMovieBodyMeasure, IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanEntryState, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPropReader, IAutoMovieMotionHumanSupportCarry, IAutoMovieQuaternion, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { HumanSupportCarry } from "../../carrier/internal/HumanSupportCarry";
import { PreparedHumanIntervals } from "../../perform/internal/PreparedHumanIntervals";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { ClimbStairsCarryData } from "./internal/ClimbStairsCarryData";

/*
 * A flight climbed onto a moving prop, carried footprint by footprint: the
 * climb is planned in the world as the prop stood at its start, a foot on a
 * floor print stays where it stands in the world, and a foot on a tread aims at
 * where the tread will be at its touchdown and is carried by the prop from then
 * on, a swing passing from the one carry to the other on a minimum-jerk weight.
 * The root and the heading pass from the floor's stillness to the prop's carry
 * as the weight passes onto it, from the first tread touchdown to the last
 * floor print's lift.
 * Parameter context: The action's context.
 * Parameter plan: The climb planned in the world at the start.
 * Parameter prop: The moving prop the flight belongs to.
 * Returns: The carried plan.
 */
export function climbStairsCarry(
  context: climbStairsCarry.IContext,
  plan: IAutoMovieMotionHumanActionPlan,
  prop: string,
): IAutoMovieMotionHumanActionPlan {
  const frame: (seconds: number) => IAutoMovieRigidTransform = (
    seconds: number,
  ): IAutoMovieRigidTransform => context.prop(prop).frame(seconds);
  const duration: number = plan.duration;
  const plants: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanContactWindow[]
  > = {
    left: footPlants(plan.contacts, "leftFoot"),
    right: footPlants(plan.contacts, "rightFoot"),
  };
  const closing = (
    list: readonly IAutoMovieMotionHumanContactWindow[],
  ): number[] => {
    let last: number = -Infinity;
    return list.map((window: IAutoMovieMotionHumanContactWindow): number => {
      last = Math.max(last, window.to);
      return last;
    });
  };
  const endings: Record<AutoMovieHumanSide, number[]> = {
    left: closing(plants.left),
    right: closing(plants.right),
  };
  const onProp: (w: IAutoMovieMotionHumanContactWindow) => boolean = (
    w: IAutoMovieMotionHumanContactWindow,
  ): boolean => w.support.kind === "prop" && w.support.subject === prop;
  // The prop's carry of a plan-start point to a second, from the later of
  // that second and a touchdown.
  const carried: (
    at: number,
    down: number,
  ) => IAutoMovieMotionHumanSupportCarry.ICarry = (
    at: number,
    down: number,
  ): IAutoMovieMotionHumanSupportCarry.ICarry =>
    HumanSupportCarry(frame, context.start, context.start + Math.max(at, down));
  const borne: (
    w: IAutoMovieMotionHumanContactWindow,
    at: number,
  ) => IAutoMovieMotionHumanSupportCarry.ICarry = (
    w: IAutoMovieMotionHumanContactWindow,
    at: number,
  ): IAutoMovieMotionHumanSupportCarry.ICarry =>
    onProp(w) ? carried(at, w.from * duration) : ClimbStairsCarryData.STILL;
  const footCarry: (
    side: AutoMovieHumanSide,
    at: number,
    anchor: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanSupportCarry.ICarry = (
    side: AutoMovieHumanSide,
    at: number,
    anchor: IAutoMovieVector3,
  ): IAutoMovieMotionHumanSupportCarry.ICarry => {
    const list: IAutoMovieMotionHumanContactWindow[] = plants[side];
    if (list.length === 0) return ClimbStairsCarryData.STILL;
    const share: number = at / duration;
    const end: number[] = endings[side];
    const k: number = PreparedHumanIntervals.lowerBound(
      end.length,
      (index: number): number => end[index]!,
      share,
    );
    if (k === list.length) return borne(list[k - 1]!, at);
    const next: IAutoMovieMotionHumanContactWindow = list[k]!;
    if (k === 0 || share >= next.from) return borne(next, at);
    const before: IAutoMovieMotionHumanContactWindow = list[k - 1]!;
    return HumanSupportCarry.blend(
      borne(before, at),
      borne(next, at),
      anchor,
      AutoMovieEngineMotionSampling.minimumJerkShare((share - before.to) / (next.from - before.to)),
    );
  };
  // The weight passes onto the prop from the first tread touchdown to the
  // last floor print's lift.
  const all: IAutoMovieMotionHumanContactWindow[] = [
    ...plants.left,
    ...plants.right,
  ];
  const first: number = Math.min(
    1,
    ...all
      .filter(onProp)
      .map((w: IAutoMovieMotionHumanContactWindow): number => w.from),
  );
  const last: number = Math.max(
    first,
    ...all
      .filter((w: IAutoMovieMotionHumanContactWindow): boolean => !onProp(w))
      .map((w: IAutoMovieMotionHumanContactWindow): number => w.to),
  );
  const leg: (
    goal: IAutoMovieHumanLimbGoal,
    carry: IAutoMovieMotionHumanSupportCarry.ICarry,
  ) => IAutoMovieHumanLimbGoal = (
    goal: IAutoMovieHumanLimbGoal,
    carry: IAutoMovieMotionHumanSupportCarry.ICarry,
  ): IAutoMovieHumanLimbGoal => {
    if (goal.on !== undefined) return goal;
    const rotation: IAutoMovieQuaternion | undefined = goal.rotation;
    return {
      ...goal,
      point: carry.point(goal.point),
      bend: carry.point(goal.bend),
      ...(rotation === undefined
        ? {}
        : {
            rotation: AutoMovieEngineQuaternion.normalize(
              AutoMovieEngineQuaternion.multiply(carry.turn, rotation),
            ),
          }),
    };
  };
  const { still: _still, legsStill: _legsStill, ...moving } = plan;
  return {
    ...moving,
    posture: (
      seconds: number,
      channels?: readonly AutoMovieMotionHumanChannel[],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const at: number = Math.max(0, Math.min(duration, seconds));
      const made: IAutoMovieMotionHumanPosture = plan.posture(
        seconds,
        channels,
        resolution,
        projection,
      );
      const share: number = at / duration;
      const weight: number =
        last > first
          ? AutoMovieEngineMotionSampling.minimumJerkShare(
              Math.max(0, Math.min(1, (share - first) / (last - first))),
            )
          : share >= first
            ? 1
            : 0;
      // The root moves with the weight onto the prop; the trunk turns with it
      // only once the floor foot has lifted, so a planted floor leg is not
      // twisted under a trunk the disc turns.
      const turning: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.max(0, Math.min(1, (share - last) / Math.max(1e-9, 1 - last))),
      );
      const now: IAutoMovieMotionHumanSupportCarry.ICarry = carried(at, 0);
      const moved: IAutoMovieMotionHumanSupportCarry.ICarry =
        HumanSupportCarry.blend(ClimbStairsCarryData.STILL, now, made.root, weight);
      const turned: IAutoMovieMotionHumanSupportCarry.ICarry =
        HumanSupportCarry.blend(ClimbStairsCarryData.STILL, now, made.root, turning);
      const anchor: IAutoMovieVector3 = moved.point(made.root);
      const body: IAutoMovieMotionHumanSupportCarry.ICarry = {
        point: (p: IAutoMovieVector3): IAutoMovieVector3 =>
          AutoMovieEngineVector3.add(
            anchor,
            AutoMovieEngineQuaternion.rotateVector(
              turned.turn,
              AutoMovieEngineVector3.subtract(p, made.root),
            ),
          ),
        turn: turned.turn,
        yaw: turned.yaw,
      };
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      for (const limb of ClimbStairsCarryData.LIMBS) {
        const goal: IAutoMovieHumanLimbGoal | undefined = made.limbs[limb];
        if (goal === undefined) continue;
        limbs[limb] =
          limb === "leftLeg" || limb === "rightLeg"
            ? leg(
                goal,
                footCarry(
                  limb === "leftLeg" ? "left" : "right",
                  at,
                  goal.point,
                ),
              )
            : leg(goal, body);
      }
      return {
        ...made,
        root: body.point(made.root),
        yaw: made.yaw + body.yaw,
        limbs,
      };
    },
  };
}

/*
 * Companions of climbStairsCarry.
 */
export namespace climbStairsCarry {
  /*
   * What the carry reads of an action's context: its start and its props'
   * frames.
   */
  export interface IContext {
    /*
     * The action's film start, seconds.
     */
    start: number;

    /*
     * A prop's frame reader by subject.
     */
    prop: (subject: string) => Pick<IAutoMovieMotionHumanPropReader, "frame">;
  }

  /*
   * What `boarded` reads: the entry ankles and the ankle's own height.
   */
  export interface IBoarding {
    /*
     * The entry's feet.
     */
    entry: {
      /*
       * Each foot's ankle.
       */
      feet: Record<
        AutoMovieHumanSide,
        Pick<IAutoMovieMotionHumanEntryState.IFoot, "ankle">
      >;
    };

    /*
     * The body's ankle height.
     */
    body: { measure: Pick<IAutoMovieBodyMeasure, "ankleHeight"> };
  }

  /*
   * Whether the body already stands on the moving prop at the climb's start, a
   * rider on an escalator's steps rather than one boarding from the floor: its
   * feet stand raised off the world floor, which only the prop beneath them
   * holds up.
   * Parameter context: The action's context.
   * Returns: Whether the feet stand above the world floor.
   */
  export function boarded(context: IBoarding): boolean {
    return (["left", "right"] as const).every(
      (side: AutoMovieHumanSide): boolean =>
        context.entry.feet[side].ankle.y >
        context.body.measure.ankleHeight + FLOOR,
    );
  }

  /*
   * How far above the world floor a standing ankle's own height may lie and
   * still stand on it, metres (provisional: a sole's give).
   */
  const FLOOR: number = 0.02;
}

/*
 * A foot's plant windows, in order.
 */
function footPlants(
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
  part: IAutoMovieMotionHumanContactWindow["part"],
): IAutoMovieMotionHumanContactWindow[] {
  return contacts
    .filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.part === part && w.kind === "plant",
    )
    .sort(
      (
        a: IAutoMovieMotionHumanContactWindow,
        b: IAutoMovieMotionHumanContactWindow,
      ): number => a.from - b.from,
    );
}
