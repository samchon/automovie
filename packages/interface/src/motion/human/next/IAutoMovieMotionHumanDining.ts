import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Eating and kitchen behaviours at a table: opening a refrigerator and looking
 * at one of its shelves. The fixed refrigerator prop supplies the affordances
 * fridgeHandle and shelf1 through shelf4; the performer stands with the handle
 * in reach and a sightline to the chosen shelf after the door opens. Door
 * opening is in degrees. No timing is defined by the family: the operate and
 * look laws' own apply (provisional: no study of kitchen timings).
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanDining<Chain> {
  /**
   * Open a refrigerator's fresh-food door by its handle, let go and look at one
   * of its shelves. The door stays at the resulting opening while the performer
   * looks. It ends when the look on the shelf has been held.
   *
   * A helper, not a chain method:
   * `AutoMovieMotionHumanDining.inspectRefrigerator(chain, params)` takes the
   * chain first and returns it with the actions appended.
   *
   * @param chain The chain the helper appends to; it is returned with the
   *   actions added.
   * @param params The refrigerator, shelf, swing and hand of
   *   `IAutoMovieMotionHumanDining.IInspectRefrigerator`.
   * @returns The chain with the handle operation followed by the shelf look
   *   appended.
   * @throws {HumanRefusal} When the additional opening is nonpositive or
   *   nonfinite.
   */
  inspectRefrigerator(
    chain: Chain,
    params: IAutoMovieMotionHumanDining.IInspectRefrigerator,
  ): Chain;
}

/** The parameter types of the Dining methods. */
export namespace IAutoMovieMotionHumanDining {
  /** The parameters of `inspectRefrigerator`. */
  export interface IInspectRefrigerator {
    /** The fixed refrigerator prop's subject. */
    refrigerator: string;

    /** Shelf number from the bottom of the refrigerator compartment. */
    shelf: IAutoMovieMotionHumanDining.Shelf;

    /**
     * Additional opening in degrees within the door's remaining travel;
     * positive.
     */
    swing: number;

    /** The hand on the handle; the operate default (right) when absent. */
    hand?: AutoMovieHumanSide;
  }

  /** A refrigerator shelf, numbered from the bottom: shelf1 through shelf4. */
  export type Shelf = 1 | 2 | 3 | 4;
}
