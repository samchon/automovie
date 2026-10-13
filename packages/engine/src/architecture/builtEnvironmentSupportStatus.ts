import {
  AutoMovieBuiltPlacementBasis,
  AutoMovieBuiltPlacementSupportLocator,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPlacementBounds,
  IAutoMovieBuiltSupportQuery,
  IAutoMovieBuiltSupportResult,
  IAutoMovieBuiltSurface,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { IAutoMoviePropSupportFace } from "../film/IAutoMoviePropSupportFace";
import { propSupportGap } from "../film/propSupportGap";
import { IAutoMovieFootprint } from "../space/IAutoMovieFootprint";
import { footprintConvexPieces } from "../space/footprintConvexPieces";
import { footprintRing } from "../space/footprintRing";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { IAutoMovieBuiltPlacementBody } from "./IAutoMovieBuiltPlacementBody";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { builtEnvironmentPlacementBounds } from "./builtEnvironmentPlacementBounds";
import { builtFootprintsOverlap } from "./builtFootprintsOverlap";
import { AUTOMOVIE_SUPPORT_TOLERANCE } from "./constants/AUTOMOVIE_SUPPORT_TOLERANCE";
import { resolveBuiltPlacementBody } from "./resolveBuiltPlacementBody";

/** A resolved support: the face it bears on and how that face was derived. */
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
 * A negative or non-finite tolerance throws a `RangeError` rather than
 * resolving to a default, because it does not narrow or widen what "touching"
 * means, it withdraws the meaning: every distance would be outside a negative
 * band, so the answer would be a confident `floating` or `sunk` for a member
 * that rests exactly. An omitted tolerance is `AUTOMOVIE_SUPPORT_TOLERANCE`,
 * `1e-9` metres.
 *
 * Both bases travel with the verdict. A subject the record carries no vertices
 * for is probed as its stated origin, so its gap is measured from that point
 * rather than from an underside nobody declared, and `element-origin-point` is
 * how the caller reads a `floating` answer as "the origin sits this high"
 * instead of "this member hangs in the air".
 *
 * A support surface bears on its footprint polygon and height rule, and one
 * whose footprint encloses no area does not resolve. A support body bears on
 * the top of the drawn part nearest the subject's underside among the parts its
 * footprint covers; a subject over none of the parts is measured against one
 * of them, which answers `not-over-support`, because the body's union box would
 * claim the subject stands over a notch or the air beside a shelf. `gap` is the
 * signed metre distance from that face to the subject's underside, null when
 * unresolved, suspended, or not over the support, and `unresolved` names each
 * side that did not resolve.
 *
 * @param props.environment Building record holding both sides.
 * @param props.query The subject, the claimed support, the relation kind and an optional tolerance.
 * @returns The verdict, the signed gap, the unresolved sides and both bases.
 *
 * @evidence contracts/common.md#principled-implementation The bearing gap is `propSupportGap`, the prop kernel's two-sided footprint probe, over a support face that is either the surface's footprint and height rule or the top of the drawn part nearest the subject's underside among those it stands over; the premise is axis-aligned part boxes, and the result is a visual placement check, not a load analysis, which the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design Body resolution is the shared `resolveBuiltPlacementBody`, the gap is the shared prop kernel, the footprint test is `builtFootprintsOverlap`, and the default slack is one named constant shared with the sweep, so this function owns only the relation verdict and the bearing-part choice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, population or surface; an invalid tolerance is refused rather than replaced by the default, and the bearing part is chosen by geometry rather than by part order or name.
 * @evidence contracts/common.md#meaningful-documentation States the delegated probe, the suspension rule, the tolerance refusal and default, both bases and how to read an origin-point verdict, how each support kind yields its face, and the meaning of `gap` and `unresolved`.
 * @evidence contracts/performance.md#efficient-algorithms Resolves the subject and the support body once each, staging the building per resolution, then scans the support's parts once, so the cost is two element stagings plus linear work in the support's part count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Judges one authored relation per call from the caller's mutable record; a caller judging many relations over one building uses `builtEnvironmentSupportSweep`, which stages once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the resolved boxes and face only for the call; the caller owns the returned verdict.
 * @author Samchon
 */
export const builtEnvironmentSupportStatus = (props: {
  environment: IAutoMovieBuiltEnvironment;
  query: IAutoMovieBuiltSupportQuery;
}): IAutoMovieBuiltSupportResult => {
  const tolerance: number = props.query.tolerance ?? AUTOMOVIE_SUPPORT_TOLERANCE;
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new RangeError(
      `building support tolerance must be finite and non-negative, but was ${String(tolerance)}`,
    );
  const subject: IAutoMovieBuiltPlacementBounds | null =
    builtEnvironmentPlacementBounds({
      environment: props.environment,
      target: props.query.subject,
    });
  const support: IResolvedSupport | null = resolveSupport(
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
  const gap: number | null = propSupportGap({
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
 * The face a support bears on, or null when it does not resolve.
 *
 * A support's union box puts the bearing face at the highest point of the whole
 * body, which for a shelf is the back panel rather than the board an object
 * rests on, so a correctly seated object would read as floating by the height
 * of a part it is nowhere near. The face is therefore the top of the part
 * {@link bearingSolid} picks.
 */
const resolveSupport = (
  environment: IAutoMovieBuiltEnvironment,
  locator: AutoMovieBuiltPlacementSupportLocator,
  subject: IAutoMovieBuiltPlacementBounds | null,
): IResolvedSupport | null => {
  if (locator.kind === "surface") {
    const entry: IAutoMovieBuiltSurface | undefined = environment.surfaces.find(
      (candidate: IAutoMovieBuiltSurface): boolean =>
        candidate.surface.id === locator.id,
    );
    if (entry === undefined) return null;
    const polygon: IAutoMovieFootprint = surfaceFootprint(entry.surface);
    if (footprintConvexPieces(polygon).length === 0) return null;
    return {
      face: { polygon, height: entry.surface },
      basis: "surface-height-rule",
    };
  }
  const body: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody({
    environment,
    target: locator,
    parts: (elementId: string): IAutoMovieSubjectBox[] | null =>
      builtEnvironmentElementPartBounds(environment, elementId),
  });
  if (body === null) return null;
  const { min, max }: IAutoMovieSubjectBox = bearingSolid(body, subject);
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
    basis: body.bounds.basis,
  };
};

/**
 * The solid a subject bears on, chosen from the solids it stands over.
 *
 * Nearest underside rather than highest: a subject resting on a low board and a
 * subject sunk into a high one are different answers, and choosing the highest
 * part would report the first as floating by the height of the second.
 *
 * A subject over none of the solids gets the first of them rather than the
 * union. It is over no part, so any part answers `not-over-support`, which is
 * the truth; the union would have said it stands over the body, and a notch in
 * an L-shaped body is exactly where that reappears. A single-solid body, and a
 * subject that did not resolve, yield the body's own box.
 */
const bearingSolid = (
  body: IAutoMovieBuiltPlacementBody,
  subject: IAutoMovieBuiltPlacementBounds | null,
): IAutoMovieSubjectBox => {
  if (subject === null || body.solids.length < 2) return body.bounds;
  const over: IAutoMovieSubjectBox[] = body.solids.filter(
    (solid: IAutoMovieSubjectBox): boolean =>
      builtFootprintsOverlap(solid, subject),
  );
  if (over.length === 0) return body.solids[0]!;
  return over.reduce(
    (best: IAutoMovieSubjectBox, solid: IAutoMovieSubjectBox): IAutoMovieSubjectBox =>
      Math.abs(solid.max.y - subject.min.y) < Math.abs(best.max.y - subject.min.y)
        ? solid
        : best,
  );
};
