import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieRecoveryDefaultObservationOptions,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryObservationOptions,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySourceLineage,
} from "@automovie/interface";

import { convertAutoMovieRecoveryCurves } from "../../curves/internal/convertAutoMovieRecoveryCurves";
import { AutoMovieRecoveryMeshSections } from "../AutoMovieRecoveryMeshSections";

/**
 * Observe a registered mesh and return source-free cubic coefficients and
 * incidence. Inputs are borrowed and remain unchanged. Numerical fitting
 * failures are reported by the observation owner; unsupported local components
 * retain their diagnostics. No original position, triangle, normal or rig array
 * enters the returned bundle. curveFormat selects every nested cubic basis;
 * omitted means bezier. Conversion retains original phase widths and binary64
 * arithmetic limitations. onSourceLineage optionally observes copied original
 * face incidence during fitting; those provisional acquisition records never
 * enter the source-free result. Observer exceptions fail the operation, and
 * cooperative cancellation stops further delivery.
 */
export function observeAutoMovieRecovery<
  Format extends AutoMovieRecoveryCurveFormat,
>(
  input: IAutoMovieRecoveryInput,
  options: IAutoMovieRecoveryObservationOptions<Format>,
): IAutoMovieRecoveryResult<
  AutoMovieRecoveryCurveData<IAutoMovieRecoveryMeshSections, Format>
>;

export function observeAutoMovieRecovery(
  input: IAutoMovieRecoveryInput,
  options?: IAutoMovieRecoveryDefaultObservationOptions,
): IAutoMovieRecoveryResult<IAutoMovieRecoveryMeshSections>;

export function observeAutoMovieRecovery(
  input: IAutoMovieRecoveryInput,
  options: IAutoMovieRecoveryOptions,
): IAutoMovieRecoveryResult<
  AutoMovieRecoveryCurveData<
    IAutoMovieRecoveryMeshSections,
    AutoMovieRecoveryCurveFormat
  >
>;

export function observeAutoMovieRecovery(
  input: IAutoMovieRecoveryInput,
  options: IAutoMovieRecoveryOptions = {},
): IAutoMovieRecoveryResult<unknown> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "legacy-contour-v1";
  let cancellationRequested: boolean = false;
  let probe: (() => boolean) | undefined;
  const cancelled: () => boolean = (): boolean => {
    const requested: boolean | undefined = probe?.();
    cancellationRequested = requested === true;
    return cancellationRequested;
  };
  try {
    probe = options.cancelled;

    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before observation"],
      };

    const value: IAutoMovieRecoveryMeshSections =
      AutoMovieRecoveryMeshSections.extract(
        input,
        (phase: string, completed: number, total: number): void => {
          if (cancelled()) throw new Error("Observation cancelled");
          options.onProgress?.(phase, completed, total);
        },
        options.sectionLimit,
        options.onSourceLineage === undefined
          ? undefined
          : (observation: IAutoMovieRecoverySourceLineage): void => {
              if (cancelled()) throw new Error("Observation cancelled");
              options.onSourceLineage!(observation);
              if (cancelled()) throw new Error("Observation cancelled");
            },
      );
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before publication"],
      };
    const partial: boolean =
      value.coverage?.complete === false ||
      value.topologyGaps.length > 0 ||
      value.unconsumedEvents.length > 0 ||
      value.reports.some(
        (report: IAutoMovieRecoveryMeshSections["reports"][number]): boolean =>
          report.open.length > 0 ||
          report.isolatedContactsMm.length > 0 ||
          report.diagnostics.length > 0,
      );
    return {
      operator,
      status: partial ? "partial" : "complete",
      value:
        options.curveFormat === undefined || options.curveFormat === "bezier"
          ? value
          : convertAutoMovieRecoveryCurves(value, options.curveFormat),
      diagnostics: value.diagnostics.slice(),
    };
  } catch (failure: unknown) {
    return {
      operator,
      status: cancellationRequested ? "cancelled" : "failed",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
