import type { IAutoMovieHumanBodyAnatomicalInspection } from "../generated/IAutoMovieHumanBodyAnatomicalInspection";

/**
 * Inputs of `createHumanBodyArticularCandidateModel`.
 *
 * `id` and `name` label the produced static model; `inspection` is the
 * generated report whose candidates become its spheres. The report is read
 * only and no whole body skin is substituted for its unavailable outputs.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularCandidateModelProps {
  /** Identity of the produced static model. */
  id: string;

  /** Display name of the produced static model. */
  name: string;

  /** Generated inspection report whose candidates become the spheres. */
  inspection: IAutoMovieHumanBodyAnatomicalInspection;
}
