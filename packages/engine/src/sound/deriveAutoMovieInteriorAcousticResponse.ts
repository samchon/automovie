import {
  type IAutoMovieAcousticReceiver,
  type IAutoMovieAcousticSource,
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  type IAutoMovieDeriveInteriorAcousticResponse,
  IAutoMovieProductionAcousticResponse,
} from "@automovie/interface";

import { analyzeAutoMovieAcoustics } from "../analysis/analyzeAutoMovieAcoustics";
import { Vector3 } from "../math/Vector3";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";

/**
 * Derive a closed room-path receipt from explicit space bindings and an
 * acoustic profile.
 */
export const deriveAutoMovieInteriorAcousticResponse: (
  props: IAutoMovieDeriveInteriorAcousticResponse.IProps,
) => IAutoMovieProductionAcousticResponse = (
  props: IAutoMovieDeriveInteriorAcousticResponse.IProps,
): IAutoMovieProductionAcousticResponse => {
  if (SHA256_DIGEST_PATTERN.test(props.inputRevision) === false)
    throw new Error(
      "acoustic response input revision must be a SHA-256 digest",
    );
  if (props.sourceSpace === null && props.listenerSpace === null)
    return {
      status: "available",
      path: "outdoor",
      profile: props.profile.id,
      inputRevision: props.inputRevision,
      reverberationTimeSeconds: null,
      directToDiffuseRatio: null,
      transmissionGain: null,
    };
  if (props.sourceSpace === null || props.listenerSpace === null)
    return {
      status: "unsupported",
      path: null,
      reason:
        "source and listener room binding is incomplete; one endpoint is indoors and the other is unresolved",
    };
  const path: Exclude<
    IAutoMovieProductionAcousticResponse["path"],
    "outdoor" | null
  > =
    props.sourceSpace === props.listenerSpace ? "same-room" : "different-room";
  if (props.profile.kind === "adopted-response")
    return {
      status: "not-run",
      path,
      reason:
        "the selected adopted response must be decoded and mapped before the engine can consume it",
    };
  if (props.profile.solver !== "sabine-broadband-v1")
    throw new Error("acoustic response solver is unsupported");
  if (props.request === null)
    return {
      status: "not-run",
      path,
      reason: `space "${props.sourceSpace}" has no adopted acoustic analysis input`,
    };
  if (props.request.subject !== props.sourceSpace)
    throw new Error(
      `acoustic request subject "${props.request.subject}" does not match source space "${props.sourceSpace}"`,
    );
  if (props.request.inputRevision !== props.inputRevision)
    throw new Error(
      "acoustic request revision does not match the event input revision",
    );

  const analysis: IAutoMovieAnalysisRun = analyzeAutoMovieAcoustics({
    request: props.request,
  });
  // The bounded acoustic analyzer always seals a solved run; unsupported
  // individual facts are metric gaps inside that solved outcome.
  const metrics: IAutoMovieAnalysisMetric[] = (
    analysis.outcome as Extract<
      IAutoMovieAnalysisRun["outcome"],
      { status: "solved" }
    >
  ).metrics;
  if (path === "same-room") {
    const reverberation: number | null = metricValue(
      metrics,
      "room.reverberationTime",
    );
    const roomConstant: number | null = metricValue(metrics, "room.constant");
    if (reverberation === null || roomConstant === null)
      return {
        status: "unsupported",
        path,
        // The analyzer derives both diffuse-field metrics from one room
        // constant, so they gap together and share the reverberation reason.
        reason: metricGap(metrics, "room.reverberationTime"),
      };
    if (
      props.request.sources.length !== 1 ||
      props.request.receivers.length !== 1
    )
      return {
        status: "unsupported",
        path,
        reason:
          "an audible same-room response requires exactly one event source and one listener receiver",
      };
    const source: IAutoMovieAcousticSource = props.request.sources[0]!;
    const receiver: IAutoMovieAcousticReceiver = props.request.receivers[0]!;
    const distance: number = Vector3.length(
      Vector3.subtract(receiver.position, source.position),
    );
    const direct: number =
      source.directivity / (4 * Math.PI * distance * distance);
    const diffuse: number = 4 / roomConstant;
    return {
      status: "available",
      path,
      profile: props.profile.id,
      inputRevision: props.inputRevision,
      reverberationTimeSeconds: reverberation,
      directToDiffuseRatio: direct / diffuse,
      transmissionGain: null,
    };
  }

  const transmissionLoss: number | null = metricValue(
    metrics,
    "partition.compositeTransmissionLoss",
  );
  if (transmissionLoss === null)
    return {
      status: "unsupported",
      path,
      reason: metricGap(metrics, "partition.compositeTransmissionLoss"),
    };
  return {
    status: "available",
    path,
    profile: props.profile.id,
    inputRevision: props.inputRevision,
    reverberationTimeSeconds: null,
    directToDiffuseRatio: null,
    transmissionGain: Math.pow(10, -transmissionLoss / 20),
  };
};

/**
 * Read one fixed analyzer metric key and return null for a sealed metric gap;
 * the analyzer's complete fixed-key population is required.
 */
const metricValue: (
  metrics: IAutoMovieAnalysisMetric[],
  key: string,
) => number | null = (
  metrics: Extract<
    IAutoMovieAnalysisRun["outcome"],
    { status: "solved" }
  >["metrics"],
  key: string,
): number | null =>
  metrics.find(
    (metric: IAutoMovieAnalysisMetric): boolean => metric.key === key,
  )!.value ?? null;

/**
 * Read the corresponding fixed-key gap reason only after the response branch
 * established that metric is unavailable.
 */
const metricGap: (
  metrics: IAutoMovieAnalysisMetric[],
  key: string,
) => string = (
  metrics: Extract<
    IAutoMovieAnalysisRun["outcome"],
    { status: "solved" }
  >["metrics"],
  key: string,
): string =>
  metrics.find(
    (candidate: IAutoMovieAnalysisMetric): boolean => candidate.key === key,
  )!.gap!.reason;
