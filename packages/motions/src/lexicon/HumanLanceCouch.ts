import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLanceCouch,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { StrikingHeld } from "../striking/StrikingHeld";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanMountedPresentation } from "./HumanMountedPresentation";
import { HumanUnseatPose } from "./HumanUnseatPose";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLanceCouch>;

/** The carry's hand station from the right hip joint in the seat frame, metres: the grip at the lance's balance beside and ahead of the hip, a forearm's drop below the shoulder (provisional). */
const COUCH: Readonly<IAutoMovieVector3> = { x: -0.15, y: 0.3, z: 0.2 };

/** The carried shaft's direction in the seat frame: along the travel, the point a little down and in, so the butt behind the grip rises clear of the horse's croup and passes outside the rider's arm (provisional). */
const LEVEL: Readonly<IAutoMovieVector3> = { x: 0.05, y: -0.2, z: 1 };

/** The lowered hand's station from the right shoulder in the seat frame, metres: the arm down, out and forward beside the horse's shoulder, about 0.6 m, nine tenths of an average arm's reach (provisional). */
const LOWERED: Readonly<IAutoMovieVector3> = { x: -0.18, y: -0.5, z: 0.27 };

/** The step the strike is first sought at, seconds: a film frame at 60 per second. */
const FRAME: number = 1 / 60;

/** Bisections that refine the strike inside one step, to a 2^-20 share of it. */
const REFINE: number = 20;

/** Seconds the arms take from the entry to the couch and the bridle (provisional). */
const REACH: number = 0.5;

/**
 * A lance couched and lowered to a skill-at-arms target from the saddle (`IAutoMovieMotionHumanLanceCouch`, #3956): carried on the seat contact, the right hand holds the lance by its grip at the hip with the shaft level along the travel, and the left holds both reins at their middle. The strike is the first instant at which the target's own point lies a lance's length from the lowered hand's station, read in the moving seat frame; over `lower` seconds before it the hand comes down to that station and the shaft onto the line to the target by a minimum-jerk path, the point meets the target at the strike, the target is set on the lance's point from then, and over `lower` seconds after it the lance comes back to the couch. Register `HumanLanceCouch` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the couch, the strike's instant, the lowering, the carry-off and the bridle hand.
 * @evidence contracts/development/design.md#principled-representation One law; the couch and the lowered station in the seat frame, the line to the target read from its own point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law's name and planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lance is the held lance's own, the target the target's own point and the reins the horse's own contacts.
 */
