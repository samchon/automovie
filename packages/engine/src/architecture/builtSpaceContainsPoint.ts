import { IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Does one logical space's own stated volume contain a point?
 *
 * The single place either spelling is read, so nothing has to know which one a
 * space used: a celled space is the union of its half-space cells, a shelled
 * space is the inside of its own closed boundary, and a space that states
 * neither locates nothing and contains nothing. Every containment consumer —
 * the descendant-folding query above, room visibility's per-leaf placement,
 * prop occupancy, a fluid basin's stray-cell walk — goes through here, because
 * a second reading of the same field is how a room and its own camera ended up
 * with two answers about where the camera stood.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtSpaceContainsPoint` answers "Does one logical space's own stated volume contain a point?" This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtSpaceContainsPoint` tests a point only against one logical space's own declared cells or shell.
 * @author Samchon
 */
export const builtSpaceContainsPoint = (
  space: IAutoMovieBuiltSpace,
  point: IAutoMovieVector3,
): boolean => {
  if (space.shell !== undefined)
    return spaceShellContainsPoint(space.shell, point);
  return space.cells.some((cell) =>
    cell.planes.every(
      (plane) =>
        plane.normal.x * point.x +
          plane.normal.y * point.y +
          plane.normal.z * point.z <=
        plane.offset + CONTAINMENT_EPSILON,
    ),
  );
};
