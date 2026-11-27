import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanElbowPole } from "../../compose/internal/AutoMovieMotionHumanElbowPole";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanHandShape } from "../../posture/internal/HumanHandShape";
import { HumanHandTarget } from "../../posture/internal/HumanHandTarget";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { GymnasticsPalmRise } from "./GymnasticsPalmRise";
import { layGymnasticsWheelFoot } from "./layGymnasticsWheelFoot";
import { solveGymnasticsLaidArm } from "./solveGymnasticsLaidArm";

/*
 * The writer of a wheel's bearing limbs.
 * Parameter body: The body.
 * Parameter contacts: The wheel's bearing windows, shares of the duration.
 * Parameter duration: The action's seconds.
 * Parameter carried: The wheel's rigid posture at an action second.
 * Parameter fingers: The laid fingers' directions on the floor, by the hands' order
 * of contact.
 * Returns: A writer of the laid limbs into a carried posture at a second.
 */
export function GymnasticsWheelPlants(
  body: IAutoMovieMotionHumanBody,
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
  duration: number,
  carried: (seconds: number) => IAutoMovieMotionHumanPosture,
  fingers: GymnasticsWheelPlants.IFingers,
): (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
) => IAutoMovieMotionHumanPosture {
  const end: (
    posture: IAutoMovieMotionHumanPosture,
    bone: AutoMovieHumanoidBone,
  ) => IAutoMovieResolvedBone = (
    posture: IAutoMovieMotionHumanPosture,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieResolvedBone =>
    poseBones(
      body,
      resolveHumanPosture(body, { ...posture, limbs: {} }),
      undefined,
      new Set([bone]),
    ).get(bone)!;
  const firstHand: number = contacts.findIndex(
    (c: IAutoMovieMotionHumanContactWindow): boolean =>
      c.part === "leftHand" || c.part === "rightHand",
  );
  const laid: ILaid[] = contacts.flatMap(
    (c: IAutoMovieMotionHumanContactWindow, index: number): ILaid[] => {
      if (
        c.part !== "leftFoot" &&
        c.part !== "rightFoot" &&
        c.part !== "leftHand" &&
        c.part !== "rightHand"
      )
        return [];
      const bone: AutoMovieHumanoidBone = c.part;
      const side: AutoMovieHumanSide = c.part.startsWith("left")
        ? "left"
        : "right";
      const hand: boolean = c.part.endsWith("Hand");
      const from: number = c.from * duration;
      const down: IAutoMovieResolvedBone = end(carried(from), bone);
      const along: IAutoMovieVector3 =
        index === firstHand ? fingers.first : fingers.second;
      const window: Omit<ILaid, "goal"> = {
        bone,
        side,
        hand,
        from,
        to: c.to * duration,
        opens: c.from <= 0,
        closes: c.to >= 1,
        fingers: along,
        ...(typeof c.socket === "object" ? { edge: c.socket } : {}),
      };
      if (hand) {
        const target: ReturnType<typeof HumanHandTarget.prepareGoal> =
          HumanHandTarget.prepareGoal(body, side, {
            surface: "palm",
            shape: "flat",
          });
        const point: IAutoMovieVector3 = {
          x: down.worldPosition.x,
          y: 0,
          z: down.worldPosition.z,
        };
        return [
          {
            ...window,
            goal: (
              posture: IAutoMovieMotionHumanPosture,
            ): IAutoMovieHumanLimbGoal =>
              target(posture, { point, normal: { x: 0, y: 1, z: 0 } }, along),
          },
        ];
      }
      // The foot bears on its ball and rolls onto its edge
      // (`layGymnasticsWheelFoot`).
      return [
        {
          ...window,
          goal: layGymnasticsWheelFoot(
            body,
            side,
            down,
            carried(from).yaw,
            typeof c.socket === "object" ? c.socket : undefined,
          ),
        },
      ];
    },
  );
  const flat: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanPosture["joints"]
  > = {
    left: HumanHandShape("left", "flat"),
    right: HumanHandShape("right", "flat"),
  };
  const lead: number = Math.max(1e-9, GymnasticsWheelPlants.LEAD * duration);

  // A window's weight: 1 while it bears, eased in over the lead before it
  // and out over the lead after, 0 elsewhere.
  const weight = (l: ILaid, seconds: number): number => {
    const before: number = l.opens ? -Infinity : l.from - lead;
    const after: number = l.closes ? Infinity : l.to + lead;
    if (seconds <= before || seconds >= after) return 0;
    if (seconds < l.from) return AutoMovieEngineMotionSampling.minimumJerkShare((seconds - before) / lead);
    if (seconds > l.to) return 1 - AutoMovieEngineMotionSampling.minimumJerkShare((seconds - l.to) / lead);
    return 1;
  };
  // Each window's laid limb is solved once per key over its write interval.
  const step: number = lead / GymnasticsWheelPlants.KEYS;
  const start = (l: ILaid): number =>
    l.opens ? l.from : Math.max(0, l.from - lead);
  const last = (l: ILaid): number =>
    l.closes ? l.to : Math.min(duration, l.to + lead);
  const solve = (l: ILaid, at: number): IKeyed => {
    const posture: IAutoMovieMotionHumanPosture = carried(at);
    {
      const key: AutoMovieHumanLimb = l.hand
        ? l.side === "left"
          ? "leftArm"
          : "rightArm"
        : l.side === "left"
          ? "leftLeg"
          : "rightLeg";
      const middle: AutoMovieHumanoidBone = l.hand
        ? `${l.side}LowerArm`
        : `${l.side}LowerLeg`;
      // The elbow or the knee kept where the carried shape holds it, so the
      // laid limb takes the same branch as the carried one. A straight
      // arm's elbow lies on the line from the shoulder to the hand and
      // names no side, so its pole is pushed out along the olecranon: the
      // way the elbow goes as the arm bends, opposite to where an elbow
      // flexion carries the hand.
      const free: IAutoMovieMotionHumanPosture = { ...posture, limbs: {} };
      const shown: IAutoMoviePose = resolveHumanPosture(body, free);
      const carriedBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(
          body,
          shown,
          undefined,
          new Set<AutoMovieHumanoidBone>([
            l.bone,
            middle,
            ...(l.hand
              ? ([
                  l.side === "left" ? "leftUpperArm" : "rightUpperArm",
                  l.side === "left"
                    ? "leftMiddleProximal"
                    : "rightMiddleProximal",
                ] as const)
              : []),
          ]),
        );
      const carriedEnd: IAutoMovieResolvedBone = carriedBones.get(l.bone)!;
      const elbow: IAutoMovieVector3 = carriedBones.get(middle)!.worldPosition;
      const bend: IAutoMovieVector3 = l.hand
        ? AutoMovieMotionHumanElbowPole(
            body,
            free,
            middle,
            l.bone,
            carriedEnd.worldPosition,
            elbow,
          )
        : elbow;
      // A palm whose wrist cannot extend so far rises about its knuckles;
      // the laid fingers are straight, extended at the knuckles by the rise.
      const risen: GymnasticsPalmRise.IRise = l.hand
        ? GymnasticsPalmRise(
            l.side,
            { ...l.goal(posture), bend },
            carriedBones.get(
              l.side === "left" ? "leftUpperArm" : "rightUpperArm",
            )!.worldPosition,
            GymnasticsPalmRise.knuckle(
              carriedEnd,
              carriedBones.get(
                l.side === "left"
                  ? "leftMiddleProximal"
                  : "rightMiddleProximal",
              )!,
            ),
            l.fingers,
          )
        : { goal: { ...l.goal(posture), bend }, joints: {} };
      // A laid foot stays the leg's goal, held by the planted leg's own fit
      // (its contact re-aim and heel rocker). A heel raised about the ball
      // pitches the toes down with the foot; they extend at their joint by
      // as much, so they stay on the floor (`HumanFoot.heelOff`).
      if (!l.hand)
        return {
          end: carriedEnd,
          goal: risen.goal,
          toes:
            risen.goal.rotation === undefined
              ? 0
              : Math.max(0, -HumanFoot.pitch(risen.goal.rotation)),
          joints: new Map(),
        };
      return {
        end: carriedEnd,
        toes: 0,
        joints: solveGymnasticsLaidArm(body, posture, shown, key, risen.goal, {
          ...flat[l.side],
          ...risen.joints,
        }),
      };
    }
  };
  const windows: readonly IPrepared[] = laid.map(
    (window: ILaid): IPrepared => ({
      ...window,
      at: GymnasticsWheelPlants.prepareWindow(
        start(window),
        last(window),
        step,
        (at: number): IKeyed => solve(window, at),
      ),
    }),
  );
  return (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    // Each limb follows its heaviest window: two windows of one limb meet
    // only where one eases out as the other eases in.
    const heaviest: Map<AutoMovieHumanoidBone, IWeighted> = new Map();
    for (const l of windows) {
      const w: number = weight(l, seconds);
      if (!(w > 0)) continue;
      const kept: IWeighted | undefined = heaviest.get(l.bone);
      if (kept === undefined || w > kept.weight)
        heaviest.set(l.bone, { laid: l, weight: w });
    }
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    for (const { laid: l, weight: w } of heaviest.values()) {
      // The two keys around the second and the share between them.
      const [a, b, u] = l.at(seconds);
      if (!l.hand) {
        // A laid foot eased from the carried foot over the lead. Between
        // two keys a foot bearing on an edge turns about that edge, so the
        // point it bears on holds; another foot's ankle is interpolated.
        const ra: IAutoMovieHumanLimbGoal["rotation"] = a.goal!.rotation;
        const rb: IAutoMovieHumanLimbGoal["rotation"] = b.goal!.rotation;
        const turned: IAutoMovieHumanLimbGoal["rotation"] =
          ra === undefined || rb === undefined
            ? undefined
            : AutoMovieEngineQuaternion.slerp(ra, rb, u);
        const goal: IAutoMovieHumanLimbGoal = {
          ...a.goal!,
          point:
            l.edge === undefined ||
            ra === undefined ||
            rb === undefined ||
            turned === undefined
              ? AutoMovieEngineVector3.lerp(a.goal!.point, b.goal!.point, u)
              : AutoMovieEngineVector3.subtract(
                  AutoMovieEngineVector3.lerp(
                    AutoMovieEngineVector3.add(
                      a.goal!.point,
                      AutoMovieEngineQuaternion.rotateVector(ra, l.edge),
                    ),
                    AutoMovieEngineVector3.add(
                      b.goal!.point,
                      AutoMovieEngineQuaternion.rotateVector(rb, l.edge),
                    ),
                    u,
                  ),
                  AutoMovieEngineQuaternion.rotateVector(turned, l.edge),
                ),
          ...(turned === undefined ? {} : { rotation: turned }),
        };
        const end: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
          a.end.worldPosition,
          b.end.worldPosition,
          u,
        );
        limbs[l.side === "left" ? "leftLeg" : "rightLeg"] =
          w >= 1
            ? goal
            : {
                ...goal,
                point: AutoMovieEngineVector3.lerp(end, goal.point, w),
                ...(goal.rotation === undefined
                  ? {}
                  : {
                      rotation: AutoMovieEngineQuaternion.slerp(
                        AutoMovieEngineQuaternion.slerp(
                          a.end.worldRotation,
                          b.end.worldRotation,
                          u,
                        ),
                        goal.rotation,
                        w,
                      ),
                    }),
              };
        const toes: number = (a.toes + (b.toes - a.toes) * u) * w;
        if (toes > 0) joints[`${l.side}Toes`] = [toes, 0, 0];
        continue;
      }
      // A laid arm is written as joints: the keyed solve's, each joint on
      // its rotation between the two keys, and at the ends from the
      // carried angle toward it, so no later fit of a goal chooses another
      // turn of the arm.
      for (const bone of new Set([...a.joints.keys(), ...b.joints.keys()])) {
        const carriedAngle: readonly [number, number, number] = posture.joints[
          bone
        ] ?? [0, 0, 0];
        const to: readonly [number, number, number] = blendHumanJoint(
          body,
          bone,
          a.joints.get(bone) ?? carriedAngle,
          b.joints.get(bone) ?? carriedAngle,
          u,
        );
        joints[bone] =
          w >= 1 ? to : blendHumanJoint(body, bone, carriedAngle, to, w);
      }
      delete limbs[l.side === "left" ? "leftArm" : "rightArm"];
    }
    return { ...posture, joints, limbs };
  };
}

