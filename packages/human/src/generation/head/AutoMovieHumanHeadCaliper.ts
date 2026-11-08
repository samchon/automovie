import { AutoMovieIllinois, AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieConstructionOutline, IAutoMovieConstructionView } from "@automovie/interface";

import { AutoMovieHumanHeadVault } from "../AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadTree } from "./AutoMovieHumanHeadTree";

/**
 * The retained posterior shape's reach closes the maximum cranial caliper,
 * not just the chord at its horizontal-tangent reference height.
 *
 * @evidence contracts/common.md#principled-implementation Uses the actual metre-declared posterior source, the engine's fixed-chart squared-distance candidates and separate closed-domain boundaries, following MIT Patrikalakis-Maekawa-Cho section 7.2.1 and ANSUR's moving posterior caliper tip.
 * @evidence contracts/common.md#clear-and-simple-design One scalar dimension is solved before the final mass and its neighbours are composed; two source basis records share the existing linear reach family.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private polynomial evaluator, mesh read, reference fit, endpoint clamp or change to the independent public length.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the selected posterior cranial domain, verified fixed chart, numerical candidates and unfinished whole anatomical/visual acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Prepares two bare mass sources once, then only a scalar original curve and bounded-degree distance candidates per reach iteration; no loft, feature or full figure is rebuilt inside the solve.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the original source partition, pole parameter and linear reach basis across actual bracket/root trials.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All temporary views, prepared curves and candidate arrays are call-owned; only the resulting layout survives.
 */
export namespace AutoMovieHumanHeadCaliper {
  /** One actual source and the identical metre declaration that produced it. */
  type Source = { part: IAutoMovieViewPart; view: IAutoMovieConstructionView };

  /**
   * Close L on the actual posterior cranial source after tragion placement.
   * The domain runs from that retained cranial-base station to the crown;
   * it excludes the neck but is a construction region, not an anatomical
   * boundary equation supplied by the caliper protocol. Numerical roots are
   * candidates, not an interval certificate.
   *
   * @evidence contracts/common.md#principled-implementation BackProfile and natural/shared-jet interpolation are linear in reach at fixed source knots, parameter and explicit-jet pattern. Two actual source records therefore define that family, and the engine reads every candidate and boundary in the same fixed calibration-mm graph.
   * @evidence contracts/common.md#clear-and-simple-design Returns a new layout with closed reach and its updated retained tape proxy, leaving original construction and independent observation to the existing callers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses an unsupported frame, changed partition/parameter/jet pattern, nonlinear range admission or failed distance query rather than sampling a replacement or selecting a named point as the maximum.
   * @evidence contracts/common.md#meaningful-documentation States the chosen domain, linear-family premise, fixed-chart verification, numerical boundary and zero-reach bracketing member that is never emitted as a part.
   * @evidence contracts/performance.md#efficient-algorithms Two source preparations precede the existing bounded bracket and at most64 bracketed Illinois trials on one dimension, followed by the actual maximum-distance residual admission.
   * @evidence contracts/performance.md#reuse-equivalent-work The bracket and solve share the same canonical basis and target; final composition builds and lofts the result once.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns only a caller-owned layout; temporary source families have no global registry or cache.
   */
  export function close(plan: IAutoMovieHumanHeadLayout, bottom?: number, faceExponent?: number): IAutoMovieHumanHeadLayout {
    if (!(Number.isFinite(plan.reach) && plan.reach > 0 && Number.isFinite(plan.length) && plan.length > 0)) throw new Error("Cranial caliper needs positive finite initial reach and public length");
    const base: Source = AutoMovieHumanHeadTree.source(AutoMovieHumanHeadMassPart.of(plan, faceExponent, bottom));
    const shifted: Source = AutoMovieHumanHeadTree.source(AutoMovieHumanHeadMassPart.of({ ...plan, reach: 2 * plan.reach }, faceExponent, bottom));
    const first: IAutoMovieViewPart.IOutline = base.part.front.negative;
    const second: IAutoMovieViewPart.IOutline = shifted.part.front.negative;
    if (first.range !== undefined || second.range !== undefined || JSON.stringify(first.parameter) !== JSON.stringify(second.parameter) || first.knots.length !== second.knots.length || first.knots.some((k: IAutoMovieViewPart.IKnot, i: number): boolean => {
      const other: IAutoMovieViewPart.IKnot = second.knots[i]!;
      return k.station !== other.station || k.site !== other.site || (k.jet === undefined) !== (other.jet === undefined) || (k.jet !== undefined && other.jet !== undefined && ((k.jet.first === null) !== (other.jet.first === null) || (k.jet.second === null) !== (other.jet.second === null)));
    })) throw new Error("Cranial caliper requires its unchanged posterior partition, parameter and explicit-jet pattern without nonlinear range admission");
    const lower: number = named(base.part.front.negative, "tragion");
    const upper: number = first.knots.at(-1)!.station;
    const glabella: number = named(base.part.front.positive, "glabella");
    fixed(base.view);
    const front: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(base.part.front.positive, { top: upper });
    if ("detail" in front) throw new Error(`Cranial glabella source: ${front.detail}`);
    const targetValue: number | string = AutoMovieViewOutline.value(front, glabella);
    if (typeof targetValue === "string") throw new Error(`Cranial glabella source: ${targetValue}`);

    const measured: Map<number, number> = new Map();
    const maximum: (reach: number) => number = (reach: number): number => {
      const previous: number | undefined = measured.get(reach);
      if (previous !== undefined) return previous;
      const share: number = (reach - plan.reach) / plan.reach;
      const curve: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({ ...first, knots: first.knots.map((k: IAutoMovieViewPart.IKnot, i: number): IAutoMovieViewPart.IKnot => ({ ...k, value: k.value + share * (second.knots[i]!.value - k.value), ...(k.jet === undefined ? {} : { jet: { first: k.jet.first === null ? null : k.jet.first + share * (second.knots[i]!.jet!.first! - k.jet.first), second: k.jet.second === null ? null : k.jet.second + share * (second.knots[i]!.jet!.second! - k.jet.second) } }) })) }, { top: upper });
      if ("detail" in curve) throw new Error(`Cranial posterior family: ${curve.detail}`);
      const candidates: number[] | string = AutoMovieViewOutline.distanceStations(curve, glabella, targetValue, [lower, upper]);
      if (typeof candidates === "string") throw new Error(`Cranial caliper: ${candidates}`);
      let longest: number = 0;
      for (const station of candidates) {
        const value: number | string = AutoMovieViewOutline.value(curve, station);
        if (typeof value === "string") throw new Error(`Cranial caliper reading: ${value}`);
        longest = Math.max(longest, Math.hypot(station - glabella, value - targetValue));
      }
      measured.set(reach, longest);
      return longest;
    };
    const lo: number = 0;
    let hi: number = 2 * plan.reach;
    for (let i: number = 0; maximum(hi) < plan.length && i < 64; i++) hi *= 2;
    if (!(Number.isFinite(hi) && maximum(lo) <= plan.length && maximum(hi) >= plan.length)) throw new Error("Public cranial caliper has no nonnegative finite reach bracket in the retained family");
    const reach: number | null = AutoMovieIllinois.root(
      (candidate: number): number => maximum(candidate) - plan.length,
      lo, hi, 128 * Number.EPSILON * plan.length, 64,
    );
    if (reach === null || !Number.isFinite(reach))
      throw new Error("Cranial caliper has no selected finite posterior-reach root");
    const actual: number = maximum(reach);
    if (!(Number.isFinite(actual) && Math.abs(actual - plan.length) <=
      128 * Number.EPSILON * Math.max(actual, plan.length)))
      throw new Error("Cranial caliper maximum-distance residual failed admission");
    const closed: IAutoMovieHumanHeadLayout = { ...plan, reach };
    closed.vault = AutoMovieHumanHeadVault.closing(closed);
    return closed;
  }

