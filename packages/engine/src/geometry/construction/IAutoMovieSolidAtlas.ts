import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A host made of several faces, as the solid operators read it: a solid
 * already merged (the base trimmed by its rails, each blend, each part
 * trimmed by its rail), so a later merge's curve and rails may cross from
 * one face to the next.
 *
 * Each face is a surface with its own chart and a kept region in it, bounded
 * by trim cycles; past each cycle lies a neighbour face that shares that
 * boundary. The trace (`AutoMovieSolidIntersection`) solves on one face
 * and, where its host point leaves the face's kept region, continues on the
 * neighbour from the mapped point; the host rail (`AutoMovieSolidRail`)
 * does the same where its offset leaves its face. A single surface is the
 * atlas of one face whose region is all of its chart
 * (`AutoMovieSolidIntersection.atlas`).
 *
 * @evidence contracts/common.md#principled-implementation A merged solid is traced against as faces with their kept regions and the map across their shared boundaries, so a curve crosses from face to face.
 * @evidence contracts/common.md#clear-and-simple-design Faces plus two functions, kept and across.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A point past an open boundary has no neighbour and reads null.
 * @evidence contracts/common.md#meaningful-documentation States the faces, the kept test and the crossing map.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface; its implementations' costs are on `AutoMovieSolidBody.atlas`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No state of its own.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References its body's faces only.
 */
export interface IAutoMovieSolidAtlas {
  /** Name in diagnostics. */
  name: string;

  /** The faces, by index. */
  faces: IAutoMovieSolidSurface[];

  /**
   * Whether a chart point lies in a face's kept region.
   *
   * @param face The face's index.
   * @param u Its chart's `u`.
   * @param v Its chart's `v`.
   * @returns True inside the region or on its boundary.
   */
  kept(face: number, u: number, v: number): boolean;

  /**
   * The neighbour across a face's boundary nearest a chart point that lies
   * past it, and the point there that corresponds to the point's foot on the
   * boundary.
   *
   * @param face The face's index.
   * @param u Its chart's `u`.
   * @param v Its chart's `v`.
   * @returns The neighbour's index and chart point, or null where the
   *   nearest boundary is an open end of the face.
   */
  across(face: number, u: number, v: number): { face: number; u: number; v: number } | null;
}
