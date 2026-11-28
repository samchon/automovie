import { AutoMovieHumanF1EyeLaw as E, AutoMovieHumanF1FacePriors as P } from "@automovie/human";

/**
 * The lids' law on a made eye: fissure 30 mm, upper margin 4 mm above the pupil, lower 6 below, tilt 6 degrees.
 *
 * Scenarios, each the law's published samples and the made eye's arithmetic:
 * 1. Straight up and straight down the margins stand the person's own distances, 4 and 6 mm.
 * 2. A published direction keeps the published ratio: 45 degrees gives `4 * 5.23 / 4.62`, 135 gives `4 * 6.28 / 4.62`; 240 gives
 *    `6 * 4.12 / 3.58`. The upper margin is wider toward the temple than toward the nose at mirrored directions, as published.
 * 3. Between two published directions the ratio is read linearly: 52.5 degrees gives the mean of the values at 45 and 60.
 * 4. A margin's point: at 135 degrees it lies toward the temple and above the pupil's level by `r / sqrt 2` each.
 * 5. The canthi: the medial one 3.7 mm below the pupil's level and `15 cos 6` nasal; the lateral one `30 sin 6` above it; the line
 *    between them is tilted 6 degrees and 30 mm long.
 * 6. A blink of 1 puts the upper margin, straight up, at the lower margin's distance below the pupil's level (-6); a blink of 0.5
 *    halfway (-1).
 * 7. No profile is published between the lower margin's ends and the canthi: 190 degrees is refused.
 * 8. The lid's face: the published globe's radius plus the published lid.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `margin`, `point`, `canthi` and `radius` of `AutoMovieHumanF1EyeLaw`. It catches a profile scaled by the wrong sample, a direction read off its neighbour, a canthus at the wrong height or side, a tilt that does not come back, a blink that does not reach the lower margin and an unpublished direction that is given a value.
 * @evidence contracts/development/testing.md#independent-expectations The expected distances are the published samples written in the scenario list times the made eye's own two distances; the canthi follow from the made length and tilt by sine and cosine; no value comes from a run.
 * @evidence contracts/development/common.md#meaningful-documentation The fixtures cover measured vertical margins, sampled and interpolated directions, margin point and canthal placement, blinking and unpublished directions.
 */
export function test_human_f1_eye_law(): void {
  const failures: string[] = [];
  const near = (label: string, got: number, want: number): void => {
    if (!(Math.abs(got - want) <= 1e-12)) failures.push(`${label}: ${got}, expected ${want}`);
  };
  const eye: E.IEye = { length: 30, above: 4, below: 6, tilt: 6 };

  // 1 to 3. The margins' distances.
  near("up", E.margin(eye, 90), 4);
  near("down", E.margin(eye, 270), 6);
  near("45 degrees", E.margin(eye, 45), (4 * 5.23) / 4.62);
  near("135 degrees", E.margin(eye, 135), (4 * 6.28) / 4.62);
  near("240 degrees", E.margin(eye, 240), (6 * 4.12) / 3.58);
  if (!(E.margin(eye, 135) > E.margin(eye, 45))) failures.push("the upper margin is not wider toward the temple");
  near("52.5 degrees", E.margin(eye, 52.5), (E.margin(eye, 45) + E.margin(eye, 60)) / 2);

  // 4. A point.
  const temple: E.P2 = E.point(eye, 135);
  near("point: toward the temple", temple[0], E.margin(eye, 135) / Math.SQRT2);
  near("point: above", temple[1], E.margin(eye, 135) / Math.SQRT2);

  // 5. The canthi.
  const [medial, lateral]: [E.P2, E.P2] = E.canthi(eye);
  const tilt: number = (6 * Math.PI) / 180;
  near("medial canthus: below the pupil", medial[1], -E.MEDIAL_CANTHUS_DROP_MM);
  near("medial canthus: nasal", medial[0], -15 * Math.cos(tilt));
  near("lateral canthus: above the medial", lateral[1] - medial[1], 30 * Math.sin(tilt));
  near("canthi: length", Math.hypot(lateral[0] - medial[0], lateral[1] - medial[1]), 30);
  near("canthi: tilt", Math.atan2(lateral[1] - medial[1], lateral[0] - medial[0]), tilt);

  // 6. The blink, straight up: the lower margin's 6 mm at 270 degrees mirrored in the pupil's level.
  near("blink 1", E.margin(eye, 90, 1), -6);
  near("blink 0.5", E.margin(eye, 90, 0.5), -1);

  // 7. An unpublished direction.
  let refused: boolean = false;
  try {
    E.margin(eye, 190);
  } catch {
    refused = true;
  }
  if (!refused) failures.push("190 degrees was given a distance");

  // A person's own profile replaces the published one: with every distance doubled but the one straight up, 45 degrees gives twice the ratio.
  const own: number[] = [9.12, 7.24, 6.0, 5.23, 4.78, 4.59, 4.62, 4.87, 5.4, 6.28, 7.66, 9.73, 12.15].map((r: number, k: number): number => (k === 6 ? r : 2 * r));
  near("own profile at 45 degrees", E.margin({ ...eye, upperProfile: own }, 45), (4 * 2 * 5.23) / 4.62);
  near("own profile straight up", E.margin({ ...eye, upperProfile: own }, 90), 4);

  // 8. The lid's face.
  near("face radius", E.radius(), P.GLOBE_AXIAL_MM / 2 + P.UPPER_LID_MM);
  if (failures.length !== 0) throw new Error(`${failures.length} eye law failures:\n${failures.join("\n")}`);
}
