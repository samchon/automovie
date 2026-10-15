import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";

/**
 * Every skin part instance of a person: the trunk, neck and head once, the ears, arms, hands, legs and feet once per side.
 */
export const AUTOMOVIE_HUMAN_PART_INSTANCES: ReadonlyArray<
  readonly [AutoMovieHumanPart, AutoMovieHumanSide | null]
> = [
  ["trunk", null],
  ["neck", null],
  ["head", null],
  ["ear", "left"],
  ["ear", "right"],
  ["arm", "left"],
  ["arm", "right"],
  ["hand", "left"],
  ["hand", "right"],
  ["leg", "left"],
  ["leg", "right"],
  ["foot", "left"],
  ["foot", "right"],
];
