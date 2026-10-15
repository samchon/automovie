import {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieHumanHairColor } from "../structures/AutoMovieHumanHairColor";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { AUTOMOVIE_HUMAN_HAIR_COLORS } from "./AUTOMOVIE_HUMAN_HAIR_COLORS";
import { AutoMovieHumanHeadSurface } from "./AutoMovieHumanHeadSurface";
import { frameAutoMovieHumanScalp } from "./frameAutoMovieHumanScalp";
import { growAutoMovieHumanBrows } from "./growAutoMovieHumanBrows";
import { growAutoMovieHumanHair } from "./growAutoMovieHumanHair";
import { growAutoMovieHumanLashes } from "./growAutoMovieHumanLashes";
import { paintAutoMovieHumanHairStrands } from "./paintAutoMovieHumanHairStrands";

/**
 * Emit the person's scalp hair, brows and lashes as model parts riding the head bone, with their materials and the strand atlas they sample.
 *
 * The three are grown on the head's surface read back from the emitted skin ({@link AutoMovieHumanHeadSurface}), so they follow the head the skin generator built in either assembly, and ride the `head` bone rigidly; like every attachment, a part's mesh lives in its bone's frame, the model frame at rest translated to the bone's joint centre, in metres. Part ids are `hair`, `brows` and `lashes`; a shaved scalp or lashes of zero length emit no part.
 *
 * Each takes its own colour choice through one material: the strand atlas's grey times the colour, alpha-tested at 0.35, low enough that a lone strand survives the averaging of the atlas's smaller mip levels, so the cards need no sorting against the rest of the scene while their own order, scalp outward, holds within the mesh, both faces drawn, and an anisotropic specular lobe streaked along the strands, texture `+v` from root to tip, which is what makes cards read as hair (Scheuermann 2004, after Kajiya and Kay's strand model). Hair is a dielectric with a cuticle near index 1.55 (conventional); its roughness 0.45 keeps the highlight broad enough for the cards' coarse normals.
 *
 * @param props.measurements Resolved measurements
 * @param props.skeleton The skeleton at rest
 * @param props.appearance The admitted appearance
 * @param props.skin The emitted skin parts, metres, from which the head's surface is read
 * @returns The parts, their materials and the strand atlas
 * @throws {Error} When the skin has no head or the skeleton lacks the head or an eye bone
 */
export function emitAutoMovieHumanHair(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  appearance: IAutoMovieHumanAppearance;
  skin: readonly IAutoMovieModelPart[];
}): { parts: IAutoMovieModelPart[]; materials: IAutoMovieMaterial[]; images: IAutoMovieImage[] } {
  const head: IAutoMovieHumanSkeleton.IJoint | undefined = props.skeleton.joints.find(
    (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === "head",
  );
  if (head === undefined) throw new Error("the skeleton lacks the head bone");
  const surface: AutoMovieHumanHeadSurface = new AutoMovieHumanHeadSurface(props.skin);
  const scalp: frameAutoMovieHumanScalp.IScalp = frameAutoMovieHumanScalp({
    measurements: props.measurements,
    skeleton: props.skeleton,
    hairline: props.appearance.hair.hairline,
  });
  const strands: IAutoMovieImage = paintAutoMovieHumanHairStrands();
  const parts: IAutoMovieModelPart[] = [];
  const materials: Map<string, IAutoMovieMaterial> = new Map();
  const add = (name: "hair" | "brows" | "lashes", color: AutoMovieHumanHairColor, mesh: IAutoMovieMesh | null): void => {
    if (mesh === null || mesh.positions.length === 0) return;
    const material: IAutoMovieMaterial = materialOf(color, strands.id);
    materials.set(material.id, material);
    const origin: number[] = [head.position.x, head.position.y, head.position.z];
    parts.push({
      id: name,
      name,
      geometry: {
        type: "mesh",
        mesh: {
          ...mesh,
          positions: mesh.positions.map((x: number, i: number): number => (x - origin[i % 3]!) / 1000),
        },
      },
      material: material.id,
      attachedBone: "head",
      transform: null,
    });
  };
  const appearance: IAutoMovieHumanAppearance = props.appearance;
  add("hair", appearance.hair.color, growAutoMovieHumanHair({ surface, scalp, skeleton: props.skeleton, hair: appearance.hair }));
  add("brows", appearance.brows.color, growAutoMovieHumanBrows({ surface, skeleton: props.skeleton }));
  add("lashes", appearance.lashes.color, growAutoMovieHumanLashes({ surface, skeleton: props.skeleton, length: appearance.lashes.length }));
  return { parts, materials: [...materials.values()], images: parts.length === 0 ? [] : [strands] };
}

/** The hair material of one colour, sampling the strand atlas. */
function materialOf(color: AutoMovieHumanHairColor, atlas: string): IAutoMovieMaterial {
  const c: { r: number; g: number; b: number } = AUTOMOVIE_HUMAN_HAIR_COLORS[color];
  return {
    id: `hair.${color}`,
    name: `${color} hair`,
    baseColor: { ...c, a: null, hex: null },
    metallic: 0,
    roughness: 0.45,
    emissive: null,
    opacity: 1,
    baseColorTexture: {
      asset: atlas,
      texCoord: 0,
      coordinateSource: "normalized",
      colorSpace: "linear",
      sampler: { wrapS: "clamp", wrapT: "clamp", minFilter: "linearMipmapLinear", magFilter: "linear" },
    },
    alphaMode: "mask",
    alphaCutoff: 0.35,
    doubleSided: true,
    ior: 1.55,
    specularIntensity: 0.6,
    anisotropy: { strength: 0.4, rotationDeg: 90, texture: null },
  };
}
