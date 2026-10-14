import { compareCodeUnits } from "@automovie/engine";
import type { IAutoMovieChannel, IAutoMovieCopyDriver, IAutoMovieDrivenDriver, IAutoMovieDriver, IAutoMovieModel, IAutoMoviePropSpec } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieLegacyDrivenDriver } from "../../../../packages/production/src/project/legacyRecords/IAutoMovieLegacyDrivenDriver";
import type { IAutoMovieLegacyPropSpec } from "../../../../packages/production/src/project/legacyRecords/IAutoMovieLegacyPropSpec";
import { toEnginePropSpec } from "../../../../packages/production/src/project/legacyRecords/toEnginePropSpec";

import { boxModel } from "../internal/renderFixtures";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";

/**
 * Legacy prop conversion preserves model and joint ownership while lowering
 * named input/output ranges to engine pairs. Curve-driven records retain the
 * absence of dead ranges rather than inventing linear endpoints.
 *
 * Scenarios:
 *
 * 1. A rigid prop keeps its model reference and null articulation.
 * 2. An articulated prop retains nodes, active binding data and a copy driver.
 * 3. Driven records with both, either or neither named range preserve their
 *    values and omission when lowered, without mutating the stored record.
 * 4. Historical controls and binding labels do not enter the active profile.
 *
 * @evidence contracts/testing.md#behavioral-verification Converts rigid and articulated stored props and asserts reference ownership, ordered driver ranges, omission and unchanged input; catches tuple reversal, invented intervals and leakage of unread metadata.
 * @evidence contracts/testing.md#independent-expectations Endpoint pairs follow the engine driver contract, and active bindings contain only profile and boneMap. Expected values are literal authored endpoints, not converter output.
 * @evidence contracts/testing.md#distinguishing-cases Covers null articulation, copy drivers, both/either/neither range, empty nodes and limits, shared active data and ignored historical controls and labels. Engine tests own driver evaluation.
 * @evidence contracts/testing.md#execution-ownership The exported unit function converts caller-owned records through a direct source import, without a host process, native artifact or dynamic case registration.
 */
export function test_production_legacy_prop_conversion(): void {
  const model: IAutoMovieModel = boxModel({ id: "door" });
  const rigid: IAutoMovieLegacyPropSpec = { node: "door", model, articulation: null };
  const loweredRigid: IAutoMoviePropSpec = toEnginePropSpec(rigid);
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
        profile: { id: "hinge", name: "hinge", controls: [{ name: "historical", channel: source, default: [12], group: null }], limits: [], drivers: [copy, driven] },
      },
    };
    const before: IAutoMovieLegacyPropSpec = structuredClone(spec);
    const converted: NonNullable<IAutoMoviePropSpec["articulation"]> = toEnginePropSpec(spec).articulation!;
    TestValidator.predicate("node ownership", converted.nodes === spec.articulation!.nodes);
    TestValidator.predicate("mapping ownership", converted.binding.boneMap === spec.articulation!.binding.boneMap);
    TestValidator.equals("active binding fields", Object.keys(converted.binding).sort(compareCodeUnits), ["boneMap", "profile"]);
    TestValidator.predicate("historical controls omitted", Object.hasOwn(converted.profile, "controls") === false);
    TestValidator.predicate("copy driver ownership", converted.profile.drivers[0] === copy);
    const mapped: IAutoMovieDriver | undefined = converted.profile.drivers[1];
    const expected: IAutoMovieDrivenDriver = {
      type: "driven", source, output,
      ...("inRange" in ranges ? { inRange: [1, 2] as [number, number] } : {}),
      ...("outRange" in ranges ? { outRange: [3, 4] as [number, number] } : {}),
    };
    TestValidator.predicate("lowered range data", (): boolean => filmEffectValuesClose(mapped, expected));
    TestValidator.predicate("stored record remains owned", (): boolean => filmEffectValuesClose(spec, before));
  }
}
