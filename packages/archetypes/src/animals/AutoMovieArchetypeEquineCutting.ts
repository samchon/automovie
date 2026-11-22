import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
} from "../core";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { createQuadruped } from "./createQuadruped";

/**
 * A cutting horse's course from the cow it works: the horse mirrors the cow's movement along the herd's line after a declared reaction time, holding a declared distance off the cow on the herd's side, so it stays between the cow and the herd.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mirror law, the reaction and the protected side.
 * @evidence contracts/development/design.md#principled-representation The horse's timed marks are the cow's, delayed by the reaction time and offset toward the herd; the shared timed ride rides them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One planner returning ordinary timed marks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No speed or reversal beyond the declared gaits and reaction is admitted; the refusal gives the bound.
 */
export namespace AutoMovieArchetypeEquineCutting {
  /**
   * The cutting work's declared values.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member's unit.
   * @evidence contracts/development/design.md#principled-representation A reaction time, a distance and the herd's line.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the planner reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICut {
    /** How long after the cow the horse answers it, seconds. */
    reaction: number;
    /** How far the horse holds off the cow toward the herd, metres. */
    offset: number;
    /** The herd's protected line: the world Z the herd stands beyond. */
    herd: number;
  }

  /**
   * Plan the horse's timed marks from the cow's.
   *
   * @param species The horse's species, for its fastest declared gait.
   * @param withers The horse's height at the withers, metres.
   * @param cow The cow's timed marks, in order.
   * @param cut The declared reaction, offset and herd line.
   * @returns The horse's timed marks, for `AutoMovieArchetypeCourse.timed`.
   * @throws {AutoMovieArchetypeRefusal} For a malformed cut, a cow on the herd's side of the line, a mirrored speed beyond the fastest gait, or two reversals closer than the reaction time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each cow mark at second t becomes a horse mark at t plus the reaction, at the cow's X and the cow's Z moved the offset toward the herd. A mark-to-mark speed above the fastest gait's declared maximum, or a reversal of the cow's X travel sooner than one reaction after the last, cannot be answered.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, then one pass over the marks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cow's path is never smoothed or edited.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(M) for M marks.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the species' gait ranges.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks.
   */
  export function plan(
    species: createQuadruped.ISpecies,
    withers: number,
    cow: readonly AutoMovieArchetypeCourse.ISample[],
    cut: ICut,
  ): AutoMovieArchetypeCourse.ISample[] {
    if (
      !(cut.reaction > 0 && cut.offset > 0 && Number.isFinite(cut.herd)) ||
      cow.length < 2
    )
      refuse(
        "cut",
        cut,
        "a positive reaction and offset, a finite herd line and at least two cow marks",
      );
    const side: number = Math.sign(cut.herd - cow[0]!.z);
    const fastest: number = Math.max(
      ...species.table.order.map(
        (gait: AutoMovieArchetypeQuadrupedGait.Gait): number =>
          AutoMovieArchetypeQuadrupedGait.range(species, gait, withers).maximum,
      ),
    );
    let reversed: number = -Infinity;
    let heading: number = 0;
    const marks: AutoMovieArchetypeCourse.ISample[] = [];
    cow.forEach((mark: AutoMovieArchetypeCourse.ISample, k: number): void => {
      const z: number = mark.z + side * cut.offset;
      if (!(side * (cut.herd - z) >= 0))
        refuse(
          "herd",
          mark.z,
          "the cow and the horse's offset to stay on the open side of the herd's line",
        );
      if (k > 0) {
        const before: AutoMovieArchetypeCourse.ISample = cow[k - 1]!;
        const span: number = mark.seconds - before.seconds;
        const travel: number = mark.x - before.x;
        const speed: number = Math.hypot(travel, mark.z - before.z) / span;
        if (!(speed <= fastest))
          refuse(
            "speed",
            speed,
            `a mirrored speed at most the fastest gait's ${fastest} m/s`,
          );
        const direction: number = Math.sign(travel);
        if (direction !== 0 && heading !== 0 && direction !== heading) {
          if (before.seconds - reversed < cut.reaction)
            refuse(
              "reversal",
              before.seconds,
              `reversals at least the ${cut.reaction} s reaction apart`,
            );
          reversed = before.seconds;
        }
        if (direction !== 0) heading = direction;
      }
      marks.push({ ...mark, seconds: mark.seconds + cut.reaction, z });
    });
    return marks;

    /** Refuse an unanswerable cut. */
    function refuse(axis: string, value: unknown, need: string): never {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis: `cutting ${axis}`,
        value,
        feasible: null,
        reason: `the cutting work needs ${need}`,
        fix: "Slow the cow, space its reversals or keep it off the herd's line.",
      });
    }
  }
}
