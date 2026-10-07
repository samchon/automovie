import { Quaternion, Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceOralAssembly } from "./IHumanFaceOralAssembly";
import type { IHumanFaceOralPart } from "./IHumanFaceOralPart";

/**
 * Join the actual final native upper/lower lip ports to their dental vestibule.
 * The source fissure chains and performed rigid vestibular edge are retained
 * verbatim. The strip covers only the arc of the vestibular edge whose
 * bearing about that edge's centre lies within the bearings the lip port
 * spans, so no triangle reaches from a commissure back along the cheek.
 * Monotone normalized arc stations zipper the two different vertex
 * populations; no source port is resampled, fitted, capped or height-matched.
 * These soft lining strips follow final lips after their contact owner acts.
 * They are not additional rigid dental obstacles and do not certify a sealed
 * posterior enclosure, muscular mechanics or source full-margin closure.
 *
 * @evidence contracts/common.md#principled-implementation Original lip edges and the same rigid vestibular edge form a variable-population strip; normalized arc station ordering determines incidence without changing either boundary.
 * @evidence contracts/common.md#clear-and-simple-design One final soft-wall join consumes the existing lip/contact and rigid arch owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coincident-coordinate weld, guessed commissure, bounding-box closure or phantom rigid mucosa replaces source ports.
 * @evidence contracts/modeling.md#shared-boundaries Every native lip margin ordinal and performed vestibular rim is retained exactly with its source identity.
 * @evidence contracts/modeling.md#spatial-conventions Final source-frame metre coordinates are already performed and receive no second jaw transform.
 * @evidence contracts/anatomy.md#anatomical-source The soft vestibular strip is a coarse authored connection, without measured mucosal thickness or pharyngeal acquisition.
 * @author Samchon
 */
export function connectHumanFaceOralLipPorts(
  basis: IAutoMovieHumanFaceBasis,
  assembly: IHumanFaceOralAssembly,
  performed: ReadonlyMap<string, readonly number[]>,
  jaw: IAutoMovieHumanFaceRigidMotion,
): IHumanFaceOralAssembly {
  const contact = basis.contact;
  const surface =
    contact === undefined
      ? undefined
      : basis.surfaces.find((one) => one.id === contact.lips.surface);
  const lip = surface === undefined ? undefined : performed.get(surface.id);
  if (
    contact?.margin === undefined ||
    surface?.sourcePartition === undefined ||
    lip === undefined
  )
    throw new Error(
      "Oral soft wall needs the actual final source lip ports and canonical skin correspondence.",
    );
  const joined: IHumanFaceOralPart[] = [];
  const stations = (points: readonly number[][]): number[] => {
    const distances = [0];
    for (let k = 1; k < points.length; k++)
      distances.push(
        distances[k - 1] +
          Math.hypot(...points[k].map((v, axis) => v - points[k - 1][axis])),
      );
    const total = distances[distances.length - 1];
    if (!(total > 0) || !Number.isFinite(total))
      throw new Error("Oral soft-wall source port has no finite arc length.");
    return distances.map((distance) => distance / total);
  };
  for (const mandibular of [false, true]) {
    const prefix = mandibular ? "mandibular" : "maxillary";
    const wall = assembly.parts.find(
      (part) => part.id === prefix + ":vestibular-wall",
    );
    if (wall === undefined || wall.mesh.positions.length % 6 !== 0)
      throw new Error("Oral soft wall needs its generated vestibular edge.");
    const n = wall.mesh.positions.length / 6;
    const edge = Array.from({ length: n }, (_, vertex) => {
      const original = wall.mesh.positions.slice(
        3 * (n + vertex),
        3 * (n + vertex) + 3,
      );
      if (!mandibular) return original;
      const point = Vector3.create(...original);
      const placed = Vector3.add(
        Vector3.add(
          jaw.pivot,
          Quaternion.rotateVector(
            jaw.rotation,
            Vector3.subtract(point, jaw.pivot),
          ),
        ),
        jaw.translation,
      );
      return [placed.x, placed.y, placed.z];
    });
    const margin = mandibular ? contact.margin.lower : contact.margin.upper;
    const lipPoints = margin.map((vertex) =>
      lip.slice(3 * vertex, 3 * vertex + 3),
    );
    const lipIds = margin.map(
      (vertex) => "skin:" + surface.sourcePartition!.samples[vertex],
    );
    if (lipPoints[0][0] > lipPoints[lipPoints.length - 1][0]) {
      lipPoints.reverse();
      lipIds.reverse();
    }
    // The strip spans only the arc of the vestibular edge that faces the lip port: the bearings,
    // about the edge's own centre in the transverse plane, that the port itself covers.
    const pivot = [0, 2].map(
      (axis) => edge.reduce((sum, point) => sum + point[axis], 0) / n,
    );
    const bearing = (point: readonly number[]): number =>
      Math.atan2(point[0] - pivot[0], point[2] - pivot[1]);
    const bearings = lipPoints.map(bearing);
    const least = Math.min(...bearings),
      most = Math.max(...bearings);
    const rimVertices = Array.from({ length: n }, (_, vertex) => vertex)
      .filter(
        (vertex) =>
          bearing(edge[vertex]) >= least && bearing(edge[vertex]) <= most,
      )
      .sort((a, b) => bearing(edge[a]) - bearing(edge[b]));
    if (rimVertices.length < 2)
      throw new Error(
        "Oral soft wall needs a vestibular arc facing the lip port.",
      );
    const rim = rimVertices.map((vertex) => edge[vertex]);
    const a = stations(rim),
      b = stations(lipPoints),
      count = rim.length;
    const indices: number[] = [];
    let i = 0,
      j = 0;
    while (i < rim.length - 1 || j < lipPoints.length - 1) {
      if (
        i < rim.length - 1 &&
        (j === lipPoints.length - 1 || a[i + 1] <= b[j + 1])
      ) {
        indices.push(i, i + 1, count + j);
        i++;
      } else {
        indices.push(i, count + j + 1, count + j);
        j++;
      }
    }
    if (mandibular)
      for (let at = 0; at < indices.length; at += 3)
        [indices[at + 1], indices[at + 2]] = [indices[at + 2], indices[at + 1]];
    joined.push({
      id: prefix + ":labial-vestibule",
      materialRole: "wall",
      owner: "performed",
      mesh: {
        positions: [...rim, ...lipPoints].flat(),
        indices,
        normals: null,
        uvs: null,
        skin: null,
      },
      physicalPoints: [
        ...rimVertices.map((vertex) => wall.physicalPoints[n + vertex]),
        ...lipIds,
      ],
    });
  }
  return { ...assembly, parts: [...assembly.parts, ...joined] };
}
