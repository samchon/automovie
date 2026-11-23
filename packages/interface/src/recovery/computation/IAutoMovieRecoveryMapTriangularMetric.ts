import type {
  IAutoMovieRecoveryMapMetric,
  IAutoMovieSimplexAtom,
} from "../../index";

/** One fixed arrowhead factor with an explicit pre-return whitening preflight.
 *
 * @evidence contracts/development/design.md#principled-representation The same point-first triangular factor supplies inverse-transpose covectors, inverse steps and transpose covectors. Nullable whitening exposes arithmetic absence only while the owning model can still choose its complete metric.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The formation owner uses tryWhiten on every fixed row before transferring the ordinary metric actions; generic direction work never selects a new metric.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caught action error, mixed-factor rows, late fallback, inverse matrix or pivot floor supplies support. Ordinary actions continue throwing on nonrepresentable output.
 * @evidence contracts/development/common.md#meaningful-documentation Nullable preflight is finite arithmetic support for one row, not a universal future-vector certificate, independent data rank or intended-Hessian accuracy claim.
 */
export interface IAutoMovieRecoveryMapTriangularMetric extends IAutoMovieRecoveryMapMetric {
  /** Preflight one fixed inverse-transpose row before choosing the model metric.
   */
  tryWhiten: (row: IAutoMovieSimplexAtom) => IAutoMovieSimplexAtom | null;
}
