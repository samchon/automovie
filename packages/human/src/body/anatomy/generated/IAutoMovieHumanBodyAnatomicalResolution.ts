import type { IAutoMovieHumanBodyAnatomicalResolved } from "./IAutoMovieHumanBodyAnatomicalResolved";
import type { IAutoMovieHumanBodyAnatomicalUnavailable } from "./IAutoMovieHumanBodyAnatomicalUnavailable";

/**
 * The result of trying to generate a named anatomical component.
 *
 * The current connected exterior skin is insufficient to infer an individual
 * bone, muscle or fat boundary. A caller must therefore distinguish a
 * generated and independently evaluated part from an unavailable one. A
 * population prediction declares its observed age, stature and body-mass
 * range and leave-subject-out geometric error; an output cannot silently
 * extrapolate beyond that domain or turn a study mean into a person's fact.
 * A direct imaged scalar can condition generation but does not itself validate
 * the generated 3D surface. Validation is attached to the generator revision,
 * including the posture in which its surface error was measured. Runtime
 * admission must refuse nonfinite errors or an empty cohort/revision.
 * @evidence contracts/common.md#principled-implementation Resolution is a closed union of a validated value or a named refusal, so a caller cannot read an unvalidated part as resolved.
 * @evidence contracts/common.md#clear-and-simple-design Two named branches, each its own record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No branch admits a value without validation or a refusal without a reason.
 * @evidence contracts/common.md#meaningful-documentation States what validation means and what a population prediction must declare.
 * @evidence contracts/modeling.md#part-identity-and-grouping Both branches carry the exact part or skin id.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The value type owns geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The value and validation types own units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers display it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The validation record owns the source statement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Generators own admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is generated output, not an authoring input.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalResolution<Id extends string, Value> =
  | IAutoMovieHumanBodyAnatomicalResolved<Id, Value>
  | IAutoMovieHumanBodyAnatomicalUnavailable<Id>;
