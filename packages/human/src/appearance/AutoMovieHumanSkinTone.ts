import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinPigment } from "./AutoMovieHumanSkinPigment";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

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
 * - Lips: the midline profile of the head skin (its most anterior
 *   outward-facing point per height, so nostril pockets and tucks cannot
 *   notch it) gives pronasale, subnasale, labrale superius, stomion, labrale
 *   inferius and the mentolabial sulcus as alternating extrema below the
 *   eyes. The vermilion spans from three quarters of the way from stomion
 *   to labrale superius down to a lower border one fifth of the way from
 *   labrale inferius toward the sulcus, with a Cupid's-bow dip and an
 *   elliptic taper to a half-width of 0.39 interpupillary distances (IPD),
 *   over a 1.2 mm border transition and soft lateral and depth fades.
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
 * any body whose chains carry the same names. A face whose profile lacks
 * the expected extrema gets no lip tint rather than a guessed one.
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
    const landmarks: ILandmarks = locate(input);
    const colors: number[][] = [];
    const reliefWeights: number[][] = [];
    for (const piece of input.pieces) {
      const chain: string = piece.name.slice(0, piece.name.lastIndexOf("/"));
      const color: number[] = [];
      const relief: number[] = [];
      for (let i: number = 0; i < piece.positions.length / 3; ++i) {
        const p: Vec3 = V.at(piece.positions, i);
        const n: Vec3 = V.at(piece.normals, i);
        const f: IFactors = regional(landmarks, chain, p, n);
        mottle(f, p, input.seed);
        color.push(
          ...table
            .lookup(f.melanin, f.haemoglobin)
            .map((c: number): number => c * f.shade),
        );
        relief.push(f.relief);
      }
      colors.push(color);
      reliefWeights.push(relief);
    }
    return { colors, reliefWeights };
  }
}

/** Point or direction in mm. */
type Vec3 = AutoMovieHumanSkinVector.Vec3;

/** Vector arithmetic. */
const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

/** Multipliers at one vertex. */
interface IFactors {
  /** Melanin multiplier. */
  melanin: number;

  /** Haemoglobin multiplier. */
  haemoglobin: number;

  /** Normal-map slope factor. */
  relief: number;

  /** Final albedo multiplier, below one in cavities. */
  shade: number;
}

/** Facial landmarks from the eyes and the midline profile. */
interface IFace {
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
  }>;

  /** Pronasale: the nose tip on the midline. */
  nose: Vec3;

  /** Vermilion geometry, or null when the profile lacks its extrema. */
  lips: {
    /** Stomion height. */
    stomion: number;

    /** Upper vermilion border height on the midline. */
    upper: number;

    /** Lower vermilion border height on the midline. */
    lower: number;

    /** Anterior extent of the lips: the profile depth at stomion. */
    front: number;
  } | null;
}

/** Hand frame of one side. */
interface IHand {
  /** Unit palmar direction. */
  palmar: Vec3;

  /** Unit direction from the wrist toward the fingertips. */
  axis: Vec3;

  /** Wrist: the arm chain's distal band centroid. */
  wrist: Vec3;

  /** Dorsal knuckle points over the finger roots, with a radius each. */
  knuckles: Array<[Vec3, number]>;

  /** Fingertip points, with a radius each. */
  tips: Array<[Vec3, number]>;
}

/** Elbow of one side. */
interface IElbow {
  /** Elbow point on the arm chain's axis. */
  point: Vec3;

  /** Unit arm direction, proximal to distal. */
  axis: Vec3;

  /** Spread along the arm in mm. */
  spread: number;
}

/** All landmarks the tone fields read. */
interface ILandmarks {
  /** Face, or null without eyes or head skin. */
  face: IFace | null;

  /** Hands by side. */
  hands: Map<"left" | "right", IHand>;

  /** Elbows by side. */
  elbows: Map<"left" | "right", IElbow>;

  /** Height below which downward skin of a foot chain is sole, by side. */
  soles: Map<"left" | "right", number>;

  /** Toe tips with a radius each. */
  toes: Array<[Vec3, number]>;

  /** Ear centroids with the largest distance of their vertices, by ear. */
  ears: Array<[Vec3, number]>;

  /** Knee height in mm. */
  knee: number;

  /** Knee spread in mm. */
  kneeSpread: number;
}

/**
 * Locate every landmark from the pieces and eyes.
 *
 * @param input Tone inputs
 * @returns Landmarks
 */
