import { AutoMovieEnginePhysicalGeometry as Geometry, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePhysicalContactSupportRows,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";
import { nclose } from "../../internal/predicates";

/**
 * A real spherical patch preserves the original XYZ endpoint and its actual
 * plane witnesses.
 *
 * Scenarios:
 *
 * 1. A touching primitive has zero endpoint and plane errors; lowering it retains
 *    the original unmet XYZ goal alongside witness and complete-patch
 *    penetration rows.
 * 2. Raising the patch keeps its planted witness equality even when nonpenetration
 *    is satisfied, while a patch without witnesses retains its complete-surface
 *    plane equality.
 * 3. Invalid endpoint or patch declarations refuse without mutating the borrowed
 *    profile, goals or poses.
 */
export async function test_engine_physics_physical_contact_support_rows(): Promise<void> {
  const profile: P = PhysicalFixtures.sphere(0.1);
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry.prepare();
  const targets: Record<string, IAutoMovieRigidTransform> = {
    root: structuredClone(profile.segments[0]!.neutral),
  };
  const support: IAutoMoviePhysicalContactSupportRows.ISupport = {
    bone: "root",
    localPoint: { x: 0, y: -0.1, z: 0 },
    point: { x: 0, y: 0.9, z: 0 },
    patch: {
      contacts: ["root"],
      floorPoints: [{ bone: "root", localPoint: { x: 0, y: -0.1, z: 0 } }],
      floor: 0.9,
    },
  };
  const before: string = JSON.stringify({ profile, support, targets });
  const rows: IAutoMovieLinearizePhysicalTargetRows.IRows[] =
    AutoMovieEnginePhysics.physicalContactSupportRows({
      profile,
      supports: [support],
      body: "primitive",
      geometry,
      floor: -10,
    });
  const initial: number[] = rows[1]!.measure(targets);
  TestValidator.predicate(
    "touching endpoint and explicit patch have zero residuals",
    initial.length === 5 &&
      initial.every((value: number): boolean => nclose(value, 0, 0)),
  );
  const lowered: Record<string, IAutoMovieRigidTransform> =
    structuredClone(targets);
  lowered.root!.position.y -= 0.1;
  const measured: number[] = rows[1]!.measure(lowered);
  assert.equal(
    measured.length,
    5,
    "XYZ plus the actual witness and complete-patch lower bound",
  );
  for (const index of [1, 3, 4])
    TestValidator.predicate(
      "original endpoint and each plane row retain the missing decimetre " +
        index,
      nclose(measured[index]!, -0.1, PhysicalTolerance.ROUNDING),
    );
  const raised: Record<string, IAutoMovieRigidTransform> =
    structuredClone(targets);
  raised.root!.position.y += 0.1;
  const floating: number[] = rows[1]!.measure(raised);
  TestValidator.predicate(
    "floating original endpoint and planted witness retain their errors",
    nclose(floating[1]!, 0.1, PhysicalTolerance.ROUNDING) &&
      nclose(floating[3]!, 0.1, PhysicalTolerance.ROUNDING),
  );
  TestValidator.predicate(
    "nonpenetration cannot substitute for the planted witness equality",
    nclose(floating[4]!, 0, 0),
  );
  const complete: IAutoMoviePhysicalContactSupportRows.ISupport = {
    ...support,
    patch: { contacts: ["root"], floor: 0.9 },
  };
  const withoutWitness: IAutoMovieLinearizePhysicalTargetRows.IRows[] =
    AutoMovieEnginePhysics.physicalContactSupportRows({
      profile,
      supports: [complete],
      body: "primitive",
      geometry,
      floor: -10,
    });
  assert.equal(withoutWitness[1]!.measure(raised).length, 4);
  TestValidator.predicate(
    "a witness-free patch retains complete-surface plane equality",
    nclose(
      withoutWitness[1]!.measure(raised)[3]!,
      0.1,
      PhysicalTolerance.ROUNDING,
    ),
  );
  assert.equal(JSON.stringify({ profile, support, targets }), before);
  for (const invalid of [
    { ...support, patch: { contacts: ["missing"], floor: 0.9 } },
    {
      ...support,
      patch: {
        contacts: ["root"],
        floorPoints: [{ bone: "missing", localPoint: { x: 0, y: 0, z: 0 } }],
        floor: 0.9,
      },
    },
  ])
    assert.throws(
      (): IAutoMovieLinearizePhysicalTargetRows.IRows[] =>
        AutoMovieEnginePhysics.physicalContactSupportRows({
          profile,
          supports: [invalid],
          body: "primitive",
          geometry,
          floor: -10,
        }),
      /support patch/,
    );
}
