import {
  IAutoMovieAffordance,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSurface,
  IAutoMoviePropRelationTarget,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
} from "@automovie/interface";

import { builtElementRestMatrices } from "../architecture/builtElementRestMatrices";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { footprintInteriorPoint } from "../space/footprintInteriorPoint";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { surfaceHeightAt } from "../space/surfaceHeightAt";
import { setPieceMatrix } from "./staging/setPieceMatrix";

/**
 * The world frame a placement relation anchors to, or `null` when it has none.
 *
 * This is the relative-transform half of placement: a source that wants twelve chairs around a table asks for the table's `stack-top` frame once and offsets from it in a loop, instead of typing twelve world positions that stop being right the moment the table moves. Each target kind answers as follows:
 *
 * - `prop-affordance`: the affordance's frame under the staged piece's transform; `null` when the prop, its staged piece or the affordance is missing.
 * - `element`: the element's rest-pose world transform.
 * - `boundary`: the rest-pose world transform of its first realizing element.
 * - `opening`: the rest-pose world transform of its filling element; `null` for an open cut.
 * - `surface`: a point inside the widest convex piece of the patch, at the patch's height there, with identity rotation and unit scale; `null` for a patch with no area.
 * - `space`: always `null`, because a region has no frame.
 *
 * A building target also answers `null` when its environment, element or record is missing or an element's parent chain is missing or cyclic. Rest pose means operating states are ignored: an anchor on a door is where the door hangs, not where it swings to. Lookups take the first record of a given id; two records sharing one id is a contradiction {@link validatePropPlacements} refuses by name, so resolving it a second time here would report the same defect in a worse place.
 *
 * The composed affine matrix is returned as a decomposed TRS with normalized rotation. Rotations combined with nonuniform parent scales can introduce shear that this representation does not preserve; the result is not a general affine anchor matrix. Matrix4.decompose can throw when derived affine arithmetic cannot produce a finite frame; null covers the stated missing/cyclic/absent-face cases, not every numerical failure.
 *
 * @param props.target The relation target to anchor to.
 * @param props.environments The buildings a building target may name.
 * @param props.props The prop registry a prop-affordance target may name.
 * @param props.set The staged set pieces that place those props.
 * @returns The anchor's world transform with a unit rotation, or `null`.
 *
 * @evidence contracts/common.md#principled-implementation Composes staged-piece/affordance or ancestor/element matrices and projects the result through Matrix4.decompose into TRS with normalized rotation; nested nonuniform scales can introduce unrepresented shear. A surface anchor uses the widest convex piece's interior mean, lifted onto its height rule.
 * @evidence contracts/common.md#clear-and-simple-design Element placement is the shared `builtElementRestMatrices`, piece placement the shared `setPieceMatrix`, and the interior point and height rule come from the space module, so this function keeps only the target-kind dispatch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every target kind answers by a stated rule, and missing, cyclic or absent-face records answer null rather than a guessed frame; numerical decomposition refusals propagate instead; no prop, building or affordance is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the purpose with its motivating case, the answer per target kind and each `null` case, that rest pose ignores operating states, the first-record lookup rule and why, and the meaning of each parameter.
 * @evidence contracts/performance.md#efficient-algorithms Linear lookups over the named lists plus, for a building element, one id index and one matrix product per ancestor; a surface anchor costs the convex decomposition of one patch.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resolves one target per call and coordinates no work across calls; a caller anchoring many props to one building may keep the returned frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The matrix lookup is dropped on return and nothing is retained; the caller owns the returned transform.
 */
export function propAnchorFrame (props: {
  target: IAutoMoviePropRelationTarget;
  environments: readonly IAutoMovieBuiltEnvironment[];
  props?: readonly IAutoMoviePropSpec[];
  set?: readonly IAutoMovieStageSetPiece[];
}): IAutoMovieTransform | null {
  const target: IAutoMoviePropRelationTarget = props.target;
  if (target.kind === "prop-affordance") {
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
    return transformOf(
      Matrix4.multiply(
        setPieceMatrix(piece),
        Matrix4.compose(
          affordance.frame.translation,
          affordance.frame.rotation,
          affordance.frame.scale,
        ),
      ),
    );
  }
  const environment: IAutoMovieBuiltEnvironment | undefined =
    props.environments.find(
      (candidate: IAutoMovieBuiltEnvironment): boolean =>
        candidate.id === target.environment,
    );
  if (environment === undefined) return null;
  switch (target.kind) {
    case "space":
      return null;
    case "element":
      return elementFrame(environment, target.element);
    case "boundary": {
      const boundary: IAutoMovieBuiltBoundary | undefined =
        environment.boundaries.find(
          (candidate: IAutoMovieBuiltBoundary): boolean =>
            candidate.id === target.boundary,
        );
      const element: string | undefined = boundary?.elements[0];
      return element === undefined ? null : elementFrame(environment, element);
    }
    case "opening": {
      const opening: IAutoMovieBuiltOpening | undefined =
        environment.openings.find(
          (candidate: IAutoMovieBuiltOpening): boolean =>
            candidate.id === target.opening,
        );
      const fill: string | null = opening?.fill ?? null;
      return fill === null ? null : elementFrame(environment, fill);
    }
    case "surface": {
      const entry: IAutoMovieBuiltSurface | undefined =
        environment.surfaces.find(
          (candidate: IAutoMovieBuiltSurface): boolean =>
            candidate.surface.id === target.surface,
        );
      if (entry === undefined) return null;
      // The anchor has to be on the patch, and a vertex mean is not: the mean
      // of an L-shaped plate's corners falls in its notch, and the mean of a
      // holed slab's falls down the atrium.
      const anchor: { x: number; z: number } | null = footprintInteriorPoint(
        surfaceFootprint(entry.surface),
      );
      if (anchor === null) return null;
      return {
        translation: {
          x: anchor.x,
          y: surfaceHeightAt(entry.surface, anchor.x, anchor.z),
          z: anchor.z,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      };
    }
  }
}

/** One element's rest-pose world transform, or `null` when it cannot be placed. */
function elementFrame (
  environment: IAutoMovieBuiltEnvironment,
  id: string,
): IAutoMovieTransform | null {
  const matrix: number[] | null = builtElementRestMatrices(environment)(id);
  return matrix === null ? null : transformOf(matrix);
}

/** Decompose a world matrix into a transform with a renormalized rotation. */
function transformOf (matrix: number[]): IAutoMovieTransform {
  const world: ReturnType<typeof Matrix4.decompose> = Matrix4.decompose(matrix);
  return {
    translation: world.position,
    rotation: Quaternion.normalize(world.rotation),
    scale: world.scale,
  };
}
