import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";

/**
 * One relief course pressed into, or raised from, the face skin.
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
