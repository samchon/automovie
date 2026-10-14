
import { IAutoMovieBuildProjectOutput } from "@automovie/interface";


import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "./contentIdentity";

/**
 * Bind a terminal snapshot to one successful source-status observation.
 *
 * The optional live authoring reader runs before compile and the same reader is passed onward. A reader failure prevents compile. A failed source status refuses; a successful callback is trusted, and its success/input identity overwrite any supplied snapshot.builder before canonical hashing.
 *
 * Identity uses the engine's JSON domain: unsupported object values are omitted, unsupported array slots become null, and cycles, nonfinite numbers, invalid Unicode, accessors and non-plain non-array objects refuse. The top-level snapshot spread can evaluate getters before encoding; the caller must supply ordinary JSON data for an identity that represents every relevant field.
 *
 * Current consumers are the exported snapshot utility and a portable live-authoring unit; no maintained production commit consumes this result as its admission gate.
 *
 * @evidence contracts/common.md#principled-implementation Canonical JSON bytes and their content digest bind the supplied JSON-domain snapshot to admitted builder identity. The injected compiler owns source validation and currentness; this helper only checks success and cannot establish that a borrowed snapshot stayed unchanged during the callback. Canonical encoding preserves its domain refusals and omission rules rather than admitting arbitrary object fields as distinct identity.
 * @evidence contracts/common.md#clear-and-simple-design One callback seam separates source-status ownership from canonical identity policy for the snapshot utility; current test reach does not establish terminal publication wiring.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reader and compiler exceptions propagate, false success is not fabricated, and a caller-provided builder field cannot override the observed gate result. Successful callback diagnostics are not independently revalidated here.
 * @evidence contracts/common.md#meaningful-documentation Documents evaluation order, optional reader behavior, compiler trust, failed status refusal, canonical builder-field replacement and absent production-commit consumption.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes live evidence acquisition and compiler work, enumerable snapshot field copying, complete canonical traversal/key sorting and hashing all encoded bytes. No constant-time claim excludes nested input size or delegated source work.
 * @evidence contracts/performance.md#reuse-equivalent-work The compiler callback may return its valid retained status; this helper invokes it for every observation and caches neither authoring evidence nor the resulting fingerprint.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary top-level copies and canonical byte buffers expire after return or failure; nested snapshot values and reader remain caller-owned. No handle/task is acquired and snapshot/diagnostic bytes have no bound enforced here.
 */
export function readProductionPublicationInputFingerprint<Authoring>(
  props: {
  /** Caller-owned project observation, read during canonical encoding after the source callback. */
  snapshot: Readonly<Record<string, unknown>>;

  /** Optional fresh evidence reader; a thrown value prevents source evaluation. */
  currentAuthoringEvidence?: () => Authoring;

  /** Source-currentness owner receiving the observed evidence and its live reader. */
  compile: (
    authoring: Authoring | undefined,
    current: (() => Authoring) | undefined,
  ) => Pick<
    IAutoMovieBuildProjectOutput,
    "success" | "builder" | "diagnostics"
  >;
}
): string {
  const builder: Pick<IAutoMovieBuildProjectOutput, "success" | "builder" | "diagnostics"> = props.compile(
    props.currentAuthoringEvidence?.(),
    props.currentAuthoringEvidence,
  );
  if (builder.success === false)
    throw new Error(
      `Terminal publication requires a successful current source compile: ${JSON.stringify(builder.diagnostics)}`,
    );
  return digestAutoMovieBytes(
    canonicalAutoMovieJsonBytes({
      ...props.snapshot,
      builder: {
        success: builder.success,
        inputFingerprint: builder.builder.inputFingerprint,
      },
    }),
  );
}
