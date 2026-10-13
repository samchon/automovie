import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * A named target against which a building body's support can be checked.
 *
 * A body support bears through the top face of its resolved box, or, for a
 * multi-part element, of the drawn part nearest the subject's underside among
 * the parts the subject stands over. A surface support resolves through
 * `surfaces[].surface.id` to its footprint and height rule, and is unresolved
 * when that id is unknown or the footprint has no convex piece.
 *
 * @evidence contracts/common.md#principled-implementation Extends the body locator with a `surface` arm, so a support is either a measured body whose top face is taken as the bearing plane or an authored surface whose own height rule is evaluated under each probe.
 * @evidence contracts/common.md#clear-and-simple-design Reusing the body locator union avoids a second spelling of element and population addresses and adds only the arm that has no body counterpart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A surface with an empty convex decomposition resolves as unresolved rather than as a default flat plane, and a multi-part element bears on its nearest part rather than on the top of its union box.
 * @evidence contracts/common.md#meaningful-documentation States how each arm resolves to a bearing face, which id a surface arm cites, and when a surface support is unresolved.
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
