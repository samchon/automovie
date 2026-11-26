import type { IAutoMoviePlacedContinuity } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMovieEngineViolationCollector } from "./AutoMovieEngineViolationCollector";
import { validateTransformScalars } from "./validateTransformScalars";

/**
 * Check one raw placed transform, a declared continuous pair, or a custody
 * rule. The timeline owner supplies actual endpoints in film presentation
 * seconds. Equal times are allowed for a required seam. A known cut or declared
 * discontinuity excludes only the pair comparison. Unavailable observations
 * leave coverage unsupported.
 */
export function measureAutoMoviePlacedContinuity(
  props: IAutoMoviePlacedContinuity.IProps,
): IAutoMoviePlacedContinuity.IResult {
  if (props.kind === "step") return measureStep(props);

  const { path } = props;
  const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
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
 * Compare a continuous endpoint pair: admit both clocks, transforms and limits,
 * then measure translation distance in metres and shortest rotation in radians
 * against the limits. A cut or declared break is excluded and a missing
 * endpoint is unsupported.
 */
function measureStep(
  props: Extract<IAutoMoviePlacedContinuity.IProps, { kind: "step" }>,
): IAutoMoviePlacedContinuity.IResult {
  const { path, boundary, before, after, maxDistance, maxAngle } = props;
  if (boundary === "cut" || boundary === "discontinuity")
    return { status: "excluded" };
  if (boundary === "unavailable" || before === undefined || after === undefined)
    return { status: "unsupported" };

  const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
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
  if (after.seconds < before.seconds)
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
  return {
    status: "checked",
    violations: collector.items,
    motion: { distance, angle },
  };
}
