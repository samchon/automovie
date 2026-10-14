import { autoMovieRenderDigest } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { humanPhysicalSourceDomain } from "../../../common/basis/humanPhysicalSourceDomain";
import type { IAutoMovieHumanConstructionFailure } from "../../../common/structures/IAutoMovieHumanConstructionFailure";
import type { IAutoMovieHumanBodyNativeSubcutaneousQualification } from "../../export/IAutoMovieHumanBodyNativeSubcutaneousQualification";
import { createHumanBodySourceResidentMesh } from "../assembly/createHumanBodySourceResidentMesh";
import type { IHumanBodyLayerConstruction } from "./IHumanBodyLayerConstruction";
import type { IHumanBodyLayerConstructionInput } from "./IHumanBodyLayerConstructionInput";
import type { IHumanBodyLayerSurfaces } from "./IHumanBodyLayerSurfaces";
import { createHumanBodyLayerSurfaces } from "./createHumanBodyLayerSurfaces";
import { createHumanBodySubcutaneousShell } from "./createHumanBodySubcutaneousShell";

/**
 * Emit one subcutaneous shell as disjoint dermal, fascial and rim members.
 *
 * The existing offset and shell owners retain every requested thickness and triangle exactly once. The dermal outer sheet, reversed fascial inner sheet and actual open-boundary strips partition that one shell; separate copies of its sheets would duplicate physical faces when exported together. Inspection appearance copies the existing skin finish's scalar values without its exterior UV textures; it implies no inner tissue colour or physical material measurement. Their physical domains distinguish the two sheets; each sheet and its shell occurrence share the same native point. Offsets are made in the supplied final frame, after the consumer's root placement, and never moved a second time here. An admitted native source registration assigns these same members to the single subcutaneous owner and records their actual final mesh identities. The original geometry, skin scalar inspection finish and refusals remain.
 *
 * @evidence contracts/common.md#principled-implementation Shared offset/shell owners partition one emitted boundary into dermal, reversed fascial and rim members with separate actual physical domains and source qualification.
 * @evidence contracts/common.md#clear-and-simple-design One constructor owns disjoint member publication, scalar inspection finish and limited admission while geometry calculations remain delegated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No face is duplicated across emitted shell members, requested thickness/refusals stay intact, and untextured source finish implies no biological tissue appearance.
 * @evidence contracts/common.md#meaningful-documentation The comment describes final-frame/no-second-placement ownership, shell partition, physical identities and single native SAT provenance.
 * @evidence contracts/performance.md#efficient-algorithms Offset/ray work and shell normals dominate; O(V+T) shell partitioning, resident compaction and actual field/member hashing scale with emitted/source buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work One offset result and shell serve all three member roles; scalar source finish is copied once and native provenance references those exact emitted meshes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary shell/population arrays die after construction; returned parts/observations own their buffers and limited rejection retains actual geometry for explicit inspection.
 */
