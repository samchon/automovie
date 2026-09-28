/** Sloped wall boundaries must cover the full intersection of a siding course. */
import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { test } from "node:test";

import type { IHouse } from "../spaces/house";

const require = createRequire(import.meta.url);
const { ExteriorRepetition } =
  require("../instances/exterior-repetition.ts") as typeof import("../instances/exterior-repetition");

const wall = (
  bottom: readonly [number, number],
  top: readonly [number, number],
): IHouse => {
  const corners = [
    [0, bottom[0], 0],
    [2, bottom[1], 0],
    [2, top[1], 0],
    [0, top[0], 0],
  ];
  return {
    parts: [
      {
        id: "front-sloped-wall",
        owner: "envelope/front.ts",
        role: "wall",
        color: 0xffffff,
        mesh: {
          positions: corners.flat(),
          indices: [0, 1, 2, 0, 2, 3],
          normals: corners.flatMap(() => [0, 0, 1]),
          uvs: null,
          skin: null,
        },
      },
    ],
    spaces: [],
    storages: [],
    zones: [],
  };
};

const projectedArea = (input: IHouse): number => {
  const built = new ExteriorRepetition().buildSiding(input);
  // Y=1.50 is the seventh 0.15 m course above the 0.60 m plinth.
  const course = built.models.find((p) => p.model.id.includes("-siding-6-"))!;
  assert.ok(course);
  let area = 0;
  for (const part of course.model.parts) {
    if (
      course.faceByPart[part.id] !== "siding-face" ||
      part.geometry.type !== "mesh"
    )
      continue;
    const mesh = part.geometry.mesh;
    for (let i = 0; i < mesh.indices!.length; i += 3) {
      const [a, b, c] = mesh
        .indices!.slice(i, i + 3)
        .map((n) => mesh.positions.slice(n * 3, n * 3 + 2));
      area +=
        Math.abs(
          (b![0]! - a![0]!) * (c![1]! - a![1]!) -
            (b![1]! - a![1]!) * (c![0]! - a![0]!),
        ) / 2;
    }
  }
  return area;
};

void test("ascending lower boundary retains its rectangular and triangular course portions", () => {
  // Bottom is Y=0.60+X. Above Y=1.50, a 0.90×0.18 rectangle and
  // a 0.18×0.18 right triangle remain: area 0.1782 square metres.
  const expected = 0.9 * 0.18 + (0.18 * 0.18) / 2;
  assert.ok(
    Math.abs(projectedArea(wall([0.6, 2.6], [3, 3])) - expected) < 1e-6,
  );
});

void test("ascending upper boundary retains its triangular and rectangular course portions", () => {
  // Top is Y=0.60+X. The course begins at X=0.90 and becomes full
  // height at X=1.08: area 0.18²/2 + (2-1.08)×0.18.
  const expected = (0.18 * 0.18) / 2 + (2 - 1.08) * 0.18;
  assert.ok(
    Math.abs(projectedArea(wall([0.6, 0.6], [0.6, 2.6])) - expected) < 1e-6,
  );
});

void test("descending lower boundary preserves the mirrored course area", () => {
  const expected = 0.9 * 0.18 + (0.18 * 0.18) / 2;
  assert.ok(
    Math.abs(projectedArea(wall([2.6, 0.6], [3, 3])) - expected) < 1e-6,
  );
});

void test("descending upper boundary preserves the mirrored course area", () => {
  const expected = (0.18 * 0.18) / 2 + (2 - 1.08) * 0.18;
  assert.ok(
    Math.abs(projectedArea(wall([0.6, 0.6], [2.6, 0.6])) - expected) < 1e-6,
  );
});

void test("horizontal boundaries preserve the full rectangular course", () => {
  assert.ok(
    Math.abs(projectedArea(wall([0.6, 0.6], [3, 3])) - 2 * 0.18) < 1e-6,
  );
});