/*
 * The bearing limbs of a wheel (`GymnasticsWheel`): a rigid turn carries the
 * hands and feet with the shape, so a joint that bears would turn about itself
 * and its sole or palm would lift, skate or pass into the floor. While a spoke
 * bears, its limb is solved to a laid place fixed where it came down: a foot
 * flat on its ankle's point at its own heading, a palm flat on the floor under
 * its wrist with the fingers straight. The hands are set in the T-shape
 * gymnasts are coached to and that loads the wrists and elbows least (Farana,
 * Irwin, Jandacka, Uchytil and Mullineaux 2014, Sports Biomechanics
 * 13(2):123-134; Farana et al. 2018, European Journal of Sport Science
 * 18(10):1375-1381): the first hand's fingers point along the travel, the
 * second's turned a quarter, toward the way the body faced, so neither forearm
 * stands at the end of its turn.
 *
 * Over `LEAD` of the action at each end the limb moves from the carried pose to
 * the laid one and back, blended in joint space as a skeletal control's weight
 * blends its solved chain with the input pose (each joint on its rotation,
 * `blendHumanJoint`): the solve of the laid place is the end at full weight and
 * the carried joints the end at none, so a contact taken or left mid-turn
 * neither jumps nor makes the solver choose a turn of the arm the carried pose
 * does not have. A laid arm's elbow keeps the carried one's side, a straight
 * arm's pushed out along its olecranon (`AutoMovieMotionHumanElbowPole`), so
 * the solve has a side to bend to.
 */
