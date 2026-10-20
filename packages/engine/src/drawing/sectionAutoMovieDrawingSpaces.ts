import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingPoint,
  IAutoMovieDrawingRegion,
  IAutoMovieModel,
} from "@automovie/interface";

import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { autoMovieDrawingCellSection } from "./autoMovieDrawingCellSection";
import { autoMovieDrawingPolygonArea } from "./autoMovieDrawingPolygonArea";
import { roundAutoMovieDrawingPoint } from "./roundAutoMovieDrawingPoint";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/**
 * Section every included logical space's convex cells on a cut view's plane.
 *
 * Each cell the plane passes through becomes one region with its page polygon
 * on the grid, its area and its finish, sorted by space and cell. A space's
 * finish is the one surface material every element realizing a boundary of
 * that space agrees on, or `null` when they disagree or name none, because a
 * finish plan that picked one wall's material would read as a specification.
 *
 * What cannot be sectioned is counted for the caller's gaps instead of drawn:
 * a space stated as a closed shell (`shelled`, since only half-space cells are
 * cut), a cell its half-spaces leave unbounded (`unbounded`), and the ids of
 * included spaces declaring a faceted volume (`faceted`, sorted), whose
 * regions are drawn but stand for a curved region.
 *
 * @param props.environment The validated design.
 * @param props.frame The cut view's page basis.
 * @param props.design Index of `environment`.
 * @param props.spaces Spaces the view includes, or `null` for every space.
 * @returns The regions and the counts and ids behind the section gaps.
 *
 * @evidence contracts/common.md#principled-implementation Sections each convex cell with `autoMovieDrawingCellSection` and measures it with the shoelace area, exact for the convex polygons a plane cuts from convex cells; the finish is a set intersection over the materials of the elements realizing the space's boundaries, which needs no tie-break because disagreement yields `null`.
 * @evidence contracts/common.md#clear-and-simple-design One function owns region drafting and the facts its three gaps report, and the derivation only words the gaps; the finish table is a private helper because nothing else reads it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No space, cell or material is special-cased; shelled and unbounded volumes are counted for declared gaps rather than approximated, and a disputed finish is `null` rather than the first material found.
 * @evidence contracts/common.md#meaningful-documentation The comment states what becomes a region, the rounding and order, the finish rule and why, and each counted case with its reason.
 * @evidence contracts/performance.md#efficient-algorithms The finish table is built in one pass over the boundaries and the parts of their realizing elements' models instead of once per cell, and each cell is sectioned once in time quadratic in its plane count at worst; the final sort is `O(R log R)` in the region count.
 * @evidence contracts/performance.md#reuse-equivalent-work Every cell of a space shares that space's one finish from the table, and element and model lookups come from the design index rather than scans.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The finish table and material sets live for the call and are released on return; they are bounded by the space count and the distinct materials per space, and only the returned regions and ids, owned by the caller, survive.
 */
export const sectionAutoMovieDrawingSpaces = (props: {
  environment: IAutoMovieBuiltEnvironment;
  frame: IAutoMovieDrawingFrame;
  design: IAutoMovieDrawingDesignIndex;
  spaces: ReadonlySet<string> | null;
}): {
  regions: IAutoMovieDrawingRegion[];
  faceted: string[];
  shelled: number;
  unbounded: number;
} => {
  const { environment, frame, design, spaces } = props;
  const finishes: Map<string, string | null> = spaceFinishes(
    environment,
    design,
  );
  const regions: IAutoMovieDrawingRegion[] = [];
  const faceted: string[] = [];
  let shelled: number = 0;
  let unbounded: number = 0;
  for (const space of environment.spaces) {
    if (spaces !== null && !spaces.has(space.id)) continue;
    if (space.fidelity === "faceted") faceted.push(space.id);
    if (space.shell !== undefined) {
      ++shelled;
      continue;
    }
    for (const cell of space.cells) {
      const section: { polygon: IAutoMovieDrawingPoint[]; bounded: boolean } =
        autoMovieDrawingCellSection(frame, cell.planes);
      if (section.bounded === false) {
        ++unbounded;
        continue;
      }
      if (section.polygon.length < 3) continue;
      const polygon: IAutoMovieDrawingPoint[] = section.polygon.map(
        roundAutoMovieDrawingPoint,
      );
      regions.push({
        space: space.id,
        cell: cell.id,
        kind: space.kind,
        polygon,
        area: roundAutoMovieDrawingScalar(autoMovieDrawingPolygonArea(polygon)),
        finish: finishes.get(space.id) ?? null,
      });
    }
  }
  regions.sort(
    (left: IAutoMovieDrawingRegion, right: IAutoMovieDrawingRegion): number =>
      compareAutoMovieRenderIds(left.space, right.space) ||
      compareAutoMovieRenderIds(left.cell, right.cell),
  );
  return {
    regions,
    faceted: faceted.sort(compareAutoMovieRenderIds),
    shelled,
    unbounded,
  };
};

/** Each space's agreed finish, or `null` where its boundaries disagree. */
const spaceFinishes = (
  environment: IAutoMovieBuiltEnvironment,
  design: IAutoMovieDrawingDesignIndex,
): Map<string, string | null> => {
  const materials: Map<string, Set<string>> = new Map();
  for (const boundary of environment.boundaries)
    for (const id of boundary.elements) {
      const element: IAutoMovieBuiltElement = design.elements.get(id)!;
      const model: IAutoMovieModel | undefined =
        element.model === null ? undefined : design.models.get(element.model);
      if (model === undefined) continue;
      for (const part of model.parts) {
        if (part.material === null) continue;
        for (const space of boundary.spaces) {
          let set: Set<string> | undefined = materials.get(space);
          if (set === undefined) {
            set = new Set();
            materials.set(space, set);
          }
          set.add(part.material);
        }
      }
    }
  const finishes: Map<string, string | null> = new Map();
  for (const [space, set] of materials)
    finishes.set(space, set.size === 1 ? [...set][0]! : null);
  return finishes;
};
