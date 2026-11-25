import {
  AutoMoviePhysicalPlayback as Playback,
  AutoMoviePhysicalSimulation as Simulation,
  distributePhysicalSupportWrench,
  markAutoMovieContacts,
  markAutoMovieSupportWrenches,
  physicalInputDigest,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMovieDistributePhysicalSupportWrench,
  IAutoMovieInspectionLegendEntry,
  IAutoMovieMark,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalSupportWrench,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type IAutoMovieInspectionHandle,
  replaceAutoMovieDrawInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";
import { PhysicalFixtures } from "../../internal/PhysicalFixtures";
import { nclose } from "../../internal/nclose";
import { readMarkArrows } from "../../internal/readMarkArrows";
import { singleMaterial } from "../../internal/singleMaterial";

/**
 * Force marks carry the solver's own contact witnesses and the allocator's own
 * support records from a replayed performance into the draw inspection.
 *
 * Scenarios:
 *
 * 1. A rigid ball dropped from 1 m onto the floor is simulated, archived and
 *    decoded. While it falls no contact mark exists; at its first acting solver
 *    step two unflagged arrows start at that step's floor witness: the ball's
 *    points up for the step's mean force and the floor's is its exact opposite.
 *    Under a 0.1 m maximum the impact's arrows keep their directions at 0.1 m
 *    as `contact/clamped`, labelled at least 100 N, while the next, resting
 *    step stays `contact`.
 * 2. Drawn with the performance's ownership history, the same compliant ball
 *    dropped in normal mode flags nothing, though the compliant solver states
 *    zero for the static floor on its shell steps. In an exaggerated mode whose
 *    shell response rounds every solved impulse to zero, the dynamic ball is
 *    flagged on some steps and not on all, since its rigid core finally stops
 *    it, and the static floor is never flagged.
 * 3. The real allocator carries 100 N straight up over four floor witnesses within
 *    its admitted error, so no shortfall is drawn; it cannot carry a 100 N
 *    sideways pull with 50 N up under friction 0.5, so a flagged shortfall
 *    continues from the allocated tip, the two arrows add up to the request,
 *    and the allocation stays inside the friction cone; with no witnesses the
 *    whole request is shortfall.
 * 4. The draw inspection, with the contact and support kinds declared, admits
 *    `marks=contact,support/*` at a falling frame that has none; at the clamped
 *    impact and the support record `contact` selects the two clamped arrows
 *    under their clamp label and it counts one support shortfall under its flag
 *    entry; seeking back to the falling frame clears both, and returning to the
 *    contact frame draws them again.
 */
export async function test_render_draw_replace_draw_inspection_physical_force_marks(): Promise<void> {
  const metresPerNewton: number = 0.001;

  // 1. A real rigid drop, replayed from its archive.
  const rigid: IAutoMoviePhysicalSimulationInput.IInput = drop(0, null);
  const playback: IAutoMoviePhysicalPlayback = await replay(rigid);
  const step: Step = firstActingStep(playback.contacts);
  const contacts = (seconds: number): IAutoMovieMark[] =>
    markAutoMovieContacts({
      receipts: playback.contacts,
      seconds,
      metresPerNewton,
    });
  const touching: IAutoMovieMark[] = contacts(step.seconds);
  const [lifted, pressed] = ["ball/", "floor/"].map(
    (prefix: string): IAutoMovieMark.IArrows =>
      readMarkArrows(
        touching.find((mark: IAutoMovieMark): boolean =>
          mark.path.startsWith(prefix),
        ),
      ),
  );
  const length: number = Math.hypot(...lifted!.vectors);
  TestValidator.equals(
    "no contact while falling, one unflagged arrow per collider at the first acting step",
    [
      contacts(0.3).length,
      touching.length,
      touching.some((mark: IAutoMovieMark): boolean => mark.flagged),
    ],
    [0, 2, false],
  );
  TestValidator.predicate(
    `the floor pushes the ball up from the floor witness, and the ball pushes the floor down: ${lifted!.origins.join(",")} / ${lifted!.vectors.join(",")}`,
    step.seconds > 0.3 &&
      Math.abs(lifted!.origins[1]!) < 0.01 &&
      nclose(length, (step.impulse / step.duration) * metresPerNewton, 1e-12) &&
      lifted!.vectors[1]! > 0.999 * length &&
      [0, 1, 2].every((axis: number): boolean =>
        nclose(pressed!.vectors[axis]!, -lifted!.vectors[axis]!, 1e-15),
      ),
  );

  // The impact arrests about 4.2 m/s of a 1 kg ball within one 1/120 s step: hundreds of newtons against a 9.81 N weight.
  const clamped = (seconds: number): IAutoMovieMark[] =>
    markAutoMovieContacts({
      receipts: playback.contacts,
      seconds,
      metresPerNewton,
      maximumLength: 0.1,
    });
  const impact: IAutoMovieMark[] = clamped(step.seconds);
  TestValidator.equals(
    "the impact is clamped to 0.1 m and labelled, the following resting step is not",
    [
      impact.map((mark: IAutoMovieMark) => [mark.kind, mark.label]),
      clamped(step.seconds + 1.5 * step.duration).map(
        (mark: IAutoMovieMark) => mark.kind,
      ),
    ],
    [
      [
        ["contact/clamped", "contact force clamped at 0.1 m (at least 100 N)"],
        ["contact/clamped", "contact force clamped at 0.1 m (at least 100 N)"],
      ],
      ["contact", "contact"],
    ],
  );
  TestValidator.predicate(
    "the clamped impact still points the ball up at exactly 0.1 m",
    impact.every((mark: IAutoMovieMark): boolean => {
      const vector: readonly number[] = readMarkArrows(mark).vectors;
      return (
        nclose(Math.hypot(...vector), 0.1, 1e-12) &&
        (mark.path.startsWith("ball/") ? vector[1]! > 0 : vector[1]! < 0)
      );
    }) && step.impulse / step.duration > 300,
  );

  // 2. Solved force that no body received.
  const exaggerated: IAutoMoviePhysicalPlayback = await replay(
    drop(0.1, {
      kind: "exaggerated",
      gravity: 1,
      // The smallest positive double scales a soft impulse under one newton second below half of itself, so its transfer rounds to exactly zero.
      impulse: Number.MIN_VALUE,
      compliance: 1,
      reason:
        "A positive soft impulse underflows to zero at its actual transfer",
    }),
  );
  const normal: IAutoMoviePhysicalPlayback = await replay(drop(0.1, null));
  const exaggeratedFlags: Record<"ball" | "floor", boolean[]> =
    flags(exaggerated);
  const normalFlags: Record<"ball" | "floor", boolean[]> = flags(normal);
  // Precondition: the compliant solver does state zero for the static floor, which a flag on the stated zero alone would report.
  const floorStatedZero: boolean = normal.contacts.some(
    (receipt: IAutoMovieContactReceipt): boolean =>
      (receipt.samples ?? []).some(
        (sample: Step): boolean =>
          sample.impulse > 0 &&
          sample.separation <= 0 &&
          sample.appliedImpulse?.[receipt.a.body === "floor" ? "a" : "b"] === 0,
      ),
  );
  TestValidator.equals(
    "normal mode flags nothing: the dynamic ball receives every compliant impulse and the static floor is owed none",
    [
      floorStatedZero,
      normalFlags.ball.length > 0 && normalFlags.floor.length > 0,
      [...normalFlags.ball, ...normalFlags.floor].some(Boolean),
    ],
    [true, true, false],
  );
  TestValidator.equals(
    "exaggerated mode flags the dynamic ball on rounded shell steps, not once its core stops it, and never the static floor",
    [
      exaggeratedFlags.ball.some(Boolean),
      exaggeratedFlags.ball.every(Boolean),
      exaggeratedFlags.floor.some(Boolean),
    ],
    [true, false, false],
  );

  /**
   * Each acting step drawn at its own second with the performance's ownership,
   * its flags gathered per body.
   */
  function flags(
    performance: IAutoMoviePhysicalPlayback,
  ): Record<"ball" | "floor", boolean[]> {
    const result: Record<"ball" | "floor", boolean[]> = { ball: [], floor: [] };
    for (const receipt of performance.contacts)
      for (const sample of receipt.samples ?? [])
        if (sample.impulse > 0 && sample.separation <= 0)
          for (const mark of markAutoMovieContacts({
            receipts: [receipt],
            seconds: sample.seconds,
            metresPerNewton,
            ownership: performance.ownership,
          }))
            result[mark.path.startsWith("ball/") ? "ball" : "floor"].push(
              mark.flagged,
            );
    return result;
  }

  // 3. Real allocations of three requests at one centre of mass.
  const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const feasible: IAutoMoviePhysicalSupportWrench = allocate(
    origin,
    { x: 0, y: 100, z: 0 },
    4,
  );
  const infeasible: IAutoMoviePhysicalSupportWrench = allocate(
    origin,
    { x: 100, y: 50, z: 0 },
    4,
  );
  const unsupported: IAutoMoviePhysicalSupportWrench = allocate(
    origin,
    { x: 0, y: 100, z: 0 },
    0,
  );
  const supports = (
    wrench: IAutoMoviePhysicalSupportWrench,
  ): IAutoMovieMark[] =>
    markAutoMovieSupportWrenches({
      wrenches: [wrench],
      seconds: wrench.seconds,
      interval: 1 / 120,
      metresPerNewton,
    });
  const strained: IAutoMovieMark[] = supports(infeasible);
  const [carried, missing] = strained.map(
    (mark: IAutoMovieMark): IAutoMovieMark.IArrows => readMarkArrows(mark),
  );
  TestValidator.equals(
    "feasible, infeasible and unsupported requests",
    [
      supports(feasible).map((mark: IAutoMovieMark) => [
        mark.kind,
        mark.flagged,
      ]),
      strained.map((mark: IAutoMovieMark) => [mark.kind, mark.flagged]),
      supports(unsupported).map((mark: IAutoMovieMark) => [
        mark.kind,
        mark.flagged,
      ]),
    ],
    [
      [["support/allocated", false]],
      [
        ["support/allocated", false],
        ["support/shortfall", true],
      ],
      [["support/shortfall", true]],
    ],
  );
  TestValidator.predicate(
    "the shortfall continues from the allocated tip, sums to the request, and the allocation stays in the friction cone at least 75 / sqrt(1.25) N from the request",
    [0, 1, 2].every(
      (axis: number): boolean =>
        nclose(
          missing!.origins[axis]!,
          carried!.origins[axis]! + carried!.vectors[axis]!,
          1e-12,
        ) &&
        nclose(
          carried!.vectors[axis]! + missing!.vectors[axis]!,
          [100, 50, 0][axis]! * metresPerNewton,
          1e-9,
        ),
    ) &&
      Math.abs(carried!.vectors[0]!) <= 0.5 * carried!.vectors[1]! + 1e-9 &&
      Math.hypot(...missing!.vectors) >=
        (75 / Math.sqrt(1.25)) * metresPerNewton - 1e-9,
  );

  // 4. The draw inspection over declared kinds, seeking back and forth.
  const scene: THREE.Scene = new THREE.Scene();
  const ball: THREE.Mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.1),
    new THREE.MeshBasicMaterial(),
  );
  ball.name = "ball";
  scene.add(ball);
  let active: IAutoMovieInspectionHandle | null = null;
  try {
    const counts: number[][] = [];
    // A falling frame supplies no marks; the contact frame supplies both producers' marks.
    const falling: IAutoMovieMark[] = [];
    const contact: IAutoMovieMark[] = [...impact, ...strained];
    for (const marks of [falling, contact, falling, contact]) {
      active = await replaceAutoMovieDrawInspection({
        previous: active,
        scene,
        request: InspectionScene.ask({ marks: ["contact", "support/*"] }),
        markKinds: [
          "contact",
          "contact/clamped",
          "support/allocated",
          "support/shortfall",
        ],
        place: async (): Promise<readonly IAutoMovieMark[]> => {
          scene.updateMatrixWorld(true);
          return marks;
        },
      });
      const legend: readonly IAutoMovieInspectionLegendEntry[] = active.legend;
      counts.push(
        [
          "contact force clamped at 0.1 m (at least 100 N)",
          "support force shortfall (flagged)",
        ].map(
          (label: string): number =>
            legend.find(
              (entry: IAutoMovieInspectionLegendEntry): boolean =>
                entry.label === label,
            )?.count ?? 0,
        ),
      );
    }
    TestValidator.equals(
      "declared kinds admitted while falling, drawn at the contact and the record, across a reverse seek",
      counts,
      [
        [0, 0],
        [2, 1],
        [0, 0],
        [2, 1],
      ],
    );
  } finally {
    active?.restore();
    ball.geometry.dispose();
    singleMaterial(ball.material).dispose();
  }
}

