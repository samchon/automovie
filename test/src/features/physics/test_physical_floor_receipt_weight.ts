import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Floor receipts of a resting body equal its weight, including after the native solver drops manifold points.
 *
 * Scenarios:
 * 1. A cube resting on the floor, whose four floor points are all solved, reports its weight.
 * 2. A hexagonal prism resting on the floor, whose six floor points the native solver reduces to four, reports its weight rather than the stale load left on a dropped point.
 * 3. The same prism pressed down off-centre at ten times its weight and released reports its weight again once it rests.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public `AutoMoviePhysicalSimulation` with gravity on a floor and sums every floor receipt's applied normal impulse per cached frame. Counting a native impulse on a manifold point the solver did not use (dimforge/rapier#1077) over-reports the resting prism by 46 percent and the released prism by up to 25 percent, and fails; any receipt split among the solved points passes.
 * @evidence contracts/development/testing.md#independent-expectations A body at rest on the floor is held by a floor force equal to its weight, here 1 kg times 9.81 m/s². Rest is checked independently from the cached vertical speed (below 1 mm/s). The engine records no receipt for a sleeping body, so a frame that ends asleep (speed exactly zero) holds only its awake substeps and is skipped. The 0.5 percent allowance covers float32 native impulses and the soft settling of the solver.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a four-point cube, which never drops a point, with a six-point prism at first rest and after an off-centre push changed which points the solver keeps. Paired attribution belongs to test_physical_native_contact_pair, compliant sweeps to test_physical_compliance and support collection to the support tests.
 * @evidence contracts/development/testing.md#execution-ownership Portable unit test entered through the discoverable function `test_physical_floor_receipt_weight`, running the public engine with native WASM on in-memory one-second scenes; it starts no process, viewer or render host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios, naming the shapes, the push and the weight each one must report.
 */
export async function test_physical_floor_receipt_weight(): Promise<void> {
  const weight: number = 9.81;
  const findings: string[] = [];
  const prism: IAutoMovieVector3[] = Array.from(
    { length: 6 },
    (_: unknown, index: number): IAutoMovieVector3[] => {
      const angle: number = (2 * Math.PI * index) / 6;
      return [-0.04, 0.04].map(
        (y: number): IAutoMovieVector3 => ({
          x: 0.1 * Math.cos(angle),
          y,
          z: 0.1 * Math.sin(angle),
        }),
      );
    },
  ).flat();
  const cases: {
    label: string;
    shape: IAutoMoviePhysicalShape["kind"];
    push: boolean;
    from: number;
  }[] = [
    { label: "resting cube", shape: "box", push: false, from: 10 },
    { label: "resting prism", shape: "hull", push: false, from: 10 },
    { label: "released prism", shape: "hull", push: true, from: 65 },
  ];
  for (const scenario of cases) {
    const run: IAutoMoviePhysicalSimulation = await Simulation.compute(
      scene(scenario.shape, scenario.push),
    );
    const floor: Map<number, number> = new Map();
    for (const receipt of run.cache.contacts) {
      const side: "a" | "b" | undefined =
        receipt.a.body === "floor"
          ? "b"
          : receipt.b.body === "floor"
            ? "a"
            : undefined;
      if (side === undefined) continue;
      for (const sample of receipt.samples ?? [])
        floor.set(
          sample.seconds,
          (floor.get(sample.seconds) ?? 0) +
            (sample.appliedImpulse?.[side] ?? sample.impulse) *
              (side === "a" ? -sample.normal.y : sample.normal.y),
        );
    }
    let checked: number = 0;
    for (let frame: number = scenario.from; frame < 120; frame++) {
      const seconds: number = frame / 120;
      const impulse: number | undefined = floor.get(seconds);
      const speed: number = Math.abs(
        run.cache.at(seconds).bodies.solid!.root!.velocity.y,
      );
      // A frame that ends asleep recorded only its awake substeps.
      if (impulse === undefined || speed === 0 || !(speed < 1e-3)) continue;
      ++checked;
      const force: number = impulse * 120;
      if (!(Math.abs(force - weight) < 0.005 * weight))
        findings.push(`${scenario.label} frame ${frame}: ${force} N`);
    }
    if (checked < 10)
      findings.push(`${scenario.label}: only ${checked} resting frames`);
  }
  TestValidator.equals(
    "resting floor receipts equal the body's weight",
    findings,
    [],
  );

  /** One kilogram on a floor at y = 0, optionally pressed off-centre for a quarter second. */
  function scene(
    kind: IAutoMoviePhysicalShape["kind"],
    push: boolean,
  ): IAutoMoviePhysicalSimulationInput.IInput {
    const base: P = PhysicalFixtures.sphere(0.1);
    const segment: P["segments"][number] = base.segments[0]!;
    const shape: IAutoMoviePhysicalShape =
      kind === "box"
        ? {
            id: "surface",
            material: "solid",
            kind: "box",
            halfExtents: { x: 0.08, y: 0.04, z: 0.08 },
            transform: segment.shapes[0]!.transform,
          }
        : {
            id: "surface",
            material: "solid",
            kind: "hull",
            points: prism,
            transform: segment.shapes[0]!.transform,
          };
    const profile: P = {
      ...base,
      segments: [
        {
          ...segment,
          inertia: { x: 0.003, y: 0.005, z: 0.003 },
          shapes: [shape],
        },
      ],
    };
    const input: IAutoMoviePhysicalSimulationInput.IInput =
      PhysicalFixtures.input(
        [
          PhysicalFixtures.body("solid", profile, 1, {
            position: { x: 0, y: 0.04, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          }),
        ],
        1,
      );
    input.gravity = { x: 0, y: -weight, z: 0 };
    input.floor = 0;
    input.substeps = 4;
    if (push)
      for (let step: number = 30; step < 60; step++)
        input.impulses.push({
          step,
          body: "solid",
          bone: "root",
          point: {
            x: 0.07 * Math.cos(Math.PI / 18),
            y: 0.08,
            z: 0.07 * Math.sin(Math.PI / 18),
          },
          impulse: { x: 0, y: (-10 * weight) / input.rate, z: 0 },
        });
    return input;
  }
}
