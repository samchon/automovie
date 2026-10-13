import type { IAutoMovieChannel, IAutoMovieCopyDriver, IAutoMovieDrivenDriver } from "@automovie/interface";
import { IAutoMovieLegacyDrivenDriver, IAutoMovieLegacyPropSpec, toEnginePropSpec } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { boxModel } from "../internal/renderFixtures";

/**
 * Legacy prop conversion preserves model and joint ownership while lowering
 * named input/output ranges to engine pairs. Curve-driven records retain the
 * absence of dead ranges rather than inventing linear endpoints.
 *
 * Scenarios:
 *
 * 1. A rigid prop keeps its model reference and null articulation.
 * 2. An articulated prop retains its nodes, binding and ordinary copy driver.
 * 3. Driven records with both, either or neither named range preserve their
 *    values and omission when lowered, without mutating the stored record.
 */
export const test_production_legacy_prop_conversion = (): void => {
  const model = boxModel({ id: "door" });
  const rigid: IAutoMovieLegacyPropSpec = { node: "door", model, articulation: null };
  const loweredRigid = toEnginePropSpec(rigid);
  TestValidator.equals("rigid articulation", loweredRigid.articulation, null);
  TestValidator.predicate("rigid model ownership", loweredRigid.model === model);
  const copy: IAutoMovieCopyDriver = {
    type: "copy", owner: "panel", source: "hinge",
    translation: false, rotation: true, scale: false, influence: 1,
  };
  const source: IAutoMovieChannel = { kind: "node", node: "hinge", path: "rotation" };
  const output: IAutoMovieChannel = { kind: "node", node: "panel", path: "rotation" };
  for (const ranges of [
    { inRange: { from: 1, to: 2 }, outRange: { from: 3, to: 4 } },
    { inRange: { from: 1, to: 2 } },
    { outRange: { from: 3, to: 4 } },
    {},
  ]) {
    const driven: IAutoMovieLegacyDrivenDriver = { type: "driven", source, output, ...ranges };
    const spec: IAutoMovieLegacyPropSpec = {
      node: "door", model,
      articulation: {
        nodes: [],
        binding: { profile: "hinge", root: "door", instanceName: null, boneMap: {} },
        profile: { id: "hinge", name: "hinge", controls: [], limits: [], drivers: [copy, driven] },
      },
    };
    const before = structuredClone(spec);
    const converted = toEnginePropSpec(spec).articulation!;
    TestValidator.predicate("node ownership", converted.nodes === spec.articulation!.nodes);
    TestValidator.predicate("binding ownership", converted.binding === spec.articulation!.binding);
    TestValidator.predicate("copy driver ownership", converted.profile.drivers[0] === copy);
    const mapped = converted.profile.drivers[1];
    const expected: IAutoMovieDrivenDriver = {
      type: "driven", source, output,
      ...("inRange" in ranges ? { inRange: [1, 2] as [number, number] } : {}),
      ...("outRange" in ranges ? { outRange: [3, 4] as [number, number] } : {}),
    };
    TestValidator.equals("lowered range data", mapped, expected);
    TestValidator.equals("stored record remains owned", spec, before);
  }
};
