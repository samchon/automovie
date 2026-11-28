import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/** Inputs for a search of an open bag. */
export namespace IAutoMovieMotionHumanSearch {
  /** A search that finds its named item, or one with an authored miss. */
  export type BagSearch = ISearchBag | INoFind;

  /** Search the bag and extract the named item. */
  export interface ISearchBag {
    /** The open bag's subject. */
    bag: string;

    /** The item's subject, lying inside the bag. */
    item: string;

    /** The item's grip affordance. */
    handle: string;

    /**
     * Height from the bag's floor to its opening in metres, used as lift
     * distance.
     */
    depth: number;

    /** The reaching hand, right by default. */
    hand?: AutoMovieHumanSide;
  }

  /** Search the bag without taking an item. */
  export interface INoFind extends Pick<ISearchBag, "bag" | "hand"> {
    /** The author selects a completed search with no pickup. */
    type: "no-find";
  }
}
