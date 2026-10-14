import { AutoMovieRepaintReferenceRole, IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintGeneratorProvenance, IAutoMovieRepaintParameters, IAutoMovieRepaintRequestEvidence } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "./contentIdentity";
import { canonicalAutoMovieRepaintGeneratorProvenance } from "./canonicalAutoMovieRepaintGeneratorProvenance";

/**
 * Fingerprint the current repaint request independently of transport attempt and eventual output.
 *
 * Shot, compile/source identity, adapter, admitted provenance, parameters, policy, evidence and ordered fixed references enter canonical request-v4 bytes. The owner admits all fields except provenance before calling. Equal content identity does not authorize sharing an effectful provider attempt or bypassing the claim ledger.
 *
 * @evidence contracts/common.md#principled-implementation Canonical domain-separated bytes hash the complete supplied request basis while excluding attemptId and output, preserving one request identity across its admitted retries.
 * @evidence contracts/common.md#clear-and-simple-design This composer owns immutable request identity; claim acquisition, retry policy and provider dispatch retain separate effect owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching digest is not an active-attempt or completed-output receipt; caller admission remains required for adapter, parameters, policy, evidence and reference bytes.
 * @evidence contracts/common.md#meaningful-documentation Prose names identity fields, ordered references, omitted attempt/output and effect-sharing limits.
 * @evidence contracts/performance.md#efficient-algorithms Provenance is canonicalized and parsed before full request canonicalization/key sorting, UTF-8 encoding and hashing; time/storage follow metadata and reference populations rather than media size.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing compile/source/reference digests feed the common identity protocol without media rereads; request equivalence is exposed to the ledger rather than implemented as an effect cache here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous call retains only temporary canonical values/bytes and returns one digest string; it owns no provider task, claim handle or global request map.
 */
export const productionRepaintRequestFingerprint: (props: {
    shot: string;
    compileFingerprint: string;
    sourceRenderFingerprint: string;
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
}) => string = (props: {
  shot: string;
  compileFingerprint: string;
  sourceRenderFingerprint: string;
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
}): string =>
  digestAutoMovieBytes(
    canonicalAutoMovieJsonBytes({
      protocol: "automovie.repaint-request.v4",
      shot: props.shot,
      compileFingerprint: props.compileFingerprint,
      sourceRenderFingerprint: props.sourceRenderFingerprint,
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
