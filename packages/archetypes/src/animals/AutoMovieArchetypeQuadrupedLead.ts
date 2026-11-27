import type { AutoMovieArchetypeBuilder } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedLeadPlan } from "./quadruped/QuadrupedLeadPlan";

/** Authored shared collar/lead dimensions, without species or maker defaults. */
export namespace AutoMovieArchetypeQuadrupedLead {
  /**
   * Lay an authored collar and straight lead on a quadruped neck.
   *
   * @param builder The animal under construction.
   * @param rig Its rest landmarks.
   * @param id The producer's declared lead contact identity.
   * @param tack Positive authored lengths in metres, including the whole straight
   *   lead.
   * @param archetype Producer identity used in refusals.
   * @throws {AutoMovieArchetypeRefusal} For invalid lengths or a collar longer
   *   than the neck.
   */
  export function lay<
    Id extends string,
    Dimension extends string,
  >(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    id: Id,
    tack: AutoMovieArchetypeQuadrupedLead.IParams,
    archetype: string,
  ): void {
    new QuadrupedLeadPlan(rig, tack, archetype).emit(builder, id);
  }

  /** All four lengths are positive finite metres; width also fits the neck. */
  export interface IParams {
    /** Collar length along the neck, metres. */
    width: number;
    /** Collar radial thickness, metres. */
    thickness: number;
    /** Complete straight lead length, metres. */
    leadLength: number;
    /** Circular lead radius, metres. */
    leadRadius: number;
  }
}
