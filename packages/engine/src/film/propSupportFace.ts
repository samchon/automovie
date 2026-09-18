import { IAutoMovieBuiltEnvironment, IAutoMoviePropRelationTarget, IAutoMoviePropSpec, IAutoMovieStageSetPiece } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { convexHull2D } from "../math/convexHull2D";
import { footprintConvexPieces } from "../space/footprintConvexPieces";
import { footprintRing } from "../space/footprintRing";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { IAutoMoviePropSupportFace } from "./IAutoMoviePropSupportFace";

/**
 * The face one `on-support` relation resolves to, or `null` when the record
 * states none.
 *
 * Nothing is guessed. A citation that does not resolve, a contact of a kind
 * that carries no face at all (`handle`, `socket`, `hook`), a `stack-top`
 * missing its extent, a patch whose polygon encloses no area, and a top staged
 * edge-on to the ground each answer `null`, because a face nobody can measure
 * is not a face a prop can be proven off. The vertical top is the interesting
 * one of those: its height over the ground plan is not a function, so there is
 * no rule to read it by, and inventing one would refuse or excuse a prop for a
 * number the author never wrote.
 *
 * Lookups take the first record of a given id, exactly as
 * {@link propAnchorFrame} does and for the same reason: contradicting ids are
 * {@link validatePropPlacements}'s own refusal, by name.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-anchor-support propSupportFace resolves an authored support relation to one measurable bearing face and refuses absent support geometry with null.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propSupportFace realizes furnishing placement clearance: The face one `on-support` relation resolves to, or `null` when the record states none. Nothing is guessed. A citation that does not resolve, a contact of a kind that carries no face at all (`handle`, `socket`, `hook`), a `stack-top` missing its extent, a patch whose polygon encloses no area, and a top staged edge-on to the ground each answer `null`, because a face nobody can measure is not a face a prop can be proven off. The vertical top is the interesting one of those: its height over the ground plan is not a function, so there is no rule to read it by, and inventing one would refuse or excuse a prop for a number the author never wrote. Lookups take the first record of a given id, exactly as {@link propAnchorFrame} does and for the same reason: contradicting ids are {@link validatePropPlacements}'s own refusal, by name.
 */
export const propSupportFace = (props: {
  /** The `on-support` relation's target: a patch, or another prop's contact. */
  target:
    | IAutoMoviePropRelationTarget.ISurface
    | IAutoMoviePropRelationTarget.IPropAffordance;

  /** Every built environment a patch citation may resolve against. */
  environments: readonly IAutoMovieBuiltEnvironment[];

  /** The prop registry a `prop-affordance` citation resolves against. */
  props?: readonly IAutoMoviePropSpec[];

  /** The staged set that gives a cited host prop its world transform. */
  set?: readonly IAutoMovieStageSetPiece[];
}): IAutoMoviePropSupportFace | null => {
  const target = props.target;
  if (target.kind === "surface") {
    const environment = props.environments.find(
      (candidate) => candidate.id === target.environment,
    );
    const entry = environment?.surfaces.find(
      (candidate) => candidate.surface.id === target.surface,
    );
    if (entry === undefined) return null;
    const polygon = surfaceFootprint(entry.surface);
    if (footprintConvexPieces(polygon).length === 0) return null;
    return { polygon, height: entry.surface };
  }
  const spec = (props.props ?? []).find((prop) => prop.node === target.prop);
  const piece = (props.set ?? []).find((item) => item.node === target.prop);
  const affordance = spec?.model.affordances?.find(
    (candidate) => candidate.id === target.affordance,
  );
  if (spec === undefined || piece === undefined || affordance === undefined)
    return null;
  if (affordance.kind !== "stack-top" || affordance.extent === null)
    return null;
  const matrix = Matrix4.multiply(
    stagedMatrix(piece),
    Matrix4.compose(
      affordance.frame.translation,
      affordance.frame.rotation,
      affordance.frame.scale,
    ),
  );
  const height = facePlane(matrix);
  if (height === null) return null;
  return {
    polygon: {
      outer: footprintRing(
        convexHull2D(
          affordance.extent.map((corner) =>
            transformPoint({ x: corner.x, y: 0, z: corner.z }, matrix),
          ),
        ),
      ),
      holes: [],
    },
    height,
  };
};
