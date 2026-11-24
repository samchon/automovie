import {
  AutoMoviePhysicalCoupledTargetError as CoupledError,
  AutoMoviePhysicalSimulation as Simulation,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalCoupledTargetFit as Fit,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePoses,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalCoupledTargetFixture as Fixture } from "../internal/PhysicalCoupledTargetFixture";

type Scene = IAutoMoviePhysicalSimulationInput.IInput;

const GROUP: string = "fixture-grip";

/** Requested binding tolerance of the fixture, metres. */
const TOLERANCE: number = 0.0001;

/** The simulation's default native contact and joint error allowance, metres. */
const CONTACT_TOLERANCE: number = 0.0001;

/**
 * Two mutually bound hinges fit their targets together through the public
 * Engine simulation.
 *
 * Scenarios:
 * 1. A feasible kinematic group converges at every grouped step. Independent
 *    world geometry shows touching tips, rigid anchors and in-range hinges.
 * 2. A fresh bake, the reversed body order and reordered cached reads return
 *    the same poses and reports.
 * 3. An unreachable gap rejects the bake with a typed unconverged failure.
 * 4. A blank label, a frame-zero label, a singleton group, a member with a
 *    contact-triggered release and a native-root member with support
 *    tracking refuse during admission, before any solver work.
 * 5. Mutual bindings without a group publish no coupled report. Their
 *    individual fits stay pinned by `test_physical_contact_binding`,
 *    `test_physical_target_projection` and `test_physical_target_step`.
 * 6. Native tracking with authored roots reports a converged fit per step, and
 *    a late edit resumes with the reused prefix reports unchanged.
 * 7. Under native tracking, reversing the body order returns the same poses
 *    and reports. Authored roots close toward the grip without penetration.
 *    Native roots held by root force and torque keep a grip through the late
 *    fit. Anchors and hinge ranges hold within the native contact tolerance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` and `identity` on the fixture and asserts reports, independent geometry, typed failures, resumed reports and order-reversed native runs.
 * @evidence contracts/development/testing.md#independent-expectations Gap, anchor, binding error and angle come from `PhysicalCoupledTargetFixture.inspect`, which reads world poses without Engine geometry or projection. Native bounds use the simulation's default 0.1 mm contact allowance and the hinge limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers feasible, infeasible, malformed, singleton, ungrouped, resumed and order-reversed native cases on both early and late fit paths. A unilateral fit misses the touching tips; a fit run on one member's turn with stale peer plans changes the reversed native run.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_physical_coupled_target_fit`; it starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven scenarios and the observation each one pins.
 */
