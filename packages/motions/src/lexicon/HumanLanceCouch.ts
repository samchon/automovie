import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLanceCouch,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanMountedPresentation } from "./HumanMountedPresentation";
import { HumanUnseatPose } from "./HumanUnseatPose";

/** The law's context. */
type Context =
  IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLanceCouch>;

/**
 * The carry's upper arm from the shoulder in the seat frame, as shares of its
 * length: out to the side and down at about 45 degrees (provisional).
 */
const UPPER: Readonly<IAutoMovieVector3> = { x: -0.7, y: -0.7, z: 0 };

/**
 * The carried shaft's direction in the seat frame: along the travel, the point
 * a little down and in, so the butt behind the grip rises clear of the horse's
 * croup and passes outside the rider's arm (provisional).
 */
const LEVEL: Readonly<IAutoMovieVector3> = { x: 0.05, y: -0.2, z: 1 };

/**
 * The step the strike is first sought at, seconds: a film frame at 60 per
 * second.
 */
const FRAME: number = 1 / 60;

/**
 * Seconds the arms take from the entry to the couch and the bridle
 * (provisional).
 */
const REACH: number = 0.5;

/**
 * A lance couched and lowered to a skill-at-arms target from the saddle
 * (`IAutoMovieMotionHumanLanceCouch`): carried on the seat contact, the right
 * hand holds the lance by its grip with the upper arm out and down from the
 * shoulder, the shaft along the travel at the grasp's angle to the forearm, and
 * the left holds both reins at their middle. The strike is the first frame at
 * which a carriage lays the lance's point on the target's own point, read in
 * the moving seat frame: the grip one lance length from the target within the
 * arm's reach, the forearm at the grasp's angle to the shaft; over `lower`
 * seconds before it the hand comes down to that carriage and the shaft onto the
 * line to the target by a minimum-jerk path between two carriages laid from the
 * arm's own line (the hand continuing the forearm, the shaft at the grasp's
 * angle to it, the elbow one upper arm from the shoulder), the point meets the
 * target at the strike, the target is set on the lance's point from then, and
 * over `lower` seconds after it the lance comes back to the couch. Register
 * `HumanLanceCouch` to use it.
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
     * @evidence contracts/development/implementation.md#principled-implementation The target closes on the rider in the seat frame as the horse comes up; once it lies within the arm's and the lance's reach of the shoulder, each frame seeks a grip one lance length from the target from which a closed-form elbow lays the forearm at the grasp's angle to the line to it, and the first frame with one is the strike; the shaft lies on that line, so the point meets the target there.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the strike, the stations, then the sampler.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target no carriage reaches is refused with the nearest it comes, never struck short.
     * @evidence contracts/development/implementation.md#efficient-algorithms One seat read and one target read per frame of the search, and a fixed set of closed-form grips only once the target is within reach; two carriages laid once; a sample reads one seat frame, the horse's shapes and the two reins.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The tool, the stations, the strike and the two carriages are shared by every sample.
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
      HumanBound.above("duration", params.duration, 0, "s");
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
      // The hand's own line and reach to the grip socket, from the body's hand placed with no turn at the origin.
      const wrist: IAutoMovieVector3 = HumanHand.place(
        context.body,
        "right",
        "grip",
        { x: 0, y: 0, z: 0 },
        Quaternion.identity(),
        "relaxed",
      ).point;
      const arm: IArm = {
        upperArm: m.upperArm,
        fore: m.forearm + Vector3.length(wrist),
        line: Vector3.normalize(Vector3.scale(wrist, -1)),
      };

      // The stations in the seat frame, from the seated root.
      // The right shoulder where the seated body actually holds it, in the seat frame.
      const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(
        context.body,
        local,
      ).get("rightUpperArm")!.worldPosition;
      const level: IAutoMovieVector3 = Vector3.normalize(LEVEL);
      // The hand the rider enters with, in the seat frame: the carry turns from it as little as it can.
      const holding: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.inverse(carrier(context.start).rotation),
        poseBones(
          context.body,
          context.entry.pose,
          undefined,
          new Set<AutoMovieHumanoidBone>(["rightHand"]),
        ).get("rightHand")!.worldRotation,
      );
      // The horse's body the carriages keep clear of: its rest shapes, the seat contact's point in its model.
      const seatContact: IAutoMovieAffordance | undefined =
        support.prop.affordances?.find(
          (a: IAutoMovieAffordance): boolean =>
            a.id === (params.frame ?? "seat"),
        );
      const horse: IHorseBody = {
        shapes: support.prop.shapes ?? [],
        seat: seatContact?.frame.translation ?? { x: 0, y: 0, z: 0 },
      };
      // A carriage the arm's own fit holds within the stroke's bound, judged on the seated body in the seat frame.
      const reaches = (laid: ICarriage): number =>
        StrikingRoll.miss(context, tool, laid.hand, tool.length, local);
      const carried: ICarriage = hanging(
        arm,
        shoulder,
        tool,
        level,
        holding,
        horse,
        reaches,
      );

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
      const armReach: number = arm.upperArm + arm.fore;
      // A carriage that lays the point on the target at an act second, if any.
      const at = (t: number): ICarriage | undefined =>
        striking(
          arm,
          shoulder,
          tool,
          seen(t),
          carried.hand.rotation,
          horse,
          reaches,
        );

      // The strike: the first frame at which a carriage lays the point on the target.
      let strike: number | undefined;
      let lowering: ICarriage | undefined;
      let nearest: number = Infinity;
      let closest: number = 0;
      for (let t: number = 0; t <= params.duration; t += FRAME) {
        const apart: number =
          Vector3.distance(seen(t), shoulder) - (tool.length + armReach);
        if (apart < nearest) {
          nearest = apart;
          closest = t;
        }
        if (apart > 0) continue;
        const found: ICarriage | undefined = at(t);
        if (found === undefined) continue;
        strike = t;
        lowering = found;
        break;
      }
      if (strike === undefined || lowering === undefined)
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: nearest + tool.length + armReach,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: tool.length + armReach,
            unit: "m",
          },
          reason: `between film seconds ${context.start.toFixed(2)} and ${(context.start + params.duration).toFixed(2)} no carriage of the lance lays its point on ${params.target.prop}'s ${params.target.point}: it comes no nearer than ${(nearest + tool.length + armReach).toFixed(2)} m from the shoulder, at ${(context.start + closest).toFixed(2)} s, against the arm's and the lance's ${(tool.length + armReach).toFixed(2)} m`,
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
      const landed: ICarriage = lowering;
      HumanMountedPresentation.turn(
        HumanMountedPresentation.bearing(0, local.root, struck),
        0,
        "right",
        "target",
      );
      // The two carriages, laid once in the seat frame from the arm's own line: the carry along `level`, the strike on the line to the target exactly, so the point meets it.

      const duration: number = params.duration;
      const shapes: NonNullable<
        IAutoMovieMotionHumanPropReader["prop"]["shapes"]
      > = support.prop.shapes ?? [];
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
          const now: IAutoMovieRigidTransform = carrier(film);
          const toWorld = (p: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(now.position, Quaternion.rotateVector(now.rotation, p));
          const shown: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
            local,
            HumanMountedFrame.LOCAL,
            now,
          );
          // Eased between the two carriages in the seat frame, then carried into the world.
          const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
            point: toWorld(
              Vector3.lerp(carried.hand.point, landed.hand.point, down),
            ),
            rotation: Quaternion.multiply(
              now.rotation,
              Quaternion.slerp(
                carried.hand.rotation,
                landed.hand.rotation,
                down,
              ),
            ),
          };
          // The lance arm keeps clear of the horse's own body, its shapes carried on its frame at this second, so a couch through the horse refuses naming its part.
          const placed: IAutoMovieRigidTransform = support.frame(film);
          const horse: IAutoMovieMotionHumanColliders.IExternal[] = shapes.map(
            (
              shape: IAutoMovieMotionHumanColliders.IExternal["shapes"][number],
            ): IAutoMovieMotionHumanColliders.IExternal => ({
              subject: params.on,
              part: shape.id,
              pose: placed,
              shapes: [shape],
            }),
          );
          shown.limbs = {
            ...shown.limbs,
            rightArm: {
              ...goal(
                frame,
                toWorld(Vector3.lerp(carried.elbow, landed.elbow, down)),
              ),
              clearExternal: horse,
            },
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

      // Both arms are laid as planned courses on these goals, so no instant refits them afresh: the lance arm clear of the horse's body, then the bridle arm on its own, whose hand holds the reins over the horse's tack.
      const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
        start: 0,
        ready: Math.min(REACH, duration),
        relax: duration,
        end: duration,
      };
      return courseArmGoal({
        context,
        plan: courseArmGoal({
          context,
          plan: goals,
          side: "right",
          span,
        }),
        side: "left",
        span,
      });
    },
  };

/**
 * A mounted arm's carriage of a held lance: the hand's frame and the elbow that
 * lays it with the wrist neutral.
 */
