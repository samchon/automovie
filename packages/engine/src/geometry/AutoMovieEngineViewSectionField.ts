import type {
  IAutoMovieConicArcField,
  IAutoMovieConicFieldJet,
  IAutoMovieViewConic,
  IAutoMovieViewSectionField,
} from "@automovie/interface";

import { AutoMovieEngineConicFieldJet } from "./AutoMovieEngineConicFieldJet";
import { AutoMovieEngineConicPreparation } from "./AutoMovieEngineConicPreparation";
import { AutoMovieEngineViewConic } from "./AutoMovieEngineViewConic";
import { AutoMovieEngineViewSectionReading } from "./AutoMovieEngineViewSectionReading";

/**
 * One original section field's regular station and polar partials.
 *
 * Inputs must be the actual scalar jets at the same physical station in mm.
 * Effective shoulders already include their owner's departures and cap law.
 * This owner neither interpolates principal sections nor solves a girth. Finite
 * arithmetic is checked; a positive ray denominator is not a general
 * forward-error certificate. Physical poles and world/frame jets are separate.
 */
export namespace AutoMovieEngineViewSectionField {
  /**
   * Prepare finite extent and effective shoulder jets at one regular station.
   * Each quarter supplies [value, first, second] in physical millimetre
   * station. The first invalid input returns its field and quarter diagnostic.
   */
  export function prepare(
    extents: readonly IAutoMovieViewSectionField.IStationJet[],
    shoulders: readonly IAutoMovieViewSectionField.IStationJet[],
  ): IAutoMovieViewSectionField.IPrepared | IAutoMovieConicArcField.IFailure {
    if (extents.length !== 4 || shoulders.length !== 4)
      return failure(
        "A regular section field needs four finite positive extent 2-jets and four shoulder 2-jets inside (0,1).",
      );
    for (let q: number = 0; q < 4; q++) {
      const extent: IAutoMovieViewSectionField.IStationJet | undefined =
        extents[q];
      if (!stationJet(extent) || !(extent[0] > 0))
        return failure(
          `A regular section field needs a finite positive extent ${q} 2-jet.`,
        );
      const shoulder: IAutoMovieViewSectionField.IStationJet | undefined =
        shoulders[q];
      if (!stationJet(shoulder) || !(shoulder[0] > 0 && shoulder[0] < 1))
        return failure(
          `A regular section field needs a finite shoulder ${q} 2-jet inside (0,1).`,
        );
    }
    const ops: IAutoMovieConicFieldJet.IAlgebra<IAutoMovieConicFieldJet.IJet> =
      AutoMovieEngineConicFieldJet.AD;
    const e: IAutoMovieConicFieldJet.IJet[] = extents.map(
      AutoMovieEngineConicFieldJet.fromStation,
    );
    const r: IAutoMovieConicFieldJet.IJet[] = shoulders.map(
      AutoMovieEngineConicFieldJet.fromStation,
    );
    const source: IAutoMovieViewConic.ICurve<IAutoMovieConicFieldJet.IJet> =
      AutoMovieEngineConicPreparation.source(e, r);
    if (source.failure !== null) return failure(source.failure);
    return {
      kind: "prepared",
      source,
      geometry: AutoMovieEngineViewConic.primal(ops, source),
    };
  }

  /** Read one polar ray and its regular-station radial 2-jet. */
  export function read(
    prepared: IAutoMovieViewSectionField.IPrepared,
    phi: number,
  ): IAutoMovieViewSectionField.IRead {
    const fault: string | null = AutoMovieEngineViewSectionReading.validate(prepared);
    if (fault !== null) return failure(fault);
    const ray: IAutoMovieViewConic.IRay | null = AutoMovieEngineViewConic.read(
      prepared.geometry,
      phi,
    );
    if (ray === null)
      return failure(
        "The original section has no admitted numeric ray reading.",
      );
    return AutoMovieEngineViewSectionReading.evaluate(prepared, ray);
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
  ): IAutoMovieViewSectionField.IRead {
    const fault: string | null = AutoMovieEngineViewSectionReading.validate(prepared);
    return fault === null
      ? AutoMovieEngineViewSectionReading.evaluate(prepared, ray)
      : failure(fault);
  }
}

/*
 * Convert numerical admission into the existing named failure record.
 */
function failure(detail: string): IAutoMovieConicArcField.IFailure {
  return { kind: "failure", detail };
}

/*
 * Actual regular station jets contain three finite scalars.
 */
function stationJet(
  value: readonly number[] | undefined,
): value is IAutoMovieViewSectionField.IStationJet {
  if (value === undefined || value.length !== 3) return false;
  for (let k: number = 0; k < 3; k++)
    if (!Object.hasOwn(value, k) || !Number.isFinite(value[k])) return false;
  return true;
}
