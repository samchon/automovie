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
 * Grow the strands of a layer from its guides instead of integrating each
 * one: a strand takes its `neighbours` nearest guides on its own side of the
 * part, weighted by `exp(-d / spacing)` over the scalp distance `d` between
 * roots and cut off at twice the spacing, where the spacing is the guides'
 * own mean nearest-guide distance; a strand no guide reaches within that
 * radius follows its single nearest guide. The guides' displacements from
 * their roots are blended at equal arc-length fractions, and the blend is
 * scaled to the strand's own regional length, so two guides of different
 * lengths give a strand of its own length rather than a compromise.
 * Optional `clump` then pulls each station toward the nearest guide's
 * station at the same arc fraction by the clump amount times that fraction,
 * so strands leave the scalp apart and gather into their guide toward the
 * tips; the reported length is then the clumped curve's own.
 *
 * This is the guide interpolation of a hair hierarchy (Houdini's skin
 * coordinate weights, the Disney volume-to-guide-to-strand tree) with the
 * part as a gate that blocks the other side, and it touches no contact
 * query: a strand inherits the clearance its guides were integrated with.
 * Whether that inherited clearance holds between guides is what the crossing
 * census measures, not what this function guarantees.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Grows every strand from shared guides by a scalp-distance rule, storing no strand coordinates.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Interpolates strands from their nearest same-side guides at equal arc-length fractions and scales them to their own length.
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
  const { layer, guides } = props;
  if (guides.length === 0)
    throw new Error("Hair strands need at least one guide to follow.");
  // The spacing is quadratic in guides; a flat layer interpolates nothing.
  if (props.strands.length === 0) return [];
  const neighbours = layer.guides?.neighbours ?? 1;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));
  let spacing = 0;
  if (guides.length > 1) {
    for (const guide of guides) {
      let nearest = Infinity;
      for (const other of guides)
        if (other !== guide)
          nearest = Math.min(nearest, distance(guide.root, other.root));
      spacing += nearest;
    }
    spacing /= guides.length;
  }
  if (!Number.isFinite(spacing) || (guides.length > 1 && spacing <= 0))
    throw new Error("Hair guides need a positive mean spacing.");
  const part = layer.part;
  const side = (reference: IAutoMovieVector3): number => {
    if (part === undefined) return 0;
    const axis = Vector3.normalize(Vector3.create(...part.normal));
    const offset = Vector3.dot(reference, axis) - part.offset;
    return Math.abs(offset) < part.transitionWidth ? 0 : Math.sign(offset);
  };
  const sampled = guides.map((guide) => {
    const cumulative = [0];
    for (let at = 1; at < guide.points.length; at++)
      cumulative.push(
        cumulative[at - 1] + distance(guide.points[at], guide.points[at - 1]),
      );
    const total = cumulative[cumulative.length - 1];
    if (!(total > 0) || !Number.isFinite(total))
      throw new Error("A hair guide needs a finite positive length.");
    return {
      guide,
      side: side(guide.reference),
      at(fraction: number): IAutoMovieVector3 {
        const target = fraction * total;
        let low = 0;
        let high = cumulative.length - 1;
        while (high - low > 1) {
          const middle = Math.floor((low + high) / 2);
          if (cumulative[middle] <= target) low = middle;
          else high = middle;
        }
        const span = cumulative[high] - cumulative[low];
        const t = span > 0 ? (target - cumulative[low]) / span : 0;
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
  return props.strands.map((strand) => {
    const own = side(strand.reference);
    const candidates = sampled
      .filter((entry) => own === 0 || entry.side === 0 || entry.side === own)
      .map((entry) => ({ entry, d: distance(strand.root, entry.guide.root) }))
      .sort((a, b) => a.d - b.d);
    const pool =
      candidates.length > 0
        ? candidates
        : sampled
            .map((entry) => ({
              entry,
              d: distance(strand.root, entry.guide.root),
            }))
            .sort((a, b) => a.d - b.d);
    let chosen = pool
      .slice(0, neighbours)
      .filter((one) => guides.length === 1 || one.d <= 2 * spacing)
      .map((one) => ({
        ...one,
        weight: guides.length === 1 ? 1 : Math.exp(-one.d / spacing),
      }));
    if (chosen.length === 0) chosen = [{ ...pool[0], weight: 1 }];
    const total = chosen.reduce((sum, one) => sum + one.weight, 0);
    const stations = Math.max(
      ...chosen.map((one) => one.entry.guide.points.length),
    );
    const offsets: IAutoMovieVector3[] = [];
    let blended = 0;
    for (let at = 0; at < stations; at++) {
      const fraction = at / (stations - 1);
      let offset = Vector3.create();
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
    const length = humanFaceHairLength(
      layer,
      props.origin,
      strand.reference,
      strand.sequence,
    );
    const scale = length / blended;
    // Clumping pulls a strand toward its nearest guide's own station at the
    // same arc fraction, by the clump amount times that fraction: nothing at
    // the root, the whole amount at the tip, the linear profile of a groom's
    // clump operator. The guide is the strand's clump centre.
    const clump = layer.guides?.clump ?? 0;
    const centre = chosen[0].entry;
    const points = offsets.map((offset, at) => {
      const own = Vector3.add(strand.root, Vector3.scale(offset, scale));
      if (clump === 0) return own;
      const fraction = at / (offsets.length - 1);
      const target = Vector3.add(centre.guide.points[0], centre.at(fraction));
      return Vector3.add(
        own,
        Vector3.scale(Vector3.subtract(target, own), clump * fraction),
      );
    });
    let travelled = 0;
    for (let at = 1; at < points.length; at++)
      travelled += distance(points[at], points[at - 1]);
    return {
      points,
      length: clump === 0 ? length : travelled,
      normal: { ...strand.normal },
    };
  });
}
