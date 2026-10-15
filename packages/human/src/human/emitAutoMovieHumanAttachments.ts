import {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { AutoMovieHumanTissue } from "../junction/AutoMovieHumanTissue";
import { meshAutoMovieHumanCage } from "../junction/meshAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanPartGenerator } from "../parts/IAutoMovieHumanPartGenerator";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";
import { AUTOMOVIE_HUMAN_PART_INSTANCES } from "./AUTOMOVIE_HUMAN_PART_INSTANCES";

/**
 * Emit every part's separate meshes, such as nail plates and eyeballs, as their own model parts, each riding its bone.
 *
 * Each attachment's cage is subdivided alone by the engine and written with its limit normals; a surface the part evaluated itself is taken as it is. A rigid part lives in its bone's local frame, which at rest is the model frame translated to the bone's joint centre, so the mesh, once converted to metres, is moved by minus that centre. Ids are `<part>[.<side>].<name>`, so the viewer can isolate them like any other part.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param levels Subdivision levels
 * @param generators The generator of each part
 * An attachment's own appearance gives its material and images; otherwise its tissue's placeholder material applies. Materials and images are listed once per id, because ids name their content and attachments of one look share them.
 *
 * @returns The attachment parts, their materials and the images those sample
 * @throws {Error} When an attachment rides a bone the skeleton lacks, has neither or both of a cage and a mesh, or has a tissue without a placeholder and no appearance
 */
export const emitAutoMovieHumanAttachments = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  levels: number,
  generators: IAutoMovieHumanPartGenerators,
): {
  parts: IAutoMovieModelPart[];
  materials: IAutoMovieMaterial[];
  images: IAutoMovieImage[];
} => {
  const parts: IAutoMovieModelPart[] = [];
  const materials: Map<string, IAutoMovieMaterial> = new Map();
  const images: Map<string, IAutoMovieImage> = new Map();
  for (const [part, side] of AUTOMOVIE_HUMAN_PART_INSTANCES) {
    const generator = generators[part] as {
      attachments?(props: {
        measurements: IAutoMovieHumanMeasurements;
        skeleton: IAutoMovieHumanSkeleton;
        side: AutoMovieHumanSide | null;
      }): IAutoMovieHumanPartGenerator.IAttachment[];
    };
    if (generator.attachments === undefined) continue;
    const prefix: string = side === null ? part : `${part}.${side}`;
    for (const attachment of generator.attachments({
      measurements,
      skeleton,
      side,
    })) {
      const joint: IAutoMovieHumanSkeleton.IJoint | undefined =
        skeleton.joints.find(
          (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
            j.bone === attachment.bone,
        );
      if (joint === undefined)
        throw new Error(
          `${prefix}.${attachment.name} rides ${attachment.bone}, which the skeleton lacks`,
        );
      const id: string = `${prefix}.${attachment.name}`;
      if ((attachment.cage === null) === (attachment.mesh === undefined))
        throw new Error(`${id} must give exactly one of a cage and a mesh`);
      const mesh: IAutoMovieMesh =
        attachment.cage !== null
          ? meshAutoMovieHumanCage({
              cage: attachment.cage,
              levels,
              domain: id,
            }).mesh
          : {
              ...attachment.mesh!,
              positions: attachment.mesh!.positions.map(
                (x: number): number => x / 1000,
              ),
            };
      const material: IAutoMovieMaterial | undefined =
        attachment.appearance?.material ?? TISSUE_MATERIALS[attachment.tissue];
      if (material === undefined)
        throw new Error(`${id} is ${attachment.tissue}, which has no placeholder material`);
      materials.set(material.id, material);
      for (const image of attachment.appearance?.images ?? [])
        images.set(image.id, image);
      const origin: number[] = [
        joint.position.x / 1000,
        joint.position.y / 1000,
        joint.position.z / 1000,
      ];
      parts.push({
        id,
        name: `${side === null ? "" : `${side} `}${part} ${attachment.name}`,
        geometry: {
          type: "mesh",
          mesh: {
            ...mesh,
            positions: mesh.positions.map(
              (x: number, i: number): number => x - origin[i % 3]!,
            ),
          },
        },
        material: material.id,
        attachedBone: attachment.bone,
        transform: null,
      });
    }
  }
  return {
    parts,
    materials: [...materials.values()],
    images: [...images.values()],
  };
};

/** Placeholder material of each tissue until the appearance stage decides it; a tissue whose part always gives its own appearance has none. */
const TISSUE_MATERIALS: Partial<Record<AutoMovieHumanTissue, IAutoMovieMaterial>> = {
  nail: {
    id: "nail",
    name: "nail",
    baseColor: { r: 0.93, g: 0.8, b: 0.78, a: null, hex: null },
    metallic: 0,
    roughness: 0.3,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
  },
};
