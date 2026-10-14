import {
  type IAutoMovieMeshCrossing as ImportedIAutoMovieMeshCrossing,
  Vector3,
  measureAutoMovieMeshCrossings,
  triangulateAutoMovieRegion,
} from "@automovie/engine";
import type {
  IAutoMovieHumanFaceBasisContact as ImportedIAutoMovieHumanFaceBasisContact,
  IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface,
} from "@automovie/human";
import type {
  IAutoMovieMesh,
  IAutoMovieVector3 as ImportedIAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanFaceLipMarginPoint as ImportedIHumanFaceLipMarginPoint } from "../../basis/IHumanFaceLipMarginPoint";
import type { IHumanFaceLipMarginPoints as ImportedIHumanFaceLipMarginPoints } from "../../basis/IHumanFaceLipMarginPoints";
import { measureHumanFaceTongueSection } from "../../basis/measureHumanFaceTongueSection";
import { readHumanFaceLipMarginPoints } from "../../basis/readHumanFaceLipMarginPoints";
import type { IAutoMovieHumanFaceTonguePassageSummary } from "../../structures/IAutoMovieHumanFaceTonguePassageSummary";
import type { IHumanFaceOralPassageProps } from "./IHumanFaceOralPassageProps";

/**
 * Judge generated tongue passage from actual retained teeth and final lips. No clinical incisor landmark or absent native tooth is required. Existing rigid contact already enforces present-crown clearance floors. A tongue extending beyond the actual lower-lip port additionally needs its complete triangle/slab section inside the projected upper/lower lip opening, and may add no crown/tongue triangle crossing absent from the same shaped reference.
 *
 * The lip-plane projection and unchanged source slab/tolerance are coarse geometric conventions, not a clinical incisal acquisition, full 3D lip seal certificate, constant-volume mechanics or pharyngeal reconstruction. Source baseline crossings are retained by exact triangle-pair identity rather than forgiven by an aggregate count. Absent crowns supply no query or crossing.
 *
 * @evidence contracts/common.md#principled-implementation A protruding tongue's complete triangle/slab projection must fit final lip ports and add no retained-crown crossing beyond the shaped reference.
 * @evidence contracts/common.md#clear-and-simple-design Actual present-crown queries avoid dependence on removed native incisor landmarks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source triangle-pair identities preserve baseline crossings; coarse projection/slab tests are not a full 3D seal, clinical incisal acquisition or pharyngeal reconstruction.
 * @evidence contracts/common.md#meaningful-documentation Head metres, unchanged source tolerance/slab and jaw-derived directions define the returned lip-port summary or nonprotruding null.
 * @evidence contracts/performance.md#efficient-algorithms Triangle clipping times lip-edge checks and per-crown complete reference/posed crossing censuses dominate cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Projected tongue coordinates and one lip opening are reused across triangles; baseline pair sets serve each corresponding crown comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Projected buffers/census sets are per-call temporaries and only the small summary escapes; source arrays/colliders stay borrowed.
 *
 * @author Samchon
 */
