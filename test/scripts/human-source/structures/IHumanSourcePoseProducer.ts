import type { IBodyCorrectiveState } from "../../body-basis/IBodyCorrectiveState.ts";

/**
 * The parameters of the pose corrective producer: the published correctives
 * it replaces and the states it re-solves.
 *
 * @author Samchon
 */
export interface IHumanSourcePoseProducer {
  /** Field revision name the regenerated correctives carry. */
  revision: string;

  /** Published corrective ids the re-solve replaces. */
  dropped: string[];

  /** States solved in order; the merge publishes each sided result's mirror. */
  states: IBodyCorrectiveState[];
}
