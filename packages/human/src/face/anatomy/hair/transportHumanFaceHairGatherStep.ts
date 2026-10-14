import { Vector3 } from "@automovie/engine";
import type { IHumanFaceHairRetraction as ImportedIHumanFaceHairRetraction } from "@automovie/human";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairGatherTransport } from "./IHumanFaceHairGatherTransport";
import type { IHumanFaceHairGatherTransportState } from "./IHumanFaceHairGatherTransportState";

/**
 * Transport a pre-tie candidate without changing its requested direction blend. The first-free actual offset supplies the datum. Limited requested normal intent advances it by actual chord metric; strength relaxes only the offset residual. A plane therefore preserves authored normal motion at every strength. Ordinary/zero-strength and tied tail callers keep their existing path. All positions, offsets and travel are current head metres. No caller mutates. The existing floor remains mandatory; concave/ambiguous retraction refuses.
 *
 * @evidence contracts/common.md#principled-implementation Derived first-free offset and requested normal intent transport a pre-tie candidate through offset retraction.
 * @evidence contracts/common.md#clear-and-simple-design The gather strength relaxes offset residual while the existing field blend and actual chord metric remain authoritative.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid strength/offset/budget or ambiguous retraction refuses, and the original free-clearance floor is preserved.
 * @evidence contracts/common.md#meaningful-documentation Input positions and offset/travel use current head metres; zero strength preserves its direct candidate branch.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar/vector solving delegates dominant cost to up to several bounded offset retractions and samples.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing lock contact and remaining budget are reused rather than a separate gather collider.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output point/offset are caller-owned and no previous transport path is retained; only the supplied budget mutates.
 */
export function transportHumanFaceHairGatherStep(
  props: IHumanFaceHairGatherTransportState,
): IHumanFaceHairGatherTransport {
  if (
    ![props.point, props.direction, props.normal].every(
      (p: ImportedIAutoMovieVector3): boolean =>
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
  const raw: ImportedIAutoMovieVector3 = Vector3.add(
    props.point,
    Vector3.scale(props.direction, props.parameter),
  );
  const intent: number = Vector3.dot(props.direction, props.normal);
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
  const retracted: ImportedIHumanFaceHairRetraction = props.contact.retract(
    raw,
    props.offset,
    props.budget,
  );
  const v: ImportedIAutoMovieVector3 = Vector3.subtract(
    Vector3.add(
      raw,
      Vector3.scale(Vector3.subtract(retracted.point, raw), props.strength),
    ),
    props.point,
  );
  const b: number = props.strength * intent;
  const a: number = 1 - b * b,
    linear: number = b * Vector3.dot(v, retracted.normal),
    constant: number = Vector3.dot(v, v);
  let metric: number;
  if (a === 0 && constant === 0) metric = props.parameter;
  else if (a === 0 && linear < 0) metric = -constant / (2 * linear);
  else if (a > 0) {
    const root: number = Math.sqrt(linear * linear + a * constant);
    metric = linear < 0 ? constant / (root - linear) : (linear + root) / a;
  } else
    throw new Error(
      "Gather transport has no representable normal-intent geometry.",
    );
  // Each real root is nonnegative. Nonfinite scalar arithmetic produces a
  // nonfinite candidate, which the existing closed-query owner refuses below.
  let point: ImportedIAutoMovieVector3 = Vector3.add(
    props.point,
    Vector3.add(v, Vector3.scale(retracted.normal, b * metric)),
  );
  const offset: number = Math.max(
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
