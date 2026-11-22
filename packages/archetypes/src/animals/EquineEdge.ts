import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeCourse } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * The trunk's pitch across a steep face's edge: a course pitches its root with each leg's grade the moment the root crosses into the leg, which on a steep face would swing the whole body about the root at once and sweep the hindquarters and tail into the ground behind; a horse instead pitches with the line between its fore and hind support, from the moment its fores cross the edge to the moment its hinds do.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the course's pitch is corrected, over which span and against what.
 * @evidence contracts/development/design.md#principled-representation An edge's course distance, the pitches either side, and the hooves' reach ahead of and behind the root.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `EquineFootwork` for the bank techniques' faces.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The corrected pitch equals the course's once both pairs are past the edge; nothing else of the course changes.
 */
export namespace EquineEdge {
  /**
   * One edge between two legs' grades.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and sign.
   * @evidence contracts/development/design.md#principled-representation A course distance, two pitches and two hoof offsets.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `of`, read by `pitch`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IEdge {
    /** The edge's course distance, metres. */
    at: number;
    /** The course's pitch before the edge, degrees, positive nose-down. */
    before: number;
    /** The course's pitch after the edge, degrees, positive nose-down. */
    after: number;
    /** How far ahead of the root the fore hooves stand, metres. */
    ahead: number;
    /** How far behind the root the hind hooves stand, metres. */
    behind: number;
  }

  /**
   * The two edges of a course leg, at its start and at its end.
   *
   * @param legs The course's legs.
   * @param index The leg's index.
   * @param plan The course plan.
   * @param hooves The neutral hoof endpoints, model metres: the left fore's ahead of the root and the left hind's behind it.
   * @returns The edges.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the edges returned.
   * @evidence contracts/development/implementation.md#principled-implementation Each leg's pitch is its grade's angle, nose-down for a descent; a level or absent neighbour pitches none.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three pitches and two records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The course plan's leg spans.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns two records.
   */
  export function of(
    legs: readonly rideQuadruped.ILeg[],
    index: number,
    plan: AutoMovieArchetypeCourse.IPlan,
    hooves: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>
    >,
  ): IEdge[] {
    const ahead: number = hooves.leftFore.z;
    const behind: number = -hooves.leftHind.z;
    const pitch = (leg: rideQuadruped.ILeg | undefined): number =>
      leg === undefined || leg.kind !== "straight"
        ? 0
        : (-Math.atan((leg.rise ?? 0) / leg.length) * 180) / Math.PI;
    const span: AutoMovieArchetypeCourse.ILegSpan = plan.legSpans[index]!;
    const here: number = pitch(legs[index]);
    return [
      {
        at: span.from,
        before: pitch(legs[index - 1]),
        after: here,
        ahead,
        behind,
      },
      {
        at: span.from + span.span,
        before: here,
        after: pitch(legs[index + 1]),
        ahead,
        behind,
      },
    ];
  }

  /**
   * The pitch to add to the course's at a course distance, degrees, positive nose-down.
   *
   * @param edges The edges.
   * @param distance The root's course distance, metres.
   * @returns The correction, zero away from every edge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and sign.
   * @evidence contracts/development/implementation.md#principled-implementation The body's pitch goes linearly in course distance from the pitch before to the one after while the edge lies between its fore and hind hooves; the correction is that pitch less the course's own, which switches at the root.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One share and one difference per edge.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the few edges.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
   */
  export function pitch(edges: readonly IEdge[], distance: number): number {
    let correction: number = 0;
    for (const edge of edges) {
      const share: number = Math.min(
        1,
        Math.max(
          0,
          (distance - (edge.at - edge.ahead)) / (edge.ahead + edge.behind),
        ),
      );
      const course: number = distance < edge.at ? edge.before : edge.after;
      correction += edge.before + (edge.after - edge.before) * share - course;
    }
    return correction;
  }
}
