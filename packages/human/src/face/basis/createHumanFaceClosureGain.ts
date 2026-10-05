import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceClosureGain } from "./IHumanFaceClosureGain";
import { measureHumanFaceClosureRatio } from "./measureHumanFaceClosureRatio";
import { poseHumanFaceVertex } from "./poseHumanFaceVertex";

/** Fixed-point passes re-reading a chain vertex's place along the axis after its gain changes. */
const PASSES = 4;

/** Opening-direction motion per unit gain below which a chain vertex counts as unmoved, metres (0.1 micrometre). */
const MOVABLE_METRES = 1e-7;

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
 * down onto it. Lowering an upper vertex only turns contact at the lower
 * vertices into overlap, so after both steps no point of either chain is left
 * open. Posing is affine in rest position, so a vertex's height is affine in
 * its gain and each gain is exact; its position along the axis is re-read for
 * a few fixed-point passes. Every other vertex of the lips surface takes the
 * inverse-square-distance mean of the chain gains, blending to the central
 * gain at the surface's declared soft-tissue budget distance from the nearest
 * chain vertex (a stated convention reusing the tissue extent the contact
 * stage may push), and every other surface keeps the central gain, so the
 * mandible moves rigidly. A chain vertex the closure rows do not move along
 * the opening direction, or one moved farther from the central closure than
 * that budget, refuses by name with where it lies.
 *
 * @evidence contracts/common.md#principled-implementation A vertex's posed height is affine in its gain because posing is affine in rest position, so each gain puts its vertex exactly on the other chain; taking the upper chain as the contact line removes the free shift two mutually referenced chains would leave, and lowering upper vertices afterwards can only add overlap, never a gap.
 * @evidence contracts/common.md#clear-and-simple-design Two per-vertex passes over the registered chains, a smooth blend elsewhere on the lips surface, the central gain on every other surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No budget or tolerance is raised; an unmoved or over-budget chain vertex refuses by name.
 * @evidence contracts/common.md#meaningful-documentation States the contact line, the two passes, why no gap remains, the fixed-point re-read, the blend and its stated distance convention, and the refusals.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The field names no part.
 * @evidence contracts/modeling.md#parameter-channels The closure channel keeps one meaning along the whole margin: weight one is contact.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator applies the gains.
 * @evidence contracts/modeling.md#spatial-conventions Positions along the mandibular axis and heights along the opening direction, in basis metres.
 * @evidence contracts/modeling.md#shared-boundaries The upper and lower vermilion meet along the registered margin chains.
 * @evidenceExclude contracts/modeling.md#rendered-observation The summary reports the final apertures.
 * @evidence contracts/anatomy.md#anatomical-source Lip seal is contact along the whole vermilion margin; the requirement defines weight one as seal.
 * @evidence contracts/anatomy.md#permitted-range The extra displacement at a chain vertex is bounded by the lips surface's declared soft-tissue budget, beyond which the state refuses.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The gains are derived, not an input.
 * @author Samchon
 */
