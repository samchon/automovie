import { AutoMovieHumanFaceTone } from "./AutoMovieHumanFaceTone";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import type { AutoMovieHumanSkinTone } from "./AutoMovieHumanSkinTone";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * Body landmarks for the skin's tone, read on the chains' own surfaces (their
 * axes, sample rings and ends) rather than on the skin's vertices: a reader of
 * the skin (level 7), so its name carries the skin chart's mark
 * (`docs/techniques/construction-levels.md`). The face's tone still reads its
 * pieces (`AutoMovieHumanFaceTone`).
 */
export namespace AutoMovieHumanSkinChartSites {
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
   * Locate every landmark from the chains, the face's from its pieces and the eyes.
   *
   * @param input Tone inputs
   * @returns Landmarks
   */
  export function generate(input: AutoMovieHumanSkinTone.IInput): IOutput {
    // The face's tone still reads its pieces (`AutoMovieHumanFaceTone`); every
    // other landmark is read on the chains' own surfaces.
    const pieces: Map<string, AutoMovieHumanSkinChart.IOutput[]> = new Map();
    for (const piece of input.pieces) {
      const chain: string = piece.name.slice(0, piece.name.lastIndexOf("/"));
      const list: AutoMovieHumanSkinChart.IOutput[] | undefined = pieces.get(chain);
      if (list === undefined) pieces.set(chain, [piece]);
      else list.push(piece);
    }
    const chains: Map<string, IAutoMovieHumanLoftChain[]> = new Map(
      input.chains.map((c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain[]] => [c.name, [c]]),
    );

    const hands: Map<"left" | "right", IHand> = new Map();
    const elbows: Map<"left" | "right", IElbow> = new Map();
    const soles: Map<"left" | "right", number> = new Map();
    const toes: Array<[Vec3, number]> = [];
    for (const side of ["left", "right"] as const) {
      const of: (prefix: string) => IAutoMovieHumanLoftChain[] = (
        prefix: string,
      ): IAutoMovieHumanLoftChain[] =>
        [...chains.entries()]
          .filter(
            ([name]: [string, IAutoMovieHumanLoftChain[]]): boolean =>
              name.startsWith(prefix),
          )
          .flatMap(
            ([, list]: [
              string,
              IAutoMovieHumanLoftChain[],
            ]): IAutoMovieHumanLoftChain[] => list,
          );
      const palm: IAutoMovieHumanLoftChain[] = of(`hand.${side}.`);
      const thumb: IAutoMovieHumanLoftChain[] = of(`thumb.${side}`);
      const fingers: IAutoMovieHumanLoftChain[] = of(`finger.${side}.`);
      const arm: IAutoMovieHumanLoftChain[] =
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
      const foot: IAutoMovieHumanLoftChain[] =
        chains.get(`foot.${side}`) ?? [];
      if (foot.length !== 0) {
        let lo: number = Infinity;
        let hi: number = -Infinity;
        for (const chain of foot)
          for (const p of samples(chain)) {
            lo = Math.min(lo, p[1]);
            hi = Math.max(hi, p[1]);
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

    // Each ear: the centroid of its `ear.*.<side>` chains' surfaces and the
    // largest distance of their points from it.
    const ears: Array<[Vec3, number]> = [];
    for (const side of ["left", "right"] as const) {
      const ear: IAutoMovieHumanLoftChain[] = [...chains.entries()]
        .filter(
          ([name]: [string, IAutoMovieHumanLoftChain[]]): boolean =>
            name.startsWith("ear.") && name.endsWith(`.${side}`),
        )
        .flatMap(
          ([, list]: [
            string,
            IAutoMovieHumanLoftChain[],
          ]): IAutoMovieHumanLoftChain[] => list,
        );
      if (ear.length === 0) continue;
      const centre: Vec3 = mean(ear);
      let radius: number = 1;
      for (const chain of ear)
        for (const p of samples(chain))
          radius = Math.max(radius, V.norm(V.sub(p, centre)));
      ears.push([centre, radius]);
    }

    return {
      face: AutoMovieHumanFaceTone.create(input, pieces),
      ears,
      hands,
      elbows,
      soles,
      toes,
      knee: 0.285 * input.stature,
      kneeSpread: 0.025 * input.stature,
    };
  }

  /** Stations between a chain's samples, mm. */
  const STEP: number = 4;

  /** Phases of a chain's sample ring. */
  const AROUND: number = 32;

  /**
   * A chain's surface sampled every STEP millimetres of station at AROUND
   * phases, from its first layer to its last.
   *
   * @param chain The chain, mm
   * @returns The sample points
   */
  function samples(chain: IAutoMovieHumanLoftChain): Vec3[] {
    const ys: number[] = chain.layers.map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y);
    const from: number = Math.min(...ys);
    const to: number = Math.max(...ys);
    const count: number = Math.max(1, Math.ceil((to - from) / STEP));
    const phases: number[] = Array.from({ length: AROUND }, (_: unknown, j: number): number => (2 * Math.PI * j) / AROUND);
    const out: Vec3[] = [];
    for (let k: number = 0; k <= count; k++) out.push(...(AutoMovieHumanLoftChain.ring(chain, from + ((to - from) * k) / count, phases) as Vec3[]));
    return out;
  }

  /**
   * Centroid of several chains' surfaces.
   *
   * @param chains Chains in mm
   * @returns Centroid
   */
  function mean(chains: readonly IAutoMovieHumanLoftChain[]): Vec3 {
    const c: Vec3 = [0, 0, 0];
    let n: number = 0;
    for (const chain of chains)
      for (const p of samples(chain)) {
        c[0] += p[0];
        c[1] += p[1];
        c[2] += p[2];
        n += 1;
      }
    return V.scale(c, 1 / Math.max(1, n));
  }

  /**
   * A chain's axis points at its first and last layers.
   *
   * @param chains One chain
   * @returns First-layer and last-layer axis points
   */
  function extremes(chains: readonly IAutoMovieHumanLoftChain[]): [Vec3, Vec3] {
    const chain: IAutoMovieHumanLoftChain = chains[0]!;
    return [
      AutoMovieHumanLoftChain.axis(chain, chain.layers[0]!.y) as Vec3,
      AutoMovieHumanLoftChain.axis(chain, chain.layers[chain.layers.length - 1]!.y) as Vec3,
    ];
  }

  /**
   * Mean distance of a chain's surface from its axis, over its sample rings.
   *
   * @param chains One chain
   * @returns Mean radius in mm
   */
  function meanRadius(chains: readonly IAutoMovieHumanLoftChain[]): number {
    const chain: IAutoMovieHumanLoftChain = chains[0]!;
    const points: Vec3[] = samples(chain);
    let sum: number = 0;
    for (let k: number = 0; k < points.length; k += AROUND) {
      const ring: Vec3[] = points.slice(k, k + AROUND);
      const c: Vec3 = V.scale(ring.reduce((a: Vec3, p: Vec3): Vec3 => V.add(a, p), [0, 0, 0]), 1 / ring.length);
      for (const p of ring) sum += V.norm(V.sub(p, c));
    }
    return points.length === 0 ? 1 : sum / points.length;
  }
}
