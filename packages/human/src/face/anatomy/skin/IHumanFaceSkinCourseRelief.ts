import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";

/**
 * One relief course pressed into, or raised from, the face skin.
 *
 * @evidence contracts/common.md#principled-implementation The relief kernel receives one immutable source and its matching host/course, adds displacement to a separate output, and preserves held vertices and the selected anatomical half; callers own dimensional admission.
 * @evidence contracts/common.md#clear-and-simple-design One input record separates reference geometry, mutable accumulation, course metric and relief parameters without introducing a second skin owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Side values name the actual midsagittal halves; width and offset are authored metre quantities rather than clinical scores or test-specific gains.
 * @evidence contracts/common.md#meaningful-documentation Members state array ownership, common host state, positive half-width, signed outward displacement, held identities and side orientation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input interface selects no processing strategy; applyHumanFaceSkinCourseRelief owns vertex and course scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input type coordinates no requests; its relief callers share one source host within an application.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handles or tasks; changed positions belong to the relief caller.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinCourseRelief {
  /** Host compiled on `source`. */
  host: IHumanFaceSkinHost;

  /** Immutable skin positions every course of one application samples. */
  source: readonly number[];

  /** Owned output positions the displacement is added to. */
  changed: number[];

  /** Caller-owned continuous native course on this same immutable host state. */
  course: IHumanFaceProjectedSkinCourse;

  /** Half-width of the relief across the course, metres, positive. */
  widthMetres: number;

  /** Displacement at the centre of the course along the outward skin normal, metres; negative presses in. */
  offsetMetres: number;

  /** Vertices that keep their position exactly. */
  held: ReadonlySet<number>;

  /** Anatomical half the course is confined to: 1 for +X (left), -1 for -X, 0 for both. */
  side: -1 | 0 | 1;
}
