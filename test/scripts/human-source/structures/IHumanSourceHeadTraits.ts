import type { IAutoMovieHumanPersonHeadShapeFieldSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeFieldSource";

/** Current-root sparse head traits consumed by the main generation assembler.
 * Joint witnesses stay in the same public-frame landmark address space.
 * @author Samchon
 */
export interface IHumanSourceHeadTraits {
  fields: IAutoMovieHumanPersonHeadShapeFieldSource[];
  targets: Record<string, number[]>;
  jointTargets: Record<string, number[]>;
}
