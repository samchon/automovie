import type { IAutoMovieVector3 } from "@automovie/interface";

import type {
  IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported,
  IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported,
  IAutoMovieHumanFaceContactSoftSurface as IAutoMovieHumanFaceContactSoftSurfaceImported,
} from "../../index";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceClosureGain } from "./IHumanFaceClosureGain";
import { createHumanFaceNativeClosureGain } from "./createHumanFaceNativeClosureGain";
import { measureHumanFaceClosureRatio } from "./measureHumanFaceClosureRatio";
import { poseHumanFaceVertex } from "./poseHumanFaceVertex";

/** Fixed-point passes re-reading a chain vertex's place along the axis after its gain changes. */
const PASSES: number = 4;

/** Opening-direction motion per unit gain below which a chain vertex counts as unmoved, metres (0.1 micrometre). */
const MOVABLE_METRES: number = 1e-7;

/**
 * The closure gains that bring the whole vermilion margin to contact at
 * closure weight one.
 *
 * Without registered margin chains the gain is the central pair's
 * (`measureHumanFaceClosureRatio`) everywhere. With them, the upper chain
 * follows the central closure and is the contact line: each lower chain vertex
 * takes the gain that puts it on the upper chain's polyline (its height along
 * the opening direction equals the upper polyline's height at its own position
 * along the mandibular axis, the nearest end beyond the chain), then each upper
 * vertex still above the lower chain's polyline takes the gain that brings it
 * down onto it. Posing is affine in rest position, so a vertex's height is
 * affine in its gain at a fixed target, but four fixed-point passes do not
 * prove convergence when its along coordinate or the opposite chain changes.
 * Actual margin measurements remain the acceptance evidence. Material courses
 * use createHumanFaceNativeClosureGain to constrain their shared native gain
 * field and verify posed/refined contact. Every other vertex of the legacy
 * lips surface takes the
 * inverse-square-distance mean of the chain gains, blending to the central
 * gain at the surface's declared soft-tissue budget distance from the nearest
 * chain vertex (a stated convention reusing the tissue extent the contact
 * stage may push), and every other surface keeps the central gain, so the
 * mandible moves rigidly. A chain vertex the closure rows do not move along
 * the opening direction, or one moved farther from the central closure than
 * that budget, refuses by name with where it lies.
 *
 * @evidence contracts/common.md#principled-implementation Admitted closure rows are posed affinely at gains zero/one, giving the central aperture ratio and each margin node's height response. Legacy chains use four bracket-rereading passes and inverse-distance propagation; material courses delegate to the native field solver. Moving brackets prevent a convergence proof, so actual margin/contact admission remains necessary.
 * @evidence contracts/common.md#clear-and-simple-design Central ratio, optional legacy chains and native-course delegation belong to the closure owner; returned per-vertex gains keep the later native pose stage independent from how the registered margin is represented.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Four passes and the 0.1 micrometre movable threshold are explicit numerical conventions, and the soft-tissue budget bounds deviation from central closure. They establish no universal anatomical seal or convergence; an unmoved registered node or over-budget displacement refuses.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre units, nearest-end extension, central versus margin behavior, propagation budget, fixed-point limitations and the material-course path.
 * @evidence contracts/performance.md#efficient-algorithms Legacy work fills V gains, sorts M margin nodes and scans opposite-chain brackets during fixed passes, up to O(M squared), then propagates over V vertices against M nodes in O(VM). Native-course costs include its shared-field solver and final replay verification; no measured speed claim is made.
 * @evidence contracts/performance.md#reuse-equivalent-work Each node's posed zero/one along and height coefficients are computed once, and the node-to-column map serves gain lookup throughout. The returned field is specific to this rest/motion/contact request and is not reused across changed poses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-call typed gain/delta arrays and margin tables are O(V+M); only the completed gain array and scalar transfer to the native pose caller. No iteration history, external handle or work survives a thrown request.
 *
 * @author Samchon
 */
