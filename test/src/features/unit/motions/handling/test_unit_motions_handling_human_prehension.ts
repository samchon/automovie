import { Quaternion, createAutoMovieRandom } from "@automovie/engine";
import type { IAutoMovieMotionHumanPrehension } from "@automovie/interface";
import { HumanPrehension } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few products, metres, seconds and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanPrehension` is reach to grasp as transport and grasp (Jeannerod 1981):
 * the peak aperture is 0.8 of the object's width plus 25 mm (Smeets and Brenner
 * 1999); a loaded carry takes at least the time that keeps the minimum-jerk
 * peak speed, 1.875 times the mean, at 1 m/s; the aperture peaks at a seeded
 * share in Jeannerod's 60 to 70 % band; the transport ends at rest on the grasp
 * and turns the hand by the approach's start; the fingers open to the pre-shape
 * by the peak and close onto the grasp by the end.
 *
 * Scenarios:
 *
 * 1. A 50 mm object peaks at 65 mm of aperture.
 * 2. Carried 1 m, a transport takes 1.875 s; carried 0.1 m, the unloaded reach
 *    time, longer than 0.1875 s.
 * 3. A seeded peak lies in [0.6, 0.7].
 * 4. A direct 1 s transport from the origin to (0.4, 0, 0) is half way at 0.5 s
 *    and on the grasp at its end, turned 90 degrees about Y by then; one set
 *    back 0.1 m along +X ends on the grasp too; a transport of no time is
 *    refused.
 * 5. With the peak at 0.6, a finger at 0 entering, -10 open and 60 closed reads -5
 *    at 0.3, -10 at 0.6, 25 at 0.8 and 60 at the end, prepared or not.
 */
export function test_unit_motions_handling_human_prehension(): void {
  TestValidator.predicate(
    "the aperture",
    nclose(HumanPrehension.aperture(0.05), 0.065, ROUNDING),
  );
  TestValidator.predicate(
    "the carry",
    nclose(HumanPrehension.carry(1), 1.875, ROUNDING) &&
      nclose(
        HumanPrehension.carry(0.1),
        HumanPrehension.nominal(0.1, 0),
        ROUNDING,
      ) &&
      HumanPrehension.nominal(0.1, 0) > 0.1875,
  );
  const peak: number = HumanPrehension.peak(createAutoMovieRandom("peak"));
  TestValidator.predicate("the peak", peak >= 0.6 && peak <= 0.7);
  const rotation: IAutoMovieMotionHumanPrehension.ITransportRotation = {
    from: Quaternion.identity(),
    to: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const direct: IAutoMovieMotionHumanPrehension.ITransport =
    HumanPrehension.transport(
      { x: 0, y: 0, z: 0 },
      { x: 0.4, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      0,
      rotation,
      1,
    );
  const approached: IAutoMovieMotionHumanPrehension.ITransport =
    HumanPrehension.transport(
      { x: 0, y: 0, z: 0 },
      { x: 0.4, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      0.1,
      rotation,
      1,
    );
  TestValidator.predicate(
    "the transport",
    vclose(direct.wrist(0.5), { x: 0.2, y: 0, z: 0 }, ROUNDING) &&
      vclose(direct.wrist(1), { x: 0.4, y: 0, z: 0 }, ROUNDING) &&
      qclose(direct.turn(1), rotation.to, ROUNDING) &&
      vclose(approached.wrist(1), { x: 0.4, y: 0, z: 0 }, ROUNDING) &&
      qclose(
        approached.turn(HumanPrehension.APPROACH.start),
        rotation.to,
        ROUNDING,
      ),
  );
  TestValidator.error("no time", (): void => {
    HumanPrehension.transport(
      { x: 0, y: 0, z: 0 },
      { x: 0.4, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      0,
      rotation,
      0,
    );
  });
  const shapes: Parameters<typeof HumanPrehension.shape>[0] = {
    entry: { rightIndexProximal: [0, 0, 0] },
    open: { rightIndexProximal: [-10, 0, 0] },
    closed: { rightIndexProximal: [60, 0, 0] },
  };
  const prepared: ReturnType<typeof HumanPrehension.prepareShape> =
    HumanPrehension.prepareShape(shapes, 0.6);
  TestValidator.predicate(
    "the fingers",
    [
      [0.3, -5],
      [0.6, -10],
      [0.8, 25],
      [1, 60],
    ].every(
      ([u, angle]: number[]): boolean =>
        nclose(
          HumanPrehension.shape(shapes, 0.6, u!).rightIndexProximal![0],
          angle!,
          ROUNDING,
        ) && nclose(prepared(u!).rightIndexProximal![0], angle!, ROUNDING),
    ),
  );
}
