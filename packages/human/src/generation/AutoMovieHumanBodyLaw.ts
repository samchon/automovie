import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyCalibration } from "./AutoMovieHumanBodyCalibration";
import { AutoMovieHumanBodyWarp } from "./AutoMovieHumanBodyWarp";
import { AutoMovieHumanBodyWarpField } from "./AutoMovieHumanBodyWarpField";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyMorph } from "./IAutoMovieHumanBodyMorph";
import { AutoMovieHumanBodyMorphCalibration } from "./calibration/AutoMovieHumanBodyMorphCalibration";
import { AutoMovieHumanBodySpecimenCalibration } from "./calibration/AutoMovieHumanBodySpecimenCalibration";
import { AutoMovieHumanVermilionCalibration } from "./calibration/AutoMovieHumanVermilionCalibration";

/**
 * Shape law from the public parameters to the calibration the generator
 * lofts, in two steps: a shape basis, then the measurement law.
 *
 * The basis is `AutoMovieHumanBodyMorphCalibration`, the displacement per
 * unit of `body.controls.masculineFeminine` identified from the three other
 * reference specimens (see its fitter), weighted by the control's offset
 * from the specimen's own value. The measurement law
 * (`AutoMovieHumanBodyWarpField`, `AutoMovieHumanBodyWarp`) then brings the
 * tape girths, the crotch's share of the stature and the head size to the
 * inputs. The specimen's own parameters, or missing controls, return the
 * specimen calibration objects themselves (identical output, no
 * arithmetic). Stature stays the generator's separate uniform scale.
 *
 * Every calibrated quantity moves by the same basis displacement field, so
 * the skin, its construction curves, the apertures cut from it, the globes
 * behind them, its poles and the lip colour boundary keep their relations:
 *
 * - section control points move by the basis spline sampled at their
 *   Greville phases `2 pi j / N` (where control j of a uniform periodic
 *   cubic B-spline peaks), which displaces the curve by that spline's
 *   B-spline quasi-interpolant, exact for a displacement linear in phase;
 * - station slopes move by the basis slopes, so the Hermite rule between
 *   layers interpolates the displacement as it does the shape;
 * - the out-of-plane part becomes the layers' `lift`;
 * - aperture series, globe centres, poles and vermilion endpoints move by
 *   their own displacements; vermilion endpoint derivatives are kept.
 *
 * Event pinch phases, layer stations and frames are unchanged, so every
 * shared ring is still generated once by its parent and inherited.
 */
export namespace AutoMovieHumanBodyLaw {
  /** Calibrations for one parameter set. */
  export interface IOutput {
    /** Body chains, events, poles, apertures and globes in calibration mm. */
    body: IAutoMovieHumanBodyCalibration;

    /** Exterior lip boundary in the same frame. */
    vermilion: IAutoMovieHumanHermiteCurve;
  }

  /**
   * Calibrations for one parameter set.
   *
   * @param params Public input; the body controls listed in
   *   `AutoMovieHumanBodyWarpField`, `masculineFeminine` and the head
   *   length and cephalic index are read.
   * @returns The specimen calibrations themselves for the specimen's own
   *   inputs, otherwise new copies.
   */
  export function calibrate(params: IAutoMovieHumanParameters): IOutput {
    const morph: IAutoMovieHumanBodyMorph = AutoMovieHumanBodyMorphCalibration;
    const value: number | null = params.body.controls.masculineFeminine.value;
    const w: number = value === null ? 0 : value - morph.reference;
    const shaped: IOutput =
      w === 0
        ? {
            body: AutoMovieHumanBodyCalibration,
            vermilion: AutoMovieHumanVermilionCalibration,
          }
        : {
            body: displace(AutoMovieHumanBodyCalibration, morph, w),
            vermilion: lips(AutoMovieHumanVermilionCalibration, morph, w),
          };

    // Measurements last, so the girths, crotch height and head size reach
    // the person's inputs whatever the basis changed.
    const field: AutoMovieHumanBodyWarpField.IField | null =
      AutoMovieHumanBodyWarpField.build(
        AutoMovieHumanBodyCalibration,
        shaped.body,
        params,
        AutoMovieHumanBodySpecimenCalibration,
      );
    if (field === null) return shaped;
    const warped: AutoMovieHumanBodyWarp.IOutput = AutoMovieHumanBodyWarp.apply(
      shaped.body,
      field,
      shaped.vermilion.spans,
    );
    return {
      body: warped.body,
      vermilion: { ...shaped.vermilion, spans: warped.vermilion },
    };
  }
}

/**
 * Body calibration displaced by `w` units of a basis.
 *
 * @throws {Error} When the basis does not cover the calibration's chains,
 *   layers, apertures, eyes or poles one to one, which means it was fitted
 *   to another calibration and must be regenerated.
 */