export function createHumanFaceClosureGain(
  basis: IAutoMovieHumanFaceBasis,
  contact: IAutoMovieHumanFaceBasisContact,
  rest: readonly (readonly number[])[],
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
  up: IAutoMovieVector3,
): IHumanFaceClosureGain {
  const index: number = basis.surfaces.findIndex(
    (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean =>
      surface.id === contact.lips.surface,
  );
  const surface: IAutoMovieHumanFaceBasisSurfaceImported =
    basis.surfaces[index];
  const positions: readonly number[] = rest[index];
  const count: number = positions.length / 3;
  const ratio: number = measureHumanFaceClosureRatio(
    basis,
    contact,
    rest,
    motions,
    up,
    contact.lips,
  );
  const lips: Float64Array<ArrayBuffer> = new Float64Array(count).fill(ratio);
  if (contact.margin === undefined) return { ratio, lips };

  const axis: [number, number, number] = basis.articulation!.jaw.axis;
  const endpoint: string = basis.channels.find(
    (channel: IAutoMovieHumanFaceBasisChannelImported): boolean =>
      channel.id === contact.closure.channel,
  )!.positive;
  const rows: number[] = surface.targets[endpoint] ?? [];
  const delta: Float64Array<ArrayBuffer> = new Float64Array(3 * count);
  for (let i: number = 0; i < rows.length; i += 4)
    for (let k: number = 0; k < 3; k++)
      delta[3 * rows[i] + k] = rows[i + 1 + k];
  const budget: number =
    contact.soft.find(
      (entry: IAutoMovieHumanFaceContactSoftSurfaceImported): boolean =>
        entry.surface === contact.lips.surface,
    )?.budgetMetres ?? 0;
  if (contact.margin.kind === "material")
    return {
      ratio,
      lips: createHumanFaceNativeClosureGain({
        surface,
        contact,
        positions,
        motions,
        up,
        ratio,
        delta,
        budget,
        axis,
        movableMetres: MOVABLE_METRES,
      }),
    };

  // posed position at gains 0 and 1 of every chain vertex: along and height
  // the central pair belongs to the margin: each chain takes its vertex, in order along the axis
  const restAlong: (vertex: number) => number = (vertex: number): number =>
    positions[3 * vertex] * axis[0] +
    positions[3 * vertex + 1] * axis[1] +
    positions[3 * vertex + 2] * axis[2];
  const withCentre: (chain: readonly number[], vertex: number) => number[] = (
    chain: readonly number[],
    vertex: number,
  ): number[] =>
    (chain.includes(vertex) ? [...chain] : [...chain, vertex]).sort(
      (a: number, b: number): number => restAlong(a) - restAlong(b),
    );
  const upperChain: number[] = withCentre(
    contact.margin.upper,
    contact.lips.upper,
  );
  const lowerChain: number[] = withCentre(
    contact.margin.lower,
    contact.lips.lower,
  );
  const chains: number[][] = [upperChain, lowerChain];
  const nodes: number[] = chains.flat();
  const column: Map<number, number> = new Map(
    nodes.map((vertex: number, at: number): [number, number] => [vertex, at]),
  );
  const along0: number[] = [];
  const alongD: number[] = [];
  const height0: number[] = [];
  const heightD: number[] = [];
  for (const vertex of nodes) {
    const local: number[] = positions.slice(3 * vertex, 3 * vertex + 3);
    const p0: IAutoMovieVector3 = poseHumanFaceVertex(
      surface,
      vertex,
      local,
      motions,
    );
    const p1: IAutoMovieVector3 = poseHumanFaceVertex(
      surface,
      vertex,
      local.map(
        (value: number, k: number): number => value + delta[3 * vertex + k],
      ),
      motions,
    );
    const a0: number = p0.x * axis[0] + p0.y * axis[1] + p0.z * axis[2];
    const a1: number = p1.x * axis[0] + p1.y * axis[1] + p1.z * axis[2];
    const h0: number = p0.x * up.x + p0.y * up.y + p0.z * up.z;
    const h1: number = p1.x * up.x + p1.y * up.y + p1.z * up.z;
    along0.push(a0);
    alongD.push(a1 - a0);
    height0.push(h0);
    heightD.push(h1 - h0);
  }
  const size: number = nodes.length;
  const gains: Float64Array<ArrayBuffer> = new Float64Array(size).fill(ratio);
  const along: (at: number) => number = (at: number): number =>
    along0[at] + gains[at] * alongD[at];
  const height: (at: number) => number = (at: number): number =>
    height0[at] + gains[at] * heightD[at];
  // height of a chain's polyline at a position along the axis (nearest end beyond it)
  const across: (chain: readonly number[], at: number) => number = (
    chain: readonly number[],
    at: number,
  ): number => {
    const ends: number[] = [
      column.get(chain[0])!,
      column.get(chain[chain.length - 1])!,
    ];
    const ascending: boolean = along(ends[1]) >= along(ends[0]);
    const before: (a: number, b: number) => boolean = (
      a: number,
      b: number,
    ): boolean => (ascending ? a <= b : a >= b);
    if (before(at, along(ends[0]))) return height(ends[0]);
    if (before(along(ends[1]), at)) return height(ends[1]);
    for (let j: number = 0; j + 1 < chain.length; j++) {
      const a: number = column.get(chain[j])!;
      const b: number = column.get(chain[j + 1])!;
      if (before(along(a), at) && before(at, along(b)))
        return along(b) === along(a)
          ? height(a)
          : height(a) +
              ((at - along(a)) * (height(b) - height(a))) /
                (along(b) - along(a));
    }
    return height(ends[1]);
  };
  // the gain that puts one chain vertex at a target height read at its own place along the axis
  const reach: (at: number, target: (position: number) => number) => number = (
    at: number,
    target: (position: number) => number,
  ): number => {
    let gain: number = gains[at];
    for (let pass: number = 0; pass < PASSES; pass++) {
      const want: number = target(along0[at] + gain * alongD[at]);
      if (!(Math.abs(heightD[at]) > MOVABLE_METRES))
        throw new Error(
          `The closure channel ${contact.closure.channel} does not move lip margin vertex ${nodes[at]} along the opening direction, so it cannot bring it to contact.`,
        );
      gain = (want - height0[at]) / heightD[at];
    }
    return gain;
  };
  // 1. the lower chain meets the upper chain, which follows the central closure
  for (const vertex of lowerChain) {
    const at: number = column.get(vertex)!;
    gains[at] = reach(at, (position: number): number =>
      across(upperChain, position),
    );
  }
  // 2. re-read an upper vertex left above the current lower polyline. Changes
  // to along coordinates can change brackets; this pass proves no seal.
  for (const vertex of upperChain) {
    const at: number = column.get(vertex)!;
    if (height(at) > across(lowerChain, along(at)))
      gains[at] = reach(at, (position: number): number =>
        across(lowerChain, position),
      );
  }
  nodes.forEach((vertex: number, at: number): void => {
    const reach: number = Math.hypot(
      delta[3 * vertex],
      delta[3 * vertex + 1],
      delta[3 * vertex + 2],
    );
    const extra: number = Math.abs(gains[at] - ratio) * reach;
    if (extra > budget)
      throw new Error(
        `The lip margin vertex ${vertex} at ${(along0[at] * 1000).toFixed(1)} mm along the mandibular axis needs ${(extra * 1000).toFixed(2)} mm beyond the central closure, more than the ${(budget * 1000).toFixed(2)} mm tissue budget of ${contact.lips.surface}.`,
      );
  });

  for (let vertex: number = 0; vertex < count; vertex++) {
    if (
      delta[3 * vertex] === 0 &&
      delta[3 * vertex + 1] === 0 &&
      delta[3 * vertex + 2] === 0
    )
      continue;
    const own: number | undefined = column.get(vertex);
    if (own !== undefined) {
      lips[vertex] = gains[own];
      continue;
    }
    let nearest: number = Infinity;
    let weights: number = 0;
    let sum: number = 0;
    nodes.forEach((node: number, at: number): void => {
      const distance: number = Math.hypot(
        positions[3 * vertex] - positions[3 * node],
        positions[3 * vertex + 1] - positions[3 * node + 1],
        positions[3 * vertex + 2] - positions[3 * node + 2],
      );
      nearest = Math.min(nearest, distance);
      const weight: number = 1 / (distance * distance);
      weights += weight;
      sum += weight * gains[at];
    });
    const blend: number = budget > 0 ? Math.max(0, 1 - nearest / budget) : 0;
    lips[vertex] = ratio + blend * (sum / weights - ratio);
  }
  return { ratio, lips };
}
