import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootSource } from "../foot/IAutoMovieHumanFootSource";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";

/**
 * Original parent/child contact coordinates and physical frame derivatives for
 * proximal leg-source transfer.
 *
 * The interface package owns these declarations; AutoMovieHumanLegProximal in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegProximal {
  /** Actual parent/child coordinates and separately qualified transfer jets. */
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
    /** The selected native material line. `u` is AP and `v` is transverse. */
    axis: "u" | "v";
    /** Signed native direction on the selected material line. */
    outward: 1 | -1;
    /** Positive ray radius and first/second derivatives in child station. */
    radius: [number, number, number];
    /** The available parent frame jets in its actual physical parameter. */
    parentFrame: FrameJet;
    /** The available child frame jets at the actual contact. */
    childFrame: FrameJet;
  }

  /** The identical parent definition and its authoritative named hip station. */
  export interface IParent {
    /** Actual trial/final parent, not an independently reconstructed hip box. */
    definition: IAutoMovieHumanSourceDefinition;
    /** Named canonical parent station, calibration mm. */
    station: number;
  }

  /** The actual public axis's separately available frame derivatives. */
  export type FrameJet = NonNullable<
    ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
  >;

  /** New proximal material line, with its actual complete parent authority. */
  export interface IResult {
    /**
     * Reauthored prefix; all named-thigh-and-later scalar spans replay
     * unchanged.
     */
    outline: IAutoMovieViewPart.IOutline;
    /** Contact retained by both construction and independent source readers. */
    contact: IContact;
  }
}