function locate(input: AutoMovieHumanSkinTone.IInput): ILandmarks {
  const chains: Map<string, AutoMovieHumanSkinChart.IOutput[]> = new Map();
  for (const piece of input.pieces) {
    const chain: string = piece.name.slice(0, piece.name.lastIndexOf("/"));
    const list: AutoMovieHumanSkinChart.IOutput[] | undefined =
      chains.get(chain);
    if (list === undefined) chains.set(chain, [piece]);
    else list.push(piece);
  }

  const hands: Map<"left" | "right", IHand> = new Map();
  const elbows: Map<"left" | "right", IElbow> = new Map();
  const soles: Map<"left" | "right", number> = new Map();
  const toes: Array<[Vec3, number]> = [];
  for (const side of ["left", "right"] as const) {
    const of: (prefix: string) => AutoMovieHumanSkinChart.IOutput[] = (
      prefix: string,
    ): AutoMovieHumanSkinChart.IOutput[] =>
      [...chains.entries()]
        .filter(
          ([name]: [string, AutoMovieHumanSkinChart.IOutput[]]): boolean =>
            name.startsWith(prefix),
        )
        .flatMap(
          ([, list]: [
            string,
            AutoMovieHumanSkinChart.IOutput[],
          ]): AutoMovieHumanSkinChart.IOutput[] => list,
        );
    const palm: AutoMovieHumanSkinChart.IOutput[] = of(`hand.${side}.`);
    const thumb: AutoMovieHumanSkinChart.IOutput[] = of(`thumb.${side}`);
    const fingers: AutoMovieHumanSkinChart.IOutput[] = of(`finger.${side}.`);
    const arm: AutoMovieHumanSkinChart.IOutput[] =
      chains.get(`arm.${side}`) ?? [];
    if (palm.length !== 0 && thumb.length !== 0 && fingers.length !== 0) {
      const hand: Vec3 = mean(palm);
      const axis: Vec3 = V.normalize(V.sub(mean(fingers), hand));
      const toward: Vec3 = V.sub(mean(thumb), hand);
      const radial: Vec3 = V.normalize(
        V.sub(toward, V.scale(axis, V.dot(toward, axis))),
      );
      const palmar: Vec3 = V.scale(
        V.normalize(V.cross(radial, axis)),
        side === "left" ? 1 : -1,
      );
      const ends: [Vec3, Vec3] | null = arm.length === 0 ? null : extremes(arm);
      const wrist: Vec3 =
        ends === null
          ? hand
          : V.norm(V.sub(ends[0], hand)) < V.norm(V.sub(ends[1], hand))
            ? ends[0]
            : ends[1];
      const knuckles: Array<[Vec3, number]> = [];
      const tips: Array<[Vec3, number]> = [];
      for (const [name, list] of chains)
        if (name.startsWith(`finger.${side}.`) || name === `thumb.${side}`) {
          const e: [Vec3, Vec3] = extremes(list);
          const near: boolean =
            V.norm(V.sub(e[0], hand)) < V.norm(V.sub(e[1], hand));
          const root: Vec3 = near ? e[0] : e[1];
          const tip: Vec3 = near ? e[1] : e[0];
          const radius: number = meanRadius(list);
          tips.push([tip, 1.6 * radius]);
          if (name !== `thumb.${side}`)
            knuckles.push([
              V.sub(root, V.scale(axis, 1.2 * radius)),
              1.4 * radius,
            ]);
        }
      hands.set(side, { palmar, axis, wrist, knuckles, tips });
    }
    if (arm.length !== 0) {
      const e: [Vec3, Vec3] = extremes(arm);
      const hand: Vec3 | null = palm.length !== 0 ? mean(palm) : null;
      const distalFirst: boolean =
        hand !== null && V.norm(V.sub(e[0], hand)) < V.norm(V.sub(e[1], hand));
      const proximal: Vec3 = distalFirst ? e[1] : e[0];
      const distal: Vec3 = distalFirst ? e[0] : e[1];
      const length: number = V.norm(V.sub(distal, proximal));
      elbows.set(side, {
        point: V.add(proximal, V.scale(V.sub(distal, proximal), 0.55)),
        axis: V.normalize(V.sub(distal, proximal)),
        spread: 0.07 * length,
      });
    }
    const foot: AutoMovieHumanSkinChart.IOutput[] =
      chains.get(`foot.${side}`) ?? [];
    if (foot.length !== 0) {
      let lo: number = Infinity;
      let hi: number = -Infinity;
      for (const piece of foot)
        for (let i: number = 1; i < piece.positions.length; i += 3) {
          lo = Math.min(lo, piece.positions[i]!);
          hi = Math.max(hi, piece.positions[i]!);
        }
      soles.set(side, lo + 0.1 * (hi - lo));
      const footCentre: Vec3 = mean(foot);
      for (const [name, list] of chains)
        if (name.startsWith(`toe.${side}.`)) {
          const e: [Vec3, Vec3] = extremes(list);
          const tip: Vec3 =
            V.norm(V.sub(e[0], footCentre)) > V.norm(V.sub(e[1], footCentre))
              ? e[0]
              : e[1];
          toes.push([tip, 1.5 * meanRadius(list)]);
        }
    }
  }

  // Each ear: the centroid of its `ear.*.<side>` chains and the largest
  // distance of their vertices from it.
  const ears: Array<[Vec3, number]> = [];
  for (const side of ["left", "right"] as const) {
    const pieces: AutoMovieHumanSkinChart.IOutput[] = [...chains.entries()]
      .filter(
        ([name]: [string, AutoMovieHumanSkinChart.IOutput[]]): boolean =>
          name.startsWith("ear.") && name.endsWith(`.${side}`),
      )
      .flatMap(
        ([, list]: [
          string,
          AutoMovieHumanSkinChart.IOutput[],
        ]): AutoMovieHumanSkinChart.IOutput[] => list,
      );
    if (pieces.length === 0) continue;
    const centre: Vec3 = mean(pieces);
    let radius: number = 1;
    for (const piece of pieces)
      for (let i: number = 0; i < piece.positions.length / 3; ++i)
        radius = Math.max(
          radius,
          V.norm(V.sub(V.at(piece.positions, i), centre)),
        );
    ears.push([centre, radius]);
  }

  return {
    face: face(input, chains),
    ears,
    hands,
    elbows,
    soles,
    toes,
    knee: 0.285 * input.stature,
    kneeSpread: 0.025 * input.stature,
  };
}

