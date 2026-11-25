import type {
  IAutoMovieRecoveryMapMetric,
  IAutoMovieSimplexAtom,
} from "../../index";

/** One fixed arrowhead factor with an explicit pre-return whitening preflight. */
export interface IAutoMovieRecoveryMapTriangularMetric extends IAutoMovieRecoveryMapMetric {
  /** Preflight one fixed inverse-transpose row before choosing the model metric. */
  tryWhiten: (row: IAutoMovieSimplexAtom) => IAutoMovieSimplexAtom | null;
}
