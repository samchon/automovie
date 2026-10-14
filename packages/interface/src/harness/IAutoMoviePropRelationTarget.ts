/**
 * What a placement relation points at.
 *
 * Every arm cites an existing stable id rather than restating geometry: a built environment owns its spaces, elements, boundaries, openings and support surfaces, and another prop spec owns its affordances. `validatePropPlacements` accepts only the target kinds the relation kind admits (see {@link IAutoMoviePropRelation}), refuses an environment id that names no or several environments, an id missing from that environment's list, and a building target outside the environment of the prop's `in-space` relation. `propAnchorFrame` turns a target into a world frame, answering `null` for a `space` and for any target it cannot find.
 *
 * @evidence contracts/common.md#principled-implementation A closed `kind` union pairs environment and owned-record ids, or prop and affordance ids. `validatePropPlacements` refuses missing or ambiguous environment/prop registry identities, but building-list membership uses `some` and nested anchor/affordance reads use first matches: unique nested building and affordance ids rely on their owners' admission, not this target gate alone.
 * @evidence contracts/common.md#clear-and-simple-design Six arms, one per kind of record a relation can cite, each carrying only the two ids that locate that record, so the relation table and the anchor dispatch switch on `kind` without optional fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry is copied into the target. `propAnchorFrame` uses first-match lookups on admitted registries and returns a rest-placement TRS; nested nonuniform scale can produce unrepresented shear, and numerical decomposition failures may throw instead of returning null. No environment or prop id selects a special rule.
 * @evidence contracts/common.md#meaningful-documentation States that targets cite ids rather than geometry, which record owns each kind, the resolution and same-environment refusals, and how the anchor function answers a space or missing target; members name the list each id must appear in.
 * @author Samchon
 */
export type IAutoMoviePropRelationTarget =
  | IAutoMoviePropRelationTarget.ISpace
  | IAutoMoviePropRelationTarget.IElement
  | IAutoMoviePropRelationTarget.IBoundary
  | IAutoMoviePropRelationTarget.IOpening
  | IAutoMoviePropRelationTarget.ISurface
  | IAutoMoviePropRelationTarget.IPropAffordance;
export namespace IAutoMoviePropRelationTarget {
  /**
   * A logical space of a built environment, the only target an `in-space` relation accepts.
   *
   * A space is a region with no frame, so `propAnchorFrame` answers `null`; the placement pass tests box corners against stated cells or shells throughout its subtree.
   *
   * @evidence contracts/common.md#principled-implementation The pair cites a space in the environment; containment reads its subtree's cells or shells and tests the occupancy box's corners against their union. No stated volume imposes no restriction, and non-convex gaps between included corners remain outside that measurement.
   * @evidence contracts/common.md#clear-and-simple-design Two ids are the whole citation; the space's cells and units stay on the environment record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anchor frame is invented for a region, and an unresolved space is refused rather than treated as the whole building.
   * @evidence contracts/common.md#meaningful-documentation States which relation kind accepts it, why it has no anchor frame, how containment uses it, and which list each id must appear in.
   * @author Samchon
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
   * A visible or grouping element of a built environment, accepted by `attached` and `suspended` relations.
   *
   * Its anchor frame is the element's rest-pose world transform, so operating states such as an open door are ignored.
   *
   * @evidence contracts/common.md#principled-implementation The pair resolves to one entry of the environment's `elements` list, and the anchor composes that element's rest matrices up its parent chain.
   * @evidence contracts/common.md#clear-and-simple-design Two ids are the whole citation; the element's transform and hierarchy stay on the environment record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A fixing to an element is currently checked as a citation only; its model geometry does not cause this consumer to measure contact or solve a joint. The anchor is a rest transform, not an operating-state attachment trajectory.
   * @evidence contracts/common.md#meaningful-documentation States which relation kinds accept it, that its anchor is the rest pose, and which list each id must appear in.
   * @author Samchon
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
   * A separation between spaces, such as a wall, floor or ceiling, accepted by an `against-boundary` relation.
   *
   * Its anchor frame is the rest-pose world transform of the first element that realizes the boundary.
   *
   * @evidence contracts/common.md#principled-implementation The pair resolves to one entry of the environment's `boundaries` list, whose first realizing element supplies the anchor.
   * @evidence contracts/common.md#clear-and-simple-design Two ids are the whole citation; which elements realize the boundary stays on the boundary record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Standing against a boundary is currently checked as a citation, without a bearing measurement. The boundary's optional face does not change that consumer path; its anchor comes from the first realizing element.
   * @evidence contracts/common.md#meaningful-documentation States which relation kind accepts it, where its anchor comes from, and which list each id must appear in.
   * @author Samchon
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
   * Its anchor frame is the rest-pose world transform of the opening's filling element, or `null` for an open cut with no fill.
   *
   * @evidence contracts/common.md#principled-implementation The pair cites an opening; placement compares occupancy with a measurable fill model's rest-pose world AABB using 1e-9 m containment slack. A missing fill/model or unresolved rest transform skips that fit check; the opening's architectural reveal is not independently measured here.
   * @evidence contracts/common.md#clear-and-simple-design Two ids are the whole citation; the reveal and the fill element stay on the opening record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An open cut answers no anchor rather than a frame guessed from the boundary.
   * @evidence contracts/common.md#meaningful-documentation States which relation kind accepts it, the anchor and its `null` case, and which list each id must appear in.
   * @author Samchon
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
   * A support surface assigned to a logical space, accepted by an `on-support` relation.
   *
   * Bearing is judged by the finite probes described by `IAutoMoviePropRelation`, not an exhaustive surface intersection. Its anchor is a point inside the widest convex piece at the surface height there, with identity rotation/unit scale, or `null` for a surface with no area; it does not align its rotation to the support slope.
   *
   * @evidence contracts/common.md#principled-implementation The pair resolves to the environment `surfaces` entry whose `surface.id` matches, the scene surface record whose footprint and height rule both the bearing check and the anchor read.
   * @evidence contracts/common.md#clear-and-simple-design Two ids are the whole citation; footprint and height stay on the surface record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The anchor is an interior point of a convex piece rather than a vertex mean, which can fall outside an L-shaped or holed surface.
   * @evidence contracts/common.md#meaningful-documentation States which relation kind accepts it, that bearing is measured, the anchor and its `null` case, and which id the surface field matches.
   * @author Samchon
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
   * A contact point declared by another prop's model, accepted by `on-support`, `attached` and `suspended` relations.
   *
   * The cited prop must differ from the citing one and be declared once, and the affordance must be `stack-top` for support, `socket` for attachment or `hook` for suspension. A measurable `stack-top` face receives finite bearing probes; a missing extent, unusable area or edge-on face can leave contact unmeasured. Contact relations may not cycle. The anchor composes the affordance and staged-piece frames, with the common TRS/shear limits, even when the host declares no placement claims of its own.
   *
   * @evidence contracts/common.md#principled-implementation The pair resolves through the prop registry to one spec and then to an affordance id on its model; `validatePropAffordanceTarget` checks identity, uniqueness, presence and kind in that order, and `validatePropSupportCycles` refuses a cycle.
   * @evidence contracts/common.md#clear-and-simple-design Two ids are the whole citation; the contact frame and its kind stay on the cited prop's model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A self-citation, an ambiguous prop or an affordance of the wrong kind is refused rather than resolved to the nearest usable one.
   * @evidence contracts/common.md#meaningful-documentation States which relation kinds accept it, every refusal, the affordance kind each relation needs, that resting is measured, and where the anchor comes from.
   * @author Samchon
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
