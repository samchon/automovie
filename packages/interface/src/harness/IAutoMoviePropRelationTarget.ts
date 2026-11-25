/**
 * What a placement relation points at.
 *
 * Every arm cites an existing stable id rather than restating geometry: a built
 * environment owns its spaces, elements, boundaries, openings and support
 * surfaces, and another prop spec owns its affordances.
 * `validatePropPlacements` accepts only the target kinds the relation kind
 * admits (see {@link IAutoMoviePropRelation}), refuses an environment id that
 * names no or several environments, an id missing from that environment's list,
 * and a building target outside the environment of the prop's `in-space`
 * relation. `propAnchorFrame` turns a target into a world frame, answering
 * `null` for a `space` and for any target it cannot find.
 */
export type IAutoMoviePropRelationTarget =
  | IAutoMoviePropRelationTarget.ISpace
  | IAutoMoviePropRelationTarget.IElement
  | IAutoMoviePropRelationTarget.IBoundary
  | IAutoMoviePropRelationTarget.IOpening
  | IAutoMoviePropRelationTarget.ISurface
  | IAutoMoviePropRelationTarget.IPropAffordance;
/** The stable-reference alternatives accepted by a prop placement relation. */
export namespace IAutoMoviePropRelationTarget {
  /**
   * A logical space of a built environment, the only target an `in-space`
   * relation accepts.
   *
   * A space is a region with no frame, so `propAnchorFrame` answers `null`; the
   * placement pass tests box corners against stated cells or shells throughout
   * its subtree.
   */
  export interface ISpace {
    /** Selects a logical-space target. */
    kind: "space";

    /** Id of exactly one built environment staged with the shot. */
    environment: string;

    /** Id of an entry in that environment's `spaces` list. */
    space: string;
  }

  /**
   * A visible or grouping element of a built environment, accepted by
   * `attached` and `suspended` relations.
   *
   * Its anchor frame is the element's rest-pose world transform, so operating
   * states such as an open door are ignored.
   */
  export interface IElement {
    /** Selects a building-element target. */
    kind: "element";

    /** Id of exactly one built environment staged with the shot. */
    environment: string;

    /** Id of an entry in that environment's `elements` list. */
    element: string;
  }

  /**
   * A separation between spaces, such as a wall, floor or ceiling, accepted by
   * an `against-boundary` relation.
   *
   * Its anchor frame is the rest-pose world transform of the first element that
   * realizes the boundary.
   */
  export interface IBoundary {
    /** Selects a boundary target. */
    kind: "boundary";

    /** Id of exactly one built environment staged with the shot. */
    environment: string;

    /** Id of an entry in that environment's `boundaries` list. */
    boundary: string;
  }

  /**
   * A passage cut through a boundary, accepted by a `fill-opening` relation.
   *
   * Its anchor frame is the rest-pose world transform of the opening's filling
   * element, or `null` for an open cut with no fill.
   */
  export interface IOpening {
    /** Selects an opening target. */
    kind: "opening";

    /** Id of exactly one built environment staged with the shot. */
    environment: string;

    /** Id of an entry in that environment's `openings` list. */
    opening: string;
  }

  /**
   * A support surface assigned to a logical space, accepted by an `on-support`
   * relation.
   *
   * Bearing is judged by the finite probes described by
   * `IAutoMoviePropRelation`, not an exhaustive surface intersection. Its
   * anchor is a point inside the widest convex piece at the surface height
   * there, with identity rotation/unit scale, or `null` for a surface with no
   * area; it does not align its rotation to the support slope.
   */
  export interface ISurface {
    /** Selects a support-surface target. */
    kind: "surface";

    /** Id of exactly one built environment staged with the shot. */
    environment: string;

    /** The `surface.id` of an entry in that environment's `surfaces` list. */
    surface: string;
  }

  /**
   * A contact point declared by another prop's model, accepted by `on-support`,
   * `attached` and `suspended` relations.
   *
   * The cited prop must differ from the citing one and be declared once, and
   * the affordance must be `stack-top` for support, `socket` for attachment or
   * `hook` for suspension. A measurable `stack-top` face receives finite
   * bearing probes; a missing extent, unusable area or edge-on face can leave
   * contact unmeasured. Contact relations may not cycle. The anchor composes
   * the affordance and staged-piece frames, with the common TRS/shear limits,
   * even when the host declares no placement claims of its own.
   */
  export interface IPropAffordance {
    /** Selects another prop's affordance as the target. */
    kind: "prop-affordance";

    /** Scene node id of the supporting or hosting prop, not the citing one. */
    prop: string;

    /** Id of an entry in that prop model's `affordances` list. */
    affordance: string;
  }
}
