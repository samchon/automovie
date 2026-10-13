import type { IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface, IAutoMovieHumanFaceBasisRegion as ImportedIAutoMovieHumanFaceBasisRegion, IAutoMovieHumanFaceBasisContact as ImportedIAutoMovieHumanFaceBasisContact, IHumanFaceOralPart as ImportedIHumanFaceOralPart } from "@automovie/human";
import type { IHumanFaceLipPhysicalSources as ImportedIHumanFaceLipPhysicalSources } from "../../basis/IHumanFaceLipPhysicalSources";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMaterial, IAutoMovieModel, IAutoMovieMeshPhysicalSource as ImportedIAutoMovieMeshPhysicalSource, IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import { humanPhysicalSourceDomain } from "../../../common/basis/humanPhysicalSourceDomain";
import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { readHumanFaceLipMarginPoints } from "../../basis/readHumanFaceLipMarginPoints";
import { registerHumanFaceLipPhysicalSources } from "../../basis/registerHumanFaceLipPhysicalSources";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceRigidMotion } from "../../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceMaterialAttachment } from "../../structures/IHumanFaceMaterialAttachment";
import type { IHumanFaceOralAssembly } from "./IHumanFaceOralAssembly";
import { humanFaceOralDentalDomain } from "./humanFaceOralDentalDomain";
import { readHumanFaceOralPigment } from "./readHumanFaceOralPigment";

/**
 * Finish the exact generated oral lining after its single jaw motion. Material colour is retained from the licensed resident dental gum finish; no clinical tissue pigmentation is inferred. Shared generated points use one source-instance domain. Exact cervical points reuse the dental source's canonical sample identities, while shading normals remain region-specific. Native lip vertices retain their sample IDs. Continuous lip seats consume the source reader's complete exact-identity registration and carry the same parent/represented-weight attachment to final Person skin placement. Only triangle-used vertices are gathered; the emitted parts own Float32 buffers and no unused zero-normal rows. The canonical model gate remains with the face/person orchestrator.
 *
 * @evidence contracts/common.md#principled-implementation Exact generated/native/continuous-lip physical identities gather actual points and apply the existing jaw motion once before Float32 publication.
 * @evidence contracts/common.md#clear-and-simple-design Source licensed dental artwork and gum pigment supply finish while model admission remains with the face/person orchestrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source pigment or identity refuses rather than regenerated coordinates; no clinical pigmentation or geometric validity follows from provenance.
 * @evidence contracts/common.md#meaningful-documentation Only triangle-used vertices are emitted in head metres and already-performed soft strips receive no second jaw transform.
 * @evidence contracts/performance.md#efficient-algorithms Point-id sorting, used-vertex gathering, mesh/normal transforms and Float32 admission dominate, plus source pigment extraction.
 * @evidence contracts/performance.md#reuse-equivalent-work Generated ids and lip/dental registration maps are shared across parts; canonical normals and source colour readers are reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output buffers/materials and copied attachments are owned; source assembly is borrowed and local indexing maps become collectible.
 *
 * @author Samchon
 */
