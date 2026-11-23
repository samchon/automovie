import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A rope as a taut line: a fixed prop's `bar` affordance between its two
 * ends in world metres, its axis along the bar's `+X`. The upper end of an
 * upright line is its anchor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the representation, frame and anchor.
 * @evidence contracts/development/design.md#principled-representation Two world ends, a unit axis, a length and the floor under the prop.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The line record, its reader, the staged-point aim and the rope refusal the crossings share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Read from the placed prop; a moving prop or a missing bar is refused.
 */
export namespace ropeLine {
  /**
   * A rope line in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation Ends ordered by height, a unit axis from low to high (or along +X when level), a length and the floor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the crossings read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Built only by read.
   */
  export interface ILine {
    /** The line's lower end, or its `-X` end when level, world metres. */
    low: IAutoMovieVector3;

    /** The line's upper end, the anchor, or its `+X` end when level, world metres. */
    high: IAutoMovieVector3;

    /** Unit direction from low to high. */
    axis: IAutoMovieVector3;

    /** Length, metres. */
    length: number;

    /** The floor the rope's prop stands on, its origin's height, world metres. */
    floor: number;
  }

  /**
   * Read a rope line.
   *
   * @param context The action's context.
   * @param subject The rope prop.
   * @param id Its bar affordance.
   * @returns The line.
   * @throws {HumanRefusal} If the prop moves or has no bar of that id with a length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Transforms the bar's centre and axis to the world and takes half its length each way.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, then one transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a rope it cannot read.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the prop's affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(
    context: IAutoMovieMotionHumanActionContext,
    subject: string,
    id: string,
  ): ILine {
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

  /**
   * The point of a line at a height, clamped to its ends.
   *
   * @param line The line.
   * @param height The height, world metres.
   * @returns The point on the line at that height, or the nearer end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the clamp and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Solves the line's height linearly along its axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve and clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A level line returns its middle.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /**
   * The rope crossings' refusal.
   *
   * @param axis The refused parameter's path.
   * @param value The refused value.
   * @param reason Why it is refused.
   * @returns The refusal to throw.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and result.
   * @evidence contracts/development/implementation.md#principled-implementation One refusal kind for a rope that cannot carry the request.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Names the actual parameter and value.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one record.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /**
   * Aim a staged point of the named rope, else the action's own target.
   *
   * @param context The action's context.
   * @param rope The rope prop.
   * @param staged The rope's staged points by name, world metres.
   * @param line The rope's line, which a hand's grip faces square across toward the climber.
   * @returns The aim the support law reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the lookup and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation A prop target on this rope reads its staged point: a hand's facing from the rope toward the climber square to its axis, a foot's up; any other target the context's own aim.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unstaged point falls back to the context rather than a guess.
   * @evidence contracts/development/implementation.md#efficient-algorithms One map lookup per read.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the staged map for the plan.
   */
  export function aim(
    context: IAutoMovieMotionHumanActionContext,
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
