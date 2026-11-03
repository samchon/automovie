import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairCardCurl } from "./AutoMovieHumanHairCardCurl";
import { AutoMovieHumanHairCardRootFlare } from "./AutoMovieHumanHairCardRootFlare";
import { AutoMovieHumanHairCardShade } from "./AutoMovieHumanHairCardShade";
import { AutoMovieHumanHairCardTaper } from "./AutoMovieHumanHairCardTaper";
import { AutoMovieHumanHairCardTipCap } from "./AutoMovieHumanHairCardTipCap";
import { AutoMovieHumanHairCardUv } from "./AutoMovieHumanHairCardUv";
import { AutoMovieHumanHairFeather } from "./AutoMovieHumanHairFeather";
import type { AutoMovieHumanHairGuide } from "./AutoMovieHumanHairGuide";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * Hair cards, realised from solved guides: one ribbon per guide, assembled
 * from the card's own pieces.
 *
 * A ribbon lies in the hair mass's tangent plane (its width runs along
 * `heading x outward`), so cards shingle over the head like layered hair
 * instead of standing on edge. Its width is the product of the style's root
 * width, the hairline transition's share (`AutoMovieHumanHairFeather`), the
 * root flare, the taper and the tip cap (`AutoMovieHumanHairCardRootFlare`,
 * `AutoMovieHumanHairCardTaper`, `AutoMovieHumanHairCardTipCap`); its v runs
 * over the strand image's bands (`AutoMovieHumanHairCardUv`); its wave is
 * the curl class's (`AutoMovieHumanHairCardCurl`); its tone and lean are
 * the per-card shade's (`AutoMovieHumanHairCardShade`). Normals are the
 * guide's mass normals, which shade the hair as one volume rather than as
 * flat strips. Every segment reaching into the tip band is cut into pieces
 * of at most {@link TIP_STEP} mm, so the rounded end is drawn. A mirrored
 * root's card reads its canonical root's seed and turns its wave and lean the
 * other way, since the width axis `heading x outward` of a reflected card is
 * the reflected axis reversed; a symmetric style's cards are then exact
 * reflections.
 *
 * All cards form one mesh and one material (one draw). The scalp under them
 * is `AutoMovieHumanHairScalpLayer`; the materials are
 * `AutoMovieHumanHairCardMaterial`.
 */
export namespace AutoMovieHumanHairCard {
  /**
   * Card width at the root for a style, millimetres (conventions).
   *
   * @param style Haircut
   * @returns Width
   */
  export function width(style: AutoMovieHumanHairStyle): number {
    return WIDTH[style];
  }

  /**
   * Half the card's width at an arc length from its root, millimetres.
   *
   * @param style Haircut, for the width
   * @param guide The card's guide
   * @param s Arc length from the root, millimetres
   * @returns Half width, millimetres
   */
  export function half(
    style: AutoMovieHumanHairStyle,
    guide: AutoMovieHumanHairGuide.IGuide,
    s: number,
  ): number {
    const [rootSpan, tipSpan, tipStart] = AutoMovieHumanHairCardUv.ends(
      guide.feather,
      guide.length,
    );
    return (
      (WIDTH[style] / 2) *
      AutoMovieHumanHairFeather.share(guide.feather) *
      AutoMovieHumanHairCardRootFlare.factor(s, rootSpan) *
      AutoMovieHumanHairCardTaper.factor(s, guide.length) *
      AutoMovieHumanHairCardTipCap.factor(s, tipStart, tipSpan)
    );
  }

