import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyWarpBuild } from "./AutoMovieHumanBodyWarpBuild";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodySpecimen } from "./IAutoMovieHumanBodySpecimen";

/**
 * Existing curve deformation in calibration millimetres.
 * A chart station, a world point, a section centre and a rig pivot have
 * different meanings. Parent carry and all attached geometry read one point
 * map. Moving spline controls remains a quasi-interpolant for nonlinear maps.
 * The retained shape basis and row authority are not universalized here.
 */
export namespace AutoMovieHumanBodyWarpField {
  /** Existing horizontal affine field used to construct parent carry. */
  export interface IMap {
    /** World-X scale. */
    ax: number;
    /** World-Z scale. */
    az: number;
    /** World-X translation, calibration mm. */
    bx: number;
    /** World-Z translation, calibration mm. */
    bz: number;
  }

  /** One original exterior lip span. */
  export type ISpan = IAutoMovieHumanHermiteCurve["spans"][number];

  /** One world-point map at a source chain's declared local station. */
  export type IPointMap = (
    chain: string,
    station: number,
    point: readonly [number, number, number],
  ) => [number, number, number];

  /**
   * Regional adapter composed with the same parent's point map.
   * The unit factor converts a physical-mm target to calibration mm once.
   * Presence disables the legacy no-change fast path; the adapter must
   * actually consume its input, including the same boundary world function.
   */
  export type IExtension = (
    parent: IPointMap,
    calibrationPerPhysicalMm: number,
  ) => IPointMap;

  /** One built point field and its explicit construction addresses. */
  export interface IField {
    /** Existing horizontal construction map, including parent carry. */
    map: (chain: string, station: number) => IMap;
    /** Existing world-height construction function. */
    height: (chain: string, worldY: number) => number;
    /** Calibration/physical-mm conversion; null height uses source authoring stature. */
    calibrationPerPhysicalMm: number;
    /** Declared source courses and targets, observed again after event joins. */
    requests: readonly {
      name: string; chain: string; station: number; target: number;
    }[];
    /** Actual point map used by layers, poles and attached features. */
    point: IPointMap;
    /** Source curve addresses of declared measurement constraints. */
    courses: (chain: string) => readonly number[];
    /** Requests not realized under the stated constraint/attachment model. */
    diagnostics: IAutoMovieHumanBodyCalibration.IDeformationDiagnostic[];
    /** Chains retained by the current apply, owned by the producer rather than diagnostic text. */
    retained: Set<string>;
    /** Calibration stature; generate applies the final output scale once. */
    stature: number;
  }

  /** Build the retained-curve field; unsupported inputs remain unfinished. */
  export function build(
    specimen: IAutoMovieHumanBodyCalibration,
    body: IAutoMovieHumanBodyCalibration,
    params: IAutoMovieHumanParameters,
    inputs: IAutoMovieHumanBodySpecimen,
    extend?: IExtension,
  ): IField | null {
    return AutoMovieHumanBodyWarpBuild.build(
      specimen, body, params, inputs, extend,
    );
  }
}
