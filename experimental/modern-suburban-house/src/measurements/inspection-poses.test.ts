/** Compare the actual producers' allowed extremes under one inspection camera. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { Frame } from "../models/frame";
import { Bathrooms } from "../models/furnishings/bathrooms";
import { Windows } from "../models/windows";

const require = createRequire(import.meta.url);
const { buildHouse } =
  require("../spaces/house.ts") as typeof import("../spaces/house");
const { buildHouseEnvironment } =
  require("../spaces/environment.ts") as typeof import("../spaces/environment");
const { OpeningWindowFills } =
  require("../instances/opening-fills.ts") as typeof import("../instances/opening-fills");
const { ExteriorDoorFills } =
  require("../instances/exterior-door-fills.ts") as typeof import("../instances/exterior-door-fills");
const { InteriorDoorFills } =
  require("../instances/interior-door-fills.ts") as typeof import("../instances/interior-door-fills");
const { ArchitecturalFitout } =
  require("../instances/architectural-fitout.ts") as typeof import("../instances/architectural-fitout");
void test("the window owner supplies its actual double-hung, awning and fixed extremes", () => {
  const w = new Windows();
  for (const kind of ["double-hung", "awning", "fixed"] as const) {
    const spec = { id: kind, kind, width: 0.8, height: 1.2, columns: 1 },
      closed = w.build(spec),
      maximum = w.maximum(spec);
    if (kind === "fixed") assert.deepEqual(maximum, closed);
    else assert.notDeepEqual(maximum.model, closed.model);
    assert.deepEqual(maximum.faceByPart, closed.faceByPart);
  }
});
void test("opening window placement stays fixed when the allowed pose changes", () => {
  const env = buildHouseEnvironment(buildHouse()),
    owner = new OpeningWindowFills(),
    a = owner.build(env),
    b = owner.build(env, true);
  assert.deepEqual(a.instances, b.instances);
  assert.equal(a.prototypes.length, 12);
  assert.equal(
    a.prototypes.filter(
      (p, i) =>
        JSON.stringify(p.model) !== JSON.stringify(b.prototypes[i]!.model),
    ).length,
    10,
  );
});
void test("all four exterior and eleven interior doors retain their placement at the allowed extremes", () => {
  const env = buildHouseEnvironment(buildHouse()),
    external = new ExteriorDoorFills(),
    interior = new InteriorDoorFills();
  const a = external.build(env),
    b = external.build(env, true),
    c = interior.build(env, "closed"),
    d = interior.build(env, "maximum");
  assert.deepEqual(a.instances, b.instances);
  assert.equal(a.prototypes.length, 4);
  assert.deepEqual(c.instances, d.instances);
  assert.equal(c.prototypes.length, 11);
  for (const [before, after] of [
    [a.prototypes, b.prototypes],
    [c.prototypes, d.prototypes],
  ] as const)
    for (const [i, p] of before.entries())
      assert.notDeepEqual(p.model, after[i]!.model, p.model.id);
});
void test("fixed closets and the shower use their already declared travel ranges", () => {
  const house = buildHouse(),
    owner = new ArchitecturalFitout(),
    a = owner.build(house),
    b = owner.build(house, true);
  assert.deepEqual(a.instances, b.instances);
  assert.equal(
    a.prototypes.filter(
      (p, i) =>
        JSON.stringify(p.model) !== JSON.stringify(b.prototypes[i]!.model),
    ).length,
    4,
  );
});
void test("each sliding closet extreme leaves an open half instead of exchanging two closed leaves", () => {
  const house = buildHouse(),
    owner = new ArchitecturalFitout();
  const states = [
    owner.build(house),
    owner.build(house, true),
    owner.build(house, true, true),
  ];
  for (const [id, axis, minimumGap] of [
    ["closet:coat", 2, 0.44],
    ["closet:linen", 0, 0.46],
    ["fitting:bedroom-sliding-closet", 0, 0.7],
  ] as const) {
    const leaves = states.map((state) => {
      const model = state.prototypes.find((p) => p.model.id === id)!.model;
      return ["front", "rear"].map((leaf) => {
        const values = model.parts
          .filter((p) => p.id.startsWith(`door/${leaf}/`))
          .flatMap((p) => {
            assert.equal(p.geometry.type, "mesh");
            return p.geometry.type === "mesh"
              ? p.geometry.mesh.positions.filter((_, i) => i % 3 === axis)
              : [];
          });
        assert.ok(values.length > 0);
        return [Math.min(...values), Math.max(...values)] as const;
      });
    });
    const low = Math.min(...leaves[0]!.map((v) => v[0])),
      high = Math.max(...leaves[0]!.map((v) => v[1]));
    for (const [state, stationary] of [
      [1, 1],
      [2, 0],
    ] as const) {
      assert.deepEqual(leaves[state]![stationary], leaves[0]![stationary]);
      const coverage = leaves[state]!.slice().sort((a, b) => a[0] - b[0]);
      const union =
        coverage[0]![1] -
        coverage[0]![0] +
        Math.max(
          0,
          coverage[1]![1] - Math.max(coverage[0]![1], coverage[1]![0]),
        );
      assert.ok(
        high - low - union > minimumGap,
        `${id}: state ${state} closes the opening`,
      );
    }
  }
});
void test("a moving shower compares closed and maximum with one camera and face palette", () => {
  const owner = new Bathrooms(),
    closed = owner.showerBooth(),
    maximum = owner.showerBooth(1);
  const input = (built: typeof closed) => ({
    prototypes: [built],
    instances: [],
    finishes: Object.fromEntries(
      Object.values(built.faceByPart).map((f) => [
        f,
        { color: 0xababab, roughness: 0.4, metalness: 0 },
      ]),
    ),
  });
  const f = new Frame(),
    a = f.build(
      input(closed),
      closed.model.id,
      "diagonal",
      false,
      "b",
      input(maximum),
    ),
    b = f.build(
      input(maximum),
      maximum.model.id,
      "diagonal",
      false,
      "b",
      input(closed),
    );
  assert.deepEqual(a.camera, b.camera);
  assert.deepEqual(a.modelReview?.faces, b.modelReview?.faces);
  assert.notDeepEqual(
    a.items.filter((p) => p.role === "model").map((p) => p.positions),
    b.items.filter((p) => p.role === "model").map((p) => p.positions),
  );
});
