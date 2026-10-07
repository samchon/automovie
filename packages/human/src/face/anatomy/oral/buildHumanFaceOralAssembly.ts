import {
  type IAutoMovieProfilePoint,
  triangulateAutoMovieRegion,
} from "@automovie/engine";

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
 * Author continuous gingiva, palate/floor and peripheral walls from the same
 * transformed cervical ports used by the resident source crowns.
 *
 * Each arch is built in its own arch frame, the plane its cervical rings lie
 * about. The lining is one height field over that plane, the local cervical
 * height plus an apical rise, so the gingiva starts from every tooth's own
 * ring and the palate and floor are the same field's lingual vault. The
 * field owner states the formula and the dimension resolver the lengths.
 *
 * The outline is the rings' convex envelope pushed out to the vestibular
 * fornix. It is an authored oral lining outline, not the lip closure boundary
 * and never a substitute for the resident lip contact owner. Exact crown
 * ports are holes in that lining; malformed or intersecting combinations
 * refuse through the common constrained polygon owner.
 *
 * The outline and the interior are sampled at the median spacing of the
 * cervical rings, by the refinement owner. Crown and wall boundary edges stay
 * exact and unsplit. The gingival region is the lining within one collar
 * thickness of a ring in the arch plane; it is a finish boundary and no
 * clinical mucogingival or hard/soft-palate boundary. Region separation
 * shares vertices and physical identities; no independent overlapping roof
 * or floor cap is layered over gingiva. The vestibular wall hangs from the
 * lining's rim back to the local cervical height under the same head/jaw
 * owner along the whole facial rim. Between the terminal crowns the rim has
 * no wall and a posterior opening is retained rather than labelled a reconstructed pharynx.
 *
 * @evidence contracts/common.md#principled-implementation One source cervical population defines crown holes, constrained lining triangles and their shared aliases, and one arch-frame height field places every generated point; the engine owns polygon admission.
 * @evidence contracts/common.md#clear-and-simple-design One rest-space assembly composes the arch frame, the lining field and the refinement into the dental lining and its exact peripheral wall rim.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No old incompatible gum outline, guessed clinical CEJ, bounding-box closure patch or tolerance repair enters.
 * @evidence contracts/modeling.md#part-identity-and-grouping Separates maxillary and mandibular gingiva, palate, floor and peripheral lining walls under head and jaw owners.
 * @evidence contracts/modeling.md#emitted-geometry A height field over the arch plane expresses gingiva, vault and floor; its triangle count follows the arch area over the squared cervical spacing, and the wall has two points per outline sample.
 * @evidence contracts/modeling.md#shared-boundaries Crown holes retain original dental ordinals and native coordinates; generated subdivisions and wall rims share exact point identities.
 * @evidence contracts/modeling.md#spatial-conventions Rest positions are head-frame metres; the arch frame converts to and from its lateral, anterior and apical coordinates.
 * @evidence contracts/anatomy.md#anatomical-source Licensed source roots supply the ports; the dimension resolver cites the vault and collar sources, and envelope, profile shapes and regional split remain authored geometry with unknown pharyngeal acquisition.
 * @evidence contracts/anatomy.md#permitted-range The common region kernel refuses crossing roots; finite positive authored clearances refuse without clamping.
 * @evidence contracts/anatomy.md#parametric-authority Named arch and space dimensions enter without personal sections or vertices.
 * @author Samchon
 */
