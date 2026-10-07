import type { IHumanFaceProjectedSkinCourseReading } from "./IHumanFaceProjectedSkinCourseReading";
import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";

/**
 * Finite continuous course obtained from an actual native skin projection.
 * Its owner states whether projection is nearest-feature or a registered
 * material-chart lift. Native feature changes determine its population. Relief width never sets
 * a sampling interval. Rebuilding the skin requires rebuilding this course.
 *
 * @evidence contracts/common.md#principled-implementation Finite spans and a shared distance reader keep the representation and kernel readings on the same immutable state.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the geometric result or input owned by this declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native identity and explicit numerical units retain the source meaning without an anatomical default or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Members document ownership, units and numerical distinctions needed by the consumer.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres remain public; dimensionless native feature parameters and explicit local scale are internal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry on an existing skin part and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing caller geometry or its reading and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Defines no render primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Native continuity is checked by the compiled course owner, not certified by this transport type.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief callers own assembled skin observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries geometric correspondence without a measured anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the relief and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no personal sculpting interface or clinical conversion.
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
   *
   * @evidence contracts/common.md#principled-implementation Unit chord projection and hypot read the actual finite curve without squared-length division.
   * @evidence contracts/common.md#clear-and-simple-design Delegates one distance/station reading to the compiled span owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains extrinsic distance, first-span ties and actual point coordinates without width-dependent resampling.
   * @evidence contracts/common.md#meaningful-documentation States valid point shape, units and malformed-point refusal.
   * @evidence contracts/modeling.md#spatial-conventions Input and distance are head-frame metres; arc station is dimensionless.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads an existing course and defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no shape channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Reads the already compiled course; native continuity belongs to the compiler.
   * @evidenceExclude contracts/modeling.md#rendered-observation The relief callers observe assembled skin.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity.
   * @evidenceExclude contracts/anatomy.md#permitted-range Validates coordinate representation, not clinical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Internal geometric reading does not author personal shape.
   */
  read(point: readonly number[]): IHumanFaceProjectedSkinCourseReading;
}
