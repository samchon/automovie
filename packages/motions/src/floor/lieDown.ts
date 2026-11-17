import type { AutoMovieMotionHumanActionName, IAutoMovieMotionClock, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanJoints, IAutoMovieMotionHumanLieDown, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPrimitive, IAutoMovieMotionManner, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";
import { stand } from "../actions/stand";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanHand } from "../posture/HumanHand";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { floorEntry } from "./floorEntry";
import { floorSeat } from "./floorSeat";

/**
 * Lying down on the floor from standing into a position: supine, prone, or
 * on the left or right side. Entered on the knees or crouched over the
 * hands, as a crawl ends, the body goes from the posture it displays
 * through the route's postures after the kneel; any other base is refused (`floorEntry`).
 *
 * The movement passes through the floor postures people use to get down
 * (VanSant 1988, Phys Ther 68:185, codes the components of the reverse
 * rise): to lie on the back the body sits down onto the floor and rolls back;
 * to lie face down it kneels, goes onto hands and knees and lowers itself
 * forward; to lie on a side it lies on its back and rolls onto that side.
 * Each posture is a set of joint angles and a whole-body tilt (`POSES`,
 * provisional), passed through in joint space on minimum-jerk progress. At
 * every second the body rests on the floor: the root's height puts the
 * lowest point of the body's collision shapes on it (`knockdown.rest`), and
 * the pelvis stays over the place it stood on, so the body pivots about it.
 * Each phase takes `PHASE` seconds (provisional), scaled by the manner's
 * tempo; the position is then held `hold` seconds. Events: `getDown` at
 * the start, the arrival at each posture on the route (`seatContact`,
 * `kneeContact`, `handsDown`, `supine`, `prone`, `lateral`) and `settled`.
 *
 * Not yet: lying on a bed or a sofa (A2 support frames, A8 `surface`), the
 * recovery position, sleep with seeded position changes (Skarpsno et al.
 * 2017; De Koninck et al. 1992), rolling over and rising from a bed; the
 * feet are not planted while the body goes down, so they slide.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the routes with their source, the floor rule, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of one whole-body row over key postures on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the postures and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The floor height is read from each body's shapes.
 */
export namespace lieDown {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "lieDown";

  /** Cancel table: the lying body is cut only once settled. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    crawl: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.4 },
    ],
  };

  /** Seconds of each phase (provisional). */
  export const PHASE: number = 1.2;

  /** The upper leg's adduction onto the lower one when lying on a side, degrees (provisional). */
  export const STACKED: number = 9;

  /** The floor postures (provisional angles). */
  export const POSES: Readonly<
    Record<"sit" | "kneel" | "quadruped" | IAutoMovieMotionHumanLieDown.Position, IAutoMovieMotionHumanLieDown.IPose>
  > = {
    sit: pose(-30, 0, { hip: 110, knee: 100, shoulder: -40, elbow: 5 }),
    kneel: pose(0, 0, {
      hip: 0,
      knee: 110,
      shoulder: 0,
      elbow: 12,
      ankle: -30,
    }),
    quadruped: pose(85, 0, {
      hip: 85,
      knee: 95,
      shoulder: 85,
      elbow: 0,
      neck: -40,
      ankle: -40,
    }),
    supine: pose(-90, 0, {
      hip: 5,
      knee: 5,
      shoulder: 0,
      elbow: 10,
      ankle: -20,
    }),
    prone: pose(88, 0, {
      hip: 0,
      knee: 10,
      shoulder: 0,
      elbow: 10,
      ankle: -45,
      neck: -10,
    }),
    lateralLeft: pose(
      0,
      -88,
      { hip: 40, knee: 60, shoulder: 70, elbow: 60, ankle: -15 },
      "left",
    ),
    lateralRight: pose(
      0,
      88,
      { hip: 40, knee: 60, shoulder: 70, elbow: 60, ankle: -15 },
      "right",
    ),

    // Seated on the floor with the legs ahead (provisional angles).
    sitLong: pose(-8, 0, { hip: 82, knee: 5, shoulder: -25, elbow: 15 }),

    // Seated cross-legged, and with the legs folded to the right and the trunk leant to the left hand (provisional angles). The legs here are only what the pelvis is rested on the floor with: a thigh both flexed level and spread is not a set of these angles, so `floorSeat` folds the legs by goals on the floor.
    sitCrossed: pose(0, 0, { hip: 90, knee: 5, shoulder: 10, elbow: 40 }),
    sitSide: bent(
      pose(0, 0, { hip: 90, knee: 5, shoulder: 0, elbow: 20 }),
      [-25, -15],
    ),
  };

