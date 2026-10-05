import { pickHumanSourceExtremum } from "./pickHumanSourceExtremum.ts";
import type { IHumanSourceLandmarkPick } from "./structures/IHumanSourceLandmarkPick.ts";
import { traceHumanSourceMidlineProfile } from "./traceHumanSourceMidlineProfile.ts";

/**
 * Sellion: the deepest point of the nasal bridge at the top of the nose. The
 * bridge is the outer midline profile from glabella down to pronasale
 * (`traceHumanSourceMidlineProfile`); the pick is its smallest z, the two end
 * points excluded.
 */
export function selectHumanSourceSellion(
  positions: readonly number[],
  faces: readonly number[][],
  midline: readonly number[],
  glabella: number,
  pronasale: number,
): IHumanSourceLandmarkPick {
  const bridge = traceHumanSourceMidlineProfile(positions, faces, midline, glabella, pronasale).slice(1, -1);
  return pickHumanSourceExtremum("sellion", positions, bridge, 2, "min");
}
