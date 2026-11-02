import { AutoMovieHumanHeadCranialSupport as Cranial } from "./AutoMovieHumanHeadCranialSupport";
import type { AutoMovieHumanHeadDefinition as D } from "./AutoMovieHumanHeadDefinition";
import type { AutoMovieHumanHeadConstruction as H } from "./AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadIdentitySolve as S } from "./AutoMovieHumanHeadIdentitySolve";
import { AutoMovieHumanHeadLandmarks as L } from "./AutoMovieHumanHeadLandmarks";

/** Authored dimensional goals observed on the actual composed analytic head. */
export namespace AutoMovieHumanHeadClosure {
  /** Residuals and the independently measurable final tube section. */
  export interface IOutput {
    /** Every final achieved-minus-requested dimension. */
    residuals: S.IResidual[];
    /** Tube section's interior axis point. */
    neckOrigin: L.IPoint;
    /** Tube section's unit normal. */
    neckNormal: L.IPoint;
  }
  /**
   * Adjust shape keys by measured skin dimensions, preserving the vertex and
   * the supplied neck ring. Each round measures all constraints before any
   * update. Sampling is numerical quadrature only and changes no emitted
   * section, curve or triangle count.
   */
  export function solve(
    plan: H.ILayout,
    inputs: H.IInputs,
    point: (station: number, theta: number, side?: 1 | -1) => L.IPoint,
    rebuild: () => void,
    regions: () => L.IRegions,
    neckStation: () => number,
    addresses: () => D.IAddresses,
  ): IOutput {
    let measured!: L.IMeasures;
    let tape: Cranial.IReading = { circumference: NaN, station: NaN, origin: [NaN,NaN,NaN], normal: [NaN,NaN,NaN] };
    const k: number = plan.scale;
    const h: H.IInputs["head"] = inputs.head;
    const key = (name: keyof L.IMeasures, target: number, multiply: (factor: number) => void): S.IConstraint => ({ name, target: target * k, measure: (): number => measured[name], multiply });
    const constraints: S.IConstraint[] = [
      { name: "circumference", target: h.circumference * k, measure: (): number => tape.circumference, multiply: (factor: number): void => { plan.vault = Cranial.increment(plan.vault, tape.circumference, tape.circumference * factor, Cranial.weight(tape.station, plan.cranialLower!, plan.cranialUpper!)); } },
      key("height", h.height, (f: number): void => { plan.menton = plan.vertex - (plan.vertex - plan.menton) * f; }),
      key("length", h.length, (f: number): void => { plan.length *= f; }),
      key("breadth", h.length * h.cephalicIndex / 100, (f: number): void => { plan.breadth *= f; }),
      key("faceHeight", h.faceHeight, (f: number): void => { const dy: number = (plan.nasion - plan.menton) * (f - 1); plan.nasion += dy; plan.eye += dy; }),
      key("faceWidth", h.faceWidth, (f: number): void => { plan.faceWidth *= f; }),
      key("mandibularWidth", h.mandibularWidth, (f: number): void => { plan.mandibularWidth *= f; }),
      key("noseHeight", h.face.nose.height, (f: number): void => { const dy: number = (plan.nasion - plan.subnasale) * (1 - f); plan.subnasale += dy; plan.tip += dy; plan.stomion += dy; }),
      key("noseProtrusion", h.face.nose.protrusion, (f: number): void => { plan.noseLead *= f; }),
      key("noseWidth", h.face.nose.width, (f: number): void => { plan.noseWidth *= f; }),
      key("upperLip", h.face.mouth.upperVermilionHeight, (f: number): void => { plan.upperLip *= f; }),
      key("lowerLip", h.face.mouth.lowerVermilionHeight, (f: number): void => { plan.lowerLip *= f; }),
      key("neck", inputs.neck, (f: number): void => { plan.neck.radius *= f; }),
    ];
    const residuals: S.IResidual[] = S.solve(constraints, (): void => {
      rebuild();
      const median: L.IPoint[] = [];
      const rings: L.IPoint[][] = [];
      const cranial: Cranial.ICourse[] = [];
      const rows: number = Math.ceil((plan.vertex - plan.y0) / (0.5 * k));
      for (let i: number = 0; i <= rows; i++) {
        const s: number = plan.vertex - (plan.vertex - plan.y0) * i / rows;
        median.push(point(s, 0));
        const vault: boolean = s >= plan.cranialLower! && s <= plan.cranialUpper!;
        if (!vault && i % 4 !== 0 && Math.abs(s - plan.subnasale) > 16 * k) continue;
        const ring: L.IPoint[] = [];
        for (let j: number = 0; j <= 64; j++) ring.push(point(s, Math.PI * j / 64));
        rings.push(ring);
        if (vault) { const full: L.IPoint[] = [...ring]; for (let j: number = 63; j > 0; j--) full.push(point(s, Math.PI * j / 64, -1)); cranial.push({station:s, tilt:0, points:full}); }
      }
      const course: L.IPoint[] = Array.from({ length: 65 }, (_: unknown, i: number): L.IPoint => point(neckStation(), Math.PI * i / 64));
      measured = L.measure(median, rings, regions(), course, addresses());
      tape = Cranial.measure(cranial);
    });
    return { residuals, neckOrigin: [measured.neckX, measured.neckY, 0], neckNormal: [measured.neckNX, measured.neckNY, 0] };
  }
}
