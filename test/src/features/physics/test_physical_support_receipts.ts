import {
  type AutoMoviePhysicalSimulation as Simulation,
  bindPhysicalWorld,
  collectPhysicalSupports as collect,
  collectPhysicalContacts,
  recordPhysicalContact,
  solvePhysicalCompliantContacts,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { nclose } from "../internal/nclose";

/** Actual rigid constraints own support, while causal positive compliant solver samples survive a future enclosing-frame tail.
 *
 * Scenarios:
 * 1. A real rigid floor impulse cannot re-establish support after actual departure.
 * 2. Actual compliant sensor impulses establish support without a native core manifold.
 * 3. A future cache-frame sample cannot hide the latest valid past compliant sample.
 * 4. Geometric provenance cannot turn the same measured numbers into solver support.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation`, `bindPhysicalWorld`, `collectPhysicalContacts` on in-memory inputs and asserts the returned observations through 4x TestValidator.predicate, 5x TestValidator.equals; 4 numbered scenarios (first: A real rigid floor impulse cannot re-establish support after actual departure.; last: Geometric provenance cannot turn the same measured numbers into solver support.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (9 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: A real rigid floor impulse cannot re-establish support after actual departure.; last: Geometric provenance cannot turn the same measured numbers into solver support.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_receipts`, which owns the cases delegated to `PhysicalFixtures`, `nclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A real rigid floor impulse cannot re-establish support after actual departure.).
 */
export async function test_physical_support_receipts(): Promise<void> {
  await RAPIER.init();
  for (const variant of ["rigid", "soft", "rounded-zero"] as const) {
    const compliant: boolean = variant !== "rigid";
    const profile: P = PhysicalFixtures.sphere(0.1, compliant ? 0.1 : 0);
    const body: Simulation.IBody = PhysicalFixtures.body(
      "sphere",
      profile,
      1 / 120,
    );
    if (variant === "rounded-zero")
      body.mode = {
        kind: "exaggerated",
        gravity: 1,
        impulse: 1e-300,
        compliance: 1,
        reason:
          "A positive Float64 soft impulse rounds to zero at its actual native transfer",
      };
    for (const target of body.targets)
      target.segments.root!.position.y = compliant ? 0.08 : 0.099;
    const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
    Object.assign(input, {
      gravity: { x: 0, y: -9.81, z: 0 },
      floor: 0,
      substeps: 8,
      contactTolerance: 0.0001,
    });
    const pattern: Pattern = {
      id: "sphere-patch",
      minimumSupports: 0,
      limbs: [
        {
          bone: "root",
          chain: ["root"],
          phase: 0,
          duty: 1,
          offset: { forward: 0, left: 0 },
          stride: [],
        },
      ],
    };
    const world: World = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    try {
      world.timestep = 1 / 960;
      world.integrationParameters.normalizedPredictionDistance = 0;
      const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
        world,
        input,
        false,
      );
      const contacts: Receipt[] = [];
      const active: Map<string, Receipt> = new Map();

      /** The real native and compliant solvers produce every recorded impulse; only their enclosing cache-frame stamp is selected here. */
      const advance: (seconds: number) => void = (seconds: number): void => {
        world.step();
        const found: Set<string> = new Set();
        collectPhysicalContacts(
          world,
          input,
          bound,
          seconds,
          contacts,
          active,
          found,
        );
        for (const measured of solvePhysicalCompliantContacts(
          world,
          bound.surfaces,
          seconds,
          world.timestep,
        ))
          recordPhysicalContact({
            ...measured,
            a: bound.colliders.get(measured.handle)!,
            b: bound.colliders.get(measured.other)!,
            dt: 1 / 120,
            contacts,
            active,
            found,
          });
      };
      for (let tick: number = 1; tick <= 8; tick++) advance(1 / 120);
      TestValidator.predicate(
        "support receipts contain actual positive solved impulses",
        contacts.some(
          (receipt: Receipt): boolean =>
            receipt.source === "solver" &&
            receipt.samples!.some(
              (sample: NonNullable<Receipt["samples"]>[number]): boolean =>
                sample.impulse > 0,
            ),
        ),
      );
      const source: RigidBody = bound.segments.get(body.id)!.get("root")!;
      const state: Omit<Parameters<typeof collect>[0], "contacts" | "seconds"> =
        {
          world,
          body: body.id,
          profile,
          pattern,
          segments: bound.segments.get(body.id)!,
          colliders: bound.colliders,
          dt: 1 / 960,
        };
      if (!compliant) {
        source.setTranslation({ x: 0, y: 0.5, z: 0 }, true);
        source.setLinvel({ x: 0, y: 0, z: 0 }, true);
        world.step();
        TestValidator.equals(
          "departed rigid contact cannot be restored by an old receipt",
          collect({ ...state, contacts, seconds: 9 / 960 }).length,
          0,
        );
      } else {
        TestValidator.equals(
          "soft support has no touching native core constraint",
          collect({ ...state, contacts: [], seconds: 1 / 120 }).length,
          0,
        );
        TestValidator.equals(
          "actual compliant impulse establishes support",
          collect({ ...state, contacts, seconds: 1 / 120 }).length,
          variant === "rounded-zero" ? 0 : 1,
        );
        TestValidator.predicate(
          "soft support authority follows the actual transferred native response",
          contacts.some((receipt: Receipt): boolean =>
            receipt.samples!.some(
              (sample: NonNullable<Receipt["samples"]>[number]): boolean => {
                const applied: number =
                  sample.appliedImpulse?.[
                    receipt.a.body === body.id ? "a" : "b"
                  ] ?? 0;
                return (
                  sample.impulse > 0 &&
                  (variant === "rounded-zero" ? applied === 0 : applied > 0)
                );
              },
            ),
          ),
        );
        const ballisticVelocity: number = (-9.81 * 8) / 960;
        TestValidator.predicate(
          "reported soft authority agrees with the independently measured native velocity response",
          variant === "rounded-zero"
            ? nclose(source.linvel().y, ballisticVelocity, 1e-6)
            : source.linvel().y > ballisticVelocity + 1e-4,
        );
        advance(2 / 120);
        TestValidator.predicate(
          "actual solver receipt has a future enclosing-frame tail",
          contacts.some(
            (receipt: Receipt): boolean =>
              receipt.samples!.at(-1)!.seconds > 9 / 960 &&
              receipt.samples!.some(
                (sample: NonNullable<Receipt["samples"]>[number]): boolean =>
                  sample.seconds <= 9 / 960,
              ),
          ),
        );
        TestValidator.equals(
          "future tail does not hide causal compliant support",
          collect({ ...state, contacts, seconds: 9 / 960 }).length,
          variant === "rounded-zero" ? 0 : 1,
        );
        const geometric: Receipt[] = structuredClone(contacts);
        for (const receipt of geometric) {
          receipt.source = "geometric";
          receipt.impulse = null;
        }
        TestValidator.equals(
          "geometric provenance cannot establish solver support",
          collect({ ...state, contacts: geometric, seconds: 9 / 960 }).length,
          0,
        );
      }
    } finally {
      world.free();
    }
  }
}
