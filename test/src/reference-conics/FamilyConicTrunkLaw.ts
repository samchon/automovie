import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieLoftContract, type AutoMovieLoftFrame, type AutoMovieViewAxis, type AutoMovieViewLoft, type IAutoMovieLoftRelief, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicSection as S, AutoMovieHumanF1, AutoMovieHumanF1Placement as P, AutoMovieHumanF1Placing as T } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLimbLaw as L } from "./FamilyConicLimbLaw";
import { FamilyConicDeformationAudit as A } from "./FamilyConicDeformationAudit";
import { FamilyConicWallDeformationAudit as W } from "./FamilyConicWallDeformationAudit";

/**
 * A provisional trunk-law experiment on f1 (issue #3151, step 3; the supervisor's plan, issuecomment-6892047649), requiring verification
 * before package adoption. It remains outside Human's ordinary generation API; changed cases carry the experimental skeletal chain.
 *
 * The law's coordinate is the station within each segment between landmarks on today's straight course: the hip centres' midpoint (the
 * pelvis's origin), the omphalion (the navel net's pit), the xiphoid at de Leva's women's share of suprasternale to omphalion (142.5 of
 * 347.8; provisional, the xiphoid is under the skin), suprasternale (the thorax's origin), the back neck point (ISO 8559-1 3.1.6's skin
 * proxy) and the held head's lowest station (the chin's underside on the front median). A case moves the omphalion and, where its band
 * stays inside its segment, the back neck point by their heights' ratios to stature; the xiphoid follows by its share; every other
 * landmark is held by the chain. Every knot, tip and net row is carried by the piecewise linear map between the landmarks, identity
 * outside them.
 *
 * Every millimetre field of the wall and every net height takes f1's value times a depth ratio, a quintic smoothstep through the girth
 * sites' ratios in f1's station, flat at each anchor (the limb law's profile): the hip's ratio held flat from the hip down to the trunk's
 * first knot, so the crotch split's seam and the legs follow the hip (as the limb law holds its last site's ratio past it), the hip,
 * the waist, the under-bust, the bust and the neck sites (the neck at its plane's lowest station, its front median crossing, since on level sections the plane's back half stands beside the held chin), and 1 again from the held head up. A net's
 * rows are carried through the map (`carryNet`: f1's rows times the ratio where the map is the identity over the window, else a cubic
 * quasi-interpolant of the carried field). The realized port loops come from the translated template assembly, while personSources
 * substitutes independently changed child families afterward. Their discrepancy from one common D is measured, not assumed absent.
 * The crotch's seam scales by its actual chord; the other joins retain the template's declared chart seeds.
 *
 * The experimental child transport approximates the proposed trunk deformation of space, D (`deformation`; the supervisor's re-plan,
 * issuecomment-6903044030; `personAt`): the humerus's, the breast's and the femur's chain offsets move by D at their joint centres or
 * origins, the thorax's by the station map's carry and the head's rigidly by the mean move of the ring at the held head's start, so every
 * descendant follows (`AutoMovieHumanF1.assemble` and `construction` on the chain); each child's held stretch takes D at every extreme
 * through its band's rail after projection into the unchanged section plane, and the child's own law past one root radius (`heldBy`): the limb law for the arm and the leg with every site at
 * its population relation to the trunk (`FamilyConicLimbLaw.limbAt`, `depthsFrom`), the mound for the breast (`breastMound`), whose
 * mound factor scales only its projection and is solved against the bust's level tape on the case's own trunk and breasts where the
 * bust's ratio misses it (`bustTape`). The extents' ratios along each connection's own axes (`axes`) are reported only; the
 * armpit's cutter's centres are carried as trunk stations and offsets, scaled as the wall (`axillaAt`); the head's own nets ride rigidly
 * with the head (`headFramed`), shifted by the held head's carry, so the ear's and the nose's seeds see f1's skin.
 *
 * Usage, from `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicTrunkLaw.cjs law` (the landmarks and sites, the cases'
 * basis, the law and its round trip: `law.txt`) or `... premises [--engine] [--cases=<first>,<count>] [--connections=<label>,...]
 * [--operators-only] [--chord=<m>] [--dir=<name>]` (every premise on every case, each trunk connection realized alone through the engine when `--engine`:
 * `premises[.<range>].txt`), under `packages/human/.shots/family-conic-trunk-law/`. `--operators-only` explicitly omits final skin; each subset includes a fresh same-run f1 baseline.
 */
export namespace FamilyConicTrunkLaw {
  type V3 = [number, number, number];
  type Family = H.IFamily;
  type Chain = NonNullable<AutoMovieViewLoft.IResult["chain"]>;
  type Loop = ReturnType<typeof AutoMovieHumanF1.mammary>;
  type Site = "hip" | "waist" | "under-bust" | "bust" | "neck";

  /**
   * The armpit's cutter carried by the trunk law (the revised plan's item 3): each course centre read as its station on the trunk's course
   * and its offset across it, the station carried by `map` and the offset scaled by `ratio` at the centre's f1 station, as the wall's
   * sections are; its knots and tips carried by each run's share of its course (the runs measured as straight); its sections as stored.
   * A centre the map and the ratio leave in place is f1's own number for number.
   */
  export function axillaAt(map: (s: number) => number, ratio: (s: number) => number): H.IFamily {
    const axilla: H.IFamily | undefined = AutoMovieHumanF1.CUTTERS.find((x: { family: H.IFamily }): boolean => x.family.name === "axilla")?.family;
    if (axilla === undefined) throw new Error("f1 has no axilla cutter");
    const c: ICourse = course();
    const centres: V3[] = axilla.centres.map((p: readonly number[]): V3 => {
      const s: number = c.stationOf(p);
      const [k, moved] = [ratio(s), map(s)];
      if (moved === s && k === 1) return [p[0] ?? NaN, p[1] ?? NaN, p[2] ?? NaN];
      const [f, g] = [c.axis.at(s), c.axis.at(moved)];
      const q: V3 = sub(p, f.origin as number[]);
      const [a, b] = [dot(q, f.u as number[]), dot(q, f.v as number[])];
      const [o, u, v] = [g.origin as number[], g.u as number[], g.v as number[]];
      return [0, 1, 2].map((i: number): number => (o[i] ?? NaN) + k * (a * (u[i] ?? NaN) + b * (v[i] ?? NaN))) as V3;
    });
    const lengths = (points: readonly (readonly number[])[]): number[] => points.map((_: readonly number[], n: number): number => points.slice(1, n + 1).reduce((t: number, p: readonly number[], j: number): number => t + Math.hypot(...sub(p, points[j] ?? p)), 0));
    const run: (s: number) => number = piecewise(lengths(axilla.centres), lengths(centres));
    const end = (t: H.ITip | null): H.ITip | null => (t === null ? null : { ...t, from: run(t.from), tip: run(t.tip) });
    return { ...axilla, centres, knots: axilla.knots.map(run), ...(axilla.tips === undefined ? {} : { tips: [end(axilla.tips[0]), end(axilla.tips[1])] as [H.ITip | null, H.ITip | null] }) };
  }

  /** Whether a net's heights move along a direction in the head's frame: the head's own nets, which the law carries rigidly with the head (the revised plan's item 4). */
  export function headFramed(net: IAutoMovieLoftRelief): boolean {
    return (T.DIRECTIONS[`${net.name}.axis`] ?? T.DIRECTIONS[`${net.name.replace(/\.twin$/, "")}.axis`])?.frame === "head";
  }

  let armscyeStation: number | null = null;

  /** The armscye's loop's centre station on the trunk's chart, f1's own, which the ports keep (`AutoMovieHumanF1.armscye`), mm. */
  export function armscyeLevel(): number {
    armscyeStation ??= AutoMovieHumanF1.armscye(1).centre[0] * 1000;
    return armscyeStation;
  }

  let loopsOnce: { armscye: Loop; mammary: Loop } | null = null;

  /** The +Z side's port loops of the trunk's two port children, f1's own on the trunk's chart, which the ports keep. */
  export function portLoops(): { armscye: Loop; mammary: Loop } {
    loopsOnce ??= { armscye: AutoMovieHumanF1.armscye(1), mammary: AutoMovieHumanF1.mammary(1) };
    return loopsOnce;
  }

  /**
   * A port loop carried by a case's station map (the supervisor's ruling on the height cases; construction.md Tree, ports follow the person
   * in relative coordinates): its lowest and highest stations on the trunk's chart mapped, the ellipse spanning them, its phases, sense and
   * column shares unchanged. Between those ends the loop is carried affinely, which is the map itself wherever no landmark of the map
   * falls inside the loop's station span. The identity map returns f1's loop itself.
   */
  export function carriedLoop(loop: Loop, map: (s: number) => number): Loop {
    const [c, a] = [loop.centre[0] * 1000, loop.semi[0] * 1000];
    const [low, high] = [map(c - a), map(c + a)];
    if (low === c - a && high === c + a) return loop;
    return { ...loop, centre: [(low + high) / 2000, loop.centre[1]], semi: [(high - low) / 2000, loop.semi[1]] };
  }

  /** A family's knot by its index, mm; a missing knot throws. */
  export function knotOf(family: H.IFamily, m: number): number {
    const s: number | undefined = family.knots[m];
    if (s === undefined) throw new Error(`${family.name} has no knot ${m}`);
    return s;
  }

  let relationsOnce: L.IRelations | null = null;

  /**
   * The limb sites' population relations to the trunk (`FamilyConicLimbLaw.relations`), read once by `prepare`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names what it returns and who reads it first.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Throws before `prepare` has read them rather than returning a stand-in.
   */
  export function limbRelations(): L.IRelations {
    if (relationsOnce === null) throw new Error("limbRelations: prepare has not read the population relations");
    return relationsOnce;
  }

  let apexOnce: number | null = null;

  /** The stored breast's most anterior station on its course: where its skin reaches farthest forward, every 0.25 mm at 360 phases, mm. */
  export function breastApex(): number {
    if (apexOnce !== null) return apexOnce;
    const breast: H.IFamily = AutoMovieHumanF1.BODY.breast;
    const first: number = knotOf(breast, 0);
    const tip: number = breast.tips?.[1]?.tip ?? knotOf(breast, breast.knots.length - 1);
    const chain: Chain = lofted(breast, first, tip, 0.25);
    let [best, most] = [first, -Infinity];
    for (let s: number = first; s <= tip; s += 0.25)
      for (let j: number = 0; j < 360; ++j) {
        const x: number = at(chain, s, (2 * Math.PI * j) / 360)[0];
        if (x > most) [most, best] = [x, s];
      }
    apexOnce = best;
    return best;
  }

  /**
   * The bust's level tape on a case's own trunk and breast (ISO 8559-1 5.3.4): the level of the breasts' most anterior point, the trunk's
   * ring there with both breasts' skin at that level, its taut tape; and the level's station on the trunk's course.
   */
  export function bustTape(c: ICourse, chain: Chain, breast: H.IFamily): { girth: number; station: number } {
    const skin: V3[] = breastSkin(breast);
    let apex: V3 | undefined = skin[0];
    for (const p of skin) if (apex === undefined || p[0] > apex[0]) apex = p;
    if (apex === undefined) throw new Error(`bustTape: ${breast.name}'s skin is empty`);
    const level: number = apex[1];
    const station: number = c.stationOf(apex);
    return { girth: levelGirth(ring(chain, station), skin.filter((p: V3): boolean => Math.abs(p[1] - level) <= 0.5)).girth, station };
  }

  /** A breast's projection, mm: from its root ring's centre (its course at its first knot) to its most anterior skin point. */
  export function projectionOf(breast: H.IFamily): number {
    const skin: V3[] = breastSkin(breast);
    let apex: V3 | undefined = skin[0];
    for (const p of skin) if (apex === undefined || p[0] > apex[0]) apex = p;
    const root: number[] = H.axis(breast).at(knotOf(breast, 0)).origin as number[];
    if (apex === undefined) throw new Error(`${breast.name}'s skin is empty`);
    return Math.hypot(...sub(apex, root));
  }

  /** The girth sites in station order up the trunk. */
  const SITES: readonly Site[] = ["hip", "waist", "under-bust", "bust", "neck"];

  /** The least tangent meeting a wall's sections are held to (`FamilyConicFit.ADMISSIBLE_MARGIN`). */
  const MARGIN: number = F.ADMISSIBLE_MARGIN;

  /** The cases' standard deviate, the 5th and 95th percentiles, as the limb law's. */
  const END_DEVIATE: number = 1.645;

  /** De Leva 1996's women's upper trunk over the upper and middle trunk, SUPR to XYPH over SUPR to OMPH (142.5 / (142.5 + 205.3) mm). */
  const XYPH_SHARE: number = 142.5 / 347.8;

  /** Phases round a level ring read for a tape girth. */
  const RING: number = 720;

  /** Phases round a plane square to the neck's axis, and the planes from the neck's base to the head's origin. */
  const NECK_PHASES: number = 240;
  const NECK_PLANES: number = 40;

  /** The back neck point is searched within the population's band, its mean rise above suprasternale plus and minus this many SDs. */
  const C7_BAND: number = 3;