function displace(
  base: IAutoMovieHumanBodyCalibration,
  morph: IAutoMovieHumanBodyMorph,
  w: number,
): IAutoMovieHumanBodyCalibration {
  const chains: Map<string, IAutoMovieHumanBodyMorph.IChain> = new Map(
    morph.chains.map(
      (
        c: IAutoMovieHumanBodyMorph.IChain,
      ): [string, IAutoMovieHumanBodyMorph.IChain] => [c.name, c],
    ),
  );
  return {
    ...base,
    chains: base.chains.map(
      (chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain => {
        const m: IAutoMovieHumanBodyMorph.IChain | undefined = chains.get(
          chain.name,
        );
        if (
          m === undefined ||
          m.layers.length !== chain.layers.length ||
          chain.basis !== "spline"
        )
          throw new Error(`Shape basis does not cover chain ${chain.name}`);
        return {
          ...chain,
          layers: chain.layers.map(
            (
              layer: IAutoMovieHumanLoftChain.ILayer,
              k: number,
            ): IAutoMovieHumanLoftChain.ILayer =>
              section(layer, m.layers[k]!, chain.order, m.order, w),
          ),
        };
      },
    ),
    apertures: base.apertures.map(
      (a: IAutoMovieHumanLoftAperture): IAutoMovieHumanLoftAperture => {
        const d: IAutoMovieHumanBodyMorph.IAperture | undefined =
          morph.apertures.find(
            (m: IAutoMovieHumanBodyMorph.IAperture): boolean =>
              m.name === a.name,
          );
        if (d === undefined || d.coefficients.length !== a.coefficients.length)
          throw new Error(`Shape basis does not cover aperture ${a.name}`);
        return {
          ...a,
          coefficients: a.coefficients.map(
            (c: number, i: number): number => c + w * d.coefficients[i]!,
          ),
        };
      },
    ),
    eyes: base.eyes.map(
      (
        e: IAutoMovieHumanBodyCalibration.IEye,
      ): IAutoMovieHumanBodyCalibration.IEye => {
        const d: IAutoMovieHumanBodyMorph.IEye | undefined = morph.eyes.find(
          (m: IAutoMovieHumanBodyMorph.IEye): boolean => m.side === e.side,
        );
        if (d === undefined)
          throw new Error(`Shape basis does not cover the ${e.side} eye`);
        return { ...e, centre: move(e.centre, d.centre, w) };
      },
    ),
    poles: base.poles.map(
      (
        p: IAutoMovieHumanBodyCalibration.IPole,
      ): IAutoMovieHumanBodyCalibration.IPole => {
        const d: IAutoMovieHumanBodyMorph.IPole | undefined = morph.poles.find(
          (m: IAutoMovieHumanBodyMorph.IPole): boolean =>
            m.chain === p.chain && m.end === p.end,
        );
        if (d === undefined)
          throw new Error(
            `Shape basis does not cover pole ${p.chain}:${p.end}`,
          );
        return { ...p, point: move(p.point, d.point, w) };
      },
    ),
  };
}

/**
 * One displaced principal layer.
 *
 * The basis spline of M control points is sampled at the N control
 * points' Greville phases. The layer's frame and station are unchanged.
 */
function section(
  layer: IAutoMovieHumanLoftChain.ILayer,
  d: IAutoMovieHumanBodyMorph.ILayer,
  N: number,
  M: number,
  w: number,
): IAutoMovieHumanLoftChain.ILayer {
  const coefficients: number[] = [...layer.coefficients];
  const slopes: number[] = [...layer.slopes];
  const lift: number[] = new Array<number>(N);
  const liftSlopes: number[] = new Array<number>(N);
  const height: number[] = [...d.lift, ...d.lift];
  const rise: number[] = [...d.liftSlopes, ...d.liftSlopes];
  for (let j: number = 0; j < N; j++) {
    const t: number = (2 * Math.PI * j) / N;
    const p: [number, number, number, number] =
      AutoMovieHumanSplineCurve.evaluate(d.coefficients, M, t);
    const q: [number, number, number, number] =
      AutoMovieHumanSplineCurve.evaluate(d.slopes, M, t);
    coefficients[j]! += w * p[0];
    coefficients[N + j]! += w * p[1];
    slopes[j]! += w * q[0];
    slopes[N + j]! += w * q[1];
    lift[j] =
      (layer.lift?.[j] ?? 0) +
      w * AutoMovieHumanSplineCurve.evaluate(height, M, t)[0];
    liftSlopes[j] =
      (layer.liftSlopes?.[j] ?? 0) +
      w * AutoMovieHumanSplineCurve.evaluate(rise, M, t)[0];
  }
  return { ...layer, coefficients, slopes, lift, liftSlopes };
}

/** Vermilion boundary with displaced span endpoints and unchanged derivatives. */
function lips(
  base: IAutoMovieHumanHermiteCurve,
  morph: IAutoMovieHumanBodyMorph,
  w: number,
): IAutoMovieHumanHermiteCurve {
  if (morph.vermilion.length !== base.spans.length)
    throw new Error("Shape basis does not cover the vermilion spans");
  return {
    ...base,
    spans: base.spans.map(
      (
        span: IAutoMovieHumanHermiteCurve["spans"][number],
        i: number,
      ): IAutoMovieHumanHermiteCurve["spans"][number] => ({
        ...span,
        start: move(span.start, morph.vermilion[i]!.start, w),
        end: move(span.end, morph.vermilion[i]!.end, w),
      }),
    ),
  };
}

/** `p + w d`. */
function move(
  p: readonly [number, number, number],
  d: readonly [number, number, number],
  w: number,
): [number, number, number] {
  return [p[0] + w * d[0], p[1] + w * d[1], p[2] + w * d[2]];
}
