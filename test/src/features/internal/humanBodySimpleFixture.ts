import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import { humanBodyBasisFixture } from "./humanBodyBasisFixture";

const { basis: box } = humanBodyBasisFixture();
const surface = box.surfaces[0];
const wide = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((v) => [
  v,
  surface.positions[v * 3] > 0 ? 0.05 : -0.05,
  0,
  0,
]);
const narrow = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((v) => [
  v,
  surface.positions[v * 3] > 0 ? -0.02 : 0.02,
  0,
  0,
]);
const deep = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((v) => [
  v,
  0,
  0,
  surface.positions[v * 3 + 2] > 0 ? 0.03 : -0.03,
]);
const macros = (
  weightPositive: number[],
  weightNegative: number[],
): IAutoMovieHumanBodyBasis => ({
  ...box,
  channels: [
    ...box.channels,
    ...[
      ["macroGender", -1, 1],
      ["macroAge", -1, 1],
      // muscle past one, as the published basis carries it
      ["macroMuscle", -1, 2],
      ["macroFirmness", -1, 1],
      ["buttocksPtosis", -1, 1],
      ["absDefinition", 0, 1],
      ["flankFat", 0, 1],
    ].map(([id, minimum, maximum]) => ({
      id: String(id),
      kind: "shape" as const,
      group: "macro",
      mirror: null,
      minimum: Number(minimum),
      maximum: Number(maximum),
      positive: "wideTall",
      negative: minimum === 0 ? null : "wideTall",
    })),
    {
      id: "macroHeight",
      kind: "shape",
      group: "macro",
      mirror: null,
      minimum: -1,
      maximum: 1,
      positive: "raised",
      negative: "lowered",
    },
    {
      id: "macroWeight",
      kind: "shape",
      group: "macro",
      mirror: null,
      minimum: -1,
      maximum: 1,
      positive: "grown",
      negative: "shrunk",
    },
    {
      // the bust rule reads joint-spine-1, which the box does not have
      id: "measureBustCirc",
      kind: "shape",
      group: "torso",
      mirror: null,
      minimum: -1,
      maximum: 1,
      positive: "deep",
      negative: null,
    },
    {
      id: "measureWaistCirc",
      kind: "shape",
      group: "torso",
      mirror: null,
      minimum: -1,
      maximum: 1,
      positive: "deep",
      negative: "shallow",
    },
  ],
  correctives: [],
  surfaces: [
    {
      ...surface,
      // seven tenths of the box's width and depth put its body mass index
      // reach at about 13 to 31, a human band
      positions: surface.positions.map((value, at) =>
        at % 3 === 1 ? value : value * 0.7,
      ),
      targets: {
        ...surface.targets,
        lowered: [4, 0, -0.5, 0, 5, 0, -0.5, 0, 6, 0, -0.5, 0, 7, 0, -0.5, 0],
        grown: weightPositive,
        shrunk: weightNegative,
        deep,
        shallow: deep.map((value, at) => (at % 4 === 0 ? value : -value / 3)),
      },
    },
  ],
});

/**
 * The analytic box of `humanBodyBasisFixture` at seven tenths of its width
 * and depth, with the macro, identity and tape channels the simple tier
 * reads: `macroHeight` raises or lowers the top ring by 0.5 m per unit,
 * `macroWeight` widens the box by 0.05 m per side at +1 (`wide`) or narrows
 * it by 0.02 m at -1 (`narrow`), and `measureWaistCirc` deepens it by 0.03 m
 * per side at +1 or makes it shallower by 0.01 m at -1. The other identity
 * channels move one corner and stand in for channels the table names. The
 * weight endpoints are parameters so a scenario can hand in a channel that
 * shrinks the body as it grows. Every expected number in the simple-tier
 * scenarios is hand-derived from these figures.
 */
export const humanBodySimpleFixture = {
  weights: { wide, narrow },
  basis: macros,
};
