import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieConvexSpaceCell,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { appendGraphCycles } from "../validation/appendGraphCycles";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { validateBuiltSpaceShell } from "./validateBuiltSpaceShell";

/** A plane normal this short or shorter has no direction. */
const PLANE_NORMAL_EPSILON: number = 1e-12;

/**
 * Validate the logical spaces of a building and their hierarchy.
 *
 * Each space needs a unique non-blank id, a non-blank kind and a parent that
 * resolves. It states its volume at most once, as convex cells or as a closed
 * shell judged by {@link validateBuiltSpaceShell}, and a `fidelity` is either
 * `exact` or `faceted` and only allowed on a space that states a volume. Each
 * cell needs a unique non-blank id within its space and at least 4 planes, each
 * with a finite non-zero normal and a finite offset. The parent hierarchy must
 * be acyclic. Findings are pushed under `<root>.spaces`.
 *
 * @param environment Building whose spaces are checked.
 * @param root Violation path of the building, `$input`.
 * @param collector Sink that receives the violations.
 * @returns The declared space ids, for resolving references to spaces.
 *
 * @evidence contracts/common.md#principled-implementation A bounded convex cell needs at least 4 half-spaces, the fewest that enclose a volume in three dimensions, and each half-space needs a usable normal; one volume statement per space keeps containment from having two answers; the hierarchy is checked with the shared depth-first cycle walk.
 * @evidence contracts/common.md#clear-and-simple-design The space section of `validateBuiltEnvironment`, separated so that file stays one orchestration; it returns the id set every later section resolves against and delegates shells and ids to their shared checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No space kind or fidelity is special-cased beyond the two named values, and a cell is not repaired or completed.
 * @evidence contracts/common.md#meaningful-documentation The documentation states every rule for spaces, cells, planes, shells and fidelity, the hierarchy rule, the path root, and what the return value is for.
 * @evidence contracts/performance.md#efficient-algorithms Linear in spaces, cells, planes and shell size, plus the linear cycle walk; references resolve through the returned id set.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per building validation; its id set is reused by every later section.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-space cell id sets are released after each space; the caller owns the returned id set, bounded by the space count.
 */
export const validateBuiltSpaces = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): Set<string> => {
  const spaceIds: Set<string> = collectDeclaredIds(
    environment.spaces,
    `${root}.spaces`,
    "logical space",
    collector,
  );
  environment.spaces.forEach(
    (space: IAutoMovieBuiltSpace, index: number): void => {
      const path: string = `${root}.spaces[${index}]`;
      collector.nonEmpty(`${path}.kind`, space.kind, "logical-space kind");
      if (space.parent !== null && !spaceIds.has(space.parent))
        collector.push(
          "type",
          `${path}.parent`,
          `logical-space parent "${space.parent}" does not resolve`,
          space.parent,
        );
      if (space.cells.length !== 0 && space.shell !== undefined)
        collector.push(
          "type",
          `${path}.shell`,
          "a logical space states its volume once: carry either convex cells or a boundary shell, not both",
          space.shell,
        );
      if (space.fidelity !== undefined) {
        if (space.fidelity !== "exact" && space.fidelity !== "faceted")
          collector.push(
            "type",
            `${path}.fidelity`,
            `logical-space fidelity must be "exact" or "faceted", but was ${String(space.fidelity)}`,
            space.fidelity,
          );
        else if (space.cells.length === 0 && space.shell === undefined)
          collector.push(
            "type",
            `${path}.fidelity`,
            "a logical space that states no volume has nothing for a fidelity to describe",
            space.fidelity,
          );
      }
      if (space.shell !== undefined)
        validateBuiltSpaceShell(space.shell, `${path}.shell`, collector);
      const cellIds: Set<string> = new Set();
      space.cells.forEach(
        (cell: IAutoMovieConvexSpaceCell, cellIndex: number): void => {
          const cellPath: string = `${path}.cells[${cellIndex}]`;
          collector.nonEmpty(`${cellPath}.id`, cell.id, "space-cell id");
          if (cellIds.has(cell.id))
            collector.push(
              "type",
              `${cellPath}.id`,
              `space-cell id "${cell.id}" must be unique within logical space "${space.id}"`,
              cell.id,
            );
          cellIds.add(cell.id);
          if (cell.planes.length < 4)
            collector.push(
              "range",
              `${cellPath}.planes`,
              `a bounded convex cell needs at least 4 planes, but had ${cell.planes.length}`,
              cell.planes.length,
            );
          cell.planes.forEach(
            (
              plane: IAutoMovieConvexSpaceCell["planes"][number],
              planeIndex: number,
            ): void => {
              const planePath: string = `${cellPath}.planes[${planeIndex}]`;
              collector.finiteVector(
                `${planePath}.normal`,
                plane.normal,
                "plane normal",
              );
              const length: number = Vector3.length(plane.normal);
              if (Number.isFinite(length) && length <= PLANE_NORMAL_EPSILON)
                collector.push(
                  "range",
                  `${planePath}.normal`,
                  "plane normal must be non-zero",
                  plane.normal,
                );
              if (!Number.isFinite(plane.offset))
                collector.push(
                  "range",
                  `${planePath}.offset`,
                  `plane offset must be finite, but was ${plane.offset}`,
                  plane.offset,
                );
            },
          );
        },
      );
    },
  );
  appendGraphCycles(
    environment.spaces.map(
      (
        space: IAutoMovieBuiltSpace,
        index: number,
      ): { id: string; links: string[]; path: string; value: unknown } => ({
        id: space.id,
        links: space.parent === null ? [] : [space.parent],
        path: `${root}.spaces[${index}].parent`,
        value: space.parent,
      }),
    ),
    "logical space hierarchy must be acyclic",
    collector,
  );
  return spaceIds;
};
