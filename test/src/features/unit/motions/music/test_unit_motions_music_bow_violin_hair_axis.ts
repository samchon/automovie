import type { IAutoMovieVector3 } from "@automovie/interface";
import { bowViolinHairAxis } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * `bowViolinHairAxis` lays the bow hair perpendicular to the string across the
 * instrument (Schoonderwaldt 2010's straight stroke), tilted π / 15 out of the
 * string bar's plane: toward the outward normal on `string1`, away from it on
 * `string4`.
 *
 * The string runs along +X, its bar's outward normal is +Y, so across is +Z.
 *
 * Scenarios:
 *
 * 1. On `string1` the hair is `(0, sin(π / 15), cos(π / 15))`.
 * 2. On `string4` its outward part is reversed.
 * 3. Either way it stays perpendicular to the string and of unit length.
 */
export function test_unit_motions_music_bow_violin_hair_axis(): void {
  const along: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const outward: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const tilt: number = Math.PI / 15;
  const first: IAutoMovieVector3 = bowViolinHairAxis(along, outward, "string1");
  const fourth: IAutoMovieVector3 = bowViolinHairAxis(
    along,
    outward,
    "string4",
  );
  TestValidator.predicate(
    "tilted toward each string's outside",
    vclose(first, { x: 0, y: Math.sin(tilt), z: Math.cos(tilt) }, 1e-12) &&
      vclose(fourth, { x: 0, y: -Math.sin(tilt), z: Math.cos(tilt) }, 1e-12) &&
      nclose(Math.hypot(first.x, first.y, first.z), 1, 1e-12),
  );
}
