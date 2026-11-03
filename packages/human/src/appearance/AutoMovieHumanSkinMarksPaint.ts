import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanSkinMarks } from "./AutoMovieHumanSkinMarks";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/** The skin marks painted into the image: the mark kinds and the triangles they land on, each mark multiplied in, the image's cache key and the sRGB encoding. */
export namespace AutoMovieHumanSkinMarksPaint {
  /** Point or direction in mm. */
  export type Vec3 = AutoMovieHumanSkinVector.Vec3;

  /** One requested mark kind. */
  export interface IKind {
    /** Kind name. */
    name: "freckle" | "mole" | "acne";

    /** Hash stream of the kind. */
    stream: number;

    /** Density per square centimetre, or the whole-body count for moles. */
    amount: number;

    /** Largest diameter in mm. */
    diameter: number;

    /** Peak coverage in `[0, 1]`. */
    strength: number;

    /** Colour multiplier at full coverage, linear RGB. */
    ratio: [number, number, number];

    /** Regional weight of a triangle in `[0, 1]`. */
    weight(t: ITriangle): number;
  }

  /** One skin triangle as the sampler sees it. */
  export interface ITriangle {
    /** Chain name. */
    chain: string;

    /** Rest centroid in mm. */
    centre: Vec3;

    /** Unit face normal. */
    normal: Vec3;

    /** Area in square millimetres. */
    area: number;

    /** Layout coordinates of the three corners in mm. */
    uv: [[number, number], [number, number], [number, number]];

    /** Map from layout offsets to surface offsets in the triangle's plane, row-major 2 by 2, both in mm. */
    inverse: [number, number, number, number];

    /** Layout area over surface area. */
    ratio: number;

    /** Largest stretch of the surface-to-layout map. */
    reach: number;

    /** Closeness to the band across the nose and cheeks, `[0, 1]`. */
    malar: number;

    /** Whether the triangle lies on lip, palm, sole or eyelid skin. */
    glabrous: boolean;

    /** Stature of the body in mm. */
    stature: number;
  }


  /**
   * Multiply one mark into the image. The mark is a circle on the surface, so
   * each pixel's layout offset from the centre is mapped back to the
   * triangle's plane before its distance is measured; a chart that stretches
   * one way draws the mark as the matching ellipse.
   *
   * @param image Linear RGB multipliers
   * @param N Image edge in pixels
   * @param texel Layout millimetres per pixel
   * @param cu Centre in layout mm, horizontal
   * @param cv Centre in layout mm, vertical
   * @param radius Radius on the surface in mm
   * @param t Triangle holding the centre
   * @param kind Mark kind
   * @param salt Per-mark random value in `[0, 1)`
   */
  export function splat(
    image: Float64Array,
    N: number,
    texel: number,
    cu: number,
    cv: number,
    radius: number,
    t: ITriangle,
    kind: IKind,
    salt: number,
  ): void {
    const strength: number =
      kind.strength * (kind.name === "freckle" ? 0.5 + 0.5 * salt : 1);
    const reach: number = Math.ceil((radius * 1.6 * t.reach) / texel + 1);
    const cx: number = cu / texel;
    const cy: number = cv / texel;
    const phase: number = salt * 2 * Math.PI;
    const soft: number = 0.6 * texel;
    const M: [number, number, number, number] = t.inverse;
    for (
      let py: number = Math.floor(cy - reach);
      py <= Math.ceil(cy + reach);
      ++py
    ) {
      if (py < 0 || py >= N) continue;
      for (
        let px: number = Math.floor(cx - reach);
        px <= Math.ceil(cx + reach);
        ++px
      ) {
        if (px < 0 || px >= N) continue;
        const du: number = (px + 0.5) * texel - cu;
        const dv: number = (py + 0.5) * texel - cv;
        const sx: number = M[0] * du + M[1] * dv;
        const sy: number = M[2] * du + M[3] * dv;
        const d: number = Math.hypot(sx, sy);
        let cover: number;
        if (kind.name === "acne")
          cover = Math.exp(-((d / Math.max(soft, radius * 0.7)) ** 2));
        else {
          // Freckles take a lobed outline; moles stay round and darken toward
          // the centre.
          const angle: number = Math.atan2(sy, sx);
          const r: number =
            kind.name === "freckle"
              ? radius *
                (1 +
                  0.18 * Math.sin(3 * angle + phase) +
                  0.1 * Math.sin(5 * angle + 2 * phase))
              : radius;
          cover =
            1 - AutoMovieHumanAppearanceNoise.smoothstep(r - soft, r + soft, d);
          if (kind.name === "mole")
            cover *= 1 + 0.15 * (1 - Math.min(1, d / Math.max(soft, r)));
        }
        const a: number = Math.min(1, strength * cover);
        if (a <= 0) continue;
        const at: number = (py * N + px) * 3;
        for (let c: number = 0; c < 3; ++c)
          image[at + c] = image[at + c]! * (1 + (kind.ratio[c]! - 1) * a);
      }
    }
  }

  /**
   * Hexadecimal digest of everything that shapes the image.
   *
   * @param input Mark inputs
   * @param kinds Requested kinds
   * @returns Eight hexadecimal digits
   */
  export function digest(
    input: AutoMovieHumanSkinMarks.IInput,
    kinds: readonly IKind[],
  ): string {
    const keys: number[] = [input.skin?.seed ?? 0];
    for (const kind of kinds)
      keys.push(
        kind.stream,
        Math.round(kind.amount * 1000),
        Math.round(kind.diameter * 1000),
        Math.round(kind.strength * 1000),
        ...kind.ratio.map((c: number): number => Math.round(c * 1e6)),
      );
    for (const piece of input.pieces)
      keys.push(piece.positions.length, piece.indices.length);
    return Math.floor(AutoMovieHumanAppearanceNoise.hash(...keys) * 4294967296)
      .toString(16)
      .padStart(8, "0");
  }

  /**
   * sRGB byte of a linear value (IEC 61966-2-1 transfer).
   *
   * @param linear Linear value in `[0, 1]`
   * @returns Encoded byte
   */
  export function srgb(linear: number): number {
    const c: number = Math.min(1, Math.max(0, linear));
    const e: number =
      c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(255 * e);
  }
}
