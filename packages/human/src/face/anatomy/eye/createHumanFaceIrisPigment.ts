import type { IAutoMovieMaterial } from "@automovie/interface";

import { decodePortraitPng } from "../../mesh/decodePortraitPng";
import { encodePortraitPng } from "../../mesh/encodePortraitPng";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceIris } from "../../structures/IAutoMovieHumanFaceIris";
import { createPortraitIrisMaterials } from "./createPortraitIrisMaterials";
import { humanFaceIrisTexelColour } from "./humanFaceIrisTexelColour";
import { locateHumanFaceIrisDisc } from "./locateHumanFaceIrisDisc";
import { rasterizeHumanFaceIrisTexels } from "./rasterizeHumanFaceIrisTexels";
import type { IHumanFaceIrisDisc } from "./structures/IHumanFaceIrisDisc";
import type { IHumanFaceIrisTexels } from "./structures/IHumanFaceIrisTexels";

/**
 * Compile the shared iris pigment rule of a connected basis.
 *
 * The basis eye is a globe mesh whose one texture paints sclera, iris and
 * pupil together, so a material colour override can only tint the whole eye
 * and a blue or grey iris cannot be written at all. This rule repaints only
 * the anatomical iris disc of that texture from the document's numerical
 * pigments and leaves every other texel as the basis has it.
 *
 * At compile time each articulated eye (`basis.articulation.eyes`) finds its
 * globe: the triangles of a textured region whose three vertices are bound to
 * that eye with weight one. Their neutral positions give the iris disc
 * (`locateHumanFaceIrisDisc`). The texture is decoded and the disc rasterized
 * (`rasterizeHumanFaceIrisTexels`) only when a document first carries `iris`,
 * because most documents never pay for it. Per document the texels are
 * painted by `humanFaceIrisTexelColour` and the material's texture is
 * replaced by a new PNG; the last result is cached by its pigments, so replay
 * of the same document reuses the same bytes.
 *
 * The disc is the population's absolute iris on the globe
 * (`locateHumanFaceIrisDisc`); where the texture's own painted iris, drawn in
 * proportion to an oversized globe, reaches beyond it, the rest of that
 * painted iris is covered with the mean sclera colour of the ring just
 * outside it, blended across the painted edge, so no second, darker ring
 * shows around the anatomical iris.
 *
 * The rule changes no geometry and no other material. Omission or null leaves
 * the materials untouched, byte for byte. It refuses a pigment outside the
 * unit range (through `createPortraitIrisMaterials`), a basis without
 * articulated eyes and an eye without a textured globe. Colours follow the
 * constructed portrait eye's band semantics so one pigment reads the same on
 * both face builders; they are an authored optical approximation, not a
 * recovered reflectance.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Makes each eye's iris colour an authored value painted by one rule on the shared eye texture.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Expresses iris differences as numerical pigments over the common basis texture instead of personal images.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Locates each articulated globe, paints its anatomical disc by band and blends the limbus into the unchanged sclera.
 */
export function createHumanFaceIrisPigment(
  basis: IAutoMovieHumanFaceBasis,
): (
  iris: IAutoMovieHumanFaceIris | null | undefined,
  materials: IAutoMovieMaterial[],
) => void {
  const globes = (basis.articulation?.eyes ?? []).map((eye) => ({
    eye: eye.id,
    globe: findGlobe(basis, eye.id),
  }));
  let prepared: Map<string, IPreparedTexture> | undefined;
  let cache: { key: string; textures: Map<string, string> } | undefined;
  return (iris, materials) => {
    if (iris === undefined || iris === null) return;
    const bands: Record<string, [number, number, number][]> = {
      leftEye: createPortraitIrisMaterials("iris", iris.left).map(linear),
      rightEye: createPortraitIrisMaterials("iris", iris.right).map(linear),
    };
    if (globes.length === 0)
      throw new Error("Iris pigment needs a basis with articulated eyes.");
    const paintable: IGlobe[] = globes.map(({ eye, globe }) => {
      if (bands[eye] === undefined)
        throw new Error(
          "Iris pigment names leftEye and rightEye only, not " + eye + ".",
        );
      if (globe === null)
        throw new Error("Iris pigment needs a textured globe for " + eye + ".");
      return globe;
    });
    const key = JSON.stringify([iris.left, iris.right]);
    if (cache?.key !== key) {
      prepared ??= prepare(paintable);
      const textures = new Map<string, string>();
      for (const [material, texture] of prepared) {
        const rgba = texture.rgba.slice();
        for (const { eye, disc, texels, sclera } of texture.eyes)
          texels.index.forEach((index, at) => {
            const theta = texels.theta[at];
            const painted = [0, 1, 2].map((c) =>
              toLinear(texture.rgba[4 * index + c]),
            );
            // Under an anatomical disc smaller than the texture's painted
            // iris, the rest of that iris becomes sclera, blended into the
            // painting across its edge.
            const cover =
              disc.painted > disc.limbus
                ? clamp01((disc.painted + EDGE - theta) / (2 * EDGE))
                : 0;
            const original = painted.map(
              (value, c) => value + (sclera[c] - value) * cover,
            );
            const colour = humanFaceIrisTexelColour({
              theta,
              phi: texels.phi[at],
              limbus: disc.limbus,
              pupil: disc.pupil,
              bands: bands[eye],
              edge: EDGE,
              original: original as [number, number, number],
            });
            for (let c = 0; c < 3; ++c) rgba[4 * index + c] = toByte(colour[c]);
          });
        textures.set(
          material,
          encodePortraitPng({
            width: texture.width,
            height: texture.height,
            rgba,
          }),
        );
      }
      cache = { key, textures };
    }
    for (const [id, uri] of cache.textures)
      materials.find((one) => one.id === id)!.baseColorTexture = uri;
  };
}

