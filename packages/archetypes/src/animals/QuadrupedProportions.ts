import type { AutoMovieArchetypeQuadrupedEars } from "./AutoMovieArchetypeQuadrupedEars";
import type { QuadrupedJaw } from "./QuadrupedJaw";
import type { QuadrupedLip } from "./QuadrupedLip";
import type { QuadrupedNostrils } from "./QuadrupedNostrils";

/**
 * The proportions a quadruped body (`AutoMovieArchetypeQuadrupedBody.IBody`) states per limb and per segment: bone lengths as fractions of withers height, standing directions in degrees, mass shares in percent of body mass, and the neck, head and tail as fractions of withers height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each record's unit, reference points and the limb order.
 * @evidence contracts/development/design.md#principled-representation Each limb's four values from the top bone down, in the forms the anatomical studies report.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `AutoMovieArchetypeQuadrupedBody.IBody` and by each species' stated proportions, such as `createHorse.LENGTHS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A species without a separate withers part states its share as 0 instead of omitting it.
 */
export namespace QuadrupedProportions {
  /**
   * Four values down a limb, from its top bone to its digit; the record
   * that uses it states the unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order and where the unit is stated.
   * @evidence contracts/development/design.md#principled-representation A readonly four-tuple, so the type rules out a missing or extra bone; finiteness and range stay with the body's admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by ILengths, IStance and IMassShares for each limb.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One tuple for the one limb shape every quadruped here has.
   */
  export type LimbValues = readonly [number, number, number, number];

  /**
   * Bone lengths as fractions of withers height: each limb's four from the top down, and the trunk's span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the reference height and the limb order.
   * @evidence contracts/development/design.md#principled-representation Dimensionless fractions of withers height, so one record scales to any body size.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieArchetypeQuadrupedBody.IBody and stated by createHorse.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required; fore and hind limbs keep separate values.
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
   * Each limb bone's standing direction, degrees from straight down toward the front, from the top of each limb down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the reference direction, its sign and the limb order.
   * @evidence contracts/development/design.md#principled-representation Degrees in the sagittal plane, the form the anatomical studies report.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieArchetypeQuadrupedBody.IBody and stated by createHorse.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required; fore and hind limbs keep separate values.
   */
  export interface IStance {
    /** A fore limb's bones. */
    fore: LimbValues;

    /** A hind limb's bones. */
    hind: LimbValues;
  }

  /**
   * Mass shares, percent of body mass as a study prints them, for the trunk, the neck, the head, the tail and each limb's four bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, its reference and the parts covered.
   * @evidence contracts/development/design.md#principled-representation Percent of body mass, as the studies print them, so a stated value is the source's own.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Stated by createHorse and extended by IBodyMass for the body.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required; the type does not enforce that the shares sum to the whole body.
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
   * The mass shares of a body, with the withers' ball's share, which a species without a separate withers part sets to 0.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the added share and its zero case.
   * @evidence contracts/development/design.md#principled-representation The study's shares plus one percent share for the withers part.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieArchetypeQuadrupedBody.IBody.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The withers share is required and 0 when absent, instead of an optional member.
   */
  export interface IBodyMass extends IMassShares {
    /** The withers' ball's share. */
    withers: number;
  }

  /**
   * The neck, fractions of the height at the withers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation Two fractions of the withers height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `AutoMovieArchetypeQuadrupedBody.IBody.neck`, the rig and the neck bar.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface INeck {
    /** The neck's root below the back. */
    root: number;

    /** The neck bar's radius. */
    radius: number;
  }

  /**
   * The poll's place, fractions of the height at the withers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's reference point and unit.
   * @evidence contracts/development/design.md#principled-representation Two fractions of the withers height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `IHead.poll`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPoll {
    /** Above the back. */
    rise: number;

    /** Ahead of the shoulder joints. */
    ahead: number;
  }

  /**
   * The nose's place, fractions of the height at the withers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's reference point and unit.
   * @evidence contracts/development/design.md#principled-representation Two fractions of the withers height.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `IHead.nose`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface INose {
    /** Below the poll. */
    drop: number;

    /** Ahead of the poll. */
    ahead: number;
  }

  /**
   * The head, fractions of the height at the withers, with its optional authored parts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit, and which parts are optional.
   * @evidence contracts/development/design.md#principled-representation Fractions of the withers height for the capsule and each optional part's own profile.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `AutoMovieArchetypeQuadrupedBody.IBody.head` and `AutoMovieArchetypeQuadrupedHead`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent ear, jaw, lip or nostril profile lays no part instead of a default one.
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

    /** Optional explicit reference pinnae and authored coarse plate construction. */
    ears?: AutoMovieArchetypeQuadrupedEars.IProfile;

    /** Optional authored coarse jaw inside the head capsule (`QuadrupedJaw`). */
    jaw?: QuadrupedJaw.IProfile;

    /** Optional authored coarse upper lip inside the head capsule (`QuadrupedLip`). */
    lip?: QuadrupedLip.IProfile;

    /** Optional authored coarse nostrils inside the head capsule (`QuadrupedNostrils`). */
    nostrils?: QuadrupedNostrils.IProfile;
  }

  /**
   * The tail: its bar's radius and its tip below and behind its root, fractions of the height at the withers, and its root up and back from the hindquarters' rounded end's centre, a fraction of the barrel's radius.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's reference and unit.
   * @evidence contracts/development/design.md#principled-representation Three fractions of the withers height and one of the barrel's radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `AutoMovieArchetypeQuadrupedBody.IBody.tail` and the tail bar.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITail {
    /** The tail bar's radius. */
    radius: number;

    /** The tip below the root. */
    drop: number;

    /** The tip behind the root. */
    back: number;

    /** The root up and back from the hindquarters' rounded end's centre, a fraction of the barrel's radius. */
    dock: number;
  }

  /**
   * The body's display colours, as CSS colour strings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each colour paints.
   * @evidence contracts/development/design.md#principled-representation Two colour strings.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `AutoMovieArchetypeQuadrupedBody.IBody.colors` and the body's parts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No material or friction is inferred from a colour.
   */
  export interface IColors {
    /** The coat's colour. */
    coat: string;

    /** The tail's colour. */
    tail: string;
  }
}
