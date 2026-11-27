import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanSectionSite } from "./IAutoMovieHumanSectionSite";
import type { IAutoMovieHumanFootConnection } from "./IAutoMovieHumanFootConnection";

/**
 * Fixed-floor foot inputs, independent site laws, optional dorsal source and
 * original ankle contact.
 *
 * The interface package owns these declarations; AutoMovieHumanFootPart in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootPart {
  /** What a foot is built from. */
  export interface IInput {
    /** Chain name, `foot.left` or `foot.right`. */
    name: string;

    /** Pternion's plan point on the floor, `[x, 0, z]`, calibration mm. */
    heel: AutoMovieVector3Tuple;

    /**
     * The foot's long axis on the floor, unit and level (its y zero), from the
     * heel toward the toes.
     */
    along: AutoMovieVector3Tuple;

    /** The axis's height over the floor, mm. */
    height: number;

    /** Foot length, mm: pternion to the longest toe's tip. */
    length: number;

    /**
     * Where the heel's dome closes (a small share behind the first site) and
     * where the forefoot's does, as shares of the length.
     */
    poles: [number, number];

    /** The sites' laws, by rising share. */
    sites: {
      /**
       * Anatomical measurement-site identity, shared by the source law and its
       * diagnostic rows.
       */
      site: string;
      /**
       * Resolved site proportions and their physical section constraints for
       * this foot region.
       */
      law: ISiteLaw;
    }[];

    /**
     * Optional closed-span plantar bound, in calibration mm relative to the
     * fixed-height axis.
     */
    plantarRange?: IAutoMovieViewPart.IOutline["range"];

    /**
     * Public host-plus-toe metatarsal breadth and its foot-along interval; the
     * fifth endpoint remains a cascade-transfer convention.
     */
    metatarsal?: IInputMetatarsal;

    /** Whether the foot is the left (its lateral edge toward +Z) or the right. */
    side: "left" | "right";

    /** Control points and ring phases of every section, a multiple of 4. */
    order: number;

    /** Widest spacing between layers, mm. */
    gap: number;

    /**
     * Authored dorsal outline only; its independent knots never resample either
     * across outline.
     */
    dorsal?: IAutoMovieViewPart.IOutline;

    /**
     * Actual complete leg owner, its original frame and available jets at the
     * authored sagittal connection.
     */
    ankle?: IAutoMovieHumanFootConnection.IAnkle;
  }

  /** The metatarsal object of {@link IInput}. */
  export type IInputMetatarsal = {
    /** Fifth-to-first skin region along the foot axis, calibration mm. */
    span: [number, number];

    /** Public across support-plane distance, calibration mm. */
    breadth: number;

    /**
     * Bare host's independent regional across support maxima after the common
     * group scale, calibration mm; not one cut or the whole group's extrema.
     */
    supports: {
      /**
       * Lateral support magnitude of the bare host after the common group
       * scale, calibration millimetres.
       */
      lateral: number;
      /**
       * Medial support magnitude of the bare host after the common group
       * scale, calibration millimetres.
       */
      medial: number;
    };

    /** Calibration mm per retained dimensionless across observation. */
    transverseScale: number;
  };

  /** One site's law, calibration mm. */
  export interface ISiteLaw {
    /** Share of the foot's length from pternion, in `(0, 1)`. */
    share: number;

    /**
     * The box's edges from the axis: up (dorsal), lateral, down (plantar,
     * negative), medial (negative), on either foot.
     */
    edges: [number, number, number, number];

    /** A tape solved on the box, or a sourced shoulder. */
    fullness: IAutoMovieHumanSectionSite["fullness"];

    /**
     * Optional plantar tangent/curvature in the whole source's normalized
     * parameter; units are calibration mm.
     */
    plantarJet?: IAutoMovieViewPart.IKnot["jet"];
  }
}