/**
 * The globe of one eye: the first textured, UV-bearing region whose triangles
 * are fully bound to that eye owner (weight one on all three vertices), with
 * the neutral positions of those vertices. Null when no surface has one.
 */
function findGlobe(
  basis: IAutoMovieHumanFaceBasis,
  eye: string,
): IGlobe | null {
  for (const surface of basis.surfaces) {
    const rows =
      surface.attachments?.find((one) => one.owner === eye)?.rows ?? [];
    const bound = new Set<number>();
    for (let i = 0; i < rows.length; i += 2)
      if (rows[i + 1] === 1) bound.add(rows[i]);
    const point = (vertex: number): [number, number, number] => [
      surface.positions[3 * vertex],
      surface.positions[3 * vertex + 1],
      surface.positions[3 * vertex + 2],
    ];
    for (const region of surface.regions) {
      const texture = basis.materials.find(
        (one) => one.id === region.material,
      )?.baseColorTexture;
      // Only an embedded PNG can be repainted; a texture reference names an
      // image this builder cannot read, and untextured geometry has no iris.
      if (region.uvs === null || typeof texture !== "string") continue;
      const uvs = region.uvs;
      const triangles: IGlobe["triangles"] = [];
      for (let t = 0; t < region.indices.length; t += 3) {
        const corners = region.indices.slice(t, t + 3);
        if (corners.every((vertex) => bound.has(vertex)))
          triangles.push({
            positions: corners.map(point),
            uvs: [0, 1, 2].map((k) => [uvs[2 * (t + k)], uvs[2 * (t + k) + 1]]),
          });
      }
      if (triangles.length === 0) continue;
      const vertices = [
        ...new Set(region.indices.filter((vertex) => bound.has(vertex))),
      ];
      return {
        eye,
        material: region.material,
        texture,
        triangles,
        disc: locateHumanFaceIrisDisc(vertices.map(point)),
      };
    }
  }
  return null;
}

/** Decode each globe texture once and rasterize every eye painted on it. */
function prepare(globes: readonly IGlobe[]): Map<string, IPreparedTexture> {
  const byMaterial = new Map<string, IPreparedTexture>();
  for (const globe of globes) {
    let texture = byMaterial.get(globe.material);
    if (texture === undefined) {
      texture = { ...decodePortraitPng(globe.texture), eyes: [] };
      byMaterial.set(globe.material, texture);
    }
    const disc = globe.disc;
    const reach = Math.max(disc.limbus, disc.painted);
    const texels = rasterizeHumanFaceIrisTexels({
      width: texture.width,
      height: texture.height,
      triangles: globe.triangles,
      disc,
      margin: reach - disc.limbus + EDGE + SCLERA_BAND,
    });
    // The sclera just outside the painted iris, averaged in linear colour.
    const sum = [0, 0, 0];
    let count = 0;
    texels.index.forEach((index, at) => {
      if (texels.theta[at] <= disc.painted + EDGE) return;
      for (let c = 0; c < 3; ++c)
        sum[c] += toLinear(texture!.rgba[4 * index + c]);
      ++count;
    });
    texture.eyes.push({
      eye: globe.eye,
      disc,
      texels,
      sclera: (count === 0 ? [1, 1, 1] : sum.map((value) => value / count)) as [
        number,
        number,
        number,
      ],
    });
  }
  return byMaterial;
}

/** One eye's textured globe on the neutral basis. */
interface IGlobe {
  eye: string;
  material: string;
  texture: string;
  triangles: {
    positions: [number, number, number][];
    uvs: [number, number][];
  }[];
  disc: IHumanFaceIrisDisc;
}

/**
 * Half-width of the anti-aliased limbal and pupillary edges, radians of polar
 * angle (0.3 degrees, about one texel of a 1024 texture's iris).
 */
const EDGE = (0.3 * Math.PI) / 180;

/** Width of the sclera ring averaged outside the painted iris, radians. */
const SCLERA_BAND = (2 * Math.PI) / 180;

/** A decoded eye texture and the iris texels of each eye painted on it. */
interface IPreparedTexture {
  width: number;
  height: number;
  rgba: Uint8Array;
  eyes: {
    eye: string;
    disc: IHumanFaceIrisDisc;
    texels: IHumanFaceIrisTexels;
    /** Mean linear sclera colour just outside the painted iris. */
    sclera: [number, number, number];
  }[];
}

function linear(material: IAutoMovieMaterial): [number, number, number] {
  return [material.baseColor.r, material.baseColor.g, material.baseColor.b];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** IEC 61966-2-1 sRGB decoding of one 8-bit channel. */
function toLinear(byte: number): number {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** IEC 61966-2-1 sRGB encoding of one linear channel to 8 bits. */
function toByte(value: number): number {
  const c =
    value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(clamp01(c) * 255);
}
