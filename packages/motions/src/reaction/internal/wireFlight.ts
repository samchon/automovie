import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanWireFlight,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { standUpright } from "../../actions/internal/standUpright";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanJoints } from "../../compose/internal/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "../../compose/internal/AutoMovieMotionHumanRoot";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { ReactionFeet } from "./ReactionFeet";
import { wireFlightTouches } from "./wireFlightTouches";

/*
 * A wire flight along an authored path (`IAutoMovieMotionHumanWireFlight`). The
 * root moves along the polyline from the entry root through the waypoints to
 * the end by arc length on one minimum-jerk profile (Flash and Hogan 1985), so
 * it starts and ends at rest; the feet stay planted over `LIFT`, a heel rising
 * about its ball once its leg has straightened under the rising body, and the
 * shape blends in over the first quarter of the flight and out over the last,
 * from and back to the quiet stance's joints: the column upright and the arms
 * hanging relaxed with their digits clear of the thighs (`stand.relaxed`), so a
 * flight lands in the stance the stand law holds. The heading turns the body's
 * front-back line onto the horizontal travel of the whole path by the shorter
 * turn (a travel behind is flown backward), once the wire has taken the weight
 * and the feet have left the floor, by the end of the first quarter: planted
 * feet hold the heading, which the hips cannot turn far. No gravity is checked:
 * the flight is staged on wires.
 */
export namespace wireFlight {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "wireFlight";

  /*
   * Cancel table: none; a flight runs to its end.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /*
   * A flight's path: its points, their running lengths and its heading.
   */
  export interface IPath {
    /*
     * The start, the waypoints and the end.
     */
    points: IAutoMovieVector3[];

    /*
     * Each point's distance along the path, metres.
     */
    lengths: number[];

    /*
     * The path's whole length, metres.
     */
    total: number;

    /*
     * The start-to-end displacement, metres.
     */
    travel: IAutoMovieVector3;

    /*
     * The heading along the level travel, the entry's when it rises straight,
     * degrees.
     */
    heading: number;
  }

