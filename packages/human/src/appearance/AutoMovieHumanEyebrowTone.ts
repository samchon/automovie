import { encodeAutoMoviePng } from "@automovie/engine";
import type { IAutoMovieImage } from "@automovie/interface";

import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import type { IAutoMovieHumanBrowAppearance } from "../structures/appearance/IAutoMovieHumanBrowAppearance";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanEyebrowBody } from "./AutoMovieHumanEyebrowBody";
import { AutoMovieHumanEyebrowHead } from "./AutoMovieHumanEyebrowHead";
import { AutoMovieHumanEyebrowPlacement } from "./AutoMovieHumanEyebrowPlacement";
import { AutoMovieHumanEyebrowTail } from "./AutoMovieHumanEyebrowTail";
import { AutoMovieHumanHairShade } from "./AutoMovieHumanHairShade";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";

/**
 * Eyebrow of one eye as colour in the skin's texture: the brow region laid
 * out in the face plane from the eye's canthi (`AutoMovieHumanEyebrowPlacement`)
 * is painted, as hair colour with a coverage, into an image over the head
 * skin's chart layout `(u, v)`, which the skin material lays over its own
 * colour (`replace` by coverage). No hair geometry is made; strand-level brows
 * come later.
 *
 * Coverage at a skin point: its place `(a, h)` in the face plane (along the
 * temple direction and up from the medial canthus) gives the position along
 * the brow `t` and across it `v` (the placement's middle line and width,
 * scaled by `thickness`); the coverage is `density` times the strand brow's
 * density laws: the head's fade-in and rise (`AutoMovieHumanEyebrowHead`), the
 * tail's thinning (`AutoMovieHumanEyebrowTail`) and the noisy border
 * (`AutoMovieHumanEyebrowBody`), with a fade over the last tenth. Only skin in
 * front of the eye's globe centre and facing forward is painted, so the back
 * of the head, which shares the face-plane place, stays bare.
 *
 * Determinism: one seed for both eyes, so the sides mirror.
 */
export namespace AutoMovieHumanEyebrowTone {
  /** Default coverage at the brow's full body, `[0, 1]`. */
  export const DENSITY: number = 0.85;

  /** Default factor on the placement's width. */
  export const THICKNESS: number = 1;

  /** Image texel, mm of the chart layout; coarser only past {@link MAXIMUM} texels a side. */
  export const TEXEL: number = 0.2;

  /** Largest image side, texels. */
  export const MAXIMUM: number = 1024;

  /** Seed of the border noise, one for both eyes. */
  export const SEED: number = 0x1a6;

  /** One brow's coverage field. */
  export interface IBrow {
    /** The eye's side. */
    side: "left" | "right";

    /** Linear RGB of the brow hair. */
    color: [number, number, number];

    /** Every input that shapes the image, for its id. */
    keys: number[];

    /**
     * Coverage at a skin point.
     *
     * @param p Point, calibration mm
     * @param n Unit normal
     * @returns Coverage in `[0, 1]`
     */
    cover(p: AutoMovieHumanEyelid.Point, n: AutoMovieHumanEyelid.Point): number;

    /**
     * Whether a triangle may reach the brow: its face-plane box meets the
     * brow's and a corner lies in front of the globe centre.
     *
     * @param corners The triangle's corners, calibration mm
     * @returns False only where no point of the triangle can be covered
     */
    near(corners: readonly AutoMovieHumanEyelid.Point[]): boolean;
  }

  /** A brow's image and where it lies in the chart layout. */
  export interface IImage {
    /** RGBA: the brow colour everywhere, coverage in alpha. */
    image: IAutoMovieImage;

    /** Its lower corner in the chart layout, mm. */
    origin: [number, number];

    /** Its side in the chart layout, mm (square texels). */
    span: [number, number];
  }