/** One completed solver step of a contact receipt. */
type Step = NonNullable<IAutoMovieContactReceipt["samples"]>[number];

/**
 * A 1 s drop of one ball of 0.1 m radius from 1 m onto the floor at y = 0 under
 * gravity, with the given compliance and an optional mode.
 */
function drop(
  compliance: number,
  mode: IAutoMoviePhysicalSimulationInput.IBody["mode"] | null,
): IAutoMoviePhysicalSimulationInput.IInput {
  const body: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
    "ball",
    PhysicalFixtures.sphere(0.1, compliance),
    1,
  );
  if (mode !== null) body.mode = mode;
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], 1);
  input.floor = 0;
  input.gravity.y = -9.81;
  return input;
}

/**
 * Simulate in Node, then read the performance back only through its decoded
 * archive, as a production plays it.
 */
async function replay(
  input: IAutoMoviePhysicalSimulationInput.IInput,
): Promise<IAutoMoviePhysicalPlayback> {
  const run: Awaited<ReturnType<typeof Simulation.compute>> =
    await Simulation.compute(input);
  return Playback.decode(
    await Playback.encode(run.cache, 4_000_000),
    physicalInputDigest(input),
    { maximumBytes: 4_000_000, maximumFrames: 121, maximumSegments: 1 },
  );
}

