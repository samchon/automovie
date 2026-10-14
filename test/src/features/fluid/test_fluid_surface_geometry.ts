import type { IAutoMovieFluidDomain, IAutoMovieVector3 } from "@automovie/interface";

import { fluidSurfaceGeometry, simulateFluidDomain } from "@automovie/engine";

import { TestValidator } from "@nestia/e2e";

import { fluidDomain } from "../internal/fluidFixtures";
import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";

/** Construct the original offset pool from borrowed bed/depth/solid fields, allocating a dry-obstacle mask only when omitted; the owning entry derives expected mesh data from this authored grid. */
const pool: (props: {
  columns: number;
  rows: number;
  bed: number[];
  depth: number[];
  solid?: boolean[];
}) => IAutoMovieFluidDomain = (props: {
  columns: number;
  rows: number;
  bed: number[];
  depth: number[];
  solid?: boolean[];
}): IAutoMovieFluidDomain =>
  fluidDomain({
    id: "reflecting-pool",
    grid: {
      columns: props.columns,
      rows: props.rows,
      cellX: 0.5,
      cellZ: 0.5,
      origin: { x: 2, y: 1, z: -3 },
    },
    solver: {
      fixedStepSeconds: 0.015625,
      gravity: 8,
      drag: 0,
      dryDepth: 0,
      referenceDepth: 1,
      maxSteps: 5_000,
    },
    bed: props.bed,
    depth: props.depth,
    solid: props.solid ?? new Array<boolean>(props.columns * props.rows).fill(false),
  });

/** Read one component of a dense output attribute; the owning test supplies the independently expected stride and component offset. */
const at: (values: number[], index: number, stride: number, offset: number) => number = (values: number[], index: number, stride: number, offset: number): number =>
  values[index * stride + offset];

/**
 * Derive CPU surface records from authored grid, bed and solid cells together
 * with solved depth and face velocities. Check heights, bounds, normals,
 * wet/dry triangulation and cell-centred flow against those inputs.
 *
 * These assertions observe CPU mesh data. They do not execute renderer
 * adoption, camera visibility, native upload or GPU projection.
 *
 * Scenarios:
 *
 * 1. A still flat pool: one vertex per cell at `origin.y + bed + depth`, every
 *    normal within `1e-6` of `(0, 1, 0)`, selected UV endpoints at 0 and 1,
 *    `6·(C−1)·(R−1)`
 *    indices, and bounds equal to the hand-computed corner cell centres.
 * 2. A surface tilted 0.5 vertically per metre horizontally has normals equal to
 *    the hand-computed `normalize(−0.5, 1, 0)`, at an interior vertex and at
 *    the lattice edge where the central difference degenerates to a one-sided
 *    one.
 * 3. A drained basin has no triangle indices and `null` bounds while retaining
 *    its cell vertices.
 * 4. A one-cell domain has no quad to draw and no slope to measure, so its single
 *    normal is up within `1e-6` and its UV is `(0, 0)` within `1e-6`.
 * 5. One interior pier removes its four neighboring quads, in which it occupies
 *    each local corner position; no remaining index names the solid cell.
 * 6. The per-vertex flow equals the average of the four face velocities around the
 *    cell, taken from a genuinely moving state.
 * 7. A state solved from a different domain is refused rather than drawn. Two
 *    water features over two lattices is the ordinary case, so crossing them is
 *    the ordinary mistake, and the mistake reads depths that were never indexed
 *    for this grid — an empty pond nobody was told about. Its twin is the same
 *    lattice paired with its own state, which draws.
 *
 * @evidence contracts/testing.md#behavioral-verification Lowers selected CPU fluid states into mesh data and observes cell-centre positions, normals, indices, velocity attributes, wet/solid quad decisions, bounds and domain-id refusal.
 * @evidence contracts/testing.md#independent-expectations Authored origin, bed, depth and grid spacing determine literal positions, bounds and index counts; geometric equations derive slope normals and face-averaged velocity without a recorded mesh oracle. Triangle winding is not independently asserted.
 * @evidence contracts/testing.md#distinguishing-cases Keeps flat and sloped fields, wet/dry/solid quad decisions, empty and singleton populations, a nonzero authored origin and foreign state id; renderer adoption, camera consistency and full state-source provenance are not established here.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns CPU mesh-record assertions through fluidSurfaceGeometry and existing state fixtures; no native geometry upload, image or GPU execution is observed.
 */
