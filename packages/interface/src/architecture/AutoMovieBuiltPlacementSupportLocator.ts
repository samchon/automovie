import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * A named target against which a building body's support can be checked.
 *
 * A body support uses its box top, or for a multi-part element the top nearest the subject's underside among parts with positive XZ overlap. Without such a part it uses the first part and still runs boundary-inclusive support probes; absence of positive-area overlap alone does not force not-over-support for degenerate or edge-contact cases. A surface resolves by `surfaces[].surface.id` to footprint and height rule, or is unresolved when missing or lacking a convex footprint piece.
 *
 * @evidence contracts/common.md#principled-implementation Extends the body locator with a `surface` arm; `builtEnvironmentSupportStatus` resolves a body to the top face of its box or bearing part and a surface to its footprint polygon and authored height rule with the `surface-height-rule` basis.
 * @evidence contracts/common.md#clear-and-simple-design A union over the existing body locator plus one arm, so a support may be any body the overlap queries already address or an authored surface, without a parallel element or population arm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Multi-part selection minimizes absolute top-to-subject-underside distance among strictly overlapping XZ boxes, retaining the first equal-distance candidate; it can choose a part above the underside. With no positive-area overlap it uses the first part for the subsequent probe, not an invented union face. A surface with no convex footprint piece is unresolved, and all faces remain static box/height proxies rather than physical load-bearing certificates.
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
