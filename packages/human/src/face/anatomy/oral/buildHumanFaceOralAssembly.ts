import {
  type IAutoMovieProfilePoint,
  type IAutoMovieRegionTriangulation as ImportedIAutoMovieRegionTriangulation,
  triangulateAutoMovieRegion,
} from "@automovie/engine";
import type {
  IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface,
  IAutoMovieHumanFaceOralSupport as ImportedIAutoMovieHumanFaceOralSupport,
  IHumanFaceOralArchFrame as ImportedIHumanFaceOralArchFrame,
  IHumanFaceOralCrown as ImportedIHumanFaceOralCrown,
  IHumanFaceOralLiningDimensions as ImportedIHumanFaceOralLiningDimensions,
  IHumanFaceOralLiningField as ImportedIHumanFaceOralLiningField,
  IHumanFaceOralToothStation as ImportedIHumanFaceOralToothStation,
  IHumanPhysicalSampleRegistration as ImportedIHumanPhysicalSampleRegistration,
} from "@automovie/human";
import type { IAutoMovieMesh as ImportedIAutoMovieMesh } from "@automovie/interface";

import { createHumanBasisRegion } from "../../../common/basis/createHumanBasisRegion";
import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOral } from "../../structures/IAutoMovieHumanFaceOral";
import type { IHumanFaceOralAssembly } from "./IHumanFaceOralAssembly";
import type { IHumanFaceOralPart } from "./IHumanFaceOralPart";
import { assertHumanFaceOralSupport } from "./assertHumanFaceOralSupport";
import { createHumanFaceOralLiningField } from "./createHumanFaceOralLiningField";
import { readHumanFaceOralCrowns } from "./readHumanFaceOralCrowns";
import { refineHumanFaceOralLining } from "./refineHumanFaceOralLining";
import { relaxHumanFaceOralLining } from "./relaxHumanFaceOralLining";
import { resolveHumanFaceOralArchFrame } from "./resolveHumanFaceOralArchFrame";
import { resolveHumanFaceOralLiningDimensions } from "./resolveHumanFaceOralLiningDimensions";

/**
 * Author continuous gingiva, palate/floor and peripheral walls from the same transformed cervical ports used by the resident source crowns.
 *
 * Each arch is built in its own arch frame, the plane its cervical rings lie about. The lining is one height field over that plane, the local cervical height plus an apical rise, so the gingiva starts from every tooth's own ring and the palate and floor are the same field's lingual vault. The field owner states the formula and the dimension resolver the lengths.
 *
 * The outline is the rings' convex envelope pushed out to the vestibular fornix. It is an authored oral lining outline, not the lip closure boundary and never a substitute for the resident lip contact owner. Exact crown ports are holes in that lining; malformed or intersecting combinations refuse through the common constrained polygon owner.
 *
 * The outline and the interior are sampled at the median spacing of the cervical rings, by the refinement owner. Crown and wall boundary edges stay exact and unsplit. The gingival region is the lining within one collar thickness of a ring in the arch plane; it is a finish boundary and no clinical mucogingival or hard/soft-palate boundary. Region separation shares vertices and physical identities; no independent overlapping roof or floor cap is layered over gingiva. The vestibular wall hangs from the lining's rim back to the local cervical height under the same head/jaw owner along the whole facial rim. Between the terminal crowns the rim has no wall and a posterior opening is retained rather than labelled a reconstructed pharynx.
 *
 * @evidence contracts/common.md#principled-implementation Registered source crowns and one arch height field produce shared gingiva, vault/floor and vestibular-wall surfaces with exact cervical ports.
 * @evidence contracts/common.md#clear-and-simple-design Material regions share physical points and posterior opening remains separate from lip-port connection and rigid query assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored envelopes are not reconstructed pharynx; malformed polygons, source/Float32 rank loss and nonfinite output refuse while unresolved sampling is reported for the builder's later gate.
 * @evidence contracts/common.md#meaningful-documentation Head metres and ISO/native identities preserve absent-crown distinction from resident replacement population.
 * @evidence contracts/performance.md#efficient-algorithms Source region extraction, hull sorting, polygon triangulation and at most 64 outer refinement/relax cycles dominate; field samples scan cervical rings.
 * @evidence contracts/performance.md#reuse-equivalent-work One frame/field and common normals serve each arch's finish regions; exact cervical points reuse original source coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned generated buffers/ids and replacement sets scale with refined geometry, with no global byte cap implied by the pass caps; the returned assembly retains them.
 *
 * @author Samchon
 */
