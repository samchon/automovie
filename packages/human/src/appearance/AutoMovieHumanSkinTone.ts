import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanFaceTone } from "./AutoMovieHumanFaceTone";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinLandmarks } from "./AutoMovieHumanSkinLandmarks";
import { AutoMovieHumanSkinPigment } from "./AutoMovieHumanSkinPigment";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { AutoMovieHumanVermilion } from "./AutoMovieHumanVermilion";
import type { IAutoMovieHumanSkinToneFactors } from "./IAutoMovieHumanSkinToneFactors";

/**
 * Per-vertex skin albedo and relief strength from the person's chromophores
 * and the generated body's own geometry.
 *
 * Every vertex gets multipliers of the person's melanin and haemoglobin,
 * which `AutoMovieHumanSkinPigment` turns into linear albedo; the mesh
 * stores it as vertex colours over the material's white base colour, so
 * the tint follows the joined surface without separate materials or atlas
 * charts. Regions are functions of the body itself, never of a person
 * table:
 *
 * - Lips: the shared external Recovery/Hermite courses bound the vermilion
 *   in the frontal plane, with a finite depth window and a 1.2 mm colour
 *   transition. Source oral zipper/interior arcs are excluded. The same
 *   sampled physical boundary is returned to construction.
 * - Cheeks, nose tip and periorbital skin: fields about points placed from
 *   the eye centres and pronasale in IPD units; the periorbital ring is
 *   measured in the frontal plane, so it does not depend on globe depth or
 *   radius.
 * - Nostril pockets: for each calibrated opening with a closed pocket,
 *   skin within the outline (fully up to its radius, fading out by 1.4 times
 *   it) and behind its margin along the facing direction is darkened by up
 *   to 85 percent with depth (full at half the pocket depth) and takes no
 *   nose flush.
 * - Ears: a field about each ear's centroid, reaching 1.2 times its
 *   largest vertex distance, on the ear chains and the head around them.
 * - Hands: the palmar direction is derived from the hand, thumb and finger
 *   chain centroids; palmar skin of hand and finger chains, fading in
 *   proximally from the wrist end of the arm chain, and dorsal skin over the
 *   finger roots (knuckles) and fingertips.
 * - Feet: downward-facing skin of foot, forefoot and toe chains within the
 *   lowest tenth of the foot chain's height (soles), and toe tips.
 * - Knees and elbows: anterior leg skin about 0.285 statures above the
 *   floor, and posterior arm skin 0.55 of the way from the arm chain's
 *   proximal to its distal end.
 * - Mottling: solid value noise in rest millimetres, seeded by the skin
 *   seed, modulates melanin by at most 4.5 percent (40 and 22 mm
 *   wavelengths) and haemoglobin by at most 14 percent (30 and 16 mm), an
 *   even complexion; the octaves are the same on every piece, so pieces
 *   meeting at a ring agree there.
 *
 * Every field that reaches a band or chain boundary is a function of
 * position and normal alone, never of which piece holds the vertex, so the
 * colour is continuous across those boundaries; chain names gate only
 * fields that stay well inside their chains (face, elbows, knees, soles)
 * and select which landmarks exist.
 *
 * The regional multipliers (lips 0.9 melanin and 6 haemoglobin, cheeks up
 * to 3 and the nose tip up to 2 haemoglobin, ears up to 1.6, hands 1.2,
 * palms and soles 0.35 melanin, and so on) and every placement proportion
 * are conventions chosen for appearance, not measurements; they apply to
 * any body whose chains carry the same names. The lip boundary is still calibrated
 * to one specimen; this does not establish a multi-specimen shape law.
 *
 * Relief weights scale the material's normal map per vertex: 0.25 on the
 * vermilion (whose fine vertical lines the isotropic tile cannot draw),
 * 0.55 on palms and soles, 0.6 on eyelids, 1.25 to 1.4 over the cheeks and
 * nose, and 1 elsewhere; also conventions.
 */
export namespace AutoMovieHumanSkinTone {
  /** One eye globe in mm. */
  export interface IEye {
    /** Anatomical side: left is +Z. */
    side: "left" | "right";

    /** Globe centre in mm. */
    centre: [number, number, number];

    /** Globe radius in mm. */
    radius: number;
  }

