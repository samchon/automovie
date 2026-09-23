import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairSequence } from "./humanFaceHairSequence";

/**
 * Compile the neutral area measure of one shared anatomical growth domain.
 * The numerical hair builder supplies admitted surface triangles and a finite
 * chart origin, then calls the returned sampler with an admitted layer. Roots
 * remain barycentric attachments to that surface when a face changes shape.
 * No generated root or curve becomes personal authored data.
 *
 * Triangle selection uses an area CDF; square-root barycentric sampling is
 * uniform within the selected triangle. The bases 2, 3 and 5 of a Halton
 * sequence supply those three coordinates. Sequence identity survives mask
 * rejection, so changing a hairline does not reassign length/curl variation to
 * retained roots. Increasing count retains the existing sequence prefix. An
 * optional Gaussian region accepts candidates against the independent base-13
 * coordinate. Thus accepted area density is proportional to the envelope,
 * while count remains the requested population and common roots retain seats.
 * The polar mask can only remove roots from the shared domain. One million
 * candidates is a construction budget; exhaustion refuses the request rather
 * than inventing roots outside the domain. Arrays are copied on compilation.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Uses common anatomical correspondence for numerically authored populations.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Samples stable area roots without storing individual guide coordinates.
 */
export function createHumanFaceHairRoots(props: {
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
  origin: readonly [number, number, number];
}) {
  const origin = Vector3.create(...props.origin);
  let area = 0;
  const triangles = props.triangles.map((triangle) => {
    const ids = props.indices.slice(3 * triangle, 3 * triangle + 3);
    const points = ids.map((id) =>
      Vector3.create(
        ...(props.positions.slice(3 * id, 3 * id + 3) as [
          number,
          number,
          number,
        ]),
      ),
    );
    const cross = Vector3.cross(
      Vector3.subtract(points[1], points[0]),
      Vector3.subtract(points[2], points[0]),
    );
    const magnitude = Vector3.length(cross);
    if (!Number.isFinite(magnitude) || magnitude <= 0)
      throw new Error("A hair growth triangle needs finite nonzero area.");
    area += magnitude / 2;
    return {
      triangle,
      ids,
      points,
      area,
      normal: Vector3.scale(cross, 1 / magnitude),
    };
  });
  if (!Number.isFinite(area) || area <= 0)
    throw new Error("A hair growth domain needs a finite positive area.");
  return (
    layer: Pick<
      IAutoMovieHumanFaceHair.Layer,
      "count" | "seed" | "hairline" | "rootRegion"
    >,
  ) => {
    const roots: {
      sequence: number;
      triangle: number;
      weights: [number, number, number];
      point: IAutoMovieVector3;
      normal: IAutoMovieVector3;
    }[] = [];
    for (
      let candidate = 1;
      roots.length < layer.count && candidate <= 1_000_000;
      candidate++
    ) {
      const sequence = layer.seed + candidate;
      const target = humanFaceHairSequence(sequence, 2) * area;
      let low = 0,
        high = triangles.length - 1;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (triangles[middle].area <= target) low = middle + 1;
        else high = middle;
      }
      const chosen = triangles[low];
      const radial = Math.sqrt(humanFaceHairSequence(sequence, 3));
      const along = humanFaceHairSequence(sequence, 5);
      const weights: [number, number, number] = [
        1 - radial,
        radial * (1 - along),
        radial * along,
      ];
      const point = chosen.points.reduce(
        (sum, p, at) => Vector3.add(sum, Vector3.scale(p, weights[at])),
        Vector3.create(),
      );
      const direction = Vector3.subtract(point, origin);
      const magnitude = Vector3.length(direction);
      if (!Number.isFinite(magnitude) || magnitude === 0)
        throw new Error("The hair chart is singular at a sampled root.");
      const horizontal = Math.hypot(direction.x, direction.z);
      // At the polar axis azimuth is undefined. Both limits have theta=0 or
      // pi; the minimum boundary is the intersection of those azimuth limits.
      const boundary =
        horizontal === 0
          ? Math.min(...Object.values(layer.hairline))
          : (direction.x / horizontal) ** 2 *
              (direction.x < 0 ? layer.hairline.right : layer.hairline.left) +
            (direction.z / horizontal) ** 2 *
              (direction.z < 0 ? layer.hairline.back : layer.hairline.front);
      const polar = Math.acos(
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
    return roots;
  };
}
