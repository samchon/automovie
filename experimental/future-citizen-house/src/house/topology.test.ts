/** The single house unit owns its site, building, storeys and rooms through
 * the logical tree's actual root. This pure case protects that binding without
 * building any facade or relaxing the native ownership validator. */
import assert from "node:assert/strict";
import { validateBuiltEnvironment } from "@automovie/engine";
import { Assembly, initialState } from "./assembly";
import { topology } from "./topology";

export function verifyBuildingRootOwnership(): void {
  const assembly = new Assembly(initialState);
  topology(assembly);
  const environment = assembly.environment;
  assert.equal(environment.buildings.length, 1);
  assert.equal(environment.buildings[0].space, "citizen-site");
  assert.equal(environment.spaces.find((space) => space.id === "house")?.parent, "citizen-site");
  assert.ok(validateBuiltEnvironment({ environment }).success);

  const childAsRoot = structuredClone(environment);
  childAsRoot.buildings[0].space = "house";
  const invalid = validateBuiltEnvironment({ environment: childAsRoot });
  assert.equal(invalid.success, false);
  assert.ok(invalid.violations.some((violation) =>
    violation.expected === 'building root space "house" must have no parent'));
}
