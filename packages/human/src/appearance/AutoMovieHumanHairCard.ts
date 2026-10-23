import type { IAutoMovieMaterial, IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairCurl } from "../typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanHairGuide } from "./AutoMovieHumanHairGuide";
import { AutoMovieHumanHairImage } from "./AutoMovieHumanHairImage";
import { AutoMovieHumanHairShade } from "./AutoMovieHumanHairShade";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanScalpBoundary } from "./AutoMovieHumanScalpBoundary";

/**
 * Hair cards and the scalp undercoat, realised from solved guides.
 *
 * Cards: one ribbon per guide, lying in the scalp's tangent plane (its
 * width runs along `heading x outward`), so cards shingle over the head
 * like layered hair instead of standing on edge. Each card samples a
 * quarter-width window of the shared strand image chosen by its root's
 * hash, with v running from root to tip; normals are the chart's outward
 * directions, which shade the hair mass as one volume rather than as flat
 * strips, leaned per card and across its width so bundles still read, and
 * a per-card vertex-colour shade with darker roots breaks the mass into
 * locks. Width tapers to half at the tip. Curl classes
 * add an in-plane wave whose amplitude and wavelength grow tighter from
 * class I (straight) to VIII; a class names curve diameter and twist
 * ranges (Callender 2026), not these values, which are conventions of a
 * card representation that cannot show tight coils.
 *
 * Undercoat: the hair-bearing chart cells, three millimetres inside the
 * scalp boundary, as an opaque shell half a millimetre above the skin in a
 * darkened hair colour. It stands for the dense hair layer the cards'
 * alpha cut-outs reveal, so skin never shows through the hair mass.
 *
 * All cards form one mesh and one material (one draw), as does the
 * undercoat.
 */
export namespace AutoMovieHumanHairCard {
  /** Realised hair meshes in model metres; null where nothing is emitted. */
  export interface IOutput {
    /** All cards. */
    cards: IAutoMovieMesh;

    /** Opaque undercoat shell. */
    scalp: IAutoMovieMesh;
  }

  /**
   * Realise cards and undercoat.
   *
   * @param field Head chart
   * @param hair Scalp hair input
   * @param guides Solved guides, at least one
   * @returns Card and undercoat meshes
   */
  export function generate(
    field: AutoMovieHumanHeadField.IField,
    hair: IAutoMovieHumanScalpHair,
    guides: AutoMovieHumanHairGuide.IGuide[],
  ): IOutput {
    return {
      cards: cards(field, hair, guides),
      scalp: undercoat(field, hair),
    };
  }

  /**
   * Materials `human.hair.cards` and `human.hair.scalp`.
   *
   * Cards: the strand image's luminance times the category colour,
   * alpha-tested at 0.35 coverage (mask needs no sorting and writes depth,
   * at the cost of aliased strand edges), double-sided, roughness 0.38
   * with an anisotropic lobe streaked along v, the strand direction
   * (strength 0.6), and specular intensity 0.7 for the fibre's weak
   * dielectric reflection; conventions pending the optical qualification
   * of #2957. Undercoat: 55 percent of the colour, roughness 0.85, opaque.
   *
   * @param hair Scalp hair input
   * @returns The two materials
   */
  export function materials(
    hair: IAutoMovieHumanScalpHair,
  ): IAutoMovieMaterial[] {
    const [r, g, b] = AutoMovieHumanHairShade.linear(hair.color);
    return [
      {
        id: "human.hair.cards",
        name: "scalp hair",
        baseColor: { r, g, b, a: 1, hex: null },
        metallic: 0,
        roughness: 0.38,
        emissive: null,
        opacity: 1,
        baseColorTexture: {
          asset: AutoMovieHumanHairImage.id,
          texCoord: 0,
          colorSpace: "srgb",
          sampler: {
            wrapS: "repeat",
            wrapT: "clamp",
            minFilter: "linearMipmapLinear",
            magFilter: "linear",
          },
        },
        doubleSided: true,
        alphaMode: "mask",
        alphaCutoff: 0.35,
        specularIntensity: 0.7,
        anisotropy: { strength: 0.6, rotationDeg: 90, texture: null },
      },
      {
        id: "human.hair.scalp",
        name: "scalp hair undercoat",
        baseColor: { r: r * 0.55, g: g * 0.55, b: b * 0.55, a: 1, hex: null },
        metallic: 0,
        roughness: 0.85,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      },
    ];
  }
}

