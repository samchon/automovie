import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

/**
 * The same design with five more openings, chosen to separate each ordering
 * tier from the next.
 *
 * A twin of the front door measured from the same leaf but with no void of its
 * own; three model-less voids that differ only in width and then only in
 * height; and a lit vent beside the unmeasured one. Every void is placed clear
 * of every other on the same 6 x 3 face, because two voids that touch are one
 * void authored twice.
 */
export const test02DrawingOpeningTypes: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  openings: [
    ...environment.openings,
    { id: "twin-door", kind: "door", boundary: "north", fill: "door-leaf" },
    void_("side-door", "door", 5.2, 0, 0.8, 2.1),
    void_("wide-door", "door", 0, 0, 1, 2.1),
    void_("tall-door", "door", 4, 0, 1, 2.4),
    void_("vent-lit", "vent", 2.2, 2.4, 0.5, 0.5),
  ],
});

/** One rectangular void on the north face, placed by its own lower-left corner. */
const void_: (
  id: string,
  kind: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  id: string;
  kind: string;
  boundary: string;
  fill: null;
  profile: { outline: { x: number; y: number }[] };
} = (
  id: string,
  kind: string,
  x: number,
  y: number,
  width: number,
  height: number,
): {
  id: string;
  kind: string;
  boundary: string;
  fill: null;
  profile: { outline: { x: number; y: number }[] };
} => ({
  id,
  kind,
  boundary: "north",
  fill: null,
  profile: {
    outline: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
  },
});
