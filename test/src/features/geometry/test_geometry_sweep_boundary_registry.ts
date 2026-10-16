import { type IAutoMovieSweep } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieSurfaceRegistry } from "../../../../packages/engine/src/geometry/sweep/IAutoMovieSurfaceRegistry";
import { type IAutoMovieSweepRig } from "../../../../packages/engine/src/geometry/sweep/IAutoMovieSweepRig";
import { registerAutoMovieSurfaceVertices } from "../../../../packages/engine/src/geometry/sweep/registerAutoMovieSurfaceVertices";
import { rigAutoMovieSweep } from "../../../../packages/engine/src/geometry/sweep/rigAutoMovieSweep";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Sweep dependents bind once to the final geometric cell before sealing.
 *
 * Scenarios:
 *
 * 1. Register complementary asymmetric reaches in both orders; the callback sees their per-side minimum and writes the exact same geometric point as the emitted vertex.
 * 2. A missing side mirrors its partner and an unreached axis has zero extent. An observation-only identity receives null and does not register a new vertex.
 * 3. Registration after finalization and repeated finalization are refused. A failing binding is terminal and is not retried.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the registry with a real compiled sweep and its emitted target writer, checking binding phase, shared positions, resolved reaches and refusal paths.
 * @evidence contracts/testing.md#independent-expectations The declared per-side minimum, mirror and zero rules determine each expected cell; exact identity requires equal node and emitted coordinates independently of the sweep's form. Callback absence before finalization and a single invocation after it follow the compile-phase contract.
 * @evidence contracts/testing.md#distinguishing-cases Covers reversed registration, asymmetric and missing reaches, unregistered observations, an empty registry and callback failure. The probe test owns independent differential expectations; network tests own curves, blends, pins, topology and posing.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous test_geometry_sweep_boundary_registry entry calling engine producers directly, without processes or a renderer.
 */
export function test_geometry_sweep_boundary_registry(): void {
  const sweep: IAutoMovieSweep = {
    spine: {
      points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [{ at: 0, section: { type: "superellipse", right: 1, left: 1, up: 2, down: 2, exponents: [2, 2, 2, 2] } }],
  };
  const reports: Array<[number, number, number, number]> = [
    [Infinity, 0.25, 0.25, Infinity],
    [0.125, Infinity, Infinity, 0.0625],
  ];
  for (const order of [[0, 1], [1, 0]]) {
    const rig: IAutoMovieSweepRig = rigAutoMovieSweep({ sweep, preserveVolume: false });
    const registry: IAutoMovieSurfaceRegistry = registerAutoMovieSurfaceVertices((): IAutoMovieSweepRig => rig);
    let resolved: IAutoMovieSurfaceRegistry.ISweep | null = null;
    let calls: number = 0;
    registry.bindSweep("shared", (sample: IAutoMovieSurfaceRegistry.ISweep | null): void => {
      resolved = sample;
      ++calls;
    });
    for (const side of order)
      registry.admit({
        key: "shared",
        point: { sweep: "tube", u: 0.25, v: 0.071, cell: reports[side]! },
        writer: (): never => { throw new Error("a geometric sample must use its resolved writer"); },
        sweep: null,
        curve: null,
      });
    TestValidator.equals("binding waits for finalization", calls, 0);
    registry.finalize();
    TestValidator.equals("binding runs once", calls, 1);
    const sample: IAutoMovieSurfaceRegistry.ISweep = resolved!;
    const expected: number[] = [0.125, 0.25, 0.25, 0.0625];
    TestValidator.predicate("resolved reaches are independent of side order", sample.cell.every((value: number, i: number): boolean => nclose(value, expected[i]!, 0)));
    rig.seal();
    const emitted: Float64Array = new Float64Array(3);
    const node: Float64Array = new Float64Array(3);
    registry.writers[0]!(emitted);
    sample.write(node, 0);
    TestValidator.predicate("dependent and emitted geometric points agree", node.every((value: number, i: number): boolean => nclose(value, emitted[i]!, 0)));
    TestValidator.predicate("late binding is refused", throwsError((): void => registry.bindSweep("late", (): void => undefined)));
    TestValidator.predicate("late reservation is refused", throwsError((): void => { registry.reserve("late"); }));
    TestValidator.predicate("second finalization is refused", throwsError((): void => registry.finalize()));
  }
  for (const reached of [false, true]) {
    const rig: IAutoMovieSweepRig = rigAutoMovieSweep({ sweep, preserveVolume: false });
    const registry: IAutoMovieSurfaceRegistry = registerAutoMovieSurfaceVertices((): IAutoMovieSweepRig => rig);
    registry.admit({
      key: "one",
      point: { sweep: "tube", u: 0.25, v: 0.071, cell: [Infinity, reached ? 0.25 : Infinity, Infinity, Infinity] },
      writer: (): never => { throw new Error("a geometric sample must use its resolved writer"); },
      sweep: null,
      curve: null,
    });
    registry.bindSweep("one", (sample: IAutoMovieSurfaceRegistry.ISweep | null): void => {
      const expected: number[] = [reached ? 0.25 : 0, reached ? 0.25 : 0, 0, 0];
      TestValidator.predicate("mirror and zero rules", sample!.cell.every((value: number, i: number): boolean => nclose(value, expected[i]!, 0)));
    });
    registry.bindSweep("observation", (sample: IAutoMovieSurfaceRegistry.ISweep | null): void => {
      TestValidator.equals("unregistered observation stays separate", sample, null);
    });
    registry.finalize();
    TestValidator.equals("observation does not register a point", registry.count(), 1);
  }
  const empty: IAutoMovieSurfaceRegistry = registerAutoMovieSurfaceVertices((): never => { throw new Error("no sweep should be requested"); });
  let failedCalls: number = 0;
  empty.bindSweep("absent", (): never => { ++failedCalls; throw new Error("requested binding failure"); });
  TestValidator.predicate("binding failure escapes", throwsError((): void => empty.finalize()));
  TestValidator.predicate("failed finalization cannot be retried", throwsError((): void => empty.finalize()));
  TestValidator.equals("failed callback is not retained for retry", failedCalls, 1);
}
