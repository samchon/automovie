import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type { IHumanBodyLayerOrderInput } from "./IHumanBodyLayerOrderInput";
import type { IHumanBodyLayerReference } from "./IHumanBodyLayerReference";

/**
 * Read whether every internal part of a constructed body lies inside its layers.
 *
 * The body is layered: bone inside muscle, muscle inside the fascia, the subcutaneous layer and the dermis outside that, all of it inside the skin. This reader measures one of those relations on the geometry the model actually emits. For each vertex of each subject part it takes the signed distance to the nearest reference sheet, on Float32 coordinates, and returns one reading per part in the shared construction reading form. A vertex outside the reference by more than the tolerance is a layer-order violation, and a part with any is refused. The caller chooses the reference: the skin, or the fascial face that the skin's thickness field derives, which is the condition meant for bone and muscle.
 *
 * The reference may be several open sheets (a body face open at the neck and continuing head skin). Each answers with its nearest feature; rim hits have unknown side, so the nearest non-rim answer is used. Without one, the vertex has unknown side and refuses the condition. Interpreting an open sheet's sign requires an embedded outward-oriented reference and queries within its qualified local reach, as the engine query specifies. This reader establishes neither embedding nor reach; a non-rim hit alone does not establish those premises.
 *
 * Only vertices are queried. Even under the sign premises, a triangle can cross between vertices classified inside, so these diagnostic readings prove no containment; crossings is null. The minimum locator is the deepest classified vertex, while refusal uses the largest signed distance. Internal-part crossings are a separate relation not read here.
 *
 * @evidence contracts/common.md#principled-implementation Float32 nearest non-rim signed queries classify actual subject vertices; unknown side refuses. Open-sheet sign interpretation assumes qualified local reach and embedded outward references, which this reader does not establish.
 * @evidence contracts/common.md#clear-and-simple-design Caller references/subject selection define the anatomical relation while engine signed-mesh queries own nearest-feature geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown rim side never counts as inside; non-rim success establishes neither local reach, embedding nor between-vertex containment, and no geometry is repaired.
 * @evidence contracts/common.md#meaningful-documentation Comments explain sign/tolerance, continued open sheets, null crossings and separate deepest/outermost witnesses.
 * @evidence contracts/performance.md#efficient-algorithms Each reference is quantized/indexed once; subject vertices query all reference sheets, so sheet count and spatial-query costs dominate, with exclusion-list lookup adding its own rows.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled reference queries serve every selected part/vertex within the call; changed reference geometry requires fresh Float32 queries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reference copies/spatial indexes are call-local and released on return/refusal; only scalar/witness reading records escape without model mutation.
 */
export function readHumanBodyLayerOrder(
  input: IHumanBodyLayerOrderInput,
): IAutoMovieHumanConstructionClearanceReading[] {
  if (!Number.isFinite(input.toleranceMetres) || input.toleranceMetres < 0)
    throw new Error("Layer order needs a finite nonnegative tolerance.");
  const rounded: (mesh: IAutoMovieMesh) => IAutoMovieMesh = (
    mesh: IAutoMovieMesh,
  ): IAutoMovieMesh => ({
    ...mesh,
    positions: mesh.positions.map(Math.fround),
  });
  if (input.references.length === 0)
    throw new Error("Layer order needs at least one reference sheet.");
  const sheets: ReturnType<typeof createAutoMovieSignedMeshQuery>[] =
    input.references.map(
      (
        reference: IHumanBodyLayerReference,
      ): ReturnType<typeof createAutoMovieSignedMeshQuery> =>
        createAutoMovieSignedMeshQuery(rounded(reference.mesh), {
          boundary: "open",
        }),
    );
  const against: string = input.references
    .map((reference: IHumanBodyLayerReference): string => reference.name)
    .join("+");
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  for (const part of input.model.parts) {
    if (
      !part.id.startsWith(input.subjectPrefix) ||
      input.excluded.includes(part.id)
    )
      continue;
    const reading: IAutoMovieHumanConstructionClearanceReading = {
      owner: "body-layer-order",
      state: "rest",
      subject: part.id,
      against,
      judged: true,
      refused: false,
      toleranceMetres: input.toleranceMetres,
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
      crossings: null,
      unavailable: null,
    };
    readings.push(reading);
    if (part.geometry.type !== "mesh") {
      reading.judged = false;
      reading.unavailable = "subject-is-not-a-mesh";
      continue;
    }
    const positions: number[] = part.geometry.mesh.positions;
    if (
      positions.length === 0 ||
      positions.length % 3 !== 0 ||
      !positions.every((value: number): boolean =>
        Number.isFinite(Math.fround(value)),
      )
    )
      throw new Error(
        "Layer order needs complete finite Float32 subject positions: " +
          part.id,
      );
    reading.vertices = positions.length / 3;
    for (let vertex: number = 0; vertex < reading.vertices; vertex++) {
      const point: number[] = [
        Math.fround(positions[vertex * 3]),
        Math.fround(positions[vertex * 3 + 1]),
        Math.fround(positions[vertex * 3 + 2]),
      ];
      let signed: number | null = null;
      let nearest: number = Infinity;
      for (const sheet of sheets) {
        const hit: ReturnType<
          ReturnType<typeof createAutoMovieSignedMeshQuery>
        > = sheet(point);
        if (hit.boundary || hit.distance >= nearest) continue;
        nearest = hit.distance;
        signed = hit.signedDistance;
      }
      if (signed === null) {
        reading.boundaryVertices++;
        continue;
      }
      if (signed > input.toleranceMetres) reading.outsideVertices++;
      else if (signed < -input.toleranceMetres) reading.insideVertices++;
      // Keep the shared minimum locator and the actual outermost witness.
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
    if (reading.boundaryVertices > 0)
      reading.unavailable = "open-reference-rim-side-unknown";
    reading.refused =
      reading.outsideVertices > 0 || reading.boundaryVertices > 0;
  }
  return readings;
}
