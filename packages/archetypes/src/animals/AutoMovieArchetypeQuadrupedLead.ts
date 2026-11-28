import type { AutoMovieArchetypeBuilder } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedLeadPlan } from "./quadruped/QuadrupedLeadPlan";

/** Fits an authored collar and straight lead to a quadruped's neutral neck. */
export namespace AutoMovieArchetypeQuadrupedLead {
  /**
   * Fits an annular collar around the neutral neck and makes a straight lead
   * extending across `+X` from the collar's middle.
   *
   * @param builder Model that will receive the shell, lead and contact.
   * @param rig Neutral neck endpoints and radius in the animal's model frame.
   * @param id Name for the rein affordance on the actual lead midpoint.
   * @param tack Positive finite lengths in metres. Width must fit the neck.
   * @param archetype Producer name used in admission reports.
   * @throws {AutoMovieArchetypeRefusal} For nonpositive lengths, a collar
   *   wider than the neck, or an unrepresentable lead aperture.
   * @throws {RangeError} For degenerate neck geometry.
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

  /**
   * Four positive finite metre dimensions of a collar and straight lead.
   *
   * Width must fit the neck. The complete lead extends from the collar and
   * the aperture of its midpoint grip is twice its radius.
   */
  export interface IParams {
    /**
     * Collar's along-neck length, metres. It must fit between neck and poll.
     */
    width: number;
    /** Material thickness outward from the neck's radius, in metres. */
    thickness: number;
    /**
     * Complete length of the straight lead measured from the collar, in
     * metres.
     */
    leadLength: number;
    /**
     * Radius of the circular lead shaft, in metres. The grip aperture is
     * twice this.
     */
    leadRadius: number;
  }
}
