import { HumanAnatomy } from "../../HumanAnatomy";
import { HumanAnatomyShared } from "../../HumanAnatomyShared";
import { HumanLayerBasis } from "./HumanLayerBasis";
import type { HumanLayerFinding } from "../../HumanLayerFinding";
import { HumanLayerFold } from "./HumanLayerFold";
import type { HumanLayerIndex } from "../../HumanLayerIndex";
import { HumanLayerPlane } from "../../HumanLayerPlane";
import { HumanLayerPolygon } from "../../HumanLayerPolygon";
import { HumanLayerReport } from "./HumanLayerReport";
import { HumanLayerSite } from "../../HumanLayerSite";
import { HumanPopulation } from "../../HumanPopulation";
import { HumanReferenceSurface } from "../surface/HumanReferenceSurface";

/** A point in space, mm. */
type V3 = HumanAnatomy.V3;

/** A point in a section's plane, mm. */
type V2 = [number, number];

/** The shared vector helpers, by a short name. */
const A: typeof HumanAnatomy = HumanAnatomy;

/** The shared polygon helpers, by a short name. */
const G: typeof HumanLayerPolygon = HumanLayerPolygon;

/** The section pair a layer's two meshes cut. */
interface ISections {
  /** The generated loop, counter-clockwise. */
  gen: V2[];

  /** The reference loop, counter-clockwise. */
  ref: V2[];

  /** For each point of `ref`, its index in the reference's cut loop. */
  order: number[];

  /** The reference's cut loop, with the mesh edge each point lies on. */
  loop: HumanLayerIndex.ILoop;

  /** The generated loop resampled at equal arclength. */
  samples: V2[];
}

/** A layer that cannot be compared, and why. */
interface ISkip {
  /** Why it is skipped. */
  status: Exclude<HumanLayerReport.ILayer["status"], "compared">;

  /** The reason in words. */
  reason: string;
}

/** Everything one layer's readings share. */
interface IContext {
  /** Person. */
  person: string;

  /** The layer. */
  site: HumanLayerSite.ISite;

  /** The layer's comparison being filled. */
  layer: HumanLayerReport.ILayer;

  /** The findings being collected. */
  findings: HumanLayerFinding.IFinding[];

  /** The pair of sections. */
  sections: ISections;

  /** In-plane limit at each point of the reference loop, mm; infinite where the cut grazes the skin. */
  limitAt: Float64Array;

  /** Floor of the limits as a share of the section's size: 2.576 times the nearest survey measure's coefficient of variation. */
  floor: number;
}

/**
 * Compare a generated skin with a reference body at the plane of every layer,
 * addressed by chain, layer and phase.
 *
 * Both meshes are cut by the same plane and the two sections compared: girth
 * (perimeter and taut tape), area, centroid, the signed in-plane deviation
 * round the loop, and excess concave turning. Every limit flags only a gross
 * departure and stands on the population's unconditional spread at that
 * section, floored by the nearest ANSUR 1988 measure's variation where the
 * population barely varies; nothing in a limit reads the generated skin.
 */
export namespace HumanLayerCompare {
  /** Generated samples per millimetre of loop, at least {@link MIN_SAMPLES}. */
  export const SAMPLE_STEP: number = 2;

  /** Fewest generated samples round a loop. */
  export const MIN_SAMPLES: number = 96;

  /** Smallest share of a reference normal lying in the plane at which an in-plane deviation is read: below it the cut grazes the skin. */
  export const OBLIQUE: number = 0.5;

  /** Share of the ring's reach, plus {@link HumanAnatomyShared.HEAD}, by which the chosen generated loop may stand from the ring on average and still be this layer's section. */
  export const FOLLOW: number = 0.25;

  /**
   * Compare a generated skin with a reference at every layer plane.
   *
   * @param props.person Person, for the findings.
   * @param props.sites The planes, from the generated person's layers.
   * @param props.generated The skin under test.
   * @param props.reference The reference mesh.
   * @param props.basis The reference's population and survey sex.
   */
  export function compare(props: {
    person: string;
    sites: HumanLayerSite.ISite[];
    generated: HumanLayerIndex;
    reference: HumanLayerIndex;
    basis: HumanLayerBasis.IBasis;
  }): HumanLayerReport.IReport {
    const layers: HumanLayerReport.ILayer[] = [];
    const findings: HumanLayerFinding.IFinding[] = [];

    for (const site of props.sites) {
      const read: { layer: HumanLayerReport.ILayer; findings: HumanLayerFinding.IFinding[] } = compareSite(
        props.person,
        site,
        props.generated,
        props.reference,
        props.basis,
      );

      layers.push(read.layer);
      findings.push(...read.findings);
    }

    return { person: props.person, layers, findings };
  }

