import { AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFootToeRoots } from "../foot/AutoMovieHumanFootToeRoots";
import { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Box = [number, number, number, number];

/**
 * The forefoot's flat sole across the metatarsal heads: sourced departures
 * of the leg loft's two plantar quarters' shoulders from the common conic
 * shoulder.
 *
 * Derivation: in stance every head's plantar pad stands on the floor and the
 * lateral border runs on the floor to head V, so the sole is flat across the
 * heads; one rounded conic quarter would lift its outer corners off the
 * floor and leave the outer toes' roots outside the forefoot. Each toe's root
 * circle (`AutoMovieHumanFootToeRoots`: its head centre on the plantar soft
 * tissue, its root half-breadth) grown by the fold radius must lie inside the
 * forefoot's section at its head's station, so its fold never reaches the
 * toe's open root. For each plantar quarter the least shoulder whose section
 * holds every grown circle's plantar half falling in it is found by
 * bisection; the quarter holds the largest of these across the heads (the
 * flat sole), rising from zero at IM to the most proximal head. The ball
 * tape is solved with these departures included, and each departure is what
 * the held shoulder needs above the common one at its station.
 */
export namespace AutoMovieHumanLegSole {
  /** One departure knot, unsigned shoulder share, at a neutral walk station. */
  export interface IKnot {
    /** Site name. */
    site: string;

    /** Neutral walk station, mm. */
    walk: number;

    /** Departure of the quarter's shoulder from the common one. */
    value: number;
  }

  /** What the sole reads. */
  export interface IInput {
    /** Neutral landmarks with the toe roots. */
    landmarks: AutoMovieHumanLegLandmarks.IOutput;

    /** +1 when medial is +Z (left leg), -1 otherwise. */
    medial: 1 | -1;

    /** The section box (lateral, medial, anterior, posterior half extents) at a walk, from the solved outlines. */
    box: (walk: number) => Box;

    /** The common shoulder at a walk, before the ball's re-solve. */
    shoulder: (walk: number) => number;

    /** The ball site: its walk, box and tape. */
    ball: { walk: number; box: Box; girth: number };
  }

  /** The sole's shoulders. */
  export interface IOutput {
    /** Each quarter's held absolute shoulder in the loft chart's order (zero where no toe needs one). */
    needs: IAutoMovieViewPart.IQuarters<number>;

    /** The ball's common shoulder with the departures included. */
    ball: number;

    /** The heads' walk stations, where the departures are read. */
    heads: { site: string; walk: number }[];

    /** Constructor notes. */
    diagnostics: string[];
  }

  /** The widest shoulder a quarter is given, short of the box's corner. */
  export const LIMIT: number = 0.9;

  /** A box (lateral, medial, anterior, posterior) as the loft chart's extents (+u, +v, -u, -v): +v is posterior (plantar on the foot) on the left leg, anterior on the right. */
  export function extents(box: Box, medial: 1 | -1): IAutoMovieViewPart.IQuarters<number> {
    return medial > 0 ? [box[0], box[3], box[1], box[2]] : [box[0], box[2], box[1], box[3]];
  }

  /** The two plantar quarters in the loft chart's order. */
  export function plantar(medial: 1 | -1): [number, number] {
    return medial > 0 ? [0, 1] : [2, 3];
  }

  /** Solve the held plantar shoulders and the ball's common shoulder. */
  export function create(input: IInput): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const { landmarks, medial: m }: IInput = input;
    const diagnostics: string[] = [];
    const quarters: [number, number] = plantar(m);
    const pole: Vec3 = AutoMovieHumanLegLandmarks.get(landmarks, "web").point;
    const t: Vec3 = S.unit(pole);
    const n: Vec3 = S.unit([-t[0] * t[1], 1 - t[1] * t[1], -t[2] * t[1]]);
    const l0: Vec3 = [0, 0, -m];
    const lateral: Vec3 = S.unit(sub(l0, scale(t, S.dot(l0, t))));
    const floor: number = landmarks.foot.floor;
    const walkOf: (x: number) => number = (x: number): number => landmarks.course.im + S.dot([x, (t[1] / t[0]) * x, 0], t);
    const needs: IAutoMovieViewPart.IQuarters<number> = [0, 0, 0, 0];
    const heads: { site: string; walk: number }[] = [];
    landmarks.roots.forEach((root: AutoMovieHumanFootToeRoots.IRoot, k: number): void => {
      const walk: number = walkOf(root.x);
      heads.push({ site: `head ${k + 1}`, walk });
      const centre: Vec3 = [root.x, floor + AutoMovieHumanFootToeRoots.height(root), root.z];
      const offset: Vec3 = sub(centre, scale(t, S.dot(centre, t)));
      const radius: number = root.breadth / 2 + AutoMovieHumanFootToeRoots.FOLD;
      const e: IAutoMovieViewPart.IQuarters<number> = extents(input.box(walk), m);
      const common: number = input.shoulder(walk);
      // The grown circle's plantar half in the loft chart: u lateral, v plantar on the left and dorsal on the right.
      const points: { q: number; phi: number; r: number }[] = Array.from({ length: 33 }, (_: unknown, j: number): { q: number; phi: number; r: number } => {
        const a: number = Math.PI + (Math.PI * j) / 32;
        const u: number = S.dot(offset, lateral) + radius * Math.cos(a);
        const h: number = S.dot(offset, n) + radius * Math.sin(a);
        const v: number = m > 0 ? -h : h;
        const phi: number = (Math.atan2(v, u) + 2 * Math.PI) % (2 * Math.PI);
        return { q: Math.floor(phi / (Math.PI / 2)) % 4, phi, r: Math.hypot(u, v) };
      });
      for (const q of quarters) {
        const mine: { phi: number; r: number }[] = points.filter((p: { q: number }): boolean => p.q === q);
        if (mine.length === 0) continue;
        const holds: (rho: number) => boolean = (rho: number): boolean => {
          const shoulders: IAutoMovieViewPart.IQuarters<number> = [common, common, common, common];
          shoulders[q] = rho;
          const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: e }, shoulders);
          return mine.every((p: { phi: number; r: number }): boolean => AutoMovieViewSection.radius(section, p.phi)[0] >= p.r);
        };
        if (holds(common)) continue;
        if (!holds(LIMIT)) {
          diagnostics.push(`sole: toe ${k + 1}'s root does not fit quarter ${q} at its head even at shoulder ${LIMIT}`);
          needs[q] = Math.max(needs[q], LIMIT);
          continue;
        }
        let lo: number = common;
        let hi: number = LIMIT;
        for (let it: number = 0; it < 40; ++it) {
          const mid: number = (lo + hi) / 2;
          if (holds(mid)) hi = mid;
          else lo = mid;
        }
        needs[q] = Math.max(needs[q], hi);
      }
    });

    // The ball tape with the held quarters: their departure from the common shoulder shrinks as the common one grows, so the solve repeats to its fixed point.
    let ball: number = input.shoulder(input.ball.walk);
    const free: number = m > 0 ? 2 : 0;
    for (let it: number = 0; it < 12; ++it) {
      const departures: IAutoMovieViewPart.IQuarters<number> = needs.map((x: number): number => Math.max(0, x - ball)) as IAutoMovieViewPart.IQuarters<number>;
      const solved: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve("leg ball sole", { extents: extents(input.ball.box, m) }, input.ball.girth, departures);
      if (solved.section === null || solved.diagnostics.length !== 0) {
        diagnostics.push(`sole: the ball tape ${input.ball.girth.toFixed(2)} does not close with the held plantar quarters: ${solved.diagnostics.map((x: { detail: string }): string => x.detail).join("; ")}`);
        break;
      }
      const next: number = solved.section.shoulders[free] - departures[free];
      const settled: boolean = Math.abs(next - ball) < 1e-10;
      ball = next;
      if (settled) break;
    }
    return { needs, ball, heads, diagnostics };
  }

  /**
   * The departure knots of every quarter (the loft chart's order): zero at the
   * port and at IM, and at each head, the ball and the pole what the held
   * shoulder needs above the common one there.
   */
  export function departures(needs: IAutoMovieViewPart.IQuarters<number>, shoulder: (walk: number) => number, sites: { site: string; walk: number }[], start: number, im: number, end: number): IAutoMovieViewPart.IQuarters<IKnot[]> {
    const list: { site: string; walk: number }[] = [];
    for (const k of [...sites].sort((a: { walk: number }, b: { walk: number }): number => a.walk - b.walk))
      if (k.walk > im + 1e-6 && k.walk < end - 1e-6 && (list.length === 0 || k.walk - list[list.length - 1]!.walk > 1e-6)) list.push(k);
    const all: { site: string; walk: number }[] = [{ site: "port", walk: start }, { site: "IM", walk: im }, ...list, { site: "web", walk: end }];
    return needs.map((need: number): IKnot[] => all.map((k: { site: string; walk: number }): IKnot => ({ site: k.site, walk: k.walk, value: k.walk <= im + 1e-6 || need <= 0 ? 0 : Math.max(0, need - shoulder(k.walk)) }))) as IAutoMovieViewPart.IQuarters<IKnot[]>;
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
