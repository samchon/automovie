import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanGroupDance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { ExerciseKey } from "./ExerciseKey";

/*
 * A conga line: each member steps forward on three counts, `STEP` foot lengths
 * a step, and kicks the next foot out to the side on the fourth, `KICK` of the
 * stature out and up; the next bar begins on that foot. A member with someone
 * ahead rests both hands on that member's shoulders, read from the one ahead's
 * displayed bones on every frame, so the hands stay on them whatever their
 * timing. One whose hands cannot reach the shoulders ahead at the start is
 * refused with the reach.
 */
export namespace groupDanceConga {
  /*
   * A step, foot lengths (provisional).
   */
  export const STEP: number = 1.2;

  /*
   * The kick's reach out and up, a share of the stature (provisional).
   */
  export const KICK: number = 0.12;

  /*
   * A foot's travel into a count, a share of a beat.
   */
  export const TRAVEL: number = 0.45;

  /*
   * How far above the shoulder joint the palm rests, metres.
   */
  export const ON: number = 0.06;

  /*
   * The conga's course.
   * Parameter context: The member's context.
   * Parameter beats: The member's beat clock, its offset already in.
   * Parameter bars: How many four-count bars.
   * Returns: The course.
   * When the shoulders ahead lie beyond the arms at the
   * start.
   */
  export function course(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGroupDance.IParams>,
    beats: IAutoMovieMotionHumanDanceBeats,
    bars: number,
  ): IAutoMovieMotionHumanDanceCourse {
    const p: IAutoMovieMotionHumanGroupDance.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 1, y: 0, z: 0 },
    );
    const step: number = STEP * body.measure.footLength;
    const kick: number = KICK * body.measure.stature;
    const travel: number = TRAVEL * beats.period;
    const end: number = beats.at(beats.count) + beats.period;
    const ground: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
      left: { ...context.entry.feet.left },
      right: { ...context.entry.feet.right },
    };
    const keys: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanDanceFootKey[]
    > = {
      left: [
        {
          at: 0,
          leave: Infinity,
          place: ground.left,
          bears: true,
          clearance: 0,
        },
      ],
      right: [
        {
          at: 0,
          leave: Infinity,
          place: ground.right,
          bears: true,
          clearance: 0,
        },
      ],
    };
    const push: (
      side: AutoMovieHumanSide,
      key: IAutoMovieMotionHumanDanceFootKey,
    ) => void = (
      side: AutoMovieHumanSide,
      key: IAutoMovieMotionHumanDanceFootKey,
    ): void => {
      const list: IAutoMovieMotionHumanDanceFootKey[] = keys[side];
      const last: IAutoMovieMotionHumanDanceFootKey = list[list.length - 1]!;
      last.leave = Math.max(last.at, Math.min(last.leave, key.at - travel));
      list.push(key);
    };
    let lead: AutoMovieHumanSide = "right";
    for (let b: number = 0; b < bars; b++) {
      const other: AutoMovieHumanSide = lead === "left" ? "right" : "left";
      [lead, other, lead].forEach(
        (side: AutoMovieHumanSide, i: number): void => {
          ground[side] = {
            ankle: Vector3.add(
              ground[side].ankle,
              Vector3.scale(forward, step),
            ),
            rotation: ground[side].rotation,
          };
          push(side, {
            at: beats.at(4 * b + i + 1),
            leave: Infinity,
            place: ground[side],
            bears: true,
            clearance: 0.02 * body.measure.stature,
          });
        },
      );
      // The kick: the other foot out to its side and up, unborne.
      const out: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: Vector3.add(
          Vector3.add(
            ground[other].ankle,
            Vector3.scale(left, other === "left" ? kick : -kick),
          ),
          { x: 0, y: kick, z: 0 },
        ),
        rotation: HumanFoot.rotation(
          HumanFoot.heading(ground[other].rotation),
          -20,
        ),
      };
      push(other, {
        at: beats.at(4 * b + 4),
        leave: beats.at(4 * b + 4),
        place: out,
        bears: false,
        clearance: 0,
      });
      lead = other;
    }
    // The last kicked foot comes down beside the other.
    push(lead, {
      at: end - 0.2 * beats.period,
      leave: end,
      place: ground[lead],
      bears: true,
      clearance: 0.02 * body.measure.stature,
    });
    for (const side of ["left", "right"] as const)
      keys[side][keys[side].length - 1]!.leave = end;

    // The hands on the shoulders ahead.
    const ahead: string | undefined = p.ahead;
    const reach: number =
      body.measure.upperArm + body.measure.forearm + body.measure.hand;
    const shoulder: (
      t: number,
      side: AutoMovieHumanSide,
    ) => IAutoMovieVector3 = (
      t: number,
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = context
        .performer(ahead!)
        .bones(context.start + t, HumanBoneGroups.SHOULDERS);
      return Vector3.add(
        bones.get(side === "left" ? "leftUpperArm" : "rightUpperArm")!
          .worldPosition,
        { x: 0, y: ON, z: 0 },
      );
    };
    if (ahead !== undefined) {
      const mine: IAutoMovieVector3 = Vector3.add(context.entry.posture.root, {
        x: 0,
        y: body.rest.get("leftUpperArm")!.y - body.rest.get("hips")!.y,
        z: 0,
      });
      const far: number = Vector3.length(
        Vector3.subtract(shoulder(0, "left"), mine),
      );
      if (far > reach + body.measure.shoulderHalfWidth)
        throw new HumanRefusal({
          kind: "reach",
          axis: "ahead",
          value: ahead,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: reach + body.measure.shoulderHalfWidth,
            unit: "m",
          },
          reason: `the shoulders of ${ahead} are ${far.toFixed(2)} m away, beyond the arms`,
          fix: "close up behind the member ahead",
        });
    }
    const target: (
      t: number,
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanArmTarget.ITarget = (
      t: number,
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanArmTarget.ITarget => {
      const point: IAutoMovieVector3 = shoulder(t, side);
      return {
        surface: "palm",
        shape: "relaxed",
        point,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, entry.yaw),
        bend: { ...point, y: point.y - 0.3 },
      };
    };
    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      {},
      { shoulder: 30, raise: 20, elbow: 70 },
    ).joints;
    return {
      duration: end,
      left: keys.left,
      right: keys.right,
      hips: (): IAutoMovieVector3 => entry.root,
      yaw: (): number => entry.yaw,
      joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
      ...(ahead === undefined
        ? {}
        : {
            hands: (t: number): IAutoMovieMotionHumanDanceCourse.IHands => ({
              left: target(t, "left"),
              right: target(t, "right"),
            }),
            holds: (["left", "right"] as const).map(
              (
                side: AutoMovieHumanSide,
              ): IAutoMovieMotionHumanDanceCourse.IHold => ({
                side,
                subject: ahead,
                bone: side === "left" ? "leftUpperArm" : "rightUpperArm",
                from: 0,
                to: 1,
              }),
            ),
          }),
      instants: [],
    };
  }
}
