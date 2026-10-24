import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import type { AutoMovieHumanSkinTone } from "./AutoMovieHumanSkinTone";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import { AutoMovieHumanVermilion } from "./AutoMovieHumanVermilion";
import type { IAutoMovieHumanSkinToneFactors } from "./IAutoMovieHumanSkinToneFactors";

/** Facial colour landmarks and bounded fields in the generated skin frame. */
export namespace AutoMovieHumanFaceTone {
  /** Point or direction in mm. */
  type Vec3 = AutoMovieHumanSkinVector.Vec3;

  /** Vector arithmetic. */
  const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

  /** Facial landmarks from the eyes and the midline profile. */
  export interface IOutput {
    /** Midpoint of the eye centres. */
    mid: Vec3;

    /** Interpupillary distance in mm. */
    ipd: number;

    /** Eye globes. */
    eyes: AutoMovieHumanSkinTone.IEye[];

    /** Closed pockets behind skin openings, such as the nostrils. */
    pockets: Array<{
      /** Centroid of the opening's margin. */
      centre: Vec3;

      /** Unit direction the opening faces. */
      forward: Vec3;

      /** Largest margin distance from the centroid across `forward`, mm. */
      radius: number;

      /** Pocket depth behind the margin, mm. */
      depth: number;

      /** Axial half-span of the observed rim about its centroid, mm. */
      axial: number;
    }>;

    /** Pronasale: the nose tip on the midline. */
    nose: Vec3;

    /** Exterior lip courses from the shared calibration, not the oral interior. */
    lips: AutoMovieHumanVermilion.IBoundary;
  }

  /**
   * Facial landmarks from the eye globes and the head skin's midline profile.
   *
   * @param input Tone inputs
   * @param chains Pieces by chain
   * @returns Face, or null without two eyes or head skin
   */
  export function create(
    input: AutoMovieHumanSkinTone.IInput,
    chains: Map<string, AutoMovieHumanSkinChart.IOutput[]>,
  ): IOutput | null {
    const left: AutoMovieHumanSkinTone.IEye | undefined = input.eyes.find(
      (e: AutoMovieHumanSkinTone.IEye): boolean => e.side === "left",
    );
    const right: AutoMovieHumanSkinTone.IEye | undefined = input.eyes.find(
      (e: AutoMovieHumanSkinTone.IEye): boolean => e.side === "right",
    );
    if (left === undefined || right === undefined) return null;
    const mid: Vec3 = V.scale(V.add(left.centre, right.centre), 0.5);
    const ipd: number = V.norm(V.sub(left.centre, right.centre));

    // Most anterior head skin per 0.5 mm of height, within a thin midline
    // slab, from 1.7 IPD below the eyes to just under them.
    const BIN: number = 0.5;
    const top: number = mid[1] - 0.1 * ipd;
    const bottom: number = mid[1] - 1.7 * ipd;
    const count: number = Math.ceil((top - bottom) / BIN) + 1;
    const front: number[] = new Array(count).fill(NaN);
    const slab: number = Math.max(1.2, 0.025 * ipd);
    for (const [name, list] of chains) {
      if (name !== "head" && !name.startsWith("head.")) continue;
      for (const piece of list)
        for (let i: number = 0; i < piece.positions.length; i += 3) {
          const y: number = piece.positions[i + 1]!;
          if (y < bottom || y > top) continue;
          if (Math.abs(piece.positions[i + 2]! - mid[2]) > slab) continue;

          // Only the face half: a bin holding only occipital vertices would
          // otherwise read as a deep notch in the profile.
          const x: number = piece.positions[i]!;
          if (x < mid[0] - 0.5 * ipd) continue;

          // Surfaces facing back into the head (nostril pockets, the mouth's
          // tuck) would read as notches in the profile.
          if (piece.normals[i]! < 0) continue;
          const b: number = Math.round((y - bottom) / BIN);
          if (!(front[b]! >= x)) front[b] = x;
        }
    }
    const profile: number[] = smoothed(filled(front), 3);
    if (profile.every((x: number): boolean => Number.isNaN(x))) return null;
    const height: (b: number) => number = (b: number): number =>
      bottom + b * BIN;

    // Pronasale: the most anterior point from 1.0 to 0.2 IPD below the eyes.
    let tip: number = -1;
    for (let b: number = 0; b < count; ++b) {
      const y: number = height(b);
      if (y < mid[1] - 1.0 * ipd || y > mid[1] - 0.2 * ipd) continue;
      if (tip === -1 || profile[b]! > profile[tip]!) tip = b;
    }
    if (tip === -1) return null;
    const nose: Vec3 = [profile[tip]!, height(tip), mid[2]];

    const lips: AutoMovieHumanVermilion.IBoundary = input.vermilion;
    const pockets: IOutput["pockets"] = input.apertures
      .filter((a: IAutoMovieHumanLoftAperture): boolean => (a.pocket ?? 0) > 0)
      .map((a: IAutoMovieHumanLoftAperture): IOutput["pockets"][number] => {
        const margin: Vec3[] = AutoMovieHumanLoftAperture.polyline(a).map(
          (q: readonly number[]): Vec3 => [q[0]!, q[1]!, q[2]!],
        );
        const centre: Vec3 = V.centroid(margin.flat());
        const forward: Vec3 = V.normalize([...a.forward]);
        let radius: number = 0;
        let axial: number = 0;
        for (const q of margin) {
          const d: Vec3 = V.sub(q, centre);
          axial = Math.max(axial, Math.abs(V.dot(d, forward)));
          radius = Math.max(
            radius,
            V.norm(V.sub(d, V.scale(forward, V.dot(d, forward)))),
          );
        }
        return { centre, forward, radius, axial, depth: a.pocket! };
      });
    return { mid, ipd, eyes: [left, right], nose, lips, pockets };
  }

