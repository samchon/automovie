import type { IHumanFaceHairLayerPart as ImportedIHumanFaceHairLayerPart } from "../../structures/IHumanFaceHairLayerPart";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairLength } from "./humanFaceHairLength";

/** A guide: its posed root, its neutral chart point and its integrated curve. */
type Guide = {
  root: IAutoMovieVector3;
  reference: IAutoMovieVector3;
  points: readonly IAutoMovieVector3[];
};

/** A root to interpolate: posed seat, neutral chart point, sample identity, seat normal. */
type StrandRoot = {
  root: IAutoMovieVector3;
  reference: IAutoMovieVector3;
  sequence: number;
  normal: IAutoMovieVector3;
};

/**
 * Interpolate guide displacements at equal arc fractions into owned strand curves, then apply own-root regional length and optional clumping. Candidate guides first respect the part-side gate, but an empty gated pool currently falls back to all guides. No contact query occurs here: the later canonical stem and remainder placement must establish feasibility, and inherited guide clearance alone is not guaranteed between guides. Post-clump metric is measured from the resulting polyline.
 *
 * @evidence contracts/common.md#principled-implementation Nearest guide displacements blend at equal arc fractions, scale to each root's own length and optionally clump toward its nearest guide.
 * @evidence contracts/common.md#clear-and-simple-design Hierarchy preparation is separate from later canonical rooted transition and remainder contact admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No contact proof occurs here; an empty same-side pool currently falls back to all guides, and interpolation can violate inherited guide clearance.
 * @evidence contracts/common.md#meaningful-documentation Post-clump length is measured from the actual resulting polyline while unclumped target remains its regional metre length.
 * @evidence contracts/performance.md#efficient-algorithms Spacing is O(g squared); each strand sorts O(g log g) candidates and samples selected guide arcs by binary searches per station.
 * @evidence contracts/performance.md#reuse-equivalent-work Guide cumulative lengths and side classifications are compiled once for all strands in the call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned output points scale with strands times selected station count; sampled-guide closures retain borrowed guides only during this call.
 */
