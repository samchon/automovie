import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBallet,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceCourse,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { ExerciseKey } from "./ExerciseKey";

/**
 * Ballet's five positions of the feet and what the legs do in them. Each foot
 * turns out by the turnout from the dancer's heading; the heels stand, in foot
 * lengths (provisional readings of Vaganova's Basic Principles of Classical
 * Ballet):
 *
 * - First: together, `HEEL` apart;
 * - Second: `SECOND` apart side by side;
 * - Third: the working foot's heel against the middle of the other's inner edge,
 *   a foot's width (`WIDTH`) ahead;
 * - Fourth: the working heel in line with the other's toes, `FOURTH` ahead;
 * - Fifth: the working heel at the other's toes, a foot's width ahead.
 *
 * A plié bends the knees `PLIE` degrees over the toes, the heels down; a relevé
 * rises onto the balls of the feet, the heels up `RELEVE` degrees, the
 * metatarsal heads staying where they stand. The feet move into the position
 * before the first beat, the working foot first; the legs then go down or up on
 * even beats and back on odd ones.
 */
export namespace balletPositions {
  /**
   * First position's heel spacing, foot lengths: heels together, their centres
   * a heel's width apart.
   */
  export const HEEL: number = 0.3;

  /** Second position's heel spacing, foot lengths. */
  export const SECOND: number = 1.5;

  /**
   * A foot's width, foot lengths: how far ahead the front heel of third and
   * fifth stands.
   */
  export const WIDTH: number = 0.35;

  /** Fourth position's forward spacing, foot lengths. */
  export const FOURTH: number = 1;

  /** A demi-plié's knee flexion, degrees (provisional). */
  export const PLIE: number = 70;

  /**
   * A relevé's heel lift, degrees of the foot's pitch about the balls
   * (provisional demi-pointe).
   */
  export const RELEVE: number = 40;

