import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";

/**
 * One relief course pressed into, or raised from, the face skin.
 *
 * @evidence contracts/common.md#principled-implementation A course, a width and a signed normal offset are the whole description of one valley or ridge along the skin; the host supplies where the skin is and which way it faces.
 * @evidence contracts/common.md#clear-and-simple-design One record serves every relief owner, so the kernel has one definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Courses retain internal source-relative support without a guessed region, personal curve or clinical default.
 * @evidence contracts/common.md#meaningful-documentation Each member states its unit, sign and ownership.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres throughout; the offset is signed along the skin's outward normal.
 * @evidence contracts/modeling.md#parameter-channels Width and offset are independent; the offset's zero leaves the skin unchanged and its positive direction is outward.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries a deformation request for an existing skin part and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries input and owned output buffers without choosing render primitives.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The course kernel owns compact support and held-vertex behavior; this type carries their input.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief callers observe the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Transports caller-owned authored quantities; scientific qualification remains with those callers.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical and numerical input admission remains with the relief callers.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal geometry transport introduces no public personal sculpting input.
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
