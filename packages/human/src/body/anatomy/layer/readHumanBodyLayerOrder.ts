import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type { IHumanBodyLayerOrderInput } from "./IHumanBodyLayerOrderInput";

/**
 * Read whether every internal part of a constructed body lies inside its layers.
 *
 * The body is layered: bone inside muscle, muscle inside the fascia, the
 * subcutaneous layer and the dermis outside that, all of it inside the skin.
 * This reader measures one of those relations on the geometry the model
 * actually emits. For each vertex of each subject part it takes the signed
 * distance to the nearest reference sheet, on Float32 coordinates, and
 * returns one reading per part in the shared construction reading form. A
 * vertex outside the reference by more than the tolerance is a layer-order
 * violation, and a part with any is refused. The caller chooses the
 * reference: the skin, or the fascial face that the skin's thickness field
 * derives, which is the condition meant for bone and muscle.
 *
 * The reference may be several open sheets (a body face open at the neck and
 * the head skin that continues it). Each sheet answers with its nearest feature;
 * when that feature is the sheet's rim the sheet cannot tell its two sides
 * apart there, so the answer of the nearest sheet that can is used. A vertex
 * for which no sheet can is counted as a boundary vertex with unknown side,
 * never as inside or a completed non-refusal; unknown side refuses the
 * condition with an unavailable reason. The sign rests on each reference being an embedded,
 * outward-oriented surface, which this reader does not establish.
 *
 * Only vertices are queried. A triangle can cross the skin between vertices
 * that are all inside, so a reading with no outside vertex is necessary for
 * containment and not sufficient; `crossings` is null to say so. The reading's
 * located vertex is its minimum, the deepest one, as the shared form defines;
 * a refusal is about the largest signed distance instead. Crossings between
 * two internal parts are a different relation and are not read here.
 *
 * @evidence contracts/common.md#principled-implementation Sidedness comes from the engine's angle-weighted pseudonormal query on the same triangles the model emits, rounded to the Float32 values an exporter writes, so the reading is of the delivered surface.
 * @evidence contracts/common.md#clear-and-simple-design One pass per subject part over one compiled query per exterior sheet; the union rule is the only decision the reader makes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No part, tissue or region is exempted, and an unknown side is reported as unknown instead of being counted as contained.
 * @evidence contracts/common.md#meaningful-documentation States the union rule, the vertex-only limit and what the reading does not judge.
 * @evidence contracts/modeling.md#spatial-conventions Positions are the model's metres in its one frame; the only conversion is the rounding to Float32 that the static exporter performs.
 * @evidence contracts/modeling.md#shared-boundaries The skin is the boundary every internal part shares with the outside; the reading states, per part, whether that part stays on its inner side.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader consumes existing part identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation A numerical reading owns no rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reader carries no anatomical value; tissue thickness stays with its owner.
 * @evidence contracts/anatomy.md#permitted-range Outside vertices refuse this vertex-only condition; unknown side also prevents a completed non-refusal, with its unavailable reason kept distinct from observed outside geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader defines no authoring input.
 */
export function readHumanBodyLayerOrder(
  input: IHumanBodyLayerOrderInput,
): IAutoMovieHumanConstructionClearanceReading[] {
  if (!Number.isFinite(input.toleranceMetres) || input.toleranceMetres < 0)
    throw new Error("Layer order needs a finite nonnegative tolerance.");
  const rounded = (mesh: IAutoMovieMesh): IAutoMovieMesh => ({
    ...mesh,
    positions: mesh.positions.map(Math.fround),
  });
  if (input.references.length === 0)
    throw new Error("Layer order needs at least one reference sheet.");
  const sheets = input.references.map((reference) =>
    createAutoMovieSignedMeshQuery(rounded(reference.mesh), {
      boundary: "open",
    }),
  );
  const against = input.references.map((reference) => reference.name).join("+");
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
    const positions = part.geometry.mesh.positions;
    if (
      positions.length === 0 ||
      positions.length % 3 !== 0 ||
      !positions.every((value) => Number.isFinite(Math.fround(value)))
    )
      throw new Error(
        "Layer order needs complete finite Float32 subject positions: " +
          part.id,
      );
    reading.vertices = positions.length / 3;
    for (let vertex = 0; vertex < reading.vertices; vertex++) {
      const point = [
        Math.fround(positions[vertex * 3]),
        Math.fround(positions[vertex * 3 + 1]),
        Math.fround(positions[vertex * 3 + 2]),
      ];
      let signed: number | null = null;
      let nearest = Infinity;
      for (const sheet of sheets) {
        const hit = sheet(point);
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