export function createHumanFaceClosureGain(
  basis: IAutoMovieHumanFaceBasis,
  contact: IAutoMovieHumanFaceBasisContact,
  rest: readonly (readonly number[])[],
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
  up: IAutoMovieVector3,
): IHumanFaceClosureGain {
  const index = basis.surfaces.findIndex((surface) => surface.id === contact.lips.surface);
  const surface = basis.surfaces[index];
  const positions = rest[index];
  const count = positions.length / 3;
  const ratio = measureHumanFaceClosureRatio(basis, contact, rest, motions, up, contact.lips);
  const lips = new Float64Array(count).fill(ratio);
  if (contact.margin === undefined) return { ratio, lips };

  const axis = basis.articulation!.jaw.axis;
  const endpoint = basis.channels.find(
    (channel) => channel.id === contact.closure.channel,
  )!.positive;
  const rows = surface.targets[endpoint] ?? [];
  const delta = new Float64Array(3 * count);
  for (let i = 0; i < rows.length; i += 4)
    for (let k = 0; k < 3; k++) delta[3 * rows[i] + k] = rows[i + 1 + k];
  const budget =
    contact.soft.find((entry) => entry.surface === contact.lips.surface)?.budgetMetres ?? 0;

  // posed position at gains 0 and 1 of every chain vertex: along and height
  // the central pair belongs to the margin: each chain takes its vertex, in order along the axis
  const restAlong = (vertex: number) =>
    positions[3 * vertex] * axis[0] + positions[3 * vertex + 1] * axis[1] + positions[3 * vertex + 2] * axis[2];
  const withCentre = (chain: readonly number[], vertex: number) =>
    (chain.includes(vertex) ? [...chain] : [...chain, vertex]).sort((a, b) => restAlong(a) - restAlong(b));
  const upperChain = withCentre(contact.margin.upper, contact.lips.upper);
  const lowerChain = withCentre(contact.margin.lower, contact.lips.lower);
  const chains = [upperChain, lowerChain];
  const nodes = chains.flat();
  const column = new Map(nodes.map((vertex, at) => [vertex, at]));
  const along0: number[] = [];
  const alongD: number[] = [];
  const height0: number[] = [];
  const heightD: number[] = [];
  for (const vertex of nodes) {
    const local = positions.slice(3 * vertex, 3 * vertex + 3);
    const p0 = poseHumanFaceVertex(surface, vertex, local, motions);
    const p1 = poseHumanFaceVertex(
      surface,
      vertex,
      local.map((value, k) => value + delta[3 * vertex + k]),
      motions,
    );
    const a0 = p0.x * axis[0] + p0.y * axis[1] + p0.z * axis[2];
    const a1 = p1.x * axis[0] + p1.y * axis[1] + p1.z * axis[2];
    const h0 = p0.x * up.x + p0.y * up.y + p0.z * up.z;
    const h1 = p1.x * up.x + p1.y * up.y + p1.z * up.z;
    along0.push(a0);
    alongD.push(a1 - a0);
    height0.push(h0);
    heightD.push(h1 - h0);
  }
  const size = nodes.length;
  const gains = new Float64Array(size).fill(ratio);
  const along = (at: number) => along0[at] + gains[at] * alongD[at];
  const height = (at: number) => height0[at] + gains[at] * heightD[at];
  // height of a chain's polyline at a position along the axis (nearest end beyond it)
  const across = (chain: readonly number[], at: number): number => {
    const ends = [column.get(chain[0])!, column.get(chain[chain.length - 1])!];
    const ascending = along(ends[1]) >= along(ends[0]);
    const before = (a: number, b: number) => (ascending ? a <= b : a >= b);
    if (before(at, along(ends[0]))) return height(ends[0]);
    if (before(along(ends[1]), at)) return height(ends[1]);
    for (let j = 0; j + 1 < chain.length; j++) {
      const a = column.get(chain[j])!;
      const b = column.get(chain[j + 1])!;
      if (before(along(a), at) && before(at, along(b)))
        return along(b) === along(a)
          ? height(a)
          : height(a) + ((at - along(a)) * (height(b) - height(a))) / (along(b) - along(a));
    }
    return height(ends[1]);
  };
  // the gain that puts one chain vertex at a target height read at its own place along the axis
  const reach = (at: number, target: (position: number) => number): number => {
    let gain = gains[at];
    for (let pass = 0; pass < PASSES; pass++) {
      const want = target(along0[at] + gain * alongD[at]);
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
    const at = column.get(vertex)!;
    gains[at] = reach(at, (position) => across(upperChain, position));
  }
  // 2. an upper vertex left above the lower chain comes down onto it; lowering
  // the upper chain only turns contact at the lower vertices into overlap
  for (const vertex of upperChain) {
    const at = column.get(vertex)!;
    if (height(at) > across(lowerChain, along(at)))
      gains[at] = reach(at, (position) => across(lowerChain, position));
  }
  nodes.forEach((vertex, at) => {
    const reach = Math.hypot(delta[3 * vertex], delta[3 * vertex + 1], delta[3 * vertex + 2]);
    const extra = Math.abs(gains[at] - ratio) * reach;
    if (extra > budget)
      throw new Error(
        `The lip margin vertex ${vertex} at ${(along0[at] * 1000).toFixed(1)} mm along the mandibular axis needs ${(extra * 1000).toFixed(2)} mm beyond the central closure, more than the ${(budget * 1000).toFixed(2)} mm tissue budget of ${contact.lips.surface}.`,
      );
  });

  for (let vertex = 0; vertex < count; vertex++) {
    if (delta[3 * vertex] === 0 && delta[3 * vertex + 1] === 0 && delta[3 * vertex + 2] === 0)
      continue;
    const own = column.get(vertex);
    if (own !== undefined) {
      lips[vertex] = gains[own];
      continue;
    }
    let nearest = Infinity;
    let weights = 0;
    let sum = 0;
    nodes.forEach((node, at) => {
      const distance = Math.hypot(
        positions[3 * vertex] - positions[3 * node],
        positions[3 * vertex + 1] - positions[3 * node + 1],
        positions[3 * vertex + 2] - positions[3 * node + 2],
      );
      nearest = Math.min(nearest, distance);
      const weight = 1 / (distance * distance);
      weights += weight;
      sum += weight * gains[at];
    });
    const blend = budget > 0 ? Math.max(0, 1 - nearest / budget) : 0;
    lips[vertex] = ratio + blend * (sum / weights - ratio);
  }
  return { ratio, lips };
}

