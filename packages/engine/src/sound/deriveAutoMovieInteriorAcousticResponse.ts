import { IAutoMovieAcousticResponseProfile, IAutoMovieAnalysisRun, IAutoMovieProductionAcousticResponse, IAutoMovieAnalysisMetric } from "@automovie/interface";
import { IAutoMovieAcousticRequest } from "../analysis/IAutoMovieAcousticRequest";
import { analyzeAutoMovieAcoustics } from "../analysis/analyzeAutoMovieAcoustics";
import { Vector3 } from "../math/Vector3";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { IAutoMovieAcousticSource } from "../analysis/IAutoMovieAcousticSource";
import { IAutoMovieAcousticReceiver } from "../analysis/IAutoMovieAcousticReceiver";
/**
 * Derive a closed room-path receipt from explicit space bindings and an acoustic profile.
 *
 * @evidence contracts/common.md#principled-implementation The shared Sabine analysis supplies fixed metric keys; same-room uses bounded reverberation/room constant and exactly one source/receiver to form direct-to-diffuse ratio, while partition loss maps to 10^(-dB/20). The analyzer's admitted geometry and numerical gap/refusal policy remain prerequisites.
 * @evidence contracts/common.md#clear-and-simple-design Room response owns path selection and receipt packaging while the shared analyzer owns physical inputs and metrics; outdoor, incomplete binding and unavailable adoption remain distinct outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adopted profiles return not-run because bytes are absent here, and missing/gapped facts remain unsupported rather than becoming dry success; a matching digest string is checked syntactically, not recomputed from geometry.
 * @evidence contracts/common.md#meaningful-documentation Documents digest/subject agreement, outdoor/cross-room/same-room branches, numeric gap effects and the exactly-one-emitter/listener requirement; metric lookup relies on the analyzer's fixed-key population.
 * @evidence contracts/performance.md#efficient-algorithms Profile/digest admission is bounded string work, followed by the analyzer's surface/source/receiver/partition scans and its fixed-size metric lookups; no repeated acoustic solve is hidden behind this receipt.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared analysis and the canonical SHA-256 format owner supply one physical/digest policy; changed request/profile/input revision causes fresh derivation, with no completed response cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The analysis and metric objects are call-local; the returned receipt retains only scalar/profile/revision facts or a refusal reason, without room geometry, adopted audio or solver tasks.
 * @author Samchon
 */
export const deriveAutoMovieInteriorAcousticResponse: (props: { sourceSpace: string | null; listenerSpace: string | null; inputRevision: string; request: IAutoMovieAcousticRequest | null; profile: IAutoMovieAcousticResponseProfile; }) => IAutoMovieProductionAcousticResponse = (props: {
  /** Source space, or `null` outdoors. */
  sourceSpace: string | null;
  /** Listener space, or `null` outdoors. */
  listenerSpace: string | null;
  /** Exact geometry/material/emitter/listener input digest. */
  inputRevision: string;
  /** Shared acoustic request for the source room, when available. */
  request: IAutoMovieAcousticRequest | null;
  /** Explicit production-owned response source. */
  profile: IAutoMovieAcousticResponseProfile;
}): IAutoMovieProductionAcousticResponse => {
  if (props.profile.id.trim().length === 0)
    throw new Error("acoustic response profile id must not be blank");
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
  const path: Exclude<IAutoMovieProductionAcousticResponse["path"], "outdoor" | null> =
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

  const analysis: IAutoMovieAnalysisRun = analyzeAutoMovieAcoustics({ request: props.request });
  // The bounded acoustic analyzer always seals a solved run; unsupported
  // individual facts are metric gaps inside that solved outcome.
  const metrics: IAutoMovieAnalysisMetric[] = (
    analysis.outcome as Extract<
      IAutoMovieAnalysisRun["outcome"],
      { status: "solved" }
    >
  ).metrics;
  if (path === "same-room") {
    const reverberation: number | null = metricValue(metrics, "room.reverberationTime");
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
    const direct: number = source.directivity / (4 * Math.PI * distance * distance);
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

/** Read one fixed analyzer metric key and return null for a sealed metric gap; the analyzer's complete fixed-key population is required. */
const metricValue: (metrics: IAutoMovieAnalysisMetric[], key: string) => number | null = (
  metrics: Extract<
    IAutoMovieAnalysisRun["outcome"],
    { status: "solved" }
  >["metrics"],
  key: string,
): number | null => metrics.find((metric: IAutoMovieAnalysisMetric): boolean => metric.key === key)!.value ?? null;

/** Read the corresponding fixed-key gap reason only after the response branch established that metric is unavailable. */
const metricGap: (metrics: IAutoMovieAnalysisMetric[], key: string) => string = (
  metrics: Extract<
    IAutoMovieAnalysisRun["outcome"],
    { status: "solved" }
  >["metrics"],
  key: string,
): string => metrics.find((candidate: IAutoMovieAnalysisMetric): boolean => candidate.key === key)!.gap!.reason;
