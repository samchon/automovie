import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { resolvedBones } from "../../../internal/resolvedBones";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** Rounding of a rigid placement, metres. */
const ROUNDING: number = 1e-12;

/**
 * `HumanSignature.region` places a named body region on the displayed bone the
 * body's surface frame names, and refuses where the rig lacks that bone.
 *
 * Scenarios, the average man's stored sternum frame:
 *
 * 1. Its bone displayed unturned at (0, 1.4, 0) and then carried 1 m along +X: the
 *    sternum moves the same metre with it, a rigid placement on the bone.
 * 2. Displayed turned a half turn about the vertical, the sternum's offset from
 *    its bone reverses in x and z and keeps its height.
 * 3. Without its bone the region is refused.
 *
 * The surfaces are the stored person's (`humanFixture`), the only part of the
 * body the reading reads.
 */
export async function test_unit_motions_audit_human_signature_region(): Promise<void> {
  const surfaces: IAutoMovieHumanoidSurfaces.ISurfaces = (
    await humanFixture("m-average")
  ).surfaces;
  const bone = surfaces.regions.sternum.bone;
  const at = (
    position: IAutoMovieVector3,
    turned: boolean = false,
  ): IAutoMovieVector3 =>
    HumanSignature.region(
      {
        motion: {
          duration: 1,
          bones: () =>
            resolvedBones(
              [[bone, position]],
              turned ? { x: 0, y: 1, z: 0, w: 0 } : { x: 0, y: 0, z: 0, w: 1 },
            ),
        },
        subject: "a",
        body: { surfaces },
      },
      "sternum",
      0,
    );
  const origin: IAutoMovieVector3 = { x: 0, y: 1.4, z: 0 };
  const here: IAutoMovieVector3 = at(origin);
  TestValidator.predicate(
    "carried",
    vclose(at({ x: 1, y: 1.4, z: 0 }), { ...here, x: here.x + 1 }, ROUNDING),
  );
  const back: IAutoMovieVector3 = at(origin, true);
  TestValidator.predicate(
    "turned",
    vclose(back, { x: -here.x, y: here.y, z: 2 * origin.z - here.z }, ROUNDING),
  );
  TestValidator.predicate(
    "no bone",
    throwsError(() =>
      HumanSignature.region(
        {
          motion: { duration: 1, bones: () => resolvedBones([]) },
          subject: "a",
          body: { surfaces },
        },
        "sternum",
        0,
      ),
    ),
  );
}
