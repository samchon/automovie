import type {
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  conductArc,
  conductFigure,
  conductTip,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_music_conduct_arc`. */
namespace ScenarioConductArc {
  /**
   * `conductArc` lays the baton tip between two ictuses on their straight line
   * lifted by `lift sin(pi u)`, the share clamped to the beat, so each ictus is
   * its beat's lowest point.
   *
   * A beat from (0, 1, 0) to (0.2, 0.8, 0) with a 0.1 m rebound.
   *
   * Scenarios:
   *
   * 1. At its ends the tip is on the ictuses.
   * 2. Mid-beat it is on the line's midpoint lifted the whole 0.1 m.
   * 3. A share past the beat is clamped to its end.
   */
  export function test_unit_motions_music_conduct_arc(): void {
    const from: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const to: IAutoMovieVector3 = { x: 0.2, y: 0.8, z: 0 };
    TestValidator.predicate(
      "the lifted line",
      vclose(conductArc(from, to, 0, 0.1), from, 1e-12) &&
        vclose(conductArc(from, to, 1, 0.1), to, 1e-12) &&
        vclose(conductArc(from, to, 0.5, 0.1), { x: 0.1, y: 1, z: 0 }, 1e-12) &&
        vclose(conductArc(from, to, 1.5, 0.1), to, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_music_conduct_figure`. */
namespace ScenarioConductFigure {
  /**
   * `conductFigure` lays a conducting figure in the performer's frontal plane:
   * its centre a forearm and 0.6 upper arms ahead of the root's floor point, 0.1
   * m below the shoulders and half a shoulder half-width toward the baton's side,
   * each ictus at its meter's shares of the 0.18 m half size (Rudolf's figures),
   * cycling through the meter, and the top 0.18 m above the centre.
   *
   * The average man stands at (1, 0.9, 2) facing +Z, the left toward +X.
   *
   * Scenarios:
   *
   * 1. Three beats of 2/4 with the right hand: down, then 0.2 in toward the middle
   *    and 0.4 down, then down again; the top above the centre.
   * 2. With the left hand the figure moves to the left side and mirrors.
   */
  export async function test_unit_motions_music_conduct_figure(): Promise<void> {
    const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
    const posture: Parameters<typeof conductFigure>[0] = {
      root: { x: 1, y: 0.9, z: 2 },
      yaw: 0,
    };
    const h: number = conductFigure.HALF;
    const y: number = m.shoulderHeight - 0.1;
    const z: number = 2 + m.forearm + 0.6 * m.upperArm;
    const right: ReturnType<typeof conductFigure> = conductFigure(
      posture,
      m,
      "right",
      "2/4",
      3,
    );
    const cx: number = 1 - 0.5 * m.shoulderHalfWidth;
    TestValidator.predicate(
      "the right hand's figure",
      right.ictus.length === 3 &&
        vclose(right.ictus[0]!, { x: cx, y: y - h, z }, 1e-12) &&
        vclose(
          right.ictus[1]!,
          { x: cx - 0.2 * h, y: y - 0.4 * h, z },
          1e-12,
        ) &&
        vclose(right.ictus[2]!, right.ictus[0]!, 1e-12) &&
        vclose(right.top, { x: cx, y: y + h, z }, 1e-12),
    );
    const left: ReturnType<typeof conductFigure> = conductFigure(
      posture,
      m,
      "left",
      "2/4",
      2,
    );
    const lx: number = 1 + 0.5 * m.shoulderHalfWidth;
    TestValidator.predicate(
      "the left hand's mirror",
      vclose(left.ictus[1]!, { x: lx + 0.2 * h, y: y - 0.4 * h, z }, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_music_conduct_tip`. */
namespace ScenarioConductTip {
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
}

/**
 * The `conduct` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export async function test_unit_motions_music_conduct(): Promise<void> {
  ScenarioConductArc.test_unit_motions_music_conduct_arc();
  await ScenarioConductFigure.test_unit_motions_music_conduct_figure();
  ScenarioConductTip.test_unit_motions_music_conduct_tip();
}
