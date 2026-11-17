import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadDomeHost } from "./IAutoMovieHumanHeadDomeHost";

/** Type contracts exchanged by AutoMovieHumanHeadDome; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadDome {
  /**
   * One actual source attempt collected before publishing any composed result.
   * @evidence contracts/common.md#principled-implementation Records the real caller's parent domain, independent placement anchor, nominal base and successful regular native contact or original exception.
   * @evidence contracts/common.md#clear-and-simple-design One record represents either success or failure without manufacturing geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Collection cannot turn a failed source into a published part or proxy.
   * @evidence contracts/common.md#meaningful-documentation Source stations and world positions use calibration mm; error retains the original cause.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The attempt factory owns original construction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The explicit inspection owns its bounded actual-caller records.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One actual source attempt collected before publishing any composed result.
   * @evidence contracts/development/design.md#principled-representation `name`: Actual child source name. `definition`: Identical original frame, widths, rise and profile, before parent queries. `parent`: Actual selected material owner, distinct from the tree's parent label.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadDome.attempt, AutoMovieHumanHeadEarParts.of, AutoMovieHumanHeadEarParts.part. Also types AutoMovieHumanHeadComposer.attachments, AutoMovieHumanHeadComposer.failures.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `definition`, `parent`, `parentSource`, `domain`, `base`, `point`, `attachment`, `error`; callers supply the complete record.
   */
  export interface IAttempt {
    /** Actual child source name. */
    name: string;
    /** Identical original frame, widths, rise and profile, before parent queries. */
    definition: Omit<IDome, "host">;
    /** Actual selected material owner, distinct from the tree's parent label. */
    parent: string | null;
    /** Identical original parent retained for independent source/frame inspection, even after a failed attachment query. */
    parentSource: IAutoMovieViewPart | null;
    /** Original declared physical station domain, without extension or clamping. */
    domain: [number, number] | null;
    /** Original child nominal base, independent of attachment. */
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
   * @evidence contracts/common.md#principled-implementation Separates the caller's frame, footprint, rise, profile and shoulder from the optional host-curvature estimate.
   * @evidence contracts/common.md#clear-and-simple-design A single record supplies the cap source.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no person selector, reference target or join-driven shape override.
   * @evidence contracts/common.md#meaningful-documentation Documents each field's units, orientation and optional default.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data contract chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data contract coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data contract owns no runtime resource lifecycle.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A dome's generating frame and positive dimensions in calibration mm.
   * @evidence contracts/development/design.md#principled-representation `name`: Chain name. `origin`: Nominal cap-base centre before the stem's embedding offset, world mm. `outward`: Unit direction from the cap base to its apex, inward for a cutter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadDome.attempt, AutoMovieHumanHeadDome.of, AutoMovieHumanHeadDome.sagitta. Also types AutoMovieHumanHeadInnerParts.dome.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `host`: Explicit parent-plane datum or numeric host radius, calibration mm.
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
   * @evidence contracts/common.md#principled-implementation The same complete source/frame/contact used to author embedding remains attached to the original part.
   * @evidence contracts/common.md#clear-and-simple-design One record preserves geometry and its actual borrowed material owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retaining a contact claims neither whole-footprint agreement nor Boolean acceptance.
   * @evidence contracts/common.md#meaningful-documentation Null means a caller supplied no original material parent.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Regional metadata borrows the identical prepared contact.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The composition owns the part and its transitive original-parent source.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A cap retaining its actual original material contact for downstream consumers.
   * @evidence contracts/development/design.md#principled-representation `attachment`: Identical source contact consumed by embedding, or null without an original parent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadDome.attempt. Also types AutoMovieHumanHeadDome.part, AutoMovieHumanHeadEarParts.source.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `attachment`; callers supply the complete record.
   */
  export interface IPart extends IAutoMovieViewPart {
    /** Identical source contact consumed by embedding, or null without an original parent. */
    attachment: IAutoMovieHumanHeadDomeHost.IHost | null;
  }
}