  /**
   * One layer's comparison.
   *
   * @param person Person, for the findings.
   * @param site The layer.
   * @param generated The skin under test.
   * @param reference The reference mesh.
   * @param b The reference's basis.
   */
  export function compareSite(
    person: string,
    site: HumanLayerSite.ISite,
    generated: HumanLayerIndex,
    reference: HumanLayerIndex,
    b: HumanLayerBasis.IBasis,
  ): { layer: HumanLayerReport.ILayer; findings: HumanLayerFinding.IFinding[] } {
    const layer: HumanLayerReport.ILayer = HumanLayerReport.blank(person, site.chain, site.layer);
    const findings: HumanLayerFinding.IFinding[] = [];
    const found: ISections | ISkip = locate(site, generated, reference);

    if ("status" in found) {
      layer.status = found.status;
      layer.reason = found.reason;

      return { layer, findings };
    }

    // The survey measure nearest this section gives the floor where the population barely varies.
    const survey: HumanPopulation.ISurvey = HumanPopulation.SURVEY[b.sex];
    const column: number = HumanPopulation.index(site.dimension);
    const floor: number = (HumanReferenceSurface.QUANTILE * survey.sd[column]!) / survey.mean[column]!;
    const spread: HumanLayerBasis.ISpread = HumanLayerBasis.spread(b, found.loop);
    const context: IContext = {
      person,
      site,
      layer,
      findings,
      sections: found,
      limitAt: radiusLimits(site, found, b, spread, (floor * G.perimeter(found.ref)) / (2 * Math.PI)),
      floor,
    };

    whole(context, spread);
    radial(context);
    folded(context);

    return { layer, findings };
  }
}

/** Address a reading to its layer and keep it. */
function push(c: IContext, reading: HumanLayerFinding.Reading): void {
  c.findings.push({ person: c.person, chain: c.site.chain, layer: c.site.layer, ...reading });
}

/**
 * Cut both meshes by the layer's plane and choose the two loops to compare.
 *
 * The ring only locates the generated section: the closed loop nearest it,
 * and where no emitted loop follows the ring the plane names no section of
 * this chain, which `test_human_layer_composition` owns. The reference loop is
 * the closed cut nearest the generated one. A layer whose loops split or merge
 * between the two (a thigh pair, an arm touching the trunk) is not compared.
 */
function locate(site: HumanLayerSite.ISite, generated: HumanLayerIndex, reference: HumanLayerIndex): ISections | ISkip {
  if (site.reach < HumanLayerSite.POLE) return { status: "pole", reason: `the layer's ring reaches ${site.reach.toFixed(2)} mm, a pole or tip` };

  const plane: HumanLayerPlane.IPlane = site.plane;
  const radius: number = 2 * site.reach + 30;
  const ring: V2[] = site.ring.map((p: V3): V2 => HumanLayerPlane.local(plane, p));
  const gAll: HumanLayerIndex.ILoop[] = generated.slice(plane, site.centre, radius);
  const gLoops: V2[][] = closed(gAll, plane);

  if (gLoops.length === 0) return { status: "open", reason: `the generated skin's section holds no closed loop (${gAll.length} open)` };

  const gi: number = G.argmin(gLoops.map((q: V2[]): number => G.meanDistance(ring, q)));
  const gen: V2[] = G.orient(gLoops[gi]!);
  const follow: number = G.meanDistance(ring, gen);

  if (follow > HumanLayerCompare.FOLLOW * site.reach + HumanAnatomyShared.HEAD)
    return { status: "missing", reason: `no generated loop follows the layer's ring (mean ${follow.toFixed(1)} mm from it)` };

  const rAll: HumanLayerIndex.ILoop[] = reference.slice(plane, site.centre, radius);
  const rClosed: HumanLayerIndex.ILoop[] = rAll.filter((l: HumanLayerIndex.ILoop): boolean => l.closed && l.points.length >= 3);

  if (rClosed.length === 0) return { status: "open", reason: `the reference's section holds no closed loop (${rAll.length} open)` };

  const rLoops: V2[][] = closed(rClosed, plane);
  const samples: V2[] = G.resample(gen, Math.max(HumanLayerCompare.MIN_SAMPLES, Math.ceil(G.perimeter(gen) / HumanLayerCompare.SAMPLE_STEP)));
  const ri: number = G.argmin(rLoops.map((q: V2[]): number => G.meanDistance(samples, q)));
  let ref: V2[] = rLoops[ri]!;
  let order: number[] = ref.map((_: V2, i: number): number => i);

  if (G.area(ref) < 0) {
    ref = [...ref].reverse();
    order = order.reverse();
  }

  // A loop of either side that lies inside the other's chosen loop and not its own has been split or merged.
  const merged: number = gLoops.filter((q: V2[], k: number): boolean => k !== gi && G.inside(ref, G.centroid(q)) && !G.inside(gen, G.centroid(q))).length;
  const split: number = rLoops.filter((q: V2[], k: number): boolean => k !== ri && G.inside(gen, G.centroid(q)) && !G.inside(ref, G.centroid(q))).length;

  if (merged > 0 || split > 0)
    return {
      status: "topology",
      reason:
        `${merged > 0 ? `the reference loop holds ${merged + 1} generated loops` : ""}${merged > 0 && split > 0 ? "; " : ""}` +
        `${split > 0 ? `the generated loop holds ${split + 1} reference loops` : ""} (generated ${gLoops.length} closed, reference ${rLoops.length} closed)`,
    };

  return { gen, ref, order, loop: rClosed[ri]!, samples };
}

