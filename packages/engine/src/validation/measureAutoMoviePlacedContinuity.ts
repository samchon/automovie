import type { IAutoMoviePlacedContinuity } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "./ViolationCollector";
import { validateTransformScalars } from "./validateTransformScalars";

/**
 * Check one raw placed transform, a declared continuous pair, or a custody rule.
 * The timeline owner supplies actual endpoints in film presentation seconds.
 * Equal times are allowed for a required seam. A known cut or declared
 * discontinuity excludes only the pair comparison. Unavailable observations
 * leave coverage unsupported.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States presentation time, coincident seams, intentional discontinuities and unavailable facts. A continuous pair yields metres and radians when measurable.
 * @evidence contracts/development/implementation.md#principled-implementation Raw TRS uses the canonical scalar gates. Continuous placed transforms compare finite translations and shortest relative orientations. Custody compares the actual owner with the allowed set.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The input discriminant separates independent checks. The pair predicate handles both endpoints and preserves evidence paths without depending on the other check variants.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No comparison spans an authored cut, infers a holder from proximity or treats request order as film time. Missing and unavailable records have distinct results.
 * @evidence contracts/development/implementation.md#efficient-algorithms A transform or continuous pair uses constant work and temporary space. Custody work is linear in the explicitly allowed set.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the shared canonical TRS admission, quaternion angle and vector distance implementations without resampling a track or generating geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function owns no history, event subscription or host resource. The result and its canonical findings retain only the observations required by their inherited violation contract.
 */
export function measureAutoMoviePlacedContinuity(
  props: IAutoMoviePlacedContinuity.IProps,
): IAutoMoviePlacedContinuity.IResult {
  if (props.kind === "step") return measureStep(props);

  const { path } = props;
  const collector: ViolationCollector = new ViolationCollector();
  if (props.kind === "transform") {
    if (props.observation === undefined) return { status: "unsupported" };
    if (props.observation.kind === "present")
      validateTransformScalars({
        transform: props.observation.transform,
        path,
        label: "placed transform",
        collector,
      });
    else
      collector.push(
        "coverage",
        path,
        "required placed transform is missing",
        undefined,
      );
  } else {
    if (props.holder === undefined) return { status: "unsupported" };
    if (props.allowed.length === 0)
      collector.push(
        "type",
        `${path}.allowed`,
        "custody rule must allow at least one holder or a free prop",
        props.allowed,
      );
    else if (!props.allowed.includes(props.holder))
      collector.push(
        "temporal",
        `${path}.holder`,
        "holder must be allowed by the active custody rule",
        props.holder,
      );
  }
  return { status: "checked", violations: collector.items };
}

/**
 * Compare a continuous endpoint pair: admit both clocks, transforms and
 * limits, then measure translation distance in metres and shortest rotation
 * in radians against the limits. A cut or declared break is excluded and a
 * missing endpoint is unsupported.
 */
function measureStep(
  props: Extract<IAutoMoviePlacedContinuity.IProps, { kind: "step" }>,
): IAutoMoviePlacedContinuity.IResult {
  const { path, boundary, before, after, maxDistance, maxAngle } = props;
  if (boundary === "cut" || boundary === "discontinuity")
    return { status: "excluded" };
  if (boundary === "unavailable" || before === undefined || after === undefined)
    return { status: "unsupported" };

  const collector: ViolationCollector = new ViolationCollector();
  collector.range(
    `${path}.before.seconds`,
    before.seconds,
    0,
    Infinity,
    "outgoing film time",
  );
  collector.range(
    `${path}.after.seconds`,
    after.seconds,
    0,
    Infinity,
    "incoming film time",
  );
  if (
    Number.isFinite(before.seconds) &&
    Number.isFinite(after.seconds) &&
    after.seconds < before.seconds
  )
    collector.push(
      "temporal",
      `${path}.after.seconds`,
      "incoming film time must follow or coincide with outgoing film time",
      after.seconds,
    );
  validateTransformScalars({
    transform: before.transform,
    path: `${path}.before.transform`,
    label: "outgoing transform",
    collector,
  });
  validateTransformScalars({
    transform: after.transform,
    path: `${path}.after.transform`,
    label: "incoming transform",
    collector,
  });
  if (maxDistance !== undefined)
    collector.range(
      `${path}.maxDistance`,
      maxDistance,
      0,
      Infinity,
      "displacement limit",
    );
  if (maxAngle !== undefined)
    collector.range(
      `${path}.maxAngle`,
      maxAngle,
      0,
      Math.PI,
      "angular displacement limit",
    );
  if (collector.items.length !== 0)
    return { status: "checked", violations: collector.items };

  const distance: number = Vector3.distance(
    before.transform.translation,
    after.transform.translation,
  );
  const angle: number = Quaternion.angle(
    before.transform.rotation,
    after.transform.rotation,
  );
  collector.range(
    `${path}.distance`,
    distance,
    0,
    maxDistance ?? Infinity,
    "displacement in metres",
  );
  collector.range(
    `${path}.angle`,
    angle,
    0,
    maxAngle ?? Math.PI,
    "shortest angular displacement in radians",
  );
  if (!Number.isFinite(distance) || !Number.isFinite(angle))
    return { status: "checked", violations: collector.items };
  return {
    status: "checked",
    violations: collector.items,
    motion: { distance, angle },
  };
}
