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
 * Cards: one ribbon per guide, lying in the hair mass's tangent plane (its
 * width runs along `heading x outward`), so cards shingle over the head
 * like layered hair instead of standing on edge. Each card samples a
 * quarter-width window of the shared strand image chosen by its root's
 * hash. v runs from root to tip, mapped so the image's root band covers
 * the first 8 mm of the card and its tip band the last 30 mm (at most a
 * tenth and a fifth of the card), so every card emerges from the
 * scalp as scattered hairs and ends in tapered points of uneven length
 * whatever its length. Normals are the guide's mass normals, which shade
 * the hair as one volume rather than as flat strips, leaned slightly per
 * card and across its width, and a per-card vertex-colour shade with
 * darker roots breaks the mass into locks. Width narrows by a quarter
 * along the card and by a further fifth over the tip band. Curl classes
 * add an in-plane wave whose amplitude and wavelength grow tighter from
 * class I (straight) to VIII, with a phase that varies smoothly over the
 * scalp so neighbouring cards wave together; a class names curve diameter
 * and twist ranges (Callender 2026), not these values, which are
 * conventions of a card representation that cannot show tight coils.
 *
 * Undercoat: the scalp from six millimetres inside the scalp boundary
 * up to the vertex, its margin following the boundary as a smooth curve,
 * as an opaque shell a millimetre above the skin (below the cards, which
 * start 1.2 mm above it, and far enough that the shell does not lose the
 * depth test to the skin where a view grazes the vault) in a darkened hair
 * colour. It stands for the dense hair layer the cards' alpha cut-outs
 * reveal, so skin never shows through the hair mass.
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
   * with an anisotropic lobe whose roughness grows along u, across the
   * strands (strength 0.6), and specular intensity 0.7 for the fibre's weak
   * dielectric reflection. A fibre reflects light on a cone about its own
   * axis, so its highlight spreads across the strands and the hair mass
   * shows the familiar band running around the head (Kajiya and Kay 1989);
   * the glTF anisotropy direction is the one along which the highlight is
   * stretched. Stretching it along v, the strand direction, drew one
   * vertical stripe down the back of the head. Conventions pending the
   * optical qualification of #2957. Undercoat: 55 percent of the colour,
   * roughness 0.85, opaque.
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
        anisotropy: { strength: 0.6, rotationDeg: 0, texture: null },
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
    const length: number = guide.length;
    const window: number =
      Math.floor(AutoMovieHumanAppearanceNoise.hash(8, guide.root) * 4) / 4;

    // Wave phase: value noise over the root's chart angles, twelve cells
    // around the head, so neighbouring cards wave together as one lock
    // instead of crossing each other, plus a little per card.
    const r: [number, number, number] = unit(guide.points[0]!);
    const phase: number =
      2 *
      Math.PI *
      (AutoMovieHumanAppearanceNoise.value2(
        9,
        (Math.atan2(r[2], r[0]) / (2 * Math.PI)) * 12,
        (Math.asin(Math.max(-1, Math.min(1, r[1]))) / Math.PI) * 6,
        12,
      ) +
        0.05 * AutoMovieHumanAppearanceNoise.hash(9, guide.root));

    // Per-card shade and normal tilt break the mass into bundles without
    // breaking its shading: shade is a linear multiplier in [0.8, 1], tilt
    // leans the card normal sideways by up to 0.03 radian, and each edge
    // leans a further 0.03 outward so a card shades like a slightly rounded
    // bundle. Larger leans give each card its own highlight and the mass
    // reads as separate planks.
    const shade: number =
      0.8 + 0.2 * AutoMovieHumanAppearanceNoise.hash(10, guide.root);
    const tilt: number =
      0.06 * (AutoMovieHumanAppearanceNoise.hash(11, guide.root) - 0.5);

    // Physical lengths of the image's root and tip bands: 8 mm of root and
    // 30 mm of tip, each at most a tenth and a fifth of the card, so
    // ends look alike on every length.
    const rootSpan: number = Math.min(8, 0.1 * length);
    const tipSpan: number = Math.min(30, 0.2 * length);
    const tipStart: number = length - tipSpan;
    let s: number = 0;

    for (let i: number = 0; i < n; ++i) {
      const p: [number, number, number] = guide.points[i]!;
      const outward: [number, number, number] = guide.normals[i]!;
      if (i > 0) s += distance(p, guide.points[i - 1]!);

      // Heading by central differences; the width axis is heading x
      // outward, tangent to the hair mass.
      const a: [number, number, number] = guide.points[Math.max(0, i - 1)]!;
      const b: [number, number, number] = guide.points[Math.min(n - 1, i + 1)]!;
      const heading: [number, number, number] = [
        b[0] - a[0],
        b[1] - a[1],
        b[2] - a[2],
      ];
      const side: [number, number, number] = unit(cross(heading, outward));

      const t: number = s / length;
      const v: number =
        s < rootSpan
          ? (AutoMovieHumanHairImage.root * s) / rootSpan
          : s > tipStart
            ? AutoMovieHumanHairImage.tip +
              ((1 - AutoMovieHumanHairImage.tip) * (s - tipStart)) / tipSpan
            : AutoMovieHumanHairImage.root +
              ((AutoMovieHumanHairImage.tip - AutoMovieHumanHairImage.root) *
                (s - rootSpan)) /
                Math.max(tipStart - rootSpan, 1e-9);

      // Width narrows by a quarter along the length and by a further fifth
      // over the tip band, where the image's strands converge into points.
      // Narrowing by half there drew each card's end as a separate spike,
      // and the cut as a saw edge.
      const half: number =
        (width / 2) *
        (1 - 0.25 * t) *
        (1 -
          0.2 * AutoMovieHumanAppearanceNoise.smoothstep(tipStart, length, s));
      const wave: number =
        amplitude *
        Math.sin((2 * Math.PI * s) / wavelength + phase) *
        Math.min(1, s / 10);

      // Roots darker than the outer length, as the hair above shades them.
      const tone: number = shade * (0.8 + 0.2 * Math.min(1, t / 0.3));

      for (const sign of [-1, 1]) {
        const offset: number = wave + sign * half;
        const lean: number = tilt + sign * 0.03;
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
        uvs.push(window + (sign > 0 ? 0.25 : 0), v);
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
 * Opaque undercoat over the hair-bearing scalp.
 *
 * A lattice of chart directions, one column per chart azimuth cell and
 * {@link UNDERCOAT_ROWS} rows from the undercoat's edge up to the vertex,
 * which closes on one pole vertex. The edge of each column lies exactly at
 * the elevation where the skin rises 3 mm above the scalp boundary
 * ({@link edge}), so the shell's margin follows the hairline as a smooth
 * curve instead of the staircase of whole chart cells.
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
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const vertex: (u: [number, number, number]) => void = (
    u: [number, number, number],
  ): void => {
    const r: number = AutoMovieHumanHeadField.radius(field, u) + 1;
    for (let k: number = 0; k < 3; ++k) {
      positions.push((field.centre[k]! + u[k]! * r) / 1000);
      normals.push(u[k]!);
    }
  };

  // Rows j = 0 (edge) .. UNDERCOAT_ROWS - 1, column i at index j * NA + i.
  const edges: number[] = [];
  for (let i: number = 0; i < NA; ++i)
    edges.push(edge(field, hair, (i / NA) * 2 * Math.PI));
  for (let j: number = 0; j < UNDERCOAT_ROWS; ++j)
    for (let i: number = 0; i < NA; ++i) {
      const beta: number =
        edges[i]! + ((Math.PI / 2 - edges[i]!) * j) / UNDERCOAT_ROWS;
      vertex(AutoMovieHumanHeadField.direction((i / NA) * 2 * Math.PI, beta));
    }
  vertex([0, 1, 0]);
  const pole: number = positions.length / 3 - 1;

  // Counterclockwise seen from outside: azimuth runs from +X toward +Z and
  // elevation upward, so (i, j), (i, j + 1), (i + 1, j) faces out.
  for (let j: number = 0; j < UNDERCOAT_ROWS; ++j)
    for (let i: number = 0; i < NA; ++i) {
      const a: number = j * NA + i;
      const b: number = j * NA + ((i + 1) % NA);
      if (j + 1 === UNDERCOAT_ROWS) {
        indices.push(a, pole, b);
        continue;
      }
      indices.push(a, a + NA, b, b, a + NA, b + NA);
    }

  return { positions, normals, uvs: null, indices, skin: null };
}

/**
 * Height of the undercoat's edge above the scalp boundary, mm. Inside it
 * the cards' scattered root band shows the skin between hairs, so the
 * hairline feathers in; at 3 mm the opaque shell drew the hairline as a
 * hard, comb-like edge.
 */
const INSET: number = 6;

/** Undercoat rows from its edge to the row below the pole. */
const UNDERCOAT_ROWS: number = 32;

/**
 * Elevation of the undercoat's edge at one azimuth: the lowest elevation
 * from which the skin, all the way up to the vertex, lies at least
 * {@link INSET} mm
 * above the scalp boundary.
 *
 * Marches down from the vertex in steps of a quarter chart cell until the
 * skin falls below that height or leaves the chart, then bisects the last
 * step twenty times.
 *
 * @param field Head chart
 * @param hair Scalp hair input
 * @param alpha Azimuth, radians
 * @returns Elevation, radians
 */
function edge(
  field: AutoMovieHumanHeadField.IField,
  hair: IAutoMovieHumanScalpHair,
  alpha: number,
): number {
  const boundary: number =
    AutoMovieHumanScalpBoundary.height(hair.hairline, alpha, field.height) +
    INSET;
  const bears: (beta: number) => boolean = (beta: number): boolean => {
    const u: [number, number, number] = AutoMovieHumanHeadField.direction(
      alpha,
      beta,
    );
    const r: number = AutoMovieHumanHeadField.radius(field, u);
    return (
      AutoMovieHumanHeadField.covered(field, u) &&
      field.centre[1] + u[1] * r - field.eyeLevel >= boundary
    );
  };

  const delta: number = Math.PI / AutoMovieHumanHeadField.elevationCells / 4;
  let high: number = Math.PI / 2;
  while (high - delta > -Math.PI / 2 && bears(high - delta)) high -= delta;
  let low: number = Math.max(-Math.PI / 2, high - delta);
  for (let k: number = 0; k < 20; ++k) {
    const mid: number = (low + high) / 2;
    if (bears(mid)) high = mid;
    else low = mid;
  }
  return high;
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
