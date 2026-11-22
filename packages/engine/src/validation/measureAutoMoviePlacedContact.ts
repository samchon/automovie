import type {
  IAutoMoviePlacedContact,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "./ViolationCollector";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRotationArtifact } from "./validateRotationArtifact";
import { validateVectorArtifact } from "./validateVectorArtifact";

/**
 * Measure a support or grip using already placed observations at one film instant.
 * Support gives signed normal gap and tangential slip in metres. Grip gives
 * position separation in metres and the shortest orientation separation in radians.
 * An absent sample leaves the check unsupported. Invalid observations or limits
 * produce findings without measurements.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the units, support normal sign, absent observation and malformed input outcomes. Each observation uses its owning placed frame.
 * @evidence contracts/development/implementation.md#principled-implementation Inverse rigid placement expresses the point or prop in its reference frame. Normal and tangent deviations are independent, and the relative quaternion uses the shared shortest-rotation predicate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The discriminant selects the support or grip measurement. Both share rigid admission and position conversion, and the validator attaches violations to the supplied paths.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No scene sampling, default anchor, guessed holder, world-up projection or raw quaternion component difference stands in for the declared observation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each observed relation uses a fixed number of component checks and rigid-vector operations. It never rebuilds a pose or scans scene objects.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses canonical vector and quaternion math, shape admission and finding construction. Grip shares one inverse hand orientation between its position and rotation measures.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No scene, observer or host resource is retained. The returned values and bounded set of violations belong to the caller.
 */
export function measureAutoMoviePlacedContact(
  props: IAutoMoviePlacedContact.IProps,
): IAutoMoviePlacedContact.IResult {
  if (props.sample === undefined) return { status: "unsupported" };
  return props.kind === "support"
    ? measureSupport(props, props.sample)
    : measureGrip(props, props.sample);
}

/**
 * Measure a support sample: express the observed point in the support's rigid
 * frame, then compare its local Y offset from the anchor with the gap limit
 * and its XZ offset with the slip limit, both in metres.
 */
function measureSupport(
  props: Extract<IAutoMoviePlacedContact.IProps, { kind: "support" }>,
  sample: IAutoMoviePlacedContact.ISupportSample,
): IAutoMoviePlacedContact.IResult {
  const { path, maxGap, maxSlip } = props;
  const collector: ViolationCollector = new ViolationCollector();
  validateVectorArtifact(
    sample.point,
    `${path}.point`,
    "contact point",
    collector.items,
  );
  validateVectorArtifact(
    sample.anchor,
    `${path}.anchor`,
    "support anchor",
    collector.items,
  );
  validateFrame(sample.frame, `${path}.frame`, "support frame", collector);
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
  if (!Number.isFinite(gap) || !Number.isFinite(slip))
    return { status: "invalid", violations: collector.items };
  return {
    status: "checked",
    kind: "support",
    gap,
    slip,
    violations: collector.items,
  };
}

/**
 * Measure a grip sample: express the prop's frame in the hand's frame, then
 * compare its distance and shortest rotation from the expected relative frame
 * with the limits, in metres and radians.
 */
function measureGrip(
  props: Extract<IAutoMoviePlacedContact.IProps, { kind: "grip" }>,
  sample: IAutoMoviePlacedContact.IGripSample,
): IAutoMoviePlacedContact.IResult {
  const { path, maxDistance, maxAngle } = props;
  const collector: ViolationCollector = new ViolationCollector();
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
  collector.range(
    `${path}.distance`,
    distance,
    0,
    maxDistance,
    "grip separation in metres",
  );
  collector.range(`${path}.angle`, angle, 0, maxAngle, "grip angle in radians");
  if (!Number.isFinite(distance) || !Number.isFinite(angle))
    return { status: "invalid", violations: collector.items };
  return {
    status: "checked",
    kind: "grip",
    distance,
    angle,
    violations: collector.items,
  };
}

/**
 * Admit a rigid frame's object shape, finite position and unit rotation,
 * appending each failure at its field path.
 */
function validateFrame(
  frame: IAutoMovieRigidTransform,
  path: string,
  label: string,
  collector: ViolationCollector,
): void {
  if (!validateObjectArtifact(frame, path, label, collector.items)) return;
  validateVectorArtifact(
    frame.position,
    `${path}.position`,
    `${label} position`,
    collector.items,
  );
  validateRotationArtifact(
    frame.rotation,
    `${path}.rotation`,
    `${label} rotation`,
    collector,
  );
}

/**
 * A world point expressed in the frame at `origin` whose inverse orientation
 * is given.
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
