import { IAutoMovieBuiltEnvironment, IAutoMoviePropRelationTarget, IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieTransform } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { footprintInteriorPoint } from "../space/footprintInteriorPoint";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { surfaceHeightAt } from "../space/surfaceHeightAt";

/**
 * The world frame a placement relation anchors to, or `null` when it has none.
 *
 * This is the relative-transform half of placement: a source that wants twelve
 * chairs around a table asks for the table's `stack-top` frame once and offsets
 * from it in a loop, instead of typing twelve world positions that stop being
 * right the moment the table moves. Regions have no frame, so a `space` target
 * answers `null`; a `boundary` answers with its first realizing element and an
 * `opening` with its filling element, because those are the only members of
 * those records that carry a transform.
 *
 * Lookups take the first record of a given id. Two buildings sharing one id is
 * a contradiction {@link validatePropPlacements} refuses by name, so resolving
 * it a second time here would report the same defect in a worse place.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-anchor-support propAnchorFrame resolves the explicit world frame against which an authored placement relation is evaluated.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propAnchorFrame realizes furnishing placement clearance: The world frame a placement relation anchors to, or `null` when it has none. This is the relative-transform half of placement: a source that wants twelve chairs around a table asks for the table's `stack-top` frame once and offsets from it in a loop, instead of typing twelve world positions that stop being right the moment the table moves. Regions have no frame, so a `space` target answers `null`; a `boundary` answers with its first realizing element and an `opening` with its filling element, because those are the only members of those records that carry a transform. Lookups take the first record of a given id. Two buildings sharing one id is a contradiction {@link validatePropPlacements} refuses by name, so resolving it a second time here would report the same defect in a worse place.
 */
export const propAnchorFrame = (props: {
  target: IAutoMoviePropRelationTarget;
  environments: readonly IAutoMovieBuiltEnvironment[];
  props?: readonly IAutoMoviePropSpec[];
  set?: readonly IAutoMovieStageSetPiece[];
}): IAutoMovieTransform | null => {
  const target = props.target;
  if (target.kind === "prop-affordance") {
    const spec = (props.props ?? []).find((prop) => prop.node === target.prop);
    const piece = (props.set ?? []).find((item) => item.node === target.prop);
    const affordance = spec?.model.affordances?.find(
      (candidate) => candidate.id === target.affordance,
    );
    if (spec === undefined || piece === undefined || affordance === undefined)
      return null;
    return transformOf(
      Matrix4.multiply(
        stagedMatrix(piece),
        Matrix4.compose(
          affordance.frame.translation,
          affordance.frame.rotation,
          affordance.frame.scale,
        ),
      ),
    );
  }
  const environment = props.environments.find(
    (candidate) => candidate.id === target.environment,
  );
  if (environment === undefined) return null;
  switch (target.kind) {
    case "space":
      return null;
    case "element": {
      const matrix = elementWorldMatrix(environment, target.element);
      return matrix === null ? null : transformOf(matrix);
    }
    case "boundary": {
      const boundary = environment.boundaries.find(
        (candidate) => candidate.id === target.boundary,
      );
      const element = boundary?.elements[0];
      if (element === undefined) return null;
      const matrix = elementWorldMatrix(environment, element);
      return matrix === null ? null : transformOf(matrix);
    }
    case "opening": {
      const opening = environment.openings.find(
        (candidate) => candidate.id === target.opening,
      );
      const fill = opening?.fill ?? null;
      if (fill === null) return null;
      const matrix = elementWorldMatrix(environment, fill);
      return matrix === null ? null : transformOf(matrix);
    }
    case "surface": {
      const entry = environment.surfaces.find(
        (candidate) => candidate.surface.id === target.surface,
      );
      if (entry === undefined) return null;
      // The anchor has to be ON the patch, and a vertex mean is not: the mean
      // of an L-shaped plate's corners falls in its notch, and the mean of a
      // holed slab's falls down the atrium. The widest convex piece of the
      // region always has its own mean inside itself, and for the ordinary
      // convex patch that piece is the patch.
      const anchor = footprintInteriorPoint(surfaceFootprint(entry.surface));
      if (anchor === null) return null;
      const { x, z } = anchor;
      return {
        translation: { x, y: surfaceHeightAt(entry.surface, x, z), z },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      };
    }
  }
};

/**
 * The world matrix of one element, or `null` when it or an ancestor is missing
 * or its parent chain closes on itself. A cyclic record is refused by
 * `validateBuiltEnvironment`, and answering `null` here rather than recursing
 * forever is what lets both gates report their own defect in one run.
 */
const elementWorldMatrix = (
  environment: IAutoMovieBuiltEnvironment,
  id: string,
): number[] | null => {
  const byId = new Map(
    environment.elements.map((element) => [element.id, element]),
  );
  const trail = new Set<string>();
  const read = (current: string): number[] | null => {
    if (trail.has(current)) return null;
    trail.add(current);
    const element = byId.get(current);
    if (element === undefined) return null;
    const local = Matrix4.compose(
      element.transform.translation,
      element.transform.rotation,
      element.transform.scale,
    );
    if (element.parent === null) return local;
    const parent = read(element.parent);
    return parent === null ? null : Matrix4.multiply(parent, local);
  };
  return read(id);
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

const transformOf = (matrix: number[]): IAutoMovieTransform => {
  const world = Matrix4.decompose(matrix);
  return {
    translation: world.position,
    rotation: Quaternion.normalize(world.rotation),
    scale: world.scale,
  };
};
