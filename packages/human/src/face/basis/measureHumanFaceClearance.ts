import {
  createAutoMovieSignedMeshQuery,
  measureAutoMovieMeshCrossings,
  triangleIndicesOf,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type { IHumanFaceClearanceReference } from "./IHumanFaceClearanceReference";
import type { IHumanFaceClearanceRequest } from "./IHumanFaceClearanceRequest";

const references = new WeakMap<IAutoMovieMesh, IHumanFaceClearanceReference>();

/**
 * Read one subject against one reference surface and report the whole result.
 *
 * The instrument is the pair the face admissions already used: the engine's
 * signed mesh query for vertices and its triangle crossing census for faces a
 * vertex test cannot see. Both meshes are rounded to Float32 first, because
 * that is the precision the model emits and the exporter writes. Every queried
 * vertex is read; nothing stops at the first vertex past the tolerance, so the
 * record holds the counts and the extrema of the complete population.
 * The engine's shared incidence reader expands an unindexed mesh into its
 * consecutive triangle soup before vertex selection or crossing witnesses.
 * Malformed triples or referenced vertices refuse rather than reading empty.
 *
 * A judged relation is refused when a vertex lies deeper than the tolerance
 * on the forbidden side of the reference (inside it by default, outside it for
 * a part that must stay beneath a covering surface), when a vertex's side is unknown because its nearest
 * feature is the rim of an open reference, or when a non-coplanar triangle
 * crossing exists. Those are the conditions the periocular, ocular and lash
 * admissions applied one vertex at a time. An unjudged relation is never
 * refused; its numbers are an observation for the owner of that boundary.
 * A caller may classify each strict transverse point as intended insertion.
 * Excluding one point leaves every other edge and triangle witness in scope.
 *
 * An open reference is an oriented sheet. Its sign means something only near
 * it: a point beyond its rim or farther than its local feature size reads an
 * arbitrary side. The caller therefore states the reach its geometry
 * justifies, and a vertex beyond that reach is counted as unreached and
 * enters no other count. Without a reach, an open reference reports a side
 * for every vertex, which is valid only when the subject stays close to it.
 *
 * Uncertainty of the vertex reading is the Float32 rounding of both meshes,
 * at most half a unit in the last place of each coordinate. The reference is
 * the tessellated surface, so a reading against a curved exterior also carries
 * that surface's chord error, which this instrument does not know.
 *
 * @evidence contracts/common.md#principled-implementation Signed distance to the nearest feature decides containment and the triangle census decides transverse crossing; together they are the two ways one surface can pass another, and both are read over the whole subject.
 * @evidence contracts/common.md#clear-and-simple-design One instrument serves every face relation; owners differ only in the request they build.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tolerance is the caller's, no part or side is special-cased, and a relation that cannot be read is reported as unavailable instead of passing.
 * @evidence contracts/common.md#meaningful-documentation States the instrument, precision, refusal rule and the uncertainty it does and does not cover.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the head frame, read on Float32 coordinates.
 * @evidence contracts/modeling.md#shared-boundaries Measures the state of a boundary between two parts; it constructs nothing and its record names both sides.
 * @evidence contracts/modeling.md#rendered-observation A numerical helper; the part owners owe the rendered observation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads existing parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A geometric instrument supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Applies the requesting owner's existing geometric condition and adds no bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 */
export function measureHumanFaceClearance(
  request: IHumanFaceClearanceRequest,
): IAutoMovieHumanConstructionClearanceReading {
  const tolerance = request.toleranceMetres;
  const reading: IAutoMovieHumanConstructionClearanceReading = {
    owner: request.owner,
    state: request.state,
    subject: request.subject,
    against: request.against,
    judged: request.judged,
    refused: false,
    toleranceMetres: tolerance,
    vertices: 0,
    insideVertices: 0,
    outsideVertices: 0,
    boundaryVertices: 0,
    minimumSignedMetres: null,
    maximumSignedMetres: null,
    worstVertex: null,
    worstPoint: null,
    outermostVertex: null,
    outermostPoint: null,
    medianSignedMetres: null,
    percentile95SignedMetres: null,
    crossings: null,
    unavailable: null,
  };
  const precise = (mesh: IAutoMovieMesh): IAutoMovieMesh => ({
    ...mesh,
    positions: mesh.positions.map(Math.fround),
    indices: triangleIndicesOf(mesh, "Face clearance"),
  });
  try {
    if (!Number.isFinite(tolerance) || tolerance < 0)
      throw new Error("clearance needs a finite nonnegative tolerance");
    const subject = precise(request.mesh);
    // One construction reads many subjects against the same few references,
    // so the rounded reference and its compiled query are kept per mesh
    // object. A reference mesh is never modified after it is first read.
    let compiled = references.get(request.exterior);
    if (compiled === undefined) {
      compiled = { mesh: precise(request.exterior), queries: new Map() };
      references.set(request.exterior, compiled);
    }
    const exterior = compiled.mesh;
    let query = compiled.queries.get(request.boundary);
    if (query === undefined) {
      query = createAutoMovieSignedMeshQuery(exterior, {
        boundary: request.boundary,
      });
      compiled.queries.set(request.boundary, query);
    }
    const selected = request.vertices ?? [...new Set(subject.indices ?? [])];
    if (request.reachMetres !== undefined) reading.unreachedVertices = 0;
    const distances: number[] = [];
    for (const vertex of selected) {
      const point = subject.positions.slice(3 * vertex, 3 * vertex + 3);
      const hit = query(point);
      reading.vertices++;
      if (hit.boundary) {
        reading.boundaryVertices++;
        continue;
      }
      if (request.reachMetres !== undefined && hit.distance > request.reachMetres) {
        reading.unreachedVertices = (reading.unreachedVertices ?? 0) + 1;
        continue;
      }
      const signed = hit.signedDistance;
      distances.push(signed);
      if (signed < -tolerance) reading.insideVertices++;
      if (signed > tolerance) reading.outsideVertices++;
      if (
        reading.minimumSignedMetres === null ||
        signed < reading.minimumSignedMetres
      ) {
        reading.minimumSignedMetres = signed;
        reading.worstVertex = vertex;
        reading.worstPoint = point;
      }
      if (
        reading.maximumSignedMetres === null ||
        signed > reading.maximumSignedMetres
      ) {
        reading.maximumSignedMetres = signed;
        reading.outermostVertex = vertex;
        reading.outermostPoint = point;
      }
    }
    if (distances.length > 0) {
      distances.sort((a, b) => a - b);
      const rank = (fraction: number): number =>
        distances[
          Math.min(
            distances.length - 1,
            Math.max(0, Math.ceil(fraction * distances.length) - 1),
          )
        ];
      reading.medianSignedMetres = rank(0.5);
      reading.percentile95SignedMetres = rank(0.95);
    }
    if (request.crossingIndices !== null) {
      const faces =
        request.crossingIndices === undefined
          ? subject
          : { ...subject, indices: [...request.crossingIndices] };
      const hits =
        (faces.indices ?? []).length === 0
          ? []
          : measureAutoMovieMeshCrossings(faces, exterior, {
              acceptTransversePoint: request.acceptTransversePoint,
            }).filter(
              (hit) => !hit.coplanar,
            );
      reading.crossings = hits.length;
      const corners = (mesh: IAutoMovieMesh, triangle: number): number[] =>
        (mesh.indices ?? [])
          .slice(3 * triangle, 3 * triangle + 3)
          .flatMap((vertex) => mesh.positions.slice(3 * vertex, 3 * vertex + 3));
      reading.crossingWitness =
        hits.length === 0
          ? null
          : {
              subjectTriangle: hits[0].triangle,
              referenceTriangle: hits[0].other,
              subjectPoints: corners(faces, hits[0].triangle),
              referencePoints: corners(exterior, hits[0].other),
            };
    }
  } catch (error) {
    reading.unavailable = error instanceof Error ? error.message : String(error);
  }
  reading.refused =
    request.judged &&
    (reading.unavailable !== null ||
      (request.forbidden === "outside"
        ? reading.outsideVertices
        : reading.insideVertices) > 0 ||
      reading.boundaryVertices > 0 ||
      (reading.crossings ?? 0) > 0);
  return reading;
}
