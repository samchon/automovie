import { IAutoMovieRepaintObservationMember, IAutoMovieRepaintSequenceObservation } from "@automovie/interface";
import { AutoMovieRepaintObservationDiagnostic } from "./AutoMovieRepaintObservationDiagnostic";
import { productionRepaintObservationAssertObservation } from "./productionRepaintObservationAssertObservation";
import { productionRepaintObservationAssertMembers } from "./productionRepaintObservationAssertMembers";
import { productionRepaintObservationAssertBaseline } from "./productionRepaintObservationAssertBaseline";
import { productionRepaintObservationIsExactText } from "./productionRepaintObservationIsExactText";
import { productionRepaintObservationIsDigest } from "./productionRepaintObservationIsDigest";
import { digestAutoMovieRepaintObservationMembers } from "./digestAutoMovieRepaintObservationMembers";
import { productionRepaintObservationCanonical } from "./productionRepaintObservationCanonical";

/**
 * Verify one persisted sequence observation against the current timeline set.
 *
 * Admission errors become one schema refusal. Admitted ordered members, production/compile/timeline/baseline and caller-observed artifact digest are compared independently, then completed status and all stored pass verdicts are required. Typed record fields and the caller's actual current artifact/baseline observations remain premises; the operation reads no artifact and performs no playback. Canonicalization after the initial admission boundary can still throw on unsupported extra object state.
 *
 * @evidence contracts/common.md#principled-implementation Persisted/current admission precedes exact ordered-member digest/canonical equality, independent basis/baseline and artifact equality, then completion vocabulary checks without rewriting stored truth.
 * @evidence contracts/common.md#clear-and-simple-design This function owns persisted-versus-current metadata diagnostics; the caller supplies artifact identity and baseline while actual playback/byte observation stays outside it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stored pass strings are not fresh visual evidence, null artifact identity remains stale, and schema refusal does not substitute a fabricated current member set.
 * @evidence contracts/common.md#meaningful-documentation Prose states early admission refusal, accumulated independent currentness codes, typed/caller observation premises and later canonicalization failures.
 * @evidence contracts/performance.md#efficient-algorithms Actual cost includes repeated member admission/digesting plus canonical encodings of both member arrays and both baselines; work/storage follow record/text populations and key sorting, not only five verdict checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplied artifact/compile/timeline identities are reused without media rereads, while current mutable metadata is recanonicalized rather than trusting prior verdicts; repeated pure member passes remain explicit costs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Canonical strings/bytes, validation sets and diagnostics are local; only compact codes escape and no playback, file, provider task or retained observation cache starts.
 */
export const autoMovieRepaintSequenceObservationDiagnostics: (props: {
    observation: IAutoMovieRepaintSequenceObservation;
    productionId: string;
    compileFingerprint: string;
    timelineFingerprint: string;
    baseline: IAutoMovieRepaintSequenceObservation["baseline"];
    members: readonly IAutoMovieRepaintObservationMember[];
    artifactDigest: string | null;
}) => AutoMovieRepaintObservationDiagnostic[] = (props: {
  observation: IAutoMovieRepaintSequenceObservation;
  productionId: string;
  compileFingerprint: string;
  timelineFingerprint: string;
  baseline: IAutoMovieRepaintSequenceObservation["baseline"];
  members: readonly IAutoMovieRepaintObservationMember[];
  artifactDigest: string | null;
}): AutoMovieRepaintObservationDiagnostic[] => {
  const diagnostics: AutoMovieRepaintObservationDiagnostic[] = [];
  try {
    productionRepaintObservationAssertObservation(props.observation);
    productionRepaintObservationAssertMembers(props.members);
    productionRepaintObservationAssertBaseline(props.baseline);
    if (
      !productionRepaintObservationIsExactText(props.productionId) ||
      !productionRepaintObservationIsDigest(props.compileFingerprint) ||
      !productionRepaintObservationIsDigest(props.timelineFingerprint)
    )
      throw new Error("Current repaint observation basis is malformed.");
  } catch {
    return ["observation-schema-invalid"];
  }
  if (
    props.observation.memberSetDigest !==
      digestAutoMovieRepaintObservationMembers(props.members) ||
    productionRepaintObservationCanonical(props.observation.members) !== productionRepaintObservationCanonical(props.members)
  )
    diagnostics.push("observation-member-set-stale");
  if (
    props.observation.productionId !== props.productionId ||
    props.observation.compileFingerprint !== props.compileFingerprint ||
    props.observation.timelineFingerprint !== props.timelineFingerprint ||
    productionRepaintObservationCanonical(props.observation.baseline) !== productionRepaintObservationCanonical(props.baseline)
  )
    diagnostics.push("observation-basis-stale");
  if (props.artifactDigest !== props.observation.artifact.digest)
    diagnostics.push("observation-artifact-stale");
  if (
    props.observation.status !== "completed" ||
    Object.values(props.observation.verdicts).some(
      (verdict: IAutoMovieRepaintSequenceObservation["verdicts"][keyof IAutoMovieRepaintSequenceObservation["verdicts"]]): boolean => verdict !== "pass",
    )
  )
    diagnostics.push("observation-incomplete");
  return diagnostics;
};
