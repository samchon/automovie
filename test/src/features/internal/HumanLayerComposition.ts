import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import type { HumanLayerFinding } from "./HumanLayerFinding";
import { HumanLayerEmitted } from "./HumanLayerEmitted";
import { HumanLayerIndex } from "./HumanLayerIndex";
import { HumanLayerPlane } from "./HumanLayerPlane";
import { HumanLayerPolygon } from "./HumanLayerPolygon";
import { HumanLayerSite } from "./HumanLayerSite";

type V3 = HumanAnatomy.V3;
type V2 = [number, number];

const A: typeof HumanAnatomy = HumanAnatomy;
const G: typeof HumanLayerPolygon = HumanLayerPolygon;

/** Furthest a ring point is searched for emitted skin, mm. */
const REACH: number = 20;

/** The ring point agrees with the emitted skin. */
const AGREE: number = 0;

/** The ring point stands off the emitted skin. */
const MOVED: number = 1;

/** The nearest skin is an open border: an aperture cut the section there. */
const APERTURE: number = 2;

/** The nearest skin belongs to another chain: a root or web replaced the base there. */
const REPLACED: number = 3;

/** What each ring point of one layer found. */
interface IRead {
  /** The layer, its ring thinned to the phases read. */
  site: HumanLayerSite.ISite;

  /** Per ring point, one of the classes above. */
  kind: Int8Array;

  /** Per ring point, the signed distance to the nearest emitted triangle, mm. */
  dist: Float64Array;

  /** Per ring point, the nearest emitted triangle, or -1. */
  triangle: Int32Array;
}

/**
 * Each declared layer section against the skin the surface actually emitted at
 * its plane, with no private data.
 *
 * Each ring point of a layer (the chain function's section, reliefs and lifts
 * included) must lie on the emitted skin within the sampling error, both
 * pieces of an interior layer must reach it, the emitted section must match
 * the declared one in taut girth and area, and the loft must keep across the
 * layer the continuity its layers declare.
 */
export namespace HumanLayerComposition {
  /**
   * Distance a declared layer section may stand from the emitted skin, mm:
   * ISO 20685-1:2018 Table 4's smallest allowance (head and hand dimensions,
   * `HumanAnatomyShared.HEAD`), below which no anthropometric reading resolves
   * a difference, and above the emitted mesh's own chord error.
   */
  export const COMPOSITION: number = HumanAnatomyShared.HEAD;

  /**
   * Greatest spacing round a section of the phases the composition reads, mm:
   * a departure wider than this is read at least once. Phases are a divisor
   * of the ring's `HumanLayerSite.PHASES`, at most every 15th (24 per layer).
   */
  export const COMPOSITION_SPACING: number = 3;

  /** The emitted skin the composition reads. */
  export interface ISkin {
    /** Flat vertex positions, mm. */
    P: Float64Array;

    /** Flat triangle vertex indices. */
    I: Uint32Array;

    /** Chain each triangle belongs to, an index into `chains`. */
    tri: Int32Array;

    /** Chain names the surface gave its triangle groups. */
    chains: string[];
  }

  /** One person's composition reading. */
  export interface IComposition {
    /** Person. */
    person: string;

    /** Every finding. */
    findings: HumanLayerFinding.IFinding[];

    /** Layers read and what each ring point found, information only. */
    counts: { layers: number; points: number; agree: number; aperture: number; replaced: number; moved: number; gap: number; poles: number };

    /** Median and largest ring-to-skin distance over the agreeing points, mm. */
    sampling: { median: number; max: number };

    /** Largest tangent break and curvature jump read, degrees and 1/mm. */
    continuity: { break: number; jump: number };

    /** Signed ring-to-skin distances of every point read, mm, in site order. */
    distances: Float64Array;
  }

