import { ViolationCollector } from "../../validation/ViolationCollector";
import { isRecord } from "../../validation/isRecord";

/**
 * Validate one camera-clearance envelope before it reaches the resolved scene.
 *
 * The envelope must be an object with a `body` sphere and an explicit
 * `parentRig` that is a sphere or `null`. A sphere must be an object whose
 * `center` is an object of three finite numbers and whose `radius` is a finite
 * number greater than zero, in metres. Every nested value is read as
 * `unknown`, because generated authoring code reaches `stage` in-process and
 * its static type does not prove the payload is well formed. Violations go to
 * `out` at `<path>`, `<path>.body`, `<path>.parentRig` and their `.center` and
 * `.radius`; a non-object at a level stops the checks below it.
 *
 * @param value The authored envelope, unchecked.
 * @param path Violation path of the envelope.
 * @param out Collector the violations are appended to.
 *
 * @evidence contracts/common.md#principled-implementation Narrows each level with `isRecord` and each number with `typeof` and `Number.isFinite` before comparing, so a malformed payload becomes a located violation instead of a `TypeError`, and the radius bound is strict because a zero sphere encloses no lens.
 * @evidence contracts/common.md#clear-and-simple-design One validator per staged camera field, paired with `lowerCameraClearanceEnvelope`; the two spheres share one private sphere check so they report the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is defaulted or repaired; an omitted `parentRig` is refused because `null` is the stated way to say there is no rig.
 * @evidence contracts/common.md#meaningful-documentation States the accepted shape, units and bounds, why values are read as unknown, the reported paths, and where checking stops.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed number of field checks in constant time, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Checks one camera's envelope per call and coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing itself; it appends at most four violations per call to `out`, a centre and a radius for each sphere, to the collector the caller owns.
 */
export const validateCameraClearanceEnvelope = (
  value: unknown,
  path: string,
  out: ViolationCollector,
): void => {
  if (!isRecord(value)) {
    out.push("type", path, "camera clearance must be an object", value);
    return;
  }
  validateSphere(value.body, `${path}.body`, out);
  if (!("parentRig" in value))
    out.push(
      "type",
      `${path}.parentRig`,
      "camera clearance must state a parent rig sphere or null",
      undefined,
    );
  else if (value.parentRig !== null)
    validateSphere(value.parentRig, `${path}.parentRig`, out);
};

/** One clearance sphere: a finite object centre and a positive radius. */
const validateSphere = (
  sphere: unknown,
  path: string,
  out: ViolationCollector,
): void => {
  if (!isRecord(sphere)) {
    out.push("type", path, "camera clearance sphere must be an object", sphere);
    return;
  }
  const center: unknown = sphere.center;
  if (!isRecord(center))
    out.push(
      "type",
      `${path}.center`,
      "camera clearance centre must be a vector object",
      center,
    );
  else if (![center.x, center.y, center.z].every(Number.isFinite))
    out.push(
      "range",
      `${path}.center`,
      "camera clearance centre must be a finite vector",
      center,
    );
  const radius: unknown = sphere.radius;
  if (typeof radius !== "number" || !Number.isFinite(radius) || radius <= 0)
    out.push(
      "range",
      `${path}.radius`,
      "camera clearance radius must be finite and greater than zero",
      radius,
    );
};
