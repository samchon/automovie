import { AutoMovieNaturalSpline, AutoMovieViewOutline, AutoMovieViewSection, type AutoMovieViewAxis, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { AutoMovieHumanHeadEarFrame } from "./AutoMovieHumanHeadEarFrame";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";
import { AutoMovieHumanHeadTree } from "./AutoMovieHumanHeadTree";

/**
 * Auricular source curves in horizontal parallel planes.
 * Sa/sba own the entire source's highest/lowest Y; their tilted chord has
 * the supplied length. C and j occupy different horizontal sections:
 * their actual three-dimensional chord is perpendicular to sa-sba and
 * has the supplied breadth. It is not a horizontal section diameter.
 *
 * At the tragal level, p2 joins an actual head-source scalp point to the
 * posterior rim along world lateral. This direction is an explicit
 * geometric convention: Cho Figure 1 names scalp distances but does not
 * specify a world-space normal formula. C is separately on the actual
 * scalp. Its 0.22-length drop, tragal run, free-end 8.3/17.3 stand and
 * carrier thickness remain declared geometric/retained conventions.
 *
 * @evidence contracts/common.md#principled-implementation Separates global sa/sba extrema, the tilted c-j chord and the actual scalp-to-rim p2 endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One horizontal chart and original coordinate records supply the plate and its relief courses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no unused centre placement, parent-foot move, normal-projection substitution or reference fit.
 * @evidence contracts/common.md#meaningful-documentation Names the independent measurement sites and the remaining placement/shape conventions.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size source preparation and two bounded original-section scalp reads.
 * @evidence contracts/performance.md#reuse-equivalent-work The same original plate supplies all ridge-course readers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned sources and no global head cache.
 */
export namespace AutoMovieHumanHeadEarPlate {
  /** Source plate with separate named measurement stations, calibration mm. */
  export interface IOutput {
    /** Original auricle view. */
    part: IAutoMovieViewPart;
    /** The identical metre declaration used by the raw part, all courses and production tree. */
    view: IAutoMovieConstructionView;
    /** Actual named upper/lower source stations after the one conversion. */
    top: number;
    /** Actual named subaurale station after the one conversion. */
    bottom: number;
    /** Horizontal posterior direction of each section. */
    across: [number, number, number];
    /** Horizontal plate-normal direction. */
    normal: [number, number, number];
    /** Actual c height. */
    attachment: number;
    /** Actual j height; generally different from c. */
    posterior: number;
    /** Tragal rim measurement height. */
    tragion: number;
    /** Actual attachment/posterior original guide point. */
    point(station: number, posterior: boolean): [number, number, number];
  }

  /**
   * Author the plate and its named source/scalp endpoints together.
   *
   * @evidence contracts/common.md#principled-implementation Constructs c-j as B*q, with q perpendicular to the independently closed sa-sba chord; places p2 from the identical head source on a declared lateral line.
   * @evidence contracts/common.md#clear-and-simple-design Axis coordinates and support records are the authoritative original curves, evaluated through the engine owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never identifies a tilted-axis pole with a world-height extremum or treats a local vector projection as a scalp distance.
   * @evidence contracts/common.md#meaningful-documentation States horizontal authoring, cross-station measurement and retained fairing conventions.
   * @evidence contracts/performance.md#efficient-algorithms Constant-size interpolation and linear section-station assembly.
   * @evidence contracts/performance.md#reuse-equivalent-work One prepared original width serves each point reader.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Source closures belong to the returned plate and are released with it.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, mass: IAutoMovieViewPart, f: AutoMovieHumanHeadEarFrame.IFrame, side: string): IOutput {
    const beta: number = Math.atan2(f.protrusion, f.breadth);
    const q: [number, number, number] = f.b.map((v: number, i: number): number => -Math.cos(beta) * v + Math.sin(beta) * f.n[i]!) as [number, number, number];
    const horizontal: [number, number, number] = q.map((v: number, i: number): number => v - q[1] * f.a[i]! / f.a[1]) as [number, number, number];
    const run: number = Math.hypot(horizontal[0], horizontal[2]);
    if (!(run > 0 && f.a[1] > 0)) throw new Error("Ear c-j has no finite horizontal source run");
    const across: [number, number, number] = [horizontal[0] / run, 0, horizontal[2] / run];
    const normal: [number, number, number] = [across[2], 0, -across[0]];
    const low: number = f.bottom;
    const high: number = f.top;
    const attachment: number = high - AutoMovieHumanHeadPrior.PRIOR.ear.topFree * (high - low);
    const posterior: number = attachment + f.breadth * q[1];
    const tragion: number = plan.landmarks.tragion[1];
    const rootX: (y: number) => number = (y: number): number => plan.landmarks.tragion[0] + (y - tragion) * f.a[0] / f.a[1];
    const c: [number, number, number] = AutoMovieHumanHeadMassPart.sideAt(mass, attachment, rootX(attachment), f.sign);
    const tragalRun: number = Math.hypot(f.breadth, f.protrusion) * run;
    const scalp: [number, number, number] = AutoMovieHumanHeadMassPart.sideAt(mass, tragion, rootX(tragion) + tragalRun * across[0], f.sign);
    const named: [number, string][] = [[low, "subaurale"], [tragion, "tragal.rim"], [posterior, "posterior.j"], [attachment, "otobasion.superius"], [high, "superaurale"]];
    named.sort((a: [number, string], b: [number, string]): number => a[0] - b[0]);
    if (named[0]![0] !== low || named.at(-1)![0] !== high || named.some((p: [number, string], i: number): boolean => i > 0 && !(p[0] > named[i - 1]![0]))) throw new Error("Ear measurement sites do not form distinct internal source stations");
    const theta: (y: number) => number = (y: number): number => 2 * Math.asin(Math.sqrt((y - low) / (high - low)));
    const widthSites: [number, number][] = [[low, 0], [tragion, tragalRun / 2], [posterior, f.breadth * run / 2], [high, 0]];
    widthSites.sort((a: [number, number], b: [number, number]): number => a[0] - b[0]);
    const width: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(widthSites.map((p: [number, number]): number => theta(p[0])), widthSites.map((p: [number, number]): number => p[1]));
    const half: (y: number) => number = (y: number): number => y === low || y === high ? 0 : AutoMovieNaturalSpline.evaluate(width, theta(y));
    const stand: number = f.protrusion * 8.3 / 17.3;
    const rootZ: (y: number) => number = (y: number): number => y === tragion
      ? scalp[2] + f.sign * f.protrusion - tragalRun * across[2]
      : c[2] + (y - attachment) * f.a[2] / f.a[1] + (y === low || y === high ? f.sign * stand : 0);
    const source: (read: (y: number) => number, angle?: boolean) => IAutoMovieViewPart.IOutline = (read: (y: number) => number, angle: boolean = true): IAutoMovieViewPart.IOutline => ({
      knots: named.map(([station, site]: [number, string]): IAutoMovieViewPart.IKnot => ({ site, station, value: read(station) })),
      ...(angle ? { parameter: { type: "angle" as const, bottom: low, top: high } } : {}),
    });
    const axis: AutoMovieViewAxis.IAxis = AutoMovieHumanHeadSourceAxis.of({ x: source((y: number): number => rootX(y) + half(y) * across[0]), y: source((y: number): number => y, false), z: source((y: number): number => rootZ(y) + half(y) * across[2]) }, across, normal);
    const sites: Set<number> = new Set(named.map((p: [number, string]): number => p[0]));
    for (let i: number = 1; i < 24; i++) sites.add(low + (high - low) * Math.sin(Math.PI * i / 48) ** 2);
    const thickness: number = AutoMovieHumanHeadPrior.PRIOR.ear.rim * f.scale * plan.scale;
    const outward: number = normal.reduce((sum: number, v: number, i: number): number => sum + v * f.n[i]!, 0);
    const part: IAutoMovieViewPart = {
      name: `auricle.${side}`, axis, stations: [...sites].sort((a: number, b: number): number => a - b),
      front: { positive: { ...source(half), range: { minimum: 0, maximum: null } }, negative: { ...source((y: number): number => -half(y)), range: { minimum: null, maximum: 0 } } },
      // This inward carrier is an overlap allowance behind the conchal floor,
      // not a measured cartilage or skin thickness.
      side: { positive: source((y: number): number => y === low || y === high ? 0 : (thickness + (outward > 0 ? 0 : 9.65 * plan.scale)) * Math.sin(theta(y))), negative: source((y: number): number => y === low || y === high ? 0 : -(thickness + (outward < 0 ? 0 : 9.65 * plan.scale)) * Math.sin(theta(y))) },
      fullness: { kind: "shoulder", shoulder: { knots: [low, high].map((station: number): IAutoMovieViewPart.IKnot => ({ site: "auricle.ellipse", station, value: AutoMovieViewSection.ELLIPSE })) } },
      pole: "both", order: 32, samples: 128,
    };
    const actual: { part: IAutoMovieViewPart; view: IAutoMovieConstructionView } = AutoMovieHumanHeadTree.source(part);
    const station: (site: string) => number = (site: string): number => {
      const knot: IAutoMovieViewPart.IKnot | undefined = actual.part.front.positive.knots.find((k: IAutoMovieViewPart.IKnot): boolean => k.site === site);
      if (knot === undefined) throw new Error(`Ear source has no named ${site} station`);
      return knot.station;
    };
    const actualLow: number = station("subaurale");
    const actualHigh: number = station("superaurale");
    const prepared: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(actual.part.front.positive, { bottom: actualLow, top: actualHigh });
    if ("detail" in prepared) throw new Error(`Ear source: ${prepared.detail}`);
    return { ...actual, across, normal, attachment: station("otobasion.superius"), posterior: station("posterior.j"), tragion: station("tragal.rim"), top: actualHigh, bottom: actualLow, point: (at: number, posteriorSide: boolean): [number, number, number] => {
      const scalar: number | string = AutoMovieViewOutline.value(prepared, at);
      if (typeof scalar === "string") throw new Error(`Ear source point: ${scalar}`);
      return actual.part.axis.at(at).origin.map((value: number, i: number): number => value + (posteriorSide ? 1 : -1) * scalar * across[i]!) as [number, number, number];
    } };
  }
}
