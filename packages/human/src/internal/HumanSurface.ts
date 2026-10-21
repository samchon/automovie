import type { HumanCurve } from "./HumanCurve";

/** Owned surface domains and boundary curves shared by neighboring Human charts. */
export namespace HumanSurface {
  /** One boundary authority; neighbors retain this same object and parameter. */
  export interface Boundary {
    /** Unique geometric boundary identity, independent of mesh sampling. */
    id: string;
    /** Declared independent parameter unit, such as radians or normalized. */
    unit: string;
    /** First canonical parameter value. */
    start: number;
    /** Last canonical parameter value; strictly greater than start. */
    end: number;
    /** Exact generating position in world millimetres. */
    evaluate: (parameter: number) => HumanCurve.Vector;
    /** World derivative in mm per declared parameter unit. */
    derivative: (parameter: number) => HumanCurve.Vector;
  }

  /** A chart edge consumes an authority in its declared local direction. */
  export interface Edge {
    /** The same actual curve object is shared by both incident charts. */
    curve: Boundary;
    /** Canonical direction relative to increasing local edge parameter. */
    orientation: 1 | -1;
  }

  /** A regular rectangular chart; openings require separate surrounding domains. */
  export interface Patch {
    /** Stable generating domain identity. */
    id: string;
    /** Independent U parameter range and declared derivative unit. */
    u: { start: number; end: number; unit: string };
    /** Independent V parameter range and declared derivative unit. */
    v: { start: number; end: number; unit: string };
    /** Position and exact first derivatives from the same generating formula. */
    jet: (u: number, v: number) => { positionMm: HumanCurve.Vector; derivativeU: HumanCurve.Vector; derivativeV: HumanCurve.Vector };
    /** Outward orientation relative to derivativeU cross derivativeV. */
    outwardSign: 1 | -1;
    /** Actual shared edge curves. A surface emitter supplies no weld or cap. */
    boundaries: { u0: Edge; u1: Edge; v0: Edge; v1: Edge };
    /** Explicit physical sample parameters from the common boundary owner.
     * Adjacent consumers share these exact numbers and boundary functions.
     * Omitted axes use the emitter's bounded dyadic interior sampling.
     */
    sampling?: { u?: readonly number[]; v?: readonly number[] };
  }
}
