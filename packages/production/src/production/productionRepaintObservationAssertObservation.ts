import { IAutoMovieRepaintSequenceObservation } from "@automovie/interface";
import { productionRepaintObservationIsExactText } from "./productionRepaintObservationIsExactText";
import { productionRepaintObservationIsDigest } from "./productionRepaintObservationIsDigest";
import { productionRepaintObservationIsStatus } from "./productionRepaintObservationIsStatus";
import { productionRepaintObservationIsVerdict } from "./productionRepaintObservationIsVerdict";
import { productionRepaintObservationAssertBaseline } from "./productionRepaintObservationAssertBaseline";
import { productionRepaintObservationAssertMembers } from "./productionRepaintObservationAssertMembers";
import { digestAutoMovieRepaintObservationMembers } from "./digestAutoMovieRepaintObservationMembers";

/**
 * Admit declared observation metadata and its exact ordered member digest. Version, required text/digest fields, status, five supported verdict values, baseline and member rules are checked; exact verdict key names and arbitrary extra state rely on the typed/schema-owning caller. No review artifact or playback is inspected.
 *
 * @evidence contracts/common.md#principled-implementation Supported protocol/text/digest/status/value checks precede baseline/member admission and equality of the stored member digest to canonical current supplied member bytes.
 * @evidence contracts/common.md#clear-and-simple-design The assertion owns observation coherence while complete schema, resident currentness and physical playback remain caller/consumer responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Five supported values are not an exact verdict-key schema proof, and non-passing supported verdict/status values remain admitted metadata rather than falsely completed observations.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies checked fields, typed exact-key premise, member digest equality and metadata-versus-playback limits.
 * @evidence contracts/performance.md#efficient-algorithms Fixed metadata checks precede baseline/member scans, then the digest helper revalidates members and canonicalizes/hashes their full records; actual text/tree cost and repeated pass are retained.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared member identity owner defines the stored digest protocol, while no previous observation or mutable member admission is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Validation sets, canonical bytes and Date-free text predicates are local; void or refusal escapes without retaining observation, artifact bytes or a playback task.
 */
export const productionRepaintObservationAssertObservation: (observation: IAutoMovieRepaintSequenceObservation) => void = (
  observation: IAutoMovieRepaintSequenceObservation,
): void => {
  if (
    observation.version !== 1 ||
    [
      observation.productionId,
      observation.baseline.address,
      observation.baseline.version,
      observation.artifact.path,
      observation.playback.runtime,
      observation.playback.context,
    ].some((value: string): boolean => !productionRepaintObservationIsExactText(value)) ||
    [
      observation.compileFingerprint,
      observation.timelineFingerprint,
      observation.memberSetDigest,
      observation.artifact.digest,
    ].some((digest: string): boolean => !productionRepaintObservationIsDigest(digest)) ||
    !productionRepaintObservationIsStatus(observation.status) ||
    Object.values(observation.verdicts).length !== 5 ||
    Object.values(observation.verdicts).some((verdict: IAutoMovieRepaintSequenceObservation["verdicts"][keyof IAutoMovieRepaintSequenceObservation["verdicts"]]): boolean => !productionRepaintObservationIsVerdict(verdict))
  )
    throw new Error("Repaint sequence observation is malformed.");
  productionRepaintObservationAssertBaseline(observation.baseline);
  productionRepaintObservationAssertMembers(observation.members);
  if (
    observation.memberSetDigest !==
    digestAutoMovieRepaintObservationMembers(observation.members)
  )
    throw new Error("Repaint sequence observation member digest is malformed.");
};