  const round3 = (x: number): number => Math.round(x * 1000) / 1000;
  const smooth = (x: number): number => {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * t * (10 - 15 * t + 6 * t * t);
  };
  const sub = (a: readonly number[], b: readonly number[]): V3 => [(a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0), (a[2] ?? 0) - (b[2] ?? 0)];
  const dot = (a: readonly number[], b: readonly number[]): number => (a[0] ?? 0) * (b[0] ?? 0) + (a[1] ?? 0) * (b[1] ?? 0) + (a[2] ?? 0) * (b[2] ?? 0);
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a: V3): V3 => {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / n, a[1] / n, a[2] / n];
  };
  const fixed = (p: readonly number[], digits: number = 1): string => "[" + p.map((x: number): string => x.toFixed(digits)).join(", ") + "]";
  const at = (chain: Chain, s: number, psi: number): V3 => AutoMovieLoftChain.point(chain, s, psi) as V3;

  /** The perimeter of the convex hull of plane points: a taut tape round them (Andrew's monotone chain). */
  function perimeter(points: readonly [number, number][]): number {
    const p: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return 0;
    const turn = (o: [number, number], a: [number, number], b: [number, number]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (list: [number, number][]): [number, number][] => {
      const out: [number, number][] = [];
      for (const q of list) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
        out.push(q);
      }
      return out.slice(0, -1);
    };
    const hull: [number, number][] = [...half(p), ...half([...p].reverse())];
    let total: number = 0;
    hull.forEach((a: [number, number], i: number): void => {
      const b: [number, number] = hull[(i + 1) % hull.length]!;
      total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    });
    return total;
  }

  /** f1's trunk and its straight course: its axis, a point's station along it, the height a millimetre of station climbs, its ends and f1's stature (the crown's tip). */
  interface ICourse {
    trunk: Family;
    axis: AutoMovieViewAxis.IAxis;
    stationOf: (p: readonly number[]) => number;
    rise: number;
    first: number;
    top: number;
    stature: number;
  }

  function course(): ICourse {
    const trunk: Family = AutoMovieHumanF1.BODY.trunk;
    const axis: AutoMovieViewAxis.IAxis = H.axis(trunk);
    const o: number[] = axis.at(0).origin as number[];
    const t: V3 = sub(axis.at(1).origin as number[], o);
    const t2: number = dot(t, t);
    const lastKnot: number = trunk.knots[trunk.knots.length - 1]!;
    const tip: number = trunk.tips?.[1]?.tip ?? lastKnot;
    const top: number = trunk.tips?.[1]?.from ?? lastKnot;
    return { trunk, axis, stationOf: (p: readonly number[]): number => dot(sub(p, o), t) / t2, rise: t[1] / Math.sqrt(t2), first: trunk.knots[0]!, top, stature: (axis.at(tip).origin as number[])[1] ?? NaN };
  }

  /** A family lofted at stations `step` apart from `from` to `to`, its reliefs on. */
  function lofted(family: Family, from: number, to: number, step: number): Chain {
    const stations: number[] = [];
    // A step's station gives way to the end, or to a cap's start (a station of the part's own), where it stands within the loft's least
    // step of it (`splineGap`), the closest pair the loft admits; the sampling's remainder is no layer of the family.
    const least: number = AutoMovieLoftContract.splineGap([from, to]);
    const starts: number[] = (family.tips ?? []).flatMap((t: H.ITip | null): number[] => (t === null ? [] : [t.from]));
    for (let s: number = from; s < to; s += step) if (!starts.some((start: number): boolean => s !== start && Math.abs(s - start) < least)) stations.push(s);
    if (stations.length > 1 && to - stations[stations.length - 1]! < least) stations.pop();
    stations.push(to);
    const loft: AutoMovieViewLoft.IResult = H.create(family, stations);
    if (loft.chain === null) throw new Error(`${family.name} does not loft from ${from} to ${to} mm: ${JSON.stringify(loft.diagnostics).slice(0, 600)}`);
    return loft.chain;
  }

  /** The skin's ring at a station, every `RING`th of a turn. */
  function ring(chain: Chain, s: number): V3[] {
    return Array.from({ length: RING }, (_: unknown, j: number): V3 => at(chain, s, (2 * Math.PI * j) / RING));
  }

  /** A level ring's tape girth with any other part's points at its level, and how far the ring's points stand off its mean height. */
  function levelGirth(points: readonly V3[], extra: readonly V3[]): { girth: number; spread: number } {
    const level: number = points.reduce((t: number, p: V3): number => t + p[1], 0) / points.length;
    let spread: number = 0;
    for (const p of points) spread = Math.max(spread, Math.abs(p[1] - level));
    return { girth: perimeter([...points, ...extra].map((p: V3): [number, number] => [p[0], p[2]])), spread };
  }

  /**
   * The tape girth on a plane: each phase's line up the skin met where it crosses the plane from below (a scan every 2 mm from `from` to
   * `to`, then bisection), the points read in the plane, their convex hull's perimeter. Also the station where the front median line
   * (phase 0) crosses, and how many phases crossed; the girth is NaN unless every one did.
   */
  function planeGirth(chain: Chain, centre: V3, normal: V3, from: number, to: number): { girth: number; front: number; found: number } {
    const e1: V3 = [0, 0, 1];
    const e2: V3 = unit(cross(normal, e1));
    const points: [number, number][] = [];
    let front: number = NaN;
    for (let j: number = 0; j < NECK_PHASES; ++j) {
      const psi: number = (2 * Math.PI * j) / NECK_PHASES;
      const f = (s: number): number => dot(sub(at(chain, s, psi), centre), normal);
      let low: number = NaN;
      let before: number = f(from);
      for (let s: number = from; s + 2 <= to; s += 2) {
        const after: number = f(s + 2);
        if (before < 0 && after >= 0) {
          low = s;
          break;
        }
        before = after;
      }
      if (Number.isNaN(low)) continue;
      let [a, b]: [number, number] = [low, low + 2];
      for (let i: number = 0; i < 30; ++i) {
        const m: number = (a + b) / 2;
        if (f(m) < 0) a = m;
        else b = m;
      }
      const q: V3 = sub(at(chain, (a + b) / 2, psi), centre);
      points.push([dot(q, e1), dot(q, e2)]);
      if (j === 0) front = (a + b) / 2;
    }
    return { girth: points.length === NECK_PHASES ? perimeter(points) : NaN, front, found: points.length };
  }

  /** What is read on f1: the landmarks' and the sites' stations, the neck's plane, the breast's skin, the readings' evidence. */
  interface IReading {
    chain: Chain;
    midh: number;
    supr: number;
    head: number;
    omph: number;
    xyph: number;
    c7: number;
    c7Read: boolean;
    menton: number;
    sites: Record<Site, number>;
    natural: number;
    neck: { centre: V3; normal: V3 };
    bustPoint: V3;
    breast: V3[];
    lines: string[];
  }

  /**
   * The landmarks and the girth sites on f1's relieved trunk (item 1): the omphalion at the navel net's deepest front median point; the
   * held head's lowest station at the front median's steepest forward rise between suprasternale and the head's origin (the chin's
   * underside); the back neck point at the back median's most convex bend between suprasternale and the held head, read only where that
   * bend stands inside the stretch (the population's band of its rise, `C7_BAND` SDs, is reported beside it); the hip at the trunk's most
   * posterior point between its first knot and the omphalion; the waist's stand-in at the omphalion; the under-bust at the lowest point of
   * the breast's port loop; the bust at the breast's most anterior point; the natural waist (reported, not a site) at the least lateral
   * reach between the hip and the under-bust; the neck at the least tape girth on planes square to the neck's axis (from the neck base's
   * centre, between the front and back neck points, to the head's origin) whose front median crossing stands below the held head, its
   * station that crossing.
   */
  function read(c: ICourse, c7Rise: { mean: number; sd: number }): IReading {
    const lines: string[] = [];
    const chain: Chain = lofted(c.trunk, c.first, c.top, 2);
    const midh: number = c.stationOf(P.frame("pelvis").origin);
    const supr: number = c.stationOf(P.point("suprasternale"));
    const head: number = c.stationOf(P.frame("head").origin);
    const navel: IAutoMovieLoftRelief | undefined = (c.trunk.reliefs ?? []).find((r: IAutoMovieLoftRelief): boolean => r.name === "trunk.navel");
    if (navel === undefined) throw new Error("f1's trunk has no trunk.navel net");
    let omph: number = navel.stations[0];
    let deepest: number = Infinity;
    for (let s: number = navel.stations[0]; s <= navel.stations[1]; s += 0.1) {
      const x: number = at(chain, s, 0)[0];
      if (x < deepest) [deepest, omph] = [x, s];
    }
    const omphPoint: V3 = at(chain, omph, 0);
    const xyph: number = supr - XYPH_SHARE * (supr - omph);

    // The held head's lowest station: the front median's steepest forward rise between suprasternale and the head's origin.
    const forward = (s: number): number => at(chain, s, 0)[0];
    const rises: [number, number][] = [];
    for (let s: number = supr; s <= head; s += 0.5) rises.push([s, forward(s + 0.5) - forward(s - 0.5)]);
    const peaks: [number, number][] = rises.filter((r: [number, number], i: number): boolean => i > 0 && i + 1 < rises.length && r[1] > rises[i - 1]![1] && r[1] >= rises[i + 1]![1]).sort((a: [number, number], b: [number, number]): number => b[1] - a[1]);
    const menton: number = peaks[0]?.[0] ?? NaN;

    // The back neck point: the back median's posterior reach between suprasternale and the held head, its most convex bend (the most
    // negative second difference over 4 mm); read only where that bend stands inside the stretch, not on its edge.
    const back = (s: number): number => -at(chain, s, Math.PI)[0];
    const second = (s: number): number => back(s + 4) - 2 * back(s) + back(s - 4);
    const window: [number, number] = [supr + 4, menton - 4];
    let c7: number = window[0];
    let bend: number = Infinity;
    const maxima: number[] = [];
    for (let s: number = window[0]; s <= window[1]; s += 0.5) {
      const b: number = second(s);
      if (b < bend) [bend, c7] = [b, s];
      const here: number = back(s);
      if (here > back(s - 0.5) && here >= back(s + 0.5)) maxima.push(round3(s));
    }
    const c7Read: boolean = bend < 0 && c7 > window[0] + 1 && c7 < window[1] - 1;
    const c7Point: V3 = at(chain, c7, Math.PI);
    const population: [number, number] = [supr + ((c7Rise.mean - C7_BAND * c7Rise.sd) * c.stature) / c.rise, supr + ((c7Rise.mean + C7_BAND * c7Rise.sd) * c.stature) / c.rise];
    const backTable: string[] = [];
    for (let s: number = supr - 20; s <= head; s += 4) backTable.push(`${s.toFixed(0)}: ${back(s).toFixed(2)} (${second(s).toFixed(3)})`);

    // The hip: the most posterior point of the trunk between its first knot and the omphalion.
    let hip: number = c.first;
    let rearmost: number = Infinity;
    for (let s: number = c.first; s <= omph; s += 1)
      for (const p of ring(chain, s))
        if (p[0] < rearmost) [rearmost, hip] = [p[0], s];

    // The under-bust: the breast's port loop's lowest station.
    const mammary: Loop = AutoMovieHumanF1.mammary(1);
    const underBust: number = Math.min(...loopPoints(mammary).map((q: [number, number]): number => q[0]));

    // The bust: the breast's most anterior point.
    const breast: V3[] = breastSkin();
    let bustPoint: V3 = breast[0]!;
    for (const p of breast) if (p[0] > bustPoint[0]) bustPoint = p;
    const bust: number = c.stationOf(bustPoint);

    // The natural waist (ANSUR 1988), reported: the least lateral reach between the hip and the under-bust.
    let natural: number = hip;
    let narrowest: number = Infinity;
    for (let s: number = hip; s <= underBust; s += 1) {
      let wide: number = -Infinity;
      for (const p of ring(chain, s)) wide = Math.max(wide, p[2]);
      if (wide < narrowest) [narrowest, natural] = [wide, s];
    }

    // The neck: planes square to the neck's axis from the neck base's centre to the head's origin.
    const frontNeck: V3 = at(chain, supr, 0);
    const base: V3 = [(frontNeck[0] + c7Point[0]) / 2, (frontNeck[1] + c7Point[1]) / 2, (frontNeck[2] + c7Point[2]) / 2];
    const crown: V3 = P.frame("head").origin as V3;
    const normal: V3 = unit(sub(crown, base));
    let best: { centre: V3; girth: number; tau: number; front: number } = { centre: base, girth: Infinity, tau: NaN, front: NaN };
    const table: string[] = [];
    for (let k: number = 0; k <= NECK_PLANES; ++k) {
      const tau: number = k / NECK_PLANES;
      const centre: V3 = [base[0] + tau * (crown[0] - base[0]), base[1] + tau * (crown[1] - base[1]), base[2] + tau * (crown[2] - base[2])];
      const sc: number = c.stationOf(centre);
      const got = planeGirth(chain, centre, normal, Math.max(c.first, sc - 90), Math.min(c.top, sc + 90));
      const below: boolean = got.front < menton;
      table.push(`${tau.toFixed(3)}: centre station ${sc.toFixed(1)}, front median crossing ${got.front.toFixed(1)}${below ? "" : " (at or above the held head)"}, ${got.found} of ${NECK_PHASES} phases, girth ${got.girth.toFixed(1)}`);
      if (below && got.girth < best.girth) best = { centre, girth: got.girth, tau, front: got.front };
    }
    // The neck site's station is its plane's lowest, the front median crossing: on level sections the plane's back half stands beside the
    // chin, which the held head keeps, so the site's ratio holds up to there and comes back to 1 at the held head.
    const neck: number = best.front;

    lines.push(
      `  the course: station 0 at ${fixed(c.axis.at(0).origin)}, ${c.rise.toFixed(6)} mm of height per mm of station; the relieved trunk read from its first knot ${c.first} to its crown cap's start ${c.top}; f1's stature (the crown's tip) ${c.stature.toFixed(1)} mm`,
      `  the hip centres' midpoint (MIDH): the pelvis frame's origin ${fixed(P.frame("pelvis").origin)}, station ${midh.toFixed(2)}`,
      `  the omphalion (OMPH): the navel net's deepest front median point, ${fixed(omphPoint, 2)}, station ${omph.toFixed(2)} (height / stature ${(omphPoint[1] / c.stature).toFixed(4)}); its side offset ${omphPoint[2].toFixed(3)} mm (phase 0 is the median)`,
      `  the xiphoid (XYPH): at ${XYPH_SHARE.toFixed(4)} of suprasternale to omphalion below suprasternale, station ${xyph.toFixed(2)}; provisional, a bony point the skin does not show`,
      `  suprasternale (SUPR): the thorax frame's origin, the placing table's suprasternale ${fixed(P.point("suprasternale"))}, station ${supr.toFixed(2)}; on the skin, the front median there ${fixed(frontNeck)}`,
      `  the back neck point (C7): the back median's most convex bend between suprasternale and the held head (stations ${window[0].toFixed(1)}..${window[1].toFixed(1)}): station ${c7.toFixed(2)}, ${fixed(c7Point)}, second difference ${bend.toFixed(3)} mm over 4 mm; ${c7Read ? "READ (inside the stretch)" : "NOT READ: the bend's extreme falls on the stretch's edge or is not convex, so the back median shows no prominence"}; (C7 - SUPR) / stature ${(((c7 - supr) * c.rise) / c.stature).toFixed(4)} against the population's ${c7Rise.mean} (SD ${c7Rise.sd}), whose ±${C7_BAND} SD band is stations ${population[0].toFixed(1)}..${population[1].toFixed(1)}; the back median's local posterior maxima: ${maxima.length === 0 ? "none" : maxima.join(", ")}`,
      `    the back median's posterior reach (and its second difference over 4 mm) every 4 mm from suprasternale - 20 to the head's origin: ${backTable.join("; ")}`,
      `  the held head's lowest station: the front median's steepest forward rise between suprasternale and the head's origin (the chin's underside; no published skin definition read), station ${menton.toFixed(2)} (height ${((c.axis.at(menton).origin as number[])[1] ?? NaN).toFixed(1)}); the steepest three: ${peaks.slice(0, 3).map((p: [number, number]): string => `${p[0].toFixed(1)} (${p[1].toFixed(2)} mm a mm)`).join(", ")}`,
      `  the head's origin: ${fixed(P.frame("head").origin)}, station ${head.toFixed(2)}`,
      `  the hip site: the trunk's most posterior point between its first knot and the omphalion, x ${rearmost.toFixed(2)} at station ${hip.toFixed(1)}`,
      `  the waist's stand-in: the omphalion's level, station ${omph.toFixed(2)}`,
      `  the under-bust site: the lowest point of the breast's port loop (AutoMovieHumanF1.mammary), station ${underBust.toFixed(2)}`,
      `  the bust site: the breast's most anterior point ${fixed(bustPoint, 2)}, station ${bust.toFixed(2)}`,
      `  the natural waist (ANSUR 1988, reported, not a site): the least lateral reach between the hip and the under-bust, ${narrowest.toFixed(2)} mm at station ${natural.toFixed(1)}`,
      `  the neck: planes square to the axis from the neck base's centre ${fixed(base)} (between the front neck point and the back neck point) to the head's origin, normal ${fixed(normal, 4)} (${((Math.acos(normal[1]) * 180) / Math.PI).toFixed(1)} degrees from vertical); the least girth whose front median crossing stands below the held head at tau ${best.tau.toFixed(3)}, centre ${fixed(best.centre)} (station ${c.stationOf(best.centre).toFixed(2)}), the site's station its front median crossing ${neck.toFixed(2)}:`,
      ...table.map((l: string): string => "    " + l),
    );
    return { chain, midh, supr, head, omph, xyph, c7, c7Read, menton, sites: { hip, waist: omph, "under-bust": underBust, bust, neck }, natural, neck: { centre: best.centre, normal }, bustPoint, breast, lines };
  }

  /** A port loop's outline on the trunk's chart, one point per column: `[station mm, phase]`, as `AutoMovieHumanF1`'s `around` writes it. */
  function loopPoints(loop: Loop): [number, number][] {
    const count: number = loop.shape?.length ?? 64;
    return Array.from({ length: count }, (_: unknown, k: number): [number, number] => {
      const clock: number = (2 * Math.PI * k) / count;
      const share: number = loop.shape?.[k] ?? 1;
      return [(loop.centre[0] + loop.semi[0] * share * Math.cos(clock)) * 1000, loop.centre[1] + loop.sense * loop.semi[1] * share * Math.sin(clock)];
    });
  }

  /** The breast's skin (as stored unless given), every 0.5 mm to its cap's tip at 360 phases, and its twin's by reflection in the median plane. */
  function breastSkin(breast: Family = AutoMovieHumanF1.BODY.breast): V3[] {
    const lastKnot: number = breast.knots[breast.knots.length - 1]!;
    const tip: number = breast.tips?.[1]?.tip ?? lastKnot;
    const chain: Chain = lofted(breast, breast.knots[0]!, tip, 0.5);
    const out: V3[] = [];
    for (let s: number = breast.knots[0]!; s <= tip; s += 0.5)
      for (let j: number = 0; j < 360; ++j) {
        const p: V3 = at(chain, s, (2 * Math.PI * j) / 360);
        out.push(p, [p[0], p[1], -p[2]]);
      }
    return out;
  }

  /**
   * Each site's tape girth on a relieved trunk, at its f1 station carried by `map`: a level ring at the hip, the waist and the under-bust;
   * the level ring with both breasts' skin at its level at the bust; the neck's plane moved up by its station's carry.
   */
  function girthsAt(c: ICourse, r: IReading, chain: Chain, map: (s: number) => number, skin: readonly V3[] = r.breast): { girths: Record<Site, number>; spreads: Record<Site, number> } {
    const level = (s: number, breast: boolean): { girth: number; spread: number } => {
      const height: number = (c.axis.at(s).origin as number[])[1] ?? NaN;
      return levelGirth(ring(chain, s), breast ? skin.filter((p: V3): boolean => Math.abs(p[1] - height) <= 0.5) : []);
    };
    const shift: number = (map(r.sites.neck) - r.sites.neck) * c.rise;
    const centre: V3 = [r.neck.centre[0], r.neck.centre[1] + shift, r.neck.centre[2]];
    const sc: number = c.stationOf(centre);
    const [hip, waist, under, bust] = [level(map(r.sites.hip), false), level(map(r.sites.waist), false), level(map(r.sites["under-bust"]), false), level(map(r.sites.bust), true)];
    return {
      girths: { hip: hip.girth, waist: waist.girth, "under-bust": under.girth, bust: bust.girth, neck: planeGirth(chain, centre, r.neck.normal, Math.max(c.first, sc - 90), Math.min(c.top, sc + 90)).girth },
      spreads: { hip: hip.spread, waist: waist.spread, "under-bust": under.spread, bust: bust.spread, neck: 0 },
    };
  }

  /** A person's trunk fields: the omphalion's and the back neck point's height ratios to stature as shifts from f1's, and each site's depth ratio (1: f1's). */
  interface IFields {
    omphalion: number;
    cervicale: number;
    depths: Record<Site, number>;
  }

  const F1_FIELDS = (): IFields => ({ omphalion: 0, cervicale: 0, depths: { hip: 1, waist: 1, "under-bust": 1, bust: 1, neck: 1 } });

  /** The piecewise linear map through anchor pairs, `from[k]` to `to[k]`, the identity shifted by the end anchors' carry outside them and exact on a segment both of whose ends stay. */
  function piecewise(from: readonly number[], to: readonly number[]): (s: number) => number {
    const n: number = from.length;
    return (s: number): number => {
      const [lo, hi] = [from[0]!, from[n - 1]!];
      if (s <= lo) return s - lo + to[0]!;
      if (s >= hi) return s - hi + to[n - 1]!;
      let k: number = 0;
      while (k < n - 2 && s > from[k + 1]!) ++k;
      const [a, b, A, B] = [from[k]!, from[k + 1]!, to[k]!, to[k + 1]!];
      if (a === A && b === B) return s;
      return A + ((s - a) * (B - A)) / (b - a);
    };
  }

  /** The trunk at a person: the law's family, its station map and inverse, its depth ratio in f1's station, and the anchors. */
  interface ILaw {
    family: Family;
    map: (s: number) => number;
    inverse: (s: number) => number;
    ratio: (s: number) => number;
    from: number[];
    to: number[];
    profile: [number, number][];
  }

  function law(c: ICourse, r: IReading, f: IFields, cervicale: boolean): ILaw {
    const omph: number = r.omph + (f.omphalion * c.stature) / c.rise;
    const xyph: number = r.supr - XYPH_SHARE * (r.supr - omph);
    const from: number[] = [r.midh, r.omph, r.xyph, r.supr, ...(cervicale ? [r.c7] : []), r.menton];
    const to: number[] = [r.midh, omph, f.omphalion === 0 ? r.xyph : xyph, r.supr, ...(cervicale ? [r.c7 + (f.cervicale * c.stature) / c.rise] : []), r.menton];
    const map: (s: number) => number = piecewise(from, to);
    const inverse: (s: number) => number = piecewise(to, from);
    const lift: number = (to[to.length - 1] ?? 0) - (from[from.length - 1] ?? 0);
    // Below the hip site the trunk holds the hip's ratio flat down to its first knot, as the limb law holds its last site's ratio past it,
    // so the crotch split's seam moves with the hip (the supervisor's ruling); the held head stays at 1 from the menton up.
    const profile: [number, number][] = [...SITES.map((x: Site): [number, number] => [r.sites[x], f.depths[x]]), [r.menton, 1]];
    const ratio = (s: number): number => {
      const last: [number, number] = profile[profile.length - 1]!;
      if (s >= last[0]) return 1;
      if (s <= profile[0]![0]) return profile[0]![1];
      let k: number = 0;
      while (k < profile.length - 2 && s > profile[k + 1]![0]) ++k;
      const [a, b] = [profile[k]!, profile[k + 1]!];
      return a[1] + smooth((s - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
    };
    const trunk: Family = c.trunk;
    const units: S.Unit[] = S.units(trunk.layout);
    const values: number[][] = trunk.values.map((field: number[], i: number): number[] => (units[i] === "mm" ? field.map((v: number, m: number): number => v * ratio(trunk.knots[m] ?? NaN)) : [...field]));
    const end = (t: H.ITip | null): H.ITip | null => (t === null ? null : { ...t, from: map(t.from), tip: map(t.tip) });
    const family: Family = {
      ...trunk,
      knots: trunk.knots.map(map),
      values,
      // The head's own nets ride with the head rigidly, shifted by the held head's carry (the neck segment's change), never resampled.
      reliefs: (trunk.reliefs ?? []).map((net: IAutoMovieLoftRelief): IAutoMovieLoftRelief => (headFramed(net) ? (lift === 0 ? net : { ...net, stations: [net.stations[0] + lift, net.stations[1] + lift] }) : carryNet(net, map, inverse, ratio))),
      ...(trunk.tips === undefined ? {} : { tips: [end(trunk.tips[0]), end(trunk.tips[1])] as [H.ITip | null, H.ITip | null] }),
    };
    return { family, map, inverse, ratio, from, to, profile };
  }

  /**
   * A net carried by the station map, its window's ends mapped and its three outer rings zero, as the engine requires. Where every inner
   * control row's Greville station maps back onto f1's own row (the map is the identity over the window), each row is f1's times the depth
   * ratio there, so f1's fields return f1's net exactly. Elsewhere each column is the cubic B-spline quasi-interpolant
   * `(-g(x - 1) + 8 g(x) - g(x + 1)) / 6` at each control's Greville parameter `x` of the carried field `g`, f1's column (the uniform cubic
   * `AutoMovieLoftRelief` reads: control `i` at parameter `i - 1`) read at the f1 station the new station maps back to, times the depth
   * ratio there; the quasi-interpolant reproduces cubics, so a smooth field is carried to fourth order in the row spacing.
   */
  function carryNet(net: IAutoMovieLoftRelief, map: (s: number) => number, inverse: (s: number) => number, ratio: (s: number) => number): IAutoMovieLoftRelief {
    if (net.shift !== undefined) throw new Error(`carryNet: ${net.name} carries a station map of its own`);
    const [a, b] = net.stations;
    const [A, B] = [map(a), map(b)];
    const [n, m] = [net.rows, net.columns];
    const step: number = (b - a) / (n - 3);
    const sigmaAt = (x: number): number => inverse(A + ((B - A) * x) / (n - 3));
    const heights: number[] = new Array<number>(n * m).fill(0);
    const own: boolean = Array.from({ length: n - 6 }, (_: unknown, k: number): number => k + 3).every((i: number): boolean => Math.abs((sigmaAt(i - 1) - a) / step + 1 - i) < 1e-9);
    if (own) {
      for (let i: number = 3; i < n - 3; ++i) {
        const k: number = ratio(sigmaAt(i - 1));
        for (let j: number = 0; j < m; ++j) heights[i * m + j] = k * (net.heights[i * m + j] ?? NaN);
      }
      return { ...net, stations: [A, B], heights };
    }
    const basis = (x: number): number => {
      const d: number = Math.abs(x);
      return d >= 2 ? 0 : d >= 1 ? (2 - d) ** 3 / 6 : (4 - 6 * d * d + 3 * d * d * d) / 6;
    };
    const carried = (x: number, j: number): number => {
      const sigma: number = sigmaAt(x);
      const old: number = (sigma - a) / step;
      let value: number = 0;
      for (let i: number = Math.max(0, Math.floor(old) - 1); i <= Math.min(n - 1, Math.floor(old) + 3); ++i) value += (net.heights[i * m + j] ?? NaN) * basis(old - i + 1);
      return ratio(sigma) * value;
    };
    for (let i: number = 3; i < n - 3; ++i) for (let j: number = 0; j < m; ++j) heights[i * m + j] = (-carried(i - 2, j) + 8 * carried(i - 1, j) - carried(i, j)) / 6;
    return { ...net, stations: [A, B], heights };
  }

  /** The stations from a family's first knot to its last, every millimetre, whose wall section is no admissible chain or meets under the margin. */
  function inadmissible(family: Family): number[] {
    const read: (s: number) => number[] = H.reader(family);
    const out: number[] = [];
    const lastKnot: number = family.knots[family.knots.length - 1]!;
    for (let s: number = family.knots[0]!; s <= lastKnot; s += 1) {
      const t: number[] = read(s);
      const fault: string | null = S.chain(t, family.layout).fault;
      if (fault !== null || Math.min(...F.leastMeetings(t, family.layout)) < MARGIN) out.push(round3(s));
    }
    return out;
  }

  /** A node of a construction tree by its name. */
  function findNode(node: AutoMovieConstructionNode, name: string): AutoMovieConstructionNode | null {
    if (node.name === name) return node;
    const n = node as { host?: AutoMovieConstructionNode; part?: AutoMovieConstructionNode; children?: { part: AutoMovieConstructionNode }[] };
    for (const child of [n.host, n.part, ...(n.children ?? []).map((k): AutoMovieConstructionNode => k.part)]) {
      if (child === undefined) continue;
      const hit: AutoMovieConstructionNode | null = findNode(child, name);
      if (hit !== null) return hit;
    }
    return null;
  }

  /** One population field's basis: its definition, its reading, its statistic and its correlations with the other sites. */
  interface IBasis {
    site: Site;
    lines: string[];
    mean: number;
    sd: number;
    neighbours: { site: Site; rho: number; basis: string }[];
  }

  /** A height field's basis: f1's own ratio, the population's SD, its cited row. */
  interface IHeight {
    f1: number;
    mean: number;
    sd: number;
    cite: string;
  }

  /** Everything the commands share: f1's course and readings, the basis, the cases, and the report's items 1 and 2. */
  interface IPrepared {
    root: string;
    course: ICourse;
    reading: IReading;
    f1: { girths: Record<Site, number>; spreads: Record<Site, number> };
    cervicale: boolean;
    cases: { name: string; fields: IFields }[];
    lines: string[];
  }

  async function prepare(): Promise<IPrepared> {
    const root: string = path.resolve(process.cwd(), "..");
    relationsOnce = await L.relations(root);
    const notes: Map<string, string[]> = new Map();
    for (const note of ["iso-8559-1-2017.md", "iso-8559-1-2017-landmarks.md", "ansur-ii.md", "ansur-ii-trunk-ratios.md", "ansur-1988.md", "ansur-1988-boundary-people.md", "de-leva-1996.md"])
      notes.set(note, (await fs.readFile(path.join(root, "packages/human/docs/sources", note), "utf8")).split(/\r?\n/));
    const find = (note: string, pattern: RegExp): { line: number; text: string } => {
      const text: string[] = notes.get(note) ?? [];
      const i: number = text.findIndex((l: string): boolean => pattern.test(l));
      if (i < 0) throw new Error(`${note}: no line matches ${pattern.source}`);
      return { line: i + 1, text: text[i] ?? "" };
    };
    const cite = (note: string, pattern: RegExp): string => {
      const hit = find(note, pattern);
      return `${note}:${hit.line}: ${hit.text.trim().slice(0, 300)}`;
    };
    // Only the words a pattern matches on its line, for a line that holds several statements.
    const quote = (note: string, pattern: RegExp): string => {
      const hit = find(note, pattern);
      return `${note}:${hit.line}: "${hit.text.match(pattern)?.[0] ?? ""}"`;
    };
    // A table row's women's mean and SD: `| name | mean | sd |` or `| name | mean (sd) |`.
    const row = (note: string, pattern: RegExp): { mean: number; sd: number; cite: string } => {
      const hit = find(note, pattern);
      const pair: RegExpMatchArray | null = hit.text.match(/\| ([0-9.]+) \(([0-9.]+)[;)]/);
      const cells: string[] = hit.text.split("|").map((x: string): string => x.trim());
      const [mean, sd]: number[] = pair === null ? [Number(cells[2]), Number(cells[3])] : [Number(pair[1]), Number(pair[2])];
      return { mean: mean ?? NaN, sd: sd ?? NaN, cite: `${note}:${hit.line}: ${hit.text.trim().slice(0, 300)}` };
    };

    // The population's tables (ANSUR 1988 women, the survey constants), read from their tracked text.
    const text: string = await fs.readFile(path.join(root, "packages/motions/src/executable/population/HumanPopulationSurvey.ts"), "utf8");
    const names: string[] = [...text.slice(text.indexOf("VARIABLES"), text.indexOf("];", text.indexOf("VARIABLES"))).matchAll(/"([A-Za-z]+)"/g)].map((x: RegExpMatchArray): string => x[1] ?? "");
    const arrays = <X>(key: string): X[] => {
      const found: X[] = [];
      for (let from: number = text.indexOf(key + ": ["); from >= 0; from = text.indexOf(key + ": [", from + 1)) {
        const open: number = from + key.length + 2;
        let depth: number = 0;
        let end: number = open;
        for (; end < text.length; ++end) {
          if (text[end] === "[") ++depth;
          else if (text[end] === "]" && --depth === 0) break;
        }
        found.push(JSON.parse(text.slice(open, end + 1).replace(/\s+/g, "").replace(/,\]/g, "]")) as X);
      }
      return found;
    };
    const [means, sds, matrices] = [arrays<number[]>("mean"), arrays<number[]>("sd"), arrays<number[][]>("r")];
    const women = (measure: string, of: number[][]): number => of[0]?.[names.indexOf(measure)] ?? NaN;
    const rho1988 = (a: string, b: string): number => {
      const [i, j]: number[] = [names.indexOf(a), names.indexOf(b)].sort((x: number, y: number): number => y - x);
      return matrices[0]?.[(i ?? 0) - 1]?.[j ?? 0] ?? NaN;
    };

    const c: ICourse = course();
    const c7Rise = row("ansur-ii-trunk-ratios.md", /^\| \(Cervicale - suprasternale\) \/ stature \|/);
    const reading: IReading = read(c, c7Rise);
    const r: IReading = reading;
    const identity = (s: number): number => s;
    const f1 = girthsAt(c, r, r.chain, identity);

    // (1) The landmarks and the girth sites.
    const lines: string[] = ["(1) THE SEGMENT LANDMARKS AND THE GIRTH SITES READ ON f1 (world mm, +x forward, +y up, +z left; stations along the trunk's course):", ...r.lines];
    lines.push(
      "  their definitions and sources:",
      `    MIDH: ${cite("de-leva-1996.md", /^\| Trunk \| SUPR to MIDH/)}`,
      `    OMPH: ${cite("de-leva-1996.md", /^\| Middle trunk \| XYPH to OMPH/)}`,
      `      ${cite("ansur-ii.md", /^\| Waist circumference, breadth, depth, height \|/)}`,
      `    XYPH: ${cite("de-leva-1996.md", /^\| Upper trunk \| SUPR to XYPH/)}`,
      `    SUPR: ${cite("iso-8559-1-2017-landmarks.md", /^\| 3\.1\.8 \|/)}`,
      `    C7: ${cite("iso-8559-1-2017-landmarks.md", /^\| 3\.1\.6 \|/)}`,
      `      ${cite("ansur-ii.md", /cervicale, the most prominent point of the C7 spine/)}`,
      `    bust point: ${cite("iso-8559-1-2017-landmarks.md", /^\| 3\.1\.11 \|/)}`,
    );
    const isoLines: Record<Site, string> = {
      hip: cite("iso-8559-1-2017.md", /^\| 5\.3\.13 \|/),
      waist: cite("iso-8559-1-2017.md", /^\| 5\.3\.10 \|/),
      "under-bust": cite("iso-8559-1-2017.md", /^\| 5\.3\.8 \|/),
      bust: cite("iso-8559-1-2017.md", /^\| 5\.3\.4 \|/),
      neck: cite("iso-8559-1-2017.md", /^\| 5\.3\.2 \|/),
    };
    const reads: Record<Site, string> = {
      hip: "read as defined: the level ring at the trunk's greatest posterior projection (the buttocks), its taut tape (convex hull)",
      waist: "NOT READABLE by its definition: the waist level is set by bony points (the lowest rib and the iliac crest), which f1's skin does not show. STAND-IN: ANSUR II's waist at the omphalion (the level at the navel's centre), read as the level ring at OMPH, with ANSUR II's own waist (omphalion) statistics",
      "under-bust": "read on the trunk alone at the lowest point of the breast's port loop, where the breast leaves the chest (f1 is bare, so no bra raises it); the level ring's taut tape",
      bust: "read as defined: the level ring at the bust point's level (the breast's most anterior point; f1 is bare, so no bra raises it) with both breasts' skin at that level, its taut tape",
      neck: "the plane is read square to the neck's axis, as defined; the thyroid cartilage's bulge is no feature of f1 (none in the inventory's facts), so its level is NOT READABLE. STAND-IN level: the least girth on those planes below the held head (the neck's narrowest)",
    };
    lines.push("  the girth sites, each at its f1 station, with its girth and the ring's height spread off its level:");
    for (const x of SITES) lines.push(`    ${x}: station ${r.sites[x].toFixed(2)}, girth ${f1.girths[x].toFixed(1)} mm${x === "neck" ? " on its plane" : `, spread ${f1.spreads[x].toFixed(3)} mm`}; ${reads[x]}`, `      ${isoLines[x]}`);
    const naturalGirth: number = levelGirth(ring(r.chain, r.natural), []).girth;
    lines.push(`    the natural waist (reported, not a site): station ${r.natural.toFixed(1)}, girth ${naturalGirth.toFixed(1)} mm; ${cite("ansur-1988.md", /Natural waist landmark/)}; ${cite("ansur-1988.md", /^\| Natural waist circumference \|/)}`);
    const ordered: number[] = [c.first, ...SITES.map((x: Site): number => r.sites[x]), r.menton];
    const monotone: boolean = ordered.every((s: number, i: number): boolean => i === 0 || s > (ordered[i - 1] ?? Infinity));
    lines.push(`  the depth profile's anchors in f1's stations (the first knot, held at the hip's ratio below the hip; ${SITES.join(", ")}; the held head): ${ordered.map((s: number): string => s.toFixed(1)).join(", ")}; ${monotone ? "increasing" : "FAIL: not increasing"}`);
    if (!monotone) {
      process.stdout.write(lines.join("\n") + "\n");
      throw new Error("the depth profile's anchors are not in station order: " + ordered.join(", "));
    }

    // (2) The cases' basis.
    const ii = (pattern: RegExp): { mean: number; sd: number; cite: string } => row("ansur-ii.md", pattern);
    const chest = ii(/^\| Chest circumference \| [0-9]/);
    const waist = ii(/^\| Waist \(omphalion\) circumference \| [0-9]/);
    const buttock = ii(/^\| Buttock circumference \| [0-9]/);
    const neckRow = ii(/^\| Neck circumference \| [0-9]/);
    const chestWaist = ii(/^\| Chest \/ waist circumference \|/);
    const waistButtock = ii(/^\| Waist \(omphalion\) \/ buttock circumference \|/);
    const derived = (a: { mean: number; sd: number }, b: { mean: number; sd: number }, ratio: { mean: number; sd: number }): number => {
      const [ca, cb, cr] = [a.sd / a.mean, b.sd / b.mean, ratio.sd / ratio.mean];
      return (ca * ca + cb * cb - cr * cr) / (2 * ca * cb);
    };
    const rhoBustWaist: number = derived(chest, waist, chestWaist);
    const rhoWaistHip: number = derived(waist, buttock, waistButtock);
    const rhoUnderWaist: number = rho1988("omphalionWaist", "underbust");
    const derivedText = (ratio: { cite: string }): string => `derived from the per-subject ratio's SD by the first-order (log) variance of a ratio, rho = (cvA^2 + cvB^2 - cvR^2) / (2 cvA cvB), both girths and the ratio of the same survey and definitions: ${ratio.cite}`;
    const basis: IBasis[] = [
      { site: "hip", lines: [`ANSUR II women's buttock circumference, at the buttock point posterior's level (the maximum protrusion), the same site as ISO 5.3.13: ${buttock.cite}`, cite("ansur-ii.md", /^\| Buttock circumference, depth, height \|/)], mean: buttock.mean, sd: buttock.sd, neighbours: [{ site: "waist", rho: rhoWaistHip, basis: derivedText(waistButtock) }] },
      {
        site: "waist",
        lines: [`ANSUR II women's waist (omphalion) circumference, the stand-in's own definition: ${waist.cite}`, cite("ansur-ii.md", /^\| Waist circumference, breadth, depth, height \|/)],
        mean: waist.mean,
        sd: waist.sd,
        neighbours: [
          { site: "bust", rho: rhoBustWaist, basis: derivedText(chestWaist) },
          { site: "hip", rho: rhoWaistHip, basis: derivedText(waistButtock) },
          { site: "under-bust", rho: rhoUnderWaist, basis: `ANSUR 1988 women's correlation of the omphalion waist (the same definition as ANSUR II's, ${quote("ansur-1988.md", /Omphalion waist: the level of the centre of the navel, as in ANSUR II/)}) with the under-bust, HumanPopulationSurvey.SURVEY.female.r` },
        ],
      },
      {
        site: "under-bust",
        lines: [`ANSUR 1988 women's chest circumference below the bust, ${women("underbust", means).toFixed(2)} (${women("underbust", sds).toFixed(3)}), HumanPopulationSurvey.SURVEY.female; ANSUR II measures none; the column's name is its only definition in the notes: ${cite("ansur-1988-boundary-people.md", /^\| underbust \|/)}`],
        mean: women("underbust", means),
        sd: women("underbust", sds),
        neighbours: [{ site: "waist", rho: rhoUnderWaist, basis: `ANSUR 1988 women, the omphalion waist (as above); the 1988 chest's correlation (${rho1988("underbust", "chest").toFixed(4)}) is not used, since that chest's definition is not in the notes` }],
      },
      { site: "bust", lines: [`ANSUR II women's chest circumference, at the chest point, for women the most anterior point of the bust, the same site as ISO 5.3.4: ${chest.cite}`, cite("ansur-ii.md", /^\| Chest circumference, depth, breadth, height \|/)], mean: chest.mean, sd: chest.sd, neighbours: [{ site: "waist", rho: rhoBustWaist, basis: derivedText(chestWaist) }] },
      {
        site: "neck",
        lines: [`ANSUR II women's neck circumference, at the infrathyroid level perpendicular to the neck's axis, the same definition as ISO 5.3.2: ${neckRow.cite}`, cite("ansur-ii.md", /^\| Neck circumference \| At infrathyroid/), `NO CORRELATION of this definition is available: ANSUR 1988's neck is over the larynx, another site (${quote("ansur-1988-boundary-people.md", /The neck is over the larynx, not ISO 8559-1's just below it/)}), so its correlations are not used; alone equals together`],
        mean: neckRow.mean,
        sd: neckRow.sd,
        neighbours: [],
      },
    ];
    const omphRise = row("ansur-ii-trunk-ratios.md", /^\| Omphalion height \/ stature \|/);
    const heights: { omphalion: IHeight; cervicale: IHeight } = {
      omphalion: { f1: ((c.axis.at(r.omph).origin as number[])[1] ?? NaN) / c.stature, mean: omphRise.mean, sd: omphRise.sd, cite: omphRise.cite },
      cervicale: { f1: ((r.c7 - r.supr) * c.rise) / c.stature, mean: c7Rise.mean, sd: c7Rise.sd, cite: c7Rise.cite },
    };
    // The back neck point moves only where its cases' band stays inside its segment, between suprasternale and the held head.
    const band: number = (END_DEVIATE * heights.cervicale.sd * c.stature) / c.rise;
    const cervicale: boolean = r.c7Read && r.c7 - band > r.supr && r.c7 + band < r.menton;
    lines.push("", "(2) THE CASES' BASIS (women; together at 1 ± 1.645 CV, each alone at 1 ± 1.645 CV sqrt(1 - rho^2), rho its largest correlation with the other sites):");
    const cases: { name: string; fields: IFields }[] = [];
    const percent = (x: number): string => `${x >= 0 ? "+" : ""}${(100 * x).toFixed(2)} %`;
    for (const b of basis) {
      const cv: number = b.sd / b.mean;
      const rhoMax: number = b.neighbours.reduce((m: number, x: { rho: number }): number => Math.max(m, x.rho), 0);
      const alone: number = END_DEVIATE * cv * Math.sqrt(1 - rhoMax * rhoMax);
      lines.push(
        `  ${b.site}: mean ${b.mean.toFixed(1)}, SD ${b.sd.toFixed(1)}, CV ${cv.toFixed(4)}; f1's girth ${f1.girths[b.site].toFixed(1)} (${((f1.girths[b.site] - b.mean) / b.sd).toFixed(2)} SD from the mean); together ±${(100 * END_DEVIATE * cv).toFixed(2)} %, alone ±${(100 * alone).toFixed(2)} % (rho max ${rhoMax.toFixed(4)})`,
        ...b.lines.map((l: string): string => `    ${l}`),
        ...(b.neighbours.length === 0 ? ["    correlations: NONE available for this site"] : b.neighbours.map((x: { site: Site; rho: number; basis: string }): string => `    rho with ${x.site} ${x.rho.toFixed(4)}: ${x.basis}`)),
      );
      for (const sign of [-1, 1]) {
        const fields: IFields = F1_FIELDS();
        fields.depths[b.site] = 1 + sign * alone;
        cases.push({ name: `${b.site} alone ${percent(sign * alone)}`, fields });
      }
    }
    lines.push(
      `  the omphalion's height / stature: f1 ${heights.omphalion.f1.toFixed(4)}, population SD ${heights.omphalion.sd}: ${heights.omphalion.cite}`,
      "    NO CORRELATION with the held suprasternale or the back neck point is available in the notes, so its range is not conditioned on the held chain; alone equals together",
      `  the back neck point's rise above suprasternale / stature: f1 ${heights.cervicale.f1.toFixed(4)}, population SD ${heights.cervicale.sd}, relative to suprasternale, which the chain holds: ${heights.cervicale.cite}`,
      `    NO CORRELATION with the omphalion's height is available; ${cervicale ? `its band ±${band.toFixed(1)} mm stays between suprasternale ${r.supr.toFixed(1)} and the held head ${r.menton.toFixed(1)}, so it moves` : `HELD: its band ${(r.c7 - band).toFixed(1)}..${(r.c7 + band).toFixed(1)} leaves its segment between suprasternale ${r.supr.toFixed(1)} and the held head ${r.menton.toFixed(1)} (on level sections the back neck point stands beside the chin), so moving it would move the held head; it is no field of this step`}`,
      `  suprasternale's height (${cite("ansur-ii-trunk-ratios.md", /^\| Suprasternale height \/ stature \|/).slice(0, 110)}...) is held with the chain; the xiphoid follows the omphalion by its share`,
    );
    const heightCase = (name: string, omphalion: number, cervicaleShift: number): void => {
      const fields: IFields = F1_FIELDS();
      fields.omphalion = omphalion;
      fields.cervicale = cervicaleShift;
      cases.push({ name, fields });
    };
    for (const sign of [-1, 1]) heightCase(`omphalion height ${sign > 0 ? "+" : "-"}${(END_DEVIATE * heights.omphalion.sd).toFixed(4)} of stature`, sign * END_DEVIATE * heights.omphalion.sd, 0);
    if (cervicale) {
      for (const sign of [-1, 1]) heightCase(`back neck point rise ${sign > 0 ? "+" : "-"}${(END_DEVIATE * heights.cervicale.sd).toFixed(4)} of stature`, 0, sign * END_DEVIATE * heights.cervicale.sd);
      for (const sign of [-1, 1]) heightCase(`heights together at their ${sign > 0 ? "95th" : "5th"}`, sign * END_DEVIATE * heights.omphalion.sd, sign * END_DEVIATE * heights.cervicale.sd);
    }
    for (const sign of [-1, 1]) {
      const fields: IFields = F1_FIELDS();
      for (const b of basis) fields.depths[b.site] = 1 + sign * END_DEVIATE * (b.sd / b.mean);
      cases.push({ name: `every site together at its ${sign > 0 ? "95th" : "5th"}`, fields });
    }
    for (const sign of [-1, 1]) {
      const fields: IFields = F1_FIELDS();
      for (const b of basis) fields.depths[b.site] = 1 + sign * END_DEVIATE * (b.sd / b.mean);
      fields.omphalion = sign * END_DEVIATE * heights.omphalion.sd;
      if (cervicale) fields.cervicale = sign * END_DEVIATE * heights.cervicale.sd;
      cases.push({ name: `every field at its ${sign > 0 ? "95th" : "5th"}`, fields });
    }
    lines.push(`  ${cases.length} cases: ${cases.map((x: { name: string }): string => x.name).join("; ")}`, "");
    return { root, course: c, reading, f1, cervicale, cases, lines };
  }

  const describe = (f: IFields): string => `omphalion ${f.omphalion >= 0 ? "+" : ""}${f.omphalion.toFixed(4)}, back neck point ${f.cervicale >= 0 ? "+" : ""}${f.cervicale.toFixed(4)} of stature; depths ${SITES.map((x: Site): string => `${x} ${f.depths[x].toFixed(4)}`).join(", ")}`;

  /** Items 1 to 3: the landmarks and sites, the cases' basis, the law with its round trip at f1's fields and each case's anchors and girths. */
  async function lawRun(): Promise<void> {
    const prepared: IPrepared = await prepare();
    const { root, course: c, reading: r, f1, cervicale, cases } = prepared;
    const out: string = path.join(root, "packages/human/.shots/family-conic-trunk-law", "law-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const lines: string[] = ["f1 trunk law: the landmarks and sites, the cases' basis, the law and its round trip (issue #3151, step 3); nothing realized", "", ...prepared.lines];

    // (3) The law and its round trip.
    const back: ILaw = law(c, r, F1_FIELDS(), cervicale);
    const trunk: Family = c.trunk;
    let valueDifference: number = 0;
    trunk.values.forEach((field: number[], i: number): void => field.forEach((v: number, m: number): void => void (valueDifference = Math.max(valueDifference, Math.abs(v - (back.family.values[i]?.[m] ?? NaN))))));
    const knotDifference: number = Math.max(...trunk.knots.map((s: number, m: number): number => Math.abs(s - (back.family.knots[m] ?? NaN))));
    let netDifference: number = 0;
    (trunk.reliefs ?? []).forEach((net: IAutoMovieLoftRelief, i: number): void => {
      const got: IAutoMovieLoftRelief | undefined = back.family.reliefs?.[i];
      netDifference = Math.max(netDifference, Math.abs(net.stations[0] - (got?.stations[0] ?? NaN)), Math.abs(net.stations[1] - (got?.stations[1] ?? NaN)));
      net.heights.forEach((h: number, k: number): void => void (netDifference = Math.max(netDifference, Math.abs(h - (got?.heights[k] ?? NaN)))));
    });
    const tipDifference: number = Math.max(0, ...[0, 1].map((k: number): number => Math.max(Math.abs((trunk.tips?.[k]?.from ?? 0) - (back.family.tips?.[k]?.from ?? 0)), Math.abs((trunk.tips?.[k]?.tip ?? 0) - (back.family.tips?.[k]?.tip ?? 0)))));
    lines.push(
      "(3) THE LAW:",
      `  the station map's anchors in f1's stations: MIDH ${r.midh.toFixed(2)}, OMPH ${r.omph.toFixed(2)}, XYPH ${r.xyph.toFixed(2)}, SUPR ${r.supr.toFixed(2)}${cervicale ? `, C7 ${r.c7.toFixed(2)}` : ""}, the held head ${r.menton.toFixed(2)}; the identity below MIDH and above the held head`,
      `  the depth profile's anchors (f1 station, ratio): the hip's ratio held flat from the first knot ${c.first.toFixed(1)}, ${SITES.map((x: Site): string => `${x} ${r.sites[x].toFixed(1)}`).join(", ")}, the held head ${r.menton.toFixed(1)} (1); the quintic smoothstep between them; ${S.units(trunk.layout).filter((u: S.Unit): boolean => u === "mm").length} of the wall's ${S.units(trunk.layout).length} fields are millimetres and scale, the shares and angles stay`,
      `  THE ROUND TRIP at f1's own fields: values ${valueDifference.toExponential(3)}, knots ${knotDifference.toExponential(3)} mm, nets' windows and heights ${netDifference.toExponential(3)}, tips ${tipDifference.toExponential(3)} mm`,
    );
    // The children at f1's own fields: each value, knot, centre and tip against the stored family's.
    const difference = (a: Family, b: Family): number => {
      let most: number = 0;
      a.values.forEach((field: number[], i: number): void => field.forEach((v: number, m: number): void => void (most = Math.max(most, Math.abs(v - (b.values[i]?.[m] ?? NaN))))));
      a.knots.forEach((s: number, m: number): void => void (most = Math.max(most, Math.abs(s - (b.knots[m] ?? NaN)))));
      a.centres.forEach((p: readonly number[], k: number): void => void (most = Math.max(most, Math.hypot(...sub(p, b.centres[k] ?? [NaN, NaN, NaN])))));
      [0, 1].forEach((k: number): void => void (most = Math.max(most, Math.abs((a.tips?.[k]?.from ?? 0) - (b.tips?.[k]?.from ?? 0)), Math.abs((a.tips?.[k]?.tip ?? 0) - (b.tips?.[k]?.tip ?? 0)))));
      return most;
    };
    const axillaStored: Family | undefined = AutoMovieHumanF1.CUTTERS.find((x: { family: Family }): boolean => x.family.name === "axilla")?.family;
    const own: IPerson = personAt(c, r.chain, back, F1_FIELDS(), lofted(back.family, c.first, back.map(c.top), 2), f1.girths.bust);
    lines.push(
      `  THE CHILDREN'S ROUND TRIP at f1's own fields through the person (personAt; values, knots, centres and tips): the chain f1's own ${own.chain === T.CHAIN ? "yes" : "NO"}; the breast ${difference(own.breast, AutoMovieHumanF1.BODY.breast).toExponential(3)}; the arm ${difference(own.arm, AutoMovieHumanF1.BODY.arm).toExponential(3)}; the leg ${difference(own.leg, AutoMovieHumanF1.BODY.leg).toExponential(3)}; the axilla's cutter carried by f1's own map ${axillaStored === undefined ? "-" : difference(axillaAt(back.map, back.ratio), axillaStored).toExponential(3)}`,
      "  the children (personAt): D at the reference humerus, breast and femur origins carries their subtrees; heldBy projects mapped extremes into unchanged section planes; reported connection-axis ratios are observations only.",
      "  each case: its fields; the anchors it moves; the children's shifts, observed axis ratios, the mound factor and the projection; each site's girth asked (f1's times its ratio) against reached, at its carried station, the bust on its own level tape of the case's trunk and breasts:",
    );
    // A projection past twice the mean anterior breast projection, 43.5 mm in a 3D scan study of 97 women (PMC8959632), so 87 mm, is
    // flagged as implausible and never clamped.
    const plausible: number = 2 * 43.5;
    const rel: L.IRelations = limbRelations();
    lines.push(
      `  the limb sites' population relations (FamilyConicLimbLaw.relations; ANSUR 1988 women, Gordon et al. 1989, HumanPopulationSurvey.ts): the trunk's ${rel.trunk.map((t): string => `${t.site} as ${t.measure} (CV ${t.cv.toFixed(4)})`).join(", ")}; each limb site E[z] = beta . z_trunk:`,
      ...rel.sites.map((s): string => `    ${s.site} (${s.measure}, CV ${s.cv.toFixed(4)}): beta ${s.beta.map((b: number, i: number): string => `${rel.trunk[i]!.site} ${b.toFixed(4)}`).join(", ")}`),
    );
    for (const x of cases) {
      const made: ILaw = law(c, r, x.fields, cervicale);
      const chain: Chain = lofted(made.family, c.first, made.map(c.top), 2);
      const kids: IPerson = personAt(c, r.chain, made, x.fields, chain, f1.girths.bust);
      const got = girthsAt(c, r, chain, made.map, breastSkin(kids.breast));
      const reached: Record<Site, number> = { ...got.girths, bust: kids.bust.reached };
      lines.push(
        `  ${x.name}: ${describe(x.fields)}`,
        `    anchors to: ${made.to.map((s: number): string => s.toFixed(2)).join(", ")} (from ${made.from.map((s: number): string => s.toFixed(2)).join(", ")})`,
        `    shifts (mm): arm ${fixed(kids.shift.arm, 2)}, breast ${fixed(kids.shift.breast, 2)}, leg ${fixed(kids.shift.leg, 2)}, head ${fixed(kids.shift.head, 2)}, thorax ${fixed(kids.shift.thorax, 2)}; axis ratios (first, second): arm ${fixed(kids.axes.arm, 4)}, breast ${fixed(kids.axes.breast, 4)}, leg ${fixed(kids.axes.leg, 4)}`,
        `    the breast's mound factor A ${kids.apex.toFixed(4)}${kids.bust.solved ? " (solved against the bust's tape)" : kids.bust.failed === null ? " (the bust's ratio; the tape within the 9 mm circumference tolerance)" : " (the bust's ratio, unsolved)"}${kids.bust.failed === null ? "" : `; FAIL ${kids.bust.failed}`}; its projection ${kids.projection.case.toFixed(2)} mm (f1 ${kids.projection.f1.toFixed(2)})${kids.projection.case > plausible ? `; FLAG the projection exceeds ${plausible} mm, twice the 43.5 mm mean (PMC8959632)` : ""}`,
        `    girths asked / reached: ${SITES.map((s: Site): string => `${s} ${(f1.girths[s] * x.fields.depths[s]).toFixed(1)} / ${reached[s].toFixed(1)} (${(reached[s] / (f1.girths[s] * x.fields.depths[s])).toFixed(4)})`).join(", ")}; the cup excess (bust - under-bust) ${(reached.bust - reached["under-bust"]).toFixed(1)} mm (f1 ${(f1.girths.bust - f1.girths["under-bust"]).toFixed(1)})`,
        `    the limb sites' depth ratios from their population relation to the trunk: ${Object.entries(L.depthsFrom(limbRelations(), x.fields.depths)).map(([site, k]: [string, number]): string => `${site} ${k.toFixed(4)}`).join(", ")}`,
      );
      process.stdout.write(`law: ${x.name}\n`);
    }
    await fs.writeFile(path.join(out, "law.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /**
   * The trunk's connections, each alone on the trunk's own source: the trunk by itself (its wall and every net), each armscye's port with
   * the arm's own leaf, each armpit's cut on that port's band, each mammary port with its breast, the crotch's split with the legs' own
   * leaves, each ear plate's merge and each concha's cut on the trunk, the nose's port and the nostrils' cuts on it. Every other
   * declaration is f1's.
   */
  function connections(root: AutoMovieConstructionNode, carry: (loop: Loop) => Loop = (loop: Loop): Loop => loop): { label: string; node: AutoMovieConstructionNode }[] {
    const get = (name: string): AutoMovieConstructionNode => {
      const node: AutoMovieConstructionNode | null = findNode(root, name);
      if (node === null) throw new Error(`f1's construction has no node ${name}`);
      return node;
    };
    const source = (name: string): AutoMovieConstructionNode => ({ type: "source", name, source: name });
    const trunk: AutoMovieConstructionNode = source("trunk");
    const port = (name: string): AutoMovieConstructionNode => {
      const node = get(name) as Extract<AutoMovieConstructionNode, { type: "port" }>;
      return { ...node, host: trunk, part: source(node.partFace), loop: carry(node.loop) };
    };
    const join = (name: string, host: AutoMovieConstructionNode): AutoMovieConstructionNode => ({ ...(get(name) as Extract<AutoMovieConstructionNode, { type: "join" }>), host });
    const crotch = get("crotch") as Extract<AutoMovieConstructionNode, { type: "split" }>;
    const out: { label: string; node: AutoMovieConstructionNode }[] = [{ label: "trunk", node: trunk }];
    for (const side of ["", ".mirror"]) out.push({ label: `armscye.arm${side}`, node: port(`armscye.arm${side}`) }, { label: `cut.axilla${side}`, node: join(`cut.axilla${side}`, port(`armscye.arm${side}`)) });
    for (const side of ["", ".mirror"]) out.push({ label: `mammary.breast${side}`, node: port(`mammary.breast${side}`) });
    out.push({ label: "crotch", node: { ...crotch, host: trunk, children: crotch.children.map((child) => ({ ...child, part: source(child.partFace) })) as typeof crotch.children } });
    for (const side of ["", ".mirror"]) out.push({ label: `root.plate${side}`, node: join(`root.plate${side}`, trunk) }, { label: `cut.concha${side}`, node: join(`cut.concha${side}`, trunk) });
    const noseNode = get("nostril.nose") as Extract<AutoMovieConstructionNode, { type: "port" }>;
    const nose: AutoMovieConstructionNode = { ...noseNode, host: trunk, loop: carry(noseNode.loop) };
    out.push({ label: "nostril.nose", node: nose }, { label: "cut.nostril", node: join("cut.nostril.mirror", join("cut.nostril", nose)) });
    return out;
  }

  /** A port's band read as the engine builds it: its columns' lengths, the columns reversed and medial, the ribbons' scales, or why it was refused. */
  interface IBand {
    refused: string | null;
    least: number;
    longest: number;
    reversed: number[];
    medial: number[];
    applied: number;
    backward: number[];
    leastOwn: number;
  }

  /**
   * A port's band as the engine builds it, on the host's and the part's faces of that port's realization alone: the loop, its jets and
   * its ribbons into the port as `AutoMovieConstructionPortRealize` makes them, the strip by `AutoMovieConstructionSplitBand.strip` with
   * the port's correspondence, ribbons and profiles. Per column, its length from the loop to the part's rail; reversed where it reaches the
   * rail against the part's own course direction there; medial where it ends nearer the median plane than it starts (`side` the port's
   * side, +1 for +Z). Also the scale the ribbons apply, each forward column's own largest monotone scale, and the columns whose ribbon
   * points back against its chord.
   */
  async function bandOf(port: Extract<AutoMovieConstructionNode, { type: "port" }>, real: ReturnType<typeof realizeAutoMovieConstruction>, side: 1 | -1): Promise<IBand> {
    const engine = await import("@automovie/engine");
    const none: IBand = { refused: null, least: NaN, longest: NaN, reversed: [], medial: [], applied: NaN, backward: [], leastOwn: NaN };
    const host = real.surfaces.find((s): boolean => s.name === port.hostFace);
    const part = real.surfaces.find((s): boolean => s.name === port.partFace);
    const chain = real.chains.find((x): boolean => x.name === port.partFace);
    if (host === undefined || part === undefined || chain === undefined) return { ...none, refused: `the faces ${port.hostFace} and ${port.partFace} were not both realized` };
    const S: number = engine.AutoMovieConstructionViews.SCALE;
    const into: 1 | -1 = port.partEnd === "bottom" ? 1 : -1;
    const layer = chain.layers[port.partEnd === "bottom" ? 0 : chain.layers.length - 1];
    if (layer === undefined) return { ...none, refused: `${port.partFace}'s chain has no layers` };
    const end: number = layer.y;
    const rail: number = end + into * port.rail * S;
    const profile: ((psi: number) => number) | undefined = port.rails === undefined ? undefined : engine.AutoMovieNaturalSpline.periodic(port.rails.map((x: number): number => end + into * x * S));
    const railAt = (psi: number): number => (profile === undefined ? rail : profile(psi));
    const n: number = port.count;
    const clock = (k: number): number => (2 * Math.PI * k) / n;
    const [y0, p0, a, b] = [port.loop.centre[0] * S, port.loop.centre[1], port.loop.semi[0] * S, port.loop.semi[1]];
    const chart: [number, number][] = Array.from({ length: n }, (_: unknown, k: number): [number, number] => {
      const share: number = port.loop.shape?.[k] ?? 1;
      return [y0 + share * a * Math.cos(clock(k)), p0 + share * port.loop.sense * b * Math.sin(clock(k))];
    });
    const inward: [number, number][] = Array.from({ length: n }, (_: unknown, k: number): [number, number] => [-a * Math.cos(clock(k)), -port.loop.sense * b * Math.sin(clock(k))]);
    const jets = chart.map((q: [number, number]) => host.jet(q[0], q[1]));
    const loop: V3[] = jets.map((j): V3 => sub(j.p, [0, 0, 0]));
    const near = (k: number, L: number) => {
      const j = jets[k];
      const toward: [number, number] | undefined = inward[k];
      const point: [number, number] | undefined = chart[k];
      if (j === undefined || toward === undefined || point === undefined) return `column ${k}: no jet`;
      const [du, dv] = toward;
      const u: V3 = sub(j.u, [0, 0, 0]);
      const v: V3 = sub(j.v, [0, 0, 0]);
      const speed: number = Math.hypot(du * u[0] + dv * v[0], du * u[1] + dv * v[1], du * u[2] + dv * v[2]);
      if (!(speed > 0)) return `column ${k}: the host's chart direction into the port has no speed`;
      return engine.AutoMovieSolidRibbon.of(host, point[0], point[1], du, dv, L / speed);
    };
    const origin = jets[0];
    if (origin === undefined) return { ...none, refused: "no loop" };
    const normal: V3 = cross(sub(origin.u, [0, 0, 0]), sub(origin.v, [0, 0, 0]));
    const outward: V3 = unit([normal[0] * host.orientation, normal[1] * host.orientation, normal[2] * host.orientation]);
    const made = engine.AutoMovieConstructionSplitBand.strip(port.band, loop, near, outward, { surface: part, station: rail, into, ...(profile === undefined ? {} : { along: profile }) }, undefined, port.correspondence ?? "angle", port.ribbons ?? "common", (port.profiles ?? []).map((p) => ({ ...p, knots: p.knots.map(([t, depth]: [number, number]): [number, number] => [t, depth * S]) })));
    if (typeof made === "string") return { ...none, refused: made };
    const lengths: number[] = [];
    const reversed: number[] = [];
    const medial: number[] = [];
    made.childPhases.forEach((psi: number, k: number): void => {
      const s: number = railAt(psi);
      const q: V3 = sub(part.jet(s, psi).p, [0, 0, 0]);
      const start: V3 = loop[k] ?? q;
      const chord: V3 = sub(q, start);
      lengths.push(Math.hypot(chord[0], chord[1], chord[2]));
      if (into * dot(chord, sub(part.jet(s + 0.5, psi).p, part.jet(s - 0.5, psi).p)) < 0) reversed.push(k);
      if (side * (q[2] - start[2]) < 0) medial.push(k);
    });
    return { refused: null, least: Math.min(...lengths), longest: Math.max(...lengths), reversed, medial, applied: made.scale.applied, backward: [...made.scale.backward], leastOwn: Math.min(...made.scale.columns) };
  }

  /** A band's numbers in one line. */
  const bandText = (x: IBand): string =>
    x.refused !== null ? `REFUSED: ${x.refused}` : `columns ${x.least.toFixed(2)}..${x.longest.toFixed(2)} mm, reversed ${x.reversed.length}${x.reversed.length === 0 ? "" : ` (${x.reversed.join(" ")})`}, medial ${x.medial.length}${x.medial.length === 0 ? "" : ` (${x.medial.join(" ")})`}, ribbon scale applied ${x.applied.toFixed(4)}, least column's own ${x.leastOwn.toFixed(4)}, backward ${x.backward.length}${x.backward.length === 0 ? "" : ` (${x.backward.join(" ")})`}`;

  /**
   * Item 4: every premise on every case, baselined against f1's own (a case fails only where it is worse than f1 at the same place): the
   * station map increasing; the wall's sections admissible (stations newly under the margin, carried back to f1's course); every net's
   * producer premises (at least 7 rows and columns, every height finite, its window forward, the three outer rings of rows and of columns
   * zero where f1's are); how far, and which way along f1's outward normal, the skin under each port's loop (f1's own on the chart) and the
   * crotch's end ring moved; and with `--engine` each trunk connection realized alone (`connections`), a diagnostic f1's own realization
   * lacks a failure, and each armscye's and mammary port's band read beside f1's (`bandOf`), a refusal or more reversed or
   * backward columns than f1's a failure (the medial count is reported, not a premise: no engine admission reads it). An explicit --operators-only omits final skin and its triangulation diagnostics. Every subset includes f1 in the same run, and each connection/case retains a running receipt.
   */
  async function premisesRun(): Promise<void> {
    const argument = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith(`--${name}=`))?.slice(name.length + 3);
    const range: [number, number] = (argument("cases") ?? "0,1000").split(",").map(Number) as [number, number];
    const engine: boolean = process.argv.includes("--engine");
    const operatorsOnly: boolean = process.argv.includes("--operators-only");
    if (operatorsOnly && !engine) throw new Error("--operators-only requires --engine");
    if (range.length !== 2 || !range.every(Number.isSafeInteger) || range[0] < 0 || range[1] < 1) throw new Error("--cases requires a nonnegative start and positive count");
    const chord: number = Number(argument("chord") ?? "0.001");
    const only: string[] | null = argument("connections")?.split(",") ?? null;
    const prepared: IPrepared = await prepare();
    const { root, course: c, reading: r, cervicale } = prepared;
    const out: string = path.join(root, "packages/human/.shots/family-conic-trunk-law", argument("dir") ?? "premises-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const started: number = Date.now();
    const progress = (what: string): void => void process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${what}\n`);
    const lines: string[] = ["f1 trunk law: every premise on every case (issue #3151, step 3); each trunk connection realized alone, nothing else", ""];
    lines.push(`phase: ${engine ? operatorsOnly ? "operators and boundaries only; final skin and its triangulation diagnostics not requested" : "operators, boundaries and final skin" : "parameter premises only"}`);
    const source: string = await fs.readFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1.ts"), "utf8");
    const trunkPhase: number = Number(source.match(/const TRUNK_PHASE: number = ([0-9.]+);/)?.[1] ?? NaN);
    const breastPitch: number = Number(source.match(/const BREAST_PITCH_MM: number = ([0-9.]+);/)?.[1] ?? NaN);
    const armTurn: number = Number(source.match(/const PHASE_TURN[^=]+= \{ arm: ([0-9.]+)/)?.[1] ?? NaN);
    const declared = AutoMovieHumanF1.construction();
    const f1Stations: number[] = declared.sources.get("trunk")?.stations ?? [];
    const loops: { name: string; loop: Loop }[] = ["armscye.arm", "armscye.arm.mirror", "mammary.breast", "mammary.breast.mirror", "nostril.nose"].map((name: string): { name: string; loop: Loop } => ({ name, loop: (findNode(declared.root, name) as Extract<AutoMovieConstructionNode, { type: "port" }>).loop }));
    const f1Refused: number[] = inadmissible(c.trunk);
    const nodes = connections(declared.root).filter((x: { label: string }): boolean => only === null || only.includes(x.label));
    lines.push(`read from AutoMovieHumanF1.ts: TRUNK_PHASE ${trunkPhase}, BREAST_PITCH_MM ${breastPitch}, PHASE_TURN.arm ${armTurn}; the armscye loop's centre station ${armscyeLevel().toFixed(2)}; f1's trunk source ${f1Stations.length} stations; f1's own wall stations under the margin ${f1Refused.length}${f1Refused.length === 0 ? "" : ` (${f1Refused[0]} .. ${f1Refused[f1Refused.length - 1]})`}; the connections ${engine ? `realized at chord ${chord} m: ${nodes.map((x: { label: string }): string => x.label).join(", ")}` : "not realized (no --engine)"}`, "");

    // f1's own nets' outer rings, rows and columns apart: a full-turn window's columns wrap, so f1's own column rings need not be zero.
    const rings = (net: IAutoMovieLoftRelief): { rows: number; columns: number } => {
      const [n, m] = [net.rows, net.columns];
      let [rows, columns] = [0, 0];
      net.heights.forEach((h: number, k: number): void => {
        const [i, j] = [Math.floor(k / m), k % m];
        if (i < 3 || i >= n - 3) rows = Math.max(rows, Math.abs(h));
        else if (j < 3 || j >= m - 3) columns = Math.max(columns, Math.abs(h));
      });
      return { rows, columns };
    };
    const f1Rings: Map<string, { rows: number; columns: number }> = new Map((c.trunk.reliefs ?? []).map((net: IAutoMovieLoftRelief): [string, { rows: number; columns: number }] => [net.name, rings(net)]));
    const ownRings: string[] = [...f1Rings.entries()].filter(([, x]): boolean => x.rows > 0 || x.columns > 0).map(([name, x]): string => `${name} rows ${x.rows.toFixed(3)}, columns ${x.columns.toFixed(3)} (window ${(c.trunk.reliefs ?? []).find((net: IAutoMovieLoftRelief): boolean => net.name === name)?.phases.map((p: number): string => p.toFixed(3)).join("..") ?? "?"})`);
    lines.push(`f1's own nets with nonzero outer rings (its baseline; a case fails only where it is worse): ${ownRings.length === 0 ? "none" : ownRings.join("; ")}`, "");

    // Every subset establishes f1 in this invocation; a serialized prior run is evidence, not a trusted cache.
    const baselineFile: string = path.join(out, operatorsOnly ? "baseline.operators.json" : "baseline.json");
    const baseline: { diagnostics: Record<string, string[]>; bands: Record<string, IBand> } = { diagnostics: {}, bands: {} };
    let failures: number = 0;
    const unavailable: string[] = [];
    const all: { name: string; fields: IFields }[] = [{ name: "f1 (the law at f1's own fields)", fields: F1_FIELDS() }, ...prepared.cases];
    const selected: typeof all = all.filter((_: unknown, index: number): boolean => index === 0 || (index >= range[0] && index < range[0] + range[1]));
    const reportFile: string = path.join(out, argument("cases") === undefined ? "premises.txt" : `premises.${range[0]}-${range[0] + range[1] - 1}.txt`);
    const state: { status: "running" | "complete"; phase: string; expectedCases: number; completedCases: number; activeCase: string | null; activeConnection: string | null; expectedConnections: number; completedConnections: number } = {
      status: "running", phase: engine ? operatorsOnly ? "operators" : "skin" : "parameters", expectedCases: selected.length, completedCases: 0,
      activeCase: null, activeConnection: null, expectedConnections: engine ? selected.length * nodes.length : 0, completedConnections: 0,
    };

    /** Retain completed and current observations before and after each expensive boundary; running is never a terminal verdict. */
    const checkpoint = async (notes: string[] = []): Promise<void> => {
      const current: string[] = state.activeCase === null ? [] : [`  ${state.activeCase}`, ...notes.map((line: string): string => "    " + line)];
      await fs.writeFile(reportFile, [...lines, ...current].join("\n") + "\n");
      await fs.writeFile(path.join(out, argument("cases") === undefined ? "receipt.json" : `receipt.${range[0]}-${range[1]}.json`), JSON.stringify({ ...state, failures, unavailable }, null, 2));
    };
    await checkpoint();
    for (const [index, x] of all.entries()) {
      if (index !== 0 && (index < range[0] || index >= range[0] + range[1])) continue;
      const notes: string[] = [];
      const fail = (what: string): void => {
        ++failures;
        notes.push("FAIL " + what);
      };
      state.activeCase = x.name;
      state.activeConnection = null;
      await checkpoint(notes);
      try {
        const made: ILaw = law(c, r, x.fields, cervicale);
        if (!made.to.every((s: number, i: number): boolean => i === 0 || s > (made.to[i - 1] ?? Infinity))) fail(`the station map is not increasing: ${made.to.map((s: number): string => s.toFixed(2)).join(", ")}`);
        const added: number[] = inadmissible(made.family)
          .map((s: number): number => round3(made.inverse(s)))
          .filter((s: number): boolean => !f1Refused.some((o: number): boolean => Math.abs(o - s) <= 1.5));
        if (added.length > 0) fail(`the wall: ${added.length} stations newly under the margin (${added[0]} .. ${added[added.length - 1]} on f1's course)`);
        for (const net of made.family.reliefs ?? []) {
          const [n, m] = [net.rows, net.columns];
          const got = rings(net);
          const own = f1Rings.get(net.name) ?? { rows: 0, columns: 0 };
          const worse: boolean = (got.rows > 0 && own.rows === 0) || (got.columns > 0 && own.columns === 0);
          if (!(n >= 7 && m >= 7 && net.heights.length === n * m && net.heights.every(Number.isFinite) && net.stations[1] > net.stations[0]) || worse) fail(`${net.name}: ${n} x ${m}, ${net.heights.length} heights, outer rows up to ${got.rows}, columns up to ${got.columns} (f1's ${own.rows}, ${own.columns}), window ${net.stations.map((s: number): string => s.toFixed(2)).join("..")}`);
        }
        const chain: Chain = lofted(made.family, c.first, made.map(c.top), 2);
        // The skin's move at chart points: its largest distance, and its component along f1's outward normal there (+ out of the trunk).
        // `to` pairs each f1 chart point with the case's (a port loop's carried by the case's station map); absent, the same chart point.
        const moved = (points: [number, number][], to: [number, number][] = points): string => {
          let [most, low, high, sum] = [0, Infinity, -Infinity, 0];
          for (const [k, [s, psi]] of points.entries()) {
            const [t, phi] = to[k] ?? [s, psi];
            const p: V3 = at(r.chain, s, psi);
            const d: V3 = sub(at(chain, t, phi), p);
            const [below, above] = s - 0.5 < c.first ? [s, s + 1] : [s - 0.5, s + 0.5];
            const normal: V3 = unit(cross(sub(at(r.chain, above, psi), at(r.chain, below, psi)), sub(at(r.chain, s, psi + 0.002), at(r.chain, s, psi - 0.002))));
            const outward: number = dot(normal, [p[0], 0, p[2]]) < 0 ? -dot(d, normal) : dot(d, normal);
            most = Math.max(most, Math.hypot(d[0], d[1], d[2]));
            [low, high, sum] = [Math.min(low, outward), Math.max(high, outward), sum + outward];
          }
          return `${most.toFixed(2)} mm (along the outward normal ${low.toFixed(2)}..${high.toFixed(2)}, mean ${(sum / points.length).toFixed(2)})`;
        };
        notes.push(`the skin moved under each loop, carried by the case's station map: ${loops.map((l: { name: string; loop: Loop }): string => `${l.name} ${moved(loopPoints(l.loop), loopPoints(carriedLoop(l.loop, made.map)))}`).join("; ")}; the crotch's end ring ${moved(Array.from({ length: 96 }, (_: unknown, j: number): [number, number] => [c.first, (2 * Math.PI * j) / 96]))}`);
        if (engine) {
          // The person at the case (`personAt`): its chain carries every child's subtree, and its construction's own ports and seeds follow.
          const kids: IPerson = personAt(c, r.chain, made, x.fields, chain, prepared.f1.girths.bust);
          if (kids.bust.failed !== null) fail(kids.bust.failed);
          const legTurn: number = Number(source.match(/const PHASE_TURN[^=]+= \{ arm: [0-9.]+, leg: ([0-9.]+)/)?.[1] ?? NaN);
          const built = personConstruction(made, kids, { trunkPhase, breastPitch, armTurn, legTurn });
          const sources: Map<string, IAutoMovieViewPart> = built.sources;
          notes.push(`the person: shifts (mm) arm ${fixed(kids.shift.arm, 2)}, breast ${fixed(kids.shift.breast, 2)}, leg ${fixed(kids.shift.leg, 2)}, head ${fixed(kids.shift.head, 2)}, thorax ${fixed(kids.shift.thorax, 2)}; axis ratios arm ${fixed(kids.axes.arm, 4)}, breast ${fixed(kids.axes.breast, 4)}, leg ${fixed(kids.axes.leg, 4)}; the mound factor A ${kids.apex.toFixed(4)}${kids.bust.solved ? " (solved)" : ""}, the bust's tape ${kids.bust.reached.toFixed(1)} mm for ${kids.bust.asked.toFixed(1)} asked, its projection ${kids.projection.case.toFixed(2)} mm (f1 ${kids.projection.f1.toFixed(2)})`);
          for (const { label, node } of connections(built.declared.root).filter((y: { label: string }): boolean => only === null || only.includes(y.label))) {
            state.activeConnection = label;
            await checkpoint(notes);
            try {
              const real = realizeAutoMovieConstruction({ name: `trunk-law.${label}`, root: node, fills: [] }, { chord, sources, skin: !operatorsOnly });
              const keys: string[] = real.diagnostics.map((d: { node: string; contract: string; detail: string }): string => `${d.node} (${d.contract}): ${d.detail.slice(0, 200)}`);
              if (index === 0) baseline.diagnostics[label] = keys;
              if (index !== 0 && baseline.diagnostics[label] === undefined) throw new Error(`${label}: f1's same-run baseline is unavailable`);
              const own: string[] = baseline.diagnostics[label] ?? [];
              const fresh: string[] = keys.filter((k: string): boolean => !own.some((o: string): boolean => o.split(":")[0] === k.split(":")[0]));
              if (fresh.length > 0) fail(`${label} through the engine: ${fresh.join("; ")}`);
              notes.push(`${label} ${real.mesh === null ? "skin not requested" : `${real.mesh.indices.length / 3} triangles`}, ${keys.length} diagnostics${own.length > 0 ? ` (f1's own ${own.length}: ${own.join("; ")})` : ""}${keys.length > 0 ? `: ${keys.join("; ")}` : ""}`);
              if (node.type === "port" && (label.startsWith("armscye.") || label.startsWith("mammary."))) {
                const band: IBand = await bandOf(node, real, label.endsWith(".mirror") ? -1 : 1);
                if (index === 0) baseline.bands[label] = band;
                const f1Band: IBand | undefined = baseline.bands[label];
                notes.push(`  ${label}'s band: ${bandText(band)}${f1Band === undefined || index === 0 ? "" : `; f1's: ${bandText(f1Band)}`}`);
                if (f1Band !== undefined && ((band.refused !== null && f1Band.refused === null) || band.reversed.length > f1Band.reversed.length || band.backward.length > f1Band.backward.length)) fail(`${label}'s band is worse than f1's (a refusal, or more reversed or backward columns; the medial count is reported, not a premise)`);
              }
          } catch (error: unknown) {
            const detail: string = `${x.name}: ${label}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`;
            unavailable.push(detail);
            fail("UNAVAILABLE " + detail);
          }
          state.completedConnections++;
          await checkpoint(notes);
          progress(`${x.name}: ${label}`);
        }
        if (index === 0) await fs.writeFile(baselineFile, JSON.stringify(baseline, null, 2));
      }
      } catch (error: unknown) {
        const detail: string = `${x.name}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`;
        unavailable.push(detail);
        fail("UNAVAILABLE " + detail);
      }
      lines.push(`  ${x.name}: ${describe(x.fields)}`, ...notes.map((line: string): string => `    ${line}`));
      state.completedCases++;
      state.activeCase = null;
      state.activeConnection = null;
      await checkpoint();
      progress(x.name);
    }
    lines.push("", `premises failing: ${failures}`, `unavailable observations: ${unavailable.length}`);
    state.status = "complete";
    await checkpoint();
    if (unavailable.length > 0) process.exitCode = 1;
    process.stdout.write(`premises failing: ${failures}; unavailable: ${unavailable.length}\nout ${out}\n`);
  }
  /** A connection's own plane: its centroid, its normal, and its two in-plane axes, mm and unit vectors. */
  export interface IPlane {
    /** Arithmetic mean of the sampled loop or seam points, in world millimetres. */
    centroid: V3;
    /** Unit plane normal, supplied for an open seam or computed by Newell's method. */
    normal: V3;
    /** Unit in-plane vertical, or the supplied horizontal for a level seam. */
    first: V3;
    /** Unit in-plane axis across the normal and first axis. */
    second: V3;
  }

  /**
   * A loop's or seam's own plane: the centroid of its points, its Newell normal (or `normal` where given, for an open seam), its first axis
   * the world up made square to the normal (or `first` where given, for a level seam, whose up is its normal) and its second across both.
   */
  export function planeOf(points: readonly V3[], normal?: V3, first?: V3): IPlane {
    const centroid: V3 = points.reduce((t: V3, p: V3): V3 => [t[0] + p[0] / points.length, t[1] + p[1] / points.length, t[2] + p[2] / points.length], [0, 0, 0]);
    let area: V3 = [0, 0, 0];
    points.forEach((p: V3, k: number): void => {
      const turned: V3 = cross(sub(p, centroid), sub(points[(k + 1) % points.length] ?? p, centroid));
      area = [area[0] + turned[0], area[1] + turned[1], area[2] + turned[2]];
    });
    const n: V3 = normal ?? unit(area);
    const lift: number = n[1];
    const axis: V3 = first ?? unit([-lift * n[0], 1 - lift * n[1], -lift * n[2]]);
    return { centroid, normal: n, first: axis, second: cross(n, axis) };
  }

  /** Points' extents along a plane's first and second axes, mm. */
  export function extentsOf(points: readonly V3[], plane: IPlane): [number, number] {
    const along = (axis: V3): number => {
      let [low, high] = [Infinity, -Infinity];
      for (const p of points) {
        const x: number = dot(sub(p, plane.centroid), axis);
        [low, high] = [Math.min(low, x), Math.max(high, x)];
      }
      return high - low;
    };
    return [along(plane.first), along(plane.second)];
  }

  /** A ratio by direction, or the refusal of a direction the map lacks. */
  function ratioOf(ratios: Record<string, number>, direction: string): number {
    const r: number | undefined = ratios[direction];
    if (r === undefined) throw new Error(`no ratio for the direction ${direction}`);
    return r;
  }

  /**
   * The breast grown as a mound from its root (the supervisor's corrected ruling): its sections take the root's ratios by direction over the
   * whole breast (`FamilyConicLimbLaw.scaledAt`), so its footprint follows the mammary loop; the mound factor `apex` scales only the lengths
   * along its course past the root, the projection, by the limb law's profile (`FamilyConicLimbLaw.throughAnchors`) from 1 at the first
   * knot to `apex` at the most anterior station (`breastApex`), held past it: a station `s` goes to `first + integral of that profile`,
   * `(s - first) + (apex - 1) span (2.5 x^4 - 3 x^5 + x^6)` up to the apex station, so the knots, the tips and the course's end move with
   * it, and the same map (`along`) carries the leaf's stations. `base` is the breast as the person's chain places it.
   */
  export function breastMound(base: H.IFamily, root: Record<string, number>, apex: number): { family: H.IFamily; along: (s: number) => number } {
    const first: number = knotOf(base, 0);
    const top: number = breastApex();
    const span: number = top - first;
    const along = (s: number): number => {
      if (s <= first) return s;
      const x: number = Math.min(1, (s - first) / span);
      const integral: number = x * x * x * x * (2.5 + x * (x - 3));
      return first + (Math.min(s, top) - first) + (apex - 1) * span * integral + (s > top ? apex * (s - top) : 0);
    };
    const scaled: H.IFamily = L.scaledAt(base, (direction: string): number => ratioOf(root, direction));
    const [c0, c1] = [base.centres[0], base.centres[base.centres.length - 1]];
    if (c0 === undefined || c1 === undefined || base.centres.length !== 2) throw new Error("breastMound: the breast's course is expected straight, two centres");
    const length: number = Math.hypot(c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2]);
    const k: number = along(length) / length;
    const end: V3 = k === 1 ? [c1[0], c1[1], c1[2]] : [c0[0] + k * (c1[0] - c0[0]), c0[1] + k * (c1[1] - c0[1]), c0[2] + k * (c1[2] - c0[2])];
    const tip = (t: H.ITip | null): H.ITip | null => (t === null ? null : { ...t, from: along(t.from), tip: along(t.tip) });
    return { family: { ...scaled, centres: [[c0[0], c0[1], c0[2]], end], knots: base.knots.map(along), ...(base.tips === undefined ? {} : { tips: [tip(base.tips[0]), tip(base.tips[1])] as [H.ITip | null, H.ITip | null] }) }, along };
  }

  /**
   * The trunk law as one deformation of space, D (the supervisor's re-plan, issuecomment-6903044030, item 1): a point at f1 station `s`
   * on the trunk's straight course and radial offset `r` from it goes to the course point at the mapped station plus `r` times the depth
   * ratio there, `D(p) = O(map(s)) + ratio(s) (p - O(s))`. This is the proposed ambient map; scaled-knot interpolation and separately transported reliefs need not equal its exact image. Off the skin it uses the same formula; where the law is f1's own (every
   * anchor in place and every ratio 1) D is the identity, the very point returned.
   *
   * @param c The trunk's course.
   * @param made The law at a person.
   * @evidence contracts/development/implementation.md#principled-implementation An explicit ambient map supplies a candidate image to compare with actual source fields; the formula does not certify equality with separately interpolated geometry.
   * @evidence contracts/development/common.md#meaningful-documentation States the formula, its frame and where it is the identity.
   */
  export function deformation(c: ICourse, made: ILaw): (p: V3) => V3 {
    if (made.from.every((x: number, i: number): boolean => x === made.to[i]) && made.profile.every(([, k]: [number, number]): boolean => k === 1)) return (p: V3): V3 => p;
    const o: V3 = sub(c.axis.at(0).origin as number[], [0, 0, 0]);
    const t: V3 = sub(c.axis.at(1).origin as number[], o);
    const tt: number = dot(t, t);
    return (p: V3): V3 => {
      const q: V3 = sub(p, o);
      const s: number = dot(q, t) / tt;
      const k: number = made.ratio(s);
      const shift: number = made.map(s) - s;
      return [p[0] + t[0] * shift + (k - 1) * (q[0] - t[0] * s), p[1] + t[1] * shift + (k - 1) * (q[1] - t[1] * s), p[2] + t[2] * shift + (k - 1) * (q[2] - t[2] * s)];
    };
  }

  /**
   * A child's held stretch carried by D (issuecomment-6903044030, item 2): every extreme (each `u` and `v` anchor) of every held section
   * takes D at its own world position on f1, times `w(s)`, over the child's own law: `u = u_law + w (u_D - u_law)`, `u_D` the D-mapped
   * extreme in the person's section frame. `w` is 1 from the first knot through the band's rail and falls by the quintic smoothstep to 0
   * over one mean root radius past it (the mean of the root section's extremes' distances from the course), in millimetres, whatever the
   * child's sites. Fullness, shoulders, tangent rules and section planes stay. This projection discards normal displacement and is not an exact nonlinear deformation. On f1 D is the identity and the child's law is f1's, so every field is f1's bit for bit.
   *
   * @param own The child by its own law as the person's chain places it.
   * @param f1 The same child on f1's reference placing.
   * @param map D.
   * @param rail The band's rail station on the child's course, mm.
   * @evidence contracts/development/implementation.md#principled-implementation Projects mapped extreme displacements onto the original section axes and blends their knot values into the child law; finite source-curve discrepancy is observed by dcheck rather than assumed absent.
   * @evidence contracts/development/common.md#meaningful-documentation Names the inputs, the weight and what stays.
   */
  export function heldBy(own: H.IFamily, f1: H.IFamily, map: (p: V3) => V3, rail: number): H.IFamily {
    const at: number[] = S.offsets(f1.layout).at;
    const extremes: number[] = f1.layout.anchors.flatMap((anchor: S.IAnchor, k: number): number[] => (anchor.kind === "u" || anchor.kind === "v" ? [k] : []));
    const radius: number = extremes.reduce((sum: number, k: number): number => sum + Math.hypot(f1.values[at[k]!]![0]!, f1.layout.anchors[k]!.mid === true ? 0 : f1.values[at[k]! + 1]![0]!), 0) / extremes.length;
    const w = (s: number): number => (s <= rail ? 1 : s >= rail + radius ? 0 : 1 - smooth((s - rail) / radius));
    const [axisOwn, axisF1]: AutoMovieViewAxis.IAxis[] = [H.axis(own), H.axis(f1)];
    const values: number[][] = own.values.map((field: number[]): number[] => [...field]);
    f1.knots.forEach((s: number, m: number): void => {
      const weight: number = w(s);
      if (weight === 0) return;
      const [p, q] = [axisOwn.at(s), axisF1.at(s)];
      for (const k of extremes) {
        const iu: number = at[k]!;
        const mid: boolean = f1.layout.anchors[k]!.mid === true;
        const [u, v]: [number, number] = [f1.values[iu]![m]!, mid ? 0 : f1.values[iu + 1]![m]!];
        const world: V3 = [0, 1, 2].map((i: number): number => (q.origin[i] as number) + u * (q.u[i] as number) + v * (q.v[i] as number)) as V3;
        // The mapped extreme less f1's, less the move of the section's own origin, read in the person's section frame and added to f1's.
        const d: V3 = sub(sub(map(world), world), sub(p.origin as number[], q.origin as number[]));
        const [uD, vD]: [number, number] = [u + dot(d, p.u as number[]), v + dot(d, p.v as number[])];
        values[iu]![m] = values[iu]![m]! + weight * (uD - values[iu]![m]!);
        if (!mid) values[iu + 1]![m] = values[iu + 1]![m]! + weight * (vD - values[iu + 1]![m]!);
      }
    });
    return { ...own, values };
  }

  let railsOnce: { arm: number; breast: number; leg: number } | null = null;

  /**
   * The bands' rails on f1, mm from each child's first station (the port's rail, the farthest of an arm's rails, the crotch's first
   * child's), read once from f1's declared construction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each rail and its source.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Throws when a port is missing rather than returning a stand-in.
   */
  export function bandRails(): { arm: number; breast: number; leg: number } {
    if (railsOnce !== null) return railsOnce;
    const root: AutoMovieConstructionNode = AutoMovieHumanF1.construction().root;
    const [arm, breast, crotch] = [findNode(root, "armscye.arm"), findNode(root, "mammary.breast"), findNode(root, "crotch")];
    if (arm?.type !== "port" || breast?.type !== "port" || crotch?.type !== "split" || crotch.children[0] === undefined) throw new Error("bandRails: f1's construction lacks a port or the crotch");
    railsOnce = { arm: 1000 * Math.max(arm.rail, ...(arm.rails ?? [])), breast: 1000 * breast.rail, leg: 1000 * crotch.children[0].rail };
    return railsOnce;
  }

  /** The trunk's children at a case through the person's chain (the supervisor's plan, issuecomment-6897365291). */
  export interface IPerson {
    /** Relative skeletal chain after the case's origin carries. */
    chain: typeof T.CHAIN;
    /** Template assembly rebuilt on that chain. */
    assembly: AutoMovieHumanF1.IAssembly;
    /** Projected breast family after the mound's station map. */
    breast: H.IFamily;
    /** Map from the source breast's station to the mound's station, in millimetres. */
    along: (s: number) => number;
    /** Arm family combining its dimension law and projected held extremes. */
    arm: H.IFamily;
    /** Leg family combining its dimension law and projected held extremes. */
    leg: H.IFamily;
    /** Observed transverse extent ratios at each child's root; these do not drive transport. */
    axes: { arm: [number, number]; breast: [number, number]; leg: [number, number] };
    /** World-millimetre carries used to place each named skeletal origin. */
    shift: { arm: V3; breast: V3; leg: V3; head: V3; thorax: V3 };
    /** Dimensionless breast projection selected by the existing bust solve. */
    apex: number;
    /** Requested and observed bust in millimetres, solve outcome and retained failure explanation. */
    bust: { asked: number; reached: number; solved: boolean; failed: string | null };
    /** Case and f1 breast projections in millimetres, for diagnostic reporting. */
    projection: { case: number; f1: number };
  }

  /**
   * The candidate person on its relative chain: D moves the reference humerus, breast and femur origins, the thorax follows the station
   * map, and the head keeps the mean carry of its held ring. Child offsets subtract their parent's move in the parent's axes, so every
   * descendant follows once. An exactly unchanged chain reuses f1's chain.
   * The arm and leg combine their population-site law with heldBy's projected extreme displacements; the breast applies the same
   * approximation before its mound's station map. Those are measured approximations, not one exact image of the complete source skin.
   * Axis ratios are observations only. The existing bust solve keeps its recorded 9 mm allowance and small-cup limitation.
   */  export function personAt(c: ICourse, f1Chain: Chain, made: ILaw, fields: IFields, chain: Chain, f1Bust: number): IPerson {
    const loops = portLoops();
    const onLoop = (loop: Loop, on: Chain, map: (s: number) => number): V3[] => loopPoints(carriedLoop(loop, map)).map(([s, psi]: [number, number]): V3 => at(on, s, psi));
    const identity = (s: number): number => s;
    const mean = (a: readonly V3[], b: readonly V3[]): V3 => {
      const sum: V3 = [0, 0, 0];
      a.forEach((p: V3, k: number): void => {
        const d: V3 = sub(b[k] ?? p, p);
        [sum[0], sum[1], sum[2]] = [sum[0] + d[0], sum[1] + d[1], sum[2] + d[2]];
      });
      return [sum[0] / a.length, sum[1] / a.length, sum[2] / a.length];
    };
    const ratios = (f1: readonly V3[], here: readonly V3[], plane: IPlane): [number, number] => {
      const [a, b] = [extentsOf(f1, plane), extentsOf(here, plane)];
      return [b[0] / a[0], b[1] / a[1]];
    };
    // The connections on f1's skin and on the case's.
    const armF1: V3[] = onLoop(loops.armscye, f1Chain, identity);
    const armCase: V3[] = onLoop(loops.armscye, chain, made.map);
    const breastF1: V3[] = onLoop(loops.mammary, f1Chain, identity);
    const breastCase: V3[] = onLoop(loops.mammary, chain, made.map);
    const seam: number[] = Array.from({ length: 97 }, (_: unknown, j: number): number => (Math.PI * j) / 96);
    const legF1: V3[] = seam.map((psi: number): V3 => at(f1Chain, c.first, psi));
    const legCase: V3[] = seam.map((psi: number): V3 => at(chain, made.map(c.first), psi));
    const menton: number = made.from[made.from.length - 1] ?? NaN;
    const ring: number[] = Array.from({ length: 96 }, (_: unknown, j: number): number => (2 * Math.PI * j) / 96);
    const headF1: V3[] = ring.map((psi: number): V3 => at(f1Chain, menton, psi));
    const headCase: V3[] = ring.map((psi: number): V3 => at(chain, made.map(menton), psi));
    const supr: number = made.from[3] ?? NaN;
    const t: V3 = sub(c.axis.at(1).origin as number[], c.axis.at(0).origin as number[]);
    const lift: number = made.map(supr) - supr;
    // Each child's chain offset moves by D at its joint centre or origin on f1 (issuecomment-6903044030, item 3); the head keeps its rigid
    // carry, the thorax the station map's carry of suprasternale.
    const D = deformation(c, made);
    const byD = (name: string): V3 => {
      const o: V3 = sub(P.frame(name).origin, [0, 0, 0]);
      return sub(D(o), o);
    };
    const shift = { arm: byD("humerus"), breast: byD("breast"), leg: byD("femur"), head: mean(headF1, headCase), thorax: [t[0] * lift, t[1] * lift, t[2] * lift] as V3 };
    // (1) The person's chain.
    const local = (parent: string, w: V3): V3 => {
      const axes = P.frame(parent).axes;
      return [dot(w, axes[0]), dot(w, axes[1]), dot(w, axes[2])];
    };
    const less = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const moves: Record<string, V3> = { thorax: local("pelvis", shift.thorax), humerus: local("thorax", less(shift.arm, shift.thorax)), breast: local("thorax", less(shift.breast, shift.thorax)), head: local("thorax", less(shift.head, shift.thorax)), femur: local("pelvis", shift.leg) };
    const still: boolean = Object.values(moves).every((m: V3): boolean => m[0] === 0 && m[1] === 0 && m[2] === 0);
    const person: typeof T.CHAIN = still ? T.CHAIN : T.CHAIN.map((joint) => {
      const m: V3 | undefined = moves[joint.name];
      return m === undefined ? joint : { ...joint, offset: [joint.offset[0] + m[0], joint.offset[1] + m[1], joint.offset[2] + m[2]] as typeof joint.offset };
    });
    const assembly: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble(undefined, person);
    // (2) The roots.
    const armPlane: IPlane = planeOf(armF1);
    const breastPlane: IPlane = planeOf(breastF1);
    const legPlane: IPlane = planeOf(legF1, [0, -1, 0], [1, 0, 0]);
    const axes = { arm: ratios(armF1, armCase, armPlane), breast: ratios(breastF1, breastCase, breastPlane), leg: ratios(legF1, legCase, legPlane) };
    // (2) The held stretches carried by D through each band's rail, then the child's own law (`heldBy`).
    const unit: Record<string, number> = { "+u": 1, "+v": 1, "-u": 1, "-v": 1 };
    // Every limb site the case does not give takes its population relation to the trunk's given sites (`FamilyConicLimbLaw.depthsFrom`).
    const limbDepths: Record<string, number> = L.depthsFrom(limbRelations(), fields.depths);
    const reference = AutoMovieHumanF1.assemble().body;
    const rails = bandRails();
    const arm: H.IFamily = heldBy({ ...assembly.body.arm, values: L.limbAt("arm", unit, limbDepths).values }, reference.arm, D, knotOf(reference.arm, 0) + rails.arm);
    const leg: H.IFamily = heldBy({ ...assembly.body.leg, values: L.limbAt("leg", unit, limbDepths).values }, reference.leg, D, knotOf(reference.leg, 0) + rails.leg);
    const breastBase: H.IFamily = heldBy(assembly.body.breast, reference.breast, D, knotOf(reference.breast, 0) + rails.breast);
    // (3) The bust.
    const asked: number = f1Bust * fields.depths.bust;
    // A circumference's allowable error, mm: the Human tests' 9 mm for circumferences (iso-20685-1-2018.md:11, recorded there as the tests'
    // circumference error under ISO 20685-1's clause 4; the standard's table itself not read). A miss within it is no failure and asks no
    // solve; otherwise the mound factor is solved by bisection inside the bracket below.
    const tolerance: number = 9;
    const tape = (a: number): number => bustTape(c, chain, breastMound(breastBase, unit, a).family).girth;
    let apex: number = fields.depths.bust;
    let reached: number = tape(apex);
    let solved: boolean = false;
    let failed: string | null = null;
    // The root is bracketed from the bust's own ratio: upward, by doubling the upper end from 2 until the tape changes sign, with a hard
    // numerical stop at 8 that is a failure. A tape over the asked bust at the bust's ratio is the small cup the supervisor ruled #3205's
    // limit: the factor is left at the bust's ratio and the case recorded. A root not bracketed is a failure, never clamped.
    if (Math.abs(reached - asked) > tolerance) {
      const miss = (a: number): number => tape(a) - asked;
      const start: number = reached - asked;
      let bracket: [number, number, number] | null = null;
      if (start < 0) {
        let [lo, hi] = [apex, 2];
        let high: number = miss(hi);
        while (start * high > 0 && hi < 8) [lo, hi, high] = [hi, 2 * hi, miss(2 * hi)];
        if (start * high < 0) bracket = [lo, hi, lo === apex ? start : miss(lo)];
        else failed = `the bust's solve finds no root up to the numerical stop A 8: the tape misses by ${high.toFixed(1)} mm there`;
      } else failed = `small cup (#3205's limit): the tape exceeds the asked bust even at the smallest loftable projection; it exceeds it by ${start.toFixed(1)} mm at the bust's ratio, where A is left`;
      if (bracket !== null) {
        let [lo, hi, low] = bracket;
        while (hi - lo > 1e-4) {
          const mid: number = (lo + hi) / 2;
          const value: number = miss(mid);
          if (low * value <= 0) hi = mid;
          else [lo, low] = [mid, value];
        }
        apex = (lo + hi) / 2;
        reached = tape(apex);
        solved = true;
      }
    }
    const mound = breastMound(breastBase, unit, apex);
    return { chain: person, assembly, breast: mound.family, along: mound.along, arm, leg, axes, shift, apex, bust: { asked, reached, solved, failed }, projection: { case: projectionOf(mound.family), f1: projectionOf(AutoMovieHumanF1.BODY.breast) } };
  }

  /**
   * The construction's sources at a case on the person's chain (`declared`, `AutoMovieHumanF1.construction` on `person.chain`): its own
   * sources with the trunk's (the law's family on its leaf stations carried by the map) and the law's children replaced on their leaves'
   * stations and flags: the breast (the mound, its stations carried by the mound's `along`), the arm and the leg (their projected mapped extremes) and the armpit's cutter (`axillaAt`), each twin the reflection of its side.
   */
  function personSources(declared: ReturnType<typeof AutoMovieHumanF1.construction>, made: ILaw, person: IPerson, flags: { trunkPhase: number; breastPitch: number; armTurn: number; legTurn: number }): Map<string, IAutoMovieViewPart> {
    const sources: Map<string, IAutoMovieViewPart> = new Map(declared.sources);
    const stationsOf = (name: string): number[] => declared.sources.get(name)?.stations ?? [];
    sources.set("trunk", H.part({ ...made.family, phase: flags.trunkPhase }, stationsOf("trunk").map(made.map)));
    const breast: Family = { ...person.breast, pitch: flags.breastPitch };
    const arm: Family = { ...person.arm, tips: [person.arm.tips?.[0] ?? null, null], turn: flags.armTurn };
    const leg: Family = { ...person.leg, tips: [person.leg.tips?.[0] ?? null, null], turn: flags.legTurn };
    const axilla: Family = axillaAt(made.map, made.ratio);
    const storedAxilla: Family | undefined = AutoMovieHumanF1.CUTTERS.find((y: { family: Family }): boolean => y.family.name === "axilla")?.family;
    const carried: (s: number) => number = storedAxilla === undefined ? (s: number): number => s : piecewise(storedAxilla.knots, axilla.knots);
    const children: [string, Family, number[]][] = [
      ["breast", breast, stationsOf("breast").map(person.along)],
      ["breast.mirror", H.mirror(breast, "breast.mirror"), stationsOf("breast.mirror").map(person.along)],
      ["arm", arm, stationsOf("arm")],
      ["arm.mirror", H.mirror(arm, "arm.mirror"), stationsOf("arm.mirror")],
      ["leg", leg, stationsOf("leg")],
      ["leg.mirror", H.mirror(leg, "leg.mirror"), stationsOf("leg.mirror")],
      ["axilla", axilla, stationsOf("axilla").map(carried)],
      ["axilla.mirror", H.mirror(axilla, "axilla.mirror"), stationsOf("axilla.mirror").map(carried)],
    ];
    for (const [name, family, stations] of children) sources.set(name, H.part(family, stations));
    return sources;
  }

  /** The person's construction and sources at a case, for the premises and the figures. */
  export function personConstruction(made: ILaw, person: IPerson, flags: { trunkPhase: number; breastPitch: number; armTurn: number; legTurn: number }): { declared: ReturnType<typeof AutoMovieHumanF1.construction>; sources: Map<string, IAutoMovieViewPart> } {
    const built = AutoMovieHumanF1.construction(undefined, undefined, person.chain);
    // The crotch's seam on the law's trunk: its stored knots as shares of the end chord (`AutoMovieHumanF1.crotchProfile`).
    const swap = (node: AutoMovieConstructionNode): AutoMovieConstructionNode => {
      if (node.type === "split") return node.name === "crotch" ? { ...node, profile: AutoMovieHumanF1.crotchProfile(made.family) } : node;
      if (node.type === "port" || node.type === "continue" || node.type === "join") return { ...node, host: swap(node.host) };
      return node;
    };
    const declared = { ...built, root: swap(built.root) };
    return { declared, sources: personSources(declared, made, person, flags) };
  }

  /**
   * The whole-figure cases (the supervisor's ruling, item 6): f1, the bust alone at its 5th and 95th ends and every site together at its 5th
   * and 95th. personConstruction builds the template tree on the case's chain, replaces its crotch profile and substitutes the separately
   * changed source families. Template-assembly port loops and changed child walls are distinct paths. These are diagnostic clay views
   * under the existing round's cameras (FamilyConicFigure's zones and views, fitted to reference points): front, back and left, and
   * the chest, shoulder, neck, hip and head zones. `--cases=<first>,<count>` picks a stretch of the five, `--dir=<name>` the directory
   * under `packages/human/.shots/family-conic-figure/`; each part writes `receipt.<range>.json` with every realization's diagnostics.
   */
  export async function figureRun(): Promise<void> {
    const argument = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith(`--${name}=`))?.slice(name.length + 3);
    const range: number[] = (argument("cases") ?? "0,5").split(",").map(Number);
    const [first, count] = [range[0] ?? 0, range[1] ?? 5];
    const { FamilyConicFigure: G } = await import("./FamilyConicFigure");
    const { FamilyConicSource: R } = await import("./FamilyConicSource");
    const { NodeCanvasRaster } = await import("./render/NodeCanvasRaster");
    const { NodeCanvasCamera } = await import("./render/NodeCanvasCamera");
    const prepared: IPrepared = await prepare();
    const { root, course: c, reading: r, cervicale } = prepared;
    const out: string = path.join(root, "packages/human/.shots/family-conic-figure", argument("dir") ?? "trunk-law-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const source: string = await fs.readFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1.ts"), "utf8");
    const flags = {
      trunkPhase: Number(source.match(/const TRUNK_PHASE: number = ([0-9.]+);/)?.[1] ?? NaN),
      breastPitch: Number(source.match(/const BREAST_PITCH_MM: number = ([0-9.]+);/)?.[1] ?? NaN),
      armTurn: Number(source.match(/const PHASE_TURN[^=]+= \{ arm: ([0-9.]+)/)?.[1] ?? NaN),
      legTurn: Number(source.match(/const PHASE_TURN[^=]+= \{ arm: [0-9.]+, leg: ([0-9.]+)/)?.[1] ?? NaN),
    };
    const chosen: { name: string; fields: IFields }[] = figureCases(prepared);
    const reference = await R.load(root);
    const bounds: [number, number, number][] = [];
    for (const mesh of [reference.body, reference.head]) {
      const p: number[] = Array.from(mesh.positions, (v: number): number => v / 1000);
      for (let i: number = 0; i + 2 < p.length; i += 3) bounds.push([p[i] ?? NaN, p[i + 1] ?? NaN, p[i + 2] ?? NaN]);
    }
    NodeCanvasRaster.initialize();
    const zones = G.ZONES.filter(([zone]: [string, unknown]): boolean => ["chest", "shoulder", "neck", "hip", "head"].includes(zone));
    const receipt: { case: string; file: string; triangles: number; diagnostics: string[]; children: string }[] = [];
    const started: number = Date.now();
    for (const [index, x] of chosen.entries()) {
      if (index < first || index >= first + count) continue;
      const tag: string = ["f1", "bust-5th", "bust-95th", "every-site-5th", "every-site-95th"][index] ?? `case-${index}`;
      const made: ILaw = law(c, r, x.fields, cervicale);
      const chain: Chain = lofted(made.family, c.first, made.map(c.top), 2);
      // The person at the case: its own construction on its chain, whose ports, seeds and fills follow its parts (`personConstruction`).
      const kids: IPerson = personAt(c, r.chain, made, x.fields, chain, prepared.f1.girths.bust);
      const built = personConstruction(made, kids, flags);
      const real = realizeAutoMovieConstruction({ name: `trunk-law.${tag}`, root: built.declared.root, fills: built.declared.fills }, { chord: 0.001, sources: built.sources });
      const mesh = { id: tag, positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), colour: [0.64, 0.65, 0.67] as [number, number, number] };
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${x.name} realized, ${real.diagnostics.length} diagnostics\n`);
      const draw = async (file: string, camera: ReturnType<typeof NodeCanvasCamera.fit>, label: string): Promise<void> => {
        await fs.writeFile(path.join(out, file), NodeCanvasRaster.render(camera, [mesh], [], "depth", label).png);
        receipt.push({ case: x.name, file, triangles: real.mesh.indices.length / 3, diagnostics: real.diagnostics.map((d: { node: string; contract: string; detail: string }): string => `${d.node} (${d.contract}): ${d.detail.slice(0, 200)}`), children: `shifts arm ${fixed(kids.shift.arm, 2)}, breast ${fixed(kids.shift.breast, 2)}, leg ${fixed(kids.shift.leg, 2)}; axis ratios arm ${fixed(kids.axes.arm, 4)}, breast ${fixed(kids.axes.breast, 4)}, leg ${fixed(kids.axes.leg, 4)}; A ${kids.apex.toFixed(4)}${kids.bust.failed === null ? "" : ` (${kids.bust.failed})`}` });
      };
      for (const view of ["front", "back", "left"]) await draw(`figure.${view}.${tag}.png`, NodeCanvasCamera.fit(view, bounds, 900, 1500), `f1 trunk law | ${x.name} | ${view}`);
      for (const [zone, inside] of zones) {
        const near: [number, number, number][] = bounds.filter(inside);
        for (const view of G.views(zone)) await draw(`${zone}.${view}.${tag}.png`, NodeCanvasCamera.fit(view, near, 900, 900), `f1 trunk law | ${x.name} | ${zone} ${view}`);
      }
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${x.name} drawn\n`);
    }
    await fs.writeFile(path.join(out, `receipt.${first}-${first + count - 1}.json`), JSON.stringify(receipt, null, 2));
    process.stdout.write("out " + out + "\n");
  }

  /**
   * The mammary band's two ends measured analytically, no engine run (the supervisor's question on the 95th cases' reversed columns): at f1,
   * every site at its 95th and every field at its 95th, (a) the mammary loop carried by the case's map, read on the case's own skin, its
   * extent along its own vertical (world up made square to the loop's Newell normal) and horizontal axes; (b) the case breast's ring at the
   * port's rail, its extent along the same axes; and per loop column the gap, the ring's distance from the loop's centroid less the loop's,
   * along the column's direction in the loop's plane (positive: the ring stands outside the loop there, which a band from loop to ring cannot
   * span forward). Written to `mammary.txt`.
   */
  export async function mammaryRun(): Promise<void> {
    const prepared: IPrepared = await prepare();
    const { root, course: c, reading: r, cervicale } = prepared;
    const out: string = path.join(root, "packages/human/.shots/family-conic-trunk-law", "mammary-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const declared = AutoMovieHumanF1.construction();
    const port = findNode(declared.root, "mammary.breast") as Extract<AutoMovieConstructionNode, { type: "port" }>;
    const railMm: number = port.rail * 1000;
    const all: { name: string; fields: IFields }[] = [{ name: "f1 (the law at f1's own fields)", fields: F1_FIELDS() }, ...prepared.cases];
    const lines: string[] = [`The mammary band's ends, analytic (no engine): the loop carried by each case's map on the case's skin, the breast's ring at the port's rail ${railMm.toFixed(2)} mm past its first knot`, ""];
    for (const prefix of ["f1", "every site together at its 95th", "every field at its 95th"]) {
      const x = all.find((y: { name: string }): boolean => y.name.startsWith(prefix));
      if (x === undefined) throw new Error(`mammaryRun: no case ${prefix}`);
      const made: ILaw = law(c, r, x.fields, cervicale);
      const chain: Chain = lofted(made.family, c.first, made.map(c.top), 2);
      const kids: IPerson = personAt(c, r.chain, made, x.fields, chain, prepared.f1.girths.bust);
      const loopPts: V3[] = loopPoints(carriedLoop(port.loop, made.map)).map(([s, psi]: [number, number]): V3 => at(chain, s, psi));
      const centroid: V3 = loopPts.reduce((t: V3, p: V3): V3 => [t[0] + p[0] / loopPts.length, t[1] + p[1] / loopPts.length, t[2] + p[2] / loopPts.length], [0, 0, 0]);
      let area: V3 = [0, 0, 0];
      loopPts.forEach((p: V3, k: number): void => {
        const q: V3 = loopPts[(k + 1) % loopPts.length] ?? p;
        area = [area[0] + cross(sub(p, centroid), sub(q, centroid))[0], area[1] + cross(sub(p, centroid), sub(q, centroid))[1], area[2] + cross(sub(p, centroid), sub(q, centroid))[2]];
      });
      const normal: V3 = unit(area);
      const up: V3 = unit(sub([0, 1, 0], [normal[0] * normal[1], normal[1] * normal[1], normal[2] * normal[1]]));
      const across: V3 = cross(normal, up);
      const plane = (p: V3): [number, number] => {
        const q: V3 = sub(p, centroid);
        return [dot(q, across), dot(q, up)];
      };
      const breast: Family = kids.breast;
      const first: number = knotOf(breast, 0);
      const ringChain: Chain = lofted(breast, first, first + 2 * railMm, 0.5);
      const ring: [number, number][] = Array.from({ length: 720 }, (_: unknown, j: number): [number, number] => plane(at(ringChain, first + railMm, (2 * Math.PI * j) / 720)));
      const loop2: [number, number][] = loopPts.map(plane);
      const extent = (points: [number, number][], c2: 0 | 1): string => {
        const values: number[] = points.map((p: [number, number]): number => p[c2]);
        return `${Math.min(...values).toFixed(2)}..${Math.max(...values).toFixed(2)} (${(Math.max(...values) - Math.min(...values)).toFixed(2)} mm)`;
      };
      const angle = (p: [number, number]): number => Math.atan2(p[1], p[0]);
      const ringAt = (theta: number): number => {
        let best: [number, number] = ring[0] ?? [0, 0];
        let gap: number = Infinity;
        for (const p of ring) {
          const d: number = Math.abs(Math.atan2(Math.sin(angle(p) - theta), Math.cos(angle(p) - theta)));
          if (d < gap) [gap, best] = [d, p];
        }
        return Math.hypot(best[0], best[1]);
      };
      const gaps: number[] = loop2.map((p: [number, number]): number => ringAt(angle(p)) - Math.hypot(p[0], p[1]));
      const outside: number[] = gaps.map((g: number, k: number): number => (g > 0 ? k : -1)).filter((k: number): boolean => k >= 0);
      lines.push(
        `${x.name}: the breast's mound factor A ${kids.apex.toFixed(4)}, shifted ${fixed(kids.shift.breast, 2)} mm; the loop's normal ${fixed(normal, 4)}`,
        `  (a) the carried loop on the case's skin (${loop2.length} columns): along its vertical ${extent(loop2, 1)}, along its horizontal ${extent(loop2, 0)}`,
        `  (b) the breast's ring at the rail: along the loop's vertical ${extent(ring, 1)}, along its horizontal ${extent(ring, 0)}`,
        `  per column, the ring's distance from the loop's centroid less the loop's (mm, + the ring outside the loop): least ${Math.min(...gaps).toFixed(2)}, most ${Math.max(...gaps).toFixed(2)}; ${outside.length} columns outside${outside.length === 0 ? "" : ` (${outside.join(" ")})`}`,
        `  at columns 0, 10, 21, 40, 60, 80, 106, 113, 120, 150, 172, 181, 191: ${[0, 10, 21, 40, 60, 80, 106, 113, 120, 150, 172, 181, 191].map((k: number): string => `${k} ${(gaps[k] ?? NaN).toFixed(2)} (clock ${((360 * k) / loop2.length).toFixed(0)} deg, loop ${Math.hypot(...(loop2[k] ?? [NaN, NaN])).toFixed(2)})`).join("; ")}`,
        "",
      );
      process.stdout.write(`mammary: ${x.name}\n`);
    }
    await fs.writeFile(path.join(out, "mammary.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /**
   * Compare D with actual source geometry at declared authored addresses: each child's corresponding authored wall arc/parameter at its
   * rail, and the actual declared host loops at the same original loop clock. Includes f1 and every population case. The wall grid does
   * not include reliefs, emitted loft interpolation, derivatives or band correspondence, so it supplies no band angle or anatomy verdict.
   * Progress is retained after every case; an unavailable case is recorded and remaining cases are still inspected.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names correspondence, millimetre discrepancies, excluded geometry, output and incomplete-case handling.
   * @evidence contracts/development/implementation.md#principled-implementation Corresponding rational-arc parameters preserve source identity; actual declared loop clocks expose a different transport law without a nearest-point surrogate.
   */
  export async function dcheckRun(): Promise<void> {
    const prepared: IPrepared = await prepare();
    const { root, course: c, reading: r, cervicale } = prepared;
    const reference: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const rails: ReturnType<typeof bandRails> = bandRails();
    const loops: ReturnType<typeof portLoops> = portLoops();
    const out: string = path.join(root, "packages/human/.shots", "trunk-d-points-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const lines: string[] = ["D transport at explicit source addresses, mm; finite sampled walls and actual declared host-loop clocks, not an emitted-band or anatomical verdict", ""];
    const observations: { case: string; part: string; samples: number; maximumMm: number; normalMm?: number; inPlaneMm?: number }[] = [];
    const unavailable: string[] = [];
    const cases: { name: string; fields: IFields }[] = [{ name: "f1 (the law at f1's own fields)", fields: F1_FIELDS() }, ...prepared.cases];
    for (const [index, x] of cases.entries()) {
      lines.push(x.name);
      try {
        const made: ILaw = law(c, r, x.fields, cervicale);
        const chain: Chain = lofted(made.family, c.first, made.map(c.top), 2);
        const person: IPerson = personAt(c, r.chain, made, x.fields, chain, prepared.f1.girths.bust);
        const D: (p: V3) => V3 = deformation(c, made);
        /** One unavailable part must not erase the remaining observations in the same case. */
        const observe: (part: string, read: () => void) => void = (part: string, read: () => void): void => {
          try { read(); } catch (error: unknown) {
            const detail: string = `${x.name}: ${part}: ${error instanceof Error ? error.message : String(error)}`;
            unavailable.push(detail);
            lines.push("  UNAVAILABLE " + detail);
          }
        };
        const sections: [string, Family, Family, number, (s: number) => number][] = [
          ["arm wall", reference.body.arm, person.arm, rails.arm, (s: number): number => s],
          ["breast wall", reference.body.breast, person.breast, rails.breast, person.along],
          ["leg wall", reference.body.leg, person.leg, rails.leg, (s: number): number => s],
        ];
        for (const [part, before, after, rail, along] of sections) observe(part, (): void => {
          const station: number = knotOf(before, 0) + rail;
          const reading: W.IReading = W.section(before, after, station, along(station), D, RING);
          observations.push({ case: x.name, part, ...reading });
          lines.push(`  ${part}: ${reading.samples} same-arc samples; max discrepancy ${reading.maximumMm.toFixed(6)} mm, section-normal ${reading.normalMm.toFixed(6)}, in-plane ${reading.inPlaneMm.toFixed(6)}; wall-chord angle ${reading.maximumChordDegrees?.toFixed(6) ?? "unavailable"} deg, unavailable chords ${reading.unavailableChords}`);
        });
        const hostLoops: [string, Loop, () => Loop][] = [
          ["armscye host loop", loops.armscye, (): Loop => AutoMovieHumanF1.armscye(1, person.assembly)],
          ["mammary host loop", loops.mammary, (): Loop => AutoMovieHumanF1.mammary(1, person.assembly)],
        ];
        for (const [part, before, makeAfter] of hostLoops) observe(part, (): void => {
          const source: [number, number][] = loopPoints(before);
          const target: [number, number][] = loopPoints(makeAfter());
          if (source.length !== target.length) throw new Error(`${part}: original loop clock count changed`);
          let maximumMm: number = 0;
          for (const [k, [s, psi]] of source.entries()) {
            const [t, phi]: [number, number] = target[k]!;
            const frame: AutoMovieLoftFrame.IFrame = c.axis.at(t);
            maximumMm = Math.max(maximumMm, A.point(D, at(r.chain, s, psi), at(chain, t, phi), [...frame.u], [...frame.v]).distanceMm);
          }
          observations.push({ case: x.name, part, samples: source.length, maximumMm });
          lines.push(`  ${part}: ${source.length} same-clock samples; max discrepancy ${maximumMm.toFixed(6)} mm`);
        });      } catch (error: unknown) {
        const detail: string = `${x.name}: ${error instanceof Error ? error.message : String(error)}`;
        unavailable.push(detail);
        lines.push("  UNAVAILABLE " + detail);
      }
      await fs.writeFile(path.join(out, "dcheck.txt"), lines.join("\n") + "\n");
      await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ status: index + 1 === cases.length ? "complete" : "running", completedCases: index + 1, expectedCases: cases.length, unavailable, observations }, null, 2));
      process.stdout.write(`dcheck: ${index + 1}/${cases.length} ${x.name}\n`);
    }
    if (unavailable.length > 0) process.exitCode = 1;
    process.stdout.write("out " + out + "\n");
  }
  /** The five paired figure cases shared by the current candidate and the coherent-field control. */
  function figureCases(prepared: IPrepared): { name: string; fields: IFields }[] {
    const all: { name: string; fields: IFields }[] = [{ name: "f1 (the law at f1's own fields)", fields: F1_FIELDS() }, ...prepared.cases];
    return ["f1", "bust alone -", "bust alone +", "every site together at its 5th", "every site together at its 95th"].map((prefix: string): { name: string; fields: IFields } => {
      const found: { name: string; fields: IFields } | undefined = all.find((x: { name: string }): boolean => x.name.startsWith(prefix));
      if (found === undefined) throw new Error(`figureRun: no case ${prefix}`);
      return found;
    });
  }

  /** Inputs for a whole-skin control, retaining the exact f1 figure construction and the five existing space maps in millimetres. */
  export interface ICoherentInput {
    /** Existing normalized f1 construction, not reference mesh triangles. */
    reference: ReturnType<typeof personConstruction>;

    /** Same five parameter sets as figureRun; map is the proposed physical point map, not heldBy's projection. */
    cases: { name: string; fields: IFields; map: (point: V3) => V3 }[];
  }

  /**
   * Prepare a controlled comparison of whole-skin D with the existing projected-extreme candidate.
   * This keeps the original f1 topology and excludes the child's separate dimension law; it is not a generated-person API.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the shared cases, millimetre map, exact reference construction and excluded laws.
   * @evidence contracts/development/implementation.md#principled-implementation Defines a compound control with composition fixed and D applied afterward; separate child dimension laws and the mound are omitted too, so an improvement cannot be attributed to one omitted operation alone.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Five maps and one call-owned reference construction are retained by the returned control input; the standalone capture process releases them on completion.
   */
  export async function coherentInput(): Promise<ICoherentInput> {
    const prepared: IPrepared = await prepare();
    const { root, course: c, reading: r, cervicale } = prepared;
    const source: string = await fs.readFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1.ts"), "utf8");
    const flags: Parameters<typeof personConstruction>[2] = {
      trunkPhase: Number(source.match(/const TRUNK_PHASE: number = ([0-9.]+);/)?.[1] ?? NaN),
      breastPitch: Number(source.match(/const BREAST_PITCH_MM: number = ([0-9.]+);/)?.[1] ?? NaN),
      armTurn: Number(source.match(/const PHASE_TURN[^=]+= \{ arm: ([0-9.]+)/)?.[1] ?? NaN),
      legTurn: Number(source.match(/const PHASE_TURN[^=]+= \{ arm: [0-9.]+, leg: ([0-9.]+)/)?.[1] ?? NaN),
    };
    const fields: IFields = F1_FIELDS();
    const made: ILaw = law(c, r, fields, cervicale);
    const person: IPerson = personAt(c, r.chain, made, fields, lofted(made.family, c.first, made.map(c.top), 2), prepared.f1.girths.bust);
    return {
      reference: personConstruction(made, person, flags),
      cases: figureCases(prepared).map((item: { name: string; fields: IFields }): ICoherentInput["cases"][number] => ({ ...item, map: deformation(c, law(c, r, item.fields, cervicale)) })),
    };
  }
  /** Run the selected tracked experiment, keeping computed observations distinct from a geometry acceptance verdict. */
  export async function main(): Promise<void> {
    if (process.argv[2] === "law") return lawRun();
    if (process.argv[2] === "premises") return premisesRun();
    if (process.argv[2] === "mammary") return mammaryRun();
    if (process.argv[2] === "figure") return figureRun();
    if (process.argv[2] === "dcheck") return dcheckRun();
    if (process.argv[2] === "chords") {
      // f1's seam chords, metres, each in the shortest form that reads back the same double, for AutoMovieHumanF1's stored constants.
      const reference = AutoMovieHumanF1.assemble();
      process.stdout.write(`crotch ${String(AutoMovieHumanF1.crotchChord(reference.body.trunk))}\narm ${AutoMovieHumanF1.fanChords("arm", reference).map(String).join(", ")}\nleg ${AutoMovieHumanF1.fanChords("leg", reference).map(String).join(", ")}\n`);
      return;
    }
    throw new Error("usage: FamilyConicTrunkLaw law | dcheck | figure | mammary | chords | premises [--engine] [--operators-only] [--cases=<first>,<count>] [--connections=<label>,...] [--chord=<m>] [--dir=<name>]");
  }
}

if (/FamilyConicTrunkLaw\.(c?js|ts)$/.test(process.argv[1] ?? "")) void FamilyConicTrunkLaw.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