/** Card width at the root, millimetres, per style (conventions). */
const WIDTH: Record<AutoMovieHumanHairStyle, number> = {
  [AutoMovieHumanHairStyle.Crop]: 7,
  [AutoMovieHumanHairStyle.Short]: 9,
  [AutoMovieHumanHairStyle.Bob]: 12,
};

/** In-plane wave `[amplitude mm, wavelength mm]` per curl class. */
const CURL: Record<AutoMovieHumanHairCurl, [number, number]> = {
  [AutoMovieHumanHairCurl.I]: [0, 1],
  [AutoMovieHumanHairCurl.II]: [1.5, 45],
  [AutoMovieHumanHairCurl.III]: [3, 32],
  [AutoMovieHumanHairCurl.IV]: [4.5, 24],
  [AutoMovieHumanHairCurl.V]: [5.5, 16],
  [AutoMovieHumanHairCurl.VI]: [6, 12],
  [AutoMovieHumanHairCurl.VII]: [6.5, 9],
  [AutoMovieHumanHairCurl.VIII]: [7, 6],
};

/**
 * Card ribbons of every guide as one mesh.
 *
 * @param field Head chart, for the model offset
 * @param hair Scalp hair input
 * @param guides Solved guides
 * @returns Mesh in model metres with UV0
 */
function cards(
  field: AutoMovieHumanHeadField.IField,
  hair: IAutoMovieHumanScalpHair,
  guides: AutoMovieHumanHairGuide.IGuide[],
): IAutoMovieMesh {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const width: number = WIDTH[hair.style];
  const [amplitude, wavelength] = CURL[hair.curl];

  for (const guide of guides) {
    const base: number = positions.length / 3;
    const n: number = guide.points.length;
    const window: number =
      Math.floor(AutoMovieHumanAppearanceNoise.hash(8, guide.root) * 4) / 4;
    const phase: number =
      2 * Math.PI * AutoMovieHumanAppearanceNoise.hash(9, guide.root);

    // Per-card shade and normal tilt break the mass into bundles: shade is a
    // linear multiplier in [0.7, 1], tilt leans the card normal sideways by
    // up to a quarter radian, and each edge leans a further 0.15 outward so
    // a card shades like a rounded bundle rather than a flat strip.
    const shade: number =
      0.7 + 0.3 * AutoMovieHumanAppearanceNoise.hash(10, guide.root);
    const tilt: number =
      0.5 * (AutoMovieHumanAppearanceNoise.hash(11, guide.root) - 0.5);
    let s: number = 0;

    for (let i: number = 0; i < n; ++i) {
      const p: [number, number, number] = guide.points[i]!;
      const outward: [number, number, number] = guide.normals[i]!;
      if (i > 0) s += distance(p, guide.points[i - 1]!);

      // Heading by central differences; the width axis is heading x
      // outward, tangent to the scalp.
      const a: [number, number, number] = guide.points[Math.max(0, i - 1)]!;
      const b: [number, number, number] = guide.points[Math.min(n - 1, i + 1)]!;
      const heading: [number, number, number] = [
        b[0] - a[0],
        b[1] - a[1],
        b[2] - a[2],
      ];
      const side: [number, number, number] = unit(cross(heading, outward));

      const t: number = s / guide.length;
      const half: number = (width / 2) * (1 - 0.5 * t);
      const wave: number =
        amplitude *
        Math.sin((2 * Math.PI * s) / wavelength + phase) *
        Math.min(1, s / 10);

      // Roots darker than the outer length, as the hair above shades them.
      const tone: number = shade * (0.8 + 0.2 * Math.min(1, t / 0.3));

      for (const sign of [-1, 1]) {
        const offset: number = wave + sign * half;
        const lean: number = tilt + sign * 0.15;
        const normal: [number, number, number] = unit([
          outward[0] + side[0] * lean,
          outward[1] + side[1] * lean,
          outward[2] + side[2] * lean,
        ]);
        for (let k: number = 0; k < 3; ++k) {
          positions.push((field.centre[k]! + p[k]! + side[k]! * offset) / 1000);
          normals.push(normal[k]!);
          colors.push(tone);
        }
        uvs.push(window + (sign > 0 ? 0.25 : 0), t);
      }
    }

    // Two triangles per segment, front facing outward: (R - L) runs along
    // heading x outward and (L' - L) along heading, whose cross product is
    // the outward direction.
    for (let i: number = 0; i + 1 < n; ++i) {
      const l: number = base + i * 2;
      indices.push(l, l + 1, l + 2, l + 1, l + 3, l + 2);
    }
  }

  return { positions, normals, uvs, colors, indices, skin: null };
}

