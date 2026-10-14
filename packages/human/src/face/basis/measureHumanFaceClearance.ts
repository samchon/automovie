import { createAutoMovieSignedMeshQuery, measureAutoMovieMeshCrossings, triangleIndicesOf, type IAutoMovieSignedMeshQueryHit as IAutoMovieSignedMeshQueryHitImported, type IAutoMovieMeshCrossing as IAutoMovieMeshCrossingImported } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieTransform } from "@automovie/interface";

import { readHumanLocalMeshWorld } from "../../common/mesh/readHumanLocalMeshWorld";
import type { IAutoMovieHumanConstructionClearanceReading } from "../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type { IHumanFaceClearanceReference } from "./IHumanFaceClearanceReference";
import type { IHumanFaceClearanceRequest } from "./IHumanFaceClearanceRequest";



const references: WeakMap<IAutoMovieMesh, IHumanFaceClearanceReference> = new WeakMap<IAutoMovieMesh, IHumanFaceClearanceReference>();

/**
 * Read one subject against one reference surface and report the whole result.
 *
 * The instrument is the pair the face admissions already used: the engine's
 * signed mesh query for vertices and its triangle crossing census for faces a
 * vertex test cannot see. Both meshes are rounded to Float32 in their actual
 * publication frames, then their ordinary part TRS restores head-frame metres.
 * Omitted TRS retains the original head-frame identity. Reconstructed world
 * positions are not rounded a second time. Every queried
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
 * The crossing count is the number of subject triangles with a retained
 * transverse witness, at most one per subject triangle; it is not a count of
 * every crossing face pair. The engine prefers transverse over coplanar
 * witnesses, and this reader then omits coplanar-only records.
 *
 * An open reference is an oriented sheet. Its sign means something only near
 * it: a point beyond its rim or farther than its local feature size reads an
 * arbitrary side. The caller therefore states the reach its geometry
 * justifies. A nearest rim feature first counts as boundary-side unknown,
 * regardless of distance. Other vertices beyond the stated reach count as
 * unreached and enter no inside/outside count. Without a reach, an open reference reports a side
 * for every vertex, which is valid only when the subject stays close to it.
 *
 * Uncertainty includes Float32 rounding of both local meshes, transported by
 * their declared TRS; it is not global-coordinate Float32 rounding. The reference is
 * the tessellated surface, so a reading against a curved exterior also carries
 * that surface's chord error, which this instrument does not know.
 *
 * @evidence contracts/common.md#principled-implementation Shared local-Float32/TRS reconstruction, signed nearest-feature queries and noncoplanar triangle-crossing witnesses measure the actual publication frames. Current admissions provide immutable reference meshes and qualified open-sheet reach; rim sign is unknown, distant vertices are unreached, and tessellation chord error remains outside this instrument.
 * @evidence contracts/common.md#clear-and-simple-design One full reading serves judged admissions and report-only census with the same geometry instruments. Reference compilation is shared by mesh identity/TRS/boundary, while each subject and its intended insertion classification remain request-specific.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every selected vertex is read, unknown rim signs and unavailable instruments refuse judged relations, and intended insertion removes only the classified transverse point. Report-only relations keep their numbers without acquiring an accepted physical verdict; no scalar minimum replaces face crossings.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre/tolerance signs, local Float32 uncertainty, TRS order, complete counts/extrema, open-sheet reach, optional crossing behavior and curved-reference limitations.
 * @evidence contracts/performance.md#efficient-algorithms Reference BVH construction and queries retain their engine costs: nearest searches can visit all T reference triangles and crossings can test all subject/reference candidate pairs with candidate sorting. For V selected vertices this includes O(VT) worst-case query work and O(V log V) quantile sorting; default crossing collection stops after one transverse witness per subject triangle, while vertex counts remain complete.
 * @evidence contracts/performance.md#reuse-equivalent-work A WeakMap shares the immutable reference's rounded/TRS mesh and per-boundary compiled queries; changed serialized TRS replaces that entry. Subjects, selection, reach and insertion rules are read anew, and mutating a reference mesh under its identity violates the documented premise.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak reference keys allow unused meshes to be collected; each live reference holds one current placed mesh and its closed/open query variants. Per-call distances follow selected vertices and retained crossing records are bounded by subject triangles, with candidate/hierarchy storage also following source faces; returned witnesses/counts belong to the caller.
 */
