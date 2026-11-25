import { ANKLE_DORSIFLEXION, Quaternion, Vector3 } from "@automovie/engine";
import { KickChain, KickForm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/**
 * A kick chain's foot and knee (`KickChain.sole`, `unloaded`, `bend`): a push
 * kick's sole faces back along the line, its toes up; an unloaded ankle
 * dorsiflexed past its range, less a margin, is turned back to it; a round
 * kick's knee hints across the strike and a little up, a push kick's up and
 * along the line.
 *
 * Scenarios:
 *
 * 1. Along +Z, the sole's attitude pitches -90 degrees about +X.
 * 2. An upright shank over a level foot is within the range and kept; a shank
 *    leaning 45 degrees forward over it is turned back to `unloaded -
 *    DORSAL_MARGIN` of dorsiflexion.
 * 3. A round kick across +X hints along (1, 0.3, 0); a push kick along +Z along
 *    (0, 1, 1).
 */
export function test_unit_motions_striking_kick_chain(): void {
  TestValidator.predicate(
    "the sole",
    qclose(
      KickChain.sole({ x: 0, y: 0, z: 1 }),
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
      1e-12,
    ),
  );
  const flat = { x: 0, y: 0, z: 0, w: 1 };
  const ankle = { x: 0, y: 0, z: 0 };
  const leaning = { x: 0, y: 0.4, z: 0.4 };
  const turned = KickChain.unloaded(flat, leaning, ankle);
  const up = Vector3.normalize(leaning);
  const toes = Quaternion.rotateVector(turned, { x: 0, y: 0, z: 1 });
  const most: number = ANKLE_DORSIFLEXION.unloaded - KickChain.DORSAL_MARGIN;
  TestValidator.predicate(
    "the unloaded ankle",
    qclose(
      KickChain.unloaded(flat, { x: 0, y: 0.4, z: 0 }, ankle),
      flat,
      1e-12,
    ) &&
      (most >= 45
        ? qclose(turned, flat, 1e-12)
        : nclose(
            90 - (Math.acos(Vector3.dot(toes, up)) * 180) / Math.PI,
            most,
            1e-9,
          )),
  );
  TestValidator.predicate(
    "the knee hint",
    vclose(
      KickChain.bend({
        technique: "round",
        direction: { x: 1, y: 0, z: 0 },
        line: { x: 0, y: 0, z: 1 },
      }),
      { x: 1, y: KickForm.BEND_RISE, z: 0 },
      1e-12,
    ) &&
      vclose(
        KickChain.bend({
          technique: "push",
          direction: { x: 1, y: 0, z: 0 },
          line: { x: 0, y: 0, z: 1 },
        }),
        { x: 0, y: 1, z: 1 },
        1e-12,
      ),
  );
}