export function createHumanBodyLayerConstruction(
  input: IHumanBodyLayerConstructionInput,
): IHumanBodyLayerConstruction {
  if (input.field.basis !== input.basis || input.surface.trim() === "")
    throw new Error(
      "Native layer construction needs its exact basis and surface.",
    );
  if (
    input.nativeSource !== undefined &&
    (input.nativeSource.surface !== input.surface ||
      input.nativeSource.fieldDigest !==
        autoMovieRenderDigest(JSON.stringify(input.field)))
  )
    throw new Error(
      "Native subcutaneous construction needs its registered field and actual surface.",
    );
  const surfaces: IHumanBodyLayerSurfaces = createHumanBodyLayerSurfaces(input);
  const count: number = input.positions.length / 3;
  const domains: string[] = ["dermal", "fascial"].map((sheet: string): string =>
    humanPhysicalSourceDomain(
      input.instance,
      JSON.stringify([input.basis, input.surface, sheet]),
    ),
  );
  const shell: IAutoMovieMesh = createHumanBodySubcutaneousShell(
    surfaces,
    input.indices,
  );
  shell.physicalVertices = {
    sources: domains.flatMap((domain: string): IAutoMovieMeshPhysicalSource[] =>
      Array.from(
        { length: count },
        (_: unknown, id: number): IAutoMovieMeshPhysicalSource => ({
          domain,
          id,
        }),
      ),
    ),
    vertices: Array.from(
      { length: count * 2 },
      (_: unknown, id: number): number => id,
    ),
  };
  const outer: number[] = [];
  const inner: number[] = [];
  for (let at: number = 0; at < input.indices.length / 3; at++) {
    outer.push(...shell.indices!.slice(at * 6, at * 6 + 3));
    inner.push(...shell.indices!.slice(at * 6 + 3, at * 6 + 6));
  }
  const rim: number[] = shell.indices!.slice(input.indices.length * 2);
  const populations: number[][] = [outer, inner, rim];
  const names: readonly ["dermal-face", "fascial-face", "subcutaneous-rim"] = [
    "dermal-face",
    "fascial-face",
    "subcutaneous-rim",
  ];
  const prefix: string =
    input.nativeSource === undefined
      ? "skin-layer:" + input.surface + ":"
      : "native-subcutaneous:" +
        input.nativeSource.id +
        "/" +
        input.surface +
        "/";
  const meshes: IAutoMovieMesh[] = populations.map(
    (indices: number[]): IAutoMovieMesh =>
      indices.length === 0
        ? { ...shell, indices: [] }
        : createHumanBodySourceResidentMesh({ ...shell, indices }).mesh,
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
  for (const key of [
    "beyondReachVertices",
    "unmeasuredReachVertices",
    "invertedTriangles",
    "dermalInvertedTriangles",
  ] as const)
    if (surfaces[key] !== 0)
      failures.push({
        owner: "body-layer:" + input.surface,
        cause: key + ": " + surfaces[key],
      });
  const { dermis, fascia, normals, ...observations }: IHumanBodyLayerSurfaces =
    surfaces;
  return {
    parts: meshes.flatMap(
      (mesh: IAutoMovieMesh, index: number): IAutoMovieModelPart[] =>
        mesh.indices!.length === 0
          ? []
          : [
              {
                id: prefix + names[index],
                name: names[index],
                geometry: { type: "mesh", mesh },
                material: material.id,
                attachedBone: null,
                transform: null,
              },
            ],
    ),
    material,
    observation: {
      ...observations,
      basis: input.basis,
      surface: input.surface,
      nativeVertices: count,
      nativeTriangles: input.indices.length / 3,
      fieldQualification: input.field.qualification,
      subcutaneousShellParts: names.flatMap(
        (name: (typeof names)[number], index: number): string[] =>
          populations[index].length === 0 ? [] : [prefix + name],
      ),
      ...(input.nativeSource === undefined
        ? {}
        : {
            nativeSubcutaneous: {
              basis: input.basis,
              instance: input.instance,
              source: structuredClone(input.nativeSource),
              exteriorDigest: autoMovieRenderDigest(
                JSON.stringify({
                  positions: input.exterior?.mesh.positions ?? input.positions,
                  indices: input.exterior?.mesh.indices ?? input.indices,
                }),
              ),
              anchors: structuredClone(input.field.anchors),
              fieldQualification: input.field.qualification,
              members: meshes.flatMap(
                (
                  mesh: IAutoMovieMesh,
                  index: number,
                ): IAutoMovieHumanBodyNativeSubcutaneousQualification["members"][number][] =>
                  mesh.indices!.length === 0
                    ? []
                    : [
                        {
                          id: prefix + names[index],
                          role: names[index],
                          meshDigest: autoMovieRenderDigest(
                            JSON.stringify(mesh),
                          ),
                        },
                      ],
              ),
              clinical: "unavailable" as const,
            },
          }),
    },
    admission: { accepted: failures.length === 0, failures },
  };
}
