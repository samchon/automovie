import { Vector3 } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The component-wise mean of a nonempty list of points. An empty list divides
 * by zero, so callers pass at least one point. `fitPortraitEyeSphere` uses it
 * for the centre of the sample set.
 *
 * @evidence contracts/common.md#principled-implementation The arithmetic mean is the centroid of equal-weight samples: the sum divided by the count. The empty list divides by zero and is documented as a caller precondition.
 * @evidence contracts/common.md#clear-and-simple-design One reduction over engine vector operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation States the empty-list precondition and its one consumer.
 * @evidence contracts/modeling.md#spatial-conventions Points stay in the caller's unit and frame; nothing is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping meanPoint is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels meanPoint defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry meanPoint decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries meanPoint constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation meanPoint owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source meanPoint carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range meanPoint admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority meanPoint defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export const meanPoint = (points: IAutoMovieVector3[]): IAutoMovieVector3 =>
  Vector3.scale(
    points.reduce(Vector3.add, Vector3.create()),
    1 / points.length,
  );
