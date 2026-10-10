import type { IHumanFaceProjectedSkinCourseReading } from "./IHumanFaceProjectedSkinCourseReading";
import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";

/**
 * Finite continuous course obtained from an actual native skin projection.
 * Its owner states whether projection is nearest-feature or a registered
 * material-chart lift. Native feature changes determine its population. Relief width never sets
 * a sampling interval. Rebuilding the skin requires rebuilding this course.
 *
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinCourse {
  /** Source-supported affine pieces in guide order. */
  spans: readonly IHumanFaceProjectedSkinSpan[];

  /** Sum of piece lengths, metres; zero means no effective course. */
  totalLengthMetres: number;

  /**
   * Read a finite three-coordinate head-frame point against these spans.
   * Empty or nonfinite points refuse rather than producing a false support.
   */
  read(point: readonly number[]): IHumanFaceProjectedSkinCourseReading;
}
