import { AutoMovieHumanPart } from "./AutoMovieHumanPart";

/**
 * A branch of a part: a tube that leaves the part's main chart and gets a chart of its own, closed per part so an address can never name a branch its part does not have.
 *
 * The hand branches into the thumb and the four fingers, each a tube whose `u` runs from its root on the hand to its tip and whose `v` turns about its own axis. The trunk branches into the four tubes that run out of its openings to its junction rings, the shoulder of each arm out to mid upper arm and the hip of each leg down to mid thigh: their `u` runs from the trunk's opening (0) to the ring (1) and their `v` turns counterclockwise about the site's distal axis from its anterior mark, exactly as the limb beyond the ring does, so both charts meet the ring at the same `v` and the same texel density. Every other part has none and addresses only its main chart.
 *
 * @template Part The part the branch belongs to
 */
export type AutoMovieHumanBranch<
  Part extends AutoMovieHumanPart = AutoMovieHumanPart,
> = Part extends "hand"
  ? "thumb" | "index" | "middle" | "ring" | "little"
  : Part extends "trunk"
    ? "leftShoulder" | "rightShoulder" | "leftHip" | "rightHip"
    : never;
