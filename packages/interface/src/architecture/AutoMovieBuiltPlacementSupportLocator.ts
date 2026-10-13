import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * A named target against which a building body's support can be checked.
 *
 * A body support bears through the top face of its resolved box. For an element
 * with two or more drawn parts, the face is instead the top of the part nearest
 * the subject's underside among the parts whose footprint the subject overlaps,
 * or the first part when it overlaps none, which then reads as not over the
 * support. A surface support resolves through `surfaces[].surface.id` to its
 * footprint and height rule, and is unresolved when that id is unknown or the
 * footprint has no convex piece.
 *
 * @evidence contracts/common.md#principled-implementation Extends the body locator with a `surface` arm; `builtEnvironmentSupportStatus` resolves a body to the top face of its box or bearing part and a surface to its footprint polygon and authored height rule with the `surface-height-rule` basis.
 * @evidence contracts/common.md#clear-and-simple-design A union over the existing body locator plus one arm, so a support may be any body the overlap queries already address or an authored surface, without a parallel element or population arm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The bearing face comes from a drawn part rather than the union box, so a shelf's back panel never becomes the face an object rests on, and a surface with no convex footprint piece is unresolved rather than given a default plane.
 * @evidence contracts/common.md#meaningful-documentation States how each arm finds its bearing face, the part choice for multi-part elements including the no-overlap case, and when a surface support is unresolved.
 * @author Samchon
 */
export type AutoMovieBuiltPlacementSupportLocator =
  | AutoMovieBuiltPlacementBodyLocator
  | {
      /** Address an authored support surface and its height rule. */
      kind: "surface";

      /** Stable surface identity inside the queried built environment. */
      id: string;
    };