  /**
   * Compare every layer's declared section with the skin emitted at its plane.
   *
   * @param props.person Person, for the findings.
   * @param props.sites Layers to read.
   * @param props.skin The emitted skin, with each triangle's chain.
   * @param props.surface The loft as a function of chain, station and phase, for the continuity reading; absent skips it.
   */
  export function composition(props: {
    person: string;
    sites: HumanLayerSite.ISite[];
    skin: ISkin;
    surface?: (chain: string, s: number) => (t: number) => V3;
  }): IComposition {
    const index: HumanLayerIndex = new HumanLayerIndex(props.skin.P, props.skin.I, 10);
    const findings: HumanLayerFinding.IFinding[] = [];
    const counts: IComposition["counts"] = { layers: 0, points: 0, agree: 0, aperture: 0, replaced: 0, moved: 0, gap: 0, poles: 0 };
    const agreeing: number[] = [];
    const distances: number[] = [];
    let worstBreak: number = 0;
    let worstJump: number = 0;

    for (const full of props.sites) {
      const site: HumanLayerSite.ISite = thin(full);

      if (site.reach < HumanLayerSite.POLE) {
        counts.poles++;
        continue;
      }

      counts.layers++;

      const read: IRead = classify(site, index, props.skin, counts, agreeing, distances);

      findings.push(...offSkin(props.person, read));
      findings.push(...seams(props.person, read, index, props.skin, counts));

      if (!site.lifted && read.kind.every((k: number): boolean => k === AGREE))
        findings.push(...HumanLayerEmitted.section(props.person, site, index, COMPOSITION));

      if (props.surface !== undefined) {
        const across: HumanLayerEmitted.IAcross = HumanLayerEmitted.across(props.person, site, props.surface, COMPOSITION);

        findings.push(...across.findings);
        worstBreak = Math.max(worstBreak, across.worstBreak);
        worstJump = Math.max(worstJump, across.worstJump);
      }
    }

    agreeing.sort((a: number, b: number): number => a - b);

    return {
      person: props.person,
      findings,
      counts,
      sampling: { median: agreeing[Math.floor(agreeing.length / 2)] ?? NaN, max: agreeing[agreeing.length - 1] ?? NaN },
      continuity: { break: (worstBreak * 180) / Math.PI, jump: worstJump },
      distances: Float64Array.from(distances),
    };
  }
}

/**
 * The layer with its ring thinned to phases at most COMPOSITION_SPACING apart
 * round the declared section: a long section needs more points than a short
 * one to leave no departure unread.
 */
function thin(full: HumanLayerSite.ISite): HumanLayerSite.ISite {
  const step: number = G.perimeter(full.ring.map((p: V3): V2 => HumanLayerPlane.local(full.plane, p))) / HumanLayerSite.PHASES;
  const stride: number = [15, 12, 10, 9, 8, 6, 5, 4, 3, 2, 1].find((k: number): boolean => k * step <= HumanLayerComposition.COMPOSITION_SPACING) ?? 1;

  return { ...full, ring: full.ring.filter((_: V3, i: number): boolean => i % stride === 0) };
}

/**
 * Class every ring point of a layer: on the skin, off it, over an aperture, or
 * over another chain's skin.
 */
function classify(
  site: HumanLayerSite.ISite,
  index: HumanLayerIndex,
  skin: HumanLayerComposition.ISkin,
  counts: HumanLayerComposition.IComposition["counts"],
  agreeing: number[],
  distances: number[],
): IRead {
  const n: number = site.ring.length;
  const own: number = skin.chains.indexOf(site.chain);
  const interior: boolean = site.layer > 0 && site.layer < site.layers - 1;
  const read: IRead = { site, kind: new Int8Array(n), dist: new Float64Array(n), triangle: new Int32Array(n) };

  site.ring.forEach((p: V3, i: number): void => {
    const hit: HumanLayerIndex.INearest | null = index.nearest(p, 2 * HumanLayerComposition.COMPOSITION) ?? index.nearest(p, REACH);
    const d: number = hit === null ? Infinity : hit.signed;

    counts.points++;
    read.triangle[i] = hit === null ? -1 : hit.triangle;
    read.dist[i] = d;
    distances.push(d);

    if (hit !== null && Math.abs(d) <= HumanLayerComposition.COMPOSITION) {
      counts.agree++;
      agreeing.push(Math.abs(d));
      read.kind[i] = AGREE;
    } else if (hit !== null && hit.border) {
      counts.aperture++;
      read.kind[i] = APERTURE;
    } else if (hit !== null && interior && skin.tri[hit.triangle] !== own) {
      counts.replaced++;
      read.kind[i] = REPLACED;
    } else {
      counts.moved++;
      read.kind[i] = MOVED;
    }
  });

  return read;
}

