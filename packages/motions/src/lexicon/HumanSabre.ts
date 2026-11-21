import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSabre,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanResponse } from "../skill/HumanResponse";
import { StrikingHeld } from "../striking/StrikingHeld";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatPose } from "./HumanUnseatPose";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSabre>;

/** The longest a gallop stride lasts, seconds, the most a charge may take to come to the engage (provisional: a gallop of about two strides a second). */
const STRIDE: number = 0.5;

/** The share of the arm's full length the engage reaches forward, short of the straight elbow's singular reach (provisional). */
const REACHED: number = 0.95;

/** Seconds the arms take from the entry to the bridle and the carriage (provisional). */
const REACH: number = 0.5;

/** The slope's hand station from the right hip joint in the seat frame, metres: in front of the hip at about an elbow-bent height (provisional). */
const SLOPE: Readonly<IAutoMovieVector3> = { x: -0.08, y: 0.25, z: 0.15 };

/** How far in front of the shoulder the slope's blade passes, metres: the shoulder's skin (provisional). */
const SHOULDER: number = 0.06;

/**
 * A sabre's slope and engage from the saddle (`IAutoMovieMotionHumanSabre`): carried on the seat contact, the right hand closes on the held sabre's grip and is placed by the sabre's own geometry (`StrikingHeld`) so that, at the slope, the grip lies in front of the right hip and the blade runs up past the front of the right shoulder, the false edge against it, point up and a little back, edge forward; at the engage, the grip is an arm's length straight ahead of the right shoulder and the blade level along the seat's forward, point leading, edge down. The left hand holds both reins at their middle. A charge cue brings the slope to the engage after the rider's warned reaction over `transition` seconds by a minimum-jerk path in the seat frame; the grip stays closed throughout. Register `HumanSabre` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both carriages, the bridle hand, the charge and its timing.
 * @evidence contracts/development/design.md#principled-representation One law; carriages as grip stations and blade directions in the seat frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law's name, cut table and planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The blade is the held sabre's own; the reins are the horse's own contacts.
 */