  /** The sittings whose legs `floorSeat` folds. */
  const FOLDED: Readonly<Partial<Record<IAutoMovieMotionHumanLieDown.Position, floorSeat.Kind>>> = {
    sitCrossed: "crossed",
    sitSide: "side",
  };

  /** The route of postures to each position, after standing, with each arrival's event. */
  export const ROUTES: Readonly<Record<IAutoMovieMotionHumanLieDown.Position, readonly [string, string][]>> =
    {
      supine: [
        ["sit", "seatContact"],
        ["supine", "supine"],
      ],
      prone: [
        ["kneel", "kneeContact"],
        ["quadruped", "handsDown"],
        ["prone", "prone"],
      ],
      lateralLeft: [
        ["sit", "seatContact"],
        ["supine", "supine"],
        ["lateralLeft", "lateral"],
      ],
      lateralRight: [
        ["sit", "seatContact"],
        ["supine", "supine"],
        ["lateralRight", "lateral"],
      ],
      sitLong: [
        ["sit", "seatContact"],
        ["sitLong", "seated"],
      ],
      sitCrossed: [
        ["sit", "seatContact"],
        ["sitCrossed", "seated"],
      ],
      sitSide: [
        ["sit", "seatContact"],
        ["sitSide", "seated"],
      ],
    };

  /**
   * Plan a lie down.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLieDown.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const position: IAutoMovieMotionHumanLieDown.Position = context.params.position ?? "supine";
    const hold: number = context.params.hold ?? 2;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);

    // Entered standing, the body goes down the position's route. Entered on
    // the knees or crouched over the hands, it is already past the route's
    // kneel, so it goes from the posture the entry displays through the
    // rest of the route, about the entry's own hips (`floorEntry`).
    const { standing, entered }: floorEntry.IStart = floorEntry.start(
      context,
      name,
      "hips",
      (): IAutoMovieMotionHumanPosture =>
        stand.plan({ ...context, params: { seconds: 1 } }).posture(0),
    );
    const route: readonly [string, string][] =
      entered === null
        ? ROUTES[position]
        : ROUTES[position].filter(([key]): boolean => key !== "kneel");
    const folds: floorSeat.Kind | undefined = FOLDED[position];
    const keys: IAutoMovieMotionHumanLieDown.IPose[] = [
      entered === null
        ? { pitch: 0, roll: 0, joints: stand.relaxed(body) }
        : { pitch: entered.pitch, roll: entered.roll, joints: entered.joints },
      ...route.map(([key]) => POSES[key as keyof typeof POSES]),
    ];
    const phases: IAutoMovieMotionClock.IPhase[] = [
      { name: "getDown", seconds: PHASE },
      ...route
        .slice(0, -1)
        .map(([, event]) => ({ name: event, seconds: PHASE })),
      { name: route.at(-1)![1], seconds: 0 },
      { name: "settled", seconds: hold },
    ];
    const clock: IAutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence(phases),
      modifiers,
      { holds: ["settled"] },
    );
    const duration: number = clock.duration;

    // The pelvis's place over the floor, kept as the body goes down.
    const from: IAutoMovieMotionHumanPosture = entered ?? standing;
    const hips: IAutoMovieVector3 = Vector3.add(
      from.root,
      Quaternion.rotateVector(
        resolveHumanPosture.heading(from),
        body.rest.get("hips")!,
      ),
    );
    let held: IAutoMovieMotionHumanPosture | undefined;
    const at = (seconds: number): IAutoMovieMotionHumanPosture => {
      let index: number = 0;
      for (let i: number = 0; i < route.length; i++)
        if (seconds >= clock.at(phases[i]!.name)) index = i;
      const u: number = clock.progress(
        phases[index]!.name,
        phases[index + 1]!.name,
        seconds,
      );

      // Arrived, the posture no longer changes: it is rested on the floor once and held.
      const arrived: boolean = index === route.length - 1 && u >= 1;
      if (arrived && held !== undefined) return held;
      const a: IAutoMovieMotionHumanLieDown.IPose = keys[index]!;
      const b: IAutoMovieMotionHumanLieDown.IPose = keys[index + 1]!;
      const joints: IAutoMovieMotionHumanJoints.Angles = {};
      for (const bone of new Set([
        ...Object.keys(a.joints),
        ...Object.keys(b.joints),
      ]) as Set<keyof IAutoMovieMotionHumanJoints.Angles>) {
        const p: readonly [number, number, number] = a.joints[bone] ?? [
          0, 0, 0,
        ];
        const q: readonly [number, number, number] = b.joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [
          p[0] + (q[0] - p[0]) * u,
          p[1] + (q[1] - p[1]) * u,
          p[2] + (q[2] - p[2]) * u,
        ];
      }
      const posed: IAutoMovieMotionHumanPosture = {
        root: { x: 0, y: 0, z: 0 },
        yaw: standing.yaw,
        pitch: a.pitch + (b.pitch - a.pitch) * u,
        roll: a.roll + (b.roll - a.roll) * u,
        joints,
        limbs: {},
      };
      const offset: IAutoMovieVector3 = Quaternion.rotateVector(
        resolveHumanPosture.heading(posed),
        body.rest.get("hips")!,
      );
      const rested: IAutoMovieMotionHumanPosture = {
        ...posed,
        root: {
          x: hips.x - offset.x,
          y: knockdown.rest(body, posed),
          z: hips.z - offset.z,
        },
      };

      // A folded sitting folds its legs over the last phase of its route.
      const out: IAutoMovieMotionHumanPosture =
        folds === undefined || index < route.length - 1
          ? rested
          : floorSeat.place(body, rested, folds, u);
      if (arrived) held = out;
      return out;
    };

    const lying: IAutoMovieMotionHumanPrimitive = {
      channels: [
        "root",
        "trunk",
        "head",
        "leftLeg",
        "rightLeg",
        "leftArm",
        "rightArm",
      ],
      from: 0,
      to: duration,
      write: (_: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture => at(seconds),
    };
    const settled: number = clock.at("settled") / duration;
    const sitting: boolean = position.startsWith("sit");
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      sitting
        ? {
            // Seated on the floor, the seat bears, and the base the next action is entered on is a seated one.
            part: "seat",
            kind: "seat",
            from: settled,
            to: 1,
            support: { kind: "ground" },
          }
        : {
            // The contact parts have no chest or side; the trunk's window is
            // named by the back for every lying position.
            part: "back",
            kind: "lie",
            from: settled,
            to: 1,
            support: { kind: "ground" },
          },
    ];
    // Side sitting leans on the left hand.
    if (folds === "side")
      contacts.push({
        part: "leftHand",
        kind: "plant",
        from: settled,
        to: 1,
        support: { kind: "ground" },
      });
    const planned: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
      clock,
      contact: "settled",
      primitives: [lying],
    });
    // Down on the floor the body lies; a lie that stops sitting up is seated
    // (#3363: a base transition declares the base it ends in).
    return {
      ...planned,
      base: sitting ? { kind: "seated" } : { kind: "lying" },
    };
  }

  /** A floor posture with its trunk bent to the side at the spine and the chest, degrees of abduction: about the forward axis, so a negative bend tips the trunk to the body's left (`HUMANOID_JOINT_AXES`' default basis). The pelvis stays down while the shoulder comes over the hand leant on. */
  function bent(posture: IAutoMovieMotionHumanLieDown.IPose, side: readonly [number, number]): IAutoMovieMotionHumanLieDown.IPose {
    const spine: readonly [number, number, number] = posture.joints.spine ?? [
      0, 0, 0,
    ];
    const chest: readonly [number, number, number] = posture.joints.chest ?? [
      0, 0, 0,
    ];
    return {
      ...posture,
      joints: {
        ...posture.joints,
        spine: [spine[0], spine[1] + side[0], spine[2]],
        chest: [chest[0], chest[1] + side[1], chest[2]],
      },
    };
  }