interface ICarriage {
  /** The hand's grip frame, seat-frame metres and rotation. */
  hand: IAutoMovieMotionHumanStrikingHeld.IHandFrame;

  /** The elbow, seat-frame metres. */
  elbow: IAutoMovieVector3;
}

/** The rider's lance arm, read from the body. */
interface IArm {
  /** The upper arm's length, metres. */
  upperArm: number;

  /**
   * From the elbow to the grip socket, metres: the forearm and the wrist's
   * distance to the grip.
   */
  fore: number;

  /**
   * The hand's own line from the wrist to the grip socket, in the hand's frame,
   * which the tool's axis is read in.
   */
  line: IAutoMovieVector3;
}

/**
 * The carriage that holds the lance along a direction with its grip at a
 * station, from the arm's own line: the hand's line continues the forearm, so
 * the shaft keeps the angle to the forearm that the hand's grasp of it holds,
 * and the elbow lies one upper arm from the shoulder, the lower of the two such
 * places.
 *
 * @param arm The rider's lance arm.
 * @param shoulder The right shoulder, seat-frame metres.
 * @param tool The held lance in the hand's frame.
 * @param grip The grip's station, seat-frame metres.
 * @param along The direction the shaft runs, seat frame.
 * @returns The hand's frame and the elbow.
 * @throws {HumanRefusal} On `target` when no elbow one upper arm from the
 *   shoulder lays the forearm at the grasp's angle to the shaft.
 */
