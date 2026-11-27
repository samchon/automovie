import type {
  IAutoMovieContactReceipt,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Find the first causal fault in a contact receipt, or return null for admitted
 * data. Times are finite, nonnegative film seconds. Samples must occur within
 * their episode, in nondecreasing order. The reader owns its archive bounds,
 * additional identity constraints and diagnostic text.
 * Parameter receipt: Episode with its world-space measurements and completed steps.
 * Returns: The first failing contact requirement, or null when all pass.
 */
export function contactReceiptFault(
  receipt: IAutoMovieContactReceipt,
): ContactReceiptFault | null {
  if (
    !receipt.id.trim() ||
    !contactSideNamed(receipt.a) ||
    !contactSideNamed(receipt.b)
  )
    return "identity";
  if (
    !Number.isFinite(receipt.seconds) ||
    receipt.seconds < 0 ||
    !Number.isFinite(receipt.endSeconds) ||
    receipt.endSeconds < receipt.seconds ||
    !contactGeometryValid(
      receipt.point,
      receipt.normal,
      receipt.separation,
      receipt.compression,
    )
  )
    return "episode";

  if (receipt.source === "geometric") {
    if (receipt.impulse !== null) return "geometric-impulse";
    return (receipt.samples?.length ?? 0) > 0 ? "geometric-samples" : null;
  }
  if (receipt.impulse === null || !isNonnegativeFinite(receipt.impulse))
    return "solver-impulse";

  let previous: number = receipt.seconds;
  for (const sample of receipt.samples ?? []) {
    if (
      !Number.isFinite(sample.seconds) ||
      sample.seconds < previous ||
      sample.seconds > receipt.endSeconds ||
      !Number.isFinite(sample.duration) ||
      sample.duration <= 0 ||
      !isNonnegativeFinite(sample.impulse) ||
      (sample.appliedImpulse !== undefined &&
        (!isNonnegativeFinite(sample.appliedImpulse.a) ||
          !isNonnegativeFinite(sample.appliedImpulse.b))) ||
      !contactGeometryValid(
        sample.point,
        sample.normal,
        sample.separation,
        sample.compression,
      )
    )
      return "sample";
    previous = sample.seconds;
  }
  return null;
}

/*
 * First intrinsic failure in the identity, episode, authority or sample data.
 */
type ContactReceiptFault =
  | "identity"
  | "episode"
  | "geometric-impulse"
  | "geometric-samples"
  | "solver-impulse"
  | "sample";

/*
 * Unit-normal tolerance shared by the live solver and archive readers.
 */
const NORMAL_TOLERANCE: number = 1e-5;

/*
 * A collider side names its body, segment, shape and material.
 */
function contactSideNamed(side: IAutoMovieContactReceipt["a"]): boolean {
  return (
    side.body.trim().length > 0 &&
    side.bone.trim().length > 0 &&
    side.shape.trim().length > 0 &&
    side.material.trim().length > 0
  );
}

/*
 * A contact uses a finite world point and unit normal with signed separation.
 */
function contactGeometryValid(
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  separation: number,
  compression: number,
): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z) &&
    Math.abs(Math.hypot(normal.x, normal.y, normal.z) - 1) <=
      NORMAL_TOLERANCE &&
    Number.isFinite(separation) &&
    separation <= 0 &&
    isNonnegativeFinite(compression)
  );
}

/*
 * A magnitude is a representable scalar at or above zero.
 */
function isNonnegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