export const HumanSabre: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSabre> =
  {
    name: "sabre",
    interrupts: { any: [{ window: [0, 1], kind: "inertialize", entry: 0 }] },
    /**
     * Admit the carriage and the charge, lay both stations, then sample.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the refusals: a non-seated entry, a transition longer than a gallop stride, a cue with no instant inside the act, and a charge cued while the ride's own gait track does not show the gallop.
     * @evidence contracts/development/implementation.md#principled-implementation Stations from the body's measures in the seat frame; the charge starts at the cue plus `HumanResponse.latency` for a warned reaction; the horse's gait is the latest change on the ride's own gait track at or before the charge.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the stations, the clock, then the sampler.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A charge before the gallop is refused, never delayed.
     * @evidence contracts/development/implementation.md#efficient-algorithms A sample reads one seat frame and the two rein contacts and fits two arm goals.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The tool and the stations are shared by every sample.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the tool and the carrier reader.
     */
    plan(context: Context): IAutoMovieMotionHumanActionPlan {
      const params: IAutoMovieMotionHumanSabre = context.params;
      const entered: IAutoMovieMotionHumanBase = context.entry.base;
      if (entered.kind !== "seated")
        throw new HumanRefusal({
          kind: "base",
          axis: "base",
          value: entered.kind,
          feasible: { kind: "alternatives", values: ["ride", "mounted"] },
          reason: `a sabre is carried from the saddle, and the performer is ${entered.kind}`,
          fix: "ride the horse first",
        });
      HumanBound.above("seconds", params.seconds, 0, "s");
      HumanBound.above("transition", params.transition, 0, "s");
      if (params.transition > STRIDE)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "transition",
          value: params.transition,
          feasible: { kind: "range", minimum: 0, maximum: STRIDE, unit: "s" },
          reason: "a charge comes to the engage within one gallop stride",
          fix: `take the engage in at most ${STRIDE} s`,
        });
      const support = context.prop(params.on);
      const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
        support,
        params.on,
        params.frame ?? "seat",
      );
      const origin: IAutoMovieRigidTransform = carrier(context.start);
      const local: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
        context.entry.posture,
        origin,
        HumanMountedFrame.LOCAL,
      );
      const tool: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld.of(
        context,
        "right",
        params.prop,
        { tip: "point", edge: "edge" },
      );
      const goal = StrikingHeld.prepareGoal(context, tool, tool.length);
      const m = context.body.measure;

      // The stations in the seat frame: the right hip and shoulder from the seated root.
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
      const slopeGrip: IAutoMovieVector3 = Vector3.add(hip, SLOPE);
      const slopeAxis: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          Vector3.add(shoulder, { x: 0, y: 0, z: SHOULDER }),
          slopeGrip,
        ),
      );
      const engageGrip: IAutoMovieVector3 = Vector3.add(shoulder, {
        x: 0,
        y: 0,
        z: REACHED * (m.upperArm + m.forearm + 0.5 * m.hand),
      });
      const stations = {
        slope: { grip: slopeGrip, axis: slopeAxis, edge: { x: 0, y: 0, z: 1 } },
        engage: {
          grip: engageGrip,
          axis: { x: 0, y: 0, z: 1 },
          edge: { x: 0, y: -1, z: 0 },
        },
      } as const;

      // The charge: after the warned reaction, while galloping.
      let from: number | undefined;
      if (params.cue !== undefined) {
        const charge: number | undefined = context
          .cue(params.cue)
          .map((c) => c.seconds - context.start)
          .filter((t: number): boolean => t >= 0 && t <= params.seconds)
          .sort((a: number, b: number): number => a - b)[0];
        if (charge === undefined)
          throw new HumanRefusal({
            kind: "parameter",
            axis: "cue",
            value: params.cue,
            feasible: null,
            reason: `the cue track ${params.cue} has no instant inside the act`,
            fix: "cue the charge inside the act",
          });
        const film: number = context.start + charge;
        // The horse's gait at the charge: the latest change on the ride's own gait track at or before it.
        const changes = (
          params.gaits === undefined ? [] : context.cue(params.gaits)
        )
          .filter((c) => c.seconds <= film)
          .sort((x, y) => x.seconds - y.seconds);
        const gait: string | undefined = changes.at(-1)?.name.split("-").at(-1);
        if (gait !== "gallop")
          throw new HumanRefusal({
            kind: "parameter",
            axis: "cue",
            value: film,
            feasible: null,
            reason: `the charge is cued at film second ${film.toFixed(3)} while the horse ${gait === undefined ? "shows no gait change on its track" : `goes at the ${gait}`}, before its gallop`,
            fix: "cue the charge on the gallop leg, and name the ride's gait track in gaits",
          });
        from =
          charge +
          HumanResponse.latency(
            context.skill,
            context.random("sabre"),
            "reaction",
            true,
            context.attributes,
          );
      }
      const share = (t: number): number =>
        params.carry === "engage"
          ? 1
          : from === undefined
            ? 0
            : minimumJerk.share(
                Math.min(1, Math.max(0, (t - from) / params.transition)),
              );
      const duration: number = params.seconds;
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
        events:
          from === undefined
            ? []
            : [
                { name: "charge", share: Math.min(1, from / duration) },
                {
                  name: "engaged",
                  share: Math.min(1, (from + params.transition) / duration),
                },
              ],
        contacts: windows,
        base: entered,
        holds: StrikingHeld.holds(context, tool),
        posture: (time: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.max(0, Math.min(duration, time));
          const film: number = context.start + t;
          const s: number = share(t);
          const grip: IAutoMovieVector3 = Vector3.lerp(
            stations.slope.grip,
            stations.engage.grip,
            s,
          );
          const axis: IAutoMovieVector3 = Vector3.normalize(
            Vector3.lerp(stations.slope.axis, stations.engage.axis, s),
          );
          const edge: IAutoMovieVector3 = Vector3.normalize(
            Vector3.lerp(stations.slope.edge, stations.engage.edge, s),
          );
          // The stations are laid in the seat frame and carried into the world before the hand is placed, so the goal is the world's own.
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
              toWorld(Vector3.add(shoulder, { x: -0.4, y: -0.4, z: -0.2 })),
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

      // Both arms are laid as planned courses on these goals, the reach to the bridle and the sabre's carriage over the first `REACH` seconds and the hold after, so no instant refits them afresh.
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
