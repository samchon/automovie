import { AutoMovieHumanF1LipsLaw as M, AutoMovieHumanF1NoseLaw as N } from "@automovie/human";

/**
 * The lips' and the nose's laws on made measures.
 *
 * Lips, a made mouth 48 mm wide, vermilion 8 above and 10 below, bow 0.25, fall 2:
 * 1. At the median the upper edge stands 8 and the lower -10 from the line, which is level there.
 * 2. The crest stands an eighth of the width out, at 6 mm, where the upper edge is `8 * 1.25` above the line and the line has fallen
 *    `2 * (6 / 24)^2`.
 * 3. At the corner both edges meet the line, 2 below the median's.
 * 4. Halfway from the crest to the corner (15 mm) the upper edge is three quarters of its crest height above the line; halfway to the
 *    corner (12 mm) the lower edge is three quarters of its median depth below it.
 * 5. Even in the station.
 *
 * Nose, a made 3-4-5 triangle scaled by 10: height 50, protrusion 30, bridge 40:
 * 6. The tip stands `(50^2 + 30^2 - 40^2) / 100 = 18` from subnasale and `sqrt(30^2 - 18^2) = 24` ahead of the line.
 * 7. The outline is 12 at station 9 (half way up the columella) and 12 at station 34 (half way down the dorsum), 0 at both ends.
 * 8. Lengths that close no triangle (height 50, protrusion 10, bridge 30) are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `line`, `upper` and `lower` of `AutoMovieHumanF1LipsLaw` and `tip` and `outline` of `AutoMovieHumanF1NoseLaw`. It catches an edge that misses the median heights, the crest's station or the corner, a bow applied at the median, an uneven law, a tip off the triangle's closed form and an outline that is not the two straight lines.
 * @evidence contracts/development/testing.md#independent-expectations Each number is the made measures' arithmetic in the scenario list: the published crest share times the width, the declared polynomials' values at the stated shares, and the law of cosines on a 3-4-5 triangle.
 * @evidence contracts/development/common.md#meaningful-documentation The fixtures check the lips' midpoint, crest, corner and symmetry, then derive a nose tip and outline from triangle dimensions and reject an impossible triangle.
 */
export function test_human_f1_lips_nose_law(): void {
  const failures: string[] = [];
  const near = (label: string, got: number, want: number): void => {
    if (!(Math.abs(got - want) <= 1e-12)) failures.push(`${label}: ${got}, expected ${want}`);
  };
  const mouth: M.IMouth = { width: 48, upper: 8, lower: 10, bow: 0.25, fall: 2 };

  // 1 to 5. The lips.
  near("median: line", M.line(mouth, 0), 0);
  near("median: upper", M.upper(mouth, 0), 8);
  near("median: lower", M.lower(mouth, 0), -10);
  near("crest: line", M.line(mouth, 6), -2 * (6 / 24) ** 2);
  near("crest: upper above the line", M.upper(mouth, 6) - M.line(mouth, 6), 8 * 1.25);
  near("corner: line", M.line(mouth, 24), -2);
  near("corner: upper", M.upper(mouth, 24), -2);
  near("corner: lower", M.lower(mouth, 24), -2);
  near("15 mm: upper above the line", M.upper(mouth, 15) - M.line(mouth, 15), 8 * 1.25 * 0.75);
  near("12 mm: lower below the line", M.line(mouth, 12) - M.lower(mouth, 12), 10 * 0.75);
  near("even: upper", M.upper(mouth, -9), M.upper(mouth, 9));
  near("even: lower", M.lower(mouth, -9), M.lower(mouth, 9));
  if (!(M.upper(mouth, 3) > M.upper(mouth, 0) && M.upper(mouth, 3) < M.upper(mouth, 6))) failures.push("the upper edge does not rise from the median to the crest");

  // 6 to 8. The nose.
  const nose: N.INose = { height: 50, protrusion: 30, bridge: 40 };
  near("tip: station", N.tip(nose)[0], 18);
  near("tip: ahead", N.tip(nose)[1], 24);
  near("outline: columella", N.outline(nose, 9), 12);
  near("outline: dorsum", N.outline(nose, 34), 12);
  near("outline: subnasale", N.outline(nose, 0), 0);
  near("outline: nasion", N.outline(nose, 50), 0);
  let refused: boolean = false;
  try {
    N.tip({ height: 50, protrusion: 10, bridge: 30 });
  } catch {
    refused = true;
  }
  if (!refused) failures.push("lengths that close no triangle were given a tip");
  if (failures.length !== 0) throw new Error(`${failures.length} lips and nose law failures:\n${failures.join("\n")}`);
}