export namespace GymnasticsWheelPlants {
  /*
   * A prepared bracket of two solutions and the share toward its end.
   */
  export type Window<Key> = (seconds: number) => readonly [Key, Key, number];

  /*
   * Solve only the finite interval: the opening, its interior knots at the
   * requested spacing, and the exact close. The shortened last interval
   * interpolates over its own length. Reads clamp to the prepared ends.
   */
  export function prepareWindow<Key>(
    first: number,
    last: number,
    step: number,
    solve: (seconds: number) => Key,
  ): Window<Key> {
    const keys: { at: number; value: Key }[] = [];
    const count: number = Math.ceil((last - first) / step);
    for (let i: number = 0; i < count; ++i) {
      const at: number = first + i * step;
      if (at >= last) break;
      keys.push({ at, value: solve(at) });
    }
    const closed: Key = solve(last);
    if (keys.length === 0) return () => [closed, closed, 0];
    keys.push({ at: last, value: closed });
    const opened: Key = keys[0]!.value;
    return (seconds: number): readonly [Key, Key, number] => {
      if (seconds <= first) return [opened, opened, 0];
      if (seconds >= last) return [closed, closed, 0];
      const previous: number = Math.min(
        keys.length - 2,
        Math.floor((seconds - first) / step),
      );
      const a = keys[previous]!;
      const b = keys[previous + 1]!;
      const share: number = Math.min(
        1,
        Math.max(0, (seconds - a.at) / (b.at - a.at)),
      );
      return share === 0
        ? [a.value, a.value, 0]
        : share === 1
          ? [b.value, b.value, 0]
          : [a.value, b.value, share];
    };
  }

