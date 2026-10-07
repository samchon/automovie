import { createAutoMovieMeshRayCaster } from "@automovie/engine";

import type { IHumanBodyLayerSurfaces } from "./IHumanBodyLayerSurfaces";
import type { IHumanBodyLayerSurfacesInput } from "./IHumanBodyLayerSurfacesInput";

/**
 * Derive the dermal and fascial faces of a body from its skin.
 *
 * Each face is the skin moved inward along its vertex normal: the dermal face
 * by the skin thickness, the fascial face by the skin and subcutaneous
 * thickness together. The normal is the area-weighted mean of the incident
 * triangle normals, computed here from the given positions so the offset
 * follows the evaluated surface and not a stored shading normal. This is the
 * one place the two faces are computed; the offline registration reads this
 * function's output instead of repeating the rule.
 *
 * These are limited geometric observations, not an embedding certificate.
 * An unbounded inward ray excludes only the native triangles incident to
 * its origin vertex. Half its positive opposite-sheet travel is a reported
 * normal-ray thickness proxy, not the surface's true reach: unequal opposite
 * thicknesses, changing normals and distant-sheet crossings are not solved.
 * Missing or nonpositive travel is counted as an unavailable positive reach
 * observation. Neither the origin nor a metric exclusion band is shifted.
 * Both offset sheets are compared with the original triangle orientations.
 * All offsets retain the requested thickness; failures are never repaired.
 *
 * @evidence contracts/common.md#principled-implementation Reports normal-ray thickness ratios and both offset orientations on the supplied triangles; topology excludes origin incidence without claiming these limited observations establish true reach or global embedding.
 * @evidence contracts/common.md#clear-and-simple-design One pass for normals, one for the offsets and the reach rays, one for triangle orientation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thickness is applied as given; a vertex beyond reach is counted and located, not shortened.
 * @evidence contracts/common.md#meaningful-documentation States the offset rule, both validity conditions and the case neither detects.
 * @evidence contracts/modeling.md#emitted-geometry Both faces have exactly the skin's vertices; the count follows the skin's resolution.
 * @evidence contracts/modeling.md#spatial-conventions Positions in and out are metres in the same frame; the normal is outward and the offset is against it.
 * @evidence contracts/modeling.md#shared-boundaries The skin, the subcutaneous layer and the deep tissues meet on these two faces, which have no definition other than this offset of the skin.
 * @evidence contracts/anatomy.md#permitted-range Reports the conventional half-normal-ray condition, missing positive reach and offset inversion without altering thickness; these observations alone do not admit anatomical thickness or certify embedding.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The thickness field owns its channels.
 * @evidenceExclude contracts/modeling.md#rendered-observation The faces are not displayed; the shell's consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The thickness field owns the values and their sources.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no authoring input.
 */