  /**
   * The coverage field of one brow.
   *
   * @param lid The eye's lid margin, calibration mm
   * @param brow The brow's appearance
   * @param side The eye's side
   * @returns The field
   */
  export function create(
    lid: AutoMovieHumanEyelid.ILid,
    brow: IAutoMovieHumanBrowAppearance,
    side: "left" | "right",
  ): IBrow {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const P: typeof AutoMovieHumanEyebrowPlacement =
      AutoMovieHumanEyebrowPlacement;
    const frame: AutoMovieHumanEyebrowPlacement.IFrame = P.frame(lid);
    const controls: AutoMovieHumanEyebrowPlacement.IControl[] =
      P.controls(frame);
    const g: AutoMovieHumanEyelid.IGlobe = frame.globe;
    const density: number = brow.density ?? DENSITY;
    const thickness: number = brow.thickness ?? THICKNESS;
    const first: number = controls[0]!.a;
    const last: number = controls[controls.length - 1]!.a;

    // The brow's face-plane box, its middle line and half width sampled.
    let low: number = Infinity;
    let high: number = -Infinity;
    for (let k: number = 0; k <= 64; k++) {
      const b: AutoMovieHumanEyebrowPlacement.IProfile = P.profile(
        controls,
        k / 64,
      );
      low = Math.min(low, b.mid - (thickness * b.width) / 2);
      high = Math.max(high, b.mid + (thickness * b.width) / 2);
    }
    const place = (
      p: Readonly<AutoMovieHumanEyelid.Point>,
    ): [number, number, number] => {
      const r: AutoMovieHumanEyelid.Point = E.sub(p, frame.medial);
      return [
        E.dot(r, frame.temple),
        E.dot(r, g.up),
        E.dot(E.sub(p, g.centre), g.forward),
      ];
    };
    return {
      side,
      color: AutoMovieHumanHairShade.linear(brow.color),
      keys: [
        side === "left" ? 1 : 2,
        ...AutoMovieHumanHairShade.linear(brow.color).map((c: number): number =>
          Math.round(c * 1e6),
        ),
        Math.round(density * 1e6),
        Math.round(thickness * 1e6),
      ],
      cover: (
        p: AutoMovieHumanEyelid.Point,
        n: AutoMovieHumanEyelid.Point,
      ): number => {
        const [a, h, ahead] = place(p);
        if (!(ahead > 0)) return 0;
        const t: number = (a - first) / (last - first);
        if (!(t >= -0.05 && t <= 1)) return 0;
        const b: AutoMovieHumanEyebrowPlacement.IProfile = P.profile(
          controls,
          t,
        );
        const v: number = (h - b.mid) / ((thickness * b.width) / 2);
        if (!(Math.abs(v) <= 1.05)) return 0;
        const facing: number = E.smoothstep(0, 0.3, E.dot(n, g.forward));
        return (
          density *
          facing *
          AutoMovieHumanEyebrowBody.border(
            AutoMovieHumanEyebrowBody.edge(SEED, t, v),
            v,
          ) *
          AutoMovieHumanEyebrowHead.fadeIn(t) *
          AutoMovieHumanEyebrowHead.rise(t) *
          AutoMovieHumanEyebrowTail.thin(t) *
          (1 - E.smoothstep(0.9, 1, t))
        );
      },
      near: (corners: readonly AutoMovieHumanEyelid.Point[]): boolean => {
        const at: [number, number, number][] = corners.map(place);
        if (!at.some((x: [number, number, number]): boolean => x[2] > 0))
          return false;
        const margin: number = 1;
        if (
          at.every(
            (x: [number, number, number]): boolean =>
              x[0] < first - 0.05 * (last - first) - margin,
          )
        )
          return false;
        if (
          at.every(
            (x: [number, number, number]): boolean => x[0] > last + margin,
          )
        )
          return false;
        if (
          at.every(
            (x: [number, number, number]): boolean => x[1] < low - margin,
          )
        )
          return false;
        if (
          at.every(
            (x: [number, number, number]): boolean => x[1] > high + margin,
          )
        )
          return false;
        return true;
      },
    };
  }

