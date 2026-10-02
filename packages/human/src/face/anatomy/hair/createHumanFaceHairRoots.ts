import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairEnvelope } from "./humanFaceHairEnvelope";
import { humanFaceHairSequence } from "./humanFaceHairSequence";
import { humanFaceHairlineBoundary } from "./humanFaceHairlineBoundary";

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
 * The sampler also reports the share of the domain its own acceptance covers:
 * candidates follow the neutral domain's area measure, so their accepted share
 * estimates the masks' neutral area fraction. The caller multiplies it by the
 * current total domain area as a density fallback for a small population. That
 * proxy does not integrate local area scaling under nonuniform deformation;
 * sampling error and neutral-to-current transfer are separate approximations.
 *
 * @evidence contracts/common.md#principled-implementation A triangle is chosen
 *   by inverting the cumulative area with a binary search, and a point inside it
 *   takes barycentric weights (1 - sqrt r, sqrt r (1 - a), sqrt r a) for two
 *   uniform values, which is uniform in area; the values are the base 2, 3 and 5
 *   coordinates of one Halton index, and a fourth, base 13, accepts against the
 *   envelope. Rejection by the hairline or the envelope never renumbers the
 *   sequence, so retained roots keep their length and curl identity, and a
 *   larger count keeps the smaller one as a prefix. The premises are triangles
 *   of finite positive area and a chart origin that is not on a sampled point; a
 *   million candidates bound the search and exhaustion refuses.
 * @evidence contracts/common.md#clear-and-simple-design The sampler is
 *   compiled once per neutral domain and returns roots as barycentric seats; the
 *   builder attaches them to the current face.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style: roots are a deterministic function of the
 *   domain, seed, hairline and region.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the sampling scheme, what survives rejection, the budget and the reported
 *   share.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidence contracts/modeling.md#emitted-geometry The population is exactly
 *   the requested count, at most 1024 and independent of any feature, drawn from
 *   the domain's area measure; the candidate budget bounds the work and not the
 *   output.
 * @evidence contracts/modeling.md#spatial-conventions The domain positions and
 *   origin are neutral head-frame metres, the polar angle is radians from +Y,
 *   and each root is a barycentric seat, converted to a current point by the
 *   builder.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The count is a
 *   geometric sampling control and the interface states it is not a follicle
 *   density.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
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
  ): {
    roots: {
      sequence: number;
      triangle: number;
      weights: [number, number, number];
      point: IAutoMovieVector3;
      normal: IAutoMovieVector3;
    }[];
    share: number;
  } => {
    const roots: {
      sequence: number;
      triangle: number;
      weights: [number, number, number];
      point: IAutoMovieVector3;
      normal: IAutoMovieVector3;
    }[] = [];
    let candidates = 0;
    for (
      let candidate = 1;
      roots.length < layer.count && candidate <= 1_000_000;
      candidate++
    ) {
      candidates = candidate;
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
      const boundary = humanFaceHairlineBoundary(direction, layer.hairline);
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
    return {
      roots,
      share: candidates === 0 ? 1 : roots.length / candidates,
    };
  };
}
