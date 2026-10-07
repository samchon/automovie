import { Vector3 } from "@automovie/engine";

import type { IHumanFaceHairGatherTransport } from "./IHumanFaceHairGatherTransport";
import type { IHumanFaceHairGatherTransportState } from "./IHumanFaceHairGatherTransportState";

/**
 * Transport a pre-tie candidate without changing its requested direction blend.
 * The first-free actual offset supplies the datum. Limited requested normal
 * intent advances it by actual chord metric; strength relaxes only the offset
 * residual. A plane therefore preserves authored normal motion at every strength.
 * Ordinary/zero-strength and tied tail callers keep their existing path.
 * All positions, offsets and travel are current head metres. No caller mutates.
 * The existing floor remains mandatory; concave/ambiguous retraction refuses.
 *
 * @evidence contracts/common.md#principled-implementation The implicit chord equation is (1-b²)l²-2b(v.n)l-|v|²=0 with b=strength*(direction.normal). Its positive root supplies actual metric normal intent, while the original skin owner qualifies retraction and floor.
 * @evidence contracts/common.md#clear-and-simple-design Owns one scalar transport relation; field blending, turn, contact and metric walking retain their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, triangle, waypoint, tolerance or budget exception; unsupported geometry refuses.
 * @evidence contracts/common.md#meaningful-documentation States strength limits, derived datum, actual metric, units, ownership and refusal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Computes one candidate and owns no displayed identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no author field and preserves the existing requested direction.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator admits and retains actual stations.
 * @evidence contracts/modeling.md#spatial-conventions Uses current head metres and dimensionless unit directions/strength.
 * @evidence contracts/modeling.md#shared-boundaries The original same-collider floor and shared lock budget remain mandatory after retraction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical transport carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes derived state and the existing admitted strength, never a personal corrective.
 */
export function transportHumanFaceHairGatherStep(
  props: IHumanFaceHairGatherTransportState,
): IHumanFaceHairGatherTransport {
  if (
    ![props.point, props.direction, props.normal].every(
      (p) =>
        p !== undefined && p !== null && [p.x, p.y, p.z].every(Number.isFinite),
    )
  )
    throw new Error(
      "Gather transport requires finite current point and directions.",
    );
  if (
    props.budget === undefined ||
    props.budget === null ||
    !Number.isSafeInteger(props.budget.remaining) ||
    props.budget.remaining < 0
  )
    throw new Error(
      "Gather transport requires its safe-integer shared budget.",
    );
  if (
    !Number.isFinite(props.strength) ||
    props.strength < 0 ||
    props.strength > 1 ||
    !Number.isFinite(props.parameter) ||
    props.parameter < 0 ||
    !Number.isFinite(props.offset) ||
    props.offset < props.contact.clearance - props.contact.epsilon
  )
    throw new Error(
      "Gather transport requires admitted strength, travel and derived free offset.",
    );
  const raw = Vector3.add(
    props.point,
    Vector3.scale(props.direction, props.parameter),
  );
  const intent = Vector3.dot(props.direction, props.normal);
  if (props.strength === 0)
    return {
      point: raw,
      offset: Math.max(
        props.contact.clearance - props.contact.epsilon,
        props.offset +
          intent * Vector3.length(Vector3.subtract(raw, props.point)),
      ),
      normalIntent: intent,
    };
  const retracted = props.contact.retract(raw, props.offset, props.budget);
  const v = Vector3.subtract(
    Vector3.add(
      raw,
      Vector3.scale(Vector3.subtract(retracted.point, raw), props.strength),
    ),
    props.point,
  );
  const b = props.strength * intent;
  const a = 1 - b * b,
    linear = b * Vector3.dot(v, retracted.normal),
    constant = Vector3.dot(v, v);
  let metric: number;
  if (a === 0 && constant === 0) metric = props.parameter;
  else if (a === 0 && linear < 0) metric = -constant / (2 * linear);
  else if (a > 0) {
    const root = Math.sqrt(linear * linear + a * constant);
    metric = linear < 0 ? constant / (root - linear) : (linear + root) / a;
  } else
    throw new Error(
      "Gather transport has no representable normal-intent geometry.",
    );
  // Each real root is nonnegative. Nonfinite scalar arithmetic produces a
  // nonfinite candidate, which the existing closed-query owner refuses below.
  let point = Vector3.add(
    props.point,
    Vector3.add(v, Vector3.scale(retracted.normal, b * metric)),
  );
  const offset = Math.max(
    props.contact.clearance - props.contact.epsilon,
    props.offset + intent * metric,
  );
  if (props.offset + intent * metric < offset)
    point = props.contact.retract(point, offset, props.budget).point;
  if (props.budget.remaining === 0)
    throw new Error("Gather transport exhausted its shared geometry budget.");
  props.budget.remaining--;
  if (
    props.contact.sample(point).signedDistance <
    props.contact.clearance - props.contact.epsilon
  )
    point = props.contact.retract(
      point,
      props.contact.clearance,
      props.budget,
    ).point;
  return {
    point,
    offset: Math.max(
      props.contact.clearance - props.contact.epsilon,
      props.offset +
        intent * Vector3.length(Vector3.subtract(point, props.point)),
    ),
    normalIntent: intent,
  };
}
