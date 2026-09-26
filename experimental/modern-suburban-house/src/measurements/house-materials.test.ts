/** Material binding checks against emitted solids and metric projections. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  houseFinish,
  houseTextureUvs,
  houseWallFinishGroups,
  modelTextileMap,
} from "../viewer/materialPreview";
import { buildHouse } from "../spaces/house";
import { buildHouseScene } from "../viewer/houseScene.cjs";

void test("every emitted house surface resolves to one authored finish", () => {
  const house = buildHouse();
  assert.ok(house.parts.length > 200);
  const finishes = house.parts.map((part) => houseFinish(part.role, part.color));
  assert.ok(finishes.some((finish) => finish.id === "siding-warm-white"));
  assert.ok(finishes.some((finish) => finish.id === "roof-shingle"));
  assert.ok(finishes.some((finish) => finish.id === "brick-red-brown"));
  assert.ok(finishes.some((finish) => finish.id === "paving-concrete"));
  assert.throws(() => houseFinish("wall", 0x123456), /unbound house surface/);
});

void test("metric tiles project by actual face and retain fallbacks", () => {
  const siding = houseFinish("wall", 0xebe5d8);
  assert.deepEqual(
    houseTextureUvs([0, 0, 0, 0, 0.15, 0], [0, 0, 1, 0, 0, 1], siding),
    [0, 0, 0, 1],
  );
  const paving = houseFinish("paving", 0xc4c0b6);
  assert.deepEqual(
    houseTextureUvs([0, 0, 0, 0.5, 0, 0.5], [0, 1, 0, 0, 1, 0], paving),
    [0, 0, 1, 1],
  );
  const shingle = houseFinish("roof", 0x3d3f43);
  const roofUvs = houseTextureUvs(
    [0, 0, 0, 0, 0.14, 0.66],
    [0.6, 0.8, 0, 0.6, 0.8, 0],
    shingle,
  );
  assert.deepEqual(
    roofUvs?.map((value) => Math.round(value * 1000) / 1000),
    [0, 0, 1, 0.833],
  );
  assert.equal(
    houseTextureUvs([0, 0, 0], [0, 1, 0], houseFinish("ceiling", 0xf6f4ef)),
    undefined,
  );
  assert.equal(siding.color, 0xede8dc);
  assert.equal(siding.roughness, 0.55);
  assert.equal(modelTextileMap(0xb7afa3), "/textures/woven.png");
  assert.equal(modelTextileMap(0xa87a4e), undefined);
});

void test("siding binds only to outward wall faces", () => {
  const normals = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 1, 0, 0, 1, 0,
    0, 1, 0,
  ];
  const groups = houseWallFinishGroups(
    {
      id: "front-main-wall",
      owner: "envelope/front.ts",
      role: "wall",
      color: 0xebe5d8,
    },
    normals,
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.deepEqual(
    groups.map((group) => [group.suffix, group.finish.id, group.indices]),
    [
      ["/exterior", "siding-warm-white", [0, 1, 2]],
      ["/interior", "interior-painted-wall", [3, 4, 5, 6, 7, 8]],
    ],
  );
  assert.throws(
    () =>
      houseWallFinishGroups(
        { id: "unknown", owner: "garage.ts", role: "wall", color: 0xebe5d8 },
        normals,
        [0, 1, 2],
      ),
    /no exterior direction/,
  );
  const shared = buildHouse().parts.find((part) => part.id === "garage-shared-wall")!;
  assert.equal(
    houseWallFinishGroups(shared, shared.mesh.normals!, shared.mesh.indices!)[0]!.finish.id,
    "interior-painted-wall",
  );
});

void test("scene keeps exterior siding while painting the garage and family room faces", () => {
  const scene = buildHouseScene("wall-finish-test");
  const siding = scene.items.filter(
    (item) => item.texture === "/textures/siding.png",
  );
  assert.ok(siding.length > 0);
  assert.ok(siding.every((item) => item.id.endsWith("/exterior")));
  const painted = scene.items.filter(
    (item) => item.color === 0xf0ebe1 && item.role === "wall",
  );
  assert.ok(painted.some((item) => item.id === "garage-shared-wall"));
  assert.ok(painted.some((item) => item.id === "rear-main-wall/interior"));
  assert.ok(painted.some((item) => item.id === "right-main-wall-back/interior"));
  assert.ok(painted.every((item) => item.texture === undefined));
});
