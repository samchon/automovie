import type { IHumanFaceProjectedSkinCourseReading } from "./IHumanFaceProjectedSkinCourseReading";
import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";

/**
 * Finite continuous course obtained from an actual native skin projection. Its owner states whether projection is nearest-feature or a registered material-chart lift. Native feature changes determine its population. Relief width never sets a sampling interval. Rebuilding the skin requires rebuilding this course.
 *
 * @evidence contracts/common.md#principled-implementation Actual native feature intervals retain a projected course's physical endpoints and cumulative arc length.
 * @evidence contracts/common.md#clear-and-simple-design The compiled course exposes the same span population to attachment readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nearest course distance is extrinsic, not a geodesic; changed skin requires recompilation and an empty course reads infinite distance at station zero.
 * @evidence contracts/common.md#meaningful-documentation Lengths/distances use head metres and station normalizes physical accumulated arc length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Feature qualification executes in compilation and read scans retained spans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compilation is reused across readers rather than repeated for every attached vertex.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller retains owned span arrays and the read closure until the course is released; readonly does not deep-freeze buffers.
 *
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinCourse {
  /** Source-supported affine pieces in guide order. */
  spans: readonly IHumanFaceProjectedSkinSpan[];

  /** Sum of piece lengths, metres; zero means no effective course. */
  totalLengthMetres: number;

  /**
   * Read a finite three-coordinate head-frame point against these spans. Empty or nonfinite points refuse rather than producing a false support.
   *
   * @evidence contracts/common.md#principled-implementation Nearest source-supported affine span supplies extrinsic distance and normalized cumulative station.
   * @evidence contracts/common.md#clear-and-simple-design Nearest-projection and native-chart courses share one compiled point-to-span reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Distance is not geodesic and nearby other sheets are not excluded by anatomical reach; empty spans provide Infinity/zero rather than fake support.
   * @evidence contracts/common.md#meaningful-documentation Finite XYZ and returned distance are head metres, while station is unitless and ties retain first guide order.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The O(spans) scan executes in readHumanFaceProjectedSkinCourse.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compiled endpoints/lengths/stations are reused instead of rebuilding native projection features.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The owning course retains its span records until release and each result is a small caller-owned record.
   */
  read(point: readonly number[]): IHumanFaceProjectedSkinCourseReading;
}
