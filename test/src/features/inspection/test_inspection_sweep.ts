import {
  expandAutoMovieInspectionSweep,
  listAutoMovieInspectionPaths,
  measureAutoMovieInspectionPaths,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * A sweep pattern expands into units, each with the selection drawing it alone and the neighbours whose boxes come within the margin of it.
 *
 * Scenarios:
 *
 * 1. A group `rack` of four one-metre units `a`, `b`, `c` and `d` in a row at x = 0, 1.05, 2.1 and 5, with a 0.1 m margin, expands under `rack/*` into four units in order, each alone by its own path, `a` with neighbour `b`, `b` with `a` and `c`, `c` with `b`, and `d` with none.
 * 2. A unit's children belong to it: `a/pin` lies inside `a` and is neither a unit nor a neighbour of `a`.
 * 3. The boxes come from `measureAutoMovieInspectionPaths` over the scene's drawn objects.
 * 4. A pattern matching nothing, a negative margin and a box that is not ordered are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the scene's drawn objects with the public path measure and expands the sweep, reading units, alone selections and neighbours.
 * @evidence contracts/development/testing.md#independent-expectations Neighbours are decided by hand: units 1.05 m apart leave a 0.05 m gap inside the 0.1 m margin, and `d` stands 2.4 m beyond `c`.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts touching units against an isolated one, a unit against its own child, and valid against refused inputs. Planning the cells and recording them belong to the capture plan.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A group rack of four one-metre units a, b, c and d in a row).
 */
export function test_inspection_sweep(): void {
  const rack: THREE.Group = new THREE.Group();
  rack.name = "rack";
  const a: THREE.Mesh = InspectionScene.quad("a", 0, 1);
  a.add(InspectionScene.quad("pin", 0, 0.2));
  rack.add(
    a,
    InspectionScene.quad("b", 1.05, 1),
    InspectionScene.quad("c", 2.1, 1),
    InspectionScene.quad("d", 5, 1),
  );
  const stage: THREE.Scene = InspectionScene.scene(rack);
  const objects = measureAutoMovieInspectionPaths({
    objects: listAutoMovieInspectionPaths(stage),
    marks: [],
    choose: (): boolean => true,
  });

  // 1-3. The sweep.
  TestValidator.equals(
    "four units with their neighbours",
    expandAutoMovieInspectionSweep({ objects, pattern: "rack/*", margin: 0.1 }),
    [
      { unit: "rack/a", alone: ["rack/a"], neighbours: ["rack/b"] },
      { unit: "rack/b", alone: ["rack/b"], neighbours: ["rack/a", "rack/c"] },
      { unit: "rack/c", alone: ["rack/c"], neighbours: ["rack/b"] },
      { unit: "rack/d", alone: ["rack/d"], neighbours: [] },
    ],
  );
  TestValidator.equals(
    "the measured objects include the child",
    objects.map((object: { path: string }): string => object.path),
    ["rack/a", "rack/a/pin", "rack/b", "rack/c", "rack/d"],
  );

  // 4. Refusals.
  TestValidator.error("a pattern matching nothing", (): void => {
    expandAutoMovieInspectionSweep({
      objects,
      pattern: "shelf/*",
      margin: 0.1,
    });
  });
  TestValidator.error("a negative margin", (): void => {
    expandAutoMovieInspectionSweep({ objects, pattern: "rack/*", margin: -1 });
  });
  TestValidator.error("an unordered box", (): void => {
    expandAutoMovieInspectionSweep({
      objects: [
        { path: "x", min: { x: 1, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      ],
      pattern: "x",
      margin: 0,
    });
  });
}
