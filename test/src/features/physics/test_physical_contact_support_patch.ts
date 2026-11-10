import {
  preparePhysicalGeometry as Geometry,
  type linearizePhysicalTargetRows,
  physicalContactSupportRows,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { nclose } from "../internal/predicates";

/** A real spherical patch preserves the original XYZ endpoint and its actual plane witnesses.
 *
 * Scenarios:
 * 1. A touching primitive has zero endpoint and plane errors; lowering it retains the original unmet XYZ goal alongside witness and complete-patch penetration rows.
 * 2. Raising the patch keeps its planted witness equality even when nonpenetration is satisfied, while a patch without witnesses retains its complete-surface plane equality.
 * 3. Invalid endpoint or patch declarations refuse without mutating the borrowed profile, goals or poses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `linearizePhysicalTargetRows`, `physicalContactSupportRows`, `preparePhysicalGeometry` on in-memory inputs and asserts the returned observations through 5x TestValidator.predicate; 3 numbered scenarios (first: A touching primitive has zero endpoint and plane errors; lowering it retains the original unmet XYZ goal...; last: Invalid endpoint or patch declarations refuse without mutating the borrowed profile, goals or poses.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (5 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A touching primitive has zero endpoint and plane errors; lowering it retains the original unmet XYZ goal...; last: Invalid endpoint or patch declarations refuse without mutating the borrowed profile, goals or poses.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_contact_support_patch`, which owns the cases delegated to `PhysicalFixtures`, `predicates`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A touching primitive has zero endpoint and plane errors; lowering it retains the original unmet XYZ goal alongside witness and...).
 */
export async function test_physical_contact_support_patch(): Promise<void> {
  const profile: P = PhysicalFixtures.sphere(0.1);
  const geometry: Geometry.IQueries = await Geometry();
  const targets: Record<string, P.ITransform> = {
    root: structuredClone(profile.segments[0]!.neutral),
  };
  const support: physicalContactSupportRows.ISupport = {
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
  const rows: linearizePhysicalTargetRows.IRows[] = physicalContactSupportRows({
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
  const lowered: Record<string, P.ITransform> = structuredClone(targets);
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
      nclose(measured[index]!, -0.1, 1e-12),
    );
  const raised: Record<string, P.ITransform> = structuredClone(targets);
  raised.root!.position.y += 0.1;
  const floating: number[] = rows[1]!.measure(raised);
  TestValidator.predicate(
    "floating original endpoint and planted witness retain their errors",
    nclose(floating[1]!, 0.1, 1e-12) && nclose(floating[3]!, 0.1, 1e-12),
  );
  TestValidator.predicate(
    "nonpenetration cannot substitute for the planted witness equality",
    nclose(floating[4]!, 0, 0),
  );
  const complete: physicalContactSupportRows.ISupport = {
    ...support,
    patch: { contacts: ["root"], floor: 0.9 },
  };
  const withoutWitness: linearizePhysicalTargetRows.IRows[] =
    physicalContactSupportRows({
      profile,
      supports: [complete],
      body: "primitive",
      geometry,
      floor: -10,
    });
  assert.equal(withoutWitness[1]!.measure(raised).length, 4);
  TestValidator.predicate(
    "a witness-free patch retains complete-surface plane equality",
    nclose(withoutWitness[1]!.measure(raised)[3]!, 0.1, 1e-12),
  );
  assert.equal(JSON.stringify({ profile, support, targets }), before);
  for (const invalid of [
    { ...support, point: { x: 0, y: NaN, z: 0 } },
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
      (): linearizePhysicalTargetRows.IRows[] =>
        physicalContactSupportRows({
          profile,
          supports: [invalid],
          body: "primitive",
          geometry,
          floor: -10,
        }),
      /support patch/,
    );
}
