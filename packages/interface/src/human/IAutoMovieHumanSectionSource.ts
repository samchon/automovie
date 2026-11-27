import type { IAutoMovieConstructionAxis } from "../construction/IAutoMovieConstructionAxis";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanSectionSite } from "./IAutoMovieHumanSectionSite";

/** What a part is built from. */
export interface IAutoMovieHumanSectionSource {
  /** Chain name of the part. */
  name: string;

  /**
   * The part's axis as the construction tree's record, metres; the operator's
   * frame is the engine's own reading of it
   * (`AutoMovieConstructionViews.frame`), so the part lofted here is the part
   * the tree realizes.
   */
  axis: IAutoMovieConstructionAxis;

  /** The sites by strictly rising station, at least two besides a pole. */
  sites: IAutoMovieHumanSectionSite[];

  /**
   * Closing points where every edge meets the axis, below the first site
   * (`bottom`), above the last (`top`), or both. The shared root/angle
   * parameter owns endpoint regularity; a closing point alone does not certify
   * a final G2 surface. Absent, both ends are open sections.
   */
  pole?:
    | {
        /**
         * Discriminant selecting the lower end, upper end, or both ends of the
         * source axis.
         */
        end: "bottom" | "top";
        /** Physical station along this part's declared source axis, millimetres. */
        station: number;
      }
    | {
        /**
         * Discriminant selecting the lower end, upper end, or both ends of the
         * source axis.
         */
        end: "both";
        /** Lower pole station along the physical source axis, millimetres. */
        bottom: number;
        /** Upper pole station along the physical source axis, millimetres. */
        top: number;
      };

  /**
   * Optional closing-knot jets, in the whole source's normalized root/angle
   * parameter and edge-value units. A physical station derivative at a pole
   * remains singular.
   */
  poleJets?: {
    /**
     * Optional jets at the lower pole, in the whole source's normalized
     * parameter and the parent scalar's units.
     */
    bottom?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
    /**
     * Optional jets at the upper pole, in the whole source's normalized
     * parameter and the parent scalar's units.
     */
    top?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
  };

  /**
   * Optional direct-fullness jets at the same physical end knots; normalization
   * uses the fullness outline's whole station span.
   */
  fullnessPoleJets?: {
    /**
     * Optional jets at the lower pole, in the whole source's normalized
     * parameter and the parent scalar's units.
     */
    bottom?: IAutoMovieViewPart.IKnot["jet"];
    /**
     * Optional jets at the upper pole, in the whole source's normalized
     * parameter and the parent scalar's units.
     */
    top?: IAutoMovieViewPart.IKnot["jet"];
  };

  /**
   * Sourced departures of each quarter's shoulder, knots by station; absent
   * means none.
   */
  departures?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;

  /**
   * Optional sufficient native-shoulder hull, authored before any connection
   * copies its actual C2 jets. Values and genuine prescribed jets are retained
   * or refused, never clamped.
   */
  fullnessRange?: IAutoMovieViewPart.IOutline["range"];

  /**
   * Optional sufficient scalar bounds for the four closed edge spans; these do
   * not impose a moving world-plane constraint.
   */
  ranges?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline["range"]>;

  /**
   * Explicit original scalar coordinate shared by a local region and its host;
   * closure remains separately declared by pole.
   */
  parameter?: IAutoMovieViewPart.IOutline["parameter"];

  /** Control points of every section, a multiple of 4. */
  order: number;

  /** Uniform phases of the chain's rings. */
  samples: number;

  /** Widest spacing between layers, mm. */
  gap: number;
}
