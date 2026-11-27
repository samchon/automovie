import {
  AutoMovieEngineMath,
  AutoMovieEngineMotionSampling,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanGuard,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingStance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionPrepared } from "../../compose/internal/AutoMovieMotionPrepared";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { StrikingFootPoint } from "./StrikingFootPoint";
import { StrikingGuardYield } from "./StrikingGuardYield";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { strikingStepSupport } from "./strikingStepSupport";

/*
 * The fighting stance taken and held: from whatever the performer stands in,
 * each foot steps to its stance place in turn, cleared from the floor before it
 * travels and pointed in the air (the rear foot first, so the lead foot stays a
 * support), the root sinks until both knees soften and turns to the stance
 * heading, and the gloves come up to the guard, then the stance holds with a
 * light bounce through the knees. If a step is interrupted, its airborne foot
 * takes the first swing and the existing bearing foot holds through that
 * landing.
 *
 * The stance itself is StrikingStance: measured on the body, so any
 * stature takes its own. A foot already within 1 cm of its place stays planted.
 * The line faces the `facing` target when one is given (read at the start),
 * otherwise it keeps the entry's line: a performer already in a stance keeps
 * its line, and one standing square faces straight ahead.
 *
 * A guard facing a person steps back from them by its half of the least step
 * along the line between them that keeps its guard and theirs, both held, clear
 * of each other (`StrikingGuardYield`), so two fighters in guard never stand
 * inside each other, whatever their sizes.
 *
 * The bounce: kickboxers keep a rhythmic bounce between exchanges; its height
 * is a third of the stance's sink and its rate two bounces a second,
 * provisional readings of coaching footage (the kickboxing research's rhythm
 * share) with no located measurement.
 */
export namespace guard {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "guard";

  /*
   * Cancel table: from a guard every striking action may start at any time.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    guard: [
      {
        window: { start: 0, end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: 0.15,
      },
    ],
    punch: [
      {
        window: { start: 0, end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: 0.1,
      },
    ],
    kick: [
      {
        window: { start: 0, end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: 0.1,
      },
    ],
    defend: [
      {
        window: { start: 0, end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: 0.1,
      },
    ],
    step: [
      {
        window: { start: 0, end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: 0.1,
      },
    ],
  };

  /*
   * Seconds to step into the stance.
   */
  export const SET: number = 0.6;

  /*
   * A stepping foot's clearance at mid-step, a share of stature (provisional).
   */
  export const STEP_LIFT: number = 0.03;

  /*
   * The shares of a step between which the foot travels, after it clears the
   * floor and before it lands (provisional).
   */
  export const STEP_TRAVEL: readonly [number, number] = [0.25, 0.75];

  /*
   * Bounce rate, per second (provisional).
   */
  export const BOUNCE_RATE: number = 2;

  /*
   * Plan a guard.
   * Parameter context: The action's context.
   * Returns: The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGuard.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const duration: number = Math.max(SET, context.params.duration ?? 1);
    // The stance the plan solved when it was prepared, on a faced person as
    // the placed performance shows them; before that, each read builds it
    // cold on the performance as placed so far.
    const shape: AutoMovieMotionPrepared.IValue<IGeometry> =
      AutoMovieMotionPrepared((): IGeometry => build(context, duration));
    const geometry = (): IGeometry => shape.read();
    const events: IAutoMovieMotionEvent[] = [
      { name: "set", share: SET / duration },
    ];
    return {
      duration,
      events,
      get contacts(): IAutoMovieMotionHumanContactWindow[] {
        return geometry().contacts;
      },
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture =>
        geometry().posture(
          Math.min(duration, Math.max(0, seconds)),
          channels,
          resolution,
          projection,
        ),
      prepare: (): void => void shape.prepare(),
    };
  }

  /*
   * A built guard.
   */
  interface IGeometry {
    /*
     * The complete posture at action-relative seconds, with same-call FK/ROM
     * borrowing and no retained query source.
     */
    posture: IAutoMovieMotionHumanActionPlan["posture"];
    /*
     * The feet's contact windows.
     */
    contacts: IAutoMovieMotionHumanContactWindow[];
  }