/** Runs of ring points that stand off the emitted skin. */
function offSkin(person: string, read: IRead): HumanLayerFinding.IFinding[] {
  const { site, kind, dist }: IRead = read;
  const count: number = site.ring.length;
  const flags: Int8Array = Int8Array.from(kind, (k: number, i: number): number => (k === MOVED ? (dist[i]! > 0 ? 1 : -1) : 0));
  const out: HumanLayerFinding.IFinding[] = [];
  const size: (i: number) => number = (i: number): number => (Number.isFinite(dist[i]!) ? Math.abs(dist[i]!) : 1e9);

  for (const run of G.runs(flags)) {
    let worst: number = run.from;
    let sum: number = 0;
    let members: number = 0;

    for (let i: number = run.from; ; i = (i + 1) % count) {
      if (size(i) > size(worst)) worst = i;
      sum += Number.isFinite(dist[i]!) ? dist[i]! : 0;
      members++;

      if (i === run.to) break;
    }

    const at: V3 = site.ring[worst]!;
    const end: boolean = site.layer === 0 || site.layer === site.layers - 1;

    out.push({
      person,
      chain: site.chain,
      layer: site.layer,
      reading: Number.isFinite(dist[worst]!) ? (run.sign > 0 ? "section outside the skin" : "section inside the skin") : "section far from any skin",
      phase: [(360 * run.from) / count, (360 * run.to) / count],
      bearing: G.bearing(A.reject(A.sub(at, site.centre), site.plane.normal)),
      value: Number.isFinite(dist[worst]!) ? dist[worst]! : REACH,
      limit: HumanLayerComposition.COMPOSITION,
      mean: sum / members,
      unit: "mm",
      at,
      detail: `${members} of ${count} phases${end ? "; a chain end, the seam with its neighbour" : ""}`,
    });
  }

  return out;
}

/**
 * Both pieces either side of an interior layer reach its section: the
 * nearest triangle of the chain's own skin below the section, and above it,
 * each lie within the tolerance of every ring point on the skin.
 */
function seams(
  person: string,
  read: IRead,
  index: HumanLayerIndex,
  skin: HumanLayerComposition.ISkin,
  counts: HumanLayerComposition.IComposition["counts"],
): HumanLayerFinding.IFinding[] {
  const { site, kind, dist, triangle }: IRead = read;
  const own: number = skin.chains.indexOf(site.chain);
  const out: HumanLayerFinding.IFinding[] = [];
  const centres: Float64Array = index.centroids();

  if (site.layer === 0 || site.layer === site.layers - 1 || own < 0) return out;

  const count: number = site.ring.length;

  for (const side of [-1, 1]) {
    const gap: Int8Array = new Int8Array(count);
    const gd: Float64Array = new Float64Array(count);

    site.ring.forEach((p: V3, i: number): void => {
      if (kind[i] !== AGREE) return;

      // A lifted section leaves its plane, so the side of a triangle is read from the ring point itself.
      const accept: (t: number) => boolean = (t: number): boolean =>
        skin.tri[t] === own &&
        side *
          ((centres[3 * t]! - p[0]) * site.plane.normal[0] + (centres[3 * t + 1]! - p[1]) * site.plane.normal[1] + (centres[3 * t + 2]! - p[2]) * site.plane.normal[2]) >
          0;

      // The nearest triangle overall, when it is this side's, is this side's nearest.
      const t0: number = triangle[i]!;
      const hit: { distance: number } | null =
        t0 >= 0 && accept(t0)
          ? { distance: Math.abs(dist[i]!) }
          : (index.nearest(p, 2 * HumanLayerComposition.COMPOSITION, accept) ?? index.nearest(p, REACH, accept));

      gd[i] = hit === null ? Infinity : hit.distance;

      if (hit === null || hit.distance > HumanLayerComposition.COMPOSITION) gap[i] = 1;
    });

    for (const run of G.runs(gap)) {
      let worst: number = run.from;
      let members: number = 0;

      for (let i: number = run.from; ; i = (i + 1) % count) {
        if (gd[i]! > gd[worst]!) worst = i;
        members++;

        if (i === run.to) break;
      }

      const at: V3 = site.ring[worst]!;
      const value: number = Number.isFinite(gd[worst]!) ? gd[worst]! : REACH;

      counts.gap += members;
      out.push({
        person,
        chain: site.chain,
        layer: site.layer,
        reading: `seam gap to ${site.chain}/${site.layer + (side < 0 ? -1 : 0)} (${side < 0 ? "below" : "above"})`,
        phase: [(360 * run.from) / count, (360 * run.to) / count],
        bearing: G.bearing(A.reject(A.sub(at, site.centre), site.plane.normal)),
        value,
        limit: HumanLayerComposition.COMPOSITION,
        mean: value,
        unit: "mm",
        at,
        detail: `${members} phases where the skin meets the section but this piece does not`,
      });
    }
  }

  return out;
}