  /** Inputs of the tone fields. */
  export interface IInput {
    /** Exterior vermilion courses in the same calibration frame. */
    vermilion: AutoMovieHumanVermilion.IBoundary;
    /** Charted skin pieces in mm. */
    pieces: readonly AutoMovieHumanSkinChart.IOutput[];

    /** Eye globes in mm. */
    eyes: readonly IEye[];

    /** Skin openings of the calibration in mm; those with a pocket are cavities. */
    apertures: readonly IAutoMovieHumanLoftAperture[];

    /** Stature of the body the pieces describe, in mm. */
    stature: number;

    /** The person's chromophores. */
    pigmentation: AutoMovieHumanSkinPigment.IChromophores;

    /** Unsigned seed of the mottling field. */
    seed: number;
  }

  /** Per-piece vertex attributes, aligned with the input pieces. */
  export interface IOutput {
    /** Flat linear RGB albedo per vertex. */
    colors: number[][];

    /** Normal-map slope factor per vertex. */
    reliefWeights: number[][];

    /** Shade multiplier per vertex, below 1 inside a closed pocket. */
    shades: number[][];
  }

  /**
   * Evaluate albedo and relief weight at every vertex.
   *
   * @param input Pieces, eyes, stature, chromophores and seed
   * @returns Colours and relief weights per piece
   */
  export function generate(input: IInput): IOutput {
    const table: AutoMovieHumanSkinPigment.ITable =
      AutoMovieHumanSkinPigment.table(input.pigmentation);
    const landmarks: AutoMovieHumanSkinLandmarks.IOutput =
      AutoMovieHumanSkinLandmarks.generate(input);
    const colors: number[][] = [];
    const reliefWeights: number[][] = [];
    const shades: number[][] = [];
    for (const piece of input.pieces) {
      const chain: string = piece.name.slice(0, piece.name.lastIndexOf("/"));
      const color: number[] = [];
      const relief: number[] = [];
      const shade: number[] = [];
      for (let i: number = 0; i < piece.positions.length / 3; ++i) {
        const p: Vec3 = V.at(piece.positions, i);
        const n: Vec3 = V.at(piece.normals, i);
        const f: IAutoMovieHumanSkinToneFactors = regional(
          landmarks,
          chain,
          p,
          n,
        );
        mottle(f, p, input.seed);
        color.push(
          ...table
            .lookup(f.melanin, f.haemoglobin)
            .map((c: number): number => c * f.shade),
        );
        relief.push(f.relief);
        shade.push(f.shade);
      }
      colors.push(color);
      reliefWeights.push(relief);
      shades.push(shade);
    }
    return { colors, reliefWeights, shades };
  }
}

/** Point or direction in mm. */
type Vec3 = AutoMovieHumanSkinVector.Vec3;

/** Vector arithmetic. */
const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

/**
 * Regional multipliers at one vertex.
 *
 * @param L Landmarks
 * @param chain Chain name of the vertex's piece
 * @param p Position in mm
 * @param n Unit normal
 * @returns Multipliers before mottling
 */