/**
 * Facial landmarks from the eye globes and the head skin's midline profile.
 *
 * @param input Tone inputs
 * @param chains Pieces by chain
 * @returns Face, or null without two eyes or head skin
 */
function face(
  input: AutoMovieHumanSkinTone.IInput,
  chains: Map<string, AutoMovieHumanSkinChart.IOutput[]>,
): IFace | null {
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
  const height: (b: number) => number = (b: number): number => bottom + b * BIN;

  // Pronasale: the most anterior point from 1.0 to 0.2 IPD below the eyes.
  let tip: number = -1;
  for (let b: number = 0; b < count; ++b) {
    const y: number = height(b);
    if (y < mid[1] - 1.0 * ipd || y > mid[1] - 0.2 * ipd) continue;
    if (tip === -1 || profile[b]! > profile[tip]!) tip = b;
  }
  if (tip === -1) return null;
  const nose: Vec3 = [profile[tip]!, height(tip), mid[2]];

  // Alternating extrema below the nose tip with 0.3 mm hysteresis:
  // subnasale, labrale superius, stomion, labrale inferius, sulcus.
  const extrema: number[] = [];
  let seekMin: boolean = true;
  let candidate: number = tip;
  for (let b: number = tip - 1; b >= 0 && extrema.length < 5; --b) {
    const x: number = profile[b]!;
    if (seekMin ? x < profile[candidate]! : x > profile[candidate]!)
      candidate = b;
    else if (Math.abs(x - profile[candidate]!) >= 0.3) {
      extrema.push(candidate);
      seekMin = !seekMin;
      candidate = b;
    }
  }
  if (extrema.length === 4) extrema.push(0);
  const lips: IFace["lips"] =
    extrema.length < 5
      ? null
      : {
          stomion: height(extrema[2]!),
          // The vermilion border sits a little below the lip's most
          // anterior point: three quarters of the way up from stomion.
          upper:
            height(extrema[2]!) +
            0.75 * (height(extrema[1]!) - height(extrema[2]!)),
          lower:
            height(extrema[3]!) -
            0.2 * (height(extrema[3]!) - height(extrema[4]!)),
          front: profile[extrema[2]!]!,
        };
  const pockets: IFace["pockets"] = input.apertures
    .filter((a: IAutoMovieHumanLoftAperture): boolean => (a.pocket ?? 0) > 0)
    .map((a: IAutoMovieHumanLoftAperture): IFace["pockets"][number] => {
      const margin: Vec3[] = AutoMovieHumanLoftAperture.polyline(a).map(
        (q: readonly number[]): Vec3 => [q[0]!, q[1]!, q[2]!],
      );
      const centre: Vec3 = V.centroid(margin.flat());
      const forward: Vec3 = V.normalize([...a.forward]);
      let radius: number = 0;
      for (const q of margin) {
        const d: Vec3 = V.sub(q, centre);
        radius = Math.max(
          radius,
          V.norm(V.sub(d, V.scale(forward, V.dot(d, forward)))),
        );
      }
      return { centre, forward, radius, depth: a.pocket! };
    });
  return { mid, ipd, eyes: [left, right], nose, lips, pockets };
}

