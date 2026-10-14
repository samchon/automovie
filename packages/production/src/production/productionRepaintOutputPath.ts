import { AutoMovieRepaintReferenceRole, IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintGeneratorProvenance, IAutoMovieRepaintParameters, IAutoMovieRepaintRequestEvidence } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { canonicalAutoMovieRepaintGeneratorProvenance } from "./canonicalAutoMovieRepaintGeneratorProvenance";

/**
 * Address one immutable rendition by shot, deterministic source, attempt-bound request and output digest.
 *
 * Provenance is admitted here; source/output digest spelling and the other request fields are caller-admitted premises. The request component includes attemptId, whereas the retry-shared request fingerprint does not. The returned slash-separated path writes no bytes and checks no resident output.
 *
 * @evidence contracts/common.md#principled-implementation Canonical request-v4 bytes include attempt, adapter, provenance, parameters, policy, evidence and ordered references; the path combines encoded shot, source digest, request digest and output digest.
 * @evidence contracts/common.md#clear-and-simple-design Immutable output addressing stays separate from transport-retry identity and receipt publication; the common encoder owns portable shot segments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest prefixes are sliced under prior admission rather than fabricated from media; the function validates provenance but neither other request semantics nor resident output bytes.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes attempt-bound versus retry-shared identity, caller-admitted digests and a path-only result.
 * @evidence contracts/performance.md#efficient-algorithms Provenance canonicalization/parse, complete request key sorting/encoding/hash and shot encoding scale with actual metadata/reference/text bytes; no output-media scan occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplied source/output digests are reused without media rereads, and shared canonical/hash/path owners define representation; no path cache retains mutable request operands.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Canonical strings, parsed provenance and UTF-8 request bytes are call-local; only the path string escapes and no file or provider task is acquired.
 */
export const productionRepaintOutputPath: (props: {
    shot: string;
    sourceRenderFingerprint: string;
    attemptId: string;
    adapterIdentity: string;
    generatorProvenance: IAutoMovieRepaintGeneratorProvenance;
    parameters: IAutoMovieRepaintParameters;
    executionPolicy: IAutoMovieRepaintExecutionPolicy;
    evidence: IAutoMovieRepaintRequestEvidence;
    references: readonly {
        role: AutoMovieRepaintReferenceRole;
        path: string;
        digest: string;
    }[];
    outputDigest: string;
}) => string = (props: {
  shot: string;
  sourceRenderFingerprint: string;
  attemptId: string;
  adapterIdentity: string;
  generatorProvenance: IAutoMovieRepaintGeneratorProvenance;
  parameters: IAutoMovieRepaintParameters;
  executionPolicy: IAutoMovieRepaintExecutionPolicy;
  evidence: IAutoMovieRepaintRequestEvidence;
  references: readonly {
    role: AutoMovieRepaintReferenceRole;
    path: string;
    digest: string;
  }[];
  outputDigest: string;
}): string => {
  const request: string = digestAutoMovieBytes(
    canonicalAutoMovieJsonBytes({
      protocol: "automovie.repaint-request.v4",
      attemptId: props.attemptId,
      adapterIdentity: props.adapterIdentity,
      generatorProvenance: JSON.parse(
        canonicalAutoMovieRepaintGeneratorProvenance(props.generatorProvenance),
      ),
      parameters: props.parameters,
      executionPolicy: props.executionPolicy,
      evidence: props.evidence,
      references: props.references,
    }),
  );
  return [
    "renditions",
    encodeAutoMoviePathSegment(props.shot),
    props.sourceRenderFingerprint.slice(7),
    request.slice(7),
    `${props.outputDigest.slice(7)}.mp4`,
  ].join("/");
};