export function evaluateHumanFaceOralPassage(
  props: IHumanFaceOralPassageProps,
): IAutoMovieHumanFaceTonguePassageSummary | null {
  const {
    basis,
    assembly,
    positions,
    reference,
    up,
    forward,
  }: IHumanFaceOralPassageProps = props;
  const contact: ImportedIAutoMovieHumanFaceBasisContact | undefined =
    basis.contact;
  if (contact?.margin === undefined || assembly.dentalColliders === undefined)
    throw new Error(
      "Generated oral passage needs actual retained crowns and complete source lip ports.",
    );
  const skin: readonly number[] | undefined = positions.get(
      contact.lips.surface,
    ),
    tongue: readonly number[] | undefined = positions.get(
      contact.passage.surface,
    );
  const tongueRest: readonly number[] | undefined = reference.get(
    contact.passage.surface,
  );
  const sourceTongue: ImportedIAutoMovieHumanFaceBasisSurface | undefined =
    basis.surfaces.find(
      (surface: ImportedIAutoMovieHumanFaceBasisSurface): boolean =>
        surface.id === contact.passage.surface,
    );
  const sourceSkin: ImportedIAutoMovieHumanFaceBasisSurface | undefined =
    basis.surfaces.find(
      (surface: ImportedIAutoMovieHumanFaceBasisSurface): boolean =>
        surface.id === contact.lips.surface,
    );
  if (
    skin === undefined ||
    tongue === undefined ||
    tongueRest === undefined ||
    sourceTongue === undefined ||
    sourceSkin === undefined
  )
    throw new Error(
      "Generated oral passage needs actual performed and shape-only tongue geometry.",
    );
  const ports: ImportedIHumanFaceLipMarginPoints = readHumanFaceLipMarginPoints(
    sourceSkin,
    contact.margin,
    skin,
  );
  const lower: ImportedIAutoMovieVector3[] = ports.lower.map(
    (entry: ImportedIHumanFaceLipMarginPoint): ImportedIAutoMovieVector3 =>
      entry.point,
  );
  const origin: ImportedIAutoMovieVector3 = Vector3.scale(
    lower.reduce(
      (
        sum: ImportedIAutoMovieVector3,
        point: ImportedIAutoMovieVector3,
      ): ImportedIAutoMovieVector3 => Vector3.add(sum, point),
      Vector3.create(0, 0, 0),
    ),
    1 / lower.length,
  );
  const section: { protrudingMetres: number; thicknessMetres: number | null } =
    measureHumanFaceTongueSection(tongue, sourceTongue.indices, {
      origin,
      forward,
      up,
      slabMetres: contact.passage.slabMetres,
    });
  if (section.protrudingMetres <= contact.toleranceMetres) return null;
  if (section.thicknessMetres === null)
    throw new Error(
      "The protruding tongue has no actual lip-port slab section.",
    );
  const across: ImportedIAutoMovieVector3 = Vector3.cross(up, forward);
  const projected: (point: readonly number[]) => number[] = (
    point: readonly number[],
  ): number[] => {
    const delta: ImportedIAutoMovieVector3 = Vector3.subtract(
      Vector3.create(...point),
      origin,
    );
    return [
      Vector3.dot(delta, across),
      Vector3.dot(delta, up),
      Vector3.dot(delta, forward),
    ];
  };
  const upper: number[][] = ports.upper.map(
    ({ point }: ImportedIHumanFaceLipMarginPoint): number[] =>
      projected([point.x, point.y, point.z]),
  );
  const bottom: number[][] = ports.lower.map(
    ({ point }: ImportedIHumanFaceLipMarginPoint): number[] =>
      projected([point.x, point.y, point.z]),
  );
  if (
    (upper[upper.length - 1][0] - upper[0][0]) *
      (bottom[bottom.length - 1][0] - bottom[0][0]) >
    0
  )
    bottom.reverse();
  const opening: number[][] = [...upper, ...bottom].filter(
    (point: number[], at: number, points: number[][]): boolean =>
      at === 0 ||
      point[0] !== points[at - 1][0] ||
      point[1] !== points[at - 1][1],
  );
  if (
    opening.length > 1 &&
    opening[0][0] === opening[opening.length - 1][0] &&
    opening[0][1] === opening[opening.length - 1][1]
  )
    opening.pop();
  triangulateAutoMovieRegion({
    outer: opening.map((point: number[]): { x: number; y: number } => ({
      x: point[0],
      y: point[1],
    })),
  });
  const inside: (point: readonly number[]) => boolean = (
    point: readonly number[],
  ): boolean => {
    let contained: boolean = false;
    for (let at: number = 0; at < opening.length; at++) {
      const a: number[] = opening[at],
        b: number[] = opening[(at + 1) % opening.length];
      const dx: number = b[0] - a[0],
        dy: number = b[1] - a[1],
        length: number = Math.hypot(dx, dy);
      if (length > 0) {
        const t: number =
          ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (length * length);
        if (
          t >= 0 &&
          t <= 1 &&
          Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy) <=
            contact.toleranceMetres
        )
          return true;
      }
      if (
        a[1] > point[1] !== b[1] > point[1] &&
        point[0] < a[0] + ((point[1] - a[1]) * dx) / dy
      )
        contained = !contained;
    }
    return contained;
  };
  const crossesBoundary: (
    a: readonly number[],
    b: readonly number[],
  ) => boolean = (a: readonly number[], b: readonly number[]): boolean => {
    const orientation: (
      p: readonly number[],
      q: readonly number[],
      r: readonly number[],
    ) => number = (
      p: readonly number[],
      q: readonly number[],
      r: readonly number[],
    ): number => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    for (let at: number = 0; at < opening.length; at++) {
      const c: number[] = opening[at],
        d: number[] = opening[(at + 1) % opening.length];
      const ab: number = Math.hypot(b[0] - a[0], b[1] - a[1]),
        cd: number = Math.hypot(d[0] - c[0], d[1] - c[1]);
      const toleranceAB: number = contact.toleranceMetres * ab,
        toleranceCD: number = contact.toleranceMetres * cd;
      const ca: number = orientation(a, b, c),
        da: number = orientation(a, b, d),
        ac: number = orientation(c, d, a),
        bc: number = orientation(c, d, b);
      if (
        ((ca > toleranceAB && da < -toleranceAB) ||
          (da > toleranceAB && ca < -toleranceAB)) &&
        ((ac > toleranceCD && bc < -toleranceCD) ||
          (bc > toleranceCD && ac < -toleranceCD))
      )
        return true;
    }
    return false;
  };
  const projectedTongue: number[][] = Array.from(
    { length: tongue.length / 3 },
    (_: unknown, vertex: number): number[] =>
      projected(tongue.slice(3 * vertex, 3 * vertex + 3)),
  );
  for (let at: number = 0; at < sourceTongue.indices.length; at += 3) {
    let polygon: number[][] = sourceTongue.indices
      .slice(at, at + 3)
      .map((vertex: number): number[] => projectedTongue[vertex]);
    for (const direction of [-1, 1]) {
      const next: number[][] = [];
      for (let k: number = 0; k < polygon.length; k++) {
        const a: number[] = polygon[k],
          b: number[] = polygon[(k + 1) % polygon.length];
        const first: boolean = direction * a[2] <= contact.passage.slabMetres,
          second: boolean = direction * b[2] <= contact.passage.slabMetres;
        if (first) next.push(a);
        if (first !== second) {
          const t: number =
            (direction * contact.passage.slabMetres - a[2]) / (b[2] - a[2]);
          next.push(
            a.map(
              (value: number, axis: number): number =>
                value + t * (b[axis] - value),
            ),
          );
        }
      }
      polygon = next;
    }
    if (
      polygon.some((point: number[]): boolean => !inside(point)) ||
      polygon.some((point: number[], k: number): boolean =>
        crossesBoundary(point, polygon[(k + 1) % polygon.length]),
      )
    )
      throw new Error(
        "The performed tongue triangle/slab section does not fit the actual lip opening.",
      );
  }
  const performedMesh: IAutoMovieMesh = {
    positions: [...tongue],
    indices: sourceTongue.indices,
    normals: null,
    uvs: null,
    skin: null,
  };
  const referenceMesh: IAutoMovieMesh = {
    ...performedMesh,
    positions: [...tongueRest],
  };
  for (const crown of assembly.dentalColliders) {
    const known: Set<string> = new Set(
      measureAutoMovieMeshCrossings(referenceMesh, crown.rest, {
        allPairs: true,
      }).map(
        (pair: ImportedIAutoMovieMeshCrossing): string =>
          pair.triangle + ":" + pair.other + ":" + pair.coplanar,
      ),
    );
    const additional: ImportedIAutoMovieMeshCrossing | undefined =
      measureAutoMovieMeshCrossings(performedMesh, crown.posed, {
        allPairs: true,
      }).find(
        (pair: ImportedIAutoMovieMeshCrossing): boolean =>
          !known.has(pair.triangle + ":" + pair.other + ":" + pair.coplanar),
      );
    if (additional !== undefined)
      throw new Error(
        "The performed tongue adds a crossing of an actual retained crown at tongue triangle " +
          additional.triangle +
          ".",
      );
  }
  return {
    plane: "lip-port",
    protrudingMetres: section.protrudingMetres,
    thicknessMetres: section.thicknessMetres,
  };
}
