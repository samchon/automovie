import type { IAutoMovieHumanF1Engineering } from "./IAutoMovieHumanF1Engineering";
import type { IAutoMovieHumanF1NativeLaw } from "./IAutoMovieHumanF1NativeLaw";
import type { IAutoMovieHumanF1SegmentLengths } from "./IAutoMovieHumanF1SegmentLengths";

/**
 * Public contracts for the anatomical field catalogue.
 */
export namespace IAutoMovieHumanF1FieldModel {
  /**
   * The primary working fields of one person, by reference to their owners' declarations.
   */
  export interface IPrimary {
    /** Joint-centre segment lengths, mm, which move the chain's joint centres, frames and course runs. */
    lengths: IAutoMovieHumanF1SegmentLengths.IFields;

    /** The hip joint centre breadth and the directional tissue calipers at the measurement sites, mm. */
    tissue: IAutoMovieHumanF1NativeLaw.IFields;
  }

  /**
   * A field's layer, from the skeleton outward.
   */
  export type Layer = "joint" | "length" | "frame" | "rest" | "bone" | "tissue" | "check";

  /**
   * What f1 can say about a field: measured by its definition, identifiable from f1's controls, or not separable on one person.
   */
  export type Identifiability = "measured" | "identifiable" | "unresolved";

  /**
   * A member of the typed working records a catalogue row documents.
   */
  export type Member =
    | `lengths.${keyof IAutoMovieHumanF1SegmentLengths.IFields}`
    | `tissue.${keyof IAutoMovieHumanF1NativeLaw.IFields}`
    | `checks.${keyof IAutoMovieHumanF1Engineering.IReading}`;

  /**
   * One working field or derived check.
   */
  export interface IField {
    /** The field's name, as its owner spells it. */
    name: string;
    /** Its layer. */
    layer: Layer;
    /** The members of `IPrimary` or `IChecks` that hold it; absent or empty while no typed record holds it. */
    members?: readonly Member[];
    /** Its unit. */
    unit: string;
    /** Its written definition and standard. */
    definition: string;
    /** The frame it is expressed in. */
    frame: string;
    /** The posture its value holds in. */
    posture: string;
    /** Where f1's value comes from. */
    source: string;
    /** What f1 can say about it. */
    identifiable: Identifiability;
    /** The f1 controls it drives, by owner and member. */
    drives: readonly string[];
    /** The module that applies it, its shared joint owner. */
    owner: string;
  }

  /**
   * One quantity the model needs and one person cannot give.
   */
  export interface IUnresolved {
    /** The quantity. */
    quantity: string;
    /** Why f1 alone cannot identify it. */
    reason: string;
    /** What would identify it: a measurement, a source or another person. */
    needs: string;
    /** The issue that receives it: #3187 the public parameter type, #3205 the cross-person campaign; absent while undecided. */
    to?: "#3187" | "#3205";
  }
}
