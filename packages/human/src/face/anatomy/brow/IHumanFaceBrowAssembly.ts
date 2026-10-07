import type { IAutoMovieModel } from "@automovie/interface";
import type { IHumanConstructionCheck } from "../../../common/basis/IHumanConstructionCheck";

/** Generated brow shafts plus exact resident card vertices they replace.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowAssembly extends Pick<IAutoMovieModel, "parts" | "materials"> {
  /** Original implantation checks on the same constructed shaft population. */
  checks: readonly IHumanConstructionCheck[];

  /** Per host surface, flat RGB gains per vertex that state the shafts' covered share of the band on the skin itself; one where no band lies. */
  tints: ReadonlyMap<string, readonly number[]>;

  /** Original surfaces and exact replacement populations, independent of names. */
  replacements: ReadonlyMap<string, ReadonlySet<number>>;
}
