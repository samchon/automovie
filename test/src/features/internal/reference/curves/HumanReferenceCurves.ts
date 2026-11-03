import { HumanReferenceCurveGeometry } from "./HumanReferenceCurveGeometry";
import { HumanReferenceCurveLimbs } from "./HumanReferenceCurveLimbs";
import type { HumanReferenceCurvePack } from "./HumanReferenceCurvePack";
import type { HumanReferenceCurveQuality } from "./HumanReferenceCurveQuality";
import { HumanReferenceCurveSections } from "./HumanReferenceCurveSections";
import { HumanReferenceCurveStore } from "./HumanReferenceCurveStore";

/**
 * The private reference curve pack: the reference bodies' measured section
 * curves, cubic Hermite loops fitted by Recovery to the reference meshes, read
 * from the ignored `.references/curves/<id>/` directory when the checkout
 * holds it. The pack holds no data in the repository; every reader answers
 * empty when it is absent.
 *
 * Two families: horizontal sections along +Y (`sections/<region>/*.json`,
 * listed by `index.json`) and, for f1, sections normal to the limb and digit
 * bones (`limbs/<bone>/*.json`, listed by `limbs/index.json`).
 *
 * Every curve carries the pack's quality audit (`ILoop.quality`: ok, suspect
 * or broken, with reasons and places, rules in each pack README); the
 * readers return only `ok` curves unless the query asks for more.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 * Each span is a cubic Hermite segment whose derivatives are per phase
 * millimetre; span `i` covers `phaseIntervals[i]` of the curve's phase.
 *
 * This namespace is the single entry point; the work lives in the
 * `HumanReferenceCurve*` pieces it delegates to.
 */
export namespace HumanReferenceCurves {
  /** A point or vector, mm. */
  export type V3 = HumanReferenceCurveGeometry.V3;

  /** One cubic Hermite span: end positions and their derivatives per phase mm. */
  export type ISpan = HumanReferenceCurveGeometry.ISpan;

  /** One fitted section curve as Recovery saved it. */
  export type ICurve = HumanReferenceCurveGeometry.ICurve;

  /** One curve of a section with its identity in the source and its audit. */
  export type ILoop = HumanReferenceCurvePack.ILoop;

  /** A curve's audit status: `broken` and `suspect` curves are left out by default. */
  export type Status = HumanReferenceCurveQuality.Status;

  /** Which audit statuses a reader keeps: `ok` alone when absent, `all` for every curve. */
  export type QualityFilter = HumanReferenceCurveQuality.Filter;

  /** One reason a curve is not ok. */
  export type IQualityReason = HumanReferenceCurveQuality.IReason;

  /** A curve's audit: its worst severity and the reasons. */
  export type IQuality = HumanReferenceCurveQuality.IQuality;

  /** The audit's method, limits and per-region totals. */
  export type IAudit = HumanReferenceCurveQuality.IAudit;

  /** One horizontal section, holding the loops of the requested regions. */
  export type ISection = HumanReferenceCurvePack.ISection;

  /** One region file of the horizontal sections, as listed by the index. */
  export type IFile = HumanReferenceCurvePack.IFile;

  /** One section's entry in the index. */
  export type ISectionEntry = HumanReferenceCurvePack.ISectionEntry;

  /** A person's horizontal-section index. */
  export type IIndex = HumanReferenceCurvePack.IIndex;

  /** A filter over the horizontal sections. */
  export type IQuery = HumanReferenceCurvePack.IQuery;

  /** One station of a limb family: a plane normal to a bone and its loops. */
  export type IStation = HumanReferenceCurvePack.IStation;

  /** One limb family file listed by the limb index. */
  export type ILimbFamily = HumanReferenceCurvePack.ILimbFamily;

  /** One pack file of a limb family. */
  export type ILimbFile = HumanReferenceCurvePack.ILimbFile;

  /** The index's summary of one limb station, without its curves. */
  export type IStationRow = HumanReferenceCurvePack.IStationRow;

  /** A source file without curves, copied unchanged into the pack. */
  export type IRecord = HumanReferenceCurvePack.IRecord;

  /** The limb-section index. */
  export type ILimbIndex = HumanReferenceCurvePack.ILimbIndex;

  /** A filter over one limb family's stations. */
  export type IStationQuery = HumanReferenceCurvePack.IStationQuery;

  /** The references the pack can hold. */
  export const IDS: readonly string[] = HumanReferenceCurveStore.IDS;

  /** Directory of a reference's curve pack. */
  export function directory(id: string): string {
    return HumanReferenceCurveStore.directory(id);
  }

  /** The references whose pack is present in this checkout. */
  export function available(): string[] {
    return HumanReferenceCurveStore.available();
  }

  /** A reference's horizontal-section index, read once; undefined when absent. */
  export function index(id: string): IIndex | undefined {
    return HumanReferenceCurveSections.index(id);
  }

  /** The region labels present in a reference's pack, sorted. */
  export function regions(id: string): string[] {
    return HumanReferenceCurveSections.regions(id);
  }

  /**
   * The horizontal sections in a height range and region set, in height
   * order, reading only the region files that overlap the query. Only `ok`
   * curves unless `query.quality` asks for more; a section left with no
   * curve is omitted. Empty when the pack is absent.
   */
  export function sections(id: string, query: IQuery = {}): ISection[] {
    return HumanReferenceCurveSections.sections(id, query);
  }

  /** The f1 limb-section index; undefined when absent. */
  export function limbIndex(id: string): ILimbIndex | undefined {
    return HumanReferenceCurveLimbs.index(id);
  }

  /**
   * The stations of one limb family (by name, e.g. `arm_l-v2`) in a station
   * range. Each station keeps only its `ok` loops unless `query.quality`
   * asks for more; stations themselves are all returned.
   */
  export function stations(id: string, family: string, query: IStationQuery = {}): IStation[] {
    return HumanReferenceCurveLimbs.stations(id, family, query);
  }

  /** Total phase length of a curve, the sum of its phase widths (about its arc length, mm). */
  export function length(curve: ICurve): number {
    return HumanReferenceCurveGeometry.length(curve);
  }

  /**
   * A curve's position at a phase in [0, length]; a closed curve's phase
   * wraps, an open curve's is clamped. Interior span seams take the
   * following span.
   */
  export function evaluate(curve: ICurve, phase: number): V3 {
    return HumanReferenceCurveGeometry.evaluate(curve, phase);
  }

  /**
   * A curve's derivative with respect to phase at a phase, located as
   * `evaluate` does: mm per phase mm, so its length is about 1 where the
   * phase follows arc length.
   */
  export function derivative(curve: ICurve, phase: number): V3 {
    return HumanReferenceCurveGeometry.derivative(curve, phase);
  }

  /**
   * A curve as a polyline: every span sampled at `samples` equal steps of its
   * local parameter. A closed curve does not repeat its first point.
   */
  export function polyline(curve: ICurve, samples: number = 8): V3[] {
    return HumanReferenceCurveGeometry.polyline(curve, samples);
  }
}