  /*
   * Build the stance from the entry and the line, stepped back from a faced
   * person's guard.
   */
  function build(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGuard.IParams>,
    duration: number,
  ): IGeometry {
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...entry.joints,
      ...StrikingStance.joints(entry.joints),
    };
    const lead: AutoMovieHumanSide =
      context.params.stance === undefined
        ? StrikingTarget.lead(context.entry)
        : context.params.stance === "orthodox"
          ? "left"
          : "right";
    const staggered: boolean =
      Math.abs(
        Vector3.dot(
          Vector3.subtract(
            context.entry.feet.left.ankle,
            context.entry.feet.right.ankle,
          ),
          forwardOf(entry.yaw),
        ),
      ) > 0.05;
    const line: number =
      context.params.facing !== undefined
        ? StrikingTarget.heading(
            StrikingTarget.line(
              entry.root,
              context.aim(
                context.params.facing,
                context.start - StrikingTarget.LOOK,
              ).point,
              entry.yaw,
            ),
          )
        : staggered
          ? entry.yaw +
            (lead === "left" ? StrikingStance.TURN : -StrikingStance.TURN)
          : entry.yaw;
    const stance: IAutoMovieMotionHumanStrikingStance.IStance = { lead, line };
    const from: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = StrikingTarget.feet(context.entry);
    const centre: IAutoMovieVector3 = {
      x: (from.left.ankle.x + from.right.ankle.x) / 2,
      y: 0,
      z: (from.left.ankle.z + from.right.ankle.z) / 2,
    };

