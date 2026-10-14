/**
 * Test real house/scene outputs and controlled face samples against authored finish
 * IDs, explicit UV numbers, outward/interior grouping and retained index counts.
 * node:test covers siding, paving, stair and roof examples plus an unknown finish
 * and missing exterior direction. IDs and coordinate arrays do not prove texture
 * loading, visible grain scale, optical appearance or a full material census.
 * Synchronous fixtures remain in memory; producer/assertion failures reach the
 * runner, without a browser, GPU context or persistent native render resource.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createRequire } from "node:module";

const require: NodeJS.Require = createRequire(import.meta.url);
const {
  houseFinish,
  houseTextureUvs,
  houseWallFinishGroups,
  modelTextileMap,
}: typeof import("../viewer/materialPreview") = require("../viewer/materialPreview.ts") as typeof import("../viewer/materialPreview");
const { buildHouse }: typeof import("../spaces/house") = require("../spaces/house.ts") as typeof import("../spaces/house");
const { buildHouseScene }: typeof import("../viewer/buildHouseScene.js") = require("../viewer/buildHouseScene.ts") as typeof import("../viewer/buildHouseScene.js");

void test("every emitted house surface resolves to one authored finish", () : void => {
  const house: import("../spaces/house").IHouse = buildHouse();
  assert.ok(house.parts.length > 200);
  const finishes: import("../viewer/materialPreview").HouseFinish[] = house.parts.map((part: import("../types/IHousePart").IHousePart) : import("../viewer/materialPreview").HouseFinish => houseFinish(part.role, part.color));
  assert.ok(finishes.some((finish: import("../viewer/materialPreview").HouseFinish) : boolean => finish.id === "siding-warm-white"));
  assert.ok(finishes.some((finish: import("../viewer/materialPreview").HouseFinish) : boolean => finish.id === "roof-shingle"));
  assert.ok(finishes.some((finish: import("../viewer/materialPreview").HouseFinish) : boolean => finish.id === "brick-red-brown"));
  assert.ok(finishes.some((finish: import("../viewer/materialPreview").HouseFinish) : boolean => finish.id === "paving-concrete"));
  const posts: import("../types/IHousePart").IHousePart[] = house.parts.filter(
    (part: import("../types/IHousePart").IHousePart) : boolean => part.id.startsWith("stair-post-") || part.id.startsWith("stair-guard-post-"),
  );
  assert.equal(posts.length, 4);
  assert.ok(
    posts.every(
      (part: import("../types/IHousePart").IHousePart) : boolean => houseFinish(part.role, part.color).id === "interior-trim-white",
    ),
  );
  assert.throws(() : import("../viewer/materialPreview").HouseFinish => houseFinish("wall", 0x123456), /found 0/);
});

void test("metric tiles project by actual face and retain fallbacks", () : void => {
  const siding: import("../viewer/materialPreview").HouseFinish = houseFinish("wall", 0xebe5d8);
  assert.deepEqual(
    houseTextureUvs([0, 0, 0, 0, 0.15, 0], [0, 0, 1, 0, 0, 1], siding),
    [0, 0, 0, 1],
  );
  const paving: import("../viewer/materialPreview").HouseFinish = houseFinish("paving", 0xc4c0b6);
  assert.deepEqual(
    houseTextureUvs([0, 0, 0, 0.5, 0, 0.5], [0, 1, 0, 0, 1, 0], paving),
    [0, 0, 1, 1],
  );
  assert.deepEqual(
    houseTextureUvs(
      [1, 0, -2, 1, 1, -2],
      [1, 0, 0, 1, 0, 0],
      paving,
      "garden-terrace",
    ),
    [-4, 0, -4, 2],
  );
  assert.deepEqual(
    houseTextureUvs(
      [1, 0, -2, 1.5, 0.4, -1.5],
      [0, 0.8, 0.6, 0, 0.8, 0.6],
      paving,
      "front-walk-connector-0-0-0",
    ),
    [2, -4, 3, -3],
  );
  assert.deepEqual(
    houseTextureUvs(
      [1, 0, -2, 1, 1, -2],
      [1, 0, 0, 1, 0, 0],
      paving,
      "front-walk-connector-0-0-0",
    ),
    [-4, 0, -4, 2],
  );
  const tread: import("../viewer/materialPreview").HouseFinish = houseFinish("stair", 0x9a6b43);
  assert.deepEqual(
    houseTextureUvs([-1.8, 0.17, -1.73, -1.67, 0.17, -1.45], [0, 1, 0, 0, 1, 0], tread, "stair-lower-tread-1")?.map(
      (value: number) : number => Math.round(value * 1000) / 1000,
    ),
    [0, 0.233, 1, 0],
  );
  assert.deepEqual(
    houseTextureUvs([-0.65, 1.53, -3.41, -0.37, 1.53, -3.54], [0, 1, 0, 0, 1, 0], tread, "stair-upper-tread-1")?.map(
      (value: number) : number => Math.round(value * 1000) / 1000,
    ),
    [1, 0, 0, 0.233],
  );
  assert.deepEqual(
    houseTextureUvs([-1.8, 1.36, -3.41, -0.65, 1.36, -4.56], [0, 1, 0, 0, 1, 0], tread, "stair-landing")?.map(
      (value: number) : number => Math.round(value * 1000) / 1000,
    ),
    [0, 0, 8.846, 0.958],
  );
  const shingle: import("../viewer/materialPreview").HouseFinish = houseFinish("roof", 0x3d3f43);
  const roofUvs: number[] | undefined = houseTextureUvs(
    [0, 0, 0, 0, 0.14, 0.66],
    [0.6, 0.8, 0, 0.6, 0.8, 0],
    shingle,
  );
  assert.deepEqual(
    roofUvs?.map((value: number) : number => Math.round(value * 1000) / 1000),
    [0, 0, 1, 0.833],
  );
  assert.deepEqual(
    houseTextureUvs([0, 0.24, 0.32], [0, 0.928, 0.371], shingle)?.map(
      (value: number) : number => Math.round(value * 1000) / 1000,
    ),
    [0, 2.31],
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

void test("siding binds only to outward wall faces", () : void => {
  const normals: number[] = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 1, 0, 0, 1, 0,
    0, 1, 0,
  ];
  const groups: { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }[] = houseWallFinishGroups(
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
    groups.map((group: { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }) : (string | number[])[] => [group.suffix, group.finish.id, group.indices]),
    [
      ["/exterior", "siding-warm-white", [0, 1, 2]],
      ["/interior", "interior-wall-paint", [3, 4, 5, 6, 7, 8]],
    ],
  );
  assert.throws(
    () : { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }[] =>
      houseWallFinishGroups(
        { id: "unknown", owner: "garage.ts", role: "wall", color: 0xebe5d8 },
        normals,
        [0, 1, 2],
      ),
    /no exterior direction/,
  );
  const shared: import("../types/IHousePart").IHousePart = buildHouse().parts.find((part: import("../types/IHousePart").IHousePart) : boolean => part.id === "garage-shared-wall")!;
  assert.equal(
    houseWallFinishGroups(shared, shared.mesh.normals!, shared.mesh.indices!)[0]!.finish.id,
    "interior-wall-paint",
  );
});

void test("roof weather face alone receives shingles", () : void => {
  const roof: import("../types/IHousePart").IHousePart = buildHouse().parts.find((part: import("../types/IHousePart").IHousePart) : boolean => part.role === "roof" && part.color === 0x3d3f43)!;
  const groups: { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }[] = houseWallFinishGroups(
    roof,
    roof.mesh.normals!,
    roof.mesh.indices!,
  );
  assert.deepEqual(
    groups.map((group: { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }) : string => group.finish.id),
    ["roof-shingle", "trim-white"],
  );
  assert.equal(
    groups.reduce((sum: number, group: { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }) : number => sum + group.indices.length, 0),
    roof.mesh.indices!.length,
  );
});

void test("stair blocks bind oak tops and painted risers", () : void => {
  const tread: import("../types/IHousePart").IHousePart = buildHouse().parts.find((part: import("../types/IHousePart").IHousePart) : boolean => part.id === "stair-upper-tread-1")!;
  const groups: { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }[] = houseWallFinishGroups(
    tread,
    tread.mesh.normals!,
    tread.mesh.indices!,
  );
  assert.deepEqual(
    groups.map((group: { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }) : string => group.finish.id),
    ["stair-tread-wood", "trim-white"],
  );
  assert.equal(
    groups.reduce((sum: number, group: { suffix: string; finish: import("../viewer/materialPreview").HouseFinish; indices: number[]; }) : number => sum + group.indices.length, 0),
    tread.mesh.indices!.length,
  );
});

void test("scene keeps exterior siding while painting the garage and family room faces", () : void => {
  const scene: import("../viewer/IViewerScene").IViewerScene = buildHouseScene("wall-finish-test");
  const siding: import("../viewer/IViewerSceneItem").IViewerSceneItem[] = scene.items.filter(
    (item: import("../viewer/IViewerSceneItem").IViewerSceneItem) : boolean => item.texture === "/textures/siding.png",
  );
  assert.ok(siding.length > 0);
  assert.ok(siding.filter((item: import("../viewer/IViewerSceneItem").IViewerSceneItem): boolean =>item.role==="wall").every((item: import("../viewer/IViewerSceneItem").IViewerSceneItem) : boolean => item.id.endsWith("/exterior")));
  assert.ok(siding.filter((item: import("../viewer/IViewerSceneItem").IViewerSceneItem): boolean =>item.role==="model").every((item: import("../viewer/IViewerSceneItem").IViewerSceneItem): boolean | undefined =>item.modelId?.startsWith("siding:")||(item.id.startsWith("repeat:")&&item.faceId?.startsWith("siding-"))));
  const painted: import("../viewer/IViewerSceneItem").IViewerSceneItem[] = scene.items.filter(
    (item: import("../viewer/IViewerSceneItem").IViewerSceneItem) : boolean => item.color === 0xf1eee6 && item.role === "wall",
  );
  assert.ok(painted.some((item: import("../viewer/IViewerSceneItem").IViewerSceneItem) : boolean => item.id === "garage-shared-wall"));
  assert.ok(painted.some((item: import("../viewer/IViewerSceneItem").IViewerSceneItem) : boolean => item.id === "rear-main-wall/interior"));
  assert.ok(painted.some((item: import("../viewer/IViewerSceneItem").IViewerSceneItem) : boolean => item.id === "right-main-wall-back/interior"));
  assert.ok(painted.every((item: import("../viewer/IViewerSceneItem").IViewerSceneItem) : boolean => item.texture === undefined));
});