/**
 * Regional multipliers at one vertex.
 *
 * @param L Landmarks
 * @param chain Chain name of the vertex's piece
 * @param p Position in mm
 * @param n Unit normal
 * @returns Multipliers before mottling
 */
function regional(L: ILandmarks, chain: string, p: Vec3, n: Vec3): IFactors {
  const f: IFactors = { melanin: 1, haemoglobin: 1, relief: 1, shade: 1 };
  const head: boolean = chain === "head" || chain.startsWith("head.");
  if (head && L.face !== null) facial(L.face, p, n, f);
  // Ear flush: a field about each ear's centroid, evaluated alike on the
  // ear chains and the head around their roots.
  if (head || chain.startsWith("ear."))
    for (const [centre, radius] of L.ears) {
      const w: number = V.smooth(1.2 - V.norm(V.sub(p, centre)) / radius);
      f.haemoglobin *= 1 + 0.6 * w;
      f.relief *= 1 - 0.2 * w;
    }

  const side: "left" | "right" = p[2] >= 0 ? "left" : "right";
  const hand: IHand | undefined = L.hands.get(side);
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

  const elbow: IElbow | undefined = L.elbows.get(side);
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
 * Facial multipliers: lips, cheeks, nose tip and periorbital skin.
 *
 * @param F Face landmarks
 * @param p Position in mm
 * @param n Unit normal
 * @param f Multipliers to update
 */
function facial(F: IFace, p: Vec3, n: Vec3, f: IFactors): void {
  const ipd: number = F.ipd;
  const forward: number = V.smooth((n[0] - 0.05) / 0.4);

  // Lips: elliptic vermilion with a Cupid's bow, on the front of the face.
  if (F.lips !== null) {
    const half: number = 0.39 * ipd;
    const q: number = (p[2] - F.mid[2]) / half;
    if (Math.abs(q) < 1) {
      const shape: number = Math.sqrt(1 - q * q);
      const bow: number =
        1 -
        0.12 * Math.exp(-((q / 0.12) ** 2)) +
        0.06 * Math.exp(-(((Math.abs(q) - 0.3) / 0.15) ** 2));
      const upper: number =
        F.lips.stomion + (F.lips.upper - F.lips.stomion) * shape * bow;
      const lower: number =
        F.lips.stomion - (F.lips.stomion - F.lips.lower) * shape ** 0.8;
      const EDGE: number = 1.2;
      const w: number =
        V.smooth((upper - p[1]) / EDGE + 0.5) *
        V.smooth((p[1] - lower) / EDGE + 0.5) *
        V.smooth((1 - Math.abs(q)) / 0.12) *
        V.smooth((p[0] - (F.lips.front - 0.35 * ipd)) / (0.1 * ipd)) *
        V.smooth((n[0] + 0.2) / 0.3);
      f.melanin *= 1 - 0.1 * w;
      f.haemoglobin *= 1 + 5 * w;
      f.relief *= 1 - 0.75 * w;
    }
  }

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
    cavity = Math.max(
      cavity,
      V.smooth(inside / (0.5 * pocket.depth)) *
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
 * Mottle melanin and haemoglobin with solid noise. The octaves are the same
 * everywhere, coarse enough for the coarsest limb mesh, so two pieces meeting
 * at a ring evaluate one field and agree there.
 *
 * @param f Multipliers to update
 * @param p Position in mm
 * @param seed Mottling seed
 */
function mottle(f: IFactors, p: Vec3, seed: number): void {
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

/**
 * Vertex centroid of several pieces.
 *
 * @param pieces Pieces in mm
 * @returns Centroid
 */
function mean(pieces: readonly AutoMovieHumanSkinChart.IOutput[]): Vec3 {
  const c: Vec3 = [0, 0, 0];
  let n: number = 0;
  for (const piece of pieces) {
    const k: number = piece.positions.length / 3;
    const m: Vec3 = V.centroid(piece.positions);
    c[0] += m[0] * k;
    c[1] += m[1] * k;
    c[2] += m[2] * k;
    n += k;
  }
  return V.scale(c, 1 / Math.max(1, n));
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

/**
 * Mean distance of a chain's vertices from their band centroids.
 *
 * @param pieces One chain's pieces
 * @returns Mean radius in mm
 */
function meanRadius(
  pieces: readonly AutoMovieHumanSkinChart.IOutput[],
): number {
  let sum: number = 0;
  let count: number = 0;
  for (const piece of pieces) {
    const c: Vec3 = V.centroid(piece.positions);
    for (let i: number = 0; i < piece.positions.length / 3; ++i) {
      sum += V.norm(V.sub(V.at(piece.positions, i), c));
      count += 1;
    }
  }
  return count === 0 ? 1 : sum / count;
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