  /**
   * Paint one brow over the head skin's chart layout.
   *
   * @param brow The brow's field
   * @param pieces The charted skin pieces, calibration mm, `uvs` in layout mm
   * @returns The image and its place, or null when no head skin reaches the brow
   */
  export function paint(
    brow: IBrow,
    pieces: readonly AutoMovieHumanSkinChart.IOutput[],
  ): IImage | null {
    // The head triangles that may reach the brow, and their layout box.
    interface ITriangle {
      p: AutoMovieHumanEyelid.Point[];
      n: AutoMovieHumanEyelid.Point[];
      uv: [number, number][];
    }
    const kept: ITriangle[] = [];
    let box: [number, number, number, number] = [
      Infinity,
      Infinity,
      -Infinity,
      -Infinity,
    ];
    const at = (
      values: readonly number[],
      i: number,
    ): AutoMovieHumanEyelid.Point => [
      values[3 * i]!,
      values[3 * i + 1]!,
      values[3 * i + 2]!,
    ];
    for (const piece of pieces) {
      const chain: string = piece.name.slice(0, piece.name.lastIndexOf("/"));
      if (chain !== "head" && !chain.startsWith("head.")) continue;
      for (let k: number = 0; k < piece.indices.length; k += 3) {
        const ids: number[] = [
          piece.indices[k]!,
          piece.indices[k + 1]!,
          piece.indices[k + 2]!,
        ];
        const p: AutoMovieHumanEyelid.Point[] = ids.map(
          (i: number): AutoMovieHumanEyelid.Point => at(piece.positions, i),
        );
        if (!brow.near(p)) continue;
        const uv: [number, number][] = ids.map(
          (i: number): [number, number] => [
            piece.uvs[2 * i]!,
            piece.uvs[2 * i + 1]!,
          ],
        );
        if (
          !uv.every(
            (c: [number, number]): boolean =>
              Number.isFinite(c[0]) && Number.isFinite(c[1]),
          )
        )
          continue;
        kept.push({
          p,
          n: ids.map(
            (i: number): AutoMovieHumanEyelid.Point => at(piece.normals, i),
          ),
          uv,
        });
        for (const c of uv)
          box = [
            Math.min(box[0], c[0]),
            Math.min(box[1], c[1]),
            Math.max(box[2], c[0]),
            Math.max(box[3], c[1]),
          ];
      }
    }
    if (kept.length === 0) return null;

    // The image over the box, a texel's margin each side.
    const texel: number = Math.max(
      TEXEL,
      (box[2] - box[0]) / (MAXIMUM - 2),
      (box[3] - box[1]) / (MAXIMUM - 2),
    );
    const origin: [number, number] = [box[0] - texel, box[1] - texel];
    const W: number = Math.ceil((box[2] - box[0]) / texel) + 2;
    const H: number = Math.ceil((box[3] - box[1]) / texel) + 2;
    const coverage: Float32Array = new Float32Array(W * H);
    for (const t of kept) {
      const [u0, v0] = t.uv[0]!;
      const [u1, v1] = t.uv[1]!;
      const [u2, v2] = t.uv[2]!;
      const det: number = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
      if (!(Math.abs(det) > 1e-12)) continue;
      const x0: number = Math.max(
        0,
        Math.floor((Math.min(u0, u1, u2) - origin[0]) / texel),
      );
      const x1: number = Math.min(
        W - 1,
        Math.ceil((Math.max(u0, u1, u2) - origin[0]) / texel),
      );
      const y0: number = Math.max(
        0,
        Math.floor((Math.min(v0, v1, v2) - origin[1]) / texel),
      );
      const y1: number = Math.min(
        H - 1,
        Math.ceil((Math.max(v0, v1, v2) - origin[1]) / texel),
      );
      for (let y: number = y0; y <= y1; y++)
        for (let x: number = x0; x <= x1; x++) {
          const u: number = origin[0] + (x + 0.5) * texel;
          const v: number = origin[1] + (y + 0.5) * texel;
          const b1: number =
            ((u - u0) * (v2 - v0) - (u2 - u0) * (v - v0)) / det;
          const b2: number =
            ((u1 - u0) * (v - v0) - (u - u0) * (v1 - v0)) / det;
          const b0: number = 1 - b1 - b2;
          if (b0 < -1e-9 || b1 < -1e-9 || b2 < -1e-9) continue;
          const p: AutoMovieHumanEyelid.Point = [0, 1, 2].map(
            (c: number): number =>
              b0 * t.p[0]![c]! + b1 * t.p[1]![c]! + b2 * t.p[2]![c]!,
          ) as AutoMovieHumanEyelid.Point;
          const m: number[] = [0, 1, 2].map(
            (c: number): number =>
              b0 * t.n[0]![c]! + b1 * t.n[1]![c]! + b2 * t.n[2]![c]!,
          );
          const l: number = Math.hypot(m[0]!, m[1]!, m[2]!) || 1;
          const c: number = brow.cover(p, [m[0]! / l, m[1]! / l, m[2]! / l]);
          const i: number = y * W + x;
          if (c > coverage[i]!) coverage[i] = c;
        }
    }

    // RGBA: the brow colour everywhere, so filtering at the coverage's edge
    // keeps the colour; the coverage in alpha.
    const srgb: number[] = brow.color.map((c: number): number => {
      const x: number = Math.min(1, Math.max(0, c));
      return Math.round(
        255 *
          (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055),
      );
    });
    const pixels: Uint8Array = new Uint8Array(W * H * 4);
    for (let i: number = 0; i < W * H; i++) {
      pixels[4 * i] = srgb[0]!;
      pixels[4 * i + 1] = srgb[1]!;
      pixels[4 * i + 2] = srgb[2]!;
      pixels[4 * i + 3] = Math.round(
        255 * Math.min(1, Math.max(0, coverage[i]!)),
      );
    }
    const id: string = Math.floor(
      AutoMovieHumanAppearanceNoise.hash(
        ...brow.keys,
        W,
        H,
        Math.round(origin[0] * 1000),
        Math.round(origin[1] * 1000),
        kept.length,
      ) * 4294967296,
    )
      .toString(16)
      .padStart(8, "0");
    return {
      image: {
        id: `human.skin.brow.${brow.side}.${id}`,
        mimeType: "image/png",
        data: encodeAutoMoviePng({ width: W, height: H, channels: 4, pixels }),
      },
      origin,
      span: [W * texel, H * texel],
    };
  }
}