/** The closed loops of a cut, in the plane's chart. */
function closed(loops: HumanLayerIndex.ILoop[], plane: HumanLayerPlane.IPlane): V2[][] {
  return loops
    .filter((l: HumanLayerIndex.ILoop): boolean => l.closed && l.points.length >= 3)
    .map((l: HumanLayerIndex.ILoop): V2[] => l.points.map((p: V3): V2 => HumanLayerPlane.local(plane, p)));
}

/**
 * The in-plane limit at each point of the reference loop: 2.576 population
 * standard deviations of the point's distance from its own section's
 * centroid, floored where the population barely varies; infinite where the
 * reference normal lies within 60 degrees of the plane's, since the cut then
 * grazes the skin and an in-plane distance says nothing.
 */
function radiusLimits(
  site: HumanLayerSite.ISite,
  sections: ISections,
  b: HumanLayerBasis.IBasis,
  spread: HumanLayerBasis.ISpread,
  floor: number,
): Float64Array {
  const out: Float64Array = new Float64Array(sections.ref.length);

  for (let j: number = 0; j < sections.ref.length; j++) {
    const k: number = sections.order[j]!;
    const a: number = sections.loop.a[k]!;
    const c: number = sections.loop.b[k]!;
    const s: number = sections.loop.s[k]!;
    const normal: V3 = A.unit([0, 1, 2].map((x: number): number => (1 - s) * b.normal[3 * a + x]! + s * b.normal[3 * c + x]!) as V3);
    const inPlane: number = Math.hypot(...A.reject(normal, site.plane.normal));

    out[j] = inPlane < HumanLayerCompare.OBLIQUE ? Infinity : Math.max(floor, HumanReferenceSurface.QUANTILE * spread.radius[k]!);
  }

  return out;
}