export function measureHumanFaceClearance(
  request: IHumanFaceClearanceRequest,
): IAutoMovieHumanConstructionClearanceReading {
  const tolerance: number = request.toleranceMetres;
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
  const precise: (mesh: IAutoMovieMesh, transform?: IAutoMovieTransform | null) => IAutoMovieMesh = (mesh: IAutoMovieMesh, transform?: IAutoMovieTransform | null): IAutoMovieMesh => {
    const placed: IAutoMovieMesh = readHumanLocalMeshWorld(mesh, transform);
    return { ...placed, indices: triangleIndicesOf(placed, "Face clearance") };
  };
  try {
    if (!Number.isFinite(tolerance) || tolerance < 0)
      throw new Error("clearance needs a finite nonnegative tolerance");
    const subject: IAutoMovieMesh = precise(request.mesh, request.meshTransform);
    // One construction reads many subjects against the same few references,
    // so the rounded reference and its compiled query are kept per mesh
    // object. A reference mesh is never modified after it is first read.
    let compiled: IHumanFaceClearanceReference | undefined = references.get(request.exterior);
    const transform: string = JSON.stringify(request.exteriorTransform ?? null);
    if (compiled === undefined || compiled.transform !== transform) {
      compiled = { mesh: precise(request.exterior, request.exteriorTransform), transform, queries: new Map() };
      references.set(request.exterior, compiled);
    }
    const exterior: IAutoMovieMesh = compiled.mesh;
    let query: ((point: readonly number[]) => IAutoMovieSignedMeshQueryHitImported) | undefined = compiled.queries.get(request.boundary);
    if (query === undefined) {
      query = createAutoMovieSignedMeshQuery(exterior, {
        boundary: request.boundary,
      });
      compiled.queries.set(request.boundary, query);
    }
    const selected: readonly number[] = request.vertices ?? [...new Set(subject.indices ?? [])];
    if (request.reachMetres !== undefined) reading.unreachedVertices = 0;
    const distances: number[] = [];
    for (const vertex of selected) {
      const point: number[] = subject.positions.slice(3 * vertex, 3 * vertex + 3);
      const hit: IAutoMovieSignedMeshQueryHitImported = query(point);
      reading.vertices++;
      if (hit.boundary) {
        reading.boundaryVertices++;
        continue;
      }
      if (
        request.reachMetres !== undefined &&
        hit.distance > request.reachMetres
      ) {
        reading.unreachedVertices = (reading.unreachedVertices ?? 0) + 1;
        continue;
      }
      const signed: number = hit.signedDistance;
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
      distances.sort((a: number, b: number): number  => a - b);
      const rank: (fraction: number) => number = (fraction: number): number =>
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
      const faces: IAutoMovieMesh =
        request.crossingIndices === undefined
          ? subject
          : { ...subject, indices: [...request.crossingIndices] };
      const hits: IAutoMovieMeshCrossingImported[] =
        (faces.indices ?? []).length === 0
          ? []
          : measureAutoMovieMeshCrossings(faces, exterior, {
              acceptTransversePoint: request.acceptTransversePoint,
            }).filter((hit: IAutoMovieMeshCrossingImported): boolean  => !hit.coplanar);
      reading.crossings = hits.length;
      const corners: (mesh: IAutoMovieMesh, triangle: number) => number[] = (mesh: IAutoMovieMesh, triangle: number): number[] =>
        (mesh.indices ?? [])
          .slice(3 * triangle, 3 * triangle + 3)
          .flatMap((vertex: number): number[]  =>
            mesh.positions.slice(3 * vertex, 3 * vertex + 3),
          );
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
    reading.unavailable =
      error instanceof Error ? error.message : String(error);
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
