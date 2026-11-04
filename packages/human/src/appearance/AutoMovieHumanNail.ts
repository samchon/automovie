import type {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanNailImage } from "./AutoMovieHumanNailImage";
import { AutoMovieHumanNailPlate } from "./AutoMovieHumanNailPlate";

/**
 * Finger and toe nails as thin plates on their digit chains' own surfaces.
 *
 * Each digit's construction publishes its nail plate's window on its chain
 * (`IAutoMovieHumanBodyCalibration.INail`, from `AutoMovieHumanNailPlate` in
 * generation): the root and free edge stations, the width and the dorsal
 * side. A separate part per nail, `human.nail.<side>.<digit>`, carries its
 * own coordinates, a glossy material and a physical closed plate whose bed is
 * the chain's own surface over that window and whose top stands the plate's
 * thickness above it (`AutoMovieHumanNailPlate` here). The skin's triangles
 * are never read.
 *
 * The material is opaque; the sampled image supplies colour and relief
 * inside the plate's physical outline. Proportions, thickness and colours
 * are conventions, not measurements.
 */
export namespace AutoMovieHumanNail {
  /** Nail parts, material and images. */
  export interface IOutput {
    /** `human.nail.<side>.<digit>` parts in model metres. */
    parts: IAutoMovieModelPart[];

    /** The `human.nail` material, or null without digits. */
    material: IAutoMovieMaterial | null;

    /** Images the material samples. */
    images: IAutoMovieImage[];
  }

  /** Id of the nail colour and coverage image. */
  export const colorId: string = AutoMovieHumanNailImage.colorId;

  /** Id of the nail normal map. */
  export const normalId: string = AutoMovieHumanNailImage.normalId;

  /** Edge of both nail images in pixels. */
  export const size: number = AutoMovieHumanNailImage.size;

  /**
   * Lay every published nail plate on its digit chain.
   *
   * @param chains The calibration's chains, mm
   * @param nails The nail plates' windows on their chains
   * @param scale Millimetre-to-model factor
   * @param albedo The person's base skin albedo, tinting the nail bed
   * @returns Parts, material and images
   */
  export function generate(
    chains: readonly IAutoMovieHumanLoftChain[],
    nails: readonly IAutoMovieHumanBodyCalibration.INail[],
    scale: number,
    albedo: readonly [number, number, number],
  ): IOutput {
    const byName: Map<string, IAutoMovieHumanLoftChain> = new Map(
      chains.map((c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [c.name, c]),
    );
    const parts: IAutoMovieModelPart[] = [];
    for (const nail of nails) {
      const chain: IAutoMovieHumanLoftChain | undefined = byName.get(nail.chain);
      const id: string | null = idOf(nail.chain);
      if (chain === undefined || id === null) continue;
      const mesh: AutoMovieHumanNailPlate.IOutput = AutoMovieHumanNailPlate.generate(chain, nail);
      parts.push({
        id,
        name: id,
        geometry: {
          type: "mesh",
          mesh: {
            positions: mesh.positions.map((v: number): number => v * scale),
            normals: mesh.normals,
            uvs: mesh.uvs,
            indices: mesh.indices,
            skin: null,
          },
        },
        material: "human.nail",
        attachedBone: null,
        transform: null,
      });
    }
    if (parts.length === 0) return { parts, material: null, images: [] };

    // The bed image is drawn for fair skin; a darker person darkens it by the
    // square root of their albedo relative to the image's reference.
    const tint: number[] = albedo.map((c: number, i: number): number =>
      Math.min(1, Math.sqrt(c / REFERENCE[i]!)),
    );
    const binding: (
      asset: string,
      colorSpace: "srgb" | "linear",
    ) => IAutoMovieTextureReference = (
      asset: string,
      colorSpace: "srgb" | "linear",
    ): IAutoMovieTextureReference => ({
      asset,
      texCoord: 0,
      coordinateSource: "normalized",
      colorSpace,
      sampler: {
        wrapS: "clamp",
        wrapT: "clamp",
        minFilter: "linearMipmapLinear",
        magFilter: "linear",
      },
    });
    return {
      parts,
      material: {
        id: "human.nail",
        name: "nail",
        baseColor: { r: tint[0]!, g: tint[1]!, b: tint[2]!, a: 1, hex: null },
        metallic: 0,
        roughness: 0.3,
        emissive: null,
        opacity: 1,
        alphaMode: "opaque",
        baseColorTexture: binding(colorId, "srgb"),
        normalTexture: binding(normalId, "linear"),
        normalScale: 1,
        ior: 1.5,
        specularIntensity: 1,
        clearcoat: 0.2,
        doubleSided: false,
      },
      images: AutoMovieHumanNailImage.generate(),
    };
  }
}


/** Linear skin albedo the nail image is drawn for. */
const REFERENCE: readonly number[] = [0.72, 0.53, 0.44];

/**
 * Part id of a digit chain's nail: `finger.<side>.<name>` gives
 * `human.nail.<side>.<name>`, `thumb.<side>` gives `human.nail.<side>.thumb`
 * and `toe.<side>.<n>` gives `human.nail.<side>.toe<n>`.
 *
 * @param chain Digit chain name
 * @returns The part id, or null for a chain that is no digit
 */
function idOf(chain: string): string | null {
  const match: RegExpExecArray | null = /^(finger|thumb|toe)\.(left|right)(?:\.(\w+))?$/.exec(chain);
  if (match === null) return null;
  const digit: string = match[1] === "thumb" ? "thumb" : match[1] === "toe" ? `toe${match[3]}` : match[3]!;
  return `human.nail.${match[2]}.${digit}`;
}