export async function test_physical_coupled_target_fit(): Promise<void> {
  // 1. Feasible kinematic group against independent geometry.
  const feasible: ReturnType<typeof Fixture.createAuthored> =
    Fixture.createAuthored();
  const baked: IAutoMoviePhysicalSimulation = await Simulation.compute(
    feasible.scene,
  );
  const steps: number[] = grouped(feasible.scene);
  TestValidator.equals("grouped steps", steps, [1, 2, 3, 4]);
  for (const step of steps) {
    const report: Fit.IConverged | undefined =
      baked.coupledTargetFits?.[step]?.[GROUP];
    TestValidator.equals(`converged ${step}`, report?.kind, "converged");
    TestValidator.equals(`members ${step}`, report?.members, ["left", "right"]);
    TestValidator.predicate(
      `residual ${step}`,
      report !== undefined && report.residual <= report.tolerance,
    );
    const observed: ReturnType<typeof Fixture.inspect> = Fixture.inspect(
      feasible,
      poses(baked.cache.frames[step]!),
    );
    TestValidator.predicate(
      `touching tips ${step}`,
      Math.abs(observed.signedGap) <= 2 * TOLERANCE,
    );
    for (const body of observed.bodies) {
      const hinge: (typeof feasible)["left"] = feasible[body.id];
      TestValidator.predicate(
        `anchor ${body.id} ${step}`,
        body.anchorError <= 1e-6,
      );
      TestValidator.predicate(
        `binding ${body.id} ${step}`,
        Math.hypot(
          body.bindingError.x,
          body.bindingError.y,
          body.bindingError.z,
        ) <=
          2 * TOLERANCE,
      );
      TestValidator.predicate(
        `range ${body.id} ${step}`,
        body.angle >= hinge.minimum - 1e-9 &&
          body.angle <= hinge.maximum + 1e-9,
      );
    }
  }

  // 2. Determinism across fresh bakes, body order and cached read order.
  const again: IAutoMoviePhysicalSimulation = await Simulation.compute(
    Fixture.createAuthored().scene,
  );
  TestValidator.equals(
    "fresh frames",
    json(again.cache.frames),
    json(baked.cache.frames),
  );
  TestValidator.equals(
    "fresh reports",
    json(again.coupledTargetFits),
    json(baked.coupledTargetFits),
  );
  const reversedScene: Scene = Fixture.createAuthored().scene;
  reversedScene.bodies.reverse();
  const reversed: IAutoMoviePhysicalSimulation =
    await Simulation.compute(reversedScene);
  for (const step of steps)
    TestValidator.equals(
      `reversed poses ${step}`,
      json(sorted(poses(reversed.cache.frames[step]!))),
      json(sorted(poses(baked.cache.frames[step]!))),
    );
  TestValidator.equals(
    "reversed reports",
    json(reversed.coupledTargetFits),
    json(baked.coupledTargetFits),
  );
  const times: number[] = steps.map((step: number): number => step / 120);
  const forward: string[] = times.map((seconds: number): string =>
    json(baked.cache.at(seconds)),
  );
  const backward: string[] = [...times]
    .reverse()
    .map((seconds: number): string => json(baked.cache.at(seconds)))
    .reverse();
  TestValidator.equals("reordered reads", backward, forward);

  // 3. An unreachable gap rejects with a typed numerical failure.
  const infeasible: ReturnType<typeof Fixture.createAuthored> =
    Fixture.createAuthored(0.2);
  TestValidator.predicate("infeasible gap", infeasible.minimumSignedGap > 0);
  const failure: Fit.IFailure | undefined = await rejection(
    Simulation.compute(infeasible.scene),
  );
  TestValidator.equals("infeasible kind", failure?.kind, "unconverged");
  TestValidator.equals(
    "infeasible interval",
    [failure?.step, failure?.group],
    [1, GROUP],
  );

  // 4. Malformed or singleton declarations refuse during admission.

  const seeded: Scene = Fixture.createAuthored().scene;
  seeded.bodies[0]!.targets[0]!.coupledGroup = GROUP;
  const single: Scene = Fixture.createAuthored().scene;
  delete single.bodies[1]!.targets[2]!.coupledGroup;
  const released: Scene = nativeScene();
  released.bodies[0]!.releaseOnContact = {
    earliest: 0,
    latest: released.duration,
    shapes: ["surface"],
    otherBody: "right",
    otherShapes: ["surface"],
  };
  const supported: Scene = nativeScene();
  for (const target of supported.bodies[0]!.targets)
    delete target.dynamicSegments;
  supported.bodies[0]!.supportTracking = {
    pattern: {
      id: "tip-support",
      limbs: [
        {
          bone: "tip",
          chain: ["root", "tip"],
          phase: 0,
          duty: 1,
          offset: { forward: 0, left: 0 },
          stride: [{ speed: 0, length: 0.1 }],
        },
      ],
      minimumSupports: 1,
    },
    stiffness: 100,
    damping: 10,
    maximumForce: 10,
  };
  const malformed: [string, Scene, Fit.IRefused["reason"]][] = [
    ["frame zero", seeded, "declaration"],
    ["singleton", single, "membership"],
    ["contact release", released, "membership"],
    ["native-root support tracking", supported, "membership"],
  ];
  for (const [title, scene, reason] of malformed) {
    const refused: Fit.IFailure | undefined = await rejection(
      Promise.resolve().then((): string => Simulation.identity(scene)),
    );
    TestValidator.equals(
      `${title} refusal`,
      [refused?.kind, refused?.reason],
      ["refused", reason],
    );
  }

  // 5. Mutual bindings without a group keep individual tracking.
  const ordinary: IAutoMoviePhysicalSimulation = await Simulation.compute(
    Fixture.create().scene,
  );
  TestValidator.equals(
    "ungrouped report",
    ordinary.coupledTargetFits,
    undefined,
  );
  TestValidator.equals("ungrouped frames", ordinary.cache.frames.length, 5);

  // 6. Native tracking reports every step and resumes after a late edit.
  const native: Scene = nativeScene();
  const tracked: IAutoMoviePhysicalSimulation =
    await Simulation.compute(native);
  for (const step of steps)
    TestValidator.equals(
      `native converged ${step}`,
      tracked.coupledTargetFits?.[step]?.[GROUP]?.kind,
      "converged",
    );
  const edited: Scene = nativeScene();
  for (const body of edited.bodies) body.targets[4]!.strength = 0.9;
  const resumed: IAutoMoviePhysicalSimulation = await Simulation.compute(
    edited,
    tracked,
  );
  TestValidator.predicate("native resumed", resumed.recomputedSteps < 4);
  for (const step of steps.slice(0, 4 - resumed.recomputedSteps))
    TestValidator.equals(
      `native prefix report ${step}`,
      json(resumed.coupledTargetFits?.[step]),
      json(tracked.coupledTargetFits?.[step]),
    );
  TestValidator.equals(
    "native resumed final",
    resumed.coupledTargetFits?.[4]?.[GROUP]?.kind,
    "converged",
  );

  // 7. Native order reversal, against independent geometry. The authored-root
  //    scene closes toward the grip; the native-root scene holds a grip
  //    through the late fit that runs after root and support control.
  const nativeCases: [string, () => Scene][] = [
    ["authored-root native", nativeScene],
    ["native-root held grip", nativeRootScene],
  ];
  for (const [title, make] of nativeCases) {
    const forwardRun: IAutoMoviePhysicalSimulation =
      await Simulation.compute(make());
    const backwardScene: Scene = make();
    backwardScene.bodies.reverse();
    const backwardRun: IAutoMoviePhysicalSimulation =
      await Simulation.compute(backwardScene);
    TestValidator.equals(
      `${title} reversed reports`,
      json(backwardRun.coupledTargetFits),
      json(forwardRun.coupledTargetFits),
    );
    let previousGap: number = Number.POSITIVE_INFINITY;
    for (const step of steps) {
      TestValidator.equals(
        `${title} converged ${step}`,
        forwardRun.coupledTargetFits?.[step]?.[GROUP]?.kind,
        "converged",
      );
      TestValidator.equals(
        `${title} reversed poses ${step}`,
        json(sorted(poses(backwardRun.cache.frames[step]!))),
        json(sorted(poses(forwardRun.cache.frames[step]!))),
      );
      const observed: ReturnType<typeof Fixture.inspect> = Fixture.inspect(
        feasible,
        poses(forwardRun.cache.frames[step]!),
      );
      TestValidator.predicate(
        `${title} no penetration ${step}`,
        observed.signedGap >= -CONTACT_TOLERANCE,
      );
      TestValidator.predicate(
        `${title} closing ${step}`,
        observed.signedGap <= previousGap + CONTACT_TOLERANCE,
      );
      previousGap = observed.signedGap;
      for (const body of observed.bodies) {
        const hinge: (typeof feasible)["left"] = feasible[body.id];
        TestValidator.predicate(
          `${title} anchor ${body.id} ${step}`,
          body.anchorError <= CONTACT_TOLERANCE,
        );
        TestValidator.predicate(
          `${title} range ${body.id} ${step}`,
          body.angle >= hinge.minimum - 1e-9 &&
            body.angle <= hinge.maximum + 1e-9,
        );
      }
    }
    if (title === "native-root held grip")
      TestValidator.predicate(
        "native-root grip held",
        Math.abs(previousGap) <= CONTACT_TOLERANCE,
      );
  }
}

