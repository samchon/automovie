/**
 * An original section family assembled from oriented curve pieces in one physical plane.
 *
 * This declaration references actual functions in an invocation-owned engine source.
 * Loops are closed contours; their pieces can be open intervals and may be nonconvex.
 * Hole orientation and branch identities remain explicit. The record alone certifies
 * neither simple loops nor regularity, continuity or successful skin generation.
 *
 * @evidence contracts/development/design.md#principled-representation Whole original curve intervals and one common physical plane define the sections before surface generation; no polar or convex-envelope representation is imposed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Closed data references identify functions, physical domains, curve clocks, guides and logical/material/binding regions; runtime callbacks stay in engine.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Labels do not infer geometry, missing derivatives or shared binding. Parameter intervals retain their original functions rather than sampled refits; topology remains an explicit admission responsibility.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes metre station intervals from original curve clocks, open pieces from closed loops and declared identity from verified geometry.
 */
export interface IAutoMovieConstructionProfile {
  /** Stable generating-family identity, independent of logical anatomical names. */
  name: string;

  /** Actual retained physical station interval, metres, finite and increasing. */
  domain: [number, number];

  /** Common physical plane/frame owner key in the runtime source. */
  plane: string;

  /** Closed components or holes, each valid on its own physical station interval. */
  loops: IAutoMovieConstructionProfile.ILoop[];

  /** Original guides at explicit curve clocks, never observed display polylines. */
  guides: IAutoMovieConstructionProfile.IGuide[];

  /** Logical selections and material/binding addresses of actual source pieces. */
  regions: IAutoMovieConstructionProfile.IRegion[];

  /** Actual dependency identities; an edit supplies a new source instance. */
  revisions: {
    /** Identity of the original source-function revision. */
    source: string;

    /** Identity of the constraints used to prepare those source functions. */
    constraints: string;

    /** Identity of the retained piece/loop/branch topology. */
    topology: string;
  };
}

/**
 * Original contour pieces, guides and ownership regions of a profile family.
 *
 * @evidence contracts/development/design.md#principled-representation Loop station domains retain metres, piece clocks retain source units and signed traversals preserve original functions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Profile preparation, guide resolution and mesh selections share these members under the family that owns their identities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member substitutes output polylines for the original source or treats logical labels as proven geometric continuity.
 * @evidence contracts/development/common.md#meaningful-documentation Original contour pieces, guides and ownership regions of a profile family. Member documentation specifies their units, references and absence behavior.
 */
export namespace IAutoMovieConstructionProfile {
  /**
   * A complete oriented contour over a physical station interval.
   *
   * Its ordered original pieces close an outer contour or hole. The station domain is in metres inside the family's domain. orientation describes winding in the plane; surfaceOrientation independently sets the world surface sign and defaults to +1. pole declares whole-loop collapse only at named ends; an absent pole leaves regular open ends. AutoMovieConstructionProfile preparation resolves sources and domains; declaring a loop does not prove simplicity or global regularity.
   *
   * @evidence contracts/development/design.md#principled-representation A closed component retains original piece order, winding, physical station bounds and explicit endpoint collapse.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Profile preparation and meshing use the same contour record for outer components and holes without imposing convexity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Planar winding and surface normal orientation are distinct; coincident loops are not automatically sewn.
   * @evidence contracts/development/common.md#meaningful-documentation Defines piece order, station units, both orientation conventions and absent pole/default surface orientation.
   */
  export interface ILoop {
    /** Unique loop identity in the family. */
    id: string;

    /** Outer component or hole; coincidence with another loop does not sew it. */
    kind: "outer" | "hole";

    /** Signed winding in the common plane's original local coordinates. */
    orientation: 1 | -1;

    /** Sign taking the actual world station/traversal cross product outward; omitted means 1, independently of 2D winding. */
    surfaceOrientation?: 1 | -1;

    /** Actual station interval, metres, inside the family's domain. */
    domain: [number, number];

    /** Actual whole-loop point collapse at the named domain ends; absent ends stay regular and open. This declaration supplies no missing physical2. */
    pole?: "bottom" | "top" | "both";

    /** Ordered open or whole-period original intervals completing this loop. */
    pieces: IPiece[];
  }

  /**
   * One retained original curve interval in a profile contour.
   *
   * source resolves to an invocation-owned curve family. clock is increasing in that source's parameter units; direction selects traversal without changing the original function. branch preserves the declared topological branch shared with neighboring pieces. Profile preparation checks source availability and retained intervals before building charts.
   *
   * @evidence contracts/development/design.md#principled-representation Original source identity, parameter interval and traversal sign represent a curve piece without resampling it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Profile chart preparation and guide resolution share the piece identity and source interval.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A reverse traversal does not rewrite the source or create new interpolation, and an unresolved source is not guessed from its name.
   * @evidence contracts/development/common.md#meaningful-documentation Defines clock units, traversal sign, chart identity and topological branch meaning.
   */
  export interface IPiece {
    /** Unique piece/chart identity in the family. */
    id: string;

    /** Key of the actual original curve-family owner. */
    source: string;

    /** Increasing original curve-clock interval, with that owner's units. */
    clock: [number, number];

    /** Traverse the original clock forward or backward. */
    direction: 1 | -1;

    /** Declared topological branch, shared by its actual neighboring pieces. */
    branch: string;
  }

  /**
   * A named locus at one original clock value along a profile piece.
   *
   * piece names an existing family piece; clock uses that original curve's parameter and lies in its retained interval. Profile preparation resolves the source, so the guide follows the original station-varying curve rather than an observed display polyline.
   *
   * @evidence contracts/development/design.md#principled-representation A piece reference and fixed source clock identify a locus throughout the piece's physical station domain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Source constraints and geometry selections share a stable guide identity without copying sampled positions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration does not fit a locus to output geometry or invent missing source derivatives.
   * @evidence contracts/development/common.md#meaningful-documentation Defines piece membership, source parameter units and original-curve ownership.
   */
  export interface IGuide {
    /** Guide identity used by source constraints and editor selections. */
    id: string;

    /** Existing piece identity. */
    piece: string;

    /** Fixed original clock inside that piece's interval, in the owner's units. */
    clock: number;
  }

  /**
   * Logical selections and material/binding ownership on original profile pieces.
   *
   * pieces names existing family charts. An omitted domain uses the retained family interval in metres; omitted or null trim selects complete referenced charts, while a trim key resolves an original-source membership function. Material and binding identities express ownership, not optical values or a guarantee that touching charts are sewn.
   *
   * @evidence contracts/development/design.md#principled-representation Explicit piece and optional original membership references assign logical and material/binding regions without duplicating geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Profile preparation and mesh selection consume one region identity across the original source charts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Touching sheets may retain different material and binding owners; a logical name cannot create a shared physical boundary.
   * @evidence contracts/development/common.md#meaningful-documentation Defines chart references, metre domain defaults, trim absence and ownership identities.
   */
  export interface IRegion {
    /** Region identity, separate from a loop or generating stream. */
    id: string;

    /** Logical names selecting this actual source region. */
    logicalParts: string[];

    /** Existing piece identities composing the region. */
    pieces: string[];

    /** Optional active station interval, metres; omitted means the family's retained interval. */
    domain?: [number, number];

    /** Same-original region membership owner key; null or absent means the complete referenced piece charts. */
    trim?: string | null;

    /** Material chart owner; touching sheets may keep distinct references. */
    material: string;

    /** Binding field owner, shared only by an actually sewn physical boundary. */
    binding: string;
  }
}
