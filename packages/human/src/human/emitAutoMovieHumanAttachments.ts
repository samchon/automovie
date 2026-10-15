import {
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
import { AUTOMOVIE_HUMAN_PART_INSTANCES } from "./emitAutoMovieHumanSkinParts";

/**
 * Emit every part's separate meshes, such as nail plates, as their own model parts, each riding its bone.
 *
 * Each attachment's cage is subdivided alone by the engine and written with its limit normals. A rigid part lives in its bone's local frame, which at rest is the model frame translated to the bone's joint centre, so the mesh, once converted to metres, is moved by minus that centre. Ids are `<part>[.<side>].<name>`, so the viewer can isolate them like any other part.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param levels Subdivision levels
 * @param generators The generator of each part
 * @returns The attachment parts and the materials of their tissues
 */
export const emitAutoMovieHumanAttachments = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  levels: number,
  generators: IAutoMovieHumanPartGenerators,
): { parts: IAutoMovieModelPart[]; materials: IAutoMovieMaterial[] } => {
  const parts: IAutoMovieModelPart[] = [];
  const tissues: Set<AutoMovieHumanTissue> = new Set();
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
      const mesh: IAutoMovieMesh = meshAutoMovieHumanCage({
        cage: attachment.cage,
        levels,
        domain: id,
      }).mesh;
      const origin: number[] = [
        joint.position.x / 1000,
        joint.position.y / 1000,
        joint.position.z / 1000,
      ];
      tissues.add(attachment.tissue);
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
        material: TISSUE_MATERIALS[attachment.tissue].id,
        attachedBone: attachment.bone,
        transform: null,
      });
    }
  }
  return {
    parts,
    materials: [...tissues].map(
      (t: AutoMovieHumanTissue): IAutoMovieMaterial => TISSUE_MATERIALS[t],
    ),
  };
};

/** Placeholder material of each tissue until the appearance stage decides it. */
const TISSUE_MATERIALS: Record<AutoMovieHumanTissue, IAutoMovieMaterial> = {
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
