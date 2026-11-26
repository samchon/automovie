import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieConvexSpaceCell,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { appendGraphCycles } from "../../validation/appendGraphCycles";
import { collectDeclaredIds } from "../../validation/collectDeclaredIds";
import { validateBuiltSpaceShell } from "./validateBuiltSpaceShell";

/** A plane normal this short or shorter has no direction. */
const PLANE_NORMAL_EPSILON: number = 1e-12;

/**
 * Validate the logical spaces of a building and their hierarchy.
 *
 * Each space needs a unique id, a non-blank kind and a parent that resolves. It
 * states its volume at most once, as convex cells or as a closed shell judged
 * by {@link validateBuiltSpaceShell}, and a `fidelity` is either `exact` or
 * `faceted` and only allowed on a space that states a volume. Each cell needs a
 * unique id within its space and at least 4 planes, each with a finite non-zero
 * normal and a finite offset. The parent hierarchy must be acyclic. Findings
 * are pushed under `<root>.spaces`.
 *
 * @param environment Building whose spaces are checked.
 * @param root Violation path of the building, `$input`.
 * @param collector Sink that receives the violations.
 * @returns The declared space ids, for resolving references to spaces.
 */
export function validateBuiltSpaces(
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: IAutoMovieViolationCollector,
): Set<string> {
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
              const length: number = Vector3.length(plane.normal);
              if (length <= PLANE_NORMAL_EPSILON)
                collector.push(
                  "range",
                  `${planePath}.normal`,
                  "plane normal must have finite non-zero computed length",
                  plane.normal,
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
}
