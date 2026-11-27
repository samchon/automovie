import type { AutoMovieArchetypeQuadrupedEars } from "../AutoMovieArchetypeQuadrupedEars";
import type { QuadrupedJaw } from "./QuadrupedJaw";
import type { QuadrupedLip } from "./QuadrupedLip";
import type { QuadrupedNostrils } from "./QuadrupedNostrils";

/**
 * The proportions a quadruped body (`AutoMovieArchetypeQuadrupedBody.IBody`)
 * states per limb and per segment: bone lengths as fractions of withers height,
 * standing directions in degrees, mass shares in percent of body mass, and the
 * neck, head and tail as fractions of withers height.
 */
export namespace QuadrupedProportions {
  /**
   * Four values down a limb, from its top bone to its digit; the record that
   * uses it states the unit.
   */
  export type LimbValues = readonly [number, number, number, number];

  /**
   * Bone lengths as fractions of withers height: each limb's four from the top
   * down, and the trunk's span.
   */
  export interface ILengths {
    /** A fore limb's bones. */
    fore: LimbValues;

    /** A hind limb's bones. */
    hind: LimbValues;

    /** The trunk's span from shoulder to hip. */
    trunk: number;
  }

  /**
   * Each limb bone's standing direction, degrees from straight down toward the
   * front, from the top of each limb down.
   */
  export interface IStance {
    /** A fore limb's bones. */
    fore: LimbValues;

    /** A hind limb's bones. */
    hind: LimbValues;
  }

  /**
   * Mass shares, percent of body mass as a study prints them, for the trunk,
   * the neck, the head, the tail and each limb's four bones.
   */
  export interface IMassShares {
    /** The trunk's share. */
    trunk: number;

    /** The neck's share. */
    neck: number;

    /** The head's share. */
    head: number;

    /** The tail's share. */
    tail: number;

    /** A fore limb's bones, from the top down. */
    fore: LimbValues;

    /** A hind limb's bones, from the top down. */
    hind: LimbValues;
  }

  /**
   * The mass shares of a body, with the withers' ball's share, which a species
   * without a separate withers part sets to 0.
   */
  export interface IBodyMass extends IMassShares {
    /** The withers' ball's share. */
    withers: number;
  }

  /** The neck, fractions of the height at the withers. */
  export interface INeck {
    /** The neck's root below the back. */
    root: number;

    /** The neck bar's radius. */
    radius: number;
  }

  /** The poll's place, fractions of the height at the withers. */
  export interface IPoll {
    /** Above the back. */
    rise: number;

    /** Ahead of the shoulder joints. */
    ahead: number;
  }

  /** The nose's place, fractions of the height at the withers. */
  export interface INose {
    /** Below the poll. */
    drop: number;

    /** Ahead of the poll. */
    ahead: number;
  }

  /**
   * The head, fractions of the height at the withers, with its optional
   * authored parts.
   */
  export interface IHead {
    /** The poll above the back and ahead of the shoulder joints. */
    poll: Readonly<IPoll>;

    /** The nose below and ahead of the poll. */
    nose: Readonly<INose>;

    /** The head bar's radius. */
    radius: number;

    /** The mouth's corners above and behind the nose. */
    mouth: number;

    /**
     * Optional explicit reference pinnae and authored coarse plate
     * construction.
     */
    ears?: AutoMovieArchetypeQuadrupedEars.IProfile;

    /** Optional authored coarse jaw inside the head capsule (`QuadrupedJaw`). */
    jaw?: QuadrupedJaw.IProfile;

    /**
     * Optional authored coarse upper lip inside the head capsule
     * (`QuadrupedLip`).
     */
    lip?: QuadrupedLip.IProfile;

    /**
     * Optional authored coarse nostrils inside the head capsule
     * (`QuadrupedNostrils`).
     */
    nostrils?: QuadrupedNostrils.IProfile;
  }

  /**
   * The tail: its bar's radius and its tip below and behind its root, fractions
   * of the height at the withers, and its root up and back from the
   * hindquarters' rounded end's centre, a fraction of the barrel's radius.
   */
  export interface ITail {
    /** The tail bar's radius. */
    radius: number;

    /** The tip below the root. */
    drop: number;

    /** The tip behind the root. */
    back: number;

    /**
     * The root up and back from the hindquarters' rounded end's centre, a
     * fraction of the barrel's radius.
     */
    dock: number;
  }

  /** The body's display colours, as CSS colour strings. */
  export interface IColors {
    /** The coat's colour. */
    coat: string;

    /** The tail's colour. */
    tail: string;
  }
}
