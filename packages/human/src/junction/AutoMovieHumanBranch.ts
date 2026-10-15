import { AutoMovieHumanPart } from "./AutoMovieHumanPart";

/**
 * A branch of a part: a tube that leaves the part's main chart and gets a chart of its own, closed per part so an address can never name a branch its part does not have.
 *
 * The hand branches into the thumb and the four fingers, each a tube whose `u` runs from its root on the hand to its tip and whose `v` turns about its own axis; every other part has none and addresses only its main chart.
 *
 * @template Part The part the branch belongs to
 */
export type AutoMovieHumanBranch<
  Part extends AutoMovieHumanPart = AutoMovieHumanPart,
> = Part extends "hand"
  ? "thumb" | "index" | "middle" | "ring" | "little"
  : never;