export function test_fluid_surface_geometry(): void {
  const flat: ReturnType<typeof pool> = pool({
    columns: 4,
    rows: 4,
    bed: new Array<number>(16).fill(0),
    depth: new Array<number>(16).fill(0.5),
  });
  const still: ReturnType<typeof fluidSurfaceGeometry> = fluidSurfaceGeometry({
    domain: flat,
    state: simulateFluidDomain(flat, 0),
  });
  TestValidator.predicate(
    "a still flat pool restates the authored grid and depth",
    (): boolean => still.mesh.positions.length === 16 * 3 &&
          Array.from({ length: 16 }, (_: unknown, k: number): boolean =>
            nclose(at(still.mesh.positions, k, 3, 1), 1.5),
          ).every(Boolean) &&
          vclose(
            {
              x: still.mesh.positions[0],
              y: still.mesh.positions[1],
              z: still.mesh.positions[2],
            },
            { x: 2.25, y: 1.5, z: -2.75 },
          ) &&
          Array.from({ length: 16 }, (_: unknown, k: number): boolean =>
            vclose(
              {
                x: at(still.mesh.normals ?? [], k, 3, 0),
                y: at(still.mesh.normals ?? [], k, 3, 1),
                z: at(still.mesh.normals ?? [], k, 3, 2),
              },
              { x: 0, y: 1, z: 0 },
            ),
          ).every(Boolean) &&
          nclose((still.mesh.uvs ?? [])[0], 0) &&
          nclose((still.mesh.uvs ?? [])[1], 0) &&
          nclose((still.mesh.uvs ?? [])[31], 1) &&
          (still.mesh.indices ?? []).length === 6 * 3 * 3 &&
          still.bounds !== null &&
          vclose(still.bounds.min, { x: 2.25, y: 1.5, z: -2.75 }) &&
          vclose(still.bounds.max, { x: 3.75, y: 1.5, z: -1.25 }) &&
          still.flow.every((value: number): boolean => value === 0 && nclose(value, 0, 0)) &&
          still.step === 0 && still.domain === "reflecting-pool",
  );

  const tiltedBed: number[] = Array.from({ length: 9 }, (_: unknown, k: number): number => (k % 3) * 0.25);
  const tilted: ReturnType<typeof pool> = pool({
    columns: 3,
    rows: 3,
    bed: tiltedBed,
    depth: new Array<number>(9).fill(0.5),
  });
  const slope: ReturnType<typeof fluidSurfaceGeometry> = fluidSurfaceGeometry({
    domain: tilted,
    state: simulateFluidDomain(tilted, 0),
  });
  const expected: IAutoMovieVector3 = {
    x: -0.5 / Math.sqrt(1.25),
    y: 1 / Math.sqrt(1.25),
    z: 0,
  };
  TestValidator.predicate(
    "a tilted surface carries the hand-computed normal",
    (): boolean =>
          vclose(
            {
              x: at(slope.mesh.normals ?? [], 4, 3, 0),
              y: at(slope.mesh.normals ?? [], 4, 3, 1),
              z: at(slope.mesh.normals ?? [], 4, 3, 2),
            },
            expected,
          ) &&
          vclose(
            {
              x: at(slope.mesh.normals ?? [], 3, 3, 0),
              y: at(slope.mesh.normals ?? [], 3, 3, 1),
              z: at(slope.mesh.normals ?? [], 3, 3, 2),
            },
            expected,
          ),
  );

  const drained: ReturnType<typeof pool> = pool({
    columns: 4,
    rows: 4,
    bed: new Array<number>(16).fill(0),
    depth: new Array<number>(16).fill(0),
  });
  const nothing: ReturnType<typeof fluidSurfaceGeometry> = fluidSurfaceGeometry({
    domain: drained,
    state: simulateFluidDomain(drained, 0),
  });
  const single: ReturnType<typeof pool> = pool({ columns: 1, rows: 1, bed: [0], depth: [0.5] });
  const alone: ReturnType<typeof fluidSurfaceGeometry> = fluidSurfaceGeometry({
    domain: single,
    state: simulateFluidDomain(single, 0),
  });
  TestValidator.predicate(
    "a drained basin and a one-cell domain draw nothing",
    (): boolean => (nothing.mesh.indices ?? []).length === 0 &&
      nothing.bounds === null && nothing.mesh.positions.length === 48 &&
      (alone.mesh.indices ?? []).length === 0 && alone.mesh.positions.length === 3 &&
          vclose(
            {
              x: (alone.mesh.normals ?? [])[0],
              y: (alone.mesh.normals ?? [])[1],
              z: (alone.mesh.normals ?? [])[2],
            },
            { x: 0, y: 1, z: 0 },
          ) &&
          nclose((alone.mesh.uvs ?? [])[0], 0) &&
          nclose((alone.mesh.uvs ?? [])[1], 0),
  );

  const solid: boolean[] = new Array<boolean>(16).fill(false);
  solid[5] = true;
  const depth: number[] = new Array<number>(16).fill(0.5);
  depth[5] = 0;
  const pier: ReturnType<typeof pool> = pool({
    columns: 4,
    rows: 4,
    bed: new Array<number>(16).fill(0),
    depth,
    solid,
  });
  const around: ReturnType<typeof fluidSurfaceGeometry> = fluidSurfaceGeometry({
    domain: pier,
    state: simulateFluidDomain(pier, 0),
  });
  TestValidator.equals(
    "a pier removes exactly the quads that touch it",
    namedFacts([
      ["quadCount", (): boolean => (around.mesh.indices ?? []).length === 6 * 5],
      [
        "noPierVertex",
        (): boolean => (around.mesh.indices ?? []).every((index: number): boolean => index !== 5),
      ],
    ]),
    { quadCount: true, noPierVertex: true },
  );

  const moving: ReturnType<typeof pool> = pool({
    columns: 4,
    rows: 4,
    bed: new Array<number>(16).fill(0),
    depth: [
      0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.25, 0.25, 0.5,
      0.5, 0.25, 0.25,
    ],
  });
  const state: ReturnType<typeof simulateFluidDomain> = simulateFluidDomain(moving, 20);
  const flowing: ReturnType<typeof fluidSurfaceGeometry> = fluidSurfaceGeometry({ domain: moving, state });
  TestValidator.predicate(
    "the per-vertex flow is the cell-centred face average",
    (): boolean =>
          Array.from({ length: 16 }, (_: unknown, cell: number): boolean => {
            const row: number = Math.floor(cell / 4);
            const column: number = cell % 4;
            const west: number = row * 5 + column;
            const south: number = row * 4 + column;
            return (
              nclose(
                flowing.flow[cell * 2],
                (state.velocityX[west] + state.velocityX[west + 1]) / 2,
                0,
              ) &&
              nclose(
                flowing.flow[cell * 2 + 1],
                (state.velocityZ[south] + state.velocityZ[south + 4]) / 2,
                0,
              )
            );
          }).every(Boolean) &&
      flowing.flow.some((value: number): boolean => value !== 0) && flowing.step === 20,
  );

  const other: ReturnType<typeof fluidDomain> = fluidDomain({ id: "other-pool" });
  TestValidator.equals(
    "a surface is derived from its own domain's state or from none",
    namedFacts([
      [
        "foreignState",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof fluidSurfaceGeometry> =>
              fluidSurfaceGeometry({
                domain: moving,
                state: simulateFluidDomain(other, 0),
              }),
            ["reflecting-pool", "other-pool"],
          ),
      ],
      [
        "ownState",
        (): boolean =>
          throwsError((): ReturnType<typeof fluidSurfaceGeometry> =>
            fluidSurfaceGeometry({
              domain: moving,
              state: simulateFluidDomain(moving, 0),
            }),
          ) === false,
      ],
    ]),
    { foreignState: true, ownState: true },
  );
}
