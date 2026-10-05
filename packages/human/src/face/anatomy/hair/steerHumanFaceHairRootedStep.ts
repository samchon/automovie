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
 *
 * @evidence contracts/common.md#principled-implementation Unit normal bisectors attain sqrt((1+n0.n1)/2) as the maximum common directional margin; original turn limiting and actual exterior admission remain separate requirements.
 * @evidence contracts/common.md#clear-and-simple-design Owns current/trial steering only, apart from contact and interval proof.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No saved host, subject, wall slide, support exception or budget reset.
 * @evidence contracts/common.md#meaningful-documentation States preview timing, units, ownership and limits of the directional proposal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no station; the owning walker certifies it.
 * @evidence contracts/modeling.md#spatial-conventions Uses current head metres and unit directions.
 * @evidence contracts/modeling.md#shared-boundaries Reads the existing same-collider contact and never changes original root support or clearance.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal control.
 */
export function steerHumanFaceHairRootedStep(props: IHumanFaceHairRootedSteering): IAutoMovieVector3 {
  if (![props.point, props.before, props.normal].every(p => p !== undefined &&
      p !== null && [p.x, p.y, p.z].every(Number.isFinite)) ||
      !Number.isFinite(props.step) || props.step <= props.contact.epsilon)
    throw new Error("Rooted steering requires finite geometry and positive representable travel.");
  if (props.budget === undefined || props.budget === null ||
      !Number.isSafeInteger(props.budget.remaining) || props.budget.remaining < 0)
    throw new Error("Rooted steering requires its safe-integer shared budget.");
  const direction = limitHumanFaceHairTurn({ before: props.before, direction: props.normal, step: props.step });
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
