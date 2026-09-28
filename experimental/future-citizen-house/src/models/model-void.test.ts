import type { IAutoMovieMesh } from "@automovie/interface";
import assert from "node:assert/strict";

import { materialFinish } from "../materials/001-binding-and-scale";
import { type ModelPrototype, ModelRepresentation } from "./representation";

/** Box-valued parts retain their authored subtraction. Geometry volume is an
 * independent oracle: a 2m cube minus a 1m² through-hole has volume 6m³.
 * Scenarios: ordinary box, empty cuts, a through-hole, hollow and union hosts. */
export function verifyModelVoids(): void {
  const box = {
    x: [-1, 1] as [number, number],
    y: [-1, 1] as [number, number],
    z: [-1, 1] as [number, number],
  };
  const hole = {
    x: [-0.5, 0.5] as [number, number],
    y: [-1, 1] as [number, number],
    z: [-0.5, 0.5] as [number, number],
  };
  const build = (
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
    const part = ModelRepresentation.build(prototype, "default", () =>
      materialFinish("neutral", "#808080", 0.5),
    ).parts[0];
    if (part.geometry.type !== "mesh") throw Error("Expected mesh");
    return part.geometry.mesh;
  };
  const volume = (mesh: IAutoMovieMesh): number => {
    let total = 0;
    const p = mesh.positions;
    for (let i = 0; i < mesh.indices!.length; i += 3) {
      const a = mesh.indices![i] * 3,
        b = mesh.indices![i + 1] * 3,
        c = mesh.indices![i + 2] * 3;
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
  assert.throws(() => build("hollow", []), /without authored cavity/);
}