  /*
   * Admit a wire flight's path from the entry through its waypoints to its end.
   * Parameter seconds: The flight's seconds.
   * Parameter entry: The entry posture: its root and heading.
   * Parameter via: The waypoints.
   * Parameter to: The end.
   * Returns: The path.
   * When the flight takes no time or the path has no
   * length.
   */
  export function path(
    seconds: number,
    entry: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    via: readonly IAutoMovieVector3[],
    to: IAutoMovieVector3,
  ): IPath {
    if (!(seconds > 0))
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "duration",
        value: seconds,
        feasible: {
          kind: "range",
          unit: "s",
          minimum: 0,
          maximum: Number.MAX_VALUE,
        },
        reason: "a flight takes a positive time",
        fix: "give a positive flight time",
      });
    const points: IAutoMovieVector3[] = [entry.root, ...via, to];
    const lengths: number[] = [0];
    for (let k: number = 1; k < points.length; ++k)
      lengths.push(
        lengths[k - 1]! + Vector3.distance(points[k - 1]!, points[k]!),
      );
    const total: number = lengths[lengths.length - 1]!;
    if (!(total > 1e-6))
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "to",
        value: "the start",
        feasible: {
          kind: "alternatives",
          values: ["a point away from the start"],
        },
        reason: "a flight path has a length",
        fix: "give an end or a waypoint away from where the body stands",
      });
    const travel: IAutoMovieVector3 = Vector3.subtract(to, entry.root);
    return {
      points,
      lengths,
      total,
      travel,
      heading:
        Math.hypot(travel.x, travel.z) > 1e-6
          ? (Math.atan2(travel.x, travel.z) * 180) / Math.PI
          : entry.yaw,
    };
  }
  /*
   * Plan a wire flight.
   * Parameter context: The action's context.
   * Returns: The plan.
   * On `seconds` when not positive and finite, and on
   * `to` when the path has no length.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWireFlight.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const seconds: number = context.params.duration;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const { points, lengths, total, heading }: wireFlight.IPath = path(
      seconds,
      entry,
      context.params.via ?? [],
      context.params.to,
    );
    // The body's front-back line is laid on the travel by the shorter turn:
    // a travel behind the body is flown backward, facing as it stood, as a
    // performer yanked back on a wire is, never turned about on the spot. A
    // lift whose end lies a few centimetres behind the stance's root (the
    // stand holds its root ahead of the feet) is thus no half turn.
    const facing: number = wrap(heading - entry.yaw);
    const turn: number = Math.abs(facing) > 90 ? wrap(facing - 180) : facing;
    const shape: IShape = SHAPES[context.params.shape ?? "hover"];
    // The quiet stance the flight leaves and lands in: the column upright
    // and the arms hanging relaxed, digits clear of the thighs
    // (`stand.relaxed`). The shape's authored angles are blended toward from
    // it, so a bone the shape does not name keeps its hanging angle.
    const quiet: IAutoMovieMotionHumanPosture["joints"] = {
      ...stand.relaxed(context.body),
      ...standUpright(context.body).joints,
    };
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(seconds, [
      { name: "takeoff", seconds: 0 },
      { name: "land", seconds },
    ]);

    // The point at an arc length along the polyline.
    const along = (s: number): IAutoMovieVector3 => {
      let k: number = 1;
      while (k < lengths.length - 1 && lengths[k]! < s) ++k;
      const span: number = lengths[k]! - lengths[k - 1]!;
      const u: number = span > 0 ? (s - lengths[k - 1]!) / span : 0;
      return Vector3.add(
        points[k - 1]!,
        Vector3.scale(Vector3.subtract(points[k]!, points[k - 1]!), u),
      );
    };
    // The arc length gone at a second, on one minimum-jerk profile.
    const gone = (t: number): number => total * AutoMovieEngineMotionSampling.minimumJerkShare(t / seconds);
    // The feet stay planted while the wire takes the weight (`LIFT`), the
    // heels rising as the body rises past the straightened legs, then leave
    // the floor.
    const release: number = LIFT * seconds;
    // The shape's weight: in over the first quarter, out over the last.
    const weight = (t: number): number => {
      const u: number = t / seconds;
      return u < 0.25
        ? AutoMovieEngineMotionSampling.minimumJerk(u / 0.25).s
        : u > 0.75
          ? AutoMovieEngineMotionSampling.minimumJerk((1 - u) / 0.25).s
          : 1;
    };

    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(
          seconds,
          {
            root: entry.root,
            yaw: entry.yaw,
            pitch: 0,
            roll: 0,
            joints: quiet,
            limbs: {},
          },
          [],
        ),
        clock,
        primitives: [
          {
            channels: ["root"],
            reads: ["root"],
            from: 0,
            to: seconds,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              t: number,
              _before?: IAutoMovieMotionHumanPrimitive.Reader,
            ): IAutoMovieMotionHumanPosture => {
              const at: IAutoMovieVector3 = along(gone(t));
              const offset: IAutoMovieVector3 = Vector3.subtract(
                at,
                entry.root,
              );
              return AutoMovieMotionHumanRoot.place(posture, {
                point: {
                  ...HumanFrame.local(
                    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
                    offset,
                  ),
                  y: offset.y,
                },
                // The planted feet hold the heading until they leave the
                // floor (`release`): a turn under planted feet would twist
                // the hips past their range. Released, the body turns by
                // the end of the flight's first quarter.
                yaw:
                  turn *
                  AutoMovieEngineMotionSampling.minimumJerkShare((t - release) / (0.25 * seconds - release)),
              });
            },
          },
          AutoMovieMotionHumanLean.tilt({
            from: 0,
            to: seconds,
            angles: (t: number): IAutoMovieMotionHumanLean.IAngles => ({
              pitch: shape.pitch * weight(t),
              roll: 0,
            }),
          }),
          AutoMovieMotionHumanJoints.add({
            channels: ["head", "leftLeg", "rightLeg", "leftArm", "rightArm"],
            from: 0,
            to: seconds,
            delta: (t: number): IAutoMovieMotionHumanJoints.Angles => {
              // The part of the way from the quiet angle to the shape's.
              const w: number = weight(t);
              const out: IAutoMovieMotionHumanJoints.Angles = {};
              for (const [bone, angles] of Object.entries(shape.joints)) {
                const from: readonly [number, number, number] = quiet[
                  bone as keyof IAutoMovieMotionHumanPosture["joints"]
                ] ?? [0, 0, 0];
                out[bone as keyof IAutoMovieMotionHumanJoints.Angles] = [
                  (angles![0] - from[0]) * w,
                  (angles![1] - from[1]) * w,
                  (angles![2] - from[2]) * w,
                ];
              }
              return out;
            },
          }),
        ],
      });
    const touches: readonly IAutoMovieMotionHumanWireFlight.ITouch[] =
      context.params.touches ?? [];
    // The feet stay where they stood while the wire takes the weight, until
    // `release`, a heel rising once its leg has straightened under the rising
    // body (`ReactionFeet.hold`'s heels), then rise with the body.
    const held: IAutoMovieMotionHumanActionPlan = ReactionFeet.hold(
      {
        ...plan,
        contacts: [...plan.contacts, ...ReactionFeet.plants(LIFT)],
        physicalWindow: null,
      },
      context.entry,
      context.body,
      release,
      0.5 * context.body.measure.hipHeight,
      true,
    );
    if (touches.length === 0) return held;
    // Each touch: the hand or the foot meets its surface around its share
    // (`wireFlightTouches`).
    return wireFlightTouches.apply(
      context,
      held,
      seconds,
      (t: number): IAutoMovieVector3 => along(gone(t)),
      touches,
    );
  }

  /*
   * The share of the flight the feet stay planted for while the wire takes the
   * weight: authored; a foot whose leg straightens before it raises its heel.
   */
  export const LIFT: number = 0.08;

  /*
   * How long a touch comes in before its share and goes out after, seconds
   * (`wireFlightTouches.TOUCH`).
   */
  export const TOUCH: number = wireFlightTouches.TOUCH;

  /*
   * The shoulder's height on a standing body, in statures
   * (`wireFlightTouches.SHOULDER`).
   */
  export const SHOULDER: number = wireFlightTouches.SHOULDER;

  /*
   * The ankle's height above the sole, in statures (`wireFlightTouches.ANKLE`).
   */
  export const ANKLE: number = wireFlightTouches.ANKLE;

  /*
   * How far the wrist stands off a surface the palm lies on, metres
   * (`wireFlightTouches.PALM`).
   */
  export const PALM: number = wireFlightTouches.PALM;

  /*
   * One flight shape: the body's pitch and joint angles, degrees (provisional
   * stage readings).
   */
  interface IShape {
    /*
     * Whole-body pitch, degrees; positive face down.
     */
    pitch: number;
    /*
     * Clinical angle triples by bone, degrees.
     */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }

  /*
   * The flight shapes (provisional stage readings).
   */
  const SHAPES: Readonly<
    Record<IAutoMovieMotionHumanWireFlight.Shape, IShape>
  > = {
    superman: {
      pitch: 85,
      joints: {
        neck: [-40, 0, 0],
        leftUpperArm: [170, 10, 0],
        rightUpperArm: [60, 10, 0],
        rightLowerArm: [90, 0, 0],
      },
    },
    hover: {
      pitch: 0,
      joints: { leftUpperArm: [10, 20, 0], rightUpperArm: [10, 20, 0] },
    },
    seated: {
      pitch: -10,
      joints: {
        leftUpperLeg: [90, 5, 0],
        rightUpperLeg: [90, 5, 0],
        leftLowerLeg: [90, 0, 0],
        rightLowerLeg: [90, 0, 0],
        leftUpperArm: [30, 10, 0],
        rightUpperArm: [30, 10, 0],
        leftLowerArm: [60, 0, 0],
        rightLowerArm: [60, 0, 0],
      },
    },
    limp: {
      pitch: 0,
      joints: {
        neck: [25, 0, 0],
        leftUpperArm: [5, 20, 0],
        rightUpperArm: [5, 20, 0],
        leftLowerArm: [15, 0, 0],
        rightLowerArm: [15, 0, 0],
        leftUpperLeg: [3, 3, 0],
        rightUpperLeg: [3, 3, 0],
        leftLowerLeg: [15, 0, 0],
        rightLowerLeg: [15, 0, 0],
      },
    },
    stride: {
      pitch: 10,
      joints: {
        leftUpperLeg: [60, 5, 0],
        rightUpperLeg: [-20, 5, 0],
        leftLowerLeg: [70, 0, 0],
        rightLowerLeg: [40, 0, 0],
        leftUpperArm: [-30, 10, 0],
        rightUpperArm: [50, 10, 0],
        leftLowerArm: [60, 0, 0],
        rightLowerArm: [60, 0, 0],
      },
    },
  };

  /*
   * A heading difference wrapped into (-180, 180].
   */
  function wrap(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }
}