/**
 * Opaque undercoat over the hair-bearing chart cells.
 *
 * @param field Head chart
 * @param hair Scalp hair input
 * @returns Mesh in model metres without UVs
 */
function undercoat(
  field: AutoMovieHumanHeadField.IField,
  hair: IAutoMovieHumanScalpHair,
): IAutoMovieMesh {
  const NA: number = AutoMovieHumanHeadField.azimuthCells;
  const NB: number = AutoMovieHumanHeadField.elevationCells;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Corner lattice (i, j), emitted on first use so only hair-bearing cells
  // carry vertices; azimuth index NA is the same corner as 0, so cells
  // close around the head without a seam.
  const corners: Map<number, number> = new Map();
  const corner: (i: number, j: number) => number = (
    i: number,
    j: number,
  ): number => {
    const key: number = j * NA + (i % NA);
    const known: number | undefined = corners.get(key);
    if (known !== undefined) return known;
    const u: [number, number, number] = AutoMovieHumanHeadField.direction(
      (i / NA) * 2 * Math.PI,
      (j / NB) * Math.PI - Math.PI / 2,
    );
    const r: number = AutoMovieHumanHeadField.radius(field, u) + 0.5;
    for (let k: number = 0; k < 3; ++k) {
      positions.push((field.centre[k]! + u[k]! * r) / 1000);
      normals.push(u[k]!);
    }
    corners.set(key, positions.length / 3 - 1);
    return positions.length / 3 - 1;
  };

  // Cells whose centre bears hair at least 3 mm inside the boundary.
  for (let j: number = 0; j < NB; ++j)
    for (let i: number = 0; i < NA; ++i) {
      const alpha: number = ((i + 0.5) / NA) * 2 * Math.PI;
      const u: [number, number, number] = AutoMovieHumanHeadField.direction(
        alpha,
        ((j + 0.5) / NB) * Math.PI - Math.PI / 2,
      );
      const r: number = AutoMovieHumanHeadField.radius(field, u);
      if (r <= 0) continue;
      const above: number = field.centre[1] + u[1] * r - field.eyeLevel;
      const boundary: number = AutoMovieHumanScalpBoundary.height(
        hair.hairline,
        alpha,
        field.height,
      );
      if (above < boundary + 3) continue;

      // Counterclockwise seen from outside: azimuth runs from +X toward +Z
      // and elevation upward, so (i, j), (i, j + 1), (i + 1, j) faces out.
      const a: number = corner(i, j);
      const b: number = corner(i + 1, j);
      const c: number = corner(i, j + 1);
      const d: number = corner(i + 1, j + 1);
      indices.push(a, c, b, b, c, d);
    }

  return { positions, normals, uvs: null, indices, skin: null };
}

/**
 * Distance between points.
 *
 * @param a First point
 * @param b Second point
 * @returns `|a - b|`
 */
function distance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Cross product.
 *
 * @param a Left
 * @param b Right
 * @returns `a x b`
 */
function cross(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Unit vector.
 *
 * @param a Nonzero vector
 * @returns `a / |a|`
 */
function unit(a: [number, number, number]): [number, number, number] {
  const l: number = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
