import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Eating and kitchen behaviours at a table: opening a refrigerator and looking at one of its shelves. The fixed refrigerator prop supplies the affordances fridgeHandle and shelf1 through shelf4; the performer stands with the handle in reach and a sightline to the chosen shelf after the door opens. Door opening is in degrees. No timing is defined by the family: the operate and look laws' own apply (provisional: no study of kitchen timings).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per composition of the Dining behaviour, each taking its own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The refrigerator composition and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Opening and shelf choice come from the scene; no hand path, pose or gaze offset is supplied.
 */
export interface IAutoMovieMotionHumanDining<Chain> {
  /**
   * Open a refrigerator's fresh-food door by its handle, let go and look at one of its shelves. The door stays at the resulting opening while the performer looks. It ends when the look on the shelf has been held.
   *
   * @param params The 
efrigerator, shelf, swing and hand of IAutoMovieMotionHumanDining.IInspectRefrigerator.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the handle operation followed by the shelf look appended.
   * @throws {HumanRefusal} When the additional opening is nonpositive or nonfinite.
   */
  inspectRefrigerator(
    params: IAutoMovieMotionHumanDining.IInspectRefrigerator,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Dining methods.
 */
export namespace IAutoMovieMotionHumanDining {
  /**
   * The parameters of `inspectRefrigerator`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and its default.
   * @evidence contracts/development/design.md#principled-representation A prop subject, a shelf number, an opening in degrees and a hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The four values the composition reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The opening and the shelf are the scene's; nothing is assumed.
   */
  export interface IInspectRefrigerator {
    /** The fixed refrigerator prop's subject. */
    refrigerator: string;

    /** Shelf number from the bottom of the refrigerator compartment. */
    shelf: IAutoMovieMotionHumanDining.Shelf;

    /** Additional opening in degrees within the door's remaining travel; positive. */
    swing: number;

    /** The hand on the handle; the operate default (right) when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * A refrigerator shelf, numbered from the bottom: shelf1 through shelf4.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the admitted shelves.
   * @evidence contracts/development/design.md#principled-representation Closed choices 1, 2, 3, 4 distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shelves the refrigerator prop's affordances name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Shelf = 1 | 2 | 3 | 4;
}
