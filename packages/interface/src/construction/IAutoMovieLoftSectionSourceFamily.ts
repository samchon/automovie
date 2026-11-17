import type { IAutoMovieLoftViewRead } from "./IAutoMovieLoftViewRead";

/**
 * Complete endpoint generating data after orientation into the receiving station/phase chart.
 *
 * AutoMovieLoftSectionSource.bind admits this family, clones it into independent field and snapshot records, and binds both to the receiving layer's actual coefficient rows. endpoint later refuses a changed or malformed family rather than treating it as absent legacy geometry. Native inputs retain their scalar physical-station jets; basis rows retain all coefficients through station order two.
 *
 * @evidence contracts/development/design.md#principled-representation The discriminator selects the actual native scalar family or complete basis coefficient jets, so neither representation is inferred from a few sampled endpoint positions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One family supplies endpoint geometry and its independently copied validation snapshot to both adjoining field readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing physical derivatives do not become zeros, and a present stale family throws instead of selecting legacy geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Defines family selection, derivative row order, copy ownership and the binding/validation lifecycle.
 */
export type IAutoMovieLoftSectionSourceFamily =
  | {
      /** Selects the complete native scalar family already oriented into the receiving layer's station/phase chart. */
      kind: "native";

      /** Four extent and four shoulder jets in cyclic +u,+v,-u,-v order, each [value, first physical-station derivative, second physical-station derivative]. Extent units are mm, mm/mm, 1/mm; shoulder units are unitless, 1/mm, 1/mm². bind requires dense finite triples, positive extent values and shoulder values strictly between zero and one. These triples are scalar jets, not spatial vectors. */
      inputs: IAutoMovieLoftViewRead.IJets;
    }
  | {
      /** Selects a complete periodic spline family already oriented into the receiving layer's station/phase chart. */
      kind: "basis";

      /** Positive integer basis order; each of the three coefficient rows must have exactly twice this many dense finite entries. */
      order: number;

      /** Basis value, first physical-station derivative and second physical-station derivative rows, in mm, mm/mm and 1/mm. Every row holds order local-u controls followed by order local-v controls. bind copies these arrays independently into field and snapshot; retained copies must remain unchanged. */
      rows: readonly [number[], number[], number[]];
    };
