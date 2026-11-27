import type { IAutoMovieVector3 } from "@automovie/interface";

import { ArchetypeMassArithmetic } from "./ArchetypeMassArithmetic";
import type { AutoMovieArchetypeMass } from "../AutoMovieArchetypeMass";

/** Admission and final reduction of a mass-property record. */
export namespace ArchetypeMassRecord {
  /**
   * Admit total body mass before allocation or a moment calculation.
   *
   * @param value Total mass, kilograms.
   * @throws {Error} Unless mass is finite and positive.
   */
  export function mass(value: number): void {
    if (!(value > 0) || value === Infinity)
      throw new Error("Mass properties need a finite positive total mass");
  }

  /**
   * Admit a finite record with nonnegative coordinate-axis moments.
   *
   * @param properties SI mass, centre in metres and tensor in kg m².
   * @throws {Error} For unsupported mass, centre or tensor components.
   */
  export function admit(properties: AutoMovieArchetypeMass.IProperties): void {
    mass(properties.mass);
    const inertia: AutoMovieArchetypeMass.IInertia = properties.inertia;
    if (!(inertia.xx >= 0 && inertia.yy >= 0 && inertia.zz >= 0))
      throw new Error(
        "Mass properties need finite centre/tensor components and nonnegative principal-axis moments",
      );
  }

  /**
   * Finish each complete tensor sum before deciding output representability.
   *
   * @param value Total mass, kilograms.
   * @param centre Common centre, metres.
   * @param terms Each axis component's contributions, kg m², in reduction
   *   order.
   * @returns One admitted mass-property record.
   * @throws {Error} For non-finite contributions or an unsupported final
   *   record.
   */
  export function finish(
    value: number,
    centre: IAutoMovieVector3,
    terms: Record<keyof AutoMovieArchetypeMass.IInertia, readonly number[]>,
  ): AutoMovieArchetypeMass.IProperties {
    const result: AutoMovieArchetypeMass.IProperties = {
      mass: value,
      centerOfMass: centre,
      inertia: {
        xx: ArchetypeMassArithmetic.sum(terms.xx),
        yy: ArchetypeMassArithmetic.sum(terms.yy),
        zz: ArchetypeMassArithmetic.sum(terms.zz),
        xy: ArchetypeMassArithmetic.sum(terms.xy),
        xz: ArchetypeMassArithmetic.sum(terms.xz),
        yz: ArchetypeMassArithmetic.sum(terms.yz),
      },
    };
    if (
      Object.values(result.inertia).some(
        (moment: number): boolean => Math.abs(moment) === Infinity,
      )
    )
      throw new Error("The complete inertia tensor is not representable");

    admit(result);
    return result;
  }
}
