/**
 * Sex-conditioned superficial muscle thickness used by the regional and
 * definition term populations. The paired CT and muscle-share evidence
 * remains beside the value so both consumers read one named relation.
 */
import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

type Term = IAutoMovieHumanBodySimpleShapeTable["terms"][number];

// A muscle's relief under the skin is as deep as the muscle is thick, and a
// woman's is thinner: her rectus abdominis 0.97 cm against a man's 1.15
// (CT at the third lumbar vertebra, 109 women and 239 men; Kelly et al.
// 2021), the 0.84 the upper body's muscle share implies too (Janssen et al.
// 2000, 0.6 of a man's mass over 0.92 of his stature, square-rooted)
/** Shared sex-dependent superficial muscle thickness curve. */
export const MUSCLE_THICKNESS_BY_SEX = {
  parameter: "sex",
  points: [
    [-1, 0.84],
    [1, 1],
  ],
} as const satisfies Term["curves"][number];
