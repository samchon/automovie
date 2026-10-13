/**
 * What a placement relation points at.
 *
 * Every arm cites an existing stable id rather than restating geometry: a built
 * environment owns its spaces, elements, boundaries, openings and support
 * surfaces, and another prop spec owns its affordances. `validatePropPlacements`
 * accepts only the target kinds the relation kind admits (see
 * {@link IAutoMoviePropRelation}), refuses an environment id that names no or
 * several environments, an id missing from that environment's list, and a
 * building target outside the environment of the prop's `in-space` relation.
 * `propAnchorFrame` turns a target into a world frame, answering `null` for a
 * `space` and for any target it cannot find.
 *
 * @evidence contracts/common.md#principled-implementation A closed union on `kind` whose building arms pair an environment id with one id from the matching environment list and whose prop arm pairs a staged prop node with an affordance id on its model; `validatePropPlacements` resolves each against the shot's environment and prop registries, refusing missing and ambiguous ids rather than taking the first match.
 * @evidence contracts/common.md#clear-and-simple-design Six arms, one per kind of record a relation can cite, each carrying only the two ids that locate that record, so the relation table and the anchor dispatch switch on `kind` without optional fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry is copied into the target, so a moved table or rebuilt wall is read from its owner; no environment or prop id is special-cased.
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
   * A logical space of a built environment, the only target an `in-space`
   * relation accepts.
   *
   * A space is a region with no frame, so `propAnchorFrame` answers `null` for
   * it; containment is measured against the space's cells by the placement
   * geometry pass.
   *
   * @evidence contracts/common.md#principled-implementation The pair resolves to one entry of the environment's `spaces` list by id, which is the record whose cells the containment check reads.
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
   * A visible or grouping element of a built environment, accepted by
   * `attached` and `suspended` relations.
   *
   * Its anchor frame is the element's rest-pose world transform, so operating
   * states such as an open door are ignored.
   *
   * @evidence contracts/common.md#principled-implementation The pair resolves to one entry of the environment's `elements` list, and the anchor composes that element's rest matrices up its parent chain.
   * @evidence contracts/common.md#clear-and-simple-design Two ids are the whole citation; the element's transform and hierarchy stay on the environment record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A fixing to an element is checked as a citation only and never measured, because an element states no contact geometry.
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
   * A separation between spaces, such as a wall, floor or ceiling, accepted by
   * an `against-boundary` relation.
   *
   * Its anchor frame is the rest-pose world transform of the first element
   * that realizes the boundary.
   *
   * @evidence contracts/common.md#principled-implementation The pair resolves to one entry of the environment's `boundaries` list, whose first realizing element supplies the anchor.
   * @evidence contracts/common.md#clear-and-simple-design Two ids are the whole citation; which elements realize the boundary stays on the boundary record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Standing against a boundary is checked as a citation and not measured, since the boundary record states no contact face.
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
   * Its anchor frame is the rest-pose world transform of the opening's filling
   * element, or `null` for an open cut with no fill.
   *
   * @evidence contracts/common.md#principled-implementation The pair resolves to one entry of the environment's `openings` list; containment inside the fill's reveal is measured by the placement geometry pass.
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
   * A support surface assigned to a logical space, accepted by an
   * `on-support` relation.
   *
   * The prop's bearing on the surface's face is measured, so a prop floating
   * above it, sunk into it or standing beside it is refused. Its anchor frame
   * is a point inside the widest convex piece of the surface at the surface's
   * height there, or `null` for a surface with no area.
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
   * A contact point declared by another prop's model, accepted by
   * `on-support`, `attached` and `suspended` relations.
   *
   * The cited prop must differ from the citing one and be declared once, and
   * the affordance must have the kind the relation needs: `stack-top` to rest
   * on, `socket` to attach, `hook` to hang. A prop resting on a `stack-top` is
   * measured against its face; contact relations between props may not form a
   * cycle. The anchor frame is the affordance's frame under the staged piece's
   * transform.
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