  /**
   * Realise the cards.
   *
   * @param field Head chart, for the model offset
   * @param hair Scalp hair input
   * @param guides Solved guides
   * @returns Card mesh in model metres with UV0
   */
  export function generate(
    field: AutoMovieHumanHeadField.IField,
    hair: IAutoMovieHumanScalpHair,
    guides: AutoMovieHumanHairGuide.IGuide[],
  ): IAutoMovieMesh {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const [amplitude, wavelength] = AutoMovieHumanHairCardCurl.parameters(
      hair.curl,
    );

    for (const guide of guides) {
      const base: number = positions.length / 3;
      const length: number = guide.length;
      const window: number = AutoMovieHumanHairCardUv.window(guide.seed);

      // A mirrored card's width axis is its canonical card's reflected axis
      // reversed, so its wave and lean turn the other way.
      const hand: number = guide.mirror ? -1 : 1;
      const phase: number = AutoMovieHumanHairCardCurl.phase(
        unit(guide.points[0]!),
        guide.seed,
      );
      const shade: number = AutoMovieHumanHairCardShade.shade(guide.seed);
      const tilt: number = AutoMovieHumanHairCardShade.tilt(guide.seed, hand);

      // Physical lengths of the image's root and tip bands, so ends look
      // alike on every length.
      const [rootSpan, tipSpan, tipStart] = AutoMovieHumanHairCardUv.ends(
        guide.feather,
        length,
      );

      // The guide's points, with every segment reaching into the tip band cut
      // into pieces of at most TIP_STEP mm, so the rounded end is drawn.
      const points: Array<[number, number, number]> = [guide.points[0]!];
      const outwards: Array<[number, number, number]> = [guide.normals[0]!];
      for (let i: number = 1, arc: number = 0; i < guide.points.length; ++i) {
        const a: [number, number, number] = guide.points[i - 1]!;
        const b: [number, number, number] = guide.points[i]!;
        arc += distance(a, b);
        const pieces: number =
          arc > tipStart
            ? Math.max(1, Math.ceil(distance(a, b) / TIP_STEP))
            : 1;
        for (let k: number = 1; k <= pieces; ++k) {
          const t: number = k / pieces;
          points.push(lerp(a, b, t));
          outwards.push(
            unit(lerp(guide.normals[i - 1]!, guide.normals[i]!, t)),
          );
        }
      }
      const n: number = points.length;
      let s: number = 0;

      for (let i: number = 0; i < n; ++i) {
        const p: [number, number, number] = points[i]!;
        const outward: [number, number, number] = outwards[i]!;
        if (i > 0) s += distance(p, points[i - 1]!);

        // Heading by central differences; the width axis is heading x
        // outward, tangent to the hair mass.
        const a: [number, number, number] = points[Math.max(0, i - 1)]!;
        const b: [number, number, number] = points[Math.min(n - 1, i + 1)]!;
        const heading: [number, number, number] = [
          b[0] - a[0],
          b[1] - a[1],
          b[2] - a[2],
        ];
        const side: [number, number, number] = unit(cross(heading, outward));
        const t: number = s / length;
        const v: number = AutoMovieHumanHairCardUv.v(
          s,
          rootSpan,
          tipSpan,
          tipStart,
        );
        const half: number = AutoMovieHumanHairCard.half(hair.style, guide, s);
        const wave: number = AutoMovieHumanHairCardCurl.offset(
          hand,
          amplitude,
          wavelength,
          s,
          phase,
        );

        // Roots darker than the outer length, as the hair above shades them.
        const tone: number = AutoMovieHumanHairCardShade.tone(shade, t);

        for (const sign of [-1, 1]) {
          const offset: number = wave + sign * half;
          const lean: number = AutoMovieHumanHairCardShade.lean(tilt, sign);
          const normal: [number, number, number] = unit([
            outward[0] + side[0] * lean,
            outward[1] + side[1] * lean,
            outward[2] + side[2] * lean,
          ]);
          for (let k: number = 0; k < 3; ++k) {
            positions.push(
              (field.centre[k]! + p[k]! + side[k]! * offset) / 1000,
            );
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
}

/** Card width at the root, millimetres, per style (conventions). */
const WIDTH: Record<AutoMovieHumanHairStyle, number> = {
  [AutoMovieHumanHairStyle.Crop]: 7,
  [AutoMovieHumanHairStyle.Short]: 9,
  [AutoMovieHumanHairStyle.Bob]: 12,
};

/** Longest card segment in the tip band, millimetres. */
const TIP_STEP: number = 2;

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
 * Linear interpolation.
 *
 * @param a Start
 * @param b End
 * @param t Share of the way to `b`
 * @returns `a + t (b - a)`
 */
function lerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + t * (b[0] - a[0]),
    a[1] + t * (b[1] - a[1]),
    a[2] + t * (b[2] - a[2]),
  ];
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
 * Unit vector, dividing by the length (the zero vector stays zero): a
 * degenerate segment keeps a zero width axis instead of an invented one.
 *
 * @param a Nonzero vector
 * @returns `a / |a|`
 */
function unit(a: [number, number, number]): [number, number, number] {
  const l: number = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
