import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisContact } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceClosureGain } from "./IHumanFaceClosureGain";
import type { IHumanFaceClosureNode } from "./IHumanFaceClosureNode";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { measureHumanFaceClosureRatio } from "./measureHumanFaceClosureRatio";
import { poseHumanFaceVertex } from "./poseHumanFaceVertex";

/**
 * The closure gains that bring the central lip pair and every registered
 * margin pair to contact together at closure weight one.
 *
 * Each pair has its own exact gain (`measureHumanFaceClosureRatio`). On the
 * lips surface the gain is a field: along the mandibular axis it interpolates
 * linearly between the pair vertices' own gains (constant beyond the outermost
 * ones), and it blends from that value at the fissure to the central gain at
 * the surface's declared soft-tissue budget distance from the nearest pair
 * vertex, a stated convention reusing the tissue extent the contact stage may
 * push. Every pair vertex therefore takes exactly its pair's gain, so each pair
 * seals at weight one and a fraction closes that fraction of its aperture,
 * while the mandible and every other surface keep the central gain and move
 * rigidly together. Vertices between pairs take interpolated gains and are not
 * guaranteed contact. A pair whose gain moves a vertex farther from the central
 * closure than that budget refuses, naming the pair, where it lies and the
 * aperture it would leave. Without margin pairs the field is the central gain.
 *
 * @evidence contracts/common.md#principled-implementation Posing is affine per vertex, so a vertex scaled by its pair's exact gain reaches contact; the field only interpolates between exact values.
 * @evidence contracts/common.md#clear-and-simple-design One field over the lips surface from the registered pairs, the central gain elsewhere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No budget or tolerance is raised; a pair beyond the tissue budget refuses with its residual.
 * @evidence contracts/common.md#meaningful-documentation States the interpolation, the blend and its stated distance convention, the exactness, its limit between pairs and the refusal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The field names no part.
 * @evidence contracts/modeling.md#parameter-channels The closure channel keeps one meaning at every pair: weight one is margin contact.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator applies the field.
 * @evidence contracts/modeling.md#spatial-conventions Positions along the mandibular axis and distances in basis metres.
 * @evidence contracts/modeling.md#shared-boundaries The upper and lower vermilion meet along the registered margin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The summary reports the final apertures.
 * @evidence contracts/anatomy.md#anatomical-source Lip seal is contact along the vermilion margin; the requirement defines weight one as seal.
 * @evidence contracts/anatomy.md#permitted-range The extra displacement at a pair is bounded by the lips surface's declared soft-tissue budget, beyond which the state refuses.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The field is derived, not an input.
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
  const margin = contact.margin ?? [];
  if (margin.length === 0) return { ratio, lips };

  const axis = basis.articulation!.jaw.axis;
  const along = (vertex: number) =>
    positions[3 * vertex] * axis[0] +
    positions[3 * vertex + 1] * axis[1] +
    positions[3 * vertex + 2] * axis[2];
  const endpoint = basis.channels.find(
    (channel) => channel.id === contact.closure.channel,
  )!.positive;
  const rows = surface.targets[endpoint] ?? [];
  const delta = new Float64Array(count);
  for (let i = 0; i < rows.length; i += 4)
    delta[rows[i]] = Math.hypot(rows[i + 1], rows[i + 2], rows[i + 3]);
  const budget =
    contact.soft.find((entry) => entry.surface === contact.lips.surface)?.budgetMetres ?? 0;

  const nodes: IHumanFaceClosureNode[] = [];
  for (const pair of [{ upper: contact.lips.upper, lower: contact.lips.lower }, ...margin]) {
    const gain = measureHumanFaceClosureRatio(basis, contact, rest, motions, up, {
      surface: contact.lips.surface,
      ...pair,
    });
    const reach = Math.max(delta[pair.upper], delta[pair.lower]);
    const extra = Math.abs(gain - ratio) * reach;
    if (extra > budget) {
      const capped = ratio + (Math.sign(gain - ratio) * budget) / reach;
      const local = (vertex: number) =>
        poseHumanFaceVertex(surface, vertex, positions.slice(3 * vertex, 3 * vertex + 3), motions);
      const aperture = measureHumanFaceApertureGap(local(pair.upper), local(pair.lower), up);
      throw new Error(
        `The lip margin pair ${pair.upper}/${pair.lower} at ${(along(pair.upper) * 1000).toFixed(1)} mm along the mandibular axis needs ${(extra * 1000).toFixed(2)} mm beyond the central closure, more than the ${(budget * 1000).toFixed(2)} mm tissue budget of ${contact.lips.surface}; within it the pair stays ${(aperture * (1 - capped / gain) * 1000).toFixed(2)} mm open.`,
      );
    }
    nodes.push({ vertex: pair.upper, at: along(pair.upper), gain });
    nodes.push({ vertex: pair.lower, at: along(pair.lower), gain });
  }
  nodes.sort((a, b) => a.at - b.at);
  const interpolate = (at: number): number => {
    if (at <= nodes[0].at) return nodes[0].gain;
    if (at >= nodes[nodes.length - 1].at) return nodes[nodes.length - 1].gain;
    let hi = 1;
    while (nodes[hi].at < at) hi++;
    const a = nodes[hi - 1];
    const b = nodes[hi];
    return b.at === a.at ? b.gain : a.gain + ((at - a.at) * (b.gain - a.gain)) / (b.at - a.at);
  };
  const exact = new Map(nodes.map((node) => [node.vertex, node.gain]));
  for (let vertex = 0; vertex < count; vertex++) {
    if (delta[vertex] === 0) continue;
    const fixed = exact.get(vertex);
    if (fixed !== undefined) {
      lips[vertex] = fixed;
      continue;
    }
    let nearest = Infinity;
    for (const node of nodes)
      nearest = Math.min(
        nearest,
        Math.hypot(
          positions[3 * vertex] - positions[3 * node.vertex],
          positions[3 * vertex + 1] - positions[3 * node.vertex + 1],
          positions[3 * vertex + 2] - positions[3 * node.vertex + 2],
        ),
      );
    const weight = budget > 0 ? Math.max(0, 1 - nearest / budget) : 0;
    lips[vertex] = ratio + weight * (interpolate(along(vertex)) - ratio);
  }
  return { ratio, lips };
}