function carriage(
  arm: IArm,
  shoulder: IAutoMovieVector3,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  grip: IAutoMovieVector3,
  along: IAutoMovieVector3,
): ICarriage {
  const d: IAutoMovieVector3 = Vector3.normalize(along);
  const shaft: IAutoMovieVector3 = Vector3.normalize(tool.axis);
  const alpha: number = Math.acos(
    Math.max(-1, Math.min(1, Vector3.dot(arm.line, shaft))),
  );
  // The forearm from the elbow to the grip socket, the hand's half included.
  const fore: number = arm.fore;
  const upper: number = arm.upperArm;
  // An orthonormal pair square to the shaft.
  const seed: IAutoMovieVector3 =
    Math.abs(d.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const p: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(seed, Vector3.scale(d, Vector3.dot(seed, d))),
  );
  const q: IAutoMovieVector3 = Vector3.cross(d, p);
  // The forearm at the grasp's angle to the shaft about it, by an angle phi: the elbow one upper arm from the shoulder solves A cos(phi) + B sin(phi) = C.
  const w: IAutoMovieVector3 = Vector3.subtract(
    Vector3.subtract(grip, shoulder),
    Vector3.scale(d, fore * Math.cos(alpha)),
  );
  const s: number = fore * Math.sin(alpha);
  const forearm = (phi: number): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.scale(d, Math.cos(alpha)),
      Vector3.scale(
        Vector3.add(
          Vector3.scale(p, Math.cos(phi)),
          Vector3.scale(q, Math.sin(phi)),
        ),
        Math.sin(alpha),
      ),
    );
  let f: IAutoMovieVector3;
  if (s < 1e-6) f = d;
  else {
    const A: number = Vector3.dot(w, p);
    const B: number = Vector3.dot(w, q);
    const C: number = (Vector3.dot(w, w) + s * s - upper * upper) / (2 * s);
    const R: number = Math.hypot(A, B);
    if (R < 1e-9 || Math.abs(C) > R)
      throw new HumanRefusal({
        kind: "reach",
        axis: "target",
        value: Vector3.distance(grip, shoulder),
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: upper + fore,
          unit: "m",
        },
        reason: `no elbow one upper arm from the shoulder lays the forearm at the grasp's ${((alpha * 180) / Math.PI).toFixed(0)} degrees to the lance with the grip ${Vector3.distance(grip, shoulder).toFixed(2)} m from the shoulder`,
        fix: "hold the lance nearer the shoulder or along another line",
      });
    const base: number = Math.atan2(B, A);
    const spread: number = Math.acos(C / R);
    const one: IAutoMovieVector3 = forearm(base + spread);
    const two: IAutoMovieVector3 = forearm(base - spread);
    // The lower elbow: the arm hangs from the shoulder rather than raising it.
    f = one.y >= two.y ? one : two;
  }
  const elbow: IAutoMovieVector3 = Vector3.subtract(
    grip,
    Vector3.scale(f, fore),
  );
  // The hand's line onto the forearm, then turned about it until the shaft runs along `d`.
  const onto: IAutoMovieQuaternion = between(arm.line, f);
  const turned: IAutoMovieVector3 = Quaternion.rotateVector(onto, shaft);
  const a: IAutoMovieVector3 = Vector3.subtract(
    turned,
    Vector3.scale(f, Vector3.dot(turned, f)),
  );
  const b: IAutoMovieVector3 = Vector3.subtract(
    d,
    Vector3.scale(f, Vector3.dot(d, f)),
  );
  const roll: number =
    Vector3.length(a) < 1e-9 || Vector3.length(b) < 1e-9
      ? 0
      : Math.atan2(Vector3.dot(f, Vector3.cross(a, b)), Vector3.dot(a, b));
  return {
    hand: {
      point: grip,
      rotation: Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(f, (roll * 180) / Math.PI),
          onto,
        ),
      ),
    },
    elbow,
  };
}

