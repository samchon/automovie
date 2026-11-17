import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandAttachment } from "../hand/IAutoMovieHumanHandAttachment";
import type { IAutoMovieHumanSiteViewPart } from "./IAutoMovieHumanSiteViewPart";

/** Type contracts exchanged by AutoMovieHumanDigitWalk; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanDigitWalk {
  /** What a digit is built from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a digit is built from.
   * @evidence contracts/development/design.md#principled-representation `name`: Chain name, such as `finger.left.index` or `toe.left.1`. `centres`: The joint centres from the base (the knuckle, inside the host) to the distal phalanx's end: base, then each interphalangeal joint, then the end, at least three. `dorsal`: The dorsal direction on the first phalanx.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanDigitInterim.finger, AutoMovieHumanDigitInterim.walk. Read by AutoMovieHumanHandAttachment.attach, AutoMovieHumanDigitWalk.create, AutoMovieHumanDigitWalk.define. Also types AutoMovieHumanArmSources.branch, AutoMovieHumanArmSources.digit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `ranges`: Optional closed-span scalar bounds in this digit's material chart. `attachment`: Whole actual parent owner and declared local contact/material transfer.
   */
  export interface IInput {
    /** Chain name, such as `finger.left.index` or `toe.left.1`. */
    name: string;

    /** The joint centres from the base (the knuckle, inside the host) to the distal phalanx's end: base, then each interphalangeal joint, then the end, at least three. */
    centres: AutoMovieVector3Tuple[];

    /** The dorsal direction on the first phalanx. */
    dorsal: AutoMovieVector3Tuple;

    /** The pulp's reach past the distal phalanx's end to the tip, mm. */
    tip: number;
    /** Optional closed-span scalar bounds in this digit's material chart. */
    ranges?: IAutoMovieHumanSiteViewPart.IInput["ranges"];

    /** The laws at a site: `base`, `joint <k>` (k from 1, the first joint after the base), `shaft <k>` (the middle of bone k from 0), `end`. */
    law(site: string): ISiteLaw;

    /** Control points and ring phases of each section, a multiple of 4. */
    order: number;

    /** Widest spacing between layers, mm. */
    gap: number;
    /** Whole actual parent owner and declared local contact/material transfer. */
    attachment?: IAutoMovieHumanHandAttachment.IConnection;
  }

  /** A digit's laws at one site.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A digit's laws at one site.
   * @evidence contracts/development/design.md#principled-representation `breadth`: Whole breadth across the digit, mm. `depth`: Whole depth from the dorsal to the palmar or plantar skin, mm. `dorsal`: The dorsal share of the depth above the bone's axis, in `(0, 1)`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitInterim.walk, AutoMovieHumanDigitWalk.bendRadius. Also types AutoMovieHumanFootToeSources.law, AutoMovieHumanFootToeSources.near.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `shoulders`: Actual parent-derived quarter fullness in this digit's engine material frame. `shoulderJets`: Available quarter jets in the same normalized source clock; a held parent section declares its constant pullback explicitly. `jets`: Optional original edge jets in the digit's normalized source parameter.
   */
  export interface ISiteLaw {
    /** Whole breadth across the digit, mm. */
    breadth: number;

    /** Whole depth from the dorsal to the palmar or plantar skin, mm. */
    depth: number;

    /** The dorsal share of the depth above the bone's axis, in `(0, 1)`. */
    dorsal: number;

    /** The sourced conic shoulder of the section there. */
    shoulder: number;
    /** Actual parent-derived quarter fullness in this digit's engine material frame. */
    shoulders?: [number, number, number, number];
    /** Available quarter jets in the same normalized source clock; a held parent section declares its constant pullback explicitly. */
    shoulderJets?: IAutoMovieViewPart.IQuarters<
      IAutoMovieViewPart.IKnot["jet"]
    >;
    /** Optional original edge jets in the digit's normalized source parameter. */
    jets?: IAutoMovieHumanSiteViewPart.ISite["jets"];
  }
}
