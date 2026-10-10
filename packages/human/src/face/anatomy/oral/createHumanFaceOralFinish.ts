import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

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
 * Finish the exact generated oral lining after its single jaw motion.
 * Material colour is retained from the licensed resident dental gum finish;
 * no clinical tissue pigmentation is inferred. Shared generated points use
 * one source-instance domain. Exact cervical points reuse the dental source's
 * canonical sample identities, while shading normals remain region-specific.
 * Native lip vertices retain their sample IDs. Continuous lip seats consume
 * the source reader's complete exact-identity registration and carry the same
 * parent/represented-weight attachment to final Person skin placement.
 * Only triangle-used vertices are gathered; the emitted parts own Float32
 * buffers and no unused zero-normal rows. The canonical model gate remains
 * with the face/person orchestrator.
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
  const surface = basis.surfaces.find((one) => one.id === "Human.teeth_base")!;
  const gumRegion = surface.regions[0];
  if (gumRegion === undefined)
    throw new Error(
      "Oral lining finish needs the licensed source gingival material.",
    );
  const source = materials.find(
    (material) => material.id === gumRegion.material,
  );
  if (source === undefined)
    throw new Error("Oral lining source material is missing.");
  const domain = humanPhysicalSourceDomain(document.id, assembly.generation);
  const contact = basis.contact;
  const skin = contact === undefined ? undefined : basis.surfaces.find((one) => one.id === contact.lips.surface);
  const lipSources = skin === undefined || contact?.margin === undefined ? undefined :
    registerHumanFaceLipPhysicalSources(skin,
      readHumanFaceLipMarginPoints(skin, contact.margin, skin.positions), document.id, assembly.generation);
  for (const [key, attachments] of lipSources?.materialAttachments ?? [])
    materialAttachments.set(key, structuredClone(attachments));
  const dentalDomain = humanFaceOralDentalDomain(
    document.id,
    assembly.generation,
    assembly.dentalNativeSha256,
  );
  const pigment = readHumanFaceOralPigment(basis, source);
  const generatedPoints = [
    ...new Set(
      assembly.parts
        .flatMap((part) => part.physicalPoints)
        .filter(
          (point) => !point.startsWith("dental:") && !point.startsWith("skin:"),
        ),
    ),
  ].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  const generatedIds = new Map(
    generatedPoints.map((point, index) => [point, index]),
  );
  const result: Pick<IAutoMovieModel, "parts" | "materials"> = {
    parts: [],
    materials: [],
  };
  for (const part of assembly.parts) {
    const vertices = [...new Set(part.mesh.indices!)];
    const indices = new Map(vertices.map((vertex, index) => [vertex, index]));
    const mesh = {
      positions: vertices.flatMap((vertex) =>
        part.mesh.positions.slice(3 * vertex, 3 * vertex + 3),
      ),
      indices: part.mesh.indices!.map((vertex) => indices.get(vertex)!),
      normals:
        part.mesh.normals === null
          ? ([] as number[])
          : vertices.flatMap((vertex) =>
              part.mesh.normals!.slice(3 * vertex, 3 * vertex + 3),
            ),
      uvs:
        part.mesh.uvs === null
          ? null
          : vertices.flatMap((vertex) =>
              part.mesh.uvs!.slice(2 * vertex, 2 * vertex + 2),
            ),
      skin: null,
      physicalVertices: {
        sources: vertices.map((vertex) => {
          const point = part.physicalPoints[vertex];
          if (point.startsWith("dental:")) {
            const native = Number(point.slice(7));
            return { domain: dentalDomain, id: native };
          }
          if (point.startsWith("skin:")) {
            const registered = lipSources?.sources.get(point);
            if (registered === undefined)
              throw new Error("Oral skin point lost its registered native or material attachment identity.");
            return { ...registered };
          }
          const id = generatedIds.get(point);
          if (id === undefined)
            throw new Error(
              "Oral generated point lost its shared numerical registration.",
            );
          return { domain: domain + ":oral-lining", id };
        }),
        vertices: vertices.map((_, index) => index),
      },
    };
    if (part.owner === "jaw")
      for (let at = 0; at < mesh.positions.length; at += 3) {
        const point = Vector3.create(...mesh.positions.slice(at, at + 3));
        const placed = Vector3.add(
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
      for (let at = 0; at < mesh.normals.length; at += 3) {
        const normal = Quaternion.rotateVector(
          jaw.rotation,
          Vector3.create(...mesh.normals.slice(at, at + 3)),
        );
        mesh.normals.splice(at, 3, normal.x, normal.y, normal.z);
      }
    float32MeshBuffers(mesh, "oral:" + part.id);
    const id = "oral:" + part.id;
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
        (material) => material.id === "oral:" + part.materialRole,
      )
    ) {
      const material = structuredClone(source);
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
