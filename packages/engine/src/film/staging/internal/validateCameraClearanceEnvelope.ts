import type {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieCameraClearanceSphere,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/*
 * Validate one camera-clearance envelope before it reaches the resolved scene.
 *
 * The `body` sphere and a non-null `parentRig` sphere each need a `radius`
 * greater than zero, in metres. Violations go to `out` at `<path>.body.radius`
 * and `<path>.parentRig.radius`.
 * Parameter value: The authored envelope.
 * Parameter path: Violation path of the envelope.
 * Parameter out: Collector the violations are appended to.
 */
export function validateCameraClearanceEnvelope(
  value: IAutoMovieCameraClearanceEnvelope,
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  validateSphere(value.body, `${path}.body`, out);
  if (value.parentRig !== null)
    validateSphere(value.parentRig, `${path}.parentRig`, out);
}

/*
 * One clearance sphere: a positive radius.
 */
function validateSphere(
  sphere: IAutoMovieCameraClearanceSphere,
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  if (sphere.radius <= 0)
    out.push(
      "range",
      `${path}.radius`,
      "camera clearance radius must be greater than zero",
      sphere.radius,
    );
}
