import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IHumanFaceHairRootPopulation } from "./IHumanFaceHairRootPopulation";
import type { IHumanFaceHairRootSamplingProps } from "./IHumanFaceHairRootSamplingProps";
import type { IHumanFaceHairSampledRoot } from "./IHumanFaceHairSampledRoot";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairSequence } from "./humanFaceHairSequence";
import { humanFaceHairlineBoundary } from "./humanFaceHairlineBoundary";

/**
 * Compile the neutral area measure of one shared anatomical growth domain. The numerical hair builder supplies admitted surface triangles and a finite chart origin, then calls the returned sampler with an admitted layer. Roots remain barycentric attachments to that surface when a face changes shape. No generated root or curve becomes personal authored data.
 *
 * Triangle selection uses an area CDF; square-root barycentric sampling is uniform within the selected triangle. The bases 2, 3 and 5 of a Halton sequence supply those three coordinates. Sequence identity survives mask rejection, so changing a hairline does not reassign length/curl variation to retained roots. Increasing count retains the existing sequence prefix. An optional Gaussian region accepts candidates against the independent base-13 coordinate. Thus accepted area density is proportional to the envelope, while count remains the requested population and common roots retain seats. The polar mask can only remove roots from the shared domain. One million candidates is a construction budget; exhaustion refuses the request rather than inventing roots outside the domain. Arrays are copied on compilation. Positive-area admission is separate from direction normalization. The shared vector owner scales finite extreme components before normalization, so a positive subnormal area does not become an overflowing inverse-area factor.
 *
 * The sampler also reports the share of the domain its own acceptance covers: candidates follow the neutral domain's area measure, so their accepted share estimates the masks' neutral area fraction. The caller multiplies it by the current total domain area as a density fallback for a small population. That proxy does not integrate local area scaling under nonuniform deformation; sampling error and neutral-to-current transfer are separate approximations.
 *
 * @evidence contracts/common.md#principled-implementation Neutral triangle area CDF and square-root barycentric coordinates select deterministic Halton candidates before masks accept roots.
 * @evidence contracts/common.md#clear-and-simple-design Sequence identity survives mask rejection so retained roots keep variation and increasing count keeps the existing prefix.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A million candidates is a construction budget, not biology; exhaustion refuses rather than moving roots outside the domain.
 * @evidence contracts/common.md#meaningful-documentation Reported share estimates neutral mask acceptance and does not integrate nonuniform deformation into current area.
 * @evidence contracts/performance.md#efficient-algorithms Compilation scans domain triangles; each candidate uses binary CDF search plus fixed field checks, up to the admitted candidate cap.
 * @evidence contracts/performance.md#reuse-equivalent-work The compiled CDF and neutral snapshots serve repeated admitted-layer samples without rebuilding source topology.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The sampler closure owns triangle/coordinate copies; each returned root population owns weights and vectors.
 */
export function createHumanFaceHairRoots(
  props: IHumanFaceHairRootSamplingProps,
): (
  layer: Pick<
    IAutoMovieHumanFaceHair.Layer,
    "count" | "seed" | "hairline" | "rootRegion"
  >,
) => IHumanFaceHairRootPopulation {
  const origin: ImportedIAutoMovieVector3 = Vector3.create(...props.origin);
  let area: number = 0;
  const triangles: {
    triangle: number;
    ids: number[];
    points: ImportedIAutoMovieVector3[];
    area: number;
    normal: ImportedIAutoMovieVector3;
  }[] = props.triangles.map(
    (
      triangle: number,
    ): {
      triangle: number;
      ids: number[];
      points: ImportedIAutoMovieVector3[];
      area: number;
      normal: ImportedIAutoMovieVector3;
    } => {
      const ids: number[] = props.indices.slice(3 * triangle, 3 * triangle + 3);
      const points: ImportedIAutoMovieVector3[] = ids.map(
        (id: number): ImportedIAutoMovieVector3 =>
          Vector3.create(
            ...(props.positions.slice(3 * id, 3 * id + 3) as [
              number,
              number,
              number,
            ]),
          ),
      );
      const cross: ImportedIAutoMovieVector3 = Vector3.cross(
        Vector3.subtract(points[1], points[0]),
        Vector3.subtract(points[2], points[0]),
      );
      const magnitude: number = Vector3.length(cross);
      if (!Number.isFinite(magnitude) || magnitude <= 0)
        throw new Error("A hair growth triangle needs finite nonzero area.");
      area += magnitude / 2;
      return {
        triangle,
        ids,
        points,
        area,
        normal: Vector3.normalize(cross),
      };
    },
  );
  if (!Number.isFinite(area) || area <= 0)
    throw new Error("A hair growth domain needs a finite positive area.");
  return (
    layer: Pick<
      IAutoMovieHumanFaceHair.Layer,
      "count" | "seed" | "hairline" | "rootRegion"
    >,
  ): IHumanFaceHairRootPopulation => {
    const roots: IHumanFaceHairSampledRoot[] = [];
    let candidates: number = 0;
    for (
      let candidate: number = 1;
      roots.length < layer.count && candidate <= 1_000_000;
      candidate++
    ) {
      candidates = candidate;
      const sequence: number = layer.seed + candidate;
      const target: number = humanFaceHairSequence(sequence, 2) * area;
      let low: number = 0,
        high: number = triangles.length - 1;
      while (low < high) {
        const middle: number = Math.floor((low + high) / 2);
        if (triangles[middle].area <= target) low = middle + 1;
        else high = middle;
      }
      const chosen: {
        triangle: number;
        ids: number[];
        points: ImportedIAutoMovieVector3[];
        area: number;
        normal: ImportedIAutoMovieVector3;
      } = triangles[low];
      const radial: number = Math.sqrt(humanFaceHairSequence(sequence, 3));
      const along: number = humanFaceHairSequence(sequence, 5);
      const weights: [number, number, number] = [
        1 - radial,
        radial * (1 - along),
        radial * along,
      ];
      const point: ImportedIAutoMovieVector3 = chosen.points.reduce(
        (
          sum: ImportedIAutoMovieVector3,
          p: ImportedIAutoMovieVector3,
          at: number,
        ): ImportedIAutoMovieVector3 =>
          Vector3.add(sum, Vector3.scale(p, weights[at])),
        Vector3.create(),
      );
      const direction: ImportedIAutoMovieVector3 = Vector3.subtract(
        point,
        origin,
      );
      const magnitude: number = Vector3.length(direction);
      if (!Number.isFinite(magnitude) || magnitude === 0)
        throw new Error("The hair chart is singular at a sampled root.");
      const boundary: number = humanFaceHairlineBoundary(
        direction,
        layer.hairline,
      );
      const polar: number = Math.acos(
        Math.max(-1, Math.min(1, direction.y / magnitude)),
      );
      if (polar > boundary) continue;
      if (
        humanFaceHairSequence(sequence, 13) >=
        humanFaceHairEnvelope(point, layer.rootRegion)
      )
        continue;
      roots.push({
        sequence,
        triangle: chosen.triangle,
        weights,
        point,
        normal: { ...chosen.normal },
      });
    }
    if (roots.length !== layer.count)
      throw new Error(
        "The hairline exhausted its million-candidate root sampling budget.",
      );
    return {
      roots,
      share: candidates === 0 ? 1 : roots.length / candidates,
    };
  };
}
