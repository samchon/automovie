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
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalResolution<Id extends string, Value> =
  | IAutoMovieHumanBodyAnatomicalResolved<Id, Value>
  | IAutoMovieHumanBodyAnatomicalUnavailable<Id>;