/**
 * The carry from the arm's own line: the upper arm out and down from the
 * shoulder (`UPPER`), the forearm at the grasp's angle to the shaft, clear of
 * the horse, turned about the shaft to the place whose hand turns least from
 * the hand the rider enters with, so the forearm twists no further than it
 * must; the grip at the forearm's end.
 *
 * @param arm The rider's lance arm.
 * @param shoulder The right shoulder, seat-frame metres.
 * @param tool The held lance in the hand's frame.
 * @param along The direction the shaft runs, seat frame.
 * @param entered The entry hand's rotation, seat frame.
 * @param horse The horse's body, which the carriage keeps clear of.
 * @param reaches Whether the arm's own fit holds a carriage.
 * @returns The hand's frame and the elbow.
 * @throws {HumanRefusal} On `target` when no forearm about the shaft lays the
 *   carry.
 */
function hanging(
  arm: IArm,
  shoulder: IAutoMovieVector3,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  along: IAutoMovieVector3,
  entered: IAutoMovieQuaternion,
  horse: IHorseBody,
  reaches: (laid: ICarriage) => number,
): ICarriage {
  const d: IAutoMovieVector3 = Vector3.normalize(along);
  const alpha: number = Math.acos(
    Math.max(
      -1,
      Math.min(1, Vector3.dot(arm.line, Vector3.normalize(tool.axis))),
    ),
  );
  const seed: IAutoMovieVector3 =
    Math.abs(d.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const p: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(seed, Vector3.scale(d, Vector3.dot(seed, d))),
  );
  const q: IAutoMovieVector3 = Vector3.cross(d, p);
  const elbow: IAutoMovieVector3 = Vector3.add(
    shoulder,
    Vector3.scale(Vector3.normalize(UPPER), arm.upperArm),
  );
  const options: IOption[] = [];
  let laidCount: number = 0;
  for (let around: number = 0; around < 360; around += AROUND) {
    const phi: number = (around * Math.PI) / 180;
    const u: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(p, Math.cos(phi)),
      Vector3.scale(q, Math.sin(phi)),
    );
    const f: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(d, Math.cos(alpha)),
      Vector3.scale(u, Math.sin(alpha)),
    );
    const grip: IAutoMovieVector3 = Vector3.add(
      elbow,
      Vector3.scale(f, arm.fore),
    );
    try {
      const laid: ICarriage = carriage(arm, shoulder, tool, grip, d);
      ++laidCount;
      if (!clear(horse, laid)) continue;
      options.push({
        laid,
        turn: Quaternion.angle(laid.hand.rotation, entered),
      });
    } catch (error: unknown) {
      if (!(error instanceof HumanRefusal)) throw error;
    }
  }
  const best: ICarriage | undefined = pick(options, reaches);
  if (best === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "target",
      value: (alpha * 180) / Math.PI,
      feasible: null,
      reason: `no forearm at the grasp's ${((alpha * 180) / Math.PI).toFixed(0)} degrees to the lance lays its carry from the upper arm out and down: ${laidCount} of ${360 / AROUND} turns about the shaft lay an arm, ${options.length} of them clear the horse, and the arm's own fit holds none of the ${Math.min(TRIES, options.length)} turning least, the nearest leaving the lance ${(nearestMiss * 1000).toFixed(0)} mm off`,
      fix: "take the lance by a grasp nearer its own line",
    });
  return best;
}

