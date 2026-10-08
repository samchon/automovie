import type { IAutoMovieMaterial, IAutoMovieMesh } from "@automovie/interface";

import { humanPhysicalSourceDomain } from "../../../common/basis/humanPhysicalSourceDomain";
import type { IAutoMovieHumanConstructionFailure } from "../../../common/structures/IAutoMovieHumanConstructionFailure";
import { createHumanBodySourceResidentMesh } from "../assembly/createHumanBodySourceResidentMesh";
import type { IHumanBodyLayerConstruction } from "./IHumanBodyLayerConstruction";
import type { IHumanBodyLayerConstructionInput } from "./IHumanBodyLayerConstructionInput";
import { createHumanBodyLayerSurfaces } from "./createHumanBodyLayerSurfaces";
import { createHumanBodySubcutaneousShell } from "./createHumanBodySubcutaneousShell";

/**
 * Emit one subcutaneous shell as disjoint dermal, fascial and rim members.
 *
 * The existing offset and shell owners retain every requested thickness and
 * triangle exactly once. The dermal outer sheet, reversed fascial inner sheet
 * and actual open-boundary strips partition that one shell; separate copies
 * of its sheets would duplicate physical faces when exported together.
 * Inspection appearance copies the existing skin finish's scalar
 * values without its exterior UV textures; it implies no inner tissue colour
 * or physical material measurement. Their physical
 * domains distinguish the two sheets; each sheet and its shell occurrence
 * share the same native point. Offsets are made in the supplied final frame,
 * after the consumer's root placement, and never moved a second time here.
 *
 * @evidence contracts/common.md#principled-implementation Calls the existing offset and shell owners once and retains their complete limited observations.
 * @evidence contracts/common.md#clear-and-simple-design Three named parts and one observation retain geometry and admission separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused offsets retain their coordinates; no thickness, topology or unknown reach is repaired.
 * @evidence contracts/common.md#meaningful-documentation Explains inspection finish, physical domains, final frame and limited admission.
 * @evidence contracts/modeling.md#part-identity-and-grouping Dermal outer boundary, fascial inner boundary and connecting rim are disjoint named members composing one subcutaneous layer boundary.
 * @evidence contracts/modeling.md#emitted-geometry Partitions the existing shell's complete triangle sequence without duplicating or dropping a triangle; referenced-vertex compaction preserves native physical sample addresses.
 * @evidence contracts/modeling.md#spatial-conventions Uses the supplied final body metre frame and native vertex ordinals without another placement.
 * @evidence contracts/modeling.md#shared-boundaries Both boundary parts reuse the exact sheets the shell consumes and share their actual native physical sample identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The immutable thickness field owns its channels.
 * @evidence contracts/modeling.md#rendered-observation The normal Body and Person construction consumers receive these exact parts; acceptance of their appearance remains the consuming observation's responsibility.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The field owns its anchors, protocol and population qualification.
 * @evidence contracts/anatomy.md#permitted-range Original limited offset observations remain separate named failures and supply no clinical embedding certificate.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Immutable source fields are not personal sculpt input.
 */
export function createHumanBodyLayerConstruction(
  input: IHumanBodyLayerConstructionInput,
): IHumanBodyLayerConstruction {
  if (input.field.basis !== input.basis || input.surface.trim() === "")
    throw new Error("Native layer construction needs its exact basis and surface.");
  const surfaces = createHumanBodyLayerSurfaces(input);
  const count = input.positions.length / 3;
  const domains = ["dermal", "fascial"].map((sheet) =>
    humanPhysicalSourceDomain(input.instance, JSON.stringify([input.basis, input.surface, sheet])),
  );
  const shell = createHumanBodySubcutaneousShell(surfaces, input.indices);
  shell.physicalVertices = {
    sources: domains.flatMap((domain) => Array.from({ length: count }, (_, id) => ({ domain, id }))),
    vertices: Array.from({ length: count * 2 }, (_, id) => id),
  };
  const outer: number[] = [], inner: number[] = [];
  for (let at = 0; at < input.indices.length / 3; at++) {
    outer.push(...shell.indices!.slice(at * 6, at * 6 + 3));
    inner.push(...shell.indices!.slice(at * 6 + 3, at * 6 + 6));
  }
  const rim = shell.indices!.slice(input.indices.length * 2);
  const populations = [outer, inner, rim];
  const names = ["dermal-face", "fascial-face", "subcutaneous-rim"];
  const meshes: IAutoMovieMesh[] = populations.map((indices) =>
    indices.length === 0 ? { ...shell, indices: [] } :
      createHumanBodySourceResidentMesh({ ...shell, indices }).mesh,
  );
  const material: IAutoMovieMaterial = {
    id: "skin-layer:" + input.surface + ":inspection",
    name: "Untextured source skin scalar inspection finish",
    baseColor: structuredClone(input.material.baseColor),
    roughness: input.material.roughness,
    metallic: input.material.metallic,
    opacity: input.material.opacity,
    emissive: structuredClone(input.material.emissive),
    baseColorTexture: null,
    doubleSided: input.material.doubleSided,
  };
  const failures: IAutoMovieHumanConstructionFailure[] = [];
  for (const key of ["beyondReachVertices", "unmeasuredReachVertices", "invertedTriangles", "dermalInvertedTriangles"] as const)
    if (surfaces[key] !== 0)
      failures.push({ owner: "body-layer:" + input.surface, cause: key + ": " + surfaces[key] });
  const { dermis, fascia, normals, ...observations } = surfaces;
  return {
    parts: meshes.flatMap((mesh, index) => mesh.indices!.length === 0 ? [] : [{
      id: "skin-layer:" + input.surface + ":" + names[index],
      name: names[index],
      geometry: { type: "mesh", mesh },
      material: material.id,
      attachedBone: null,
      transform: null,
    }]),
    material,
    observation: {
      ...observations,
      basis: input.basis,
      surface: input.surface,
      nativeVertices: count,
      nativeTriangles: input.indices.length / 3,
      fieldQualification: input.field.qualification,
      subcutaneousShellParts: names.flatMap((name, index) => populations[index].length === 0 ? [] :
        ["skin-layer:" + input.surface + ":" + name]),
    },
    admission: { accepted: failures.length === 0, failures },
  };
}
