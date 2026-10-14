import {
  IAutoMovieAffordance,
  IAutoMovieBuiltEnvironment,
  IAutoMoviePropRelationTarget,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/convexHull2D";
import { IAutoMovieFootprint } from "../space/IAutoMovieFootprint";
import { IAutoMovieHeightSurface } from "../space/IAutoMovieHeightSurface";
import { footprintConvexPieces } from "../space/footprintConvexPieces";
import { footprintRing } from "../space/footprintRing";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { IAutoMoviePropSupportFace } from "./IAutoMoviePropSupportFace";
import { setPieceMatrix } from "./staging/setPieceMatrix";

/** Relative tolerance below which a face normal counts as horizontal. */
const EDGE_ON_TOLERANCE: number = 1e-9;

/**
 * The face one `on-support` relation resolves to, or `null` when the record states none.
 *
 * A `surface` target resolves to the cited built environment's support patch: its own footprint, holes included, and its own height rule. A `prop-affordance` target resolves to the host prop's `stack-top` extent carried through the affordance frame and the host's full staged transform ({@link setPieceMatrix}), hulled into one convex ring, with a plane height rule through the transformed top.
 *
 * Nothing is guessed. A citation that does not resolve, a host that is not staged, a contact of a kind that carries no face (`handle`, `socket`, `hook`), a `stack-top` without an extent, a patch whose region encloses no area, and a top staged edge-on to the ground each answer `null`, because a face nobody can measure is not a face a prop can be proven off. The edge-on top's height over the ground plan is not a function, so there is no rule to read it by, and inventing one would refuse or excuse a prop for a number the author never wrote.
 *
 * Lookups take the first record of a given id, exactly as {@link propAnchorFrame} does and for the same reason: contradicting ids are {@link validatePropPlacements}'s own refusal, by name.
 *
 * @param props The relation target and the records it may cite.
 * @returns The face in world metres, or null for the stated unresolved/degenerate cases. Finite authored transforms alone do not ensure finite derived plane coefficients.
 *
 * @evidence contracts/common.md#principled-implementation A patch keeps its authored footprint and surface record, so the face is the region the author drew; a stack-top is mapped through the composed affine matrix with `Matrix4.transformPoint`, hulled with Andrew's monotone chain, and given the plane through the transformed origin whose normal is the cross product of the images of local `+X` and `+Z`, the exact image of a planar top under an affine map; the edge-on test compares the normal's vertical component with its own length, so it does not depend on the staged size.
 * @evidence contracts/common.md#clear-and-simple-design One resolver for both target kinds returning the shared `IAutoMoviePropSupportFace`, so `propSupportGap` measures a patch and a prop top the same way; the host's staged matrix comes from `setPieceMatrix` rather than a private restatement of its defaults.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No environment, prop or affordance is special-cased; the stated unresolved and degenerate cases answer null instead of a substituted face, but extreme affine/cross-product overflow is not gated and can produce non-finite coefficients, and first-match lookup is the rule shared with `propAnchorFrame`.
 * @evidence contracts/common.md#meaningful-documentation States what each target kind resolves to, every `null` case and why the edge-on top is one, the units, and the first-match lookup rule with the validator that refuses duplicates.
 * @evidence contracts/performance.md#efficient-algorithms Linear first-match scans of the cited environments, surfaces, props, set and affordances; a patch decomposes its footprint to prove area, and a stack-top pays O(c log c) to hull its c corners. Resolving R relations repeats these lookup and geometry costs R times; this helper imposes no small relation-count bound.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolves one relation per call and caches nothing; the caller measures the face immediately and drops it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; a patch face references the authored surface record as its height rule, and a prop face owns a fresh ring and plane rule, both released with the caller's measurement.
 */
export function propSupportFace (props: {
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
}): IAutoMoviePropSupportFace | null {
  const target:
    | IAutoMoviePropRelationTarget.ISurface
    | IAutoMoviePropRelationTarget.IPropAffordance = props.target;
  if (target.kind === "surface") {
    const environment: IAutoMovieBuiltEnvironment | undefined =
      props.environments.find(
        (candidate: IAutoMovieBuiltEnvironment): boolean =>
          candidate.id === target.environment,
      );
    const entry: IAutoMovieBuiltEnvironment["surfaces"][number] | undefined =
      environment?.surfaces.find(
        (candidate: IAutoMovieBuiltEnvironment["surfaces"][number]): boolean =>
          candidate.surface.id === target.surface,
      );
    if (entry === undefined) return null;
    const polygon: IAutoMovieFootprint = surfaceFootprint(entry.surface);
    if (footprintConvexPieces(polygon).length === 0) return null;
    return { polygon, height: entry.surface };
  }
  const spec: IAutoMoviePropSpec | undefined = (props.props ?? []).find(
    (prop: IAutoMoviePropSpec): boolean => prop.node === target.prop,
  );
  const piece: IAutoMovieStageSetPiece | undefined = (props.set ?? []).find(
    (item: IAutoMovieStageSetPiece): boolean => item.node === target.prop,
  );
  const affordance: IAutoMovieAffordance | undefined =
    spec?.model.affordances?.find(
      (candidate: IAutoMovieAffordance): boolean =>
        candidate.id === target.affordance,
    );
  if (spec === undefined || piece === undefined || affordance === undefined)
    return null;
  if (affordance.kind !== "stack-top" || affordance.extent === null)
    return null;
  const matrix: number[] = Matrix4.multiply(
    setPieceMatrix(piece),
    Matrix4.compose(
      affordance.frame.translation,
      affordance.frame.rotation,
      affordance.frame.scale,
    ),
  );
  const height: IAutoMovieHeightSurface | null = facePlane(matrix);
  if (height === null) return null;
  return {
    polygon: {
      outer: footprintRing(
        convexHull2D(
          affordance.extent.map(
            (corner: IAutoMovieVector3): IAutoMovieVector3 =>
              Matrix4.transformPoint(matrix, {
                x: corner.x,
                y: 0,
                z: corner.z,
              }),
          ),
        ),
      ),
      holes: [],
    },
    height,
  };
}

/**
 * The plane a transform carries its local XZ plane onto, spelled as the height rule {@link surfaceHeightAt} reads, or `null` when that image stands edge-on to the ground.
 *
 * The face is spanned by the images of local `+X` and `+Z`, so its normal is their cross product and it passes through the transform's own origin. A normal with no vertical component of its own is the vertical face, and a transform that collapses the face to a line or a point answers with the zero normal, which the same comparison catches: in both, the height over `(x, z)` is not a function, so there is no rule to read it by. The test is taken against the normal's own length rather than against a length in metres, so a face states its tilt the same way at whatever size it was staged.
 */
function facePlane (matrix: number[]): IAutoMovieHeightSurface | null {
  const normal: IAutoMovieVector3 = Vector3.cross(
    { x: matrix[0]!, y: matrix[1]!, z: matrix[2]! },
    { x: matrix[8]!, y: matrix[9]!, z: matrix[10]! },
  );
  if (Math.abs(normal.y) <= EDGE_ON_TOLERANCE * Vector3.length(normal))
    return null;
  const slopeX: number = -normal.x / normal.y;
  const slopeZ: number = -normal.z / normal.y;
  return {
    height: {
      kind: "plane",
      originHeight: matrix[13]! - slopeX * matrix[12]! - slopeZ * matrix[14]!,
      slopeX,
      slopeZ,
    },
  };
}
