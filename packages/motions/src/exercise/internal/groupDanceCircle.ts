import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanGroupDance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { ExerciseKey } from "./ExerciseKey";

/**
 * A circle dance: the members stand evenly round a centre facing it, hands
 * joined with their neighbours in a low V, and side-step round it, the right
 * foot out on odd beats and the left closing on even ones, so the circle
 * rotates `STEP` of the feet's spacing a step pair.
 *
 * The joined hands meet at the chord's midpoint between neighbours at the mean
 * of both members' hand heights (`HAND` of the stature), read from the shared
 * circle and the neighbours' bodies rather than from either one's steps, so
 * both hands name the same point on every frame. A circle too wide for the arms
 * to meet across is refused with the widest radius they reach.
 */
export namespace groupDanceCircle {
  /** A side step, a share of the feet's spacing (provisional). */
  export const STEP: number = 1;

  /**
   * The joined hands' height, a share of the stature: a low V hold
   * (provisional).
   */
  export const HAND: number = 0.5;

  /** A travelling foot's lift, a share of the stature (provisional). */
  export const LIFT: number = 0.03;

  /** A foot's travel into a beat, a share of the beat. */
  export const TRAVEL: number = 0.45;

  /**
   * The circle dance's course.
   *
   * @param context The member's context.
   * @param beats The member's beat clock, its offset already in.
   * @param shared The shared beat clock, without the member's offset.
   * @returns The course.
   * @throws {HumanRefusal} When the centre or the count is missing, or the
   *   neighbours' hands cannot meet.
   */
  export function course(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGroupDance.IParams>,
    beats: IAutoMovieMotionHumanDanceBeats,
    shared: IAutoMovieMotionHumanDanceBeats,
  ): IAutoMovieMotionHumanDanceCourse {
    const p: IAutoMovieMotionHumanGroupDance.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    if (p.centre === undefined || p.members === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "centre",
        value: p.centre ?? null,
        reason: "a circle dance needs its centre and how many dance in it",
        fix: "give centre and members",
      });
    const centre: IAutoMovieVector3 = { ...p.centre, y: 0 };
    const start: IAutoMovieVector3 = {
      x:
        (context.entry.feet.left.ankle.x + context.entry.feet.right.ankle.x) /
        2,
      y: 0,
      z:
        (context.entry.feet.left.ankle.z + context.entry.feet.right.ankle.z) /
        2,
    };
    const radius: number = Vector3.length(Vector3.subtract(start, centre));
    const angle0: number = Math.atan2(start.x - centre.x, start.z - centre.z);
    const half: number =
      Math.hypot(
        context.entry.feet.left.ankle.x - context.entry.feet.right.ankle.x,
        context.entry.feet.left.ankle.z - context.entry.feet.right.ankle.z,
      ) / 2;
    const floor: number =
      (context.entry.feet.left.ankle.y + context.entry.feet.right.ankle.y) / 2;
    // Facing the centre, the right hand lies toward the rising angle.
    const sweep: number = (2 * STEP * half) / radius;
    const gap: number = (2 * Math.PI) / p.members;

