import { IAutoMovieProductionSemanticMaskEvidence } from "./IAutoMovieProductionSemanticMaskEvidence";

/**
 * Preview observation classification preserves complete or incomplete evidence and gives a reason for absent, unsupported, foreign or invalid input. Incomplete evidence is inspectable but cannot satisfy final mask admission.
 *
 * @evidence contracts/common.md#principled-implementation A closed discriminated union keeps successful evidence and refusal/absence causes separate without manufacturing a palette for missing observations.
 * @evidence contracts/common.md#clear-and-simple-design The classifier owns status selection; callers switch on the discriminant instead of interpreting one ambiguous nullable evidence value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No branch represents a silently accepted unsupported or foreign observation, and a reason string is explanation rather than prose certification.
 * @evidence contracts/common.md#meaningful-documentation Documents which statuses retain evidence and why incomplete preview differs from final admission; evidence references stay borrowed from the observation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased union chooses no runtime algorithm; verification and classification perform the actual schema/hash/coverage work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No work is stored or coordinated by the union; producing the same status does not establish equivalent observation bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource. Producer and consumer retention controls referenced evidence/reason lifetimes, without an independent population cap.
 */
export type AutoMovieProductionSemanticMaskStatus = {

    /** Discriminant preserving admission success, absence or the specific refusal cause. */
    status: "complete";

    /** Atomic palette and coverage observation supplied by the capture or resident sidecar owner. */
    evidence: IAutoMovieProductionSemanticMaskEvidence;
} | {

    /** Discriminant preserving admission success, absence or the specific refusal cause. */
    status: "incomplete";

    /** Atomic palette and coverage observation supplied by the capture or resident sidecar owner. */
    evidence: IAutoMovieProductionSemanticMaskEvidence;

    /** Original absence or refusal explanation; non-blank checks do not grade its prose. */
    reason: string;
} | {

    /** Discriminant preserving admission success, absence or the specific refusal cause. */
    status: "not-run" | "unsupported" | "foreign" | "invalid";

    /** Original absence or refusal explanation; non-blank checks do not grade its prose. */
    reason: string;
};
