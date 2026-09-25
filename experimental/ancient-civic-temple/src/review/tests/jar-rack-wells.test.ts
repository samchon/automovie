import assert from "node:assert/strict";
import test from "node:test";
import { TemplePortableModels } from "../../models/portable";

void test("each jar rack seat is a visible 0.012 m recess in the emitted mesh", () => {
  const rack = TemplePortableModels.build().find(({ id }) => id === "object.jar-rack");
  assert.ok(rack);
  const horizontalHeights = (x: number, z: number): number[] => rack.parts.flatMap((part) => {
    if (part.geometry.type !== "mesh") return [];
    const { positions, indices } = part.geometry.mesh;
    const heights: number[] = [];
    for (let i = 0; i < (indices?.length ?? 0); i += 3) {
      const a = indices![i]! * 3, b = indices![i+1]! * 3, c = indices![i+2]! * 3;
      const ay = positions[a+1]!, by = positions[b+1]!, cy = positions[c+1]!;
      if (Math.abs(ay-by) > 1e-8 || Math.abs(by-cy) > 1e-8) continue;
      const edge = (j: number, k: number): number =>
        (positions[k]!-positions[j]!)*(z-positions[j+2]!)
        - (positions[k+2]!-positions[j+2]!)*(x-positions[j]!);
      const signs = [edge(a,b),edge(b,c),edge(c,a)];
      if (signs.every((v) => v >= -1e-8) || signs.every((v) => v <= 1e-8)) heights.push(ay);
    }
    return heights;
  });
  for (const center of [-0.29, 0.29]) {
    assert.ok(Math.abs(Math.max(...horizontalHeights(center, 0)) - 0.268) < 1e-8);
    assert.ok(Math.abs(Math.max(...horizontalHeights(center, 0.20)) - 0.28) < 1e-8);
  }
});
