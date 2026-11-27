import type {
  IAutoMoviePlacedContact,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { AutoMovieEngineViolationCollector } from "../AutoMovieEngineViolationCollector";

/*
 * Measure a support or grip using already placed observations at one film
 * instant. Support gives signed normal gap and tangential slip in metres. Grip
 * gives position separation in metres and the shortest orientation separation
 * in radians. An absent sample leaves the check unsupported. Invalid
 * observations or limits produce findings without measurements.
 */
export function measureAutoMoviePlacedContact(
  props: IAutoMoviePlacedContact.IProps,
): IAutoMoviePlacedContact.IResult {
  if (props.sample === undefined) return { status: "unsupported" };
  return props.kind === "support"
    ? measureSupport(props, props.sample)
    : measureGrip(props, props.sample);
}

/*
 * Measure a support sample: express the observed point in the support's rigid
 * frame, then compare its local Y offset from the anchor with the gap limit and
 * its XZ offset with the slip limit, both in metres.
 */
function measureSupport(
  props: Extract<IAutoMoviePlacedContact.IProps, { kind: "support" }>,
  sample: IAutoMoviePlacedContact.ISupportSample,
): IAutoMoviePlacedContact.IResult {
  const { path, maxGap, maxSlip } = props;
  const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  validateFrame(sample.frame, `${path}.frame`, "support frame", collector);
  validatePosition(
    sample.point,
    `${path}.point`,
    "observed support point",
    collector,
  );
  validatePosition(
    sample.anchor,
    `${path}.anchor`,
    "support anchor",
    collector,
  );
  collector.range(`${path}.maxGap`, maxGap, 0, Infinity, "normal gap limit");
  collector.range(
    `${path}.maxSlip`,
    maxSlip,
    0,
    Infinity,
    "tangential slip limit",
  );
  if (collector.items.length !== 0)
    return { status: "invalid", violations: collector.items };

  const local: IAutoMovieVector3 = localPosition(
    sample.point,
    sample.frame.position,
    Quaternion.inverse(sample.frame.rotation),
  );
  const delta: IAutoMovieVector3 = Vector3.subtract(local, sample.anchor);
  const gap: number = delta.y;
  const slip: number = Math.hypot(delta.x, delta.z);
  if (!Number.isFinite(gap) || !Number.isFinite(slip)) {
    collector.range(
      `${path}.gap`,
      gap,
      -Number.MAX_VALUE,
      Number.MAX_VALUE,
      "signed support gap in metres",
    );
    collector.range(
      `${path}.slip`,
      slip,
      0,
      Number.MAX_VALUE,
      "tangential support slip in metres",
    );
    return { status: "invalid", violations: collector.items };
  }
  collector.range(
    `${path}.gap`,
    gap,
    -maxGap,
    maxGap,
    "signed support gap in metres",
  );
  collector.range(
    `${path}.slip`,
    slip,
    0,
    maxSlip,
    "tangential support slip in metres",
  );
  return {
    status: "checked",
    kind: "support",
    gap,
    slip,
    violations: collector.items,
  };
}

/*
 * Measure a grip sample: express the prop's frame in the hand's frame, then
 * compare its distance and shortest rotation from the expected relative frame
 * with the limits, in metres and radians.
 */
function measureGrip(
  props: Extract<IAutoMoviePlacedContact.IProps, { kind: "grip" }>,
  sample: IAutoMoviePlacedContact.IGripSample,
): IAutoMoviePlacedContact.IResult {
  const { path, maxDistance, maxAngle } = props;
  const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  validateFrame(sample.hand, `${path}.hand`, "grip socket", collector);
  validateFrame(sample.prop, `${path}.prop`, "held prop", collector);
  validateFrame(
    sample.expected,
    `${path}.expected`,
    "expected grip offset",
    collector,
  );
  collector.range(
    `${path}.maxDistance`,
    maxDistance,
    0,
    Infinity,
    "grip separation limit",
  );
  collector.range(`${path}.maxAngle`, maxAngle, 0, Math.PI, "grip angle limit");
  if (collector.items.length !== 0)
    return { status: "invalid", violations: collector.items };

  const inverseHand: IAutoMovieQuaternion = Quaternion.inverse(
    sample.hand.rotation,
  );
  const position: IAutoMovieVector3 = localPosition(
    sample.prop.position,
    sample.hand.position,
    inverseHand,
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    inverseHand,
    sample.prop.rotation,
  );
  const distance: number = Vector3.distance(position, sample.expected.position);
  const angle: number = Quaternion.angle(rotation, sample.expected.rotation);
  if (!Number.isFinite(distance) || !Number.isFinite(angle)) {
    collector.range(
      `${path}.distance`,
      distance,
      0,
      Number.MAX_VALUE,
      "grip separation in metres",
    );
    collector.range(
      `${path}.angle`,
      angle,
      0,
      Math.PI,
      "grip angle in radians",
    );
    return { status: "invalid", violations: collector.items };
  }
  collector.range(
    `${path}.distance`,
    distance,
    0,
    maxDistance,
    "grip separation in metres",
  );
  collector.range(`${path}.angle`, angle, 0, maxAngle, "grip angle in radians");
  return {
    status: "checked",
    kind: "grip",
    distance,
    angle,
    violations: collector.items,
  };
}

/*
 * Admit a rigid frame's finite position and unit rotation, appending each
 * failure at its field path.
 */
function validateFrame(
  frame: IAutoMovieRigidTransform,
  path: string,
  label: string,
  collector: AutoMovieEngineViolationCollector,
): void {
  validatePosition(
    frame.position,
    `${path}.position`,
    `${label} position`,
    collector,
  );
  const rotation: IAutoMovieQuaternion = frame.rotation;
  if (
    Number.isFinite(rotation.x) &&
    Number.isFinite(rotation.y) &&
    Number.isFinite(rotation.z) &&
    Number.isFinite(rotation.w)
  )
    collector.unitQuaternion(`${path}.rotation`, rotation, `${label} rotation`);
  else
    collector.push(
      "range",
      `${path}.rotation`,
      `${label} rotation must be a finite unit quaternion`,
      rotation,
    );
}

/*
 * Report an unrepresentable world or local point at its declared input path.
 */
function validatePosition(
  point: IAutoMovieVector3,
  path: string,
  label: string,
  collector: AutoMovieEngineViolationCollector,
): void {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(point.z)
  )
    collector.push(
      "range",
      path,
      `${label} must have finite components`,
      point,
    );
}

/*
 * A world point expressed in the frame at `origin` whose inverse orientation is
 * given.
 */
function localPosition(
  point: IAutoMovieVector3,
  origin: IAutoMovieVector3,
  inverseOrientation: IAutoMovieQuaternion,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    inverseOrientation,
    Vector3.subtract(point, origin),
  );
}
