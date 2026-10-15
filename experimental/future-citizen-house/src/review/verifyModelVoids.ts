import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { materialFinish } from "../materials/materialFinish";
import { type ModelPrototype, ModelRepresentation } from "../common/model-geometry/representation";

/**
 * Pin box, cut and hollow assembly using signed triangle volume and the empty-hollow refusal.
 *
 * Scenarios:
 * 1. A two-metre cube has volume 8 cubic metres with no cut records or an empty cut list.
 * 2. A one-square-metre through-hole removes 2 cubic metres from box, hollow and explicit-piece recipes, leaving 6 cubic metres.
 * 3. A hollow recipe without cuts or pieces refuses with its authored-cavity diagnostic.
 *
 * Expectations come from analytic cube and prism volumes, not output snapshots. The signed-volume oracle detects missing cuts or reversed volume but does not establish all UVs or manifold properties. verifyTextileContact owns the textile recipe. pure-tests.ts discovers this portable function through model-void.test.ts without a browser, GPU or native artifact.
 */
export function verifyModelVoids(): void {
  const box: { x: [number, number]; y: [number, number]; z: [number, number]; } = {
    x: [-1, 1] as [number, number],
    y: [-1, 1] as [number, number],
    z: [-1, 1] as [number, number],
  };
  const hole: { x: [number, number]; y: [number, number]; z: [number, number]; } = {
    x: [-0.5, 0.5] as [number, number],
    y: [-1, 1] as [number, number],
    z: [-0.5, 0.5] as [number, number],
  };
  const build: (shape: "box" | "hollow", cuts?: ({ x: [number, number]; y: [number, number]; z: [number, number]; })[], pieces?: ({ x: [number, number]; y: [number, number]; z: [number, number]; })[]) => IAutoMovieMesh = (
    shape: "box" | "hollow",
    cuts?: (typeof box)[],
    pieces?: (typeof box)[],
  ): IAutoMovieMesh => {
    const prototype: ModelPrototype = {
      anchor: "unit-panel",
      name: "Panel",
      states: [
        {
          state: "default",
          envelope: box,
          parts: [{ id: "panel", shape, ...box }],
          ...(cuts ? { voids: { panel: cuts } } : {}),
          ...(pieces ? { pieces: { panel: pieces } } : {}),
        },
      ],
    };
    const part: IAutoMovieModelPart = ModelRepresentation.build(prototype, "default", () : IAutoMovieMaterial =>
      materialFinish("neutral", "#808080", 0.5),
    ).parts[0];
    if (part.geometry.type !== "mesh") throw new Error("Expected mesh");
    return part.geometry.mesh;
  };
  const volume: (mesh: IAutoMovieMesh) => number = (mesh: IAutoMovieMesh): number => {
    let total: number = 0;
    const p: number[] = mesh.positions;
    for (let i: number = 0; i < mesh.indices!.length; i += 3) {
      const a: number = mesh.indices![i] * 3,
        b: number = mesh.indices![i + 1] * 3,
        c: number = mesh.indices![i + 2] * 3;
      total +=
        (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) +
          p[a + 1] * (p[b + 2] * p[c] - p[b] * p[c + 2]) +
          p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) /
        6;
    }
    return total;
  };
  assert.ok(Math.abs(volume(build("box")) - 8) < 1e-10);
  assert.ok(Math.abs(volume(build("box", [])) - 8) < 1e-10);
  assert.ok(Math.abs(volume(build("box", [hole])) - 6) < 1e-10);
  assert.ok(Math.abs(volume(build("hollow", [hole])) - 6) < 1e-10);
  assert.ok(Math.abs(volume(build("box", [hole], [box])) - 6) < 1e-10);
  assert.throws(() : IAutoMovieMesh => build("hollow", []), /without authored cavity/);
}
