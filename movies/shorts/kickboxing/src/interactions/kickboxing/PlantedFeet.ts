import { type IAutoMovieSchedule, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Fighter } from "../../entities/cast/fighter/Fighter";
import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import type { RingFootwork } from "../../laws/kickboxing/RingFootwork";
import { StanceShape } from "../../laws/kickboxing/StanceShape";
import { StepPattern } from "../../laws/kickboxing/StepPattern";
import { BoutLaws } from "./BoutLaws";
import type { IRingCast } from "./IRingCast";

/**
 * A fighter's world ankle points on the floor at one second: the stance
 * placed about his origin and facing while he stands, each foot stepping on
 * the step pattern along the movement's path while he moves, and both feet
 * hopping through the mirrored stance in place during a switch.
 *
 * ```ts
 * const here = BoutLaws.origin(schedule, "a", 12.3, cast);
 * PlantedFeet.at(cast.a, schedule, here, facing, cast); // { left, right }
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#sources Alternating steps.
 * @evidence docs/research/kickboxing/ring-generalship.md#stance The switch exchanges lead and rear feet without crossing.
 */
export namespace PlantedFeet {
  /** A fighter's origin at a second, as {@link BoutLaws.origin} gives it. */
  export type IHere = ReturnType<typeof BoutLaws.origin>;

  /**
   * The stance switch under way at an origin's movement.
   *
   * @param here The fighter's origin at the second.
   * @param measure The fighter's measure.
   * @returns The switch's feet, body turn and lift, or null outside a switch.
   */
  export function switching(
    here: IHere,
    measure: Fighter["body"]["measure"],
  ): ReturnType<typeof StanceShape.switching> | null {
    if (!here.moving) return null;
    const action = KickboxingAction.read(here.moving.entry.intent);
    return action.kind === "move" && action.movement === "switch"
      ? StanceShape.switching(measure, here.moving.share)
      : null;
  }

  /**
   * World ankle points of the planted feet.
   *
   * @param fighter The fighter.
   * @param schedule The resolved schedule, for the movement's path.
   * @param here His origin at the second.
   * @param facing Unit floor direction he faces.
   * @param cast The cast, for starting origins.
   * @returns Each ankle's world point.
   */
  export function at(
    fighter: Fighter,
    schedule: IAutoMovieSchedule,
    here: IHere,
    facing: { x: number; z: number },
    cast: IRingCast,
  ): Record<"left" | "right", IAutoMovieVector3> {
    const measure = fighter.body.measure;
    const lifted = (lift: number): number =>
      lift * measure.ankle * StepPattern.LIFT_SHARE;
    const place = (
      point: RingFootwork.IPoint,
      p: IAutoMovieVector3,
      lift: number,
    ): IAutoMovieVector3 => ({
      x: point.x + facing.x * p.x - facing.z * p.z,
      y: p.y + lifted(lift),
      z: point.z + facing.z * p.x + facing.x * p.z,
    });
    const stance = StanceShape.feet(measure);
    if (!here.moving)
      return {
        left: place(here.point, stance.left, 0),
        right: place(here.point, stance.right, 0),
      };
    const switched = switching(here, measure);
    if (switched !== null)
      return {
        left: place(here.point, switched.feet.left, switched.lift),
        right: place(here.point, switched.feet.right, switched.lift),
      };
    const { entry, share, from } = here.moving;
    const action = KickboxingAction.read(entry.intent);
    if (action.kind !== "move") throw new Error("unreachable");
    const to: RingFootwork.IPoint = (entry.state as BoutLaws.IState).origin!;
    const first: "left" | "right" = StepPattern.leading(from, to, facing);
    const along = (s: number): RingFootwork.IPoint =>
      BoutLaws.origin(
        schedule,
        fighter.id,
        entry.start + s * (entry.end - entry.start),
        cast,
      ).point;
    // Walking leaves the fighting stance at the first step and returns to it
    // at the last; between them the feet walk on their hip tracks.
    const walking: boolean = KickboxingTiming.walking(action.movement);
    const gait: Record<"left" | "right", IAutoMovieVector3> = walking
      ? StanceShape.walk(measure)
      : stance;
    const placement = (s: number, side: "left" | "right"): IAutoMovieVector3 =>
      s <= 0 || s >= 1 ? stance[side] : gait[side];
    const foot = (side: "left" | "right"): IAutoMovieVector3 => {
      const f = StepPattern.foot(
        { steps: action.steps, first, share, walking },
        side,
      );
      const a: IAutoMovieVector3 = place(
        along(f.from),
        placement(f.from, side),
        0,
      );
      const b: IAutoMovieVector3 = place(along(f.to), placement(f.to, side), 0);
      return {
        ...Vector3.lerp(a, b, Math.min(1, f.swing)),
        y: a.y + lifted(StepPattern.lift(f.swing)),
      };
    };
    return { left: foot("left"), right: foot("right") };
  }
}