export function interpolateHumanFaceHairStrands(props: {
  layer: IAutoMovieHumanFaceHair.Layer;
  origin: IAutoMovieVector3;
  guides: readonly Guide[];
  strands: readonly StrandRoot[];
}): {
  points: IAutoMovieVector3[];
  length: number;
  normal: IAutoMovieVector3;
}[] {
  const { layer, guides }: { layer: IAutoMovieHumanFaceHair.Layer; origin: IAutoMovieVector3; guides: readonly Guide[]; strands: readonly StrandRoot[]; } = props;
  if (guides.length === 0)
    throw new Error("Hair strands need at least one guide to follow.");
  // The spacing is quadratic in guides; a flat layer interpolates nothing.
  if (props.strands.length === 0) return [];
  const neighbours: number = layer.guides?.neighbours ?? 1;
  const distance: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));
  let spacing: number = 0;
  if (guides.length > 1) {
    for (const guide of guides) {
      let nearest: number = Infinity;
      for (const other of guides)
        if (other !== guide)
          nearest = Math.min(nearest, distance(guide.root, other.root));
      spacing += nearest;
    }
    spacing /= guides.length;
  }
  if (!Number.isFinite(spacing) || (guides.length > 1 && spacing <= 0))
    throw new Error("Hair guides need a positive mean spacing.");
  const part: ImportedIHumanFaceHairLayerPart | undefined = layer.part;
  const side: (reference: IAutoMovieVector3) => number = (reference: IAutoMovieVector3): number => {
    if (part === undefined) return 0;
    const axis: IAutoMovieVector3 = Vector3.normalize(Vector3.create(...part.normal));
    const offset: number = Vector3.dot(reference, axis) - part.offset;
    return Math.abs(offset) < part.transitionWidth ? 0 : Math.sign(offset);
  };
  const sampled: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }[] = guides.map((guide: { root: IAutoMovieVector3; reference: IAutoMovieVector3; points: readonly IAutoMovieVector3[]; }): { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; } => {
    const cumulative: number[] = [0];
    for (let at: number = 1; at < guide.points.length; at++)
      cumulative.push(
        cumulative[at - 1] + distance(guide.points[at], guide.points[at - 1]),
      );
    const total: number = cumulative[cumulative.length - 1];
    if (!(total > 0) || !Number.isFinite(total))
      throw new Error("A hair guide needs a finite positive length.");
    return {
      guide,
      side: side(guide.reference),
      at(fraction: number): IAutoMovieVector3 {
        const target: number = fraction * total;
        let low: number = 0;
        let high: number = cumulative.length - 1;
        while (high - low > 1) {
          const middle: number = Math.floor((low + high) / 2);
          if (cumulative[middle] <= target) low = middle;
          else high = middle;
        }
        const span: number = cumulative[high] - cumulative[low];
        const t: number = span > 0 ? (target - cumulative[low]) / span : 0;
        return Vector3.subtract(
          Vector3.add(
            Vector3.scale(guide.points[low], 1 - t),
            Vector3.scale(guide.points[high], t),
          ),
          guide.points[0],
        );
      },
    };
  });
  return props.strands.map((strand: { root: IAutoMovieVector3; reference: IAutoMovieVector3; sequence: number; normal: IAutoMovieVector3; }): { points: IAutoMovieVector3[]; length: number; normal: { x: number; y: number; z: number; }; } => {
    const own: number = side(strand.reference);
    const candidates: { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }[] = sampled
      .filter((entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }): boolean => own === 0 || entry.side === 0 || entry.side === own)
      .map((entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }): { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; } => ({ entry, d: distance(strand.root, entry.guide.root) }))
      .sort((a: { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }, b: { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }): number => a.d - b.d);
    const pool: { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }[] =
      candidates.length > 0
        ? candidates
        : sampled
            .map((entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }): { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; } => ({
              entry,
              d: distance(strand.root, entry.guide.root),
            }))
            .sort((a: { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }, b: { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }): number => a.d - b.d);
    let chosen: { weight: number; entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }[] = pool
      .slice(0, neighbours)
      .filter((one: { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }): boolean => guides.length === 1 || one.d <= 2 * spacing)
      .map((one: { entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }): { weight: number; entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; } => ({
        ...one,
        weight: guides.length === 1 ? 1 : Math.exp(-one.d / spacing),
      }));
    if (chosen.length === 0) chosen = [{ ...pool[0], weight: 1 }];
    const total: number = chosen.reduce((sum: number, one: { weight: number; entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }): number => sum + one.weight, 0);
    const stations: number = Math.max(
      ...chosen.map((one: { weight: number; entry: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; }; d: number; }): number => one.entry.guide.points.length),
    );
    const offsets: IAutoMovieVector3[] = [];
    let blended: number = 0;
    for (let at: number = 0; at < stations; at++) {
      const fraction: number = at / (stations - 1);
      let offset: IAutoMovieVector3 = Vector3.create();
      for (const one of chosen)
        offset = Vector3.add(
          offset,
          Vector3.scale(one.entry.at(fraction), one.weight / total),
        );
      if (at > 0) blended += distance(offset, offsets[at - 1]);
      offsets.push(offset);
    }
    if (!(blended > 0) || !Number.isFinite(blended))
      throw new Error("Blended hair guides collapsed to no length.");
    const length: number = humanFaceHairLength(
      layer,
      props.origin,
      strand.reference,
      strand.sequence,
    );
    const scale: number = length / blended;
    // Clumping pulls a strand toward its nearest guide's own station at the
    // same arc fraction, by the clump amount times that fraction: nothing at
    // the root, the whole amount at the tip, the linear profile of a groom's
    // clump operator. The guide is the strand's clump centre.
    const clump: number = layer.guides?.clump ?? 0;
    const centre: { guide: Guide; side: number; at(fraction: number): IAutoMovieVector3; } = chosen[0].entry;
    const points: IAutoMovieVector3[] = offsets.map((offset: IAutoMovieVector3, at: number): IAutoMovieVector3 => {
      const own: IAutoMovieVector3 = Vector3.add(strand.root, Vector3.scale(offset, scale));
      if (clump === 0) return own;
      const fraction: number = at / (offsets.length - 1);
      const target: IAutoMovieVector3 = Vector3.add(centre.guide.points[0], centre.at(fraction));
      return Vector3.add(
        own,
        Vector3.scale(Vector3.subtract(target, own), clump * fraction),
      );
    });
    let travelled: number = 0;
    for (let at: number = 1; at < points.length; at++)
      travelled += distance(points[at], points[at - 1]);
    return {
      points,
      length: clump === 0 ? length : travelled,
      normal: { ...strand.normal },
    };
  });
}
