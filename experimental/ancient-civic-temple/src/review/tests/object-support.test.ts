import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieModel } from "@automovie/interface";
import { templeSupportedPlacement, type TempleObjectPlacement } from "../../instances/objects";
import { TempleFixtureModels } from "../../models/fixtures";
import { TemplePortableModels } from "../../models/portable";
import { TempleWareModels } from "../../models/wares";

const models = [...TempleFixtureModels.build(), ...TemplePortableModels.build(), ...TempleWareModels.build()];
const catalogue = () => new Map(models.map((model) => [model.id, model]));
const host: TempleObjectPlacement = { space: "room", role: "seat", prototype: "bench", x: 0, y: 1, z: 0, scale: 1.2 };
const onSeat = (map: ReadonlyMap<string, IAutoMovieModel>, placed: readonly TempleObjectPlacement[] = [host]) =>
  templeSupportedPlacement(map, placed, "room", "bowl", "offering-bowl", 0, 0, "seat", "seat", "highest", 0, 0.8);

void test("support elevation follows both emitted host top and guest bottom", () => {
  const before = onSeat(catalogue());
  assert.ok(Math.abs(before.y - (1 + 0.46 * 1.2)) < 1e-10);
  const map = catalogue();
  const bench = map.get("object.bench")!;
  map.set(bench.id, { ...bench, parts: bench.parts.map((part) => {
    if (part.id !== "seat" || part.geometry.type !== "mesh") return part;
    return { ...part, geometry: { ...part.geometry, mesh: { ...part.geometry.mesh,
      positions: part.geometry.mesh.positions.map((value, i) => i % 3 === 1 && value > 0.459 ? value + 0.1 : value),
    } } };
  }) });
  const hostRaised = onSeat(map);
  assert.ok(Math.abs(hostRaised.y - before.y - 0.12) < 1e-10);
  const bowl = map.get("object.offering-bowl")!;
  map.set(bowl.id, { ...bowl, parts: bowl.parts.map((part) => part.geometry.type === "mesh"
    ? { ...part, geometry: { ...part.geometry, mesh: { ...part.geometry.mesh,
      positions: part.geometry.mesh.positions.map((value, i) => i % 3 === 1 ? value + 0.02 : value),
    } } } : part) });
  assert.ok(Math.abs(onSeat(map).y - hostRaised.y + 0.016) < 1e-10);
});

void test("an indexed shelf level is selected from its actual upward board faces", () => {
  const shelf: TempleObjectPlacement = { space: "room", role: "shelf", prototype: "display-shelf", x: 0, y: 0, z: 0 };
  const second = templeSupportedPlacement(catalogue(), [shelf], "room", "cloth", "offering-bowl", 0, 0,
    "shelf", "board", 1);
  const highest = templeSupportedPlacement(catalogue(), [shelf], "room", "cloth", "offering-bowl", 0, 0,
    "shelf", "board");
  assert.ok(Math.abs(second.y - 0.58) < 1e-10);
  assert.ok(Math.abs(highest.y - 1.4) < 1e-10);
  assert.throws(() => templeSupportedPlacement(catalogue(), [shelf], "room", "cloth", "offering-bowl", 0, 0,
    "shelf", "board", 99), /판 99 없음/);
});

void test("support derivation refuses absent hosts and unresolved or non-mesh prototypes", () => {
  assert.throws(() => onSeat(catalogue(), []), /받침 seat 없음/);
  const noHost = catalogue(); noHost.delete("object.bench");
  assert.throws(() => onSeat(noHost), /prototype bench 없음/);
  const noGuest = catalogue(); noGuest.delete("object.offering-bowl");
  assert.throws(() => onSeat(noGuest), /prototype offering-bowl 없음/);
  const emptyGuest = catalogue();
  emptyGuest.set("object.offering-bowl", { ...emptyGuest.get("object.offering-bowl")!, parts: [] });
  assert.throws(() => onSeat(emptyGuest), /mesh 없음/);
  assert.throws(() => templeSupportedPlacement(catalogue(), [host], "room", "bowl", "offering-bowl", 0, 0,
    "seat", "missing"), /받침 부재 없음/);
  const noFace = catalogue();
  const bench = noFace.get("object.bench")!;
  noFace.set(bench.id, { ...bench, parts: bench.parts.map((part) => part.id === "seat" && part.geometry.type === "mesh"
    ? { ...part, geometry: { ...part.geometry, mesh: { ...part.geometry.mesh, indices: [] } } } : part) });
  assert.throws(() => onSeat(noFace), /위를 향한 받침면 없음/);
});

void test("non-indexed upward faces and non-mesh parts take their explicit branches", () => {
  const map = catalogue();
  const bench = map.get("object.bench")!;
  const seat = bench.parts.find((part) => part.id === "seat")!;
  if (seat.geometry.type !== "mesh") throw new Error("bench seat must be a mesh");
  const triangle = { ...seat, geometry: { ...seat.geometry, mesh: { ...seat.geometry.mesh,
    positions: [0, 0.6, 0, 0, 0.6, 1, 1, 0.6, 0], indices: null,
  } } };
  map.set(bench.id, { ...bench, parts: [triangle] });
  assert.ok(Math.abs(onSeat(map).y - (1 + 0.6 * 1.2)) < 1e-10);
  const shape = { ...seat, geometry: { type: "shape", shape: null } } as unknown as typeof seat;
  map.set(bench.id, { ...bench, parts: [shape] });
  assert.throws(() => onSeat(map), /받침 부재 없음/);
  const bowl = map.get("object.offering-bowl")!;
  const mixed = catalogue();
  mixed.set(bowl.id, { ...bowl, parts: [shape, ...bowl.parts] });
  assert.ok(Number.isFinite(onSeat(mixed).y));
});
