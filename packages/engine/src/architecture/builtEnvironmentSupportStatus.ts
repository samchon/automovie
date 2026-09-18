import { AutoMovieBuiltPlacementBodyLocator, IAutoMovieBuiltEnvironment, IAutoMovieBuiltPlacementBounds, IAutoMovieBuiltSupportQuery, IAutoMovieBuiltSupportResult } from "@automovie/interface";
import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { propSupportGap } from "../film/propSupportGap";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { builtEnvironmentPlacementBounds } from "./builtEnvironmentPlacementBounds";

/**
 * Classify one project-authored bearing or suspension relation.
 *
 * Bearing delegates to the prop placement kernel's two-sided footprint probes,
 * so a small plinth under a wide member and a small member on a wide slab are
 * the same measurement rather than two near-copies. A suspension is accepted
 * only after both named sides resolve. The query is a deterministic visual
 * placement check, not a structural load or safety analysis.
 *
 * A negative or non-finite tolerance throws rather than resolving to a default,
 * because it does not narrow or widen what "touching" means, it withdraws the
 * meaning: every distance would be outside a negative band, so the answer would
 * be a confident `floating` or `sunk` for a member that rests exactly.
 *
 * Both bases travel with the verdict. A subject the record carries no vertices
 * for is probed as its stated origin, so its gap is measured from that point
 * rather than from an underside nobody declared, and `element-origin-point` is
 * how the caller reads a `floating` answer as "the origin sits this high"
 * instead of "this member hangs in the air".
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Gives authoring source the promised resting, floating, sunk, off-support, suspended, and unresolved answers for a named relation.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Applies the specified two-sided bearing probes, tolerance boundary, suspension declaration, and unresolved-state contract.
 * @author Samchon
 */
export const builtEnvironmentSupportStatus = (props: {
  environment: IAutoMovieBuiltEnvironment;
  query: IAutoMovieBuiltSupportQuery;
}): IAutoMovieBuiltSupportResult => {
  const tolerance = props.query.tolerance ?? DEFAULT_SUPPORT_TOLERANCE;
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new RangeError(
      `building support tolerance must be finite and non-negative, but was ${String(tolerance)}`,
    );
  const subject = builtEnvironmentPlacementBounds({
    environment: props.environment,
    target: props.query.subject,
  });
  const support = resolveSupport(
    props.environment,
    props.query.support,
    subject,
  );
  const unresolved: ("subject" | "support")[] = [];
  if (subject === null) unresolved.push("subject");
  if (support === null) unresolved.push("support");
  if (subject === null || support === null)
    return {
      status: "unresolved",
      gap: null,
      unresolved,
      subjectBasis: subject?.basis ?? null,
      supportBasis: support?.basis ?? null,
    };
  if (props.query.kind === "suspended")
    return {
      status: "suspended",
      gap: null,
      unresolved,
      subjectBasis: subject.basis,
      supportBasis: support.basis,
    };
  const gap = propSupportGap({
    face: support.face,
    bounds: subject,
  });
  return {
    status:
      gap === null
        ? "not-over-support"
        : Math.abs(gap) <= tolerance
          ? "resting"
          : gap > 0
            ? "floating"
            : "sunk",
    gap,
    unresolved,
    subjectBasis: subject.basis,
    supportBasis: support.basis,
  };
};

/** Whether any part of one body shares positive volume with any part of another. */
const partsMeet = (
  left: readonly IWorldBox[],
  right: readonly IWorldBox[],
): boolean =>
  left.some((leftPart) =>
    right.some((rightPart) => propBoundsOverlap(leftPart, rightPart)),
  );

/**
 * The boxes a locator's body actually fills, one per drawn part where it has
 * them and the reported box otherwise.
 *
 * An element resolves to its parts, because a multi-part body's union box is
 * mostly air and a test written against it answers about the box rather than
 * the body. Every other locator has no part structure to consult and keeps the
 * one box it reports, and so does an element that draws nothing.
 *
 * The parts arrive through `lookup` rather than from a fixed source, because
 * one caller asks about a single pair and another has already resolved the whole
 * building. The rule about what to do with the answer is the same either way,
 * and writing it twice is how the two stop agreeing.
 */
const solidBoxes = (
  locator: AutoMovieBuiltPlacementBodyLocator,
  reported: IAutoMovieBuiltPlacementBounds,
  lookup: (id: string) => readonly IWorldBox[] | null | undefined,
): readonly IWorldBox[] => {
  if (locator.kind !== "element") return [reported];
  const parts = lookup(locator.id);
  return parts === null || parts === undefined || parts.length === 0
    ? [reported]
    : parts;
};

/** The single-pair lookup: one element's parts, resolved on the spot. */
const partsOfElement =
  (environment: IAutoMovieBuiltEnvironment) =>
  (id: string): readonly IWorldBox[] | null =>
    builtEnvironmentElementPartBounds(environment, id);
