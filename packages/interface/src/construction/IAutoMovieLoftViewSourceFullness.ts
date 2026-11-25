import type { AutoMovieLoftViewSourceOutlines } from "./AutoMovieLoftViewSourceOutlines";
import type { AutoMovieLoftViewSourceSplit } from "./AutoMovieLoftViewSourceSplit";
import type { IAutoMovieViewOutline } from "./IAutoMovieViewOutline";

/**
 * Prepared direct fullness ownership for an original view-generated section.
 *
 * AutoMovieLoftViewSource.create admits each scalar outline independently and
 * publishes this union only when the direct shoulder or top declaration is
 * complete. Generic girth has no variant: that factory returns null to leave
 * the existing girth path in charge. Prepared curves must remain unchanged
 * while station readers reuse them. Length-valued touch and split coordinates
 * use the declared pole coordinate; angles and shoulder shares retain their own
 * scalar parameterization.
 */
export type IAutoMovieLoftViewSourceFullness =
  | {
      /**
       * Selects one direct common shoulder law plus optional quarter
       * departures.
       */
      kind: "shoulder";

      /**
       * Prepared dimensionless conic shoulder-share law used by all four
       * quarters before their declared departures.
       */
      owner: IAutoMovieViewOutline.IOutline;

      /**
       * Prepared dimensionless shoulder departures in cyclic +u/+v/-u/-v
       * quarter order, or null for four exact zero departures. Native reading
       * adds each departure to owner before applying the cap shoulder policy.
       */
      departures: AutoMovieLoftViewSourceOutlines | null;
    }
  | {
      /**
       * Selects four independently authored top-view shoulder laws and optional
       * contact/split coordinates.
       */
      kind: "top";

      /**
       * Four prepared dimensionless shoulder-share laws in increasing quarter
       * order; with splits or pieces, each law owns the quarter's first conic
       * piece.
       */
      shoulders: AutoMovieLoftViewSourceOutlines;

      /**
       * Prepared guide contact offsets in chart millimetres, in +u/+v/-u/-v
       * guide order; null retains each guide's axis-line convention.
       */
      touch: AutoMovieLoftViewSourceOutlines | null;

      /**
       * One admitted [u,v,tangent-angle,following-shoulder] preparation per
       * quarter, or null when no single split was declared; cannot coexist with
       * pieces.
       */
      splits:
        | readonly [
            AutoMovieLoftViewSourceSplit,
            AutoMovieLoftViewSourceSplit,
            AutoMovieLoftViewSourceSplit,
            AutoMovieLoftViewSourceSplit,
          ]
        | null;

      /**
       * Ordered admitted split-point preparations per quarter, or null when
       * absent; an empty quarter list means one conic and the four lists
       * preserve authored phase order.
       */
      pieces:
        | readonly [
            readonly AutoMovieLoftViewSourceSplit[],
            readonly AutoMovieLoftViewSourceSplit[],
            readonly AutoMovieLoftViewSourceSplit[],
            readonly AutoMovieLoftViewSourceSplit[],
          ]
        | null;
    };
