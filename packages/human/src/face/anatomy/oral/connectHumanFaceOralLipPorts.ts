import type { IAutoMovieHumanFaceBasisContact as ImportedIAutoMovieHumanFaceBasisContact, IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface } from "@automovie/human";
import type { IHumanFaceLipMarginPoints as ImportedIHumanFaceLipMarginPoints } from "../../basis/IHumanFaceLipMarginPoints";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import type { IHumanFaceLipMarginPoint as ImportedIHumanFaceLipMarginPoint } from "../../basis/IHumanFaceLipMarginPoint";
import { Quaternion, Vector3 } from "@automovie/engine";
import { readHumanFaceLipMarginPoints } from "../../basis/readHumanFaceLipMarginPoints";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceOralAssembly } from "./IHumanFaceOralAssembly";
import type { IHumanFaceOralPart } from "./IHumanFaceOralPart";

/**
 * Join the actual final native upper/lower lip ports to their dental vestibule. The source fissure chains and performed rigid vestibular edge are retained verbatim. The strip covers only the arc of the vestibular edge whose bearing about that edge's centre lies within the bearings the lip port spans, so no triangle reaches from a commissure back along the cheek. Monotone normalized arc stations zipper the two different vertex populations; no source port is resampled, fitted, capped or height-matched. These soft lining strips follow final lips after their contact owner acts. They are not additional rigid dental obstacles and do not certify a sealed posterior enclosure, muscular mechanics or source full-margin closure.
 *
 * @evidence contracts/common.md#principled-implementation Final native lip ports zipper by normalized arc length to the facing performed vestibular edge without resampling source vertices.
 * @evidence contracts/common.md#clear-and-simple-design Soft strips use performed ownership and remain outside rigid dental obstacle queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing registration/finite arc/facing rim refuse, and these strips do not certify a sealed posterior enclosure or muscle mechanics.
 * @evidence contracts/common.md#meaningful-documentation Original physical identities and head-metre coordinates preserve the source lip/vestibule boundaries.
 * @evidence contracts/performance.md#efficient-algorithms For R vestibular vertices and L lip points, scanning costs O(R + L), sorting the facing rim costs O(R log R), and zippering costs O(R + L); output storage is linear in both populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One source port reader and prepared arc coordinates serve all zipper triangles; no independent fitted lip path is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New strip buffers are owned and existing assembly parts remain borrowed in the returned expanded part array.
 *
 * @author Samchon
 */
export function connectHumanFaceOralLipPorts(
  basis: IAutoMovieHumanFaceBasis,
  assembly: IHumanFaceOralAssembly,
  performed: ReadonlyMap<string, readonly number[]>,
  jaw: IAutoMovieHumanFaceRigidMotion,
): IHumanFaceOralAssembly {
  const contact: ImportedIAutoMovieHumanFaceBasisContact | undefined = basis.contact;
  const surface: ImportedIAutoMovieHumanFaceBasisSurface | undefined =
    contact === undefined
      ? undefined
      : basis.surfaces.find((one: ImportedIAutoMovieHumanFaceBasisSurface): boolean => one.id === contact.lips.surface);
  const lip: readonly number[] | undefined = surface === undefined ? undefined : performed.get(surface.id);
  if (
    contact?.margin === undefined ||
    surface?.sourcePartition === undefined ||
    lip === undefined
  )
    throw new Error(
      "Oral soft wall needs the actual final source lip ports and canonical skin correspondence.",
    );
  const joined: IHumanFaceOralPart[] = [];
  const ports: ImportedIHumanFaceLipMarginPoints = readHumanFaceLipMarginPoints(surface, contact.margin, lip);
  const stations: (points: readonly number[][]) => number[] = (points: readonly number[][]): number[] => {
    const distances: number[] = [0];
    for (let k: number = 1; k < points.length; k++)
      distances.push(
        distances[k - 1] +
          Math.hypot(...points[k].map((v: number, axis: number): number => v - points[k - 1][axis])),
      );
    const total: number = distances[distances.length - 1];
    if (!(total > 0) || !Number.isFinite(total))
      throw new Error("Oral soft-wall source port has no finite arc length.");
    return distances.map((distance: number): number => distance / total);
  };
  for (const mandibular of [false, true]) {
    const prefix: "mandibular" | "maxillary" = mandibular ? "mandibular" : "maxillary";
    const wall: IHumanFaceOralPart | undefined = assembly.parts.find(
      (part: IHumanFaceOralPart): boolean => part.id === prefix + ":vestibular-wall",
    );
    if (wall === undefined || wall.mesh.positions.length % 6 !== 0)
      throw new Error("Oral soft wall needs its generated vestibular edge.");
    const n: number = wall.mesh.positions.length / 6;
    const edge: number[][] = Array.from({ length: n }, (_: unknown, vertex: number): number[] => {
      const original: number[] = wall.mesh.positions.slice(
        3 * (n + vertex),
        3 * (n + vertex) + 3,
      );
      if (!mandibular) return original;
      const point: ImportedIAutoMovieVector3 = Vector3.create(...original);
      const placed: ImportedIAutoMovieVector3 = Vector3.add(
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
    const margin: ImportedIHumanFaceLipMarginPoint[] = mandibular ? ports.lower : ports.upper;
    const lipPoints: number[][] = margin.map(({ point }: ImportedIHumanFaceLipMarginPoint): number[] => [point.x, point.y, point.z]);
    const lipIds: string[] = margin.map((point: ImportedIHumanFaceLipMarginPoint): string => point.identity);
    if (lipPoints[0][0] > lipPoints[lipPoints.length - 1][0]) {
      lipPoints.reverse();
      lipIds.reverse();
    }
    // The strip spans only the arc of the vestibular edge that faces the lip port: the bearings,
    // about the edge's own centre in the transverse plane, that the port itself covers.
    const pivot: number[] = [0, 2].map(
      (axis: number): number => edge.reduce((sum: number, point: number[]): number => sum + point[axis], 0) / n,
    );
    const bearing: (point: readonly number[]) => number = (point: readonly number[]): number =>
      Math.atan2(point[0] - pivot[0], point[2] - pivot[1]);
    const bearings: number[] = lipPoints.map(bearing);
    const least: number = Math.min(...bearings),
      most: number = Math.max(...bearings);
    const rimVertices: number[] = Array.from({ length: n }, (_: unknown, vertex: number): number => vertex)
      .filter(
        (vertex: number): boolean =>
          bearing(edge[vertex]) >= least && bearing(edge[vertex]) <= most,
      )
      .sort((a: number, b: number): number => bearing(edge[a]) - bearing(edge[b]));
    if (rimVertices.length < 2)
      throw new Error(
        "Oral soft wall needs a vestibular arc facing the lip port.",
      );
    const rim: number[][] = rimVertices.map((vertex: number): number[] => edge[vertex]);
    const a: number[] = stations(rim),
      b: number[] = stations(lipPoints),
      count: number = rim.length;
    const indices: number[] = [];
    let i: number = 0,
      j: number = 0;
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
      for (let at: number = 0; at < indices.length; at += 3)
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
        ...rimVertices.map((vertex: number): string => wall.physicalPoints[n + vertex]),
        ...lipIds,
      ],
    });
  }
  return { ...assembly, parts: [...assembly.parts, ...joined] };
}
