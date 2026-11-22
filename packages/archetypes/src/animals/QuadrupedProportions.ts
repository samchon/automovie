/**
 * The proportions a quadruped body (`AutoMovieArchetypeQuadrupedBody.IBody`) states per limb and per segment: bone lengths as fractions of withers height, standing directions in degrees, and mass shares in percent of body mass.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each record's unit and the limb order.
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
}
