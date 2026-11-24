import type {
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieVector3,
} from "@automovie/interface";
import { conductTip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `conductTip` prepares the baton tip's path over a phrase: from the figure's
 * top into the first ictus over the lead, from ictus to ictus on the beat
 * clock, each beat lifted by its rebound, and held on the last ictus after the
 * last beat.
 *
 * Three beats at 120 bpm after a 1 s lead (beats at 1, 1.5 and 2 s) on ictuses
 * at heights 1.0, 0.8 and 0.9 m, from a top at 1.2 m, with a 0.1 m rebound.
 *
 * Scenarios:
 *
 * 1. At the start the tip is at the top; at the first beat on the first ictus.
 * 2. Mid-way through the preparation it is midway down, lifted 0.1 m.
 * 3. A quarter second after the first beat, mid-beat, it is between the first two
 *    ictuses lifted 0.1 m.
 * 4. On and after the last beat it holds the last ictus.
 */
export function test_unit_motions_music_conduct_tip(): void {
  const ictus: IAutoMovieVector3[] = [
    { x: 0, y: 1, z: 0 },
    { x: 0.2, y: 0.8, z: 0 },
    { x: -0.2, y: 0.9, z: 0 },
  ];
  const top: IAutoMovieVector3 = { x: 0, y: 1.2, z: 0 };
  const beats: Pick<
    IAutoMovieMotionHumanDanceBeats,
    "count" | "period" | "at"
  > = { count: 3, period: 0.5, at: (k: number): number => 0.5 + 0.5 * k };
  const tip: (seconds: number) => IAutoMovieVector3 = conductTip(
    ictus,
    top,
    beats,
    0.1,
  );
  TestValidator.predicate(
    "the preparation, the beats and the hold",
    vclose(tip(0), top, 1e-12) &&
      vclose(tip(1), ictus[0]!, 1e-12) &&
      vclose(tip(0.5), { x: 0, y: 1.2, z: 0 }, 1e-12) &&
      vclose(tip(1.25), { x: 0.1, y: 1, z: 0 }, 1e-12) &&
      vclose(tip(2), ictus[2]!, 1e-12) &&
      vclose(tip(3), ictus[2]!, 1e-12),
  );
}
