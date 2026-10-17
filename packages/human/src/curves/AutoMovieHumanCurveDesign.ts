import type { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { validateAutoMovieHumanCurveSupplement } from "../measure/validateAutoMovieHumanCurveSupplement";
import type { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanCurveSupplement } from "../structures/IAutoMovieHumanCurveSupplement";
import { inspectAutoMovieHumanCurveDesign } from "./inspectAutoMovieHumanCurveDesign";
import { keyAutoMovieHumanCurveSupplement } from "./keyAutoMovieHumanCurveSupplement";

/** Per-person inspection worker sharing the already resolved rest skeleton.
 *
 * Only one successful document is retained. Its key covers every admitted
 * scalar, including signed zero, regardless of recursive property ordering.
 * A failed admission or generation leaves that entry intact. Each returned
 * value is copied so a viewer cannot mutate retained operators or coefficients.
 * Appearance and existing skin generation never participate in this cache.
 */
export class AutoMovieHumanCurveDesign {
  private readonly measurements: IAutoMovieHumanMeasurements;
  private readonly skeleton: IAutoMovieHumanSkeleton;
  private cached:
    | { key: string; result: inspectAutoMovieHumanCurveDesign.Ready }
    | undefined;
  /** Keep the instance's immutable resolved specimen; no skeleton is regenerated here. */
  public constructor(props: {
    measurements: IAutoMovieHumanMeasurements;
    skeleton: IAutoMovieHumanSkeleton;
  }) {
    this.measurements = props.measurements;
    this.skeleton = props.skeleton;
  }
  /** Admit measurements and generate once per distinct successful document.
   *
   * The cache avoids seven-family reconstruction on equivalent viewer edits.
   * Snapshot copying still visits the generated coefficient and display data.
   * Missing dimensions are reported without consulting any calibration bank.
   */
  public inspectCurveDesign(
    props: {
      detailed?: IAutoMovieHumanCurveSupplement;
      pelvisRepresentation?: "external-r6b" | "pants-r6";
    } = {},
  ): inspectAutoMovieHumanCurveDesign.Result {
    const admission: ReturnType<typeof validateAutoMovieHumanCurveSupplement> =
      validateAutoMovieHumanCurveSupplement(props.detailed);
    if (!admission.success)
      return {
        status: admission.errors.some(
          (finding: validateAutoMovieHumanCurveSupplement.Finding): boolean =>
            finding.kind === "invalid",
        )
          ? "invalid-measurements"
          : "missing-measurements",
        identityValidity: "unchanged",
        findings: admission.errors,
      };
    const pelvisRepresentation: "external-r6b" | "pants-r6" =
      props.pelvisRepresentation ?? "external-r6b";
    if (
      pelvisRepresentation !== "external-r6b" &&
      pelvisRepresentation !== "pants-r6"
    )
      return {
        status: "design-unavailable",
        identityValidity: "unchanged",
        findings: [
          {
            path: "$design.pelvisRepresentation",
            kind: "unsupported-design",
            message: "Unknown pelvis representation",
          },
        ],
      };
    const key: string =
      pelvisRepresentation +
      ":" +
      keyAutoMovieHumanCurveSupplement(admission.data);
    if (this.cached?.key === key) return structuredClone(this.cached.result);
    const result: inspectAutoMovieHumanCurveDesign.Result =
      inspectAutoMovieHumanCurveDesign({
        measurements: this.measurements,
        skeleton: this.skeleton,
        detailed: admission.data,
        pelvisRepresentation,
      });
    if (result.status === "ready") this.cached = { key, result };
    return structuredClone(result);
  }
}
