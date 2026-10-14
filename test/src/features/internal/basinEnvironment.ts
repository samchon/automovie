import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

/** Build the original one-space basin environment and six bounding halfspaces. Optional metre extents and identities retain their defaults; this source-data fixture creates fresh records without validating geometry or installing a water renderer. */
export const basinEnvironment: (props?: { id?: string; space?: string; half?: number; floor?: number; ceiling?: number }) => IAutoMovieBuiltEnvironment = (
  props: {
    id?: string;
    space?: string;
    /** Half-extent of the basin box on `x`/`z`, centred on the origin. */
    half?: number;
    /** Floor height of the basin box. */
    floor?: number;
    /** Ceiling height of the basin box. */
    ceiling?: number;
  } = {},
): IAutoMovieBuiltEnvironment => {
  const id: string = props.id ?? "atrium";
  const space: string = props.space ?? "atrium-basin";
  const half: number = props.half ?? 8;
  const floor: number = props.floor ?? -1;
  const ceiling: number = props.ceiling ?? 4;
  return {
    version: 1,
    id,
    units: "meter",
    buildings: [{ id: "unit", element: "root", space }],
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
        space,
      },
    ],
    spaces: [
      {
        id: space,
        kind: "room",
        parent: null,
        cells: [
          {
            id: "basin-cell",
            planes: [
              { normal: { x: -1, y: 0, z: 0 }, offset: half },
              { normal: { x: 1, y: 0, z: 0 }, offset: half },
              { normal: { x: 0, y: -1, z: 0 }, offset: -floor },
              { normal: { x: 0, y: 1, z: 0 }, offset: ceiling },
              { normal: { x: 0, y: 0, z: -1 }, offset: half },
              { normal: { x: 0, y: 0, z: 1 }, offset: half },
            ],
          },
        ],
      },
    ],
    boundaries: [
      { id: "coping", kind: "wall", spaces: [space], elements: [] },
      { id: "elsewhere", kind: "wall", spaces: ["other"], elements: [] },
    ],
    openings: [],
    connectors: [],
    surfaces: [],
    walkable: [],
  };
};