    // The stance laid back along the line from a faced person's guard it
    // would enter (`StrikingGuardYield`).
    const laid: IGeometry = lay(
      context,
      duration,
      joints,
      stance,
      from,
      centre,
    );
    const back: IAutoMovieVector3 | null = StrikingGuardYield.back(
      context,
      laid.posture(SET),
    );
    return back === null
      ? laid
      : lay(context, duration, joints, stance, from, Vector3.add(centre, back));
  }

  /*
   * Lay the stance about a centre on the floor.
   */
  function lay(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGuard.IParams>,
    duration: number,
    joints: IAutoMovieMotionHumanPosture["joints"],
    stance: IAutoMovieMotionHumanStrikingStance.IStance,
    from: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    centre: IAutoMovieVector3,
  ): IGeometry {
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const lead: AutoMovieHumanSide = stance.lead;
    const line: number = stance.line;
    const to: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> =
      StrikingStance.feet(body, stance, centre);
    const heading: number = StrikingStance.heading(stance);

    // The body turns from the line by the stance turn and the face does
    // not: "tuck your chin down and look forward" (IABA, A Beginner's
    // Guide). The neck and the head each turn back by half the body's turn
    // from the line (`StrikingStance.facing`'s shares and bound), reached as
    // the stance is taken from whatever turn the entry holds. Without it the
    // head rode the stance turn, the fighter looked thirty degrees past the
    // opponent, and the gloves, placed from the face, stood off the line.
    const neck: readonly [number, number, number] = joints.neck ?? [0, 0, 0];
    const head: readonly [number, number, number] = joints.head ?? [0, 0, 0];
    const faced: number = -Math.max(
      -StrikingStance.FACING,
      Math.min(
        StrikingStance.FACING,
        0.5 * AutoMovieEngineMath.wrapDegrees(heading - line),
      ),
    );
    // The pelvis over the stance centre, the feet being symmetric about it on
    // the line.
    const rootAt: IAutoMovieVector3 = { x: centre.x, y: 0, z: centre.z };
    const sunk: number = StrikingStance.sink(body, rootAt, heading, {
      left: to.left.ankle,
      right: to.right.ankle,
    });

    // Complete an interrupted swing before releasing the inherited bearing
    // shoe. A guard entered from a settled stance takes its usual rear step.
    const support: strikingStepSupport.ISupport | undefined =
      strikingStepSupport(context);
    const moving: Record<AutoMovieHumanSide, boolean> = {
      left:
        support?.landings.left !== undefined ||
        Vector3.distance(from.left.ankle, to.left.ankle) > 0.01,
      right:
        support?.landings.right !== undefined ||
        Vector3.distance(from.right.ankle, to.right.ankle) > 0.01,
    };
    const first: readonly [number, number] = [0, 0.3];
    const second: readonly [number, number] = [
      support === undefined
        ? 0.25
        : support.bearing === undefined
          ? 0
          : first[1],
      0.55,
    ];
    const bearing: AutoMovieHumanSide = support?.bearing ?? lead;
    const window: Record<AutoMovieHumanSide, readonly [number, number]> =
      bearing === "left"
        ? { left: second, right: first }
        : { left: first, right: second };
    const lift: number = STEP_LIFT * body.measure.stature;
    const rotations: Record<
      AutoMovieHumanSide,
      ReturnType<typeof Quaternion.prepareSlerp>
    > = {
      left: Quaternion.prepareSlerp(from.left.rotation, to.left.rotation),
      right: Quaternion.prepareSlerp(from.right.rotation, to.right.rotation),
    };
    const foot = (
      side: AutoMovieHumanSide,
      t: number,
    ): IAutoMovieMotionHumanFoot.IPlacement => {
      if (!moving[side]) return from[side];
      const [a, b] = window[side];
      // The foot clears the floor before it travels and travels before it
      // lands, so it never skates; its toes point down in the air, the ankle
      // easing out of the stance's dorsiflexion while it bears nothing.
      const raw: number = Math.min(1, Math.max(0, (t - a) / (b - a)));
      const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        (raw - STEP_TRAVEL[0]) / (STEP_TRAVEL[1] - STEP_TRAVEL[0]),
      );
      const bump: number = Math.sin(Math.PI * raw) ** 2;
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        from[side].ankle,
        to[side].ankle,
        s,
      );
      const rotation: ReturnType<typeof Quaternion.prepareSlerp> =
        rotations[side];
      return StrikingFootPoint(
        body,
        side,
        {
          ankle: { ...ankle, y: ankle.y + lift * bump },
          rotation: rotation(s),
        },
        bump,
      );
    };
    const contacts: IAutoMovieMotionHumanContactWindow[] = (
      ["left", "right"] as const
    ).flatMap((side): IAutoMovieMotionHumanContactWindow[] => {
      if (!moving[side])
        return [
          {
            part: `${side}Foot`,
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "ground" },
          },
        ];
      const [a, b] = window[side];
      return [
        ...(support?.landings[side] !== undefined
          ? []
          : [
              {
                part: `${side}Foot`,
                kind: "plant",
                from: 0,
                to: a / duration,
                support: { kind: "ground" },
              } satisfies IAutoMovieMotionHumanContactWindow,
            ]),
        {
          part: `${side}Foot`,
          kind: "plant",
          from: b / duration,
          to: 1,
          support: { kind: "ground" },
        },
      ];
    });
    const bounce: number = Math.abs(sunk) / 3;
    const guardAt: ReturnType<typeof StrikingStance.prepareGuard> =
      StrikingStance.prepareGuard(body, { lead }, {}, context.params.style);
    return {
      contacts,
      posture: (
        t: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(
          t / SET,
        );
        const fade: number =
          s *
          (1 -
            AutoMovieEngineMotionSampling.minimumJerkShare(
              (t - (duration - 0.2)) / 0.2,
            ));
        const hop: number =
          bounce *
          fade *
          0.5 *
          (1 - Math.cos(2 * Math.PI * BOUNCE_RATE * Math.max(0, t - SET)));
        const posture: IAutoMovieMotionHumanPosture = {
          root: {
            x: entry.root.x + (rootAt.x - entry.root.x) * s,
            y: entry.root.y + (sunk - entry.root.y) * s - hop,
            z: entry.root.z + (rootAt.z - entry.root.z) * s,
          },
          yaw:
            entry.yaw +
            AutoMovieEngineMath.wrapDegrees(heading - entry.yaw) * s,
          pitch: entry.pitch * (1 - s),
          roll: entry.roll * (1 - s),
          joints: {
            ...joints,
            neck: [neck[0], neck[1], neck[2] + (faced - neck[2]) * s],
            head: [head[0], head[1], head[2] + (faced - head[2]) * s],
          },
          limbs: {},
        };
        const feet: Record<
          AutoMovieHumanSide,
          IAutoMovieMotionHumanFoot.IPlacement
        > = {
          left: foot("left", t),
          right: foot("right", t),
        };
        const down = (side: AutoMovieHumanSide): boolean =>
          !moving[side] ||
          (support?.landings[side] === undefined && t <= window[side][0]) ||
          t >= window[side][1];
        // The root lowered until each leg reaches its foot, the stepping one
        // included, so the root does not drop when that foot lands, as the
        // stance turns and travels over feet that have not moved yet.
        const reached: IAutoMovieMotionHumanPosture = lowerHumanPosture(
          body,
          { ...posture, limbs: StrikingStance.legs(body, feet) },
          lowerHumanPosture.KNEE,
          resolution,
        );
        const lowered: IAutoMovieMotionHumanPosture = {
          ...reached,
          limbs: StrikingStance.legs(body, feet, {
            left: down("left"),
            right: down("right"),
          }),
        };
        const hands: ReturnType<typeof StrikingStance.guard> = guardAt(
          lowered,
          resolution,
          projection,
        );
        return {
          ...lowered,
          limbs: { ...lowered.limbs, ...blendArms(context, hands, s) },
        };
      },
    };
  }

  /*
   * The entry's arms blended toward the guard by a share: from the hands' entry
   * goals, or the guard alone when the entry wrote none.
   */
  function blendArms(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGuard.IParams>,
    hands: Pick<IAutoMovieMotionHumanPosture["limbs"], BlendArmsHands>,
    s: number,
  ): Pick<IAutoMovieMotionHumanPosture["limbs"], BlendArmsResult> {
    const out: Pick<IAutoMovieMotionHumanPosture["limbs"], BlendArmsOut> = {};
    for (const arm of ["leftArm", "rightArm"] as const) {
      const to: IAutoMovieHumanLimbGoal = hands[arm]!;
      const from: IAutoMovieHumanLimbGoal | undefined =
        context.entry.posture.limbs[arm];
      out[arm] =
        from === undefined
          ? to
          : {
              point: Vector3.lerp(from.point, to.point, s),
              bend: Vector3.lerp(from.bend, to.bend, s),
              ...(from.rotation !== undefined && to.rotation !== undefined
                ? { rotation: Quaternion.slerp(from.rotation, to.rotation, s) }
                : {}),
            };
    }
    return out;
  }

  /*
   * The horizontal forward of a heading.
   */
  function forwardOf(yaw: number): IAutoMovieVector3 {
    const r: number = (yaw * Math.PI) / 180;
    return { x: Math.sin(r), y: 0, z: Math.cos(r) };
  }
}

/*
 * The alternatives of `BlendArmsOut`'s site.
 */
type BlendArmsOut = "leftArm" | "rightArm";

/*
 * The alternatives of `BlendArmsResult`'s site.
 */
type BlendArmsResult = "leftArm" | "rightArm";

/*
 * The alternatives of `BlendArmsHands`'s site.
 */
type BlendArmsHands = "leftArm" | "rightArm";
