import { AutoMovieBuiltPlacementBasis, AutoMovieBuiltPlacementSupportLocator, IAutoMovieBuiltEnvironment, IAutoMovieBuiltPlacementBounds, IAutoMovieBuiltSupportQuery, IAutoMovieBuiltSupportResult, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMoviePropSupportFace } from "../film/IAutoMoviePropSupportFace";
import { propSupportGap } from "../film/propSupportGap";
import { footprintConvexPieces } from "../space/footprintConvexPieces";
import { footprintRing } from "../space/footprintRing";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { builtEnvironmentPlacementBounds } from "./builtEnvironmentPlacementBounds";

/**
 * Contact slack used when project source does not choose one, in metres. This
 * is the placement epsilon the prop kernel judges its own contact with, so an
 * unqualified building relation and an unqualified prop relation call the same
 * distance "touching".
 */
const DEFAULT_SUPPORT_TOLERANCE = 1e-9;

interface IResolvedSupport {
  face: IAutoMoviePropSupportFace;
  basis: AutoMovieBuiltPlacementBasis;
}

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

/**
 * The support part a subject bears on, chosen from the parts it stands over.
 *
 * Nearest underside rather than highest: a subject resting on a low board and a
 * subject sunk into a high one are different answers, and choosing the highest
 * part would report the first as floating by the height of the second.
 *
 * A subject over none of the parts gets one of them rather than the union. It is
 * over no part, so any part answers `not-over-support`, which is the truth; the
 * union would have said it stands over the body for the same reason a shelf's
 * box swallows what stands on it, and a notch in an L-shaped body is exactly
 * where that reappears.
 */
const bearingPart = (
  environment: IAutoMovieBuiltEnvironment,
  locator: AutoMovieBuiltPlacementSupportLocator,
  body: IAutoMovieBuiltPlacementBounds,
  subject: IAutoMovieBuiltPlacementBounds | null,
): IWorldBox => {
  if (locator.kind !== "element" || subject === null) return body;
  const parts = builtEnvironmentElementPartBounds(environment, locator.id);
  if (parts === null || parts.length < 2) return body;
  const over = parts.filter(
    (part) =>
      part.min.x < subject.max.x &&
      part.max.x > subject.min.x &&
      part.min.z < subject.max.z &&
      part.max.z > subject.min.z,
  );
  if (over.length === 0) return parts[0]!;
  return over.reduce((best, part) =>
    Math.abs(part.max.y - subject.min.y) < Math.abs(best.max.y - subject.min.y)
      ? part
      : best,
  );
};

/**
 * The face a body bears on, chosen from the parts it is actually over.
 *
 * A support's union box puts the bearing face at the highest point of the whole
 * body, which for a shelf is the back panel rather than the board an object
 * rests on — so a correctly seated object reads as floating by the height of a
 * part it is nowhere near. Where the support has drawn parts, the face is the
 * top of the part nearest the subject's underside among the parts its footprint
 * covers, and where it covers none of them the face comes from a part anyway:
 * standing over no part is what `not-over-support` means, and the union would
 * have answered that the subject stands over the body.
 *
 * A single-part support yields its own box either way.
 */
const resolveSupport = (
  environment: IAutoMovieBuiltEnvironment,
  locator: AutoMovieBuiltPlacementSupportLocator,
  subject: IAutoMovieBuiltPlacementBounds | null,
): IResolvedSupport | null => {
  if (locator.kind === "surface") {
    const entry = environment.surfaces.find(
      (candidate) => candidate.surface.id === locator.id,
    );
    if (entry === undefined) return null;
    const polygon = surfaceFootprint(entry.surface);
    if (footprintConvexPieces(polygon).length === 0) return null;
    return {
      face: { polygon, height: entry.surface },
      basis: "surface-height-rule",
    };
  }
  const body = builtEnvironmentPlacementBounds({
    environment,
    target: locator,
  });
  if (body === null) return null;
  const bearing = bearingPart(environment, locator, body, subject);
  const { min, max } = bearing;
  return {
    face: {
      polygon: {
        outer: footprintRing([
          { x: min.x, y: max.y, z: min.z },
          { x: max.x, y: max.y, z: min.z },
          { x: max.x, y: max.y, z: max.z },
          { x: min.x, y: max.y, z: max.z },
        ]),
        holes: [],
      },
      height: { height: { kind: "constant", value: max.y } },
    },
    basis: body.basis,
  };
};

/** Whether two boxes share footprint area, exact contact excluded. */
/**
 * A world-space box, whichever resolution produced it.
 *
 * The measuring helpers read six numbers and nothing else, so a part box is
 * admissible wherever a body's reported bounds are. Keeping them typed as the
 * reported bounds would have forced a fabricated `basis` onto every part, which
 * is a claim about how the part was resolved that nobody made.
 */
type IWorldBox = { min: IAutoMovieVector3; max: IAutoMovieVector3 };