    // The joined hands' point: the chord's midpoint, at both members' height.
    const height: (other: string | undefined) => number = (
      other: string | undefined,
    ): number =>
      (HAND * body.measure.stature +
        HAND *
          (other === undefined
            ? body.measure.stature
            : context.performer(other).body.measure.stature)) /
      2;
    const reach: number =
      body.measure.upperArm + body.measure.forearm + body.measure.hand;
    const chord: number = radius * Math.sin(gap / 2);
    const shoulder: number = body.measure.shoulderHalfWidth;
    if (chord - shoulder > reach)
      throw new HumanRefusal({
        kind: "reach",
        axis: "centre",
        value: radius,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: (reach + shoulder) / Math.sin(gap / 2),
          unit: "m",
        },
        reason: `neighbours ${(2 * chord).toFixed(2)} m apart cannot join hands`,
        fix: "draw the circle tighter or add members",
      });

    // The station's angle on the shared clock: a step pair a sweep.
    const station: (
      t: number,
      clock: IAutoMovieMotionHumanDanceBeats,
    ) => number = (
      t: number,
      clock: IAutoMovieMotionHumanDanceBeats,
    ): number => {
      const u: number = Math.max(0, (t - clock.at(1)) / (2 * clock.period));
      const pairs: number = Math.min(Math.floor(clock.count / 2), u);
      return angle0 + sweep * pairs;
    };
    const place: (
      angle: number,
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      angle: number,
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.IPlacement => {
      const out: IAutoMovieVector3 = {
        x: Math.sin(angle),
        y: 0,
        z: Math.cos(angle),
      };
      const yaw: number = (Math.atan2(-out.x, -out.z) * 180) / Math.PI;
      const left: IAutoMovieVector3 = { x: -out.z, y: 0, z: out.x };
      const point: IAutoMovieVector3 = Vector3.add(
        Vector3.add(centre, Vector3.scale(out, radius)),
        Vector3.scale(left, side === "left" ? half : -half),
      );
      return {
        ankle: { ...point, y: floor },
        rotation: HumanFoot.rotation(yaw, 0),
      };
    };
    const end: number = beats.at(beats.count) + beats.period;
    const travel: number = TRAVEL * beats.period;
    const keys: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanDanceFootKey[]
    > = {
      left: [
        {
          at: 0,
          leave: Infinity,
          place: { ...context.entry.feet.left },
          bears: true,
          clearance: 0,
        },
      ],
      right: [
        {
          at: 0,
          leave: Infinity,
          place: { ...context.entry.feet.right },
          bears: true,
          clearance: 0,
        },
      ],
    };
    for (let k: number = 1; k <= beats.count; k++) {
      const side: AutoMovieHumanSide = k % 2 === 1 ? "right" : "left";
      const pair: number = Math.ceil(k / 2);
      const list: IAutoMovieMotionHumanDanceFootKey[] = keys[side];
      const t: number = beats.at(k);
      const last: IAutoMovieMotionHumanDanceFootKey = list[list.length - 1]!;
      last.leave = Math.max(last.at, t - travel);
      list.push({
        at: t,
        leave: Infinity,
        place: place(angle0 + sweep * pair, side),
        bears: true,
        clearance: LIFT * body.measure.stature,
      });
    }
    for (const side of ["left", "right"] as const)
      keys[side][keys[side].length - 1]!.leave = end;

    const hand: (
      t: number,
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanArmTarget.ITarget = (
      t: number,
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanArmTarget.ITarget => {
      const angle: number = station(t, shared);
      const toward: number = side === "right" ? 1 : -1;
      const mid: number = angle + (toward * gap) / 2;
      const point: IAutoMovieVector3 = {
        x: centre.x + radius * Math.cos(gap / 2) * Math.sin(mid),
        y:
          floor -
          body.rest.get("leftFoot")!.y +
          height(side === "left" ? p.left : p.right),
        z: centre.z + radius * Math.cos(gap / 2) * Math.cos(mid),
      };
      const yaw: number =
        (Math.atan2(-Math.sin(angle), -Math.cos(angle)) * 180) / Math.PI;
      return {
        surface: "palm",
        shape: "relaxed",
        point,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
        bend: { ...point, y: point.y - 0.3 },
      };
    };
    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      {},
      {},
    ).joints;
    return {
      duration: end,
      left: keys.left,
      right: keys.right,
      hips: (): IAutoMovieVector3 => entry.root,
      yaw: (t: number): number => {
        const angle: number = station(t, beats);
        return (Math.atan2(-Math.sin(angle), -Math.cos(angle)) * 180) / Math.PI;
      },
      joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
      hands: (t: number): IAutoMovieMotionHumanDanceCourse.IHands => ({
        ...(p.left === undefined ? {} : { left: hand(t, "left") }),
        ...(p.right === undefined ? {} : { right: hand(t, "right") }),
      }),
      holds: [
        ...(p.left === undefined
          ? []
          : [
              {
                side: "left" as const,
                subject: p.left,
                bone: "rightHand" as const,
                from: 0,
                to: 1,
              },
            ]),
        ...(p.right === undefined
          ? []
          : [
              {
                side: "right" as const,
                subject: p.right,
                bone: "leftHand" as const,
                from: 0,
                to: 1,
              },
            ]),
      ],
      instants: [],
    };
  }
}
