import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IHumanFaceHairMeshContext } from "./IHumanFaceHairMeshContext";
import type { IHumanFaceHairContactStation } from "./IHumanFaceHairContactStation";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Emit individually calibrated visible shafts on the existing registered curves.
 * Eight circumferential sides follow the established brow shaft representation.
 * Every original non-root station retains the authored diameter; the first
 * registered root is an attached fan, not a resolved buried follicle. The
 * centreline, native root identity and metric length are never reselected.
 * Source and actual Float32 convex cells must both certify the original gap.
 * An unsupported tube refuses; its diameter is not reduced to obtain coverage.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the production curves, root registrations and exact source/represented separation readers instead of reconstructing roots or replacing scalar targets.
 * @evidence contracts/common.md#clear-and-simple-design This geometry owner distinguishes physical shaft calibre from scalp density-coverage ribbons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every non-root ring keeps the requested radius and unsupported cells refuse without width fitting or guard relaxation.
 * @evidence contracts/common.md#meaningful-documentation States the calibrated rings, geometric root fan, eight-side representation and independent source/F32 admission.
 * @evidence contracts/modeling.md#emitted-geometry Each admitted curve emits one rooted eight-side shaft through all its actual stations and a tip cap.
 * @evidence contracts/modeling.md#spatial-conventions Positions, diameter and clearance use current head-local metres; transverse frames are unit vectors and UVs are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries The first fan uses its canonical native root attachment; all later complete cells prove separation from the same source and Float32 host.
 * @evidence contracts/anatomy.md#anatomical-source The requested visible calibre is authored; the geometric emergence fan does not claim a follicle or a clinical normal interval.
 * @author Samchon
 */
export function buildHumanFaceHairShaftMesh(
  curves: readonly IAutoMovieHumanFaceHairCurve[],
  diameter: number,
  clearance: number,
  props: IHumanFaceHairMeshContext,
): IAutoMovieMesh {
  if (!Number.isFinite(diameter) || diameter <= 0 ||
      props.attachments.length !== curves.length || props.budgets.length !== curves.length)
    throw new Error("Terminal shafts require their metric calibre and canonical curve registrations.");
  const positions: number[] = [], indices: number[] = [], uvs: number[] = [];
  const radius = diameter / 2;
  const direction = humanFaceHairFrame.direction;
  curves.forEach((curve, ordinal) => {
    if (curve.points.length < 2 || curve.freeFrom < 1 || curve.freeFrom >= curve.points.length)
      throw new Error("A terminal shaft needs its complete registered root, stem and free curve.");
    const offset = positions.length / 3;
    const root = curve.points[0];
    positions.push(root.x, root.y, root.z);
    uvs.push(0.5, 0);
    const stations: IHumanFaceHairContactStation[] = [{ vertices: [offset], radius: 0, arcLength: 0 }];
    const rings: IAutoMovieVector3[][] = [];
    let across: IAutoMovieVector3 | undefined;
    let length = 0;
    const certified = (vertices: readonly IAutoMovieVector3[], rooted: boolean, free: boolean): void => {
      const options = {
        clearance: free ? clearance : 0,
        budget: props.budgets[ordinal],
        attachment: rooted ? props.attachments[ordinal] : undefined,
      };
      if (!props.separation.source.separated(vertices, options).certified ||
          !props.separation.represented.separated(vertices.map((point) =>
            Vector3.create(Math.fround(point.x), Math.fround(point.y), Math.fround(point.z))), options).certified)
        throw new Error("An authored terminal shaft lacks complete source or Float32 host separation.");
    };
    for (let station = 1; station < curve.points.length; ++station) {
      const point = curve.points[station];
      const incoming = direction(Vector3.subtract(point, curve.points[station - 1]));
      const tangent = station + 1 === curve.points.length ? incoming : direction(Vector3.add(
        incoming, direction(Vector3.subtract(curve.points[station + 1], point)),
      ));
      if (across === undefined) across = humanFaceHairFrame.perpendicular(tangent, curve.normal);
      else {
        const projected = Vector3.subtract(across, Vector3.scale(tangent, Vector3.dot(across, tangent)));
        across = Vector3.length(projected) === 0
          ? humanFaceHairFrame.perpendicular(tangent, curve.normal) : direction(projected);
      }
      const around = direction(Vector3.cross(tangent, across));
      const radial = across;
      length += Vector3.length(Vector3.subtract(point, curve.points[station - 1]));
      const ring = Array.from({ length: 8 }, (_value, side) => {
        const angle = side * Math.PI / 4;
        return Vector3.add(point, Vector3.scale(Vector3.add(
          Vector3.scale(radial, Math.cos(angle)), Vector3.scale(around, Math.sin(angle)),
        ), radius));
      });
      if (station === 1) {
        for (let side = 0; side < 8; ++side)
          certified([root, ring[(side + 1) % 8], ring[side]], true, false);
      } else certified([
        curve.points[station - 1], point, ...rings[rings.length - 1], ...ring,
      ], false, station - 1 >= curve.freeFrom);
      for (const [side, vertex] of ring.entries()) {
        positions.push(vertex.x, vertex.y, vertex.z);
        uvs.push(side / 8, length / curve.length);
      }
      const first = offset + 1 + 8 * (station - 1);
      stations.push({ vertices: ring.map((_point, side) => first + side), radius, arcLength: length });
      for (let side = 0; side < 8; ++side) {
        const next = (side + 1) % 8;
        if (station === 1) indices.push(offset, first + next, first + side);
        else indices.push(first - 8 + side, first - 8 + next, first + side,
          first - 8 + next, first + next, first + side);
      }
      rings.push(ring);
    }
    const tip = curve.points[curve.points.length - 1];
    const tipIndex = positions.length / 3;
    positions.push(tip.x, tip.y, tip.z);
    uvs.push(0.5, 1);
    const last = tipIndex - 8;
    const final = stations[stations.length - 1];
    stations[stations.length - 1] = { ...final, vertices: [...final.vertices, tipIndex] };
    for (let side = 0; side < 8; ++side) {
      certified([tip, rings[rings.length - 1][side], rings[rings.length - 1][(side + 1) % 8]], false, true);
      indices.push(tipIndex, last + side, last + (side + 1) % 8);
    }
    props.progress?.(ordinal);
    props.observeContactCurve?.({ attachment: props.attachments[ordinal], stations });
  });
  return { positions, indices, normals: areaWeightedNormals(positions, indices), uvs, skin: null };
}