export const HumanLanceCouch: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLanceCouch> =
  {
    name: "lanceCouch",
    interrupts: { any: [{ window: [0, 1], kind: "inertialize", entry: 0 }] },
    /**
     * Admit the act, find the strike, lay the stations, then sample.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the refusals: a non-seated entry, a target the lowered point never reaches inside the act, a strike too early to lower to, and a target past the mounted presentation's bearing.
     * @evidence contracts/development/implementation.md#principled-implementation The hand's distance to the target in the seat frame closes as the horse comes up; the strike is its first crossing of the lance's length, found frame by frame and refined by bisection; the shaft lies on the line from the hand to the target, so the point meets it there.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the strike, the stations, then the sampler.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target never reached is refused with the nearest the point comes, never struck short.
     * @evidence contracts/development/implementation.md#efficient-algorithms One seat read and one target read per frame of the search, a fixed bisection after it; a sample reads one seat frame, the target before the strike and the two reins.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The tool, the stations and the strike are shared by every sample.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the tool, the carrier reader and the target's prop.
     */
    plan(context: Context): IAutoMovieMotionHumanActionPlan {
      const params: IAutoMovieMotionHumanLanceCouch = context.params;
      const entered: IAutoMovieMotionHumanBase = context.entry.base;
      if (entered.kind !== "seated")
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: entered.kind,
          feasible: { kind: "alternatives", values: ["ride", "mounted"] },
          reason: `a lance is couched from the saddle, and the performer is ${entered.kind}`,
          fix: "ride the horse first",
        });
      HumanBound.above("seconds", params.seconds, 0, "s");
      HumanBound.above("lower", params.lower, 0, "s");
      const support: IAutoMovieMotionHumanPropReader = context.prop(params.on);
      const target: IAutoMovieMotionHumanPropReader = context.prop(
        params.target.prop,
      );
      const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
        support,
        params.on,
        params.frame ?? "seat",
      );
      const local: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
        context.entry.posture,
        carrier(context.start),
        HumanMountedFrame.LOCAL,
      );
      const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld.of(
        context,
        "right",
        params.prop,
        // A round shaft has no edge: the lance rolls freely about its axis in the hand.
        { tip: "tip" },
      );
      const goal = StrikingHeld.prepareGoal(context, tool, tool.length);
      const m = context.body.measure;

      // The stations in the seat frame, from the seated root.
      const hip: IAutoMovieVector3 = Vector3.add(local.root, {
        x: -m.hipHalfWidth,
        y: 0,
        z: 0,
      });
      const shoulder: IAutoMovieVector3 = Vector3.add(local.root, {
        x: -m.shoulderHalfWidth,
        y: m.shoulderHeight - m.hipHeight,
        z: 0,
      });
      const couched: IAutoMovieVector3 = Vector3.add(hip, COUCH);
      const level: IAutoMovieVector3 = Vector3.normalize(LEVEL);
      const lowered: IAutoMovieVector3 = Vector3.add(shoulder, LOWERED);

      // The target's point in the seat frame at an act second.
      const seen = (t: number): IAutoMovieVector3 => {
        const film: number = context.start + t;
        const seat: IAutoMovieRigidTransform = carrier(film);
        return Quaternion.rotateVector(
          Quaternion.inverse(seat.rotation),
          Vector3.subtract(
            HumanMountedFrame.contact(target, params.target.point, film),
            seat.position,
          ),
        );
      };
      const gap = (t: number): number =>
        Vector3.distance(seen(t), lowered) - tool.length;

      // The strike: the first crossing of the lance's length.
      let strike: number | undefined;
      let nearest: number = Infinity;
      let closest: number = 0;
      for (let t: number = 0; t <= params.seconds; t += FRAME) {
        const g: number = gap(t);
        if (g < nearest) {
          nearest = g;
          closest = t;
        }
        if (g > 0) continue;
        let low: number = Math.max(0, t - FRAME);
        let high: number = t;
        if (gap(low) <= 0) {
          strike = low;
          break;
        }
        for (let k: number = 0; k < REFINE; ++k) {
          const middle: number = (low + high) / 2;
          if (gap(middle) > 0) low = middle;
          else high = middle;
        }
        strike = high;
        break;
      }
      if (strike === undefined)
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: nearest + tool.length,
          feasible: { kind: "range", minimum: 0, maximum: tool.length, unit: "m" },
          reason: `between film seconds ${context.start.toFixed(2)} and ${(context.start + params.seconds).toFixed(2)} the lowered hand comes no nearer than ${(nearest + tool.length).toFixed(2)} m to ${params.target.prop}'s ${params.target.point}, at ${(context.start + closest).toFixed(2)} s, past the lance's ${tool.length.toFixed(2)} m from the hand`,
          fix: "ride the horse's line past the target within the lance's reach, or lengthen the act",
        });
      if (strike < params.lower)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "lower",
          value: params.lower,
          feasible: { kind: "range", minimum: 0, maximum: strike, unit: "s" },
          reason: `the strike comes ${strike.toFixed(2)} s into the act, before the point can come down in ${params.lower} s`,
          fix: "begin the act earlier or lower faster",
        });
      const struck: IAutoMovieVector3 = seen(strike);
      HumanMountedPresentation.turn(
        HumanMountedPresentation.bearing(0, local.root, struck),
        0,
        "target",
      );
      const line: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(struck, lowered),
      );

      const duration: number = params.seconds;
      const ease = (t: number, from: number): number =>
        minimumJerk.share(Math.min(1, Math.max(0, (t - from) / params.lower)));
      const windows: IAutoMovieMotionHumanContactWindow[] = [
        ...StrikingHeld.grips(tool),
        {
          part: "leftHand",
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: params.on },
        },
      ];
      const goals: IAutoMovieMotionHumanActionPlan = {
        duration,
        events: [
          { name: "lowering", share: (strike - params.lower) / duration },
          { name: "strike", share: strike / duration },
          {
            name: "raised",
            share: Math.min(1, (strike + params.lower) / duration),
          },
        ],
        contact: strike,
        contacts: windows,
        base: entered,
        holds: StrikingHeld.holds(context, tool),
        mounts: [
          {
            prop: params.target.prop,
            onto: params.prop,
            point: "tip",
            from: strike / duration,
          },
        ],
        posture: (time: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.max(0, Math.min(duration, time));
          const film: number = context.start + t;
          // Down onto the target's line before the strike, back to the couch after it.
          const down: number =
            t <= strike ? ease(t, strike - params.lower) : 1 - ease(t, strike);
          const toward: IAutoMovieVector3 =
            t <= strike
              ? Vector3.normalize(Vector3.subtract(seen(t), lowered))
              : line;
          const grip: IAutoMovieVector3 = Vector3.lerp(couched, lowered, down);
          const axis: IAutoMovieVector3 = Vector3.normalize(
            Vector3.lerp(level, toward, down),
          );
          // The edge down, the palm inward, as a level blade is held at the engage.
          const edge: IAutoMovieVector3 = Vector3.normalize(
            Vector3.cross({ x: 1, y: 0, z: 0 }, axis),
          );
          const now: IAutoMovieRigidTransform = carrier(film);
          const toWorld = (p: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(now.position, Quaternion.rotateVector(now.rotation, p));
          const turn = (v: IAutoMovieVector3): IAutoMovieVector3 =>
            Quaternion.rotateVector(now.rotation, v);
          const shown: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
            local,
            HumanMountedFrame.LOCAL,
            now,
          );
          const frame = StrikingHeld.hand(
            tool,
            tool.length,
            toWorld(grip),
            turn(axis),
            turn(edge),
          );
          shown.limbs = {
            ...shown.limbs,
            rightArm: goal(
              frame,
              toWorld(Vector3.add(shoulder, { x: -0.4, y: -0.2, z: -0.3 })),
            ),
          };
          // The bridle hand: both reins at their middle.
          const reins: IAutoMovieVector3 = Vector3.lerp(
            HumanMountedFrame.contact(support, "leftRein", film),
            HumanMountedFrame.contact(support, "rightRein", film),
            0.5,
          );
          return HumanUnseatPose.reach(shown, "left", reins, 1);
        },
      };

      // Both arms are laid as planned courses on these goals, so no instant refits them afresh.
      const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
        start: 0,
        ready: Math.min(REACH, duration),
        relax: duration,
        end: duration,
      };
      return courseArmGoal({
        body: context.body,
        plan: goals,
        side: "right",
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
        span,
        with: [
          {
            side: "left",
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
            span,
          },
        ],
      });
    },
  };
