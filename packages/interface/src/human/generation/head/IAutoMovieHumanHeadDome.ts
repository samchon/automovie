import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadDomeHost } from "./IAutoMovieHumanHeadDomeHost";

/**
 * Head-region dome definitions and attachment attempts, preserving original parents and explicit failures.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadDome in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadDome {
  /**
   * One actual source attempt collected before publishing any composed result.
   * Records the real caller's parent domain, independent placement anchor, nominal base and successful regular native contact or original exception.
   * One record represents either success or failure without manufacturing geometry.
   * Collection cannot turn a failed source into a published part or proxy.
   * Source stations and world positions use calibration mm; error retains the original cause.
   * Data performs no work.
   * The attempt factory owns original construction.
   * The explicit inspection owns its bounded actual-caller records.
   */
  export interface IAttempt {
    /** Actual child source name. */
    name: string;
    /** Authored frame, widths, rise and profile, or the original bracket if contact fails. */
    definition: Omit<IDome, "host">;
    /** Actual selected material owner, distinct from the tree's parent label. */
    parent: string | null;
    /** Identical original parent retained for independent source/frame inspection, even after a failed attachment query. */
    parentSource: IAutoMovieViewPart | null;
    /** Original declared physical station domain, without extension or clamping. */
    domain: [number, number] | null;
    /** Authored child nominal base, or the original bracket start if contact fails. */
    base: [number, number, number];
    /** Original source placement anchor; distinct from a derived parent-surface contact. */
    point: [number, number, number];
    /** Successful native surface contact, distinct from the original placement anchor. */
    attachment: IAutoMovieHumanHeadDomeHost.IHost | null;
    /** Original failed premise or null for an actual successful source. */
    error: string | null;
  }

  /**
   * A dome's generating frame and positive dimensions in calibration mm.
   *
   * Separates the caller's frame, footprint, rise, profile and shoulder from the optional host-curvature estimate.
   * A single record supplies the cap source.
   * Contains no person selector, reference target or join-driven shape override.
   * Documents each field's units, orientation and optional default.
   * A data contract chooses no algorithm.
   * A data contract coordinates no work.
   * A data contract owns no runtime resource lifecycle.
   */
  export interface IDome {
    /** Chain name. */
    name: string;

    /** Nominal cap-base centre before the stem's embedding offset, world mm. */
    origin: [number, number, number];

    /** Unit direction from the cap base to its apex, inward for a cutter. */
    outward: [number, number, number];

    /** Unit long direction of the footprint, square to `outward`. */
    along: [number, number, number];

    /** Half extents of the base along `+u`, `+v`, `-u`, `-v`, mm, positive. */
    extents: [number, number, number, number];

    /** Height from the base to the apex, mm. */
    height: number;

    /** Minimum constant-footprint stem length behind the nominal cap base, mm. */
    stem?: number;

    /** Exponent of the projection profile, 2 for the ellipse. */
    profile: number;

    /** Conic shoulder of every quarter. */
    shoulder: number;

    /**
     * Explicit parent-plane datum or numeric host radius, calibration mm.
     * A datum queries native curvature in its actual frame and radial direction.
     * The base sinks by
     * the sagitta estimate `e^2 / (2 R)` of the longest half extent `e`;
     * absent, R is e. A supplied local radius or size proxy is not a
     * certified least principal radius over the complete footprint.
     */
    host?: number | IAutoMovieHumanHeadDomeHost.IHost;
  }

  /**
   * A cap retaining its actual original material contact for downstream consumers.
   *
   * The same complete source/frame/contact used to author embedding remains attached to the original part.
   * One record preserves geometry and its actual borrowed material owner.
   * Retaining a contact claims neither whole-footprint agreement nor Boolean acceptance.
   * Null means a caller supplied no original material parent.
   * Data performs no work.
   * Regional metadata borrows the identical prepared contact.
   * The composition owns the part and its transitive original-parent source.
   */
  export interface IPart extends IAutoMovieViewPart {
    /** Identical source contact consumed by embedding, or null without an original parent. */
    attachment: IAutoMovieHumanHeadDomeHost.IHost | null;
  }
}
