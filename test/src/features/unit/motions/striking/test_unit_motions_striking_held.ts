import type { IAutoMovieMotionHumanStrikingHeld } from "@automovie/interface";
import { StrikingHeld } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** A 0.8 m blade along +Z, its edge +Y, held in the right hand. */
const TOOL: IAutoMovieMotionHumanStrikingHeld.ITool = {
  side: "right",
  tip: { x: 0, y: 0, z: 0.8 },
  axis: { x: 0, y: 0, z: 1 },
  edge: { x: 0, y: 1, z: 0 },
  rolls: false,
  length: 0.8,
  span: null,
};

/**
 * A held tool's hand frame (`StrikingHeld.hand`, `prepareHand`, `point`,
 * `strayed`): the hand turns the tool's axis onto the asked axis and its edge
 * onto the asked edge's part square to it, and stands so the point `back` along
 * the axis from the tip lands where asked; a frame's stray is the farther miss
 * of its two ends from another frame's.
 *
 * Scenarios:
 *
 * 1. Asked along +Z with the edge +Y, the hand is unturned and stands at (0, 0,
 *    -0.5) to put the point 0.3 m back from the tip at the origin.
 * 2. Asked along +X with the edge (0.5, 1, 0), it turns 90 degrees about +Y, and
 *    the tip lands 0.3 m beyond (1, 1, 1) along +X; prepared once it frames the
 *    same.
 * 3. Two frames turned 90 degrees apart about their grip stray by the tip's 0.8
 *    sqrt 2 m.
 */
export function test_unit_motions_striking_held(): void {
  const still = StrikingHeld.hand(
    TOOL,
    0.3,
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 2 },
    { x: 0, y: 1, z: 0 },
  );
  TestValidator.predicate(
    "along the tool",
    qclose(still.rotation, { x: 0, y: 0, z: 0, w: 1 }, 1e-12) &&
      vclose(still.point, { x: 0, y: 0, z: -0.5 }, 1e-12),
  );
  const at = { x: 1, y: 1, z: 1 };
  const turned = StrikingHeld.hand(
    TOOL,
    0.3,
    at,
    { x: 1, y: 0, z: 0 },
    { x: 0.5, y: 1, z: 0 },
  );
  TestValidator.predicate(
    "turned",
    qclose(
      turned.rotation,
      { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      1e-12,
    ) &&
      vclose(StrikingHeld.point(TOOL, turned, 0.3), at, 1e-12) &&
      vclose(StrikingHeld.point(TOOL, turned), { x: 1.3, y: 1, z: 1 }, 1e-12) &&
      vclose(
        StrikingHeld.prepareHand(
          TOOL,
          0.3,
          { x: 1, y: 0, z: 0 },
          { x: 0.5, y: 1, z: 0 },
        )(at).point,
        turned.point,
        1e-12,
      ),
  );
  const grip = { x: 0, y: 0, z: 0 };
  TestValidator.predicate(
    "the stray",
    nclose(
      StrikingHeld.strayed(
        TOOL,
        { point: grip, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        {
          point: grip,
          rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
        },
        0,
      ),
      0.8 * Math.SQRT2,
      1e-12,
    ),
  );
}
