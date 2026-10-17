import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieHumanConstructionNet as N } from "../../../structures/IAutoMovieHumanConstructionNet";

/** Describe an actual pants curve for Human inspection without changing its primitive.
 * Section and guide names identify the owner's generating courses, not clinical
 * landmarks or skin creases. Atlas entries retain their piecewise path corners;
 * the separately pulled-back world-quarter paths carry the smooth guide role.
 * Unknown records reject so a new primitive cannot silently acquire an exterior
 * or crease label. Polynomial degree and weights remain on the exact primitive.
 *
 * @author Samchon
 */
export function describeAutoMoviePelvisPantsCurve64(curve: C.Primitive): {
  /** Existing construction-view category; this does not claim a generated skin surface. */
  kind: N.Kind;

  /** Human-specific meaning, separate from generic Bernstein representation. */
  role:
    | "section"
    | "semantic-guide"
    | "roof-course"
    | "atlas-boundary"
    | "exterior-complement"
    | "connection-rail";

  /** Reader-facing English qualification for the inspection transport to localize. */
  qualification: string;
} {
  const name: string = curve.name;
  if (
    name.startsWith("pelvis.section.") ||
    name.startsWith("upperThigh.section.")
  )
    return {
      kind: "station",
      role: "section",
      qualification:
        "Piecewise cubic physical course from the same owned family. The midpoint tube uses a four-piece kappa-cubic ellipse approximation; proximal support courses are not asserted to be ellipses or analytic ovals.",
    };
  if (
    name.startsWith("pelvis.guide.") ||
    name.startsWith("paired.guide.") ||
    name.startsWith("branch.")
  )
    return {
      kind: "guide",
      role: "semantic-guide",
      qualification:
        "Named generating lane or branch connector; not an independently measured crease.",
    };
  if (name.startsWith("roof.entry."))
    return {
      kind: "curve",
      role: "atlas-boundary",
      qualification:
        "Shared trim boundary with declared piecewise path corners; not a physical crease or globally smooth feature line.",
    };
  if (name.startsWith("roof.worldQuarter."))
    return {
      kind: "guide",
      role: "semantic-guide",
      qualification:
        "Varying-chart world guide with the gluing pullback; its composed rational degree remains authoritative.",
    };
  if (name.startsWith("roof.arch.") || name === "roof.median")
    return {
      kind: "curve",
      role: "roof-course",
      qualification:
        "Coarse nongenital roof course from the common family; no clinical landmark or surface-approval claim.",
    };
  if (name.startsWith("roof.exteriorComplement."))
    return {
      kind: "station",
      role: "exterior-complement",
      qualification:
        "Open exterior level complement consuming the shared moving entry and full physical-height jet.",
    };
  if (name.startsWith("roof.rail."))
    return {
      kind: "guide",
      role: "connection-rail",
      qualification:
        "Common outer complement connection rail; not an independently measured skin ridge.",
    };
  throw new Error("Unknown pants curve inspection role: " + name);
}