export function createHumanBodyLayerSurfaces(input: IHumanBodyLayerSurfacesInput): IHumanBodyLayerSurfaces {
  const { positions, indices, field } = input;
  const count = positions.length / 3;
  if (positions.length % 3 !== 0 || indices.length % 3 !== 0 || field.skinMetres.length !== count || field.subcutaneousMetres.length !== count)
    throw new Error("Layer thickness does not address this skin's vertices.");
  if (count === 0 || indices.length === 0 || !positions.every(Number.isFinite) ||
      indices.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= count))
    throw new Error("Layer surfaces need a nonempty finite indexed skin.");
  if ([...field.skinMetres, ...field.subcutaneousMetres].some((value) => !Number.isFinite(value) || value < 0))
    throw new Error("Layer thickness must be finite and nonnegative.");
  const areaOf = (surface: readonly number[], at: number): number[] => {
    const [a, b, c] = [indices[at] * 3, indices[at + 1] * 3, indices[at + 2] * 3];
    const u = [surface[b] - surface[a], surface[b + 1] - surface[a + 1], surface[b + 2] - surface[a + 2]];
    const v = [surface[c] - surface[a], surface[c + 1] - surface[a + 1], surface[c + 2] - surface[a + 2]];
    return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  };
  const normals = new Array<number>(positions.length).fill(0);
  const incident = Array.from({ length: count }, () => new Set<number>());
  for (let at = 0; at < indices.length; at += 3) {
    const area = areaOf(positions, at);
    if (!area.every(Number.isFinite)) throw new Error("Skin triangle area is not representable.");
    for (let corner = 0; corner < 3; corner++) {
      incident[indices[at + corner]].add(at / 3);
      for (let axis = 0; axis < 3; axis++) normals[indices[at + corner] * 3 + axis] += area[axis];
    }
  }
  for (let at = 0; at < normals.length; at += 3) {
    const length = Math.hypot(normals[at], normals[at + 1], normals[at + 2]);
    if (!(length > 0) || !Number.isFinite(length)) throw new Error("Skin vertex " + at / 3 + " has no finite area-weighted normal.");
    for (let axis = 0; axis < 3; axis++) normals[at + axis] /= length;
  }
  const cast = createAutoMovieMeshRayCaster({ positions: [...positions], normals, indices: [...indices], uvs: null, skin: null });
  const dermis = new Array<number>(positions.length);
  const fascia = new Array<number>(positions.length);
  let beyondReachVertices = 0;
  let unmeasuredReachVertices = 0;
  const beyondReachVertexOrdinals: number[] = [];
  const unmeasuredReachVertexOrdinals: number[] = [];
  let tightestVertex: number | null = null;
  let tightestRatio: number | null = null;
  for (let vertex = 0; vertex < count; vertex++) {
    const at = vertex * 3;
    const skin = field.skinMetres[vertex];
    const both = skin + field.subcutaneousMetres[vertex];
    if (!Number.isFinite(both)) throw new Error("Combined layer thickness is not representable at vertex " + vertex);
    const inward = [-normals[at], -normals[at + 1], -normals[at + 2]];
    for (let axis = 0; axis < 3; axis++) {
      dermis[at + axis] = positions[at + axis] + inward[axis] * skin;
      fascia[at + axis] = positions[at + axis] + inward[axis] * both;
      if (!Number.isFinite(dermis[at + axis]) || !Number.isFinite(fascia[at + axis]))
        throw new Error("Layer offset is not representable at vertex " + vertex);
    }
    const reach = cast.nearest([positions[at], positions[at + 1], positions[at + 2]], inward, Infinity, 0,
      { excludedTriangles: incident[vertex] });
    if (reach === null || !(reach > 0) || !Number.isFinite(reach)) {
      unmeasuredReachVertices++;
      unmeasuredReachVertexOrdinals.push(vertex);
      continue;
    }
    const ratio = both / reach;
    if (!Number.isFinite(ratio)) throw new Error("Layer thickness-to-ray ratio is not representable at vertex " + vertex);
    if (ratio >= 0.5) {
      beyondReachVertices++;
      beyondReachVertexOrdinals.push(vertex);
    }
    if (tightestRatio === null || ratio > tightestRatio) {
      tightestRatio = ratio;
      tightestVertex = vertex;
    }
  }
  let invertedTriangles = 0;
  let dermalInvertedTriangles = 0;
  const fascialInvertedTriangleOrdinals: number[] = [];
  const dermalInvertedTriangleOrdinals: number[] = [];
  for (let at = 0; at < indices.length; at += 3) {
    const outer = areaOf(positions, at);
    const inner = areaOf(fascia, at);
    const dermal = areaOf(dermis, at);
    const fasciaOrientation = outer[0] * inner[0] + outer[1] * inner[1] + outer[2] * inner[2];
    const dermalOrientation = outer[0] * dermal[0] + outer[1] * dermal[1] + outer[2] * dermal[2];
    if (!Number.isFinite(fasciaOrientation) || !Number.isFinite(dermalOrientation))
      throw new Error("Layer triangle orientation is not representable at triangle " + at / 3);
    if (fasciaOrientation <= 0) {
      invertedTriangles++;
      fascialInvertedTriangleOrdinals.push(at / 3);
    }
    if (dermalOrientation <= 0) {
      dermalInvertedTriangles++;
      dermalInvertedTriangleOrdinals.push(at / 3);
    }
  }
  return { normals, dermis, fascia, beyondReachVertices, unmeasuredReachVertices,
    tightestVertex, tightestRatio, invertedTriangles, dermalInvertedTriangles,
    beyondReachVertexOrdinals, unmeasuredReachVertexOrdinals,
    fascialInvertedTriangleOrdinals, dermalInvertedTriangleOrdinals,
    qualification: "Normal-ray half-travel proxy and triangle orientation observations only; unequal opposite offsets, global embedding and clinical thickness are not certified." };
}