  /**
   * Facial multipliers: lips, cheeks, nose tip and periorbital skin.
   *
   * @param F Face landmarks
   * @param p Position in mm
   * @param n Unit normal
   * @param f Multipliers to update
   */
  export function apply(
    F: IOutput,
    p: Vec3,
    n: Vec3,
    f: IAutoMovieHumanSkinToneFactors,
  ): void {
    const ipd: number = F.ipd;
    const forward: number = V.smooth((n[0] - 0.05) / 0.4);

    // The same exterior boundary is drawn by construction. The source oral
    // zipper and the old midline ellipse have no authority over this mask.
    const lipWeight: number = AutoMovieHumanVermilion.weight(F.lips, p, n);
    f.melanin *= 1 - 0.1 * lipWeight;
    f.haemoglobin *= 1 + 5 * lipWeight;
    f.relief *= 1 - 0.75 * lipWeight;

    // Cheeks: a broad flush below and outside each eye.
    for (const sign of [1, -1]) {
      const dy: number = p[1] - (F.mid[1] - 0.62 * ipd);
      const dz: number = p[2] - (F.mid[2] + sign * 0.62 * ipd);
      const w: number =
        forward *
        Math.exp(-(dy * dy + dz * dz) / (2 * (0.32 * ipd) ** 2)) *
        V.smooth((p[0] - (F.mid[0] - 0.4 * ipd)) / (0.2 * ipd));
      f.haemoglobin *= 1 + 2 * w;
      f.relief *= 1 + 0.25 * w;
    }

    // Closed pockets behind openings (nostrils): skin within the opening's
    // outline and behind its margin along the facing direction is a shadowed
    // cavity, darkened with depth instead of flushed.
    let cavity: number = 0;
    for (const pocket of F.pockets) {
      const d: Vec3 = V.sub(pocket.centre, p);
      const inside: number = V.dot(d, pocket.forward);
      const lateral: number = V.norm(V.sub(d, V.scale(pocket.forward, inside)));
      // A pocket is finite along its axis as well as across it. The old
      // half-infinite cylinder also tinted unrelated crown skin.
      const axialFade: number =
        1 - V.smooth((inside - pocket.depth - pocket.axial) / pocket.depth);
      cavity = Math.max(
        cavity,
        V.smooth(inside / (0.5 * pocket.depth)) *
          axialFade *
          V.smooth((1.4 * pocket.radius - lateral) / (0.4 * pocket.radius)),
      );
    }
    f.shade *= 1 - 0.85 * cavity;

    // Nose tip and alae, outside the pockets.
    {
      const d: number = V.norm(V.sub(p, F.nose)) / (0.2 * ipd);
      const w: number = Math.exp(-d * d) * (1 - cavity);
      f.haemoglobin *= 1 + 1.0 * w;
      f.relief *= 1 + 0.4 * w;
    }

    // Periorbital skin: a ring about each eye in the frontal plane, 0.28
    // interpupillary distances out and 0.08 wide, darker and bluer. It is
    // measured across the face only, so moving or resizing the globe in depth
    // does not move it.
    for (const eye of F.eyes) {
      const d: number = Math.hypot(p[1] - eye.centre[1], p[2] - eye.centre[2]);
      const w: number =
        forward * Math.exp(-(((d - 0.28 * ipd) / (0.08 * ipd)) ** 2));
      f.melanin *= 1 + 0.15 * w;
      f.haemoglobin *= 1 + 0.25 * w;
      f.relief *= 1 - 0.4 * w;
    }
  }

  /**
   * Linear fill of NaN gaps, holding the ends.
   *
   * @param values Sequence with gaps
   * @returns Filled copy; all NaN stays NaN
   */
  function filled(values: readonly number[]): number[] {
    const out: number[] = [...values];
    const known: number[] = [];
    out.forEach((v: number, i: number): void => {
      if (!Number.isNaN(v)) known.push(i);
    });
    if (known.length === 0) return out;
    let k: number = 0;
    for (let i: number = 0; i < out.length; ++i) {
      if (!Number.isNaN(out[i]!)) continue;
      while (k < known.length && known[k]! < i) ++k;
      if (k === 0) out[i] = values[known[0]!]!;
      else if (k === known.length) out[i] = values[known[known.length - 1]!]!;
      else {
        const a: number = known[k - 1]!;
        const b: number = known[k]!;
        out[i] = values[a]! + ((values[b]! - values[a]!) * (i - a)) / (b - a);
      }
    }
    return out;
  }

  /**
   * Moving average with a half-width, holding the ends.
   *
   * @param values Sequence
   * @param half Half-width in samples
   * @returns Smoothed copy
   */
  function smoothed(values: readonly number[], half: number): number[] {
    return values.map((_: number, i: number): number => {
      let s: number = 0;
      let n: number = 0;
      for (let k: number = -half; k <= half; ++k) {
        const j: number = Math.min(values.length - 1, Math.max(0, i + k));
        s += values[j]!;
        n += 1;
      }
      return s / n;
    });
  }
}