/** Girth, taut girth, area and centroid of the two sections. */
function whole(c: IContext, spread: HumanLayerBasis.ISpread): void {
  const { gen, ref }: ISections = c.sections;
  const Q: number = HumanReferenceSurface.QUANTILE;
  const plane: HumanLayerPlane.IPlane = c.site.plane;
  const gc: V2 = G.centroid(gen);
  const rc: V2 = G.centroid(ref);
  const at: V3 = HumanLayerPlane.world(plane, gc);
  const rG: number = G.perimeter(ref);
  const gG: number = G.perimeter(gen);
  const girthFloor: number = c.floor * rG;
  const radiusFloor: number = girthFloor / (2 * Math.PI);

  c.layer.girth = gG - rG;
  c.layer.ratio = gG / rG;

  const girthLimit: number = Math.max(girthFloor, Q * spread.girth);

  if (Math.abs(c.layer.girth) > girthLimit)
    push(c, { reading: "girth", phase: null, bearing: "whole", value: c.layer.girth, limit: girthLimit, mean: c.layer.girth, unit: "mm", at, detail: `generated ${gG.toFixed(1)}, reference ${rG.toFixed(1)}` });

  const gT: number = G.taut(gen);
  const rT: number = G.taut(ref);

  c.layer.taut = gT - rT;

  const tautLimit: number = Math.max(girthFloor, Q * spread.taut);

  if (Math.abs(c.layer.taut) > tautLimit)
    push(c, { reading: "taut girth", phase: null, bearing: "whole", value: c.layer.taut, limit: tautLimit, mean: c.layer.taut, unit: "mm", at, detail: `generated ${gT.toFixed(1)}, reference ${rT.toFixed(1)}` });

  const gA: number = Math.abs(G.area(gen));
  const rA: number = Math.abs(G.area(ref));

  c.layer.area = gA - rA;

  const areaLimit: number = Math.max(rG * radiusFloor, Q * spread.area);

  if (Math.abs(c.layer.area) > areaLimit)
    push(c, { reading: "area", phase: null, bearing: "whole", value: c.layer.area, limit: areaLimit, mean: c.layer.area, unit: "mm²", at, detail: `generated ${gA.toFixed(0)}, reference ${rA.toFixed(0)}, ratio ${(gA / rA).toFixed(3)}` });

  // A translation by d reads as a radius of plus and minus d, so the centroid's limit is the arclength mean of the radius limits.
  let weighted: number = 0;
  let weight: number = 0;

  for (let j: number = 0; j < ref.length; j++) {
    const length: number = Math.hypot(ref[(j + 1) % ref.length]![0] - ref[j]![0], ref[(j + 1) % ref.length]![1] - ref[j]![1]);

    if (Number.isFinite(c.limitAt[j]!)) {
      weighted += length * c.limitAt[j]!;
      weight += length;
    }
  }

  const centroidLimit: number = weight > 0 ? weighted / weight : Infinity;
  const shift: V2 = [gc[0] - rc[0], gc[1] - rc[1]];
  const finite: number[] = [...c.limitAt].filter(Number.isFinite);

  c.layer.centroid = Math.hypot(...shift);
  c.layer.shift = A.add(A.scale(plane.u, shift[0]), A.scale(plane.v, shift[1]));
  c.layer.limits = {
    girth: girthLimit,
    taut: tautLimit,
    area: areaLimit,
    centroid: centroidLimit,
    fold: c.layer.limits.fold,
    radius: [Math.min(...finite), Math.max(...finite)],
  };

  if (c.layer.centroid > centroidLimit)
    push(c, {
      reading: "centroid",
      phase: null,
      bearing: G.bearing(A.sub(at, HumanLayerPlane.world(plane, rc))),
      value: c.layer.centroid,
      limit: centroidLimit,
      mean: c.layer.centroid,
      unit: "mm",
      at,
      detail: "generated centroid moved from the reference's",
    });
}

/** The signed in-plane deviation of the generated loop from the reference round the loop, as runs beyond the limit. */
function radial(c: IContext): void {
  const { ref, samples }: ISections = c.sections;
  const plane: HumanLayerPlane.IPlane = c.site.plane;
  const centre: V3 = HumanLayerPlane.world(plane, G.centroid(c.sections.gen));
  const flags: Int8Array = new Int8Array(samples.length);
  const dev: Float64Array = new Float64Array(samples.length);
  const lim: Float64Array = new Float64Array(samples.length);

  samples.forEach((p: V2, i: number): void => {
    const d: HumanLayerPolygon.IDistance = G.signedDistance(ref, p);
    const l0: number = c.limitAt[d.segment]!;
    const l1: number = c.limitAt[(d.segment + 1) % ref.length]!;
    const limit: number = Number.isFinite(l0) && Number.isFinite(l1) ? l0 + (l1 - l0) * d.along : Infinity;

    dev[i] = d.distance;
    lim[i] = limit;

    if (!Number.isFinite(limit)) {
      c.layer.oblique++;

      return;
    }

    c.layer.radial.push(d.distance);

    if (Math.abs(d.distance) > limit) flags[i] = d.distance > 0 ? 1 : -1;
  });

  for (const run of G.runs(flags)) {
    let worst: number = run.from;
    let sum: number = 0;
    let count: number = 0;
    const phases: number[] = [];

    for (let i: number = run.from; ; i = (i + 1) % samples.length) {
      if (Math.abs(dev[i]!) - lim[i]! > Math.abs(dev[worst]!) - lim[worst]!) worst = i;
      sum += dev[i]!;
      count++;
      phases.push(HumanLayerSite.phase(c.site, HumanLayerPlane.world(plane, samples[i]!)));

      if (i === run.to) break;
    }

    const at: V3 = HumanLayerPlane.world(plane, samples[worst]!);

    push(c, {
      reading: run.sign > 0 ? "radius outside" : "radius inside",
      phase: G.arc(phases),
      bearing: G.bearing(A.sub(at, centre)),
      value: dev[worst]!,
      limit: lim[worst]!,
      mean: sum / count,
      unit: "mm",
      at,
      detail: `${count} of ${samples.length} samples`,
    });
  }
}

/** The excess concave turning of the generated loop beyond the reference's own. */
function folded(c: IContext): void {
  const reading: HumanLayerFold.IReading = HumanLayerFold.read({ person: c.person, site: c.site, gen: c.sections.gen, ref: c.sections.ref });

  c.layer.fold = reading.degrees;
  c.layer.limits.fold = reading.limit;

  if (reading.finding !== null) c.findings.push(reading.finding);
}