export function buildHumanFaceOralAssembly(
  basis: IAutoMovieHumanFaceBasis,
  rest: ReadonlyMap<string, readonly number[]>,
  oral: IAutoMovieHumanFaceOral,
): IHumanFaceOralAssembly {
  const dental: readonly number[] | undefined = rest.get("Human.teeth_base");
  if (dental === undefined)
    throw new Error("Oral lining needs its shaped dental source.");
  const crowns: ImportedIHumanFaceOralCrown[] = readHumanFaceOralCrowns(basis);
  assertHumanFaceOralSupport(basis, crowns);
  const native: ImportedIAutoMovieHumanFaceBasisSurface = basis.surfaces.find(
    (surface: ImportedIAutoMovieHumanFaceBasisSurface): boolean =>
      surface.id === "Human.teeth_base",
  )!;
  const dentalNormals: number[] = areaWeightedNormals(
    [...dental],
    native.indices,
  );
  const parts: IHumanFaceOralPart[] = [];
  const absentDentalVertices: Set<number> = new Set<number>();
  let unresolvedEdges: number = 0;
  const cross: (
    a: IAutoMovieProfilePoint,
    b: IAutoMovieProfilePoint,
    c: IAutoMovieProfilePoint,
  ) => number = (
    a: IAutoMovieProfilePoint,
    b: IAutoMovieProfilePoint,
    c: IAutoMovieProfilePoint,
  ): number => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (const mandibular of [false, true]) {
    const members: ImportedIHumanFaceOralCrown[] = crowns.filter(
      (crown: ImportedIHumanFaceOralCrown): boolean =>
        crown.mandibular === mandibular,
    );
    const prefix: "mandibular" | "maxillary" = mandibular
      ? "mandibular"
      : "maxillary";
    const owner: "head" | "jaw" = mandibular ? "jaw" : "head";
    for (const crown of members) {
      if (
        oral.teeth?.[
          crown.id as keyof NonNullable<IAutoMovieHumanFaceOral["teeth"]>
        ]?.present === false
      )
        continue;
      const allowed: Set<number> = new Set(crown.vertices);
      for (const region of native.regions) {
        const indices: number[] = [],
          uvs: number[] | null = region.uvs === null ? null : [];
        for (let at: number = 0; at < region.indices.length; at += 3) {
          if (
            !region.indices
              .slice(at, at + 3)
              .every((vertex: number): boolean => allowed.has(vertex))
          )
            continue;
          indices.push(...region.indices.slice(at, at + 3));
          if (uvs !== null) uvs.push(...region.uvs!.slice(2 * at, 2 * at + 6));
        }
        if (indices.length === 0) continue;
        const gather: (
          positions: readonly number[],
          normals: readonly number[],
          colors?: readonly number[],
          physical?: ImportedIHumanPhysicalSampleRegistration,
        ) => ImportedIAutoMovieMesh = createHumanBasisRegion({ indices, uvs });
        const mesh: ImportedIAutoMovieMesh = gather(
          [...dental],
          dentalNormals,
          undefined,
          {
            domain: "oral-native",
            samples: Array.from(
              { length: dental.length / 3 },
              (_: unknown, vertex: number): number => vertex,
            ),
          },
        );
        const physicalPoints: string[] = mesh.physicalVertices!.vertices.map(
          (vertex: number | null): string => {
            if (vertex === null)
              throw new Error(
                "Oral crown lost its native physical registration.",
              );
            return "dental:" + mesh.physicalVertices!.sources[vertex].id;
          },
        );
        parts.push({
          id: "tooth-" + crown.id + ":" + region.id,
          materialRole: "enamel",
          owner,
          mesh,
          physicalPoints,
        });
      }
    }
    const frame: ImportedIHumanFaceOralArchFrame =
      resolveHumanFaceOralArchFrame(members, dental, mandibular);
    const dimensions: ImportedIHumanFaceOralLiningDimensions =
      resolveHumanFaceOralLiningDimensions(oral, mandibular);
    const field: ImportedIHumanFaceOralLiningField =
      createHumanFaceOralLiningField(frame, dimensions);
    const world: (u: number, v: number, a: number) => number[] = (
      u: number,
      v: number,
      a: number,
    ): number[] =>
      frame.origin.map(
        (value: number, axis: number): number =>
          value +
          u * frame.lateral[axis] +
          v * frame.forward[axis] +
          a * frame.apical[axis],
      );
    const rings: IAutoMovieProfilePoint[][] = frame.stations.map(
      (station: ImportedIHumanFaceOralToothStation): IAutoMovieProfilePoint[] =>
        station.vertices.map(
          (_: number, k: number): IAutoMovieProfilePoint => ({
            x: station.cervical[3 * k],
            y: station.cervical[3 * k + 1],
          }),
        ),
    );
    const ordinals: number[] = frame.stations.flatMap(
      (station: ImportedIHumanFaceOralToothStation): number[] =>
        station.vertices,
    );
    const all: IAutoMovieProfilePoint[] = rings.flat();
    // The lining is sampled at the spacing of the cervical rings it joins.
    const spacing: number[] = frame.stations
      .flatMap((station: ImportedIHumanFaceOralToothStation): number[] =>
        station.vertices.map((_: number, k: number): number => {
          const next: number = (k + 1) % station.vertices.length;
          return Math.hypot(
            ...[0, 1, 2].map(
              (axis: number): number =>
                station.cervical[3 * k + axis] -
                station.cervical[3 * next + axis],
            ),
          );
        }),
      )
      .sort((a: number, b: number): number => a - b);
    const edge: number = spacing[Math.floor(spacing.length / 2)];
    const sorted: IAutoMovieProfilePoint[] = [...all]
      .sort(
        (a: IAutoMovieProfilePoint, b: IAutoMovieProfilePoint): number =>
          a.x - b.x || a.y - b.y,
      )
      .filter(
        (
          p: IAutoMovieProfilePoint,
          k: number,
          rows: IAutoMovieProfilePoint[],
        ): boolean => k === 0 || p.x !== rows[k - 1].x || p.y !== rows[k - 1].y,
      );
    const hull: IAutoMovieProfilePoint[] = [];
    for (const point of sorted) {
      while (
        hull.length > 1 &&
        cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0
      )
        hull.pop();
      hull.push(point);
    }
    const lower: number = hull.length;
    for (const point of sorted.slice(0, -1).reverse()) {
      while (
        hull.length > lower &&
        cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0
      )
        hull.pop();
      hull.push(point);
    }
    hull.pop();
    // The fornix outline: the rings' convex envelope pushed out from the arch origin.
    const envelope: { x: number; y: number }[] = hull.map(
      (p: IAutoMovieProfilePoint): { x: number; y: number } => {
        const radius: number = Math.hypot(p.x, p.y);
        if (radius === 0)
          throw new Error("Oral arch envelope has a degenerate radial point.");
        return {
          x: p.x + (dimensions.wallClearanceMetres * p.x) / radius,
          y:
            p.y +
            ((p.y < 0
              ? dimensions.posteriorReachMetres
              : dimensions.wallClearanceMetres) *
              p.y) /
              radius,
        };
      },
    );
    const outer: IAutoMovieProfilePoint[] = [];
    envelope.forEach((a: { x: number; y: number }, k: number): void => {
      const b: { x: number; y: number } = envelope[(k + 1) % envelope.length];
      const pieces: number = Math.max(
        1,
        Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / edge),
      );
      for (let piece: number = 0; piece < pieces; piece++)
        outer.push({
          x: a.x + ((b.x - a.x) * piece) / pieces,
          y: a.y + ((b.y - a.y) * piece) / pieces,
        });
    });
    const inputPlanar: number[][] = [...outer, ...all].map(
      (p: IAutoMovieProfilePoint): number[] => [p.x, p.y],
    );
    const inputIds: string[] = [
      ...outer.map(
        (_: IAutoMovieProfilePoint, k: number): string => prefix + ":rim:" + k,
      ),
      ...ordinals.map((v: number): string => "dental:" + v),
    ];
    const triangulation: ImportedIAutoMovieRegionTriangulation =
      triangulateAutoMovieRegion({ outer, holes: rings });
    const planar: number[][] = triangulation.sourceIndices.map(
      (v: number): number[] => inputPlanar[v],
    );
    const physicalPoints: string[] = triangulation.sourceIndices.map(
      (v: number): string => inputIds[v],
    );
    const boundaryEdges: Set<string> = new Set<string>();
    for (const ring of triangulation.rings) {
      for (let k: number = 0; k < ring.count; k++) {
        const a: number = ring.start + k,
          b: number = ring.start + ((k + 1) % ring.count);
        boundaryEdges.add(Math.min(a, b) + ":" + Math.max(a, b));
      }
    }
    const outerEdges: number[][] = [];
    for (let at: number = 0; at < triangulation.triangles.length; at += 3)
      for (let corner: number = 0; corner < 3; corner++) {
        const a: number = triangulation.triangles[at + corner],
          b: number = triangulation.triangles[at + ((corner + 1) % 3)];
        const x: number = triangulation.sourceIndices[a],
          y: number = triangulation.sourceIndices[b];
        if (
          x < outer.length &&
          y < outer.length &&
          boundaryEdges.has(Math.min(a, b) + ":" + Math.max(a, b))
        )
          outerEdges.push(mandibular ? [y, x] : [x, y]);
      }
    const cervicalPoints: Set<number> = new Set(
      triangulation.sourceIndices.flatMap(
        (source: number, at: number): number[] =>
          source < outer.length ? [] : [at],
      ),
    );
    // Alternate sampling and approximate diagonal quality. A quality flip can
    // create a collar-to-collar diagonal that needs its own field sample.
    let indices: number[] = relaxHumanFaceOralLining(
      planar,
      triangulation.triangles,
      boundaryEdges,
      cervicalPoints,
    );
    for (let pass: number = 0; pass < 64; pass++) {
      const priorPoints: number = planar.length;
      const prior: number[] = indices;
      indices = refineHumanFaceOralLining(
        planar,
        indices,
        boundaryEdges,
        cervicalPoints,
        edge,
      );
      indices = relaxHumanFaceOralLining(
        planar,
        indices,
        boundaryEdges,
        cervicalPoints,
      );
      if (
        planar.length === priorPoints &&
        indices.length === prior.length &&
        indices.every(
          (vertex: number, at: number): boolean => vertex === prior[at],
        )
      )
        break;
    }
    for (let at: number = 0; at < indices.length; at += 3)
      for (let corner: number = 0; corner < 3; corner++) {
        const a: number = indices[at + corner],
          b: number = indices[at + ((corner + 1) % 3)];
        if (
          a < b &&
          !boundaryEdges.has(a + ":" + b) &&
          ((cervicalPoints.has(a) && cervicalPoints.has(b)) ||
            Math.hypot(
              planar[a][0] - planar[b][0],
              planar[a][1] - planar[b][1],
            ) > edge)
        )
          unresolvedEdges++;
      }
    for (let at: number = physicalPoints.length; at < planar.length; at++)
      physicalPoints.push(
        prefix + ":lining:" + (at - triangulation.sourceIndices.length),
      );
    // Cervical points keep their exact native coordinates; every other point is a sample of the one lining field.
    const points: number[][] = planar.map(
      (p: number[], at: number): number[] => {
        const source: number =
          at < triangulation.sourceIndices.length
            ? triangulation.sourceIndices[at]
            : -1;
        if (source < outer.length)
          return world(p[0], p[1], field.apical(p[0], p[1]));
        const vertex: number = ordinals[source - outer.length];
        return [
          dental[3 * vertex],
          dental[3 * vertex + 1],
          dental[3 * vertex + 2],
        ];
      },
    );
    // Exact source-coincident corners carry no source face. Float32-created
    // coincidence is different: retain that source face for the emitted gate
    // to report its loss instead of discarding it from the checked population.
    const sourceCoordinates: string[] = points.map((point: number[]): string =>
      point.join(","),
    );
    indices = indices.filter((_: number, at: number): boolean => {
      const start: number = at - (at % 3);
      const [a, b, c]: [string, string, string] = [
        sourceCoordinates[indices[start]],
        sourceCoordinates[indices[start + 1]],
        sourceCoordinates[indices[start + 2]],
      ];
      const [ia, ib, ic]: string[] = indices
        .slice(start, start + 3)
        .map((vertex: number): string => physicalPoints[vertex]);
      // Distinct native identities that meet geometrically are not aliases;
      // retain their face so the source rank gate reports that failure.
      return !(
        (a === b && ia === ib) ||
        (b === c && ib === ic) ||
        (c === a && ic === ia)
      );
    });
    const gingiva: number[] = [],
      enclosure: number[] = [];
    for (let at: number = 0; at < indices.length; at += 3) {
      const triangle: number[] = indices.slice(at, at + 3);
      const u: number =
        triangle.reduce(
          (sum: number, vertex: number): number => sum + planar[vertex][0],
          0,
        ) / 3;
      const v: number =
        triangle.reduce(
          (sum: number, vertex: number): number => sum + planar[vertex][1],
          0,
        ) / 3;
      const target: number[] =
        field.distance(u, v) <= dimensions.collarThicknessMetres
          ? gingiva
          : enclosure;
      target.push(
        ...(mandibular ? [triangle[0], triangle[2], triangle[1]] : triangle),
      );
    }
    // The consumer reads both source and emitted arithmetic. Rounding can
    // turn a source-collinear cell into a tiny Float32 sliver; that does not
    // supply the missing source face. Retain the whole invalid population.
    const invalidFaces: string[] = [];
    for (let at: number = 0; at < indices.length; at += 3) {
      for (const precision of ["source-Binary64", "emitted-Float32"] as const) {
        const [p, q, r]: number[][] = indices
          .slice(at, at + 3)
          .map((vertex: number): number[] =>
            precision === "source-Binary64"
              ? points[vertex]
              : points[vertex].map(Math.fround),
          );
        const ab: number[] = q.map(
            (value: number, axis: number): number => value - p[axis],
          ),
          ac: number[] = r.map(
            (value: number, axis: number): number => value - p[axis],
          );
        const aa: number = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2,
          bb: number = ac[0] ** 2 + ac[1] ** 2 + ac[2] ** 2,
          abac: number = ab[0] * ac[0] + ab[1] * ac[1] + ab[2] * ac[2];
        const rank: number = aa * bb - abac * abac;
        if (!(rank > 0) || !Number.isFinite(rank))
          invalidFaces.push(
            prefix +
              " triangle " +
              at / 3 +
              " " +
              precision +
              " rank " +
              rank +
              ": " +
              indices
                .slice(at, at + 3)
                .map(
                  (vertex: number): string =>
                    physicalPoints[vertex] +
                    " (" +
                    planar[vertex]
                      .map((value: number): string => (value * 1000).toFixed(4))
                      .join(", ") +
                    " mm)",
                )
                .join("; "),
          );
      }
    }
    if (invalidFaces.length > 0)
      throw new Error(
        "Oral lining emitted " +
          invalidFaces.length +
          " invalid triangle/precision relations: " +
          invalidFaces.join(" | "),
      );
    const commonNormals: number[] = areaWeightedNormals(points.flat(), [
      ...gingiva,
      ...enclosure,
    ]);
    for (const [role, triangles] of [
      ["gingiva", gingiva],
      [mandibular ? "floor" : "palate", enclosure],
    ] as const)
      if (triangles.length !== 0)
        parts.push({
          id: prefix + ":" + role,
          materialRole: role,
          owner,
          mesh: {
            positions: points.flat(),
            indices: triangles,
            normals: [...commonNormals],
            uvs: null,
            skin: null,
          },
          physicalPoints: [...physicalPoints],
        });
    // The vestibular wall descends one collar height from the fornix field.
    const fornix: number[] = outer.map((p: IAutoMovieProfilePoint): number =>
      field.apical(p.x, p.y),
    );
    const wallPoints: number[][] = outer.map(
      (p: IAutoMovieProfilePoint, k: number): number[] =>
        world(p.x, p.y, fornix[k]),
    );
    const wallIds: string[] = outer.map(
      (_: IAutoMovieProfilePoint, k: number): string => prefix + ":rim:" + k,
    );
    const n: number = wallPoints.length;
    wallPoints.push(
      ...outer.map((p: IAutoMovieProfilePoint, k: number): number[] =>
        world(p.x, p.y, fornix[k] - dimensions.collarHeightMetres),
      ),
    );
    wallIds.push(
      ...outer.map(
        (_: IAutoMovieProfilePoint, k: number): string =>
          prefix + ":vestibule:" + k,
      ),
    );
    const wallIndices: number[] = [];
    for (const [a, b] of outerEdges) {
      // The posterior opening between the terminal crowns is a declared source limitation; the facial rim keeps its wall all the way back.
      if (
        field.lingualDepth(outer[a].x, outer[a].y) > 0 &&
        field.lingualDepth(outer[b].x, outer[b].y) > 0
      )
        continue;
      // The lining's directed boundary owns the wall winding in both arches.
      wallIndices.push(b, a, n + a, b, n + a, n + b);
    }
    parts.push({
      id: prefix + ":vestibular-wall",
      materialRole: "wall",
      owner,
      mesh: {
        positions: wallPoints.flat(),
        indices: wallIndices,
        normals: null,
        uvs: null,
        skin: null,
      },
      physicalPoints: wallIds,
    });
    for (const crown of members)
      if (
        oral.teeth?.[
          crown.id as keyof NonNullable<IAutoMovieHumanFaceOral["teeth"]>
        ]?.present === false
      )
        for (const vertex of crown.vertices) absentDentalVertices.add(vertex);
  }
  if (
    parts.some(
      (part: IHumanFaceOralPart): boolean =>
        !part.mesh.positions.every(
          (value: number): boolean =>
            Number.isFinite(value) && Number.isFinite(Math.fround(value)),
        ),
    )
  )
    throw new Error("Oral lining exceeds finite Float32 coordinates.");
  const support: ImportedIAutoMovieHumanFaceOralSupport | undefined =
    basis.oralSupport;
  if (support === undefined || support.dentalSurface !== "Human.teeth_base")
    throw new Error(
      "Oral assembly needs its producer-qualified native dental registration.",
    );
  return {
    generation: support.generation,
    dentalNativeSha256: support.dentalNativeSha256,
    dentalSurface: support.dentalSurface,
    replacedDentalVertices: new Set(
      Array.from(
        { length: dental.length / 3 },
        (_: unknown, vertex: number): number => vertex,
      ),
    ),
    parts,
    absentDentalVertices,
    liningUnresolvedEdges: unresolvedEdges,
  };
}
