import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceMidlinePair } from "../structures/IAutoMovieHumanFaceMidlinePair";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { poseHumanFaceVertex } from "./poseHumanFaceVertex";

/**
 * The closure gain per unit closure weight that brings one vermilion pair of
 * the contact's lips surface to margin contact: weight one seals it exactly.
 *
 * `d` is the pair's current aperture, the two vertices posed from this state's rest layer, and `d_closed` the same pair posed after
 * the closure endpoint's rows are added at gain one. Blended rigid posing is
 * affine in the rest position, so the posed aperture falls linearly with the
 * gain and `r = d / (d − d_closed)` closes it to zero at gain `r`; a closure
 * weight `w` applies gain `w · r`, so `w = 1` seals and a partial weight closes
 * that fraction of the current aperture without overshoot. An aperture that
 * is already closed or reversed (`d ≤ 0`) needs no closure and gives zero. A
 * closure endpoint that does not narrow this aperture cannot seal it, and the
 * state refuses by name rather than clamping.
 *
 * @author Samchon
 */
export function measureHumanFaceClosureRatio(
  basis: IAutoMovieHumanFaceBasis,
  contact: IAutoMovieHumanFaceBasisContact,
  rest: readonly (readonly number[])[],
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
  up: IAutoMovieVector3,
  pair: IAutoMovieHumanFaceMidlinePair,
): number {
  const index = basis.surfaces.findIndex(
    (surface) => surface.id === contact.lips.surface,
  );
  const surface = basis.surfaces[index];
  const positions = rest[index];
  const endpoint = basis.channels.find(
    (channel) => channel.id === contact.closure.channel,
  )!.positive;
  const rows = surface.targets[endpoint] ?? [];
  const at = (vertex: number, gain: number) => {
    const local = positions.slice(3 * vertex, 3 * vertex + 3);
    if (gain !== 0)
      for (let i = 0; i < rows.length; i += 4)
        if (rows[i] === vertex)
          for (let axis = 0; axis < 3; axis++)
            local[axis] += gain * rows[i + axis + 1];
    return poseHumanFaceVertex(surface, vertex, local, motions);
  };
  const aperture = (gain: number) =>
    measureHumanFaceApertureGap(at(pair.upper, gain), at(pair.lower, gain), up);
  const current = aperture(0);
  if (!(current > 0)) return 0;
  const narrowing = current - aperture(1);
  if (!(narrowing > 0) || !Number.isFinite(narrowing))
    throw new Error(
      `The closure channel ${contact.closure.channel} does not narrow the ${(current * 1000).toFixed(2)} mm lip aperture between vertices ${pair.upper} and ${pair.lower}, so it cannot seal them.`,
    );
  return current / narrowing;
}
