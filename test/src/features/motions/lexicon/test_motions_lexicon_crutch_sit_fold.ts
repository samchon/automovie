import type {
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  crutchSitPath
} from "../../../../../packages/motions/src/lexicon/internal/crutchSitPath";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Thirty-two rounding units cover the shell projection at two metres. */
const ROUNDING: number = 32 * Number.EPSILON * 2;

/**
 * The held crutch translates on the floor when its wrist would fold too close.
 *
 * Scenarios:
 *
 * 1. An 8 cm vertical drop and a 6 cm horizontal reach move the grip's horizontal
 *    coordinate to √(16² − 8²) cm for a 15 cm inner shell and its 1 cm contact
 *    disc. The crutch's height and rotation stay fixed.
 * 2. At the midpoint of the correction band the integrated quintic supplies 5/32
 *    of the disc radius. Outside the band the original frame is returned.
 * 3. A wrist directly underneath the shoulder uses the authored outward side.
 */
export function test_motions_lexicon_crutch_sit_fold(): void {
  const frame: IAutoMovieRigidTransform = {
    position: { x: 1, y: 0.06, z: 2 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const shoulder: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const outward: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const minimum: number = 0.15;
  const disc: number = 0.01;
  const translate = (wrist: IAutoMovieVector3): IAutoMovieRigidTransform =>
    crutchSitPath.outsideFold(frame, shoulder, wrist, outward, minimum, disc);
  const expected: number = Math.sqrt(0.16 ** 2 - 0.08 ** 2);
  const braced: IAutoMovieRigidTransform = translate({
    x: 0.06,
    y: -0.08,
    z: 0,
  });
  TestValidator.predicate(
    "each point on the crutch receives the same horizontal translation",
    braced.rotation === frame.rotation &&
      vclose(
        braced.position,
        { ...frame.position, x: 1 + expected - 0.06 },
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "blend in the correction through a continuous band",
    vclose(
      translate({ x: 0.16, y: 0, z: 0 }).position,
      { ...frame.position, x: 1 + (5 * disc) / 32 },
      ROUNDING,
    ) && translate({ x: 0.18, y: 0, z: 0 }) === frame,
  );
  TestValidator.predicate(
    "use the authored side at zero horizontal span",
    vclose(
      translate({ x: 0, y: -0.08, z: 0 }).position,
      { ...frame.position, z: 2 - expected },
      ROUNDING,
    ),
  );
}
