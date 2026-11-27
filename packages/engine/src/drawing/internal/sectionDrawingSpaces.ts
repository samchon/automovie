import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  type IAutoMovieDrawingDesignIndex,
  IAutoMovieDrawingPoint,
  IAutoMovieDrawingRegion,
  IAutoMovieModel,
  type IAutoMovieSectionDrawingSpaces,
} from "@automovie/interface";

import { compareRenderIds } from "../../render/internal/compareRenderIds";
import { drawingCellSection } from "./drawingCellSection";
import { drawingPolygonArea } from "./drawingPolygonArea";
import { roundDrawingPoint } from "./roundDrawingPoint";
import { roundDrawingScalar } from "./roundDrawingScalar";

/*
 * Section every included logical space's convex cells on a cut view's plane.
 *
 * Each cell the plane passes through becomes one region with its page polygon
 * on the grid, its area and its finish, sorted by space and cell. A space's
 * finish is the one surface material every element realizing a boundary of that
 * space agrees on, or `null` when they disagree or name none, because a finish
 * plan that picked one wall's material would read as a specification.
 *
 * What cannot be sectioned is counted for the caller's gaps instead of drawn: a
 * space stated as a closed shell (`shelled`, since only half-space cells are
 * cut), a cell its half-spaces leave unbounded (`unbounded`), and the ids of
 * included spaces declaring a faceted volume (`faceted`, sorted), whose regions
 * are drawn but stand for a curved region.
 * Parameter props.environment: The validated design.
 * Parameter props.frame: The cut view's page basis.
 * Parameter props.design: Index of `environment`.
 * Parameter props.spaces: Spaces the view includes, or `null` for every space.
 * Returns: The regions and the counts and ids behind the section gaps.
 */
export const sectionDrawingSpaces = (
  props: IAutoMovieSectionDrawingSpaces.IProps,
): IAutoMovieSectionDrawingSpaces.IResult => {
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
        drawingCellSection(frame, cell.planes);
      if (section.bounded === false) {
        ++unbounded;
        continue;
      }
      if (section.polygon.length < 3) continue;
      const polygon: IAutoMovieDrawingPoint[] = section.polygon.map(
        roundDrawingPoint,
      );
      regions.push({
        space: space.id,
        cell: cell.id,
        kind: space.kind,
        polygon,
        area: roundDrawingScalar(drawingPolygonArea(polygon)),
        finish: finishes.get(space.id) ?? null,
      });
    }
  }
  regions.sort(
    (left: IAutoMovieDrawingRegion, right: IAutoMovieDrawingRegion): number =>
      compareRenderIds(left.space, right.space) ||
      compareRenderIds(left.cell, right.cell),
  );
  return {
    regions,
    faceted: faceted.sort(compareRenderIds),
    shelled,
    unbounded,
  };
};

/*
 * Each space's agreed finish, or `null` where its boundaries disagree.
 */
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
