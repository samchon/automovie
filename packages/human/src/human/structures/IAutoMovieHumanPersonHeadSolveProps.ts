import type { IAutoMovieHumanPersonCompiledGeneration } from "./IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";

/**
 * Inputs of `solveHumanPersonHead`: the compiled generation, the person, a
 * target in metres for every head measurement the solve meets and, optionally,
 * for each it pursues second.
 *
 * @evidence contracts/common.md#principled-implementation The solve reads the same compiled generation and document as every person measurement.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or extra target refuses by name.
 * @evidence contracts/common.md#meaningful-documentation States what each field is and its unit.
 * @evidence contracts/modeling.md#spatial-conventions Targets are metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels The props name no channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed; the solved person is observed on the viewer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rules cite their definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range Targets are reported against the rules' source ranges, not bounded by them.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The targets are measurements the solve converts into channels; the solve owns that conversion.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSolveProps {
  /** The person's compiled generation, whose head view declares the rules' points and areas. */
  compiled: IAutoMovieHumanPersonCompiledGeneration;

  /** The person to solve; the solve sets its head channels and keeps every other value. */
  document: IAutoMovieHumanPersonDocument;

  /** Target in metres per met measurement of `HUMAN_PERSON_HEAD_SOLVE`, and optionally per secondary one. */
  targets: Record<string, number>;
}
