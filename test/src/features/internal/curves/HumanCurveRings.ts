import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanAnatomy } from "../HumanAnatomy";
import { HumanOnce } from "../HumanOnce";
import { HumanPeople } from "../HumanPeople";

type V3 = HumanAnatomy.V3;

/**
 * Profiles of a person's composed lofting chains: each chain, as the body law
 * delivers it, evaluated at every station a fixed step apart, layers and
 * mid-sections alike, by the chain's own public evaluator
 * (`AutoMovieHumanLoftChain.ring`). Each station gives the section's taut-tape
 * girth and its centroid, in the input's millimetres, so a rule reads a
 * person's girth profile along a chain against that person's own tapes.
 *
 * Nothing here reads a skin or a construction constant: the chains are the
 * construction's delivered output, measured as an anthropometrist would
 * measure a section of it.
 */
export namespace HumanCurveRings {
  /** One chain's sections at even stations. */
  export interface IProfile {
    /** Chain name. */
    chain: string;

    /** Station of each section along the chain, input mm; for a limb, the station runs up its bone. */
    stations: number[];

    /** Taut-tape girth of each section: the perimeter of its convex hull in its own plane, input mm. */
    girth: number[];

    /** Mean of each section's points at even phases, world input mm: the section's centre as a track along the chain. */
    centre: V3[];
  }

  /** Station step, mm: half a centimetre resolves a 10 mm wobble with five samples per wavelength. */
  export const STEP: number = 2;

  /**
   * Phases per section. A polygon of 192 sides under-reads a circle's
   * perimeter by `pi^2 / (6 * 192^2)`, 4.5e-5 of the girth (0.03 mm at the
   * thigh), far below the 4 mm girth error the rules read against.
   */
  export const PHASES: readonly number[] = Array.from({ length: 192 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 192);

  /**
   * A person's chain profile, sampled once per process and shared by every
   * rule that reads it.
   *
   * @throws {Error} When the person's body carries no chain of that name.
   */
  export function profile(person: string, chain: string): IProfile {
    return profiles.read(`${person}|${chain}`, (): IProfile => {
      const p: HumanPeople.IPerson = HumanPeople.person(person);
      return of(p.body, chain, scale(p));
    });
  }

  /** Input millimetres per calibration millimetre: the stature input over the body's own stature. */
  export function scale(p: HumanPeople.IPerson): number {
    return p.params.body.controls.height.value! / p.body.stature;
  }

  /**
   * A chain's profile on any body, uncached, for a made defect on a copy.
   *
   * @param body The body whose chain is read.
   * @param chain Chain name.
   * @param k Input millimetres per calibration millimetre.
   * @throws {Error} When the body carries no chain of that name.
   */
  export function of(body: IAutoMovieHumanBodyCalibration, chain: string, k: number): IProfile {
    const c: IAutoMovieHumanLoftChain | undefined = body.chains.find((x: IAutoMovieHumanLoftChain): boolean => x.name === chain);
    if (c === undefined) throw new Error(`the body has no chain named ${chain}`);
    const first: number = c.layers[0]!.y;
    const last: number = c.layers[c.layers.length - 1]!.y;
    const out: IProfile = { chain, stations: [], girth: [], centre: [] };

    // Even stations in input millimetres, the last one exactly at the chain's end.
    const step: number = STEP / k;
    const count: number = Math.max(1, Math.round((last - first) / step));
    for (let i: number = 0; i <= count; i++) {
      const s: number = first + ((last - first) * i) / count;
      const ring: V3[] = AutoMovieHumanLoftChain.ring(c, s, PHASES) as V3[];
      out.stations.push(s * k);
      out.girth.push(taut(ring) * k);
      out.centre.push(A.scale(mean(ring), k));
    }
    return out;
  }

  /** The girth of a ring at one station, input mm, for a made defect read at a known layer. */
  export function girthAt(body: IAutoMovieHumanBodyCalibration, chain: string, station: number, k: number): number {
    const c: IAutoMovieHumanLoftChain = body.chains.find((x: IAutoMovieHumanLoftChain): boolean => x.name === chain)!;
    return taut(AutoMovieHumanLoftChain.ring(c, station, PHASES) as V3[]) * k;
  }

  /**
   * Taut-tape girth of a planar ring: the perimeter of the convex hull of its
   * points in the ring's own plane, whose normal is Newell's (the vector area
   * of the polygon), exact for a planar ring and the least-squares plane's
   * normal direction for a nearly planar one.
   */
  export function taut(ring: V3[]): number {
    const n: V3 = [0, 0, 0];
    for (let i: number = 0; i < ring.length; i++) {
      const a: V3 = ring[i]!;
      const b: V3 = ring[(i + 1) % ring.length]!;
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const [u, w]: [V3, V3] = A.basis(A.unit(n));
    return A.hull(ring.map((p: V3): [number, number] => [A.dot(p, u), A.dot(p, w)]));
  }

  /** Mean of a ring's points at even phases. */
  function mean(ring: V3[]): V3 {
    const c: V3 = [0, 0, 0];
    for (const p of ring) for (let k: number = 0; k < 3; k++) c[k]! += p[k]! / ring.length;
    return c;
  }
}

const A: typeof HumanAnatomy = HumanAnatomy;

/** Every person's chain profiles, sampled once per process. */
const profiles: HumanOnce<HumanCurveRings.IProfile> = new HumanOnce();