/**
 * A carriage found, and how far its hand turns from the one it is weighed
 * against, radians.
 */
interface IOption {
  /** The carriage. */
  laid: ICarriage;

  /** Its hand's turn. */
  turn: number;
}

/**
 * How many of the least-turning carriages are tried against the arm's own fit
 * (provisional: the fit is the costliest step).
 */
const TRIES: number = 12;

/**
 * The least-turning carriage the arm's own fit holds within
 * `StrikingRoll.MISS`, of the first `TRIES`, or undefined; the least miss read
 * is kept in `nearestMiss` for a refusal.
 */
function pick(
  options: readonly IOption[],
  reaches: (laid: ICarriage) => number,
): ICarriage | undefined {
  const ordered: IOption[] = [...options].sort(
    (a: IOption, b: IOption): number => a.turn - b.turn,
  );
  nearestMiss = Infinity;
  for (const option of ordered.slice(0, TRIES)) {
    const miss: number = reaches(option.laid);
    nearestMiss = Math.min(nearestMiss, miss);
    if (miss <= StrikingRoll.MISS) return option.laid;
  }
  return undefined;
}

/** The least miss the last `pick` read, metres. */
let nearestMiss: number = Infinity;

/**
 * The directions a strike's grip is sought from the target in: around the
 * target's vertical, in degrees.
 */
const AROUND: number = 15;

/** And above and below the target's level, in degrees. */
const UPDOWN: number = 10;

/**
 * A carriage that lays the lance's point on a target, if any: the grip one
 * lance length from the target, within the arm's reach, with an elbow that lays
 * the forearm at the grasp's angle to the line to the target; of those found,
 * the one whose hand turns least from the carry's.
 *
 * @param arm The rider's lance arm.
 * @param shoulder The right shoulder, seat-frame metres.
 * @param tool The held lance in the hand's frame.
 * @param target The target's point, seat-frame metres.
 * @param from The carry's hand rotation, seat frame.
 * @param horse The horse's body, which the carriage keeps clear of.
 * @param reaches Whether the arm's own fit holds a carriage.
 * @returns The carriage, or undefined when none lays the point on the target.
 */
function striking(
  arm: IArm,
  shoulder: IAutoMovieVector3,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  target: IAutoMovieVector3,
  from: IAutoMovieQuaternion,
  horse: IHorseBody,
  reaches: (laid: ICarriage) => number,
): ICarriage | undefined {
  const reach: number = arm.upperArm + arm.fore;
  const options: IOption[] = [];
  for (let up: number = -90; up <= 90; up += UPDOWN)
    for (let around: number = 0; around < 360; around += AROUND) {
      const a: number = (around * Math.PI) / 180;
      const e: number = (up * Math.PI) / 180;
      const back: IAutoMovieVector3 = {
        x: Math.cos(e) * Math.sin(a),
        y: Math.sin(e),
        z: Math.cos(e) * Math.cos(a),
      };
      const grip: IAutoMovieVector3 = Vector3.add(
        target,
        Vector3.scale(back, tool.length),
      );
      if (Vector3.distance(grip, shoulder) > reach) continue;
      try {
        const laid: ICarriage = carriage(
          arm,
          shoulder,
          tool,
          grip,
          Vector3.scale(back, -1),
        );
        if (!clear(horse, laid)) continue;
        options.push({
          laid,
          turn: Quaternion.angle(laid.hand.rotation, from),
        });
      } catch (error: unknown) {
        if (!(error instanceof HumanRefusal)) throw error;
      }
    }
  return pick(options, reaches);
}

