import type {
  IAutoMovieSoftBodyDomain,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Build the original row-major cloth panel from supplied metre origin, axis vectors and lattice spacing, using the original 1/64-second gravity-eight solver defaults. Fresh rest/mass arrays retain expression order, final overrides are shallow, and supplied axes or dimensions are not admitted or normalized here. */
export const softPanel: (props: {
  columns: number;
  rows: number;
  spacing?: { u: number; v: number };
  origin?: IAutoMovieVector3;
  axisU?: IAutoMovieVector3;
  axisV?: IAutoMovieVector3;
  overrides?: Partial<IAutoMovieSoftBodyDomain>;
}) => IAutoMovieSoftBodyDomain = (props: {
  columns: number;
  rows: number;
  /** Lattice spacing along the panel's two axes. */
  spacing?: { u: number; v: number };
  /** World position of particle `(0, 0)`. */
  origin?: IAutoMovieVector3;
  /** Direction the column index advances along; defaults to `+x`. */
  axisU?: IAutoMovieVector3;
  /** Direction the row index advances along; defaults to `-y` (a curtain). */
  axisV?: IAutoMovieVector3;
  overrides?: Partial<IAutoMovieSoftBodyDomain>;
}): IAutoMovieSoftBodyDomain => {
  const spacing: { u: number; v: number } = props.spacing ?? {
    u: 0.25,
    v: 0.25,
  };
  const origin: IAutoMovieVector3 = props.origin ?? { x: 0, y: 0, z: 0 };
  const axisU: IAutoMovieVector3 = props.axisU ?? { x: 1, y: 0, z: 0 };
  const axisV: IAutoMovieVector3 = props.axisV ?? { x: 0, y: -1, z: 0 };
  const rest: number[] = [];
  for (let row: number = 0; row < props.rows; ++row)
    for (let column: number = 0; column < props.columns; ++column)
      rest.push(
        origin.x + axisU.x * column * spacing.u + axisV.x * row * spacing.v,
        origin.y + axisU.y * column * spacing.u + axisV.y * row * spacing.v,
        origin.z + axisU.z * column * spacing.u + axisV.z * row * spacing.v,
      );
  return {
    version: 1,
    id: "panel",
    units: "meter",
    lattice: { columns: props.columns, rows: props.rows },
    solver: {
      fixedStepSeconds: 0.015625,
      gravity: { x: 0, y: -8, z: 0 },
      drag: 0,
      iterations: 2,
      stiffness: { structural: 1, shear: 0.5, bend: 0.25 },
      referenceSpeed: 4,
      maxSteps: 1_000,
    },
    rest,
    mass: new Array(props.columns * props.rows).fill(0.125),
    anchors: [],
    states: [],
    colliders: [],
    wind: null,
    selfCollision: false,
    ...props.overrides,
  };
};
