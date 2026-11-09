import type * as THREE from "three";

/**
 * What every prop offers the stage: identity, kind, mass for the handover
 * law, whether it is personal for the first-offer habit, and a displayed
 * figure whose form and fill the stage sets from the prop's state.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
 * @evidence contracts/development/design.md#principled-representation Mass in kilograms; kind and forms as closed strings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the stage laws, prop track and mount read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop is named here.
 */
export interface IStageProp {
  /** Stable id. */
  id: string;

  /** What it is. */
  kind:
    | "wand"
    | "paper-crane"
    | "tea-cup"
    | "invitation-note"
    | "broom"
    | "quaffle"
    | "bludger"
    | "snitch"
    | "beater-bat"
    | "falling-masonry"
    | "shield";

  /** Mass, kilograms. */
  mass: number;

  /** Something its owner wrote or made for someone, for the first-offer habit. */
  personal: boolean;

  /** Height of the prop's held point above its resting underside, metres. */
  rest: number;

  /** Build the displayed figure, owned by the caller. */
  figure(): IStageProp.IFigure;
}
export namespace IStageProp {
  /** A displayed prop. */
  export interface IFigure {
    /** Root object; the stage places it in world metres each instant, origin at the held point. */
    object: THREE.Group;

    /** Show a named form, such as a crane's `half`, `open` or `folded`. */
    form?(form: string): void;

    /** Show a fill share in [0, 1], such as the tea level. */
    level?(share: number): void;

    /** Release owned geometry and materials. */
    dispose(): void;
  }
}