  /*
   * The share of the action over which a limb takes its laid place before its
   * contact and leaves it after, provisional.
   */
  export const LEAD: number = 0.06;

  /*
   * The directions the laid fingers point along the floor, unit vectors.
   */
  export interface IFingers {
    /*
     * The first hand down: along the travel.
     */
    first: IAutoMovieVector3;

    /*
     * The second hand down: a quarter turn from the first, toward the way the
     * body faced.
     */
    second: IAutoMovieVector3;
  }

  /*
   * How many keys a lead holds: a window's laid limb is solved at keys this far
   * apart and read between them.
   */
  export const KEYS: number = 16;
}

/*
 * One bearing window with its laid place.
 */
interface ILaid {
  /*
   * The bearing bone.
   */
  bone: AutoMovieHumanoidBone;

  /*
   * Its side.
   */
  side: AutoMovieHumanSide;

  /*
   * Whether a hand.
   */
  hand: boolean;

  /*
   * The window's first and last action seconds.
   */
  from: number;
  to: number;

  /*
   * Whether it begins with the action or ends with it, so takes no blend there.
   */
  opens: boolean;
  closes: boolean;

  /*
   * The laid fingers' direction, for a hand.
   */
  fingers: IAutoMovieVector3;

  /*
   * The forefoot edge a foot's window declares held, in the foot's rest frame;
   * none when it bears flat.
   */
  edge?: IAutoMovieVector3;

  /*
   * The laid limb goal, given the posture it is written into.
   */
  goal(posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal;
}

/*
 * A window's weight at a second.
 */
interface IWeighted {
  /*
   * The window.
   */
  laid: IPrepared;

  /*
   * Its weight, in (0, 1].
   */
  weight: number;
}

/*
 * The bearing window with its finite, completed set of laid solves.
 */
interface IPrepared extends ILaid {
  /*
   * Read the two surrounding solved states and their interpolation share.
   */
  at: GymnasticsWheelPlants.Window<IKeyed>;
}

/*
 * One window's laid limb solved at one key second, from the carried posture
 * there.
 */
interface IKeyed {
  /*
   * The carried end joint's place and turn.
   */
  end: IAutoMovieResolvedBone;

  /*
   * A foot's laid goal; none for a hand.
   */
  goal?: IAutoMovieHumanLimbGoal;

  /*
   * A foot's toes extension; zero for a hand.
   */
  toes: number;

  /*
   * A hand's laid arm and fingers: the joints the laid solve changes.
   */
  joints: Map<AutoMovieHumanoidBone, readonly [number, number, number]>;
}
