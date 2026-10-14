/**
 * Test actual laundry slabs/hooks and the canonical pantry member under node:test.
 * Analytic box/polygon volume budgets and signed edge balance after eight-decimal
 * coordinate welding are the mesh oracle. Placement checks compare selected mesh
 * vertices with current translated reservations and the pantry's two XZ strips.
 * Net edge balance and signed volume do not prove edge incidence exactly two,
 * absence of self-intersection or overlap, arbitrary placement or visible pixels.
 * All fixtures are synchronous memory values; assertion/producer failures reach
 * the runner without a browser, native renderer or persistent resource.
 */
import type { IAutoMovieMesh } from "@automovie/interface";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { buildingModelFinish } from "../materials/model-bindings";
import { ServiceRooms } from "../models/furnishings/service-rooms";

const require: NodeJS.Require = createRequire(import.meta.url);
const { buildHouse }: typeof import("../spaces/house") =
  require("../spaces/house.ts") as typeof import("../spaces/house");
const { ArchitecturalFitout }: typeof import("../instances/ArchitecturalFitout") =
  require("../instances/ArchitecturalFitout.ts") as typeof import("../instances/ArchitecturalFitout");

const volume: (m: IAutoMovieMesh) => number = (m: IAutoMovieMesh): number => {
  let result: number = 0;
  const edges: Map<string, number> = new Map<string, number>();
  const p: (i: number) => number[] = (i: number): number[] => m.positions.slice(i * 3, i * 3 + 3);
  const key: (v: number[]) => string = (v: number[]): string => v.map((n: number) : string => n.toFixed(8)).join(",");
  for (let i: number = 0; i < m.indices!.length; i += 3) {
    const vs: number[][] = [
      p(m.indices![i]!),
      p(m.indices![i + 1]!),
      p(m.indices![i + 2]!),
    ];
    const [a, b, c]: [number[], number[], number[]] = vs as [number[], number[], number[]];
    result +=
      (a[0]! * (b[1]! * c[2]! - b[2]! * c[1]!) +
        a[1]! * (b[2]! * c[0]! - b[0]! * c[2]!) +
        a[2]! * (b[0]! * c[1]! - b[1]! * c[0]!)) /
      6;
    for (let j: number = 0; j < 3; j++) {
      const from: string = key(vs[j]!),
        to: string = key(vs[(j + 1) % 3]!);
      const id: string = from < to ? `${from}/${to}` : `${to}/${from}`;
      edges.set(id, (edges.get(id) ?? 0) + (from < to ? 1 : -1));
    }
  }
  for (const [edge, count] of edges)
    assert.equal(count, 0, `open or reversed edge ${edge}`);
  return result;
};

void test("laundry slab and cleats match their analytic signed-volume budgets", () : void => {
  const built: import("../models/furnishings/geometry").FittingBuilt = new ServiceRooms().laundryTop();
  const volumes: number[] = built.model.parts.map((part: import("@automovie/interface").IAutoMovieModelPart) : number => {
    assert.equal(part.geometry.type, "mesh");
    if (part.geometry.type !== "mesh") throw new Error(part.id);
    assert.ok(
      buildingModelFinish(built.model.id, built.faceByPart[part.id]!).material
        .id,
    );
    return volume(part.geometry.mesh);
  });
  const expected: number =
    0.75 * 1.3 * 0.06 - 0.015 * 0.07 * 0.06 - 2 * 0.03 * 0.03 * 0.04;
  assert.ok(Math.abs(volumes[0]! - expected) < 1e-10);
  for (const v of volumes.slice(1))
    assert.ok(Math.abs(v - 0.03 * 0.03 * 0.04) < 1e-10);
  assert.ok(
    Math.abs(
      volumes.reduce((a: number, b: number) : number => a + b, 0) -
        (0.75 * 1.3 * 0.06 - 0.015 * 0.07 * 0.06),
    ) < 1e-10,
  );
});

