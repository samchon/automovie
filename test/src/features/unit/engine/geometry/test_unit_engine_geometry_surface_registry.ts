import {
  registerAutoMovieSurfaceVertices,
  rigAutoMovieSweep,
} from "@automovie/engine";
import type {
  IAutoMovieSurfaceRegistry,
  IAutoMovieSweep,
  IAutoMovieSweepRig,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `registerAutoMovieSurfaceVertices` binds each sweep dependent once, at
 * finalization, to the final geometric cell of its key, and writes the same
 * point the emitted vertex writes.
 *
 * Fixture: a straight unit tube of one superellipse station (half widths 1 and
 * 2); samples at (u, v) = (0.25, 0.071) whose cells report reaches (right, up,
 * left, down), Infinity meaning unreached.
 *
 * Scenarios:
 *
 * 1. Reaches (Inf, 0.25, 0.25, Inf) and (0.125, Inf, Inf, 0.0625) admitted in
 *    either order: the binding waits for finalization, runs once, sees the per
 *    side minimum (0.125, 0.25, 0.25, 0.0625), and writes exactly the emitted
 *    vertex once the rig is sealed; a later binding, reservation or second
 *    finalization is refused.
 * 2. One reach 0.25 mirrors to its missing partner, (0.25, 0.25, 0, 0); none
 *    reached is all zero; a key never admitted binds null and adds no vertex.
 * 3. A failing binding escapes finalization, runs once and is not retried.
 */
export function test_unit_engine_geometry_surface_registry(): void {
  const sweep: IAutoMovieSweep = {
    spine: {
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [
      {
        at: 0,
        section: {
          type: "superellipse",
          right: 1,
          left: 1,
          up: 2,
          down: 2,
          exponents: [2, 2, 2, 2],
        },
      },
    ],
  };
  const start = () => {
    const rig: IAutoMovieSweepRig = rigAutoMovieSweep({
      sweep,
      preserveVolume: false,
    });
    return {
      rig,
      registry: registerAutoMovieSurfaceVertices((): IAutoMovieSweepRig => rig),
    };
  };
  const admit = (
    registry: IAutoMovieSurfaceRegistry,
    key: string,
    cell: [number, number, number, number],
  ): void => {
    registry.admit({
      key,
      point: { sweep: "tube", u: 0.25, v: 0.071, cell },
      writer: (): never => {
        throw new Error("a geometric sample must use its resolved writer");
      },
      sweep: null,
      curve: null,
    });
  };
  const reports: [number, number, number, number][] = [
    [Infinity, 0.25, 0.25, Infinity],
    [0.125, Infinity, Infinity, 0.0625],
  ];

  // 1.
  for (const order of [
    [0, 1],
    [1, 0],
  ]) {
    const { rig, registry } = start();
    const seen: (IAutoMovieSurfaceRegistry.ISweep | null)[] = [];
    registry.bindSweep(
      "shared",
      (sample: IAutoMovieSurfaceRegistry.ISweep | null): void =>
        void seen.push(sample),
    );
    for (const side of order) admit(registry, "shared", reports[side]!);
    TestValidator.equals(`${order} waits`, seen.length, 0);
    registry.finalize();
    TestValidator.equals(`${order} once`, seen.length, 1);
    const sample: IAutoMovieSurfaceRegistry.ISweep = seen[0]!;
    TestValidator.equals(
      `${order} minimum`,
      [...sample.cell],
      [0.125, 0.25, 0.25, 0.0625],
    );
    rig.seal();
    const emitted: Float64Array = new Float64Array(3);
    const node: Float64Array = new Float64Array(3);
    registry.writers[0]!(emitted);
    sample.write(node, 0);
    TestValidator.equals(`${order} same point`, [...node], [...emitted]);
    TestValidator.predicate(
      `${order} late binding`,
      throwsError((): void =>
        registry.bindSweep("late", (): void => undefined),
      ),
    );
    TestValidator.predicate(
      `${order} late reservation`,
      throwsError((): unknown => registry.reserve("late")),
    );
    TestValidator.predicate(
      `${order} second finalization`,
      throwsError((): void => registry.finalize()),
    );
  }

  // 2.
  for (const reached of [false, true]) {
    const { registry } = start();
    admit(registry, "one", [
      Infinity,
      reached ? 0.25 : Infinity,
      Infinity,
      Infinity,
    ]);
    const cells: number[][] = [];
    const observed: (IAutoMovieSurfaceRegistry.ISweep | null)[] = [];
    registry.bindSweep(
      "one",
      (sample: IAutoMovieSurfaceRegistry.ISweep | null): void =>
        void cells.push([...sample!.cell]),
    );
    registry.bindSweep(
      "observation",
      (sample: IAutoMovieSurfaceRegistry.ISweep | null): void =>
        void observed.push(sample),
    );
    registry.finalize();
    TestValidator.equals(`${reached} mirror and zero`, cells, [
      [reached ? 0.25 : 0, reached ? 0.25 : 0, 0, 0],
    ]);
    TestValidator.equals(`${reached} observation`, observed, [null]);
    TestValidator.equals(`${reached} count`, registry.count(), 1);
  }

  // 3.
  const empty: IAutoMovieSurfaceRegistry = registerAutoMovieSurfaceVertices(
    (): never => {
      throw new Error("no sweep should be requested");
    },
  );
  let calls: number = 0;
  empty.bindSweep("absent", (): never => {
    ++calls;
    throw new Error("requested binding failure");
  });
  TestValidator.predicate(
    "failure escapes",
    throwsError((): void => empty.finalize()),
  );
  TestValidator.predicate(
    "no retry",
    throwsError((): void => empty.finalize()),
  );
  TestValidator.equals("ran once", calls, 1);
}
