import { AutoMovieHumanBodyGirth } from "./AutoMovieHumanBodyGirth";
import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyAttachment as Attachment } from "./AutoMovieHumanBodyAttachment";
import { AutoMovieHumanBodyWarpLayers } from "./AutoMovieHumanBodyWarpLayers";
import { AutoMovieHumanBodyWarpPoint as P } from "./AutoMovieHumanBodyWarpPoint";
import type { AutoMovieHumanBodyWarpField } from "./AutoMovieHumanBodyWarpField";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Transport retained geometry by one point map at source chart addresses.
 * Nonlinear control movement remains a quasi-interpolant between principal
 * layers. A declared plain-cubic course is inserted exactly before mapping;
 * that declared course is not asserted to remain a geometric extremum.
 */
export namespace AutoMovieHumanBodyWarp {
  /** Actual moved calibration and exterior lip spans. */
  export interface IOutput {
    /** Final calibration in mm, including explicit unresolved requests. */
    body: IAutoMovieHumanBodyCalibration;
    /** Exterior lip curve in the same calibration frame. */
    vermilion: AutoMovieHumanBodyWarpField.ISpan[];
  }

  /** Apply the same field to layers, source addresses and attached features. */
  export function apply(
    body: IAutoMovieHumanBodyCalibration,
    field: AutoMovieHumanBodyWarpField.IField,
    vermilion: AutoMovieHumanBodyWarpField.ISpan[],
  ): IOutput {
    const named: Map<string, IAutoMovieHumanLoftChain> = new Map(
      body.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] =>
          [c.name, c],
      ),
    );
    const bindings: Map<string, Attachment.IChart | undefined> = new Map();
    const bind: (
      chain: IAutoMovieHumanLoftChain, p: P.V, name: string,
    ) => Attachment.IChart | undefined = (
      chain: IAutoMovieHumanLoftChain, p: P.V, name: string,
    ): Attachment.IChart | undefined => {
      const key: string = chain.name + "/" + p.join(",");
      if (!bindings.has(key))
        bindings.set(key, Attachment.bind(chain, p, name, field.diagnostics));
      return bindings.get(key);
    };
    const lipEnd: (
      p: P.V, d: P.V,
    ) => [P.V, P.V] = (p: P.V, d: P.V): [P.V, P.V] => {
      const chain: IAutoMovieHumanLoftChain = named.get("head.lower")!;
      if (rejected.has(chain.name)) return [p, d];
      const chart: Attachment.IChart | undefined = bind(chain, p, "vermilion");
      if (chart === undefined) return [p, d];
      const moved: P.V = field.point(chain.name, chart.station, p);
      const direction: P.V = P.direction(
        field.point, chain.name, chart.station, p, Attachment.rate(chart, d), d,
      );
      if ([...moved, ...direction].every(Number.isFinite)) return [moved, direction];
      field.diagnostics.push({ name: "vermilion", status: "invalid",
        detail: "The attached lip point or direction overflows; source endpoint is retained." });
      return [p, d];
    };
    const rejected: Set<string> = field.retained;
    rejected.clear();
    const outputs: AutoMovieHumanBodyWarpLayers.IOutput[] = body.chains.map(
      (chain: IAutoMovieHumanLoftChain): AutoMovieHumanBodyWarpLayers.IOutput =>
        AutoMovieHumanBodyWarpLayers.apply(chain, field),
    );
    for (const output of outputs)
      if (!output.valid) rejected.add(output.chain.name);
    const diagnostics: IAutoMovieHumanBodyCalibration.IDeformationDiagnostic[] =
      [...(body.deformationDiagnostics ?? [])];
    const result: IOutput = {
      body: {
        ...body,
        stature: field.stature,
        deformationDiagnostics: diagnostics,
        chains: outputs.map(
          (o: AutoMovieHumanBodyWarpLayers.IOutput): IAutoMovieHumanLoftChain => o.chain,
        ),
        ...(body.anchors === undefined ? {} : {
          anchors: Object.fromEntries(Object.entries(body.anchors).map(
            ([name, source]: [string, IAutoMovieHumanBodyCalibration.IAnchor]):
              [string, IAutoMovieHumanBodyCalibration.IAnchor] =>
              [name, rejected.has(source.chain) ? source : address(body, field, source)],
          )),
        }),
        poles: body.poles.map(
          (p: IAutoMovieHumanBodyCalibration.IPole):
            IAutoMovieHumanBodyCalibration.IPole => {
            if (rejected.has(p.chain)) return p;
            const chain: IAutoMovieHumanLoftChain = named.get(p.chain)!;
            const s: number = p.end === "top"
              ? chain.layers[chain.layers.length - 1]!.y
              : chain.layers[0]!.y;
            const point: P.V = field.point(p.chain, s, p.point);
            if (point.every(Number.isFinite)) return { ...p, point };
            field.diagnostics.push({ name: p.chain + ".pole", status: "invalid",
              detail: "The transported pole overflows; its source point is retained." });
            return p;
          },
        ),
        apertures: body.apertures.map(
          (a: IAutoMovieHumanLoftAperture): IAutoMovieHumanLoftAperture =>
            rejected.has(a.base ?? "head.middle") ? a :
              aperture(a, named.get(a.base ?? "head.middle")!, field, bind),
        ),
        eyes: body.eyes.map(
          (e: IAutoMovieHumanBodyCalibration.IEye):
            IAutoMovieHumanBodyCalibration.IEye => {
            const chain: IAutoMovieHumanLoftChain = named.get("head.middle")!;
            const chart: Attachment.IChart | undefined =
              bind(chain, e.centre, "globe." + e.side);

            // This retained sphere keeps its calibration radius, separately
            // from the nonuniform skin map. Independent biometric eye sizing
            // is not implemented by scaling that radius along a skin axis.
            if (chart === undefined || rejected.has(chain.name)) return e;
            const centre: P.V = field.point(chain.name, chart.station, e.centre);
            if (centre.every(Number.isFinite)) return { ...e, centre };
            field.diagnostics.push({ name: "globe." + e.side, status: "invalid",
              detail: "The attached rigid sphere centre overflows; source sphere is retained." });
            return e;
          },
        ),
      },
      vermilion: vermilion.map(
        (span: AutoMovieHumanBodyWarpField.ISpan): AutoMovieHumanBodyWarpField.ISpan => {
          const start: [P.V, P.V] = lipEnd(span.start, span.startDerivative);
          const stop: [P.V, P.V] = lipEnd(span.end, span.endDerivative);
          return {
            ...span, start: start[0], startDerivative: start[1],
            end: stop[0], endDerivative: stop[1],
          };
        },
      ),
    };
    diagnostics.push(...field.diagnostics);
    return result;
  }

  /**
   * Source address carried by the same rule as its layer's station.
   * Framed charts retain their station. An unframed address adds the
   * world-Y displacement of its source section axis to its source station,
   * exactly as layer transport does. Neither address is an estimated joint.
   */
  export function address(
    body: IAutoMovieHumanBodyCalibration,
    field: AutoMovieHumanBodyWarpField.IField,
    source: IAutoMovieHumanBodyCalibration.IAnchor,
  ): IAutoMovieHumanBodyCalibration.IAnchor {
    const chain: IAutoMovieHumanLoftChain =
      body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === source.chain)!;
    const axis: P.V = Loft.axis(chain, source.station);
    return {
      chain: source.chain,
      station: chain.layers.some(
        (l: IAutoMovieHumanLoftChain.ILayer): boolean => l.frame !== undefined,
      ) ? source.station : source.station +
        (field.point(chain.name, source.station, axis)[1] - axis[1]),
    };
  }

  /** Record actual post-join course residuals without turning them into admission gates. */
  export function observeCourses(
    finalBody: IAutoMovieHumanBodyCalibration,
    source: IAutoMovieHumanBodyCalibration,
    field: AutoMovieHumanBodyWarpField.IField,
  ): IAutoMovieHumanBodyCalibration {
    const diagnostics: IAutoMovieHumanBodyCalibration.IDeformationDiagnostic[] =
      [...(finalBody.deformationDiagnostics ?? [])];
    for (const request of field.requests) {
      const retained: boolean = field.retained.has(request.chain);
      const moved: IAutoMovieHumanBodyCalibration.IAnchor =
        retained ? request : address(source, field, request);
      const chain: IAutoMovieHumanLoftChain | undefined = finalBody.chains.find(
        (c: IAutoMovieHumanLoftChain): boolean => c.name === moved.chain,
      );
      const inside: boolean = chain !== undefined && Number.isFinite(moved.station) &&
        moved.station >= chain.layers[0]!.y &&
        moved.station <= chain.layers[chain.layers.length - 1]!.y;
      const achieved: number = !inside ? NaN :
        AutoMovieHumanBodyGirth.at(chain!, moved.station);
      const finite: boolean = Number.isFinite(request.target) &&
        Number.isFinite(achieved) && Number.isFinite(achieved - request.target);
      diagnostics.push(finite ? {
        name: request.name, status: "observed", requested: request.target,
        achieved, residual: achieved - request.target,
        detail: "Actual post-join declared course in calibration mm; not a clinical extremum.",
      } : {
        name: request.name, status: "unresolved",
        ...(Number.isFinite(request.target) ? { requested: request.target } : {}),
        detail: "The post-join declared course could not be measured.",
      });
    }
    return { ...finalBody, deformationDiagnostics: diagnostics };
  }
  /**
   * Local first-order margin/pocket transport, using one bound chart.
   * forward is a pushed-forward extrusion direction, not a surface normal.
   * depth remains the existing calibration-mm inside-test tolerance;
   * pocket is a geometric length and follows the local extrusion stretch.
   * A rigid globe radius remains separate and is seated by Eyelid.seat.
   */
  function aperture(
    a: IAutoMovieHumanLoftAperture,
    chain: IAutoMovieHumanLoftChain,
    field: AutoMovieHumanBodyWarpField.IField,
    bind: (
      chain: IAutoMovieHumanLoftChain, p: P.V, name: string,
    ) => Attachment.IChart | undefined,
  ): IAutoMovieHumanLoftAperture {
    const w: number = 2 * a.order + 1;
    const centre: P.V = [
      a.coefficients[0]!, a.coefficients[w]!, a.coefficients[2 * w]!,
    ];
    const chart: Attachment.IChart | undefined = bind(chain, centre, a.name);
    if (chart === undefined) return a;
    const moveDirection: (d: P.V) => P.V = (d: P.V): P.V =>
      P.direction(
        field.point, chain.name, chart.station, centre, Attachment.rate(chart, d), d,
      );
    const forward: P.V = moveDirection(a.forward);
    const stretch: number = Math.hypot(...forward);
    if (!(Number.isFinite(stretch) && stretch > 0)) {
      field.diagnostics.push({
        name: a.name, status: "unresolved",
        detail: "Opening extrusion loses a finite direction; margin is retained.",
      });
      return a;
    }
    const moved: P.V = field.point(chain.name, chart.station, centre);
    const coefficients: number[] = new Array<number>(3 * w).fill(0);
    for (let k: number = 0; k < 3; k++) coefficients[k * w] = moved[k]!;
    for (let mode: number = 1; mode < w; mode++) {
      const d: P.V = moveDirection([
        a.coefficients[mode]!,
        a.coefficients[w + mode]!,
        a.coefficients[2 * w + mode]!,
      ]);
      for (let k: number = 0; k < 3; k++) coefficients[k * w + mode] = d[k]!;
    }
    if (![...coefficients, ...(a.pocket === undefined ? [] :
      [a.pocket * stretch])].every(Number.isFinite)) {
      field.diagnostics.push({ name: a.name, status: "invalid",
        detail: "The attached opening overflows; source opening is retained." });
      return a;
    }
    return {
      ...a, coefficients, forward: P.scale(forward, 1 / stretch),
      ...(a.pocket === undefined ? {} : { pocket: a.pocket * stretch }),
    };
  }
}
