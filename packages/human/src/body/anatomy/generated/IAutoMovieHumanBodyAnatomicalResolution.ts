import type { IAutoMovieHumanBodyAnatomicalResolved } from "./IAutoMovieHumanBodyAnatomicalResolved";
import type { IAutoMovieHumanBodyAnatomicalUnavailable } from "./IAutoMovieHumanBodyAnatomicalUnavailable";

/**
 * The result of trying to generate a named anatomical component.
 *
 * The current connected exterior skin is insufficient to infer an individual bone, muscle or fat boundary. A caller must therefore distinguish a generated and independently evaluated part from an unavailable one. A population prediction declares its observed age, stature and body-mass range and leave-subject-out geometric error; an output cannot silently extrapolate beyond that domain or turn a study mean into a person's fact. A direct imaged scalar can condition generation but does not itself validate the generated 3D surface. Validation is attached to the generator revision, including the posture in which its surface error was measured. Runtime admission must refuse nonfinite errors or an empty cohort/revision.
 *
 * @evidence contracts/common.md#principled-implementation Resolved/unavailable discrimination separates independently evaluated geometry from named inability to generate a component.
 * @evidence contracts/common.md#clear-and-simple-design Generic identity/value preserve component data while shared alternatives own validation or failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Imaged scalars/connected skin cannot certify 3D parts, and population output cannot silently extrapolate validated domains.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies held-out errors, cohort/domain/posture/revision and nonfinite/empty validation refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Resolution alternatives run no part generator or cohort-evaluation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Result classification coordinates no generator completion cache or repeated requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generic resolution type creates no geometry lease or active validation resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalResolution<Id extends string, Value> =
  | IAutoMovieHumanBodyAnatomicalResolved<Id, Value>
  | IAutoMovieHumanBodyAnatomicalUnavailable<Id>;
