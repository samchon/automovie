import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRootedSteering } from "./IHumanFaceHairRootedSteering";
import { aimHumanFaceHairRootedStem } from "./aimHumanFaceHairRootedStem";
import { limitHumanFaceHairTurn } from "./limitHumanFaceHairTurn";

/**
 * Preview the same rooted trial before admitting a station. When its closest
 * contact changes before full clearance, the two actual outward normals supply
 * their maximum common directional-margin goal. The original turn cone bounds
 * that goal; interval/contact admission still belongs to the integrator.
 * Root support is never widened and no blocker identity or waypoint is stored.
 * Points/steps are current head metres, normals unitless, budget caller-owned.
 */
export function steerHumanFaceHairRootedStep(
  props: IHumanFaceHairRootedSteering,
): IAutoMovieVector3 {
  if (
    ![props.point, props.before, props.normal].every(
      (p) =>
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
  const direction = limitHumanFaceHairTurn({
    before: props.before,
    direction: props.normal,
    step: props.step,
  });
  if (props.budget.remaining === 0)
    throw new Error("Rooted steering exhausted its shared geometry budget.");
  props.budget.remaining--;
  const trial = Vector3.add(props.point, Vector3.scale(direction, props.step));
  const hit = props.contact.sample(trial);
  if (hit.signedDistance >= props.contact.clearance - props.contact.epsilon)
    return direction;
  return aimHumanFaceHairRootedStem({
    before: props.before,
    normal: props.normal,
    blocking: props.contact.outward(trial, hit),
    step: props.step,
  });
}
