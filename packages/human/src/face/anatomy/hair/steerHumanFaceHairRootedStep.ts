import { Vector3, type IAutoMovieSignedMeshQueryHit as ImportedIAutoMovieSignedMeshQueryHit } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedSteering } from "./IHumanFaceHairRootedSteering";
import { aimHumanFaceHairRootedStem } from "./aimHumanFaceHairRootedStem";
import { limitHumanFaceHairTurn } from "./limitHumanFaceHairTurn";

/**
 * Preview the same rooted trial before admitting a station. When its closest contact changes before full clearance, the two actual outward normals supply their maximum common directional-margin goal. The original turn cone bounds that goal; interval/contact admission still belongs to the integrator. Root support is never widened and no blocker identity or waypoint is stored. Points/steps are current head metres, normals unitless, budget caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation One nominal outward trial either reaches free clearance or supplies a two-normal common-margin aim.
 * @evidence contracts/common.md#clear-and-simple-design Steering proposes direction while exterior interval and progress admission remain with the rooted step owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Finite geometry, representable travel and safe budget are checked; root support is never widened to accommodate a blocker.
 * @evidence contracts/common.md#meaningful-documentation Point/step use current head metres and the shared budget spends one preview sample.
 * @evidence contracts/performance.md#efficient-algorithms One contact query and fixed aim/turn work dominate each call.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing contact and shared aim/turn owners are reused instead of rebuilt query structures.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a direction escapes and the borrowed budget is the sole intentionally mutable caller record.
 */
export function steerHumanFaceHairRootedStep(
  props: IHumanFaceHairRootedSteering,
): IAutoMovieVector3 {
  if (
    ![props.point, props.before, props.normal].every(
      (p: IAutoMovieVector3): boolean =>
        p !== undefined && p !== null && [p.x, p.y, p.z].every(Number.isFinite),
    ) ||
    !Number.isFinite(props.step) ||
    props.step <= props.contact.epsilon
  )
    throw new Error(
      "Rooted steering requires finite geometry and positive representable travel.",
    );
  if (
    props.budget === undefined ||
    props.budget === null ||
    !Number.isSafeInteger(props.budget.remaining) ||
    props.budget.remaining < 0
  )
    throw new Error("Rooted steering requires its safe-integer shared budget.");
  const direction: IAutoMovieVector3 = limitHumanFaceHairTurn({
    before: props.before,
    direction: props.normal,
    step: props.step,
  });
  if (props.budget.remaining === 0)
    throw new Error("Rooted steering exhausted its shared geometry budget.");
  props.budget.remaining--;
  const trial: IAutoMovieVector3 = Vector3.add(props.point, Vector3.scale(direction, props.step));
  const hit: ImportedIAutoMovieSignedMeshQueryHit = props.contact.sample(trial);
  if (hit.signedDistance >= props.contact.clearance - props.contact.epsilon)
    return direction;
  return aimHumanFaceHairRootedStem({
    before: props.before,
    normal: props.normal,
    blocking: props.contact.outward(trial, hit),
    step: props.step,
  });
}
