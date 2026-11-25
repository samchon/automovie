import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { StrikingStance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `StrikingStance.sink` lowers the root until both knees flex by the stance's
 * flexion: each leg's hip-to-ankle span at that flexion by the law of cosines,
 * `√(t² + s² + 2ts cos f)`, its vertical part over the foot's horizontal
 * offset, and the lower of the two legs, never raised.
 *
 * A thigh of 0.45 m and a shank of 0.43 m, the hips 0.1 m to each side at 0.96
 * m, the root at the origin facing +Z, the ankles 0.08 m up: the span is
 * 0.871440346 m at 16 degrees (the taekwondo reset's knee) and 0.824301284 m at
 * 41 degrees (the muay thai reset's).
 *
 * Scenarios:
 *
 * 1. Ankles under the hips: the sink is `0.08 + span − 0.96`, −0.008559654 m at 16
 *    degrees and −0.055698716 m at 41, the muay thai stance over 2 cm lower.
 * 2. The right ankle 0.3 m ahead: its vertical `√(span² − 0.09)` is the lower
 *    leg's and decides, −0.112228805 m at 41 degrees.
 * 3. Ankles 0.2 m up with straight knees: the leg's 0.88 m clears the drop, so the
 *    root is not raised (0).
 */
export function test_unit_motions_striking_stance_sink(): void {
  const body: Parameters<typeof StrikingStance.sink>[0] = {
    measure: { thigh: 0.45, shank: 0.43 },
    rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
      ["leftUpperLeg", { x: 0.1, y: 0.96, z: 0 }],
      ["rightUpperLeg", { x: -0.1, y: 0.96, z: 0 }],
    ]),
  };
  const root: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const under = (y: number) => ({
    left: { x: 0.1, y, z: 0 },
    right: { x: -0.1, y, z: 0 },
  });
  const taekwondo: number = StrikingStance.sink(body, root, 0, under(0.08), 16);
  const muayThai: number = StrikingStance.sink(body, root, 0, under(0.08), 41);
  TestValidator.predicate(
    "the knees' flexion sinks the root",
    nclose(taekwondo, -0.008559654, 1e-9) &&
      nclose(muayThai, -0.055698716, 1e-9) &&
      taekwondo - muayThai > 0.02,
  );
  TestValidator.predicate(
    "the lower leg decides",
    nclose(
      StrikingStance.sink(
        body,
        root,
        0,
        { ...under(0.08), right: { x: -0.1, y: 0.08, z: 0.3 } },
        41,
      ),
      -0.112228805,
      1e-9,
    ),
  );
  TestValidator.equals(
    "a leg that clears the drop does not raise the root",
    StrikingStance.sink(body, root, 0, under(0.2), 0),
    0,
  );
}
