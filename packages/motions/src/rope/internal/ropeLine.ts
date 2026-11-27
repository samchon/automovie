import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * A rope as a taut line: a fixed prop's `bar` affordance between its two ends
 * in world metres, its axis along the bar's `+X`. The upper end of an upright
 * line is its anchor.
 */
export namespace ropeLine {
  /*
   * The placement reader and film start a rope line uses.
   */
  export type IRead = Pick<
    IAutoMovieMotionHumanActionContext,
    "prop" | "start"
  >;

  /*
   * The staged action's root and fallback target reader.
   */
  export interface IAim {
    /*
     * Root of the character on the climb's entering frame.
     */
    entry: { posture: Pick<IAutoMovieMotionHumanPosture, "root"> };

    /*
     * Resolve any unstaged target on its film clock.
     */
    aim: IAutoMovieMotionHumanActionContext["aim"];
  }

  /*
   * A rope line in world metres.
   */
  export interface ILine {
    /*
     * The line's lower end, or its `-X` end when level, world metres.
     */
    low: IAutoMovieVector3;

    /*
     * The line's upper end, the anchor, or its `+X` end when level, world
     * metres.
     */
    high: IAutoMovieVector3;

    /*
     * Unit direction from low to high.
     */
    axis: IAutoMovieVector3;

    /*
     * Length, metres.
     */
    length: number;

    /*
     * The floor the rope's prop stands on, its origin's height, world metres.
     */
    floor: number;
  }

  /*
   * Read a rope line.
   * Parameter context: The action's context.
   * Parameter subject: The rope prop.
   * Parameter id: Its bar affordance.
   * Returns: The line.
   * If the prop moves or has no bar of that id with a
   * length.
   */
  export function read(context: IRead, subject: string, id: string): ILine {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
    const bar: IAutoMovieAffordance | undefined = reader.prop.affordances?.find(
      (item: IAutoMovieAffordance): boolean =>
        item.id === id && item.kind === "bar",
    );
    if (
      reader.prop.motion !== undefined ||
      bar?.length === undefined ||
      !(bar.length > 0)
    )
      throw refusal("line", id, `${subject} has no fixed rope line ${id}`);
    const world: IAutoMovieRigidTransform = reader.frame(context.start);
    const center: IAutoMovieVector3 = Vector3.add(
      world.position,
      Quaternion.rotateVector(world.rotation, bar.frame.translation),
    );
    let axis: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(world.rotation, bar.frame.rotation),
      { x: 1, y: 0, z: 0 },
    );
    if (axis.y < -1e-6) axis = Vector3.scale(axis, -1);
    return {
      low: Vector3.add(center, Vector3.scale(axis, -bar.length / 2)),
      high: Vector3.add(center, Vector3.scale(axis, bar.length / 2)),
      axis,
      length: bar.length,
      floor: world.position.y,
    };
  }

  /*
   * The point of a line at a height, clamped to its ends.
   * Parameter line: The line.
   * Parameter height: The height, world metres.
   * Returns: The point on the line at that height, or the nearer end.
   */
  export function atHeight(line: ILine, height: number): IAutoMovieVector3 {
    if (Math.abs(line.axis.y) < 1e-6)
      return Vector3.lerp(line.low, line.high, 0.5);
    const along: number = (height - line.low.y) / line.axis.y;
    return Vector3.add(
      line.low,
      Vector3.scale(line.axis, Math.max(0, Math.min(line.length, along))),
    );
  }

  /*
   * The rope crossings' refusal.
   * Parameter axis: The refused parameter's path.
   * Parameter value: The refused value.
   * Parameter reason: Why it is refused.
   * Returns: The refusal to throw.
   */
  export function refusal(
    axis: string,
    value: unknown,
    reason: string,
  ): HumanRefusal {
    return new HumanRefusal({
      kind: "reach",
      axis,
      value,
      reason,
      fix: "stage a longer rope or a nearer landing",
    });
  }

  /*
   * Aim a staged point of the named rope, else the action's own target.
   * Parameter context: The action's context.
   * Parameter rope: The rope prop.
   * Parameter staged: The rope's staged points by name, world metres.
   * Parameter line: The rope's line, which a hand's grip faces square across toward
   * the climber.
   * Returns: The aim the support law reads.
   */
  export function aim(
    context: IAim,
    rope: string,
    staged: ReadonlyMap<string, IAutoMovieVector3>,
    line: ILine,
  ): IAutoMovieMotionHumanActionContext["aim"] {
    // A hand closes round the rope from the climber's side of it: its grip
    // faces from the rope toward the body, square to the rope's axis, so it
    // keeps one attitude wherever along the rope the hand is, never one the
    // wrist must turn through as the hands pass above and below the
    // shoulders. A foot stands on a hold that faces up.
    const d: IAutoMovieVector3 = Vector3.subtract(
      context.entry.posture.root,
      line.low,
    );
    const across: IAutoMovieVector3 = Vector3.subtract(
      d,
      Vector3.scale(line.axis, Vector3.dot(d, line.axis)),
    );
    const out: IAutoMovieVector3 =
      Vector3.length(across) > 1e-6
        ? Vector3.normalize(across)
        : { x: 0, y: 1, z: 0 };
    return (reference: IAutoMovieMotionTarget, seconds: number) => {
      const point: IAutoMovieVector3 | undefined =
        reference.kind === "prop" && reference.subject === rope
          ? staged.get(reference.point)
          : undefined;
      if (point === undefined) return context.aim(reference, seconds);
      return {
        point,
        normal:
          reference.kind === "prop" && reference.point.includes("Hand")
            ? out
            : { x: 0, y: 1, z: 0 },
      };
    };
  }
}
