import { IAutoMovieHeightRule, IAutoMovieSpace, IAutoMovieSurface, IAutoMovieVector3 } from "@automovie/interface";

/** Builds the existing floor, ramp and lattice fixtures without sharing mutations between validation cases. */
export function validationSpaceFixtures(): {
  v: (x: number, z: number, y?: number) => IAutoMovieVector3;
  floor: IAutoMovieSurface;
  ramp: IAutoMovieSurface;
  valid: IAutoMovieSpace;
  withSurface: (surface: Partial<IAutoMovieSurface>) => IAutoMovieSpace;
  withHeight: (height: IAutoMovieHeightRule) => IAutoMovieSpace;
  lattice: (partial?: Partial<Extract<IAutoMovieHeightRule, { kind: "heightfield" }>>) => IAutoMovieHeightRule;
} {


  const v: (x: number, z: number, y?: number) => { x: number; y: number; z: number; } = (x: number, z: number, y: number = 0): { x: number; y: number; z: number; } => ({ x, y, z });

  const floor: IAutoMovieSurface = {
  id: "floor",
  kind: "floor",
  polygon: [v(0, 0), v(4, 0), v(4, 4), v(0, 4)],
  anchor: { x: 0, y: 0, z: 0 },
  rampTo: null,
};
  const ramp: IAutoMovieSurface = {
  id: "ramp",
  kind: "ramp",
  polygon: [v(4, 0), v(8, 0), v(8, 4), v(4, 4)],
  anchor: { x: 4, y: 0, z: 0 },
  rampTo: { x: 8, y: 2, z: 0 },
};
  const valid: IAutoMovieSpace = {
  id: "set",
  surfaces: [floor, ramp],
  walkable: ["floor", "ramp"],
};

  const withSurface: (surface: Partial<IAutoMovieSurface>) => IAutoMovieSpace = (surface: Partial<IAutoMovieSurface>): IAutoMovieSpace => ({
  ...valid,
  surfaces: [floor, { ...ramp, ...surface }],
});

/**
 * The same footprint, stating its ground through a rule instead of anchors.
 *
 * Built fresh rather than spread over {@link ramp}, because a surface carrying
 * both spellings is itself one of the things refused below.
 */
  const withHeight: (height: IAutoMovieHeightRule) => IAutoMovieSpace = (height: IAutoMovieHeightRule): IAutoMovieSpace => ({
  ...valid,
  surfaces: [
    floor,
    { id: ramp.id, kind: ramp.kind, polygon: ramp.polygon, height },
  ],
});

/** A well-formed two-by-two lattice, before a scenario spoils one field. */
  const lattice: (partial?: Partial<Extract<IAutoMovieHeightRule, { kind: "heightfield"; }>>) => IAutoMovieHeightRule = (
  partial: Partial<Extract<IAutoMovieHeightRule, { kind: "heightfield" }>> = {},
): IAutoMovieHeightRule => ({
  kind: "heightfield",
  originX: 4,
  originZ: 0,
  spacingX: 2,
  spacingZ: 2,
  columns: 2,
  rows: 2,
  samples: [0, 1, 0, 1],
  ...partial,
});
  return { v, floor, ramp, valid, withSurface, withHeight, lattice };
}
