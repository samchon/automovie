import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";

/**
 * One thorax-relative humeral goal of a body document.
 *
 * `plane` is the elevation plane (0 lateral, +90 anterior), `elevation` the
 * total elevation and `axialRotation` the axial rotation, all in degrees; the
 * builder resolves the goal into clavicle, scapula and humerus. Editor presets
 * and review states build their shoulder goals through this one owner;
 * admission and the shoulder resolver still judge the goal.
 *
 * @evidence contracts/common.md#principled-implementation An arm is raised through its named thorax-relative goal, the input the shoulder resolver owns, rather than the humeral joint row.
 * @evidence contracts/common.md#clear-and-simple-design One pure constructor shared by every preset and review state instead of a copy per consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The constructor admits nothing and clamps nothing; admission and the resolver own range judgement.
 * @evidence contracts/common.md#meaningful-documentation States each angle's meaning, its unit and the axial-rotation default.
 * @evidence contracts/modeling.md#parameter-channels Writes the named plane, total elevation and axial rotation of one humerus.
 * @evidence contracts/modeling.md#spatial-conventions Angles are degrees in the thorax frame, plane 0 lateral and +90 anterior.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The goal names an existing humerus and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The goal emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The goal builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder and editor observe the posed body.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The goal carries caller angles, not an anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range Document admission and the shoulder resolver judge the range.
 * @evidence contracts/anatomy.md#parametric-authority The goal is expressed in named thorax-relative angles, never vertices or curves.
 * @author Samchon
 */
export function createHumanBodyShoulderPose(
  bone: IAutoMovieHumanBodyShoulderPose["bone"],
  plane: number,
  elevation: number,
  axialRotation = 0,
): IAutoMovieHumanBodyShoulderPose {
  return { bone, plane, elevation, axialRotation };
}
