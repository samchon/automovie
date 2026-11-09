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
  revisions: { source: string; constraints: string; topology: string };
}

export namespace IAutoMovieConstructionProfile {
  /**
   * A complete oriented contour on a stable physical station interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A complete oriented contour on a stable physical station interval.
   * @evidence contracts/development/design.md#principled-representation Represents A complete oriented contour on a stable physical station interval: interface of 7 members (`id`, `kind`, `orientation`, `surfaceOrientation`, `domain`, `pole`, ...); units and frames named in its text: local, world, metres. Optional members `surfaceOrientation`, `pole` express documented absence, and the ranges its member docs state are left to runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ILoop` in packages/interface/src/construction/IAutoMovieConstructionProfile.ts; its surface is the 7 members listed and the text shows 31 other files naming it, mostly packages/engine (16), test (8), packages/human (6), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 2 optional members (`surfaceOrientation`, `pole`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.
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
   * An actual original function interval; no new interpolation is implied.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: An actual original function interval; no new interpolation is implied.
   * @evidence contracts/development/design.md#principled-representation Represents An actual original function interval; no new interpolation is implied: interface of 5 members (`id`, `source`, `clock`, `direction`, `branch`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IPiece` in packages/interface/src/construction/IAutoMovieConstructionProfile.ts; its surface is the 5 members listed and the text shows 18 other files naming it, mostly packages/human (11), packages/engine (4), test (3), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
   * A named original locus along a piece's physical station coordinate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A named original locus along a piece's physical station coordinate.
   * @evidence contracts/development/design.md#principled-representation Represents A named original locus along a piece's physical station coordinate: interface of 3 members (`id`, `piece`, `clock`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IGuide` in packages/interface/src/construction/IAutoMovieConstructionProfile.ts; its surface is the 3 members listed and the text shows 42 other files naming it, mostly packages/human (26), packages/engine (9), test (7), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
   * Logical identity mapped to real piece charts without duplicate geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Logical identity mapped to real piece charts without duplicate geometry.
   * @evidence contracts/development/design.md#principled-representation Represents Logical identity mapped to real piece charts without duplicate geometry: interface of 7 members (`id`, `logicalParts`, `pieces`, `domain`, `trim`, `material`, ...); units and frames named in its text: metres. Optional members `domain`, `trim` express documented absence, and the ranges its member docs state are left to runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IRegion` in packages/interface/src/construction/IAutoMovieConstructionProfile.ts; its surface is the 7 members listed and the text shows 24 other files naming it, mostly packages/human (16), movies (4), packages/engine (3), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 2 optional members (`domain`, `trim`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.
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
