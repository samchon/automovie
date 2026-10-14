import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyExteriorReference } from "./IAutoMovieHumanBodyExteriorReference";

/**
 * The immutable source pair an exterior target builder compiles once.
 *
 * `createHumanBodyExteriorTargetBuilder` clones both members, admits the reference exactly and refuses it unless `reference.basis` names this basis. Per-person requests arrive later as numerical documents, so neither member carries an individual's measurements.
 *
 * @evidence contracts/common.md#principled-implementation The source pair carries a compiled basis and exact-ID reference consumed by a builder that clones and admits their correspondence.
 * @evidence contracts/common.md#clear-and-simple-design Source compilation dependencies stay separate from later per-person numerical documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bare basis/reference pair neither supplies individual measurements nor bypasses exact reference-ID admission.
 * @evidence contracts/common.md#meaningful-documentation The prose states cloning, exact reference admission and the absence of per-person measurements from source inputs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Source-pair typing performs no basis compilation or anatomical target solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair supplies compilation dependencies; actual immutable-source reuse belongs to createHumanBodyExteriorTargetBuilder.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input carrier defines borrowed source values without acquiring the builder's cloned basis lifetime.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorTargetSource {
  /** Connected body basis whose builder and channel the instrument drives. */
  basis: IAutoMovieHumanBodyBasis;

  /** Exterior instrument bound to `basis` by its exact id. */
  reference: IAutoMovieHumanBodyExteriorReference;
}
