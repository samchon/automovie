import type {
  IAutoMovieConicArcField,
  IAutoMovieConicFieldJet,
  IAutoMovieViewConic,
  IAutoMovieViewSectionField,
} from "@automovie/interface";

import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieConicPreparation } from "./AutoMovieConicPreparation";
import { AutoMovieViewConic } from "./AutoMovieViewConic";
import { AutoMovieViewSectionReading } from "./AutoMovieViewSectionReading";

/**
 * One original section field's regular station and polar partials.
 *
 * Inputs must be the actual scalar jets at the same physical station in mm.
 * Effective shoulders already include their owner's departures and cap law.
 * This owner neither interpolates principal sections nor solves a girth. Finite
 * arithmetic is checked; a positive ray denominator is not a general
 * forward-error certificate. Physical poles and world/frame jets are separate.
 */
export namespace AutoMovieViewSectionField {
  /** Prepare original positive extents and effective shoulders at one station. */
  export function prepare(
    extents: readonly IAutoMovieViewSectionField.IStationJet[],
    shoulders: readonly IAutoMovieViewSectionField.IStationJet[],
  ): IAutoMovieViewSectionField.IPrepared | IAutoMovieConicArcField.IFailure {
    if (
      !Array.isArray(extents) ||
      !Array.isArray(shoulders) ||
      extents.length !== 4 ||
      shoulders.length !== 4 ||
      !extents.every(
        (jet: IAutoMovieViewSectionField.IStationJet): boolean =>
          stationJet(jet) && jet[0] > 0,
      ) ||
      !shoulders.every(
        (jet: IAutoMovieViewSectionField.IStationJet): boolean =>
          stationJet(jet) && jet[0] > 0 && jet[0] < 1,
      )
    )
      return failure(
        "A regular section field needs four finite positive extent 2-jets and four shoulder 2-jets inside (0,1).",
      );
    const ops: IAutoMovieConicFieldJet.IAlgebra<IAutoMovieConicFieldJet.IJet> =
      AutoMovieConicFieldJet.AD;
    const e: IAutoMovieConicFieldJet.IJet[] = extents.map(
      AutoMovieConicFieldJet.fromStation,
    );
    const r: IAutoMovieConicFieldJet.IJet[] = shoulders.map(
      AutoMovieConicFieldJet.fromStation,
    );
    const source: IAutoMovieViewConic.ICurve<IAutoMovieConicFieldJet.IJet> =
      AutoMovieConicPreparation.source(e, r);
    if (source.failure !== null) return failure(source.failure);
    return {
      kind: "prepared",
      source,
      geometry: AutoMovieViewConic.primal(ops, source),
    };
  }

  /** Read one polar ray and its regular-station radial 2-jet. */
  export function read(
    prepared: IAutoMovieViewSectionField.IPrepared,
    phi: number,
  ): IAutoMovieViewSectionField.IRadialJet | IAutoMovieConicArcField.IFailure {
    const fault: string | null = AutoMovieViewSectionReading.validate(prepared);
    if (fault !== null) return failure(fault);
    const ray: IAutoMovieViewConic.IRay | null = AutoMovieViewConic.read(
      prepared.geometry,
      phi,
    );
    if (ray === null)
      return failure(
        "The original section has no admitted numeric ray reading.",
      );
    return AutoMovieViewSectionReading.evaluate(prepared, ray);
  }

  /**
   * Read source2 from the caller's one numeric descriptor of this same
   * preparation.
   *
   * The caller must obtain ray from prepared.geometry, without another
   * geometry, phase rewrap or reflection. This keeps its primal point/direction
   * available to Cartesian consumers without repeating the numeric inverse.
   */
  export function readRay(
    prepared: IAutoMovieViewSectionField.IPrepared,
    ray: IAutoMovieViewConic.IRay,
  ): IAutoMovieViewSectionField.IRadialJet | IAutoMovieConicArcField.IFailure {
    const fault: string | null = AutoMovieViewSectionReading.validate(prepared);
    return fault === null
      ? AutoMovieViewSectionReading.evaluate(prepared, ray)
      : failure(fault);
  }
}

/** Convert numerical admission into the existing named failure record. */
function failure(detail: string): IAutoMovieConicArcField.IFailure {
  return { kind: "failure", detail };
}

/** Actual regular station jets contain three finite scalars. */
function stationJet(
  value: unknown,
): value is IAutoMovieViewSectionField.IStationJet {
  return Array.isArray(value) && value.length === 3;
}
