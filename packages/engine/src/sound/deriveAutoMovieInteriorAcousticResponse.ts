import type { AutoMovieContentDigest, IAutoMovieAcousticResponseProfile, IAutoMovieAnalysisRun, IAutoMovieProductionAcousticResponse } from "@automovie/interface";
import { analyzeAutoMovieAcoustics } from "../analysis/analyzeAutoMovieAcoustics";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieAcousticRequest } from "../analysis/IAutoMovieAcousticRequest";

/**
 * Derive the shared room-path result from a selected acoustic profile.
 *
 * Both spaces absent is outdoor. Exactly one absent is unsupported coupling.
 * The built-in profile runs the existing Sabine solver once; an adopted
 * response remains `not-run` here because this pure engine function receives no
 * adopted bytes. Same-room results carry T60 and a source/receiver-specific
 * direct-to-diffuse energy ratio. Cross-room results carry only partition
 * gain.
 *
 * @evidence requirements/sound/interior-acoustics.md#sound-room-binding Preserves outdoor, same-room, different-room, and unresolved paths.
 * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-input-revision Rejects a shared analysis request whose digest differs from the event revision and records the verified digest on every available response.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#bounded-acoustic-response-and-provider-adoption Produces the bounded response for the resolved room route.
 * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-mix-consumption Reuses the shared analysis revision in audible processing.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#acoustic-mix-consumption-and-claim-boundary Keeps absent analysis distinct from success.
 */
export const deriveAutoMovieInteriorAcousticResponse = (props: {
  /** Source space, or `null` outdoors. */
  sourceSpace: string | null;
  /** Listener space, or `null` outdoors. */
  listenerSpace: string | null;
  /** Exact geometry/material/emitter/listener input digest. */
  inputRevision: AutoMovieContentDigest;
  /** Shared acoustic request for the source room, when available. */
  request: IAutoMovieAcousticRequest | null;
  /** Explicit production-owned response source. */
  profile: IAutoMovieAcousticResponseProfile;
}): IAutoMovieProductionAcousticResponse => {
  if (props.profile.id.trim().length === 0)
    throw new Error("acoustic response profile id must not be blank");
  if (DIGEST_PATTERN.test(props.inputRevision) === false)
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
  const path =
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

  const analysis = analyzeAutoMovieAcoustics({ request: props.request });
  // The bounded acoustic analyzer always seals a solved run; unsupported
  // individual facts are metric gaps inside that solved outcome.
  const metrics = (
    analysis.outcome as Extract<
      IAutoMovieAnalysisRun["outcome"],
      { status: "solved" }
    >
  ).metrics;
  if (path === "same-room") {
    const reverberation = metricValue(metrics, "room.reverberationTime");
    const roomConstant = metricValue(metrics, "room.constant");
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
    const source = props.request.sources[0]!;
    const receiver = props.request.receivers[0]!;
    const distance = Vector3.length(
      Vector3.subtract(receiver.position, source.position),
    );
    const direct = source.directivity / (4 * Math.PI * distance * distance);
    const diffuse = 4 / roomConstant;
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

  const transmissionLoss = metricValue(
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
