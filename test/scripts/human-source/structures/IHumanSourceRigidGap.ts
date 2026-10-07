import type { IHumanSourceGenerationGap } from "./IHumanSourceGenerationGap.ts";
import type { IHumanSourceLoss } from "./IHumanSourceLoss.ts";

/**
 * A rigid part's unresolved motion against the skin it sits in: the named gap
 * with its owners, and one loss per reported body endpoint.
 *
 * @author Samchon
 */
export interface IHumanSourceRigidGap {
  /** The gap recorded on the generation. */
  gap: IHumanSourceGenerationGap;

  /** The same sizes as reproduction losses. */
  losses: IHumanSourceLoss[];
}
