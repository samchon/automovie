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
 * @evidence contracts/development/design.md#principled-representation A merged solid is traced against as faces with their kept regions and the map across their shared boundaries, so a curve crosses from face to face.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Faces plus two functions, kept and across.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A point past an open boundary has no neighbour and reads null.
 * @evidence contracts/development/common.md#meaningful-documentation States the faces, the kept test and the crossing map.
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation The face-local predicate defines the retained region used by TraceSolve and Rail; the contract includes its boundary, although Body's current parity classifier does not establish that inclusion on every segment.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One face index and its two chart coordinates query the same region used by the crossing map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A signature cannot turn half-open parity ties into inclusive boundary ownership; that implementation gap remains with the classifier owner.
   * @evidence contracts/development/common.md#meaningful-documentation States indexed chart input and the required inclusive true result without claiming a validated chart or index.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The callable contract chooses no classifier; Body.kept scans its face's cycles and their chart segments.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The method contract provides no query cache; a producer must preserve the region's dependency lifetime.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The boolean result retains nothing; its atlas owns the implementation callback and any captured trim data.
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Maps the nearest crossed boundary's foot into its neighbouring chart so tracing can resume there; the mapped point is not the original exterior point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A neighbour index and two coordinates share one nullable result, with null representing an unavailable continuation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Open or excluded neighbours remain null; the contract supplies no arbitrary fallback face or proof of all possible crossings.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the foot correspondence, chart units and open-boundary null meaning.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no search; Body.atlas scans violated cycles, computes their segment feet and resolves a neighbour through its index map.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Query reuse belongs to the producer and must respect its retained face and boundary data; no cache is required by this method.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A successful coordinate record belongs to its reader; captured cycles, faces and maps live with the producing atlas, not with a boolean or coordinate result.
   */
  across(
    face: number,
    u: number,
    v: number,
  ): { face: number; u: number; v: number } | null;
}
