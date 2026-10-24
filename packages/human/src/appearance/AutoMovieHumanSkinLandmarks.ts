import { AutoMovieHumanFaceTone } from "./AutoMovieHumanFaceTone";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import type { AutoMovieHumanSkinTone } from "./AutoMovieHumanSkinTone";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/** Body landmarks measured from the generated skin rather than specimen identifiers. */
export namespace AutoMovieHumanSkinLandmarks {
  /** Point or direction in mm. */
  type Vec3 = AutoMovieHumanSkinVector.Vec3;

  /** Vector arithmetic. */
  const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

  /** Hand frame of one side. */
  export interface IHand {
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
  export interface IElbow {
    /** Elbow point on the arm chain's axis. */
    point: Vec3;

    /** Unit arm direction, proximal to distal. */
    axis: Vec3;

    /** Spread along the arm in mm. */
    spread: number;
  }

  /** All landmarks the tone fields read. */
  export interface IOutput {
    /** Face, or null without eyes or head skin. */
    face: AutoMovieHumanFaceTone.IOutput | null;

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
  export function generate(input: AutoMovieHumanSkinTone.IInput): IOutput {
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
        const ends: [Vec3, Vec3] | null =
          arm.length === 0 ? null : extremes(arm);
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
          hand !== null &&
          V.norm(V.sub(e[0], hand)) < V.norm(V.sub(e[1], hand));
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
      face: AutoMovieHumanFaceTone.create(input, chains),
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
}