/** The earliest solver step with a positive impulse and no separation. */
function firstActingStep(receipts: readonly IAutoMovieContactReceipt[]): Step {
  const steps: Step[] = receipts
    .filter(
      (receipt: IAutoMovieContactReceipt): boolean =>
        receipt.source === "solver",
    )
    .flatMap(
      (receipt: IAutoMovieContactReceipt): Step[] => receipt.samples ?? [],
    )
    .filter(
      (sample: Step): boolean => sample.impulse > 0 && sample.separation <= 0,
    )
    .sort((a: Step, b: Step): number => a.seconds - b.seconds);
  if (steps.length === 0)
    throw new Error("The dropped ball recorded no acting solver step");
  return steps[0]!;
}

/**
 * Allocate a pure force at `origin` over `count` (0 or 4) floor witnesses 0.1 m
 * out with friction 0.5 and record it as the controller does.
 */
function allocate(
  origin: IAutoMovieVector3,
  force: IAutoMovieVector3,
  count: 0 | 4,
): IAutoMoviePhysicalSupportWrench {
  const points: IAutoMovieDistributePhysicalSupportWrench.IInput["points"] =
    count === 0
      ? []
      : [
          [-0.1, -0.1],
          [-0.1, 0.1],
          [0.1, -0.1],
          [0.1, 0.1],
        ].map(([x, z]: number[]) => ({
          bone: "root",
          point: { x: x!, y: 0, z: z! },
          friction: 0.5,
        }));
  const torque: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const result: ReturnType<typeof distributePhysicalSupportWrench> =
    distributePhysicalSupportWrench({
      origin,
      force,
      torque,
      maximumForce: 1000,
      points,
    });
  return {
    body: "ball",
    seconds: 0.5,
    origin,
    requested: { force, torque },
    allocated: { force: result.force, torque: result.torque },
    residual: result.residual,
    pointCount: points.length,
  };
}
