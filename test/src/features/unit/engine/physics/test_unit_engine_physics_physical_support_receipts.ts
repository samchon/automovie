import {
  type AutoMovieXpbdBody,
  AutoMovieXpbdWorld,
  bindPhysicalWorld,
  collectPhysicalSupports as collect,
  collectPhysicalContacts,
  recordPhysicalContact,
  solvePhysicalCompliantContacts,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";
import { nclose } from "../../../internal/nclose";

/** Actual rigid constraints own support, while causal positive compliant solver samples survive a future enclosing-frame tail.
 *
 * Scenarios:
 * 1. A real rigid floor impulse cannot re-establish support after actual departure.
 * 2. Actual compliant sensor impulses establish support without a rigid core manifold.
 * 3. A compliant impulse whose response gain rounds its Float64 transfer to zero establishes no support, and the body moves ballistically.
 * 4. A future cache-frame sample cannot hide the latest valid past compliant sample.
 * 5. Geometric provenance cannot turn the same measured numbers into solver support.
 */
export async function test_unit_engine_physics_physical_support_receipts(): Promise<void> {
  for (const variant of ["rigid", "soft", "rounded-zero"] as const) {
    const compliant: boolean = variant !== "rigid";
    const profile: P = PhysicalFixtures.sphere(0.1, compliant ? 0.1 : 0);
    const body: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
      "sphere",
      profile,
      1 / 120,
    );
    if (variant === "rounded-zero")
      body.mode = {
        kind: "exaggerated",
        gravity: 1,
        impulse: Number.MIN_VALUE,
        compliance: 1,
        reason:
          "A positive Float64 soft impulse rounds to zero at its actual transfer",
      };
    for (const target of body.targets)
      target.segments.root!.position.y = compliant ? 0.08 : 0.099;
    const input: IAutoMoviePhysicalSimulationInput.IInput =
      PhysicalFixtures.input([body], 1 / 120);
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
    const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld({
      x: 0,
      y: -9.81,
      z: 0,
    });
    world.timestep = 1 / 960;
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      input,
      false,
    );
    const contacts: Receipt[] = [];
    const active: Map<string, Receipt> = new Map();

    /** The real rigid and compliant solvers produce every recorded impulse; only their enclosing cache-frame stamp is selected here. */
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

    /** The sphere's support read from the given receipts at the given seconds. */
    const observe: (
      receipts: readonly Receipt[],
      seconds: number,
    ) => ReturnType<typeof collect> = (
      receipts: readonly Receipt[],
      seconds: number,
    ): ReturnType<typeof collect> =>
      collect({
        world,
        body: body.id,
        profile,
        pattern,
        segments: bound.segments.get(body.id)!,
        colliders: bound.colliders,
        contacts: receipts,
        seconds,
        dt: 1 / 960,
      });
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
    const source: AutoMovieXpbdBody = bound.segments.get(body.id)!.get("root")!;
    if (!compliant) {
      source.setTranslation({ x: 0, y: 0.5, z: 0 });
      source.setLinvel({ x: 0, y: 0, z: 0 });
      world.step();
      TestValidator.equals(
        "departed rigid contact cannot be restored by an old receipt",
        observe(contacts, 9 / 960).length,
        0,
      );
      continue;
    }
    TestValidator.equals(
      "soft support has no touching rigid core constraint",
      observe([], 1 / 120).length,
      0,
    );
    TestValidator.equals(
      "actual compliant impulse establishes support",
      observe(contacts, 1 / 120).length,
      variant === "rounded-zero" ? 0 : 1,
    );
    TestValidator.predicate(
      "soft support authority follows the actual transferred response",
      contacts.some((receipt: Receipt): boolean =>
        receipt.samples!.some(
          (sample: NonNullable<Receipt["samples"]>[number]): boolean => {
            const applied: number =
              sample.appliedImpulse?.[receipt.a.body === body.id ? "a" : "b"] ??
              0;
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
      "reported soft authority agrees with the independently measured velocity response",
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
      observe(contacts, 9 / 960).length,
      variant === "rounded-zero" ? 0 : 1,
    );
    const geometric: Receipt[] = structuredClone(contacts);
    for (const receipt of geometric) {
      receipt.source = "geometric";
      receipt.impulse = null;
    }
    TestValidator.equals(
      "geometric provenance cannot establish solver support",
      observe(geometric, 9 / 960).length,
      0,
    );
  }
}
