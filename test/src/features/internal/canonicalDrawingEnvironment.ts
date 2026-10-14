import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { DRAWING_FIXTURE_NO_ROTATION as NO_ROTATION } from "./DRAWING_FIXTURE_NO_ROTATION";
import { canonicalDrawingBoxModel as drawingBoxModel } from "./canonicalDrawingBoxModel";
import { canonicalDrawingCell as drawingCell } from "./canonicalDrawingCell";
import { canonicalDrawingPlace as drawingPlace } from "./canonicalDrawingPlace";

/**
 * An authored atelier with elements below, through and above the plan cut.
 *
 * Literal dimensions support hand calculations for the slab, wall, beam, child door and footing. The boundaries include a rectangular door, a two-arc oculus and an opening without geometry.
 */
export const canonicalDrawingEnvironment: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
    version: 1,
    id: "atelier",
    units: "meter",
    buildings: [{ id: "unit-a", element: "shell", space: "site" }],
    models: [
      drawingBoxModel({
        id: "slab",
        shape: { type: "box", width: 10, height: 0.2, depth: 6 },
        material: "screed",
      }),
      drawingBoxModel({
        id: "wall",
        shape: { type: "box", width: 6, height: 3, depth: 0.2 },
        material: "plaster",
      }),
      drawingBoxModel({
        id: "beam",
        shape: { type: "box", width: 6, height: 0.4, depth: 0.3 },
        material: "plaster",
      }),
      drawingBoxModel({
        id: "leaf",
        shape: { type: "box", width: 0.9, height: 2.1, depth: 0.05 },
        material: "oak",
      }),
    ],
    modelReferences: [],
    elements: [
      {
        id: "shell",
        kind: "building",
        parent: null,
        transform: drawingPlace(0, 0, 0),
        model: null,
        space: "site",
      },
      {
        id: "floor-slab",
        kind: "slab",
        parent: "shell",
        transform: drawingPlace(5, -0.1, 3),
        model: "slab",
        space: "hall",
      },
      {
        id: "north-wall",
        kind: "wall",
        parent: "shell",
        transform: drawingPlace(3, 1.5, 0.1),
        model: "wall",
        space: "hall",
      },
      {
        id: "door-leaf",
        kind: "door-leaf",
        parent: "north-wall",
        transform: drawingPlace(-1.5, -0.45, 0),
        model: "leaf",
        space: "hall",
      },
      {
        id: "roof-beam",
        kind: "beam",
        parent: "shell",
        transform: drawingPlace(3, 3.2, 3),
        model: "beam",
        space: "roof-deck",
      },
      {
        id: "footing",
        kind: "footing",
        parent: "shell",
        transform: drawingPlace(5, -0.6, 3),
        model: "slab",
        space: "hall",
      },
    ],
    spaces: [
      { id: "site", kind: "building", parent: null, cells: [] },
      {
        id: "hall",
        kind: "room",
        parent: "site",
        cells: [
          drawingCell("hall-cell", { x: 0, y: 0, z: 0 }, { x: 10, y: 3, z: 6 }),
        ],
      },
      {
        id: "roof-deck",
        kind: "roof-deck",
        parent: "site",
        cells: [
          drawingCell(
            "deck-cell",
            { x: 0, y: 3, z: 0 },
            { x: 10, y: 3.5, z: 6 },
          ),
        ],
      },
    ],
    boundaries: [
      {
        id: "north",
        kind: "wall",
        spaces: ["hall"],
        elements: ["north-wall"],
        face: {
          origin: { x: 0, y: 0, z: 0 },
          rotation: NO_ROTATION,
          outline: [
            { x: 0, y: 0 },
            { x: 6, y: 0 },
            { x: 6, y: 3 },
            { x: 0, y: 3 },
          ],
          thickness: 0.2,
        },
      },
      {
        id: "parapet",
        kind: "parapet",
        spaces: ["roof-deck"],
        elements: [],
        face: {
          origin: { x: 0, y: 3, z: 0 },
          rotation: NO_ROTATION,
          outline: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 0.5 },
            { x: 0, y: 0.5 },
          ],
          thickness: 0.2,
        },
      },
    ],
    openings: [
      {
        id: "front-door",
        kind: "door",
        boundary: "north",
        fill: "door-leaf",
        profile: {
          outline: [
            { x: 1.05, y: 0 },
            { x: 1.95, y: 0 },
            { x: 1.95, y: 2.1 },
            { x: 1.05, y: 2.1 },
          ],
        },
      },
      {
        id: "oculus",
        kind: "window",
        boundary: "north",
        fill: null,
        profile: {
          outline: [
            { x: 3, y: 2 },
            { x: 3.6, y: 2 },
          ],
          bulges: [1, 1],
        },
      },
      { id: "vent", kind: "vent", boundary: "north", fill: null },
    ],
    connectors: [
      {
        id: "roof-stair",
        kind: "stair",
        from: "hall",
        to: "roof-deck",
        bidirectional: true,
        route: [
          { x: 9, y: 0, z: 5 },
          { x: 9, y: 3, z: 3 },
        ],
        width: 1.2,
        clearHeight: 2.1,
        elements: [],
      },
      {
        id: "service-ramp",
        kind: "ramp",
        from: "hall",
        to: "roof-deck",
        bidirectional: false,
        route: [
          { x: 0.5, y: 0, z: 5 },
          { x: 0.5, y: 3, z: 1 },
        ],
        sections: [
          { at: 0, width: 1.5, clearHeight: 2.2 },
          { at: 1, width: 1.2, clearHeight: 2.4 },
        ],
        elements: [],
      },
    ],
    surfaces: [
      {
        space: "hall",
        surface: {
          id: "hall-floor",
          kind: "floor",
          polygon: [
            { x: 0, y: 0, z: 0 },
            { x: 10, y: 0, z: 0 },
            { x: 10, y: 0, z: 6 },
            { x: 0, y: 0, z: 6 },
          ],
          height: { kind: "constant", value: 0 },
        },
      },
    ],
    walkable: ["hall-floor"],
  });