  /** Required runtime source site, not a guessed world-height query. */
  function named(outline: IAutoMovieViewPart.IOutline, site: string): number {
    const knot: IAutoMovieViewPart.IKnot | undefined = outline.knots.find((k: IAutoMovieViewPart.IKnot): boolean => k.site === site);
    if (knot === undefined) throw new Error(`Cranial source has no named ${site} station`);
    return knot.station;
  }

  /** Verify the actual declaration's fixed graph before interpreting a scalar distance in world space. */
  function fixed(view: IAutoMovieConstructionView): void {
    const axis: IAutoMovieConstructionView["axis"] = view.axis;
    if (axis.type !== "parallel" || axis.u.x !== 1 || axis.u.y !== 0 || axis.u.z !== 0 || axis.v.x !== 0 || axis.v.y !== 0 || axis.v.z !== 1) throw new Error("Cranial caliper requires the actual fixed X/Z chart");
    const lower: number = view.front.negative.knots.find((k: IAutoMovieConstructionOutline["knots"][number]): boolean => k.site === "tragion")!.station;
    const tail: IAutoMovieConstructionOutline["knots"] = axis.origin.x.knots.filter((k: IAutoMovieConstructionOutline["knots"][number]): boolean => k.station >= lower);
    if (axis.origin.x.parameter !== undefined || tail[0]?.station !== lower || tail.at(-1)?.station !== view.stations.at(-1) || !tail.every((k: IAutoMovieConstructionOutline["knots"][number]): boolean => k.value === tail[0]!.value && k.jet?.first === 0 && k.jet.second === 0)) throw new Error("Cranial caliper refuses a moving or unproved constant origin X");
    if (axis.origin.y.parameter !== undefined || axis.origin.y.range !== undefined || !axis.origin.y.knots.every((k: IAutoMovieConstructionOutline["knots"][number]): boolean => k.value === k.station && k.jet === undefined)) throw new Error("Cranial caliper requires identity origin Y");
    if (axis.origin.z.parameter !== undefined || !axis.origin.z.knots.every((k: IAutoMovieConstructionOutline["knots"][number]): boolean => k.value === 0 && (k.jet === undefined || (k.jet.first === 0 && k.jet.second === 0)))) throw new Error("Cranial caliper requires zero origin Z");
  }
}