  /**
   * The feet in a position.
   *
   * @param context The action's context, read for the entry stance.
   * @param position One to five.
   * @param turnout Each foot's turn out, degrees.
   * @param front The working foot, in front in third, fourth and fifth.
   * @returns Each foot's flat placement.
   */
  export function feet(
    context: Pick<IAutoMovieMotionHumanActionContext, FeetContext>,
    position: number,
    turnout: number,
    front: AutoMovieHumanSide,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> {
    const body: IAutoMovieMotionHumanBody = context.body;
    const yaw: number = context.entry.posture.yaw;
    const heels: Record<AutoMovieHumanSide, IAutoMovieVector3> = relations(
      position,
      turnout,
      front,
      body.measure.footLength,
    ); // Centre the pair on the entry's feet.
    const centre: IAutoMovieVector3 = Vector3.lerp(
      heels.left,
      heels.right,
      0.5,
    );
    const floor: IAutoMovieVector3 = Vector3.lerp(
      HumanFoot.point(body, "left", "heel", context.entry.feet.left),
      HumanFoot.point(body, "right", "heel", context.entry.feet.right),
      0.5,
    );
    function placed(
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.IPlacement {
      return HumanFoot.pivot(
        body,
        side,
        "heel",
        HumanFrame.point(
          { origin: floor, yaw },
          Vector3.subtract(heels[side], centre),
        ),
        yaw + out(side, turnout),
        0,
      );
    }
    return { left: placed("left"), right: placed("right") };
  }

  /**
   * A foot risen onto its ball.
   *
   * @param body The dancer's body.
   * @param side Which foot.
   * @param flat Its flat placement.
   * @param share How far risen, 0 flat to 1 on demi-pointe.
   * @param turn Degrees turned about the ball since it rose.
   * @returns The placement, the ball where it stood.
   */
  export function risen(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    flat: IAutoMovieMotionHumanFoot.IPlacement,
    share: number,
    turn: number = 0,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    if (share === 0 && turn === 0) return flat;
    return HumanFoot.pivot(
      body,
      side,
      "ball",
      HumanFoot.point(body, side, "ball", flat),
      HumanFoot.heading(flat.rotation) + turn,
      -RELEVE * share,
      RELEVE * share,
    );
  }

  /**
   * How far a plié lowers the hips, metres: the legs' length less the
   * hip-to-ankle span at the plié's knee.
   *
   * @param body The dancer's body.
   * @returns Metres.
   */
  export function drop(body: IAutoMovieMotionHumanBody): number {
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    const k: number = (PLIE * Math.PI) / 180;
    return a + b - Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(k));
  }

  /**
   * The entry's hips' world point.
   *
   * @param body The dancer's body.
   * @param entry The entry posture.
   * @returns World metres.
   */
  export function hips(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    return Vector3.add(
      entry.root,
      Quaternion.rotateVector(
        humanPostureHeading(entry),
        body.rest.get("hips")!,
      ),
    );
  }

  /**
   * The course of a position: into it before the first beat, then the movement
   * on alternate beats.
   *
   * @param context The action's context.
   * @param beats The beat clock, one beat more than the movement's.
   * @param turnout Each foot's turn out, degrees.
   * @returns The course.
   */
  export function course(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBallet.IParams>,
    beats: IAutoMovieMotionHumanDanceBeats,
    turnout: number,
  ): IAutoMovieMotionHumanDanceCourse {
    const p: IAutoMovieMotionHumanBallet.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const movement: IAutoMovieMotionHumanBallet.Movement = p.movement ?? "plie";
    const front: AutoMovieHumanSide = p.side ?? "right";
    const back: AutoMovieHumanSide = front === "left" ? "right" : "left";
    const placed: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = feet(context, p.position ?? 1, turnout, front);
    const arrive: number = beats.at(1);
    const end: number = beats.at(beats.count) + beats.period;

    // The movement's share: 1 on even beats, 0 on odd ones and at the end.
    function share(t: number): number {
      if (movement === "hold" || t <= arrive) return 0;
      const k: number = Math.min(
        beats.count,
        Math.floor((t - arrive) / beats.period) + 1,
      );
      const from: number = k % 2 === 0 ? 1 : 0;
      const at: number = beats.at(k);
      const next: number = k + 1 <= beats.count ? beats.at(k + 1) : end;
      const to: number = k + 1 <= beats.count ? ((k + 1) % 2 === 0 ? 1 : 0) : 0;
      return (
        from +
        (to - from) * AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, (t - at) / (next - at)))
      );
    }
    function key(
      side: AutoMovieHumanSide,
      at: number,
    ): IAutoMovieMotionHumanDanceFootKey {
      return {
        at,
        leave: end,
        place: placed[side],
        bears: true,
        clearance: 0.03 * body.measure.stature,
        ...(movement === "releve"
          ? {
              hold: (t: number): IAutoMovieMotionHumanFoot.IPlacement =>
                risen(body, side, placed[side], share(t)),
            }
          : {}),
      };
    }
    function stood(
      side: AutoMovieHumanSide,
      leave: number,
    ): IAutoMovieMotionHumanDanceFootKey {
      return {
        at: 0,
        leave,
        place: {
          ankle: context.entry.feet[side].ankle,
          rotation: context.entry.feet[side].rotation,
        },
        bears: true,
        clearance: 0,
      };
    }
    const standing: IAutoMovieVector3 = hips(body, entry);
    const rise: number =
      risen(body, front, placed[front], 1).ankle.y - placed[front].ankle.y;
    const depth: number = drop(body);
    const ankles: IAutoMovieVector3 = Vector3.lerp(
      placed.left.ankle,
      placed.right.ankle,
      0.5,
    );
    const entered: IAutoMovieVector3 = Vector3.lerp(
      context.entry.feet.left.ankle,
      context.entry.feet.right.ankle,
      0.5,
    );
    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      {},
      { shoulder: 25, raise: 20, elbow: 35 },
    ).joints;
    const course: IAutoMovieMotionHumanDanceCourse = {
      duration: end,
      left: [],
      right: [],
      hips: (t: number): IAutoMovieVector3 => {
        const moved: number = AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, t / arrive));
        const over: IAutoMovieVector3 = Vector3.lerp(entered, ankles, moved);
        const m: number = share(t);
        return {
          x: standing.x + over.x - entered.x,
          y:
            standing.y +
            (movement === "plie"
              ? -depth * m
              : movement === "releve"
                ? rise * m
                : 0),
          z: standing.z + over.z - entered.z,
        };
      },
      yaw: (): number => entry.yaw,
      joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
      instants: [{ name: "position", seconds: arrive }],
    };
    course[front] = [stood(front, 0.05 * arrive), key(front, 0.45 * arrive)];
    course[back] = [stood(back, 0.55 * arrive), key(back, 0.95 * arrive)];
    return course;
  }

  /**
   * A foot's turn from the heading, degrees: outward, so positive for the left
   * foot.
   */
  function out(side: AutoMovieHumanSide, turnout: number): number {
    return side === "left" ? turnout : -turnout;
  }

  /**
   * The heels' points in the dancer's floor frame (x to the left, z ahead),
   * foot lengths scaled to metres.
   */
  function relations(
    position: number,
    turnout: number,
    front: AutoMovieHumanSide,
    fl: number,
  ): Record<AutoMovieHumanSide, IAutoMovieVector3> {
    if (position === 1 || position === 2) {
      const half: number = ((position === 1 ? HEEL : SECOND) * fl) / 2;
      return { left: { x: half, y: 0, z: 0 }, right: { x: -half, y: 0, z: 0 } };
    }
    const back: AutoMovieHumanSide = front === "left" ? "right" : "left";
    const angle: number = (out(back, turnout) * Math.PI) / 180;
    const rear: IAutoMovieVector3 = {
      x: ((back === "left" ? 1 : -1) * HEEL * fl) / 2,
      y: 0,
      z: 0,
    };
    const reach: number = (position === 3 ? 0.5 : 1) * fl;
    const ahead: number = (position === 4 ? FOURTH : WIDTH) * fl;
    const lead: IAutoMovieVector3 = {
      x: rear.x + Math.sin(angle) * reach,
      y: 0,
      z: rear.z + Math.cos(angle) * reach + ahead,
    };
    return front === "left"
      ? { left: lead, right: rear }
      : { left: rear, right: lead };
  }
}

/** The alternatives of `FeetContext`'s site. */
type FeetContext = "body" | "entry";