function regional(
  L: AutoMovieHumanSkinLandmarks.IOutput,
  chain: string,
  p: Vec3,
  n: Vec3,
): IAutoMovieHumanSkinToneFactors {
  const f: IAutoMovieHumanSkinToneFactors = {
    melanin: 1,
    haemoglobin: 1,
    relief: 1,
    shade: 1,
  };
  const head: boolean = chain === "head" || chain.startsWith("head.");
  if (head && L.face !== null) AutoMovieHumanFaceTone.apply(L.face, p, n, f);
  // Ear flush: a field about each ear's centroid, evaluated alike on the
  // ear chains and the head around their roots.
  if (head || chain.startsWith("ear."))
    for (const [centre, radius] of L.ears) {
      const w: number = V.smooth(1.2 - V.norm(V.sub(p, centre)) / radius);
      f.haemoglobin *= 1 + 0.6 * w;
      f.relief *= 1 - 0.2 * w;
    }

  const side: "left" | "right" = p[2] >= 0 ? "left" : "right";
  const hand: AutoMovieHumanSkinLandmarks.IHand | undefined = L.hands.get(side);
  const handChain: boolean =
    chain.startsWith("hand.") ||
    chain.startsWith("finger.") ||
    chain.startsWith("thumb.");
  if (hand !== undefined && (handChain || chain.startsWith("arm."))) {
    // Palmar skin fades in over 12 mm distal to the wrist end of the arm.
    const distal: number = V.dot(V.sub(p, hand.wrist), hand.axis);
    const facing: number = V.dot(n, hand.palmar);
    const palm: number =
      V.smooth((facing + 0.05) / 0.5) * V.smooth(distal / 12 + 0.5);
    f.melanin *= 1 - 0.65 * palm;
    f.haemoglobin *= 1 + 0.3 * palm;
    f.relief *= 1 - 0.45 * palm;

    // Hands are slightly redder, fading in over 20 mm about the wrist.
    f.haemoglobin *= 1 + 0.2 * V.smooth(distal / 20 + 0.5);
    // Knuckle and fingertip fields on the arm chain too: the hand chain is
    // short enough for the knuckles to reach the wrist ring.
    const dorsal: number = V.smooth((-facing - 0.1) / 0.5);
    for (const [point, radius] of hand.knuckles) {
      const w: number =
        dorsal * Math.exp(-((V.norm(V.sub(p, point)) / radius) ** 2));
      f.melanin *= 1 + 0.25 * w;
      f.haemoglobin *= 1 + 0.6 * w;
    }
    for (const [point, radius] of hand.tips) {
      const w: number = Math.exp(-((V.norm(V.sub(p, point)) / radius) ** 2));
      f.haemoglobin *= 1 + 0.5 * w;
    }
  }

  const elbow: AutoMovieHumanSkinLandmarks.IElbow | undefined =
    L.elbows.get(side);
  if (elbow !== undefined && chain.startsWith("arm.")) {
    const d: Vec3 = V.sub(p, elbow.point);
    const along: number = V.dot(d, elbow.axis);

    // Posterior: against +X once the arm direction is removed.
    const back: Vec3 = V.normalize(
      V.sub([-1, 0, 0], V.scale(elbow.axis, -elbow.axis[0])),
    );
    const w: number =
      Math.exp(-((along / elbow.spread) ** 2)) *
      V.smooth((V.dot(n, back) - 0.2) / 0.5);
    f.melanin *= 1 + 0.25 * w;
    f.haemoglobin *= 1 + 0.4 * w;
  }

  if (chain.startsWith("leg.")) {
    const w: number =
      Math.exp(-(((p[1] - L.knee) / L.kneeSpread) ** 2)) *
      V.smooth((n[0] - 0.3) / 0.5);
    f.melanin *= 1 + 0.2 * w;
    f.haemoglobin *= 1 + 0.5 * w;
  }

  const footChain: boolean =
    chain.startsWith("foot.") ||
    chain.startsWith("forefoot.") ||
    chain.startsWith("toe.");
  const sole: number | undefined = L.soles.get(side);
  if (footChain && sole !== undefined) {
    const w: number =
      V.smooth((-n[1] - 0.35) / 0.4) * V.smooth((sole - p[1]) / 6 + 0.5);
    f.melanin *= 1 - 0.65 * w;
    f.haemoglobin *= 1 + 0.4 * w;
    f.relief *= 1 - 0.45 * w;
    for (const [point, radius] of L.toes) {
      const t: number = Math.exp(-((V.norm(V.sub(p, point)) / radius) ** 2));
      f.haemoglobin *= 1 + 0.6 * t;
    }
  }
  return f;
}

/**
 * Mottle melanin and haemoglobin with solid noise. The octaves are the same
 * everywhere, coarse enough for the coarsest limb mesh, so two pieces meeting
 * at a ring evaluate one field and agree there.
 *
 * @param f Multipliers to update
 * @param p Position in mm
 * @param seed Mottling seed
 */
function mottle(
  f: IAutoMovieHumanSkinToneFactors,
  p: Vec3,
  seed: number,
): void {
  const noise: typeof AutoMovieHumanAppearanceNoise =
    AutoMovieHumanAppearanceNoise;
  const s: number = seed % 1000003;

  const octave: (stream: number, wavelength: number) => number = (
    stream: number,
    wavelength: number,
  ): number =>
    noise.value3(
      s * 7 + stream,
      p[0] / wavelength,
      p[1] / wavelength,
      p[2] / wavelength,
    ) - 0.5;
  f.melanin *= 1 + 0.06 * octave(1, 40) + 0.03 * octave(2, 22);
  f.haemoglobin *= 1 + 0.2 * octave(3, 30) + 0.08 * octave(4, 16);
}
