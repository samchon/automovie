import type { IAutoMovieViewAxis } from "../construction/IAutoMovieViewAxis";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanSectionSite } from "./IAutoMovieHumanSectionSite";
import type { IAutoMovieHumanSectionSource } from "./IAutoMovieHumanSectionSource";

/**
 * Bone/share-addressed site inputs and their authoritative pre-loft course
 * mapping. Runtime construction and admission remain with
 * AutoMovieHumanWalkPart in Human.
 */
export namespace IAutoMovieHumanWalkPart {
  /** The identical pre-loft declaration and its authoritative course mapping. */
  export interface ISource {
    /** Actual input later consumed by SiteViewPart.create, calibration mm. */
    input: IAutoMovieHumanSectionSource;
    /** Straight-run bounds computed from the canonical metre axis. */
    runs: readonly IAutoMovieViewAxis.IRun[];
    /** Actual source station of a bone/share; no second axis is constructed. */
    station: (bone: number, share: number) => number;
  }

  /** One site on a bone. */
  export interface ISite {
    /** The measurement site, named in diagnostics. */
    site: string;

    /** The bone, 0 the first (proximal). */
    bone: number;

    /** Share of that bone from its proximal centre, in `[0, 1]`. */
    share: number;

    /**
     * The box's edges `[+u, +v, -u, -v]` relative to the axis, mm
     * (`AutoMovieHumanSiteViewPart.ISite.edges`).
     */
    edges: [number, number, number, number];

    /** A tape solved on the site's box, or a sourced shoulder. */
    fullness: IAutoMovieHumanSectionSite["fullness"];
    /** Optional normalized-parameter edge jets, in the same chart as edges. */
    jets?: IAutoMovieHumanSectionSite["jets"];
  }

  /** What a walk part is built from. */
  export interface IInput {
    /** Chain name. */
    name: string;

    /** The joint centres, proximal first, at least two (one bone). */
    centres: AutoMovieVector3Tuple[];

    /**
     * Each interior joint's turn half arclength, mm; distinct from its bend
     * radius.
     */
    joints: {
      /** Half of the joint's physical C2 turning window, millimetres. */
      half: number;
    }[];

    /**
     * The chart's `u` on the first bone (dorsal on a digit, anterior on a
     * limb).
     */
    u: AutoMovieVector3Tuple;

    /** The sites, by rising place along the walk. */
    sites: ISite[];
    /**
     * Optional scalar closed-span bounds in the caller's chart; these impose no
     * moving world-plane constraint.
     */
    ranges?: IAutoMovieHumanSectionSource["ranges"];

    /**
     * Optional material-frame transition between actual bone/share positions;
     * signed up is projected into the endpoint's normal plane by the engine.
     */
    roll?: {
      /**
       * Proximal endpoint of this declared roll interval, addressed by bone and
       * share.
       */
      from: {
        /** Zero-based segment index in the proximal-to-distal centre chain. */
        bone: number;
        /** Fraction along the selected bone measured from its proximal centre. */
        share: number;
      };
      /**
       * Distal endpoint of this declared roll interval, addressed by bone and
       * share.
       */
      to: {
        /** Zero-based segment index in the proximal-to-distal centre chain. */
        bone: number;
        /** Fraction along the selected bone measured from its proximal centre. */
        share: number;
      };
      /**
       * Target material-frame direction at the distal endpoint, projected into
       * its normal plane.
       */
      up: AutoMovieVector3Tuple;
    };

    /**
     * Whether the walk closes at its first centre in a G2 dome: the base of a
     * part whose inner end lies inside its host (a limb in the trunk, a digit
     * in the palm), so its station lines start inside the host at every phase
     * and leave it once, as the merge's trace needs. No site may stand at the
     * first centre then. Absent, the base is an open section.
     */
    base?: boolean;

    /**
     * The tip's distance past the last centre, mm (zero closes at the last
     * centre itself), where the walk closes in a dome; absent, the distal end
     * is open.
     */
    tip?: number;

    /** Control points of every section, a multiple of 4. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }
}
