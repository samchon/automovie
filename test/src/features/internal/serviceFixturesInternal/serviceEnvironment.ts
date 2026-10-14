import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Return the existing three-room numerical bathhouse in metres.
 * Bath occupies X [0,4], hall [4,7] and plant [7,10], each at Y [0,3]
 * and Z [0,5]. The cell-free works root supplies semantic containment only.
 * Each call owns fresh room, boundary, opening and half-space records.
 */
export function serviceEnvironment(): IAutoMovieBuiltEnvironment {
  return {
    version: 1,
    id: "bathhouse",
    units: "meter",
    buildings: [{ id: "unit", element: "root", space: "works" }],
    models: [],
    modelReferences: [],
    elements: [
      {
        id: "root",
        kind: "building",
        parent: null,
        transform: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        model: null,
        space: "works",
      },
    ],
    spaces: [
      { id: "works", kind: "building", parent: null, cells: [] },
      {
        id: "bath",
        kind: "room",
        parent: "works",
        cells: [boxCell("bath-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 5 })],
      },
      {
        id: "hall",
        kind: "room",
        parent: "works",
        cells: [boxCell("hall-cell", { x: 4, y: 0, z: 0 }, { x: 7, y: 3, z: 5 })],
      },
      {
        id: "plant",
        kind: "room",
        parent: "works",
        cells: [
          boxCell("plant-cell", { x: 7, y: 0, z: 0 }, { x: 10, y: 3, z: 5 }),
        ],
      },
    ],
    boundaries: [
      {
        id: "bath-hall",
        kind: "wall",
        spaces: ["bath", "hall"],
        elements: [],
        face: partitionFace(4),
      },
      {
        id: "hall-plant",
        kind: "wall",
        spaces: ["hall", "plant"],
        elements: [],
        face: partitionFace(7),
      },
      { id: "bath-shell", kind: "wall", spaces: ["bath"], elements: [] },
      { id: "plant-shell", kind: "wall", spaces: ["plant"], elements: [] },
    ],
    openings: [
      {
        id: "service-chase",
        kind: "passage",
        boundary: "bath-hall",
        fill: null,
        profile: {
          outline: [
            { x: -1.5, y: 0 },
            { x: -0.5, y: 0 },
            { x: -0.5, y: 0.6 },
            { x: -1.5, y: 0.6 },
          ],
        },
      },
      { id: "plant-hatch", kind: "hatch", boundary: "hall-plant", fill: null },
    ],
    connectors: [],
    surfaces: [],
    walkable: [],
  };
}

/** A +Y quarter turn maps local X to world -Z, so partition points read as (-z,y,0). */
function partitionFace(x: number): NonNullable<IAutoMovieBuiltEnvironment["boundaries"][number]["face"]> {
  return {
    origin: { x, y: 0, z: 0 },
    rotation: {
      x: 0,
      y: Math.SQRT1_2,
      z: 0,
      w: Math.SQRT1_2,
    },
    outline: [
      { x: -5, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 3 },
      { x: -5, y: 3 },
    ],
    thickness: 0.2,
  };
}

/** Intersect six axis half-spaces to preserve the fixture's authored room bounds. */
function boxCell(id: string, min: IAutoMovieVector3, max: IAutoMovieVector3): IAutoMovieBuiltEnvironment["spaces"][number]["cells"][number] {
  return {
    id,
    planes: [
      { normal: { x: 1, y: 0, z: 0 }, offset: max.x },
      { normal: { x: -1, y: 0, z: 0 }, offset: -min.x },
      { normal: { x: 0, y: 1, z: 0 }, offset: max.y },
      { normal: { x: 0, y: -1, z: 0 }, offset: -min.y },
      { normal: { x: 0, y: 0, z: 1 }, offset: max.z },
      { normal: { x: 0, y: 0, z: -1 }, offset: -min.z },
    ],
  };
}
