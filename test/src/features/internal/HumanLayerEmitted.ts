import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanLayerContinuity } from "./HumanLayerContinuity";
import type { HumanLayerFinding } from "./HumanLayerFinding";
import type { HumanLayerIndex } from "./HumanLayerIndex";
import { HumanLayerPlane } from "./HumanLayerPlane";
import { HumanLayerPolygon } from "./HumanLayerPolygon";
import type { HumanLayerSite } from "./HumanLayerSite";

type V3 = HumanAnatomy.V3;
type V2 = [number, number];

const A: typeof HumanAnatomy = HumanAnatomy;
const G: typeof HumanLayerPolygon = HumanLayerPolygon;

/**
 * The emitted skin's section at a declared layer, and the loft's continuity
 * across it: the readings of `HumanLayerComposition` that are not about where
 * each ring point stands.
 */
export namespace HumanLayerEmitted {
  /** What the loft's continuity across one layer read. */
  export interface IAcross {
    /** Runs of a tangent break or curvature jump beyond its limit. */
    findings: HumanLayerFinding.IFinding[];

    /** Largest tangent break at any phase, radians. */
    worstBreak: number;

    /** Largest curvature jump at any phase, 1/mm; zero when curvature is not read. */
    worstJump: number;
  }

  /**
   * The taut-tape girth and area of the emitted section against the declared
   * ring, for a planar layer wholly on the skin.
   *
   * The emitted section is the loop the plane cuts nearest the ring; where the
   * plane splits the section (a chain end at a branch) none follows the ring
   * and nothing is read. The taut tape bridges the tessellation's
   * sub-millimetre zigzag, which the point readings already bound.
   *
   * @param person Person, for the findings.
   * @param site The layer.
   * @param index The emitted skin.
   * @param tolerance Distance a section may stand from the skin, mm.
   */
  export function section(person: string, site: HumanLayerSite.ISite, index: HumanLayerIndex, tolerance: number): HumanLayerFinding.IFinding[] {
    const ring: V2[] = site.ring.map((p: V3): V2 => HumanLayerPlane.local(site.plane, p));
    const loops: V2[][] = index
      .slice(site.plane, site.centre, 2 * site.reach + 30)
      .filter((l: HumanLayerIndex.ILoop): boolean => l.closed && l.points.length >= 3)
      .map((l: HumanLayerIndex.ILoop): V2[] => l.points.map((p: V3): V2 => HumanLayerPlane.local(site.plane, p)));
    const cut: V2[] | undefined = loops.length === 0 ? undefined : loops[G.argmin(loops.map((q: V2[]): number => G.meanDistance(ring, q)))];
    const out: HumanLayerFinding.IFinding[] = [];

    if (cut === undefined || G.meanDistance(ring, cut) > tolerance) return out;

    const limit: number = site.large ? HumanAnatomyShared.LARGE : HumanAnatomyShared.SMALL;
    const girth: number = G.taut(cut) - G.taut(ring);
    const area: number = Math.abs(G.area(cut)) - Math.abs(G.area(ring));
    const areaLimit: number = G.perimeter(ring) * tolerance;

    if (Math.abs(girth) > limit)
      out.push({
        person,
        chain: site.chain,
        layer: site.layer,
        reading: "emitted taut girth",
        phase: null,
        bearing: "whole",
        value: girth,
        limit,
        mean: girth,
        unit: "mm",
        at: site.centre,
        detail: `emitted ${G.taut(cut).toFixed(1)}, declared ${G.taut(ring).toFixed(1)}`,
      });

    if (Math.abs(area) > areaLimit)
      out.push({
        person,
        chain: site.chain,
        layer: site.layer,
        reading: "emitted area",
        phase: null,
        bearing: "whole",
        value: area,
        limit: areaLimit,
        mean: area,
        unit: "mm²",
        at: site.centre,
        detail: `emitted ${Math.abs(G.area(cut)).toFixed(0)}, declared ${Math.abs(G.area(ring)).toFixed(0)}`,
      });

    return out;
  }

  /**
   * The loft's tangent break, and where C2 is declared its curvature jump,
   * across a layer.
   *
   * An interval shorter than the finite differences' reach (2 steps for the
   * tangent, 3 for the curvature) is read without that reading.
   *
   * @param person Person, for the findings.
   * @param site The layer, its ring thinned to the phases read.
   * @param surface The loft as a function of chain, station and phase.
   * @param tolerance Distance the continued curve may stand from the loft, mm.
   */
  export function across(
    person: string,
    site: HumanLayerSite.ISite,
    surface: (chain: string, s: number) => (t: number) => V3,
    tolerance: number,
  ): IAcross {
    const out: IAcross = { findings: [], worstBreak: 0, worstJump: 0 };

    if (site.continuity === null || !(site.interval > 2 * HumanLayerContinuity.STEP)) return out;

    const count: number = site.ring.length;
    const curved: boolean = site.continuity === "C2" && site.interval > 3 * HumanLayerContinuity.CURVATURE_STEP;
    const read: HumanLayerContinuity.IReading = HumanLayerContinuity.continuity(
      (s: number): ((t: number) => V3) => surface(site.chain, s),
      site.station,
      curved ? site.interval : null,
      count,
      tolerance,
    );
    const deg: number = 180 / Math.PI;
    const broken: Int8Array = Int8Array.from(read.breaks, (x: number, i: number): number => (x > read.limits[i]! ? 1 : 0));

    for (const run of G.runs(broken)) {
      const worst: number = peak(read.breaks, run);

      out.findings.push(
        finding(person, site, "tangent break across the layer", run, count, worst, {
          value: read.breaks[worst]! * deg,
          limit: read.limits[worst]! * deg,
          unit: "deg",
          detail: `declared ${site.continuity}`,
        }),
      );
    }

    for (let i: number = 0; i < count; i++) out.worstBreak = Math.max(out.worstBreak, read.breaks[i]!);

    if (!curved) return out;

    const jumped: Int8Array = Int8Array.from(read.jumps, (x: number): number => (x > read.jumpLimit ? 1 : 0));

    for (const run of G.runs(jumped)) {
      const worst: number = peak(read.jumps, run);

      out.findings.push(
        finding(person, site, "curvature jump across the layer", run, count, worst, {
          value: read.jumps[worst]!,
          limit: read.jumpLimit,
          unit: "1/mm",
          detail: "declared C2",
        }),
      );
    }

    for (let i: number = 0; i < count; i++) out.worstJump = Math.max(out.worstJump, read.jumps[i]!);

    return out;
  }
}

/** The phase of a run at which a reading is largest. */
function peak(values: Float64Array, run: HumanLayerPolygon.IRun): number {
  let worst: number = run.from;

  for (let i: number = run.from; ; i = (i + 1) % values.length) {
    if (values[i]! > values[worst]!) worst = i;

    if (i === run.to) break;
  }

  return worst;
}

/** A continuity finding at a run's worst phase. */
function finding(
  person: string,
  site: HumanLayerSite.ISite,
  reading: string,
  run: HumanLayerPolygon.IRun,
  count: number,
  worst: number,
  rest: { value: number; limit: number; unit: string; detail: string },
): HumanLayerFinding.IFinding {
  return {
    person,
    chain: site.chain,
    layer: site.layer,
    reading,
    phase: [(360 * run.from) / count, (360 * run.to) / count],
    bearing: G.bearing(A.reject(A.sub(site.ring[worst]!, site.centre), site.plane.normal)),
    value: rest.value,
    limit: rest.limit,
    mean: rest.value,
    unit: rest.unit,
    at: site.ring[worst]!,
    detail: rest.detail,
  };
}
