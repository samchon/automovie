import {
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
} from "@automovie/interface";

/**
 * What an instance set needs to regenerate one of its members.
 *
 * A compiled instance set is already one, which is what lets every consumer
 * regenerate a member from the record the builder wrote. A design record is
 * not: its route is a name the world resolves, and its prototype table leaves
 * out the default its base model stands for. A caller holding a design
 * resolves both before asking, so there is one member law rather than one per
 * record shape, and the default is counted once.
 *
 * @evidence contracts/development/design.md#principled-representation Pick the common compiled placement laws and require a resolved route plus the complete prototype-choice convention; design callers prepend the default once before instanceSlot regeneration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural view lets design compilation and compiled consumers call the same member law without separate runtime representations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The default-first convention is the actual compiled contract, not a consumer special case; this type performs no runtime route or weight validation.
 * @evidence contracts/development/common.md#meaningful-documentation The prototype member documents complete weighted choices, absent base-only meaning and the distinction from a design table that omits default.
 */
export type IAutoMovieInstanceSetPlacement = Pick<
  IAutoMovieCompiledInstanceSet,
  | "id"
  | "count"
  | "model"
  | "layout"
  | "route"
  | "anchor"
  | "facingDeg"
  | "seed"
  | "variation"
> & {
  /**
   * Complete weighted prototype choices with the default first, or absent when
   * the base model is the only choice.
   *
   * This is the compiled convention rather than the design one. A design's
   * table omits the default and a compiled set's includes it, so a caller
   * holding a design prepends `{ id: "default", model, weight: 1 }`
   * before asking.
   */
  prototypes?: readonly Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  >[];
};
