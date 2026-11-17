import type { IAutoMovieHumanMouthPrior } from "./IAutoMovieHumanMouthPrior";

/** One placed tooth in the registered figure frame. `neck` is a millimetre
 * position; `axis`, `along` and `out` are dimensionless unit directions in
 * that same frame. The producer establishes their geometric validity.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One placed tooth.
 * @evidence contracts/development/design.md#principled-representation `name`: Part name: `upper|lower.left|right.<tooth>`. `crown`: Crown's dimensions. `jaw`: Jaw that carries it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanMouthArch.place. Also types AutoMovieHumanMouth.teeth, AutoMovieHumanMouth.canine.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `crown`, `jaw`, `neck`, `axis`, `along`, `out`; callers supply the complete record.
 */
export interface IAutoMovieHumanToothPlacement {
  /** Part name: `upper|lower.left|right.<tooth>`. */
  name: string;

  /** Crown's dimensions. */
  crown: IAutoMovieHumanMouthPrior.ITooth;

  /** Jaw that carries it. */
  jaw: "upper" | "lower";

  /** Crown's centre at its cervical line, mm. */
  neck: [number, number, number];

  /** Unit direction from the cervical line to the incisal edge or cusps. */
  axis: [number, number, number];

  /** Unit direction along the arch, away from the midline. */
  along: [number, number, number];

  /** Unit direction across the arch, outward (labial or buccal). */
  out: [number, number, number];
}