export function createHumanFaceOralFinish(
  basis: IAutoMovieHumanFaceBasis,
  document: IAutoMovieHumanFaceBasisDocument,
  assembly: IHumanFaceOralAssembly,
  jaw: IAutoMovieHumanFaceRigidMotion,
  materials: readonly IAutoMovieMaterial[],
  materialAttachments: Map<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>,
): Pick<IAutoMovieModel, "parts" | "materials"> {
  const surface: ImportedIAutoMovieHumanFaceBasisSurface = basis.surfaces.find((one: ImportedIAutoMovieHumanFaceBasisSurface): boolean => one.id === "Human.teeth_base")!;
  const gumRegion: ImportedIAutoMovieHumanFaceBasisRegion = surface.regions[0];
  if (gumRegion === undefined)
    throw new Error(
      "Oral lining finish needs the licensed source gingival material.",
    );
  const source: IAutoMovieMaterial | undefined = materials.find(
    (material: IAutoMovieMaterial): boolean => material.id === gumRegion.material,
  );
  if (source === undefined)
    throw new Error("Oral lining source material is missing.");
  const domain: string = humanPhysicalSourceDomain(document.id, assembly.generation);
  const contact: ImportedIAutoMovieHumanFaceBasisContact | undefined = basis.contact;
  const skin: ImportedIAutoMovieHumanFaceBasisSurface | undefined = contact === undefined ? undefined : basis.surfaces.find((one: ImportedIAutoMovieHumanFaceBasisSurface): boolean => one.id === contact.lips.surface);
  const lipSources: ImportedIHumanFaceLipPhysicalSources | undefined = skin === undefined || contact?.margin === undefined ? undefined :
    registerHumanFaceLipPhysicalSources(skin,
      readHumanFaceLipMarginPoints(skin, contact.margin, skin.positions), document.id, assembly.generation);
  for (const [key, attachments] of lipSources?.materialAttachments ?? [])
    materialAttachments.set(key, structuredClone(attachments));
  const dentalDomain: string = humanFaceOralDentalDomain(
    document.id,
    assembly.generation,
    assembly.dentalNativeSha256,
  );
  const pigment: number[] = readHumanFaceOralPigment(basis, source);
  const generatedPoints: string[] = [
    ...new Set(
      assembly.parts
        .flatMap((part: ImportedIHumanFaceOralPart): string[] => part.physicalPoints)
        .filter(
          (point: string): boolean => !point.startsWith("dental:") && !point.startsWith("skin:"),
        ),
    ),
  ].sort((left: string, right: string): 0 | 1 | -1 => (left < right ? -1 : left > right ? 1 : 0));
  const generatedIds: Map<string, number> = new Map(
    generatedPoints.map((point: string, index: number): [string, number] => [point, index]),
  );
  const result: Pick<IAutoMovieModel, "parts" | "materials"> = {
    parts: [],
    materials: [],
  };
  for (const part of assembly.parts) {
    const vertices: number[] = [...new Set(part.mesh.indices!)];
    const indices: Map<number, number> = new Map(vertices.map((vertex: number, index: number): [number, number] => [vertex, index]));
    const mesh: { positions: number[]; indices: number[]; normals: number[]; uvs: number[] | null; skin: null; physicalVertices: { sources: { domain: string; id: number; }[]; vertices: number[]; }; } = {
      positions: vertices.flatMap((vertex: number): number[] =>
        part.mesh.positions.slice(3 * vertex, 3 * vertex + 3),
      ),
      indices: part.mesh.indices!.map((vertex: number): number => indices.get(vertex)!),
      normals:
        part.mesh.normals === null
          ? ([] as number[])
          : vertices.flatMap((vertex: number): number[] =>
              part.mesh.normals!.slice(3 * vertex, 3 * vertex + 3),
            ),
      uvs:
        part.mesh.uvs === null
          ? null
          : vertices.flatMap((vertex: number): number[] =>
              part.mesh.uvs!.slice(2 * vertex, 2 * vertex + 2),
            ),
      skin: null,
      physicalVertices: {
        sources: vertices.map((vertex: number): { domain: string; id: number; } => {
          const point: string = part.physicalPoints[vertex];
          if (point.startsWith("dental:")) {
            const native: number = Number(point.slice(7));
            return { domain: dentalDomain, id: native };
          }
          if (point.startsWith("skin:")) {
            const registered: ImportedIAutoMovieMeshPhysicalSource | undefined = lipSources?.sources.get(point);
            if (registered === undefined)
              throw new Error("Oral skin point lost its registered native or material attachment identity.");
            return { ...registered };
          }
          const id: number | undefined = generatedIds.get(point);
          if (id === undefined)
            throw new Error(
              "Oral generated point lost its shared numerical registration.",
            );
          return { domain: domain + ":oral-lining", id };
        }),
        vertices: vertices.map((_: number, index: number): number => index),
      },
    };
    if (part.owner === "jaw")
      for (let at: number = 0; at < mesh.positions.length; at += 3) {
        const point: ImportedIAutoMovieVector3 = Vector3.create(...mesh.positions.slice(at, at + 3));
        const placed: ImportedIAutoMovieVector3 = Vector3.add(
          Vector3.add(
            jaw.pivot,
            Quaternion.rotateVector(
              jaw.rotation,
              Vector3.subtract(point, jaw.pivot),
            ),
          ),
          jaw.translation,
        );
        mesh.positions.splice(at, 3, placed.x, placed.y, placed.z);
      }
    if (part.mesh.normals === null)
      mesh.normals = areaWeightedNormals(mesh.positions, mesh.indices);
    else if (part.owner === "jaw")
      for (let at: number = 0; at < mesh.normals.length; at += 3) {
        const normal: ImportedIAutoMovieVector3 = Quaternion.rotateVector(
          jaw.rotation,
          Vector3.create(...mesh.normals.slice(at, at + 3)),
        );
        mesh.normals.splice(at, 3, normal.x, normal.y, normal.z);
      }
    float32MeshBuffers(mesh, "oral:" + part.id);
    const id: string = "oral:" + part.id;
    result.parts.push({
      id,
      name: id,
      material:
        part.materialRole === "enamel"
          ? source.id
          : "oral:" + part.materialRole,
      geometry: { type: "mesh", mesh },
      attachedBone: null,
      transform: null,
    });
    if (
      part.materialRole !== "enamel" &&
      !result.materials.some(
        (material: IAutoMovieMaterial): boolean => material.id === "oral:" + part.materialRole,
      )
    ) {
      const material: IAutoMovieMaterial = structuredClone(source);
      material.id = "oral:" + part.materialRole;
      material.name = material.id;
      material.baseColorTexture = null;
      material.baseColor = {
        r: pigment[0],
        g: pigment[1],
        b: pigment[2],
        a: source.baseColor.a,
        hex: null,
      };
      material.doubleSided = true;
      result.materials.push(material);
    }
  }
  return result;
}
