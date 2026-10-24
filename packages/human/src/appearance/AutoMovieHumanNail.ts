import type {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import { AutoMovieHumanNailImage } from "./AutoMovieHumanNailImage";
import { AutoMovieHumanNailPlate } from "./AutoMovieHumanNailPlate";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { IAutoMovieHumanNailFrame } from "./IAutoMovieHumanNailFrame";

/**
 * Finger and toe nails as thin plates laid on the distal dorsal skin of every
 * digit chain.
 *
 * The lofted skin has no nail geometry (the nail's step is below the
 * fitter's event threshold) and its digit vertices are 3 to 5 mm apart, too
 * coarse for vertex colours to draw a nail outline, while one shared image
 * cannot address each digit through the skin coordinates. A separate part
 * per nail, `human.nail.<side>.<digit>`, therefore carries its own
 * coordinates, a glossy material and a physical closed plate. Its smooth
 * upper surface stands 0.45 mm above the sampled skin; the underside and
 * every boundary wall return to the exact generated skin intersections.
 *
 * Placement is a rule on each chain `finger.<side>.<name>`, `thumb.<side>` or
 * `toe.<side>.<n>`:
 *
 * - the digit axis runs from the chain's band centroid nearer the hand or
 *   foot to the one farther from it, and the tip is the vertex farthest along
 *   it;
 * - the nail faces dorsally: away from the palm for fingers (the palmar
 *   direction derived from the hand, thumb and finger centroids), between
 *   that and the hand's radial side for the thumb, and up for toes;
 * - with `r` the digit's mean radius over the distal part of the chain, the
 *   plate spans 1.6 r (fingers) or 1.25 r (toes) along the axis, ending
 *   0.35 r (0.45 r) short of the tip, and plus or minus 0.7 (0.68) rad around
 *   it;
 * - 14 rows of 11 rays leave a straight local axis fitted through the
 *   digit's cross-section centroids at the row stations and meet the
 *   digit's own triangles; each row's hit distances (ignoring hits more than
 *   35 percent off the row median, as at a spiky tip) are fitted with a
 *   quadratic across the nail and lifted by the largest positive residual,
 *   so the plate is smooth yet never below a facet, and stands 0.45 mm
 *   higher along the rays; normals come from the smooth plate.
 *
 * The grid itself follows the cuticle arc, lateral folds and rounded free
 * edge formerly represented only by image alpha. The material is opaque;
 * the sampled image supplies colour and relief inside that physical outline.
 * Cuticle folds in the neighboring skin are not reconstructed by this closure.
 * Proportions, thickness and colours are conventions, not measurements.
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
   * Lay nails on the digits of charted skin pieces.
   *
   * @param pieces Skin pieces in mm
   * @param scale Millimetre-to-model factor
   * @param albedo The person's base skin albedo, tinting the nail bed
   * @returns Parts, material and images
   */
  export function generate(
    pieces: readonly AutoMovieHumanSkinChart.IOutput[],
    scale: number,
    albedo: readonly [number, number, number],
  ): IOutput {
    const chains: Map<string, AutoMovieHumanSkinChart.IOutput[]> = new Map();
    for (const piece of pieces) {
      const chain: string = piece.name.slice(0, piece.name.lastIndexOf("/"));
      const list: AutoMovieHumanSkinChart.IOutput[] | undefined =
        chains.get(chain);
      if (list === undefined) chains.set(chain, [piece]);
      else list.push(piece);
    }

    const parts: IAutoMovieModelPart[] = [];
    for (const [name, list] of chains) {
      const match: RegExpExecArray | null =
        /^(finger|thumb|toe)\.(left|right)(?:\.(\w+))?$/.exec(name);
      if (match === null) continue;
      const kind: "finger" | "thumb" | "toe" = match[1] as
        | "finger"
        | "thumb"
        | "toe";
      const side: "left" | "right" = match[2] as "left" | "right";
      const digit: IAutoMovieHumanNailFrame | null = frame(
        chains,
        list,
        kind,
        side,
      );
      if (digit === null) continue;
      const mesh: AutoMovieHumanNailPlate.IOutput =
        AutoMovieHumanNailPlate.generate(list, digit, kind);
      const id: string = `human.nail.${side}.${
        kind === "thumb"
          ? "thumb"
          : kind === "toe"
            ? `toe${match[3]}`
            : match[3]
      }`;
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

/** Point or direction in mm. */
type Vec3 = AutoMovieHumanSkinVector.Vec3;

/** Vector arithmetic. */
const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

/** Linear skin albedo the nail image is drawn for. */
const REFERENCE: readonly number[] = [0.72, 0.53, 0.44];

/**
 * Frame of one digit chain.
 *
 * @param chains Pieces by chain
 * @param list The digit chain's pieces
 * @param kind Finger, thumb or toe
 * @param side Anatomical side
 * @returns The frame, or null when the hand or foot it hangs from is missing
 */
function frame(
  chains: Map<string, AutoMovieHumanSkinChart.IOutput[]>,
  list: readonly AutoMovieHumanSkinChart.IOutput[],
  kind: "finger" | "thumb" | "toe",
  side: "left" | "right",
): IAutoMovieHumanNailFrame | null {
  const gather: (prefix: string) => AutoMovieHumanSkinChart.IOutput[] = (
    prefix: string,
  ): AutoMovieHumanSkinChart.IOutput[] =>
    [...chains.entries()]
      .filter(([name]: [string, AutoMovieHumanSkinChart.IOutput[]]): boolean =>
        name.startsWith(prefix),
      )
      .flatMap(
        ([, pieces]: [
          string,
          AutoMovieHumanSkinChart.IOutput[],
        ]): AutoMovieHumanSkinChart.IOutput[] => pieces,
      );
  const base: AutoMovieHumanSkinChart.IOutput[] =
    kind === "toe" ? gather(`foot.${side}`) : gather(`hand.${side}.`);
  if (base.length === 0) return null;
  const anchor: Vec3 = mean(base);

  // Axis from the band centroid nearer the hand or foot to the farther one.
  const ends: [Vec3, Vec3] = extremes(list);
  const nearFirst: boolean =
    V.norm(V.sub(ends[0], anchor)) < V.norm(V.sub(ends[1], anchor));
  const root: Vec3 = nearFirst ? ends[0] : ends[1];
  const far: Vec3 = nearFirst ? ends[1] : ends[0];
  const axis: Vec3 = V.normalize(V.sub(far, root));

  let tip: number = -Infinity;
  for (const piece of list)
    for (let i: number = 0; i < piece.positions.length / 3; ++i)
      tip = Math.max(tip, V.dot(V.sub(V.at(piece.positions, i), root), axis));

  // Dorsal direction by digit kind, made perpendicular to the axis.
  let dorsal: Vec3 = [0, 1, 0];
  if (kind !== "toe") {
    const thumb: AutoMovieHumanSkinChart.IOutput[] = gather(`thumb.${side}`);
    const fingers: AutoMovieHumanSkinChart.IOutput[] = gather(
      `finger.${side}.`,
    );
    if (thumb.length === 0 || fingers.length === 0) return null;
    const handAxis: Vec3 = V.normalize(V.sub(mean(fingers), anchor));
    const toward: Vec3 = V.sub(mean(thumb), anchor);
    const radial: Vec3 = V.normalize(
      V.sub(toward, V.scale(handAxis, V.dot(toward, handAxis))),
    );
    const palmar: Vec3 = V.scale(
      V.normalize(V.cross(radial, handAxis)),
      side === "left" ? 1 : -1,
    );
    dorsal =
      kind === "finger"
        ? V.scale(palmar, -1)
        : V.add(V.scale(palmar, -0.6), V.scale(radial, 0.8));
  }
  dorsal = V.normalize(V.sub(dorsal, V.scale(axis, V.dot(dorsal, axis))));

  // Mean radius over the distal part of the chain, short of the tip cap.
  let lo: number = Infinity;
  for (const piece of list)
    for (let i: number = 0; i < piece.positions.length / 3; ++i)
      lo = Math.min(lo, V.dot(V.sub(V.at(piece.positions, i), root), axis));
  const length: number = tip - lo;
  let sum: number = 0;
  let count: number = 0;
  for (const piece of list)
    for (let i: number = 0; i < piece.positions.length / 3; ++i) {
      const d: Vec3 = V.sub(V.at(piece.positions, i), root);
      const s: number = V.dot(d, axis);
      if (s < tip - 0.45 * length || s > tip - 0.12 * length) continue;
      sum += V.norm(V.sub(d, V.scale(axis, s)));
      count += 1;
    }
  if (count === 0) return null;
  return { origin: root, axis, dorsal, tip, radius: sum / count };
}

/**
 * Vertex centroid of several pieces.
 *
 * @param pieces Pieces in mm
 * @returns Centroid
 */
function mean(pieces: readonly AutoMovieHumanSkinChart.IOutput[]): Vec3 {
  const all: number[] = pieces.flatMap(
    (piece: AutoMovieHumanSkinChart.IOutput): number[] => piece.positions,
  );
  return V.centroid(all);
}

/**
 * Centroids of a chain's first and last bands.
 *
 * @param pieces One chain's pieces
 * @returns Lowest-band and highest-band centroids
 */
function extremes(
  pieces: readonly AutoMovieHumanSkinChart.IOutput[],
): [Vec3, Vec3] {
  const band: (p: AutoMovieHumanSkinChart.IOutput) => number = (
    p: AutoMovieHumanSkinChart.IOutput,
  ): number => Number(p.name.slice(p.name.lastIndexOf("/") + 1));
  const sorted: AutoMovieHumanSkinChart.IOutput[] = [...pieces].sort(
    (
      a: AutoMovieHumanSkinChart.IOutput,
      b: AutoMovieHumanSkinChart.IOutput,
    ): number => band(a) - band(b),
  );
  return [
    V.centroid(sorted[0]!.positions),
    V.centroid(sorted[sorted.length - 1]!.positions),
  ];
}
