import type { IAutoMovieHumanFaceBasisCorrectiveInput } from "./IAutoMovieHumanFaceBasisCorrectiveInput";

/**
 * One combination corrective of a face basis: the driving sides whose product
 * activates it, its authored gain and the endpoint it applies
 * (`IAutoMovieHumanFaceBasis.correctives` explains the activation).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisCorrective {
  /** Name unique within this basis, distinct from every channel id. */
  id: string;

  /**
   * The driving sides. Each names a channel and which of its two endpoints
   * this corrective answers for, because a signed channel reaches two
   * different faces and a combination of one is not a combination of the
   * other.
   */
  inputs: IAutoMovieHumanFaceBasisCorrectiveInput[];

  /** Authored gain in (0,1]; the product of a rig row's authored weights. */
  weight: number;

  /** Endpoint name, resolved in each surface's targets like any other. */
  target: string;
}
