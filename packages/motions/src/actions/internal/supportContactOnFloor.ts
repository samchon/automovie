import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";

/**
 * Whether the support contact lies on the floor under its existing bearing
 * threshold. An unnamed target is the origin, as in the contact form.
 *
 * @param aimed The world-metre target, or null for an unnamed floor place.
 * @returns The original target-height comparison to HumanFoot.BEARING.
 */
export function supportContactOnFloor(
  aimed: IAutoMovieVector3 | null,
): boolean {
  return (aimed ?? { x: 0, y: 0, z: 0 }).y <= HumanFoot.BEARING;
}
