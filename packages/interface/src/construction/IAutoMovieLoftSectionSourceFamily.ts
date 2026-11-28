import type { IAutoMovieLoftViewRead } from "./IAutoMovieLoftViewRead";

/**
 * Complete native scalar or periodic basis endpoint jet already oriented into
 * the receiving station and phase chart. The native variant supplies four
 * extent jets and four shoulder jets. The basis variant supplies the order and
 * three complete coefficient rows. Use SectionSource.bind to associate the
 * family and its independent snapshot with a layer.
 */
export type IAutoMovieLoftSectionSourceFamily =
  | {
      /**
       * Selects the complete native scalar family already oriented into the
       * receiving layer's station/phase chart.
       */
      kind: "native";

      /**
       * Four extent and four shoulder jets in cyclic +u,+v,-u,-v order, each
       * [value, first physical-station derivative, second physical-station
       * derivative]. Extent units are mm, mm/mm, 1/mm; shoulder units are
       * unitless, 1/mm, 1/mm². bind requires dense finite triples, positive
       * extent values and shoulder values strictly between zero and one. These
       * triples are scalar jets, not spatial vectors.
       */
      inputs: IAutoMovieLoftViewRead.IJets;
    }
  | {
      /**
       * Selects a complete periodic spline family already oriented into the
       * receiving layer's station/phase chart.
       */
      kind: "basis";

      /**
       * Positive integer basis order; each of the three coefficient rows must
       * have exactly twice this many dense finite entries.
       */
      order: number;

      /**
       * Basis value, first physical-station derivative and second
       * physical-station derivative rows, in mm, mm/mm and 1/mm. Every row
       * holds order local-u controls followed by order local-v controls. bind
       * copies these arrays independently into field and snapshot; retained
       * copies must remain unchanged.
       */
      rows: readonly [number[], number[], number[]];
    };