/**
 * Both hinges already grip at their authored angles under native roots held
 * by root force and torque, so tracking takes the late fit path.
 */ function nativeRootScene(): Scene {
  const fixture: ReturnType<typeof Fixture.createAuthored> =
    Fixture.createAuthored();
  const scene: Scene = fixture.scene;
  for (const body of scene.bodies) {
    const hinge: (typeof fixture)["left"] =
      body.id === "left" ? fixture.left : fixture.right;
    for (const target of body.targets) {
      const root = target.segments.root!.position;
      target.segments.tip = {
        position: {
          x: root.x + hinge.length * Math.sin(hinge.angle),
          y: root.y - hinge.length * Math.cos(hinge.angle),
          z: root.z,
        },
        rotation: {
          x: 0,
          y: 0,
          z: Math.sin(hinge.angle / 2),
          w: Math.cos(hinge.angle / 2),
        },
      };
    }
    body.mode = { kind: "simulated" };
    body.rootStiffness = 2000;
    body.rootDamping = 100;
    body.maximumRootForce = 1000;
    body.rootTorque = { stiffness: 5000, damping: 100, maximumTorque: 1000 };
  }
  scene.substeps = 16;
  return scene;
}

/** The fixture group under native tracking, with each hinge root authored. */
function nativeScene(): Scene {
  const scene: Scene = Fixture.createAuthored().scene;
  for (const body of scene.bodies) {
    body.mode = { kind: "simulated" };
    for (const target of body.targets) target.dynamicSegments = ["tip"];
  }
  return scene;
}

function grouped(scene: Scene): number[] {
  return scene.bodies[0]!.targets.flatMap(
    (
      target: IAutoMoviePhysicalSimulationInput.ITarget,
      step: number,
    ): number[] => (target.coupledGroup === GROUP ? [step] : []),
  );
}

function poses(
  frame: IAutoMoviePhysicalFrame,
): Record<string, IAutoMoviePoses> {
  return Object.fromEntries(
    Object.entries(frame.bodies).map(
      ([body, bones]: [string, IAutoMoviePhysicalFrame["bodies"][string]]): [
        string,
        IAutoMoviePoses,
      ] => [
        body,
        Object.fromEntries(
          Object.entries(bones).map(
            ([bone, state]: [
              string,
              IAutoMoviePhysicalFrame["bodies"][string][string],
            ]): [string, IAutoMoviePoses[string]] => [
              bone,
              { position: state.position, rotation: state.rotation },
            ],
          ),
        ),
      ],
    ),
  );
}

function sorted(
  value: Record<string, IAutoMoviePoses>,
): [string, IAutoMoviePoses][] {
  return Object.entries(value).sort(
    ([a]: [string, IAutoMoviePoses], [b]: [string, IAutoMoviePoses]): number =>
      a < b ? -1 : a > b ? 1 : 0,
  );
}

async function rejection(
  pending: Promise<unknown>,
): Promise<Fit.IFailure | undefined> {
  try {
    await pending;
    return undefined;
  } catch (error: unknown) {
    if (error instanceof CoupledError) return error.fit;
    throw error;
  }
}

function json(value: unknown): string {
  return JSON.stringify(value);
}
