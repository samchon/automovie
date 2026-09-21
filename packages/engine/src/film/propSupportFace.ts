import { IAutoMovieBuiltEnvironment, IAutoMoviePropRelationTarget, IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieVector3 } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { convexHull2D } from "../math/convexHull2D";
import { footprintConvexPieces } from "../space/footprintConvexPieces";
import { footprintRing } from "../space/footprintRing";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { IAutoMovieHeightSurface } from "../space/IAutoMovieHeightSurface";
import { IAutoMoviePropSupportFace } from "./IAutoMoviePropSupportFace";

/** Tolerance for containment and fit comparisons, in metres. */
const PLACEMENT_EPSILON = 1e-9;

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

const stagedMatrix = (piece: IAutoMovieStageSetPiece): number[] => {
  const scale =
    piece.scale === undefined
      ? { x: 1, y: 1, z: 1 }
      : typeof piece.scale === "number"
        ? { x: piece.scale, y: piece.scale, z: piece.scale }
        : piece.scale;
  return Matrix4.compose(
    piece.position,
    piece.rotation ??
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, piece.facingDeg ?? 0),
    scale,
  );
};

/**
 * The plane a transform carries its local XZ plane onto, spelled as the height
 * rule {@link surfaceHeightAt} reads, or `null` when that image stands edge-on
 * to the ground.
 *
 * The face is spanned by the images of local `+X` and `+Z`, so its normal is
 * their cross product and it passes through the transform's own origin. A
 * normal with no vertical component of its own is the vertical face, and a
 * transform that collapses the face to a line or a point answers with the zero
 * normal, which the same comparison catches: in both, the height over `(x, z)`
 * is not a function, so there is no rule to read it by. The test is taken
 * against the normal's own length rather than against a length in metres, so a
 * face states its tilt the same way at whatever size it was staged.
 */
const facePlane = (matrix: number[]): IAutoMovieHeightSurface | null => {
  const ax = { x: matrix[0]!, y: matrix[1]!, z: matrix[2]! };
  const az = { x: matrix[8]!, y: matrix[9]!, z: matrix[10]! };
  const normal = {
    x: ax.y * az.z - ax.z * az.y,
    y: ax.z * az.x - ax.x * az.z,
    z: ax.x * az.y - ax.y * az.x,
  };
  const length = Math.hypot(normal.x, normal.y, normal.z);
  if (Math.abs(normal.y) <= PLACEMENT_EPSILON * length) return null;
  const slopeX = -normal.x / normal.y;
  const slopeZ = -normal.z / normal.y;
  return {
    height: {
      kind: "plane",
      originHeight: matrix[13]! - slopeX * matrix[12]! - slopeZ * matrix[14]!,
      slopeX,
      slopeZ,
    },
  };
};

const transformPoint = (
  point: IAutoMovieVector3,
  matrix: number[],
): IAutoMovieVector3 => ({
  x:
    matrix[0]! * point.x +
    matrix[4]! * point.y +
    matrix[8]! * point.z +
    matrix[12]!,
  y:
    matrix[1]! * point.x +
    matrix[5]! * point.y +
    matrix[9]! * point.z +
    matrix[13]!,
  z:
    matrix[2]! * point.x +
    matrix[6]! * point.y +
    matrix[10]! * point.z +
    matrix[14]!,
});
