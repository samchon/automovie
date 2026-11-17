import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One rest joint and the segment leaving it. One section of a module.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies rest joint ancestry, optional leaf endpoint and explicit segment girth. States the centre, in-plane half dimensions and ordered polygon samples of one section.
 * @evidence contracts/development/design.md#principled-representation Human-frame metre tuples plus a positive radius describe one rest segment; null parent selects the root and null tip uses a child endpoint. All coordinates and dimensions use Human-frame metres, with points counter-clockwise about the owning module axis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieHumanoidRingModules consumes these plain joint facts to produce rigid ring modules without importing a Human runtime model. resolveAutoMovieHumanoidRingModules produces these sections for the coarse rigid-module surface builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ancestry and finite geometry remain producer premises; the record does not infer missing leaf endpoints or resolve arbitrary cyclic skeletons. depth and breadth describe a section rather than global axes; arbitrary point arrays do not enforce winding or nondegeneracy by type.
 */
export namespace IAutoMovieResolveHumanoidRingModules {
  /**
   * One rest joint and the segment leaving it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies rest joint ancestry, optional leaf endpoint and explicit segment girth.
   * @evidence contracts/development/design.md#principled-representation Human-frame metre tuples plus a positive radius describe one rest segment; null parent selects the root and null tip uses a child endpoint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieHumanoidRingModules consumes these plain joint facts to produce rigid ring modules without importing a Human runtime model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Ancestry and finite geometry remain producer premises; the record does not infer missing leaf endpoints or resolve arbitrary cyclic skeletons.
   */
  export interface IBone {
    /** Joint identity. */ bone: string;
    /** Parent identity, or null at the root. */ parent: string | null;
    /** Rest joint centre, Human frame metres. */ position: readonly [
      number,
      number,
      number,
    ];
    /** Leaf segment endpoint, metres; null when a child ends the segment. */ tip:
      | readonly [number, number, number]
      | null;
    /** Positive girth radius of the segment, metres. */ radius: number;
  }

  /**
   * One section of a module.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the centre, in-plane half dimensions and ordered polygon samples of one section.
   * @evidence contracts/development/design.md#principled-representation All coordinates and dimensions use Human-frame metres, with points counter-clockwise about the owning module axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieHumanoidRingModules produces these sections for the coarse rigid-module surface builder.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts depth and breadth describe a section rather than global axes; arbitrary point arrays do not enforce winding or nondegeneracy by type.
   */
  export interface IRing {
    /** Centre, Human frame metres. */ centre: IAutoMovieVector3;
    /** Half dimension along the module's first in-plane axis, metres. */ depth: number;
    /** Half dimension along its second in-plane axis, metres. */ breadth: number;
    /** The ring's points, counter clockwise about the module axis, Human frame metres. */ points: IAutoMovieVector3[];
  }

  /**
   * One rigid module.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines rigid segment ownership, stacking/breadth directions, ordered rings and optional end closure.
   * @evidence contracts/development/design.md#principled-representation Axis and optional breadth are directions, rings/pole are Human-frame metre geometry; null pole means a flat end.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ring-module resolver returns this structure to coarse humanoid geometry consumers, keeping joint ownership as a string identity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Axis is deliberately not required to be unit, and null breadth selects the established forward-depth frame rather than an absent segment.
   */
  export interface IModule {
    /** The joint whose segment this module is. */ bone: string;
    /** The direction the rings are stacked along; not a unit. */ axis: IAutoMovieVector3;
    /** The direction of the rings' breadth, or null for the default frame whose depth axis is forward. */ breadth: IAutoMovieVector3 | null;
    /** The stacked sections, first to last along the axis. */ rings: IAutoMovieResolveHumanoidRingModules.IRing[];
    /** The point closing the last ring, or null for a flat end. */ pole: IAutoMovieVector3 | null;
  }
}
