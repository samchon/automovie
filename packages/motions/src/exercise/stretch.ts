import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRange,
  IAutoMovieMotionHumanStretch,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanLegPhrase } from "../compose/AutoMovieMotionHumanLegPhrase";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { stretchCrossBody } from "./stretchCrossBody";
import { stretchHoldClock } from "./stretchHoldClock";
import { stretchOverheadPlace } from "./stretchOverheadPlace";
import { stretchQuadriceps } from "./stretchQuadriceps";

/** The alternatives of `ComposeBendBone`'s site. */
type ComposeBendBone = "spine" | "chest";

/** The alternatives of `INTENSITYEntryItem`'s site. */
type INTENSITYEntryItem = "mild" | "moderate";

/**
 * A standing static stretch or yoga pose held and released: the neck side bend,
 * the cross-body shoulder stretch, the overhead side bend, the standing
 * quadriceps stretch holding the ankle, and the tree pose (ACSM's Guidelines,
 * 11th ed.; the hold of 30 s, Bandy et al. 1997).
 *
 * Each pose is a phrase: `enter` to `reachEnd` over 1.5 s (provisional, a
 * stretch is entered slowly), the hold, and the release over 1.5 s. The
 * intensity names the share of the joint's own range a stretch uses (`mild`
 * half, `moderate` deep, `AutoMovieMotionHumanRange`), never more than the
 * range table allows.
 *
 * - Neck side bend: the neck and head bend to one side by the share of the neck's
 *   lateral range.
 * - Cross-body: the stretched arm crosses the chest until its wrist is beyond the
 *   other shoulder (provisional place), and the other palm presses the
 *   stretched arm near its elbow (`stretchCrossBody`).
 * - Overhead side bend: both arms overhead, palms facing, the spine and the chest
 *   bent to one side by the share of their lateral ranges, the pelvis level
 *   over the planted feet and the arms riding the chest.
 * - Quadriceps: the hips move over the standing foot, the other knee bends to at
 *   least 130 degrees (provisional) and as far as the same-side hand needs to
 *   hold the ankle (`stretchQuadriceps`).
 * - Tree: the hips over the standing foot, the other foot's sole on the inside of
 *   the standing calf, the knee turned out, the palms together before the
 *   chest.
 *
 * Events: `enter`, `reachEnd`, `release`, with the phrase instants.
 *
 * Not drafted: seated and floor stretches, PNF, dynamic stretches and the flows
 * (sun salutation); they need floor supports for the hands and seat.
 */
export namespace stretch {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "stretch";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      stretch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** How far into the range: `mild` half and `moderate` deep. */
  export const INTENSITY: Readonly<
    Record<INTENSITYEntryItem, IAutoMovieMotionHumanRange.Level>
  > = { mild: "half", moderate: "deep" };

  /** The entry's and the release's seconds (provisional). */
  export const ENTER: number = 1.5;

  /** The hold by default, seconds (Bandy et al. 1997). */
  export const HOLD: number = 30;

  /**
   * The bent knee's least flexion in the quadriceps stretch, degrees
   * (provisional).
   */
  export const KNEE: number = 130;

