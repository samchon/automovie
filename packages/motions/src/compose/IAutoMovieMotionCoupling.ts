import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanContactWindow } from "../law/IHumanContactWindow";

/**
 * How one role of a meeting bears another (#3437): the borne role's
 * contacts on the bearer's regions, each with the share of the borne
 * weight it carries, and the borne mass with its centre, which the
 * bearer's balance takes in.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its meaning, frame and unit.
 * @evidence contracts/development/design.md#principled-representation A coupled contact is a part of one body on a region of the other with a load share, the support model of #3425 between two people; the carried mass and its centre are what the bearer's moment balance (#3431) reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two role names, the contacts, the borne mass and centre, and the borne body's key frame on the bearer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The frames are bearer bones' own (the anchor bone's), so the record is plain data that survives a move of the pair and keeps no body.
 */
export interface IAutoMovieMotionCoupling {
  /** The bearing role's name. */
  bearer: string;

  /** The borne role's name. */
  borne: string;

  /** The borne role's contacts on the bearer. */
  contacts: readonly IAutoMovieMotionCoupling.IContact[];

  /** The borne mass the bearer carries, kilograms. */
  mass: number;

  /** The borne centre of mass in the bearer's anchor frame, metres. */
  centre: IAutoMovieVector3;

  /**
   * The bearer's bone the key and the holds are stated in: the bone the
   * borne body's resting region lies on, so the borne body rides that bone.
   */
  anchor: AutoMovieHumanoidBone;

  /**
   * Each further bearer's anchor frame in the first bearer's anchor frame
   * at the key pose, by role, with that anchor bone: a borne body walked
   * between two helpers. None when one body bears alone.
   */
  bearers?: Readonly<
    Record<
      string,
      {
        position: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
        anchor: AutoMovieHumanoidBone;
      }
    >
  >;

  /** The borne body's root frame in the bearer's anchor frame at the coupling's key pose. */
  key: {
    /** Metres. */
    position: IAutoMovieVector3;

    /** Unit quaternion. */
    rotation: IAutoMovieQuaternion;
  };
}
/**
 * Companion types of {@link IAutoMovieMotionCoupling}.
 */
export namespace IAutoMovieMotionCoupling {
  /**
   * One contact of a borne body on its bearer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member gives its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A part and its region on one body, the other body's role and region it lies on, how it bears and its load share: a contact window between two people.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, the ones a borne law turns into its windows and a bearer into its holds.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The part and the kind are the contact window's own unions.
   */
  export interface IContact {
    /** The borne body's part. */
    part: IHumanContactWindow["part"];

    /** The borne body's region that touches. */
    region: AutoMovieHumanoidRegion;

    /** The bearer's role and region it lies on. */
    on: { role: string; region: AutoMovieHumanoidRegion };

    /** How it bears: on the bearer (`bear`), or a hold of the borne hand (`grip`). */
    kind: "bear" | "grip";

    /** The share of the borne weight it carries, in [0, 1]; a grip carries none. */
    load: number;
  }
}
