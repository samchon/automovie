import { AutoMovieHumanF1EyeLaw as E, AutoMovieHumanF1FacePriors as P } from "@automovie/human";

/**
 * The lids' law by its closed forms, on a made eye: fissure 30 by 11 mm with 0.6 of its height above the canthal line, globe radius 12,
 * lid 2, so the lid's face is a sphere of radius 14.
 *
 * Scenarios:
 * 1. At the fissure's middle the lid's face stands 14 from the line and the margins' phases are `asin(6.6 / 14)` and `-asin(4.4 / 14)`;
 *    their heights along the face, `14 sin(phase)`, add to the fissure's height, 11.
 * 2. At a quarter of the length from the middle (`s = 7.5`) the parabola has fallen to three quarters, and the face stands
 *    `sqrt(14^2 - 7.5^2)` from the line: the upper phase is `asin(0.75 * 6.6 / sqrt(139.75))`.
 * 3. Even in the station, and zero at and past both canthi.
 * 4. A blink of 1 puts the upper margin on the lower at every station; a blink of 0.5 puts it halfway in phase; the lower margin does
 *    not move.
 * 5. The published eye: with no globe or lid given, the face's radius is half the published axial length plus the published lid.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `of`, `radius`, `reach` and `margins` of `AutoMovieHumanF1EyeLaw` and reads the phases. It catches a margin that misses its apex or a canthus, a law that is not even in the station, a face radius without the lid, and a blink that moves the lower margin or stops short of it.
 * @evidence contracts/development/testing.md#independent-expectations Each number is the made eye's arithmetic written in the scenario list: a sphere's section radius, a parabola's value, an arcsine of their ratio, a linear share of a phase. The published radius is the two priors' sum as the law's comment defines it.
 * @evidence contracts/development/testing.md#distinguishing-cases The middle, a quarter station, both signs of the station, both canthi and a station past one; three blinks. No reference eye is read: whether the parabola meets a person's margins is a reading of the instrument and is not claimed here.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_f1_eye_law`; pure arithmetic.
 * @evidence contracts/development/common.md#meaningful-documentation States the made eye and the five scenarios with their closed forms.
 */
export function test_human_f1_eye_law(): void {
  const failures: string[] = [];
  const near = (label: string, got: number, want: number): void => {
    if (!(Math.abs(got - want) <= 1e-12)) failures.push(`${label}: ${got}, expected ${want}`);
  };
  const eye: E.IEye = E.of(30, 11, 0.6, 12, 2);

  // 1. The middle.
  const middle: [number, number] = E.margins(eye, 0);
  near("middle: reach", E.reach(eye, 0), 14);
  near("middle: upper phase", middle[0], Math.asin(6.6 / 14));
  near("middle: lower phase", middle[1], -Math.asin(4.4 / 14));
  near("middle: fissure height", 14 * Math.sin(middle[0]) - 14 * Math.sin(middle[1]), 11);

  // 2. A quarter of the length out.
  near("quarter: reach", E.reach(eye, 7.5), Math.sqrt(139.75));
  near("quarter: upper phase", E.margins(eye, 7.5)[0], Math.asin((0.75 * 6.6) / Math.sqrt(139.75)));

  // 3. Even, and closed at the canthi.
  near("even: upper", E.margins(eye, -7.5)[0], E.margins(eye, 7.5)[0]);
  near("even: lower", E.margins(eye, -4)[1], E.margins(eye, 4)[1]);
  for (const s of [15, -15, 17]) {
    near(`canthus ${s}: upper`, E.margins(eye, s)[0], 0);
    near(`canthus ${s}: lower`, E.margins(eye, s)[1], 0);
  }

  // 4. The blink.
  for (const s of [0, 5, -11]) {
    const open: [number, number] = E.margins(eye, s);
    const shut: [number, number] = E.margins(eye, s, 1);
    const half: [number, number] = E.margins(eye, s, 0.5);
    near(`blink 1 at ${s}: upper on lower`, shut[0], open[1]);
    near(`blink 1 at ${s}: lower stays`, shut[1], open[1]);
    near(`blink 0.5 at ${s}: halfway`, half[0], (open[0] + open[1]) / 2);
  }

  // 5. The published eye.
  near("published: face radius", E.radius(E.of(30, 11, 0.6)), P.GLOBE_AXIAL_MM / 2 + P.UPPER_LID_MM);
  if (failures.length !== 0) throw new Error(`${failures.length} eye law failures:\n${failures.join("\n")}`);
}
