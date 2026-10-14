import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceMidlinePair } from "../structures/IAutoMovieHumanFaceMidlinePair";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { poseHumanFaceVertex } from "./poseHumanFaceVertex";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported, IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported } from "../../index";


/**
 * The closure gain per unit closure weight that brings one vermilion pair of
 * the contact's lips surface to projected pair contact in the affine model.
 * Represented arithmetic and later geometry still require actual admission.
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
 * @evidence contracts/common.md#principled-implementation At fixed admitted rigid motions, linear-blend posing is affine in rest position, so the current pair gap divided by its unit-gain narrowing gives the central closing gain. Matching source rows/rest arrays come from native closure callers; floating error and nonlinear later contact/refinement remain separate verification concerns.
 * @evidence contracts/common.md#clear-and-simple-design A local point evaluator and aperture evaluator compare gains zero/one for one registered pair; per-margin propagation and source-native field solving remain with their closure owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Already nonpositive projected gaps return zero, while a nonpositive or nonfinite narrowing refuses instead of manufacturing a seal. A central affine ratio does not prove an entire margin or clinically valid simultaneous motion.
 * @evidence contracts/common.md#meaningful-documentation Prose gives the ratio equation, closure-weight scaling, fixed-motion premise, signed already-closed behavior and refusal when the endpoint cannot narrow the pair.
 * @evidence contracts/performance.md#efficient-algorithms Source/channel lookup scans their populations; each of four posed point evaluations reads its attachment rows, and gain-one evaluations scan the sparse closure rows. No full rest surface is duplicated, only three-coordinate slices.
 * @evidence contracts/performance.md#reuse-equivalent-work The closure endpoint and resident rest surface are resolved once, and current native motions serve both gain samples. The central ratio is returned for reuse by the enclosing closure stage, with no cross-pose cache here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local point arrays/vectors become collectible on return/refusal and only the gain scalar transfers. No basis buffer, iteration history, task or external handle is retained.
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
  const index: number = basis.surfaces.findIndex(
    (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean  => surface.id === contact.lips.surface,
  );
  const surface: IAutoMovieHumanFaceBasisSurfaceImported = basis.surfaces[index];
  const positions: readonly number[] = rest[index];
  const endpoint: string = basis.channels.find(
    (channel: IAutoMovieHumanFaceBasisChannelImported): boolean  => channel.id === contact.closure.channel,
  )!.positive;
  const rows: number[] = surface.targets[endpoint] ?? [];
  const at: (vertex: number, gain: number) => IAutoMovieVector3 = (vertex: number, gain: number): IAutoMovieVector3  => {
    const local: number[] = positions.slice(3 * vertex, 3 * vertex + 3);
    if (gain !== 0)
      for (let i: number = 0; i < rows.length; i += 4)
        if (rows[i] === vertex)
          for (let axis: number = 0; axis < 3; axis++)
            local[axis] += gain * rows[i + axis + 1];
    return poseHumanFaceVertex(surface, vertex, local, motions);
  };
  const aperture: (gain: number) => number = (gain: number): number  =>
    measureHumanFaceApertureGap(at(pair.upper, gain), at(pair.lower, gain), up);
  const current: number = aperture(0);
  if (!(current > 0)) return 0;
  const narrowing: number = current - aperture(1);
  if (!(narrowing > 0) || !Number.isFinite(narrowing))
    throw new Error(
      `The closure channel ${contact.closure.channel} does not narrow the ${(current * 1000).toFixed(2)} mm lip aperture between vertices ${pair.upper} and ${pair.lower}, so it cannot seal them.`,
    );
  return current / narrowing;
}
