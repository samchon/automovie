import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootSource } from "../foot/IAutoMovieHumanFootSource";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";

/**
 * Original parent/child contact coordinates and physical frame derivatives for proximal leg-source transfer.
 *
 * The interface package owns these declarations; AutoMovieHumanLegProximal in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original parent/child contact coordinates and physical frame derivatives for proximal leg-source transfer. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IContact, IParent, FrameJet, IResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IContact, IParent, FrameJet, IResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanLegProximal exchanges the named IContact, IParent, FrameJet, IResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanLegProximal {
  /** Actual parent/child coordinates and separately qualified transfer jets.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual parent/child coordinates and separately qualified transfer jets.
   * @evidence contracts/development/design.md#principled-representation `parent`: Definition consumed by this exact source transfer. `owner`: Complete original parent field, including fullness and parameter owners. `phase`: Original parent phase, radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegProximal.contact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `parent`, `owner`, `phase`, `point`, `station`, `outward`, `radius`, `parentFrame`, `childFrame`; callers supply the complete record.
   */
  export interface IContact {
    /** Definition consumed by this exact source transfer. */
    parent: IParent;
    /** Complete original parent field, including fullness and parameter owners. */
    owner: IAutoMovieHumanFootSource.ISource;
    /** Original parent phase, radians. */
    phase: number;
    /** Actual world contact, calibration mm. */
    point: AutoMovieVector3Tuple;
    /** Actual source station on the unchanged child course, mm. */
    station: number;
    /** Signed native v direction of the outward guide. */
    outward: 1 | -1;
    /** Positive ray radius and first/second derivatives in child station. */
    radius: [number, number, number];
    /** The available parent frame jets in its actual physical parameter. */
    parentFrame: FrameJet;
    /** The available child frame jets at the actual contact. */
    childFrame: FrameJet;
  }

  /** The identical parent definition and its authoritative named hip station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The identical parent definition and its authoritative named hip station.
   * @evidence contracts/development/design.md#principled-representation `definition`: Actual trial/final parent, not an independently reconstructed hip box. `station`: Named canonical parent station, calibration mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegProximal.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `definition`, `station`; callers supply the complete record.
   */
  export interface IParent {
    /** Actual trial/final parent, not an independently reconstructed hip box. */
    definition: IAutoMovieHumanSourceDefinition;
    /** Named canonical parent station, calibration mm. */
    station: number;
  }

  /** The actual public axis's separately available frame derivatives.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual public axis's separately available frame derivatives.
   * @evidence contracts/development/design.md#principled-representation The actual public axis's separately available frame derivatives. NonNullable< ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> > retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegProximal.childFrame, AutoMovieHumanLegProximal.parentFrame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegProximal.childFrame, AutoMovieHumanLegProximal.parentFrame for the actual public axis's separately available frame derivatives.
   */
  export type FrameJet = NonNullable<
    ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
  >;

  /** New proximal outward original, with its actual complete parent authority.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation New proximal outward original, with its actual complete parent authority.
   * @evidence contracts/development/design.md#principled-representation `outline`: Reauthored prefix; all named-thigh-and-later scalar spans replay unchanged. `contact`: Contact retained by both construction and independent source readers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegProximal.create. Also types AutoMovieHumanLegWalk.proximal.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `outline`, `contact`; callers supply the complete record.
   */
  export interface IResult {
    /** Reauthored prefix; all named-thigh-and-later scalar spans replay unchanged. */
    outline: IAutoMovieViewPart.IOutline;
    /** Contact retained by both construction and independent source readers. */
    contact: IContact;
  }
}
