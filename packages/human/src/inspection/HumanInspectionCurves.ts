import {
  type AutoMovieLoftContract,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieViewCurves,
  type AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { IHumanInspectionDocument } from "./IHumanInspectionDocument";
import { HumanInspectionPattern } from "./HumanInspectionPattern";
import { HumanInspectionSelection } from "./HumanInspectionSelection";
import { HumanInspectionParts } from "./HumanInspectionParts";
import { HumanInspectionClock } from "./HumanInspectionClock";
import { HumanInspectionOriginalLines } from "./HumanInspectionOriginalLines";
import { HumanInspectionCurveIdentity } from "./HumanInspectionCurveIdentity";

/** Points of each top section ring. */
const RING: number = 48;

/**
 * Each built part's view curves placed in 3D, in the person's millimetres converted to metres, one
 * colour per part.
 *
 * Front and side read the engine's original source evaluator in the actual axis frame, independently
 * of section/fullness success. Display polylines include every named knot, scalar extremum, finite
 * pole endpoint and declared station inside the actual part.stations domain, with subdivisions between them.
 * They are not the final loft's coefficient curves. A failed source edge is explicitly diagnosed
 * and withheld rather than connected across an invalid reading; other valid edges remain visible.
 * The axis reads its own source frames. Top rings use returned raw sections when present, otherwise
 * the original finite-fullness source through ViewSection.of/fault, without building a chain:
 * `top.<k>` names the front-positive knot index, and a missing non-pole section is diagnosed without
 * renumbering later rings. Ids are `human.construction.view.<part>/<front.pos|front.neg|side.pos|side.neg|top.<k>|axis>`.
 *
 * Colours are equal steps of the golden angle in hue, so neighbours in the part list differ.
 *
 * @evidence contracts/common.md#principled-implementation Reads the shared original-outline evaluator and actual axis independently of surviving sections. Top rings retain stable knot identity and use returned raw sections or the original fullness through the same public section owner and fault checks; neither implies whole-loft admission.
 * @evidence contracts/common.md#clear-and-simple-design Separates original edges/axis from section-owned top rings and returns display failures beside the curves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Copies no spline or pole algorithm, clamps no overshoot and replaces no failed edge with a section polyline.
 * @evidence contracts/common.md#meaningful-documentation States source versus final ownership, finite endpoint treatment, sampling and explicit missing support.
 * @evidence contracts/performance.md#efficient-algorithms Ordinary parts prepare four outlines per call; canonical guide records borrow their producer's existing preparations. Only requested new edges/axis are sampled. Requested top rings use 48 radius readings and original-only rings pay public section checks and arclength integration. Query costs remain with the actual scalar and axis owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses each prepared source edge across its readings and the source station union for the axis; no person generation occurs here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh curve/legend/diagnostic arrays proportional to display samples; borrowed parts and lofts stay unmutated and no renderer or global cache is retained.
 */
export namespace HumanInspectionCurves {
  /** A thrown source operation, separate from admission diagnostics and observer errors. */
  export interface ISourceFailure {
    /** Actual source part whose requested top preparation threw. */
    readonly part: string;
    /** Actual operation boundary, not an inferred geometric cause. */
    readonly phase: "top-source-preparation";
    /** Original thrown value retained for the caller's failure protocol. */
    readonly error: unknown;
  }

  /** Curve id namespace of the compared parts. */
  export const PREFIX: string = HumanInspectionCurveIdentity.PREFIX;

  /**
   * The curves and the legend.
   *
   * @param built The person's actual observed source parts.
   * @param patterns Requested original names; unrelated parts are not sampled.
   * @param selection Existing display admission and already retained ids; omitted means all curves for these parts.
   * @param observer Optional numeric/id phase observations; absent means no timing clock or metric payload, and observer exceptions remain separate timingErrors.
   * @returns Curves in metres, one legend entry per part with any curve and explicit display failures.
   *
   * @evidence contracts/common.md#principled-implementation Places shared source evaluations and source-axis origins independently of loft admission; raw top rings keep the front-positive knot index.
   * @evidence contracts/common.md#clear-and-simple-design Returns display failures separately from the untouched production diagnostics on built.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed reading withholds that edge and reports its cause rather than drawing across it or substituting surviving sections.
   * @evidence contracts/common.md#meaningful-documentation Names units, source/section ownership, stable ids and missing-support behavior.
   * @evidence contracts/performance.md#efficient-algorithms Collects K anchors per edge for the axis union, then samples only wanted new edges/axis in O(K log K) station ordering plus source reads. Unrequested tops perform no section evaluation; requested raw lookup scans returned sections, while original-only tops run their section checks before 48 radii.
   * @evidence contracts/performance.md#reuse-equivalent-work Ordinary sources prepare once per call and canonical guides borrow their actual prepared edges. Anchors serve the axis and retained ids are skipped. Raw sections are borrowed; original-only sections use the public fullness owner without a new person or loft. Shared canonical costs are not reclassified as free preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns fresh returned arrays and call-local prepared sources and station sets. Borrowed raw part/loft records remain unmutated.
   */
  export function of(built: HumanInspectionParts.IOutput, patterns: readonly string[] = ["*"], selection?: HumanInspectionSelection.ISelection, observer?: HumanInspectionClock.Observer): {
    curves: IHumanInspectionDocument.ICurve[];
    legend: { label: string; colour: string }[];
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
    topSources: Record<string, string>;
    timingErrors?: readonly string[];
    sourceFailures?: readonly ISourceFailure[];
  } {
    const clock: HumanInspectionClock.ISession | undefined = HumanInspectionClock.create(observer);
    const curves: IHumanInspectionDocument.ICurve[] = [];
    const legend: { label: string; colour: string }[] = [];
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const topSources: Record<string, string> = {};
    const sourceFailures: ISourceFailure[] = [];
    const k: number = built.scale / 1000;
    built.parts.forEach((p: HumanInspectionParts.IPart, index: number): void => {
      if (!HumanInspectionPattern.matches(p.name, patterns, "")) return;
      const sections: AutoMovieViewLoft.IStation[] = p.loft?.sections ?? [];
      const colour: string = HumanInspectionCurveIdentity.colour(index);
      const id: string = PREFIX + p.name + "/";
      const before: number = curves.length;
      const original: HumanInspectionParts.IGuides["source"] | null = p.guides?.source ?? p.part;
      if (original === null) {
        diagnostics.push({ producer: "view." + p.name, level: 2, contract: "source display", detail: "No available original guides or complete source" });
        return;
      }
      const attemptBefore: string | undefined = p.guides?.fullSourceAttempt().state;
      const bottom: number | undefined = original.stations[0];
      const top: number | undefined = original.stations.at(-1);
      if (bottom === undefined || top === undefined || !Number.isFinite(bottom) || !Number.isFinite(top) || bottom >= top) {
        diagnostics.push({ producer: "view." + p.name, level: 2, contract: "source display domain", detail: "Actual part.stations has no finite increasing physical domain" });
        return;
      }
      /** Keeps source support intact while displaying only the physical part interval. */
      const inside: (station: number) => boolean = (station: number): boolean => Number.isFinite(station) && station >= bottom && station <= top;
      const wanted: (suffix: string, view: "front" | "side" | "top" | "axis") => boolean = (suffix: string, view: "front" | "side" | "top" | "axis"): boolean => {
        const full: string = id + suffix;
        return selection === undefined || !selection.known.includes(full) && (view === "axis" ? selection.axis : selection.views.includes(view)) && selection.kinds.includes(HumanInspectionSelection.kind(full)) && HumanInspectionPattern.matches(full, selection.curves, "human.construction.") && !HumanInspectionPattern.matches(full, selection.curveHide, "human.construction.");
      };
      const sourceStarted: number | undefined = clock?.now();
      const source: AutoMovieViewCurves.IResult = p.guides?.curves ?? AutoMovieViewCurves.create(HumanInspectionParts.completeSource(p));
      clock?.emit(p.name, null, p.guides === undefined ? "outline-source-preparation" : "retained-canonical-outline-sources", p.guides === undefined ? clock.delta(sourceStarted) : null, source.curves.length, "ok");
      diagnostics.push(...source.diagnostics);
      const report: (detail: string) => void = (detail: string): void => {
        diagnostics.push({
          producer: "view." + p.name,
          level: 2,
          contract: "source display",
          detail,
        });
      };

      // Source-only observation reads the same effective scalar and full section admission,
      // at named knots only. It creates no chain or sampled coefficient surface.
      const needTop: boolean = original.front.positive.knots.some((knot: IAutoMovieViewPart.IKnot, n: number): boolean => inside(knot.station) && wanted("top." + n, "top"));
      const topSourceStarted: number | undefined = clock?.now();
      let direct: AutoMovieLoftViewSource.IResult | null = null;
      let topFailure: string | null = null;
      try { if (needTop && p.loft === null) direct = AutoMovieLoftViewSource.create(HumanInspectionParts.completeSource(p)); }
      catch (error: unknown) {
        sourceFailures.push({ part: p.name, phase: "top-source-preparation", error });
        topFailure = error instanceof Error ? error.stack ?? error.message : String(error);
        report("Complete top/fullness source failed: " + topFailure);
      }
      if (needTop) clock?.emit(p.name, null, "top-source-preparation", clock.delta(topSourceStarted), 1, topFailure !== null ? "failed" : p.loft !== null || direct?.source !== null && direct?.source !== undefined ? "ok" : "unavailable");
      topSources[p.name] = !needTop ? "not requested; original guides do not demand complete fullness" : topFailure !== null ? "complete fullness failed: " + topFailure : p.loft !== null ? "sections returned by raw loft; original diagnostics still apply" : direct?.source !== null && direct?.source !== undefined ? "original fullness values and ViewSection.of/fault; no full loft" : "unavailable original fullness";
      if (direct !== null) for (const fault of direct.diagnostics) report(fault.contract + ": " + fault.detail);
      const place: (o: readonly number[], d: readonly number[], r: number) => IHumanInspectionDocument.Point = (
        o: readonly number[],
        d: readonly number[],
        r: number,
      ): IHumanInspectionDocument.Point => [
        (o[0]! + d[0]! * r) * k,
        (o[1]! + d[1]! * r) * k,
        (o[2]! + d[2]! * r) * k,
      ];
      HumanInspectionOriginalLines.draw({ name: p.name, id, colour, original, source, bottom, top, wanted, inside, clock, place, curves, report });
      original.front.positive.knots.forEach(
        (knot: IAutoMovieViewPart.IKnot, n: number): void => {
          if (!wanted("top." + n, "top")) return;
          if (!inside(knot.station)) {
            clock?.emit(p.name, id + "top." + n, "outside-physical-domain", null, 0, "unavailable");
            return;
          }
          if (topFailure !== null) {
            clock?.emit(p.name, id + "top." + n, "blocked-by-top-source", null, 0, "unavailable");
            return;
          }
          const topStarted: number | undefined = clock?.now();
          let s: (typeof sections)[number] | undefined = sections.find(
            (section: (typeof sections)[number]): boolean =>
              section.station === knot.station,
          );
          const pole: boolean =
            ((original.pole === "bottom" || original.pole === "both") && knot.station === original.stations[0]) ||
            ((original.pole === "top" || original.pole === "both") && knot.station === original.stations.at(-1));
          if (s === undefined && !pole && direct?.source !== null && direct?.source !== undefined) {
            try {
              const value: AutoMovieLoftViewRead.IValues | string = AutoMovieLoftViewRead.values(direct.source, knot.station);
              if (typeof value === "string") throw new Error(value);
              if (!value.extents.every((e: number): boolean => e > 0) || !value.shoulders.every((r: number): boolean => r > 0 && r < 1)) throw new Error("Original extent or fullness is outside its admitted section domain");
              const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: value.extents as IAutoMovieViewPart.IQuarters<number> }, value.shoulders as IAutoMovieViewPart.IQuarters<number>);
              const fault: string | null = AutoMovieViewSection.fault(section);
              if (fault !== null) throw new Error(fault);
              s = { station: knot.station, frame: original.axis.at(knot.station), section };
            } catch (error: unknown) {
              clock?.emit(p.name, id + "top." + n, "section-evaluation-and-axis", clock.delta(topStarted), 1, "failed");
              clock?.span(p.name, id + "top." + n, topStarted, 0, "failed");
              report("top." + n + " at " + knot.station + ": " + (error instanceof Error ? error.stack ?? error.message : String(error)));
              return;
            }
          }
          if (s === undefined) {
            clock?.emit(p.name, id + "top." + n, "section-evaluation-and-axis", clock.delta(topStarted), 0, pole ? "pole" : "unavailable");
            clock?.span(p.name, id + "top." + n, topStarted, 0, pole ? "pole" : "unavailable");
            if (!pole)
              report(
                "top." +
                  n +
                  " at " +
                  knot.station +
                  " has no admitted raw fullness section",
              );
            return;
          }
          clock?.emit(p.name, id + "top." + n, "section-evaluation-and-axis", clock.delta(topStarted), 1, "ok");
          const points: IHumanInspectionDocument.Point[] = [];
          let radiusEvaluation: number = 0;
          let ringMaterialization: number = 0;
          for (let i: number = 0; i < RING; i++) {
            const phi: number = (2 * Math.PI * i) / RING;
            const radiusStarted: number | undefined = clock?.now();
            const r: number = AutoMovieViewSection.radius(s.section, phi)[0];
            radiusEvaluation += clock?.delta(radiusStarted) ?? 0;
            const pointStarted: number | undefined = clock?.now();
            const d: number[] = [0, 1, 2].map(
              (c: number): number =>
                Math.cos(phi) * s.frame.u[c]! + Math.sin(phi) * s.frame.v[c]!,
            );
            points.push(place(s.frame.origin, d, r));
            ringMaterialization += clock?.delta(pointStarted) ?? 0;
          }
          clock?.emit(p.name, id + "top." + n, "radius-evaluation", radiusEvaluation, RING, "ok");
          clock?.emit(p.name, id + "top." + n, "point-materialization", ringMaterialization, points.length, "ok");
          clock?.span(p.name, id + "top." + n, topStarted, points.length, "ok");
          curves.push({ id: id + "top." + n, closed: true, points, colour });
        },
      );
      if (p.guides !== undefined) topSources[p.name] += "; closure attempt before=" + attemptBefore + "; after=" + p.guides.fullSourceAttempt().state;
      if (curves.length !== before) legend.push({ label: p.name, colour });
    });
    return { curves, legend, diagnostics, topSources, timingErrors: clock?.errors, sourceFailures };
  }

  /** Existing public ID parser, owned independently of source evaluation. */
  export const view: typeof HumanInspectionCurveIdentity.view = HumanInspectionCurveIdentity.view;

  /** Existing public label/anchor policy, without any source acquisition. */
  export const label: typeof HumanInspectionCurveIdentity.label = HumanInspectionCurveIdentity.label;
}
