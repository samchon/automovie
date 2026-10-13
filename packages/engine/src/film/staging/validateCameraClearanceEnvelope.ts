import { ViolationCollector } from "../../validation/ViolationCollector";
import { isRecord } from "../../validation/isRecord";

/**
 * Validate one portable camera-clearance envelope before it reaches the
 * resolved scene. The implementation deliberately reads every nested value as
 * unknown: generated authoring code is an external boundary even when its
 * compile-time type claims the object is well formed.
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

  const validateSphere = (sphere: unknown, spherePath: string): void => {
    if (!isRecord(sphere)) {
      out.push(
        "type",
        spherePath,
        "camera clearance sphere must be an object",
        sphere,
      );
      return;
    }
    if (!isRecord(sphere.center))
      out.push(
        "type",
        `${spherePath}.center`,
        "camera clearance centre must be a vector object",
        sphere.center,
      );
    else if (
      ![sphere.center.x, sphere.center.y, sphere.center.z].every(
        (coordinate) =>
          typeof coordinate === "number" && Number.isFinite(coordinate),
      )
    )
      out.push(
        "range",
        `${spherePath}.center`,
        "camera clearance centre must be a finite vector",
        sphere.center,
      );
    if (
      typeof sphere.radius !== "number" ||
      !Number.isFinite(sphere.radius) ||
      sphere.radius <= 0
    )
      out.push(
        "range",
        `${spherePath}.radius`,
        "camera clearance radius must be finite and greater than zero",
        sphere.radius,
      );
  };

  validateSphere(value.body, `${path}.body`);
  if (!("parentRig" in value))
    out.push(
      "type",
      `${path}.parentRig`,
      "camera clearance must state a parent rig sphere or null",
      undefined,
    );
  else if (value.parentRig !== null)
    validateSphere(value.parentRig, `${path}.parentRig`);
};