export function buildHumanFaceOralAssembly(
  basis: IAutoMovieHumanFaceBasis,
  rest: ReadonlyMap<string, readonly number[]>,
  oral: IAutoMovieHumanFaceOral,
): IHumanFaceOralAssembly {
  const dental = rest.get("Human.teeth_base");
  if (dental === undefined)
    throw new Error("Oral lining needs its shaped dental source.");
  const crowns = readHumanFaceOralCrowns(basis);
  assertHumanFaceOralSupport(basis, crowns);
  const native = basis.surfaces.find(
    (surface) => surface.id === "Human.teeth_base",
  )!;
  const dentalNormals = areaWeightedNormals([...dental], native.indices);
  const parts: IHumanFaceOralPart[] = [];
  const absentDentalVertices = new Set<number>();
  let unresolvedEdges = 0;
  const cross = (
    a: IAutoMovieProfilePoint,
    b: IAutoMovieProfilePoint,
    c: IAutoMovieProfilePoint,
  ): number => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (const mandibular of [false, true]) {
    const members = crowns.filter((crown) => crown.mandibular === mandibular);
    const prefix = mandibular ? "mandibular" : "maxillary";
    const owner = mandibular ? "jaw" : "head";
    for (const crown of members) {
      if (
        oral.teeth?.[
          crown.id as keyof NonNullable<IAutoMovieHumanFaceOral["teeth"]>
        ]?.present === false
      )
        continue;
      const allowed = new Set(crown.vertices);
      for (const region of native.regions) {
        const indices: number[] = [],
          uvs: number[] | null = region.uvs === null ? null : [];
        for (let at = 0; at < region.indices.length; at += 3) {
          if (
            !region.indices
              .slice(at, at + 3)
              .every((vertex) => allowed.has(vertex))
          )
            continue;
          indices.push(...region.indices.slice(at, at + 3));
          if (uvs !== null) uvs.push(...region.uvs!.slice(2 * at, 2 * at + 6));
        }
        if (indices.length === 0) continue;
        const gather = createHumanBasisRegion({ indices, uvs });
        const mesh = gather([...dental], dentalNormals, undefined, {
          domain: "oral-native",
          samples: Array.from(
            { length: dental.length / 3 },
            (_, vertex) => vertex,
          ),
        });
        const physicalPoints = mesh.physicalVertices!.vertices.map((vertex) => {
          if (vertex === null)
            throw new Error(
              "Oral crown lost its native physical registration.",
            );
          return "dental:" + mesh.physicalVertices!.sources[vertex].id;
        });
        parts.push({
          id: "tooth-" + crown.id + ":" + region.id,
          materialRole: "enamel",
          owner,
          mesh,
          physicalPoints,
        });
      }
    }
    const frame = resolveHumanFaceOralArchFrame(members, dental, mandibular);
    const dimensions = resolveHumanFaceOralLiningDimensions(oral, mandibular);
    const field = createHumanFaceOralLiningField(frame, dimensions);
    const world = (u: number, v: number, a: number): number[] =>
      frame.origin.map(
        (value, axis) =>
          value +
          u * frame.lateral[axis] +
          v * frame.forward[axis] +
          a * frame.apical[axis],
      );
    const rings = frame.stations.map((station) =>
      station.vertices.map(
        (_, k): IAutoMovieProfilePoint => ({
          x: station.cervical[3 * k],
          y: station.cervical[3 * k + 1],
        }),
      ),
    );
    const ordinals = frame.stations.flatMap((station) => station.vertices);
    const all = rings.flat();
    // The lining is sampled at the spacing of the cervical rings it joins.
    const spacing = frame.stations
      .flatMap((station) =>
        station.vertices.map((_, k) => {
          const next = (k + 1) % station.vertices.length;
          return Math.hypot(
            ...[0, 1, 2].map(
              (axis) =>
                station.cervical[3 * k + axis] -
                station.cervical[3 * next + axis],
            ),
          );
        }),
      )
      .sort((a, b) => a - b);
    const edge = spacing[Math.floor(spacing.length / 2)];
    const sorted = [...all]
      .sort((a, b) => a.x - b.x || a.y - b.y)
      .filter(
        (p, k, rows) =>
          k === 0 || p.x !== rows[k - 1].x || p.y !== rows[k - 1].y,
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
    const lower = hull.length;
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
    const envelope = hull.map((p) => {
      const radius = Math.hypot(p.x, p.y);
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
    });
    const outer: IAutoMovieProfilePoint[] = [];
    envelope.forEach((a, k) => {
      const b = envelope[(k + 1) % envelope.length];
      const pieces = Math.max(
        1,
        Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / edge),
      );
      for (let piece = 0; piece < pieces; piece++)
        outer.push({
          x: a.x + ((b.x - a.x) * piece) / pieces,
          y: a.y + ((b.y - a.y) * piece) / pieces,
        });
    });
    const inputPlanar = [...outer, ...all].map((p) => [p.x, p.y]);
    const inputIds = [
      ...outer.map((_, k) => prefix + ":rim:" + k),
      ...ordinals.map((v) => "dental:" + v),
    ];
    const triangulation = triangulateAutoMovieRegion({ outer, holes: rings });
    const planar = triangulation.sourceIndices.map((v) => inputPlanar[v]);
    const physicalPoints = triangulation.sourceIndices.map((v) => inputIds[v]);
    const boundaryEdges = new Set<string>();
    for (const ring of triangulation.rings) {
      for (let k = 0; k < ring.count; k++) {
        const a = ring.start + k,
          b = ring.start + ((k + 1) % ring.count);
        boundaryEdges.add(Math.min(a, b) + ":" + Math.max(a, b));
      }
    }
    const outerEdges: number[][] = [];
    for (let at = 0; at < triangulation.triangles.length; at += 3)
      for (let corner = 0; corner < 3; corner++) {
        const a = triangulation.triangles[at + corner],
          b = triangulation.triangles[at + ((corner + 1) % 3)];
        const x = triangulation.sourceIndices[a],
          y = triangulation.sourceIndices[b];
        if (
          x < outer.length &&
          y < outer.length &&
          boundaryEdges.has(Math.min(a, b) + ":" + Math.max(a, b))
        )
          outerEdges.push(mandibular ? [y, x] : [x, y]);
      }
    const cervicalPoints = new Set(
      triangulation.sourceIndices.flatMap((source, at) =>
        source < outer.length ? [] : [at],
      ),
    );
    // Alternate sampling and approximate diagonal quality. A quality flip can
    // create a collar-to-collar diagonal that needs its own field sample.
    let indices = relaxHumanFaceOralLining(
      planar,
      triangulation.triangles,
      boundaryEdges,
      cervicalPoints,
    );
    for (let pass = 0; pass < 64; pass++) {
      const priorPoints = planar.length;
      const prior = indices;
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
        indices.every((vertex, at) => vertex === prior[at])
      )
        break;
    }
    for (let at = 0; at < indices.length; at += 3)
      for (let corner = 0; corner < 3; corner++) {
        const a = indices[at + corner],
          b = indices[at + ((corner + 1) % 3)];
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
    for (let at = physicalPoints.length; at < planar.length; at++)
      physicalPoints.push(
        prefix + ":lining:" + (at - triangulation.sourceIndices.length),
      );
    // Cervical points keep their exact native coordinates; every other point is a sample of the one lining field.
    const points = planar.map((p, at) => {
      const source =
        at < triangulation.sourceIndices.length
          ? triangulation.sourceIndices[at]
          : -1;
      if (source < outer.length)
        return world(p[0], p[1], field.apical(p[0], p[1]));
      const vertex = ordinals[source - outer.length];
      return [
        dental[3 * vertex],
        dental[3 * vertex + 1],
        dental[3 * vertex + 2],
      ];
    });
    // Exact source-coincident corners carry no source face. Float32-created
    // coincidence is different: retain that source face for the emitted gate
    // to report its loss instead of discarding it from the checked population.
    const sourceCoordinates = points.map((point) => point.join(","));
    indices = indices.filter((_, at) => {
      const start = at - (at % 3);
      const [a, b, c] = [
        sourceCoordinates[indices[start]],
        sourceCoordinates[indices[start + 1]],
        sourceCoordinates[indices[start + 2]],
      ];
      const [ia, ib, ic] = indices
        .slice(start, start + 3)
        .map((vertex) => physicalPoints[vertex]);
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
    for (let at = 0; at < indices.length; at += 3) {
      const triangle = indices.slice(at, at + 3);
      const u =
        triangle.reduce((sum, vertex) => sum + planar[vertex][0], 0) / 3;
      const v =
        triangle.reduce((sum, vertex) => sum + planar[vertex][1], 0) / 3;
      const target =
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
    for (let at = 0; at < indices.length; at += 3) {
      for (const precision of ["source-Binary64", "emitted-Float32"] as const) {
        const [p, q, r] = indices
          .slice(at, at + 3)
          .map((vertex) =>
            precision === "source-Binary64"
              ? points[vertex]
              : points[vertex].map(Math.fround),
          );
        const ab = q.map((value, axis) => value - p[axis]),
          ac = r.map((value, axis) => value - p[axis]);
        const aa = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2,
          bb = ac[0] ** 2 + ac[1] ** 2 + ac[2] ** 2,
          abac = ab[0] * ac[0] + ab[1] * ac[1] + ab[2] * ac[2];
        const rank = aa * bb - abac * abac;
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
                  (vertex) =>
                    physicalPoints[vertex] +
                    " (" +
                    planar[vertex]
                      .map((value) => (value * 1000).toFixed(4))
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
    const commonNormals = areaWeightedNormals(points.flat(), [
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
    // The vestibular wall hangs from the fornix back to the local cervical height.
    const fornix = outer.map((p) => field.apical(p.x, p.y));
    const wallPoints = outer.map((p, k) => world(p.x, p.y, fornix[k]));
    const wallIds = outer.map((_, k) => prefix + ":rim:" + k);
    const n = wallPoints.length;
    wallPoints.push(
      ...outer.map((p, k) =>
        world(p.x, p.y, fornix[k] - dimensions.collarHeightMetres),
      ),
    );
    wallIds.push(...outer.map((_, k) => prefix + ":vestibule:" + k));
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
      (part) =>
        !part.mesh.positions.every(
          (value) =>
            Number.isFinite(value) && Number.isFinite(Math.fround(value)),
        ),
    )
  )
    throw new Error("Oral lining exceeds finite Float32 coordinates.");
  const support = basis.oralSupport;
  if (support === undefined || support.dentalSurface !== "Human.teeth_base")
    throw new Error(
      "Oral assembly needs its producer-qualified native dental registration.",
    );
  return {
    generation: support.generation,
    dentalNativeSha256: support.dentalNativeSha256,
    dentalSurface: support.dentalSurface,
    replacedDentalVertices: new Set(
      Array.from({ length: dental.length / 3 }, (_, vertex) => vertex),
    ),
    parts,
    absentDentalVertices,
    liningUnresolvedEdges: unresolvedEdges,
  };
}
