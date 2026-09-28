import {
  Vector3,
  type createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { portraitNormals } from "../../mesh/portraitNormals";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import type { integrateHumanFaceHairCurve } from "./integrateHumanFaceHairCurve";

const { perpendicular, direction: requireDirection } = humanFaceHairFrame;

/**
 * Mesh integrated metric curves with transported transverse ribbon frames.
 * The numerical hair builder passes the exact generated stations; this owner
 * never resamples or fits a second curve. A root vertex opens into a triangular
 * fan, followed by paired rows. UV v is measured cumulative arc length divided
 * by total measured length, and taper uses that same coordinate.
 *
 * The first nonparallel tangent fixes the binormal of the emergence/combing
 * plane. Starting from skin normal cross root tangent would be singular for
 * normal emergence and would select a world axis even when the curve specifies
 * a combing plane. A completely straight curve instead uses the supplied normal
 * and the shared frame's least-aligned-axis convention when both are parallel.
 * Successive averaged tangents use Rodrigues' minimal rotation. Antiparallel
 * tangents have no unique minimal transport and refuse. Projection removes
 * accumulated floating-point drift from the transverse frame before normalizing.
 * The root frame's sign is chosen so the ribbon's triangles face along the
 * root's outward normal: a ribbon over the scalp faces away from it.
 * Generated triangles must remain finite and nondegenerate. This does not
 * establish root-fan clearance, self-intersection freedom or hair-to-hair contact.
 *
 * Each curve carries its own width, the scalp its root stands for
 * (`humanFaceHairDensity`), and the fibre path it was integrated on keeps only
 * the fibre's clearance, so this owner is where the ribbon's own corners are
 * kept out of the skin. A corner no farther from its station than the station's
 * own free distance less the requested clearance cannot reach the surface,
 * since the nearest surface point is that far away; such a half width is taken
 * without a query. A wider one is measured, and where it would enter, the half
 * width is solved back by a safeguarded Newton step on the corner's own signed
 * distance, falling back on that provable bound. The bound is positive for
 * every station the integrator or the contact placed, which stand at least
 * half a sampling step beyond the requested clearance; a station that does not
 * refuses rather than meshing a pinched or inside-out ribbon.
 * Both sides take the tighter of the two half widths, so a ribbon stays
 * centred on the fibre it stands for instead of sliding off it. A ribbon
 * therefore narrows where the scalp is close and opens to its full covering
 * width as it leaves, instead of the whole path being lifted by half a ribbon.
 * Nothing here keeps two ribbons apart from each other.
 * Positions are already metres; no portrait millimetre conversion applies.
 * Neither input curves nor layer fields mutate; the mesh owns all its buffers.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Materializes numerical locks without storing personal mesh data.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Renders the same integrated stations used for metric evaluation and keeps each ribbon's own corners outside the skin.
 */
export function buildHumanFaceHairMesh(
  curves: ReturnType<typeof integrateHumanFaceHairCurve>[],
  layer: Pick<IAutoMovieHumanFaceHair.Layer, "taper" | "clearance">,
  props: {
    widths: readonly number[];
    query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
  },
): IAutoMovieMesh {
  if (props.widths.length !== curves.length)
    throw new Error("Every numerical hair curve needs its own ribbon width.");
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [];
  const outward = (
    point: IAutoMovieVector3,
    hit: ReturnType<typeof props.query>,
  ): IAutoMovieVector3 =>
    hit.distance === 0
      ? Vector3.create(hit.normal[0], hit.normal[1], hit.normal[2])
      : requireDirection(
          Vector3.scale(
            Vector3.subtract(
              point,
              Vector3.create(hit.point[0], hit.point[1], hit.point[2]),
            ),
            hit.signedDistance < 0 ? -1 : 1,
          ),
        );
  const fit = (
    station: IAutoMovieVector3,
    across: IAutoMovieVector3,
    radius: number,
    free: number,
  ): number => {
    const bound = free - layer.clearance;
    if (radius <= bound) return radius;
    if (!(bound > 0))
      throw new Error(
        "A numerical hair station stands too close to the surface for its own ribbon.",
      );
    let fitted = radius;
    for (let attempt = 0; attempt < 8; attempt++) {
      const corner = Vector3.add(station, Vector3.scale(across, fitted));
      const hit = props.query([corner.x, corner.y, corner.z]);
      if (hit.signedDistance >= layer.clearance) return fitted;
      const step =
        fitted -
        (layer.clearance - hit.signedDistance) /
          Math.abs(Vector3.dot(across, outward(corner, hit)));
      fitted =
        Number.isFinite(step) && step > bound && step < fitted
          ? step
          : (bound + fitted) / 2;
    }
    return bound;
  };
  curves.forEach((curve, ordinal) => {
    const width = props.widths[ordinal];
    if (!Number.isFinite(width) || width <= 0)
      throw new Error("A numerical hair ribbon needs a positive width.");
    const offset = positions.length / 3;
    const points = curve.points;
    const tangents = points.map((_, at) =>
      requireDirection(
        Vector3.subtract(
          points[Math.min(at + 1, points.length - 1)],
          points[Math.max(at - 1, 0)],
        ),
      ),
    );
    const distances = [0];
    for (let at = 1; at < points.length; at++)
      distances.push(
        distances[at - 1] +
          Vector3.length(Vector3.subtract(points[at], points[at - 1])),
      );
    const total = distances[distances.length - 1];
    const reference =
      tangents.find(
        (tangent) =>
          Vector3.length(Vector3.cross(tangents[0], tangent)) >
          64 * Number.EPSILON,
      ) ?? curve.normal;
    // The frame's sign is free, and with this winding it sets which way the
    // ribbon's triangles face (tangent cross frame). A ribbon lies over the
    // scalp, so it faces away from it: the renderer offsets a shadow lookup
    // along the stored normal, and a ribbon facing into the head reads its
    // own shadow on the lit side. A root emerging along the normal faces
    // nowhere yet, so the bend it combs into decides with it.
    let frame = perpendicular(tangents[0], reference);
    const facing = [tangents[0], reference].reduce(
      (sum, tangent) =>
        sum + Vector3.dot(Vector3.cross(tangent, frame), curve.normal),
      0,
    );
    if (facing < 0) frame = Vector3.scale(frame, -1);
    positions.push(points[0].x, points[0].y, points[0].z);
    uvs.push(0.5, 0);
    for (let at = 1; at < points.length; at++) {
      const before = tangents[at - 1],
        after = tangents[at];
      const cosine = Math.max(-1, Math.min(1, Vector3.dot(before, after)));
      if (1 + cosine <= 64 * Number.EPSILON)
        throw new Error(
          "Antiparallel hair tangents have no unique transverse transport.",
        );
      const axis = Vector3.cross(before, after);
      frame = Vector3.add(
        Vector3.add(frame, Vector3.cross(axis, frame)),
        Vector3.scale(
          Vector3.cross(axis, Vector3.cross(axis, frame)),
          1 / (1 + cosine),
        ),
      );
      frame = requireDirection(
        Vector3.subtract(
          frame,
          Vector3.scale(after, Vector3.dot(frame, after)),
        ),
      );
      const t = distances[at] / total;
      const radius =
        (width / 2) *
        (1 -
          ((1 - layer.taper.tipWidth) * Math.max(0, t - layer.taper.start)) /
            (1 - layer.taper.start));
      const free = props.query([
        points[at].x,
        points[at].y,
        points[at].z,
      ]).signedDistance;
      const fitted = Math.min(
        ...[-1, 1].map((side) =>
          fit(points[at], Vector3.scale(frame, side), radius, free),
        ),
      );
      for (const side of [-1, 1]) {
        const point = Vector3.add(
          points[at],
          Vector3.scale(frame, side * fitted),
        );
        positions.push(point.x, point.y, point.z);
        uvs.push((side + 1) / 2, t);
      }
      const row = offset + 2 * at - 1;
      if (at === 1) indices.push(offset, row, row + 1);
      else indices.push(row - 2, row, row - 1, row - 1, row, row + 1);
    }
  });
  const point = (id: number) =>
    Vector3.create(
      positions[3 * id],
      positions[3 * id + 1],
      positions[3 * id + 2],
    );
  for (let at = 0; at < indices.length; at += 3) {
    const a = point(indices[at]),
      b = point(indices[at + 1]),
      c = point(indices[at + 2]);
    const area = Vector3.length(
      Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
    );
    if (!Number.isFinite(area) || area === 0)
      throw new Error(
        "Numerical hair generated an unrepresentable ribbon triangle.",
      );
  }
  return {
    positions,
    indices,
    normals: portraitNormals(positions, indices),
    uvs,
    skin: null,
  };
}
