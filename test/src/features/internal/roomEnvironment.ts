import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

/** Build the original room, track, stand-pipe, floor and convex-cell fixture. Root/track/stand-pipe deliberately share one fresh identity transform within each call; semantic=true omits convex cells. Defaults, metre extents and shallow reference sharing are preserved without geometric admission. */
export const roomEnvironment: (props?: { id?: string; space?: string; half?: number; floor?: number; ceiling?: number; semantic?: boolean }) => IAutoMovieBuiltEnvironment = (
  props: {
    id?: string;
    space?: string;
    /** Half-extent of the room box on `x`/`z`, centred on the origin. */
    half?: number;
    /** Floor height of the room box. */
    floor?: number;
    /** Ceiling height of the room box. */
    ceiling?: number;
    /** Leave the logical space purely semantic (no convex cells). */
    semantic?: boolean;
  } = {},
): IAutoMovieBuiltEnvironment => {
  const id: string = props.id ?? "suite";
  const space: string = props.space ?? "suite-room";
  const half: number = props.half ?? 8;
  const floor: number = props.floor ?? -4;
  const ceiling: number = props.ceiling ?? 4;
  const identity: { translation: { x: number; y: number; z: number; }; rotation: { x: number; y: number; z: number; w: number; }; scale: { x: number; y: number; z: number; }; } = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
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
        transform: identity,
        model: null,
        space,
      },
      {
        id: "track",
        kind: "curtain-track",
        parent: "root",
        transform: identity,
        model: null,
        space,
      },
      {
        id: "stand-pipe",
        kind: "service-port",
        parent: "root",
        transform: identity,
        model: null,
        space,
      },
    ],
    spaces: [
      {
        id: space,
        kind: "room",
        parent: null,
        cells:
          props.semantic === true
            ? []
            : [
                {
                  id: "room-cell",
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
      { id: "window-wall", kind: "wall", spaces: [space], elements: ["track"] },
    ],
    openings: [],
    connectors: [],
    surfaces: [
      {
        space,
        surface: {
          id: "room-floor",
          kind: "floor",
          polygon: [
            { x: -half, y: 0, z: -half },
            { x: half, y: 0, z: -half },
            { x: half, y: 0, z: half },
            { x: -half, y: 0, z: half },
          ],
          anchor: { x: 0, y: 0, z: 0 },
          rampTo: null,
        },
      },
    ],
    walkable: ["room-floor"],
  };
};