  /**
   * The stretch's timetable: entered over `ENTER`, held `hold`, left over
   * `ENTER`, the manner's tempo and hold factor applied; the reach ends as the
   * hold begins, the release opens the way out, the weight shifts halfway in
   * and lowers halfway out.
   *
   * @param hold The held seconds.
   * @param modifiers The manner's timing.
   * @returns The clock.
   */
  export function timetable(
    hold: number,
    modifiers: IAutoMovieMotionManner.IModifiers,
  ): IAutoMovieMotionClock {
    const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: ENTER,
        attack: 0,
        hold,
        retract: ENTER,
      }),
      modifiers,
    );
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(timed.duration, [
      ...timed.instants,
      { name: "enter", seconds: 0 },
      { name: "reachEnd", seconds: timed.at("ready") },
      { name: "release", seconds: timed.at("relax") },

      // A one-leg pose takes its weight onto the standing foot before the
      // other foot leaves the floor, and sets that foot down before it
      // takes the weight back (a support is released only after the next
      // one bears): the hips shift over the first half of the entry and
      // the foot lifts over the second, and the release runs the other way.
      { name: "shifted", seconds: timed.at("ready") / 2 },
      {
        name: "lowered",
        seconds: (timed.at("relax") + timed.duration) / 2,
      },
    ]);
    return clock;
  }
  /**
   * Plan a stretch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStretch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanStretch.IParams = context.params;
    const hold: number = p.hold ?? HOLD;
    HumanBound.least("hold", hold, 0, "s");
    const level: IAutoMovieMotionHumanRange.Level =
      INTENSITY[p.depth ?? "moderate"];
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const clock: IAutoMovieMotionClock = timetable(hold, modifiers);
    const build = (
      local: IAutoMovieMotionClock,
      prepared: boolean = false,
    ): IAutoMovieMotionHumanActionPlan =>
      compose(context, p, modifiers, level, local, prepared);
    return stretchHoldClock.plan(context, clock, build);
  }

  /** Build the native stretch's own writers over the given phase clock. */
  function compose(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStretch.IParams>,
    p: IAutoMovieMotionHumanStretch.IParams,
    modifiers: IAutoMovieMotionManner.IModifiers,
    level: IAutoMovieMotionHumanRange.Level,
    clock: IAutoMovieMotionClock,
    prepared: boolean,
  ): IAutoMovieMotionHumanActionPlan {
    const body = context.body;
    const m = body.measure;
    const weight: (seconds: number) => number =
      AutoMovieMotionClock.prepareEnvelope(
        clock,
        ["start", "ready"],
        ["relax", "end"],
      );
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const side: AutoMovieHumanSide = p.side ?? "right";
    const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
    const sign: number = side === "left" ? 1 : -1;
    const frame: IAutoMovieMotionHumanFrame = {
      origin: { x: 0, y: 0, z: 0 },
      yaw: entry.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: 0,
      z: 1,
    });
    const leftward: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 1,
      y: 0,
      z: 0,
    });
    const stance: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
      left: {
        ankle: context.entry.feet.left.ankle,
        rotation: context.entry.feet.left.rotation,
      },
      right: {
        ankle: context.entry.feet.right.ankle,
        rotation: context.entry.feet.right.rotation,
      },
    };
    const rest = (
      s: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanArmAngles.IAngles =>
      AutoMovieMotionHumanArm.angles(context.entry.pose, s);
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let contacts: IAutoMovieMotionHumanContactWindow[] =
      AutoMovieMotionHumanBase.plants();
    const facing = (
      posture: IAutoMovieMotionHumanPosture,
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        local,
      );

    // The hips carried over the standing foot, for the one-leg poses.
    const over = (standing: AutoMovieHumanSide): IAutoMovieVector3 =>
      Vector3.scale(
        leftward,
        Vector3.dot(
          Vector3.subtract(stance[standing].ankle, entry.root),
          leftward,
        ),
      );
    const balance = (
      standing: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanPrimitive => {
      const offset: IAutoMovieVector3 = over(standing);
      const envelope: (seconds: number) => number =
        AutoMovieMotionClock.prepareEnvelope(
          clock,
          ["start", "shifted"],
          ["lowered", "end"],
        );
      return {
        channels: ["root"],
        reads: ["root"],
        from: 0,
        to: clock.duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture => ({
          ...posture,
          root: Vector3.add(
            posture.root,
            Vector3.scale(offset, envelope(seconds)),
          ),
        }),
      };
    };
    const raising: (seconds: number) => number =
      AutoMovieMotionClock.prepareEnvelope(
        clock,
        ["shifted", "reachEnd"],
        ["release", "lowered"],
      );
    const lifted: (
      placement: IAutoMovieMotionHumanFoot.IPlacement,
    ) => IAutoMovieMotionHumanPrimitive = (
      placement: IAutoMovieMotionHumanFoot.IPlacement,
    ): IAutoMovieMotionHumanPrimitive => {
      const lift: ReturnType<
        typeof AutoMovieMotionHumanLegPhrase.prepareBetween
      > = AutoMovieMotionHumanLegPhrase.prepareBetween(stance[side], placement);
      return AutoMovieMotionHumanLeg.place({
        body,
        side,
        from: 0,
        to: clock.duration,
        placement: (
          _: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanFoot.IPlacement => lift(raising(seconds)),
        planted: (seconds: number): boolean => raising(seconds) <= 0,
      });
    };

    // The standing foot bears throughout; the lifted one until it leaves the
    // floor and again once it is set down.
    const standingOn: (
      standing: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanContactWindow[] = (
      standing: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanContactWindow[] => [
      {
        part: `${standing}Foot`,
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 0,
        to: clock.at("shifted") / clock.duration,
        support: { kind: "ground" },
      },
      {
        part: `${side}Foot`,
        kind: "plant",
        from: clock.at("lowered") / clock.duration,
        to: 1,
        support: { kind: "ground" },
      },
    ];
    const hip: IAutoMovieVector3 = HumanFrame.point(
      { origin: Vector3.add(entry.root, over(other)), yaw: entry.yaw },
      body.rest.get(`${side}UpperLeg`)!,
    );

    switch (p.kind) {
      case "neckSide":
        primitives.push(
          AutoMovieMotionHumanHead.tilt(
            clock,
            ["start", "ready"],
            ["relax", "end"],
            -sign *
              AutoMovieMotionHumanRange.degrees("neck", "abduction", level) *
              modifiers.extent,
          ),
        );
        break;
      case "crossBody":
        primitives.push(
          ...stretchCrossBody.arms({
            body,
            side,
            duration: clock.duration,
            rest,
            weight,
            forward,
          }),
        );
        break;
      case "overheadSide": {
        // The bend is the spine's: a pelvis rolled with it would take the
        // hip joints off the planted legs.
        const bend = (bone: ComposeBendBone): [number, number, number] => [
          0,
          -sign *
            AutoMovieMotionHumanRange.degrees(bone, "abduction", level) *
            modifiers.extent,
          0,
        ];
        primitives.push(
          AutoMovieMotionHumanJoints.pulse(
            clock,
            ["start", "ready"],
            ["relax", "end"],
            { spine: bend("spine"), chest: bend("chest") },
          ),
        );
        const place: ReturnType<typeof stretchOverheadPlace> =
          stretchOverheadPlace(body, entry, prepared);
        for (const s of ["left", "right"] as const)
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side: s,
              from: 0,
              to: clock.duration,
              rest: rest(s),
              weight,
              place: place(s),
              bend: "raised",
            }),
          );
        break;
      }
      case "quadriceps": {
        const ankle: IAutoMovieVector3 = stretchQuadriceps({
          body,
          side,
          hip,
          shoulder: AutoMovieMotionHumanPlaced.joint(
            body,
            { ...entry, root: Vector3.add(entry.root, over(other)) },
            `${side}UpperArm`,
          ),
          forward,
          least: KNEE,
        });
        const placement: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle,
          rotation: HumanFoot.rotation(entry.yaw, -60),
        };
        primitives.push(
          balance(other),
          lifted(placement),
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: clock.duration,
            rest: rest(side),
            weight,
            surface: "grip",
            shape: "fist",
            place: (posture: IAutoMovieMotionHumanPosture) => ({
              point: ankle,
              facing: facing(posture, { x: 0, y: 0, z: -1 }),
            }),
            bend: "behind",
          }),
        );
        contacts = standingOn(other);
        break;
      }
      case "tree": {
        const calf: IAutoMovieVector3 = Vector3.add(stance[other].ankle, {
          x: 0,
          y: 0.6 * m.shank,
          z: 0,
        });
        const placement: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: Vector3.add(
            calf,
            Vector3.scale(leftward, sign * (m.shankRadius + m.ankleHeight)),
          ),
          rotation: Quaternion.multiply(
            Quaternion.fromAxisAngle(forward, sign * 90),
            HumanFoot.rotation(entry.yaw - sign * 45, 0),
          ),
        };
        primitives.push(balance(other), lifted(placement));
        for (const s of ["left", "right"] as const) {
          const pad: number = AutoMovieMotionHumanTouchEffector.pad(body, s, {
            surface: "palm",
            shape: "flat",
          });
          primitives.push(
            ...AutoMovieMotionHumanPlaced.arm({
              body,
              side: s,
              from: 0,
              to: clock.duration,
              rest: rest(s),
              weight,
              place: (posture: IAutoMovieMotionHumanPosture) => ({
                point: Vector3.add(
                  AutoMovieMotionHumanPlaced.grid(body, posture, s, {
                    height: "chest",
                    lateral: "centre",
                    distance: "near",
                  }),
                  facing(posture, {
                    x: (s === "left" ? 1 : -1) * pad,
                    y: 0,
                    z: 0,
                  }),
                ),
                facing: facing(posture, {
                  x: s === "left" ? -1 : 1,
                  y: 0,
                  z: 0,
                }),
                forward: { x: 0, y: 1, z: 0 },
              }),
              bend: "front",
            }),
          );
        }
        contacts = standingOn(other);
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, contacts),
      clock,
      primitives,
      contact: "reachEnd",
    });
  }
}