void test("four mitred round hooks match volume budgets and coordinate-welded edge balance", () : void => {
  const built: import("../models/furnishings/geometry").FittingBuilt = new ServiceRooms().coatHooks();
  assert.equal(built.model.parts.length, 5);
  const area: number = (24 / 2) * 0.006 ** 2 * Math.sin((2 * Math.PI) / 24);
  for (const part of built.model.parts) {
    assert.equal(part.geometry.type, "mesh");
    if (part.geometry.type !== "mesh") throw new Error(part.id);
    const got: number = volume(part.geometry.mesh),
      want: number = part.id === "board" ? 0.02 * 0.1 * 0.8 : area * (0.08 + 0.025);
    assert.ok(Math.abs(got - want) < 1e-10, `${part.id} ${got} != ${want}`);
    assert.equal(
      buildingModelFinish(built.model.id, built.faceByPart[part.id]!).material
        .id,
      part.id === "board" ? "furniture-wood" : "black-coated-metal",
    );
  }
});

void test("the folding slab and wall hooks remain inside the actual laundry world reservations", () : void => {
  const house: import("../spaces/house").IHouse = buildHouse(),
    built: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = new ArchitecturalFitout().build(house);
  const selected: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[] = built.instances.filter(
    (i: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }) : boolean => i.id === "laundry-folding-top" || i.id === "laundry-coat-hooks",
  );
  assert.equal(selected.length, 2);
  for (const instance of selected) {
    const model: import("@automovie/interface").IAutoMovieModel = built.prototypes.find(
      (p: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }) : boolean => p.model.id === instance.modelId,
    )!.model;
    const zone: import("../spaces/rooms/reservations").IRoomReservation = house.spaces
      .flatMap((s: import("../spaces/rooms/shared").IRoomSpace) : readonly import("../spaces/rooms/reservations").IRoomReservation[] => s.reservations ?? [])
      .find((z: import("../spaces/rooms/reservations").IRoomReservation) : boolean => z.id === instance.id)!;
    const t: import("@automovie/interface").IAutoMovieVector3 = instance.transform.translation!;
    for (const part of model.parts) {
      assert.equal(part.geometry.type, "mesh");
      if (part.geometry.type !== "mesh") throw new Error(part.id);
      const ps: number[] = part.geometry.mesh.positions;
      for (let k: number = 0; k < ps.length; k += 3)
        for (const [j, axis] of (["x", "y", "z"] as const).entries()) {
          const n: number = ps[k + j]! + t[axis],
            range: readonly [number, number] = zone[axis]!;
          assert.ok(
            n >= range[0] - 1e-8 && n <= range[1] + 1e-8,
            `${instance.id}/${part.id}/${axis}`,
          );
        }
    }
  }
});

void test("one canonical pantry L member fills both source strips without a second frame transform", () : void => {
  const house: import("../spaces/house").IHouse = buildHouse(),
    built: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = new ArchitecturalFitout().build(house);
  const selected: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[] = built.instances.filter(
    (i: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }) : boolean => i.modelId === "fitting:pantry-shelves",
  );
  assert.equal(selected.length, 1);
  assert.equal(selected[0]!.id, "pantry-l-shelf");
  assert.deepEqual(selected[0]!.transform.translation, { x: 0, y: 0, z: 0 });
  assert.deepEqual(selected[0]!.transform.rotation, { x: 0, y: 0, z: 0, w: 1 });
  const strips: import("../spaces/rooms/reservations").IRoomReservation[] = house.spaces
    .flatMap((s: import("../spaces/rooms/shared").IRoomSpace) : readonly import("../spaces/rooms/reservations").IRoomReservation[] => s.reservations ?? [])
    .filter(
      (z: import("../spaces/rooms/reservations").IRoomReservation) : boolean => z.id === "pantry-back-shelf" || z.id === "pantry-right-shelf",
    );
  assert.equal(strips.length, 2);
  const model: import("@automovie/interface").IAutoMovieModel = built.prototypes.find(
    (p: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }) : boolean => p.model.id === selected[0]!.modelId,
  )!.model;
  for (const part of model.parts) {
    assert.equal(part.geometry.type, "mesh");
    if (part.geometry.type !== "mesh") throw new Error(part.id);
    for (let i: number = 0; i < part.geometry.mesh.positions.length; i += 3) {
      const x: number = part.geometry.mesh.positions[i]!,
        z: number = part.geometry.mesh.positions[i + 2]!;
      assert.ok(
        strips.some(
          (s: import("../spaces/rooms/reservations").IRoomReservation) : boolean =>
            x >= s.x[0] - 1e-9 &&
            x <= s.x[1] + 1e-9 &&
            z >= s.z[0] - 1e-9 &&
            z <= s.z[1] + 1e-9,
        ),
        part.id,
      );
    }
  }
});