/** The least rotation taking one unit direction onto another. */
function between(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const u: IAutoMovieVector3 = Vector3.normalize(from);
  const v: IAutoMovieVector3 = Vector3.normalize(to);
  const dot: number = Math.max(-1, Math.min(1, Vector3.dot(u, v)));
  const axis: IAutoMovieVector3 = Vector3.cross(u, v);
  if (Vector3.length(axis) < 1e-9) {
    if (dot > 0) return Quaternion.identity();
    const side: IAutoMovieVector3 =
      Math.abs(u.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    return Quaternion.fromAxisAngle(
      Vector3.normalize(Vector3.cross(u, side)),
      180,
    );
  }
  return Quaternion.fromAxisAngle(
    Vector3.normalize(axis),
    (Math.acos(dot) * 180) / Math.PI,
  );
}

/**
 * The horse's body as a carriage keeps clear of it: its rest shapes, and where
 * the seat lies in its model.
 */
interface IHorseBody {
  /** The horse's physical shapes in its model frame. */
  shapes: readonly IAutoMoviePhysicalShape[];

  /**
   * The seat contact's point in the horse's model frame, metres; the seat
   * frame's axes are the model's.
   */
  seat: IAutoMovieVector3;
}

/**
 * How near the horse's shapes a hand, forearm or elbow may come, metres: half a
 * hand's thickness with the skin (provisional).
 */
const CLEAR: number = 0.06;

/**
 * Whether a carriage keeps its grip, the middle of its forearm and its elbow
 * clear of the horse's shapes by `CLEAR`.
 *
 * @param horse The horse's body.
 * @param laid The carriage, in the seat frame.
 * @returns Whether every point clears.
 */
function clear(horse: IHorseBody, laid: ICarriage): boolean {
  const points: IAutoMovieVector3[] = [
    laid.hand.point,
    Vector3.lerp(laid.hand.point, laid.elbow, 0.5),
    laid.elbow,
  ];
  return points.every(
    (p: IAutoMovieVector3): boolean =>
      apart(horse.shapes, Vector3.add(horse.seat, p)) >= CLEAR,
  );
}

/**
 * A point's least signed distance from shapes in their common frame, metres:
 * exact for a sphere, a capsule and a box, and from a hull's bounding sphere
 * about its centroid, which never reads a hull nearer than it is.
 */
function apart(
  shapes: readonly IAutoMoviePhysicalShape[],
  point: IAutoMovieVector3,
): number {
  let least: number = Infinity;
  for (const shape of shapes) {
    const l: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(shape.transform.rotation),
      Vector3.subtract(point, shape.transform.position),
    );
    let d: number;
    if (shape.kind === "sphere") d = Vector3.length(l) - shape.radius;
    else if (shape.kind === "capsule")
      d =
        Vector3.length({
          x: l.x,
          y: l.y - Math.max(-shape.halfLength, Math.min(shape.halfLength, l.y)),
          z: l.z,
        }) - shape.radius;
    else if (shape.kind === "box") {
      const q: IAutoMovieVector3 = {
        x: Math.abs(l.x) - shape.halfExtents.x,
        y: Math.abs(l.y) - shape.halfExtents.y,
        z: Math.abs(l.z) - shape.halfExtents.z,
      };
      d =
        Vector3.length({
          x: Math.max(q.x, 0),
          y: Math.max(q.y, 0),
          z: Math.max(q.z, 0),
        }) + Math.min(Math.max(q.x, q.y, q.z), 0);
    } else {
      const centre: IAutoMovieVector3 = Vector3.scale(
        shape.points.reduce(
          (sum: IAutoMovieVector3, v: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(sum, v),
          { x: 0, y: 0, z: 0 },
        ),
        1 / shape.points.length,
      );
      const radius: number = Math.max(
        ...shape.points.map((v: IAutoMovieVector3): number =>
          Vector3.distance(v, centre),
        ),
      );
      d = Vector3.distance(l, centre) - radius;
    }
    least = Math.min(least, d);
  }
  return least;
}