  /**
   * A floor posture from its whole-body tilt and symmetric limb angles. Lying
   * on a side, no limb spreads away from the trunk into the floor: the arms
   * and the leg underneath keep to the trunk's side, and the leg on top comes
   * down onto the one underneath by `STACKED`.
   */
  function pose(
    pitch: number,
    roll: number,
    a: {
      hip: number;
      knee: number;
      shoulder: number;
      elbow: number;
      neck?: number;
      ankle?: number;
    },
    down?: "left" | "right",
  ): IAutoMovieMotionHumanLieDown.IPose {
    // The hands at rest; every arm angle is the posture's own below.
    const joints: IAutoMovieMotionHumanJoints.Angles = {
      ...HumanHand.shape("left", "relaxed"),
      ...HumanHand.shape("right", "relaxed"),
    };
    for (const side of ["left", "right"] as const) {
      joints[`${side}UpperLeg`] = [
        a.hip,
        down === undefined ? 5 : side === down ? 0 : -STACKED,
        0,
      ];
      joints[`${side}LowerLeg`] = [a.knee, 0, 0];
      joints[`${side}Foot`] = [a.ankle ?? 0, 0, 0];
      joints[`${side}UpperArm`] = [a.shoulder, down === undefined ? 10 : 0, 0];
      joints[`${side}LowerArm`] = [a.elbow, 0, 0];
    }
    joints.neck = [a.neck ?? 0, 0, 0];
    return { pitch, roll, joints };
  }
}
