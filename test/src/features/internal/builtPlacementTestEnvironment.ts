import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieTransform,
} from "@automovie/interface";

import { makeProp, primitivePart } from "./fixtures";

const place = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const boxModel = (
  id: string,
  width: number,
  height: number,
  depth: number,
): IAutoMovieModel => ({
  ...makeProp([
    primitivePart(`${id}-box`, { type: "box", width, height, depth }),
  ]),
  id,
});

/** Create fresh geometry and population bounds for contact and overlap classification. */
export const builtPlacementTestEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "placement-house",
    units: "meter",
    buildings: [{ id: "house", element: "root", space: "whole" }],
    models: [
      boxModel("slab-model", 4, 1, 4),
      boxModel("cube-model", 1, 1, 1),
      boxModel("ceiling-model", 4, 0.5, 4),
    ],
    modelReferences: ["external-model"],
    elements: [
      {
        id: "root",
        kind: "building",
        parent: null,
        transform: place(0, 0, 0),
        model: null,
        space: "whole",
      },
      {
        id: "slab",
        kind: "slab",
        parent: "root",
        transform: place(0, 0.5, 0),
        model: "slab-model",
        space: "whole",
      },
      {
        id: "resting",
        kind: "equipment",
        parent: "root",
        transform: place(0, 1.5, 0),
        model: "cube-model",
        space: "whole",
      },
      {
        id: "floating",
        kind: "equipment",
        parent: "root",
        transform: place(0, 1.75, 0),
        model: "cube-model",
        space: "whole",
      },
      {
        id: "sunk",
        kind: "equipment",
        parent: "root",
        transform: place(0, 1.25, 0),
        model: "cube-model",
        space: "whole",
      },
      {
        id: "off-support",
        kind: "equipment",
        parent: "root",
        transform: place(5, 1.5, 0),
        model: "cube-model",
        space: "whole",
      },
      {
        id: "overlap-neighbour",
        kind: "equipment",
        parent: "root",
        transform: place(0.5, 1.5, 0),
        model: "cube-model",
        space: "whole",
      },
      {
        id: "touch-neighbour",
        kind: "equipment",
        parent: "root",
        transform: place(1, 1.5, 0),
        model: "cube-model",
        space: "whole",
      },
      {
        id: "chandelier",
        kind: "chandelier",
        parent: "root",
        transform: place(0, 3, 0),
        model: "cube-model",
        space: "whole",
      },
      {
        id: "population-resting",
        kind: "attachment",
        parent: "root",
        transform: place(0, 2.5, 4),
        model: "cube-model",
        space: "whole",
      },
      {
        id: "ceiling",
        kind: "ceiling",
        parent: "root",
        transform: place(0, 5, 0),
        model: "ceiling-model",
        space: "whole",
      },
      {
        id: "external",
        kind: "external-fixture",
        parent: "root",
        transform: place(0, 1, 0),
        model: "external-model",
        space: "whole",
      },
    ],
    populations: [
      {
        space: "whole",
        prototypeBounds: {
          min: { x: -0.5, y: 0, z: -0.5 },
          max: { x: 0.5, y: 1, z: 0.5 },
        },
        set: {
          id: "flags",
          modelRecipe: "flag-recipe",
          count: 3,
          layout: {
            kind: "grid",
            rows: 1,
            columns: 3,
            spacing: { x: 1, z: 1 },
          },
          anchor: { x: 0, y: 1, z: 4 },
          facingDeg: 0,
          seed: 1930,
          variation: {
            scale: { min: 1, max: 1 },
            palette: ["#808080"],
            traits: [],
          },
        },
      },
    ],
    spaces: [{ id: "whole", kind: "building", parent: null, cells: [] }],
    boundaries: [],
    openings: [],
    connectors: [],
    surfaces: [
      {
        space: "whole",
        surface: {
          id: "floor-surface",
          kind: "floor",
          polygon: [
            { x: -2, y: 0, z: -2 },
            { x: 2, y: 0, z: -2 },
            { x: 2, y: 0, z: 2 },
            { x: -2, y: 0, z: 2 },
          ],
          height: { kind: "constant", value: 1 },
        },
      },
    ],
    walkable: [],
  });
