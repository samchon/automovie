/**
 * Compare actual window, door, closet and shower producers at their declared extremes.
 * node:test checks unchanged instance placement/face identities, finite prototype
 * counts, changed geometry, and the union of the two selected closet leaf intervals;
 * the shower's two builds must share a camera and palette. These structural oracles
 * do not prove swept clearance, intermediate poses, passage or a visible GPU result.
 * Each test owns its synchronous in-memory fixtures; producer and assertion failures
 * propagate to the runner without a browser, timer or native render session.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { Frame } from "../models/Frame";
import { Bathrooms } from "../models/furnishings/Bathrooms";
import { Windows } from "../models/Windows";
import type { Face } from "../geometry/Face";
import type { IHouse } from "../spaces/IHouse";
import type { FittingBuilt } from "../models/furnishings/FittingBuilt";
import type { IViewerScene } from "../viewer/IViewerScene";
import type { IViewerSceneItem } from "../viewer/IViewerSceneItem";

const require: NodeJS.Require = createRequire(import.meta.url);
const { buildHouse }: typeof import("../spaces/buildHouse") =
  require("../spaces/buildHouse.ts") as typeof import("../spaces/buildHouse");
const { buildHouseEnvironment }: typeof import("../spaces/buildHouseEnvironment") =
  require("../spaces/buildHouseEnvironment.ts") as typeof import("../spaces/buildHouseEnvironment");
const { OpeningWindowFills }: typeof import("../instances/OpeningWindowFills") =
  require("../instances/OpeningWindowFills.ts") as typeof import("../instances/OpeningWindowFills");
const { ExteriorDoorFills }: typeof import("../instances/ExteriorDoorFills") =
  require("../instances/ExteriorDoorFills.ts") as typeof import("../instances/ExteriorDoorFills");
const { InteriorDoorFills }: typeof import("../instances/InteriorDoorFills") =
  require("../instances/InteriorDoorFills.ts") as typeof import("../instances/InteriorDoorFills");
const { ArchitecturalFitout }: typeof import("../instances/ArchitecturalFitout") =
  require("../instances/ArchitecturalFitout.ts") as typeof import("../instances/ArchitecturalFitout");
void test("the window owner supplies its actual double-hung, awning and fixed extremes", () : void => {
  const w: Windows = new Windows();
  for (const kind of ["double-hung", "awning", "fixed"] as const) {
    const spec: { id: "double-hung" | "awning" | "fixed"; kind: "double-hung" | "awning" | "fixed"; width: number; height: number; columns: number; } = { id: kind, kind, width: 0.8, height: 1.2, columns: 1 },
      closed: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "frame" | "sash" | "mullion" | "muntin" | "glass" | "obscured-glass" | "exterior-trim" | "interior-sill" | "interior-casing">>; } = w.build(spec),
      maximum: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "frame" | "sash" | "mullion" | "muntin" | "glass" | "obscured-glass" | "exterior-trim" | "interior-sill" | "interior-casing">>; } = w.maximum(spec);
    if (kind === "fixed") assert.deepEqual(maximum, closed);
    else assert.notDeepEqual(maximum.model, closed.model);
    assert.deepEqual(maximum.faceByPart, closed.faceByPart);
  }
});
void test("opening window placement stays fixed when the allowed pose changes", () : void => {
  const env: import("@automovie/interface").IAutoMovieBuiltEnvironment & { pendingMapGround: { parts: string[]; zones: string[]; }; } = buildHouseEnvironment(buildHouse()),
    owner: import("../instances/OpeningWindowFills").OpeningWindowFills = new OpeningWindowFills(),
    a: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "frame" | "sash" | "mullion" | "muntin" | "glass" | "obscured-glass" | "exterior-trim" | "interior-sill" | "interior-casing">>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = owner.build(env),
    b: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "frame" | "sash" | "mullion" | "muntin" | "glass" | "obscured-glass" | "exterior-trim" | "interior-sill" | "interior-casing">>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = owner.build(env, true);
  assert.deepEqual(a.instances, b.instances);
  assert.equal(a.prototypes.length, 12);
  assert.equal(
    a.prototypes.filter(
      (p: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "frame" | "sash" | "mullion" | "muntin" | "glass" | "obscured-glass" | "exterior-trim" | "interior-sill" | "interior-casing">>; }, i: number) : boolean =>
        JSON.stringify(p.model) !== JSON.stringify(b.prototypes[i]!.model),
    ).length,
    10,
  );
});
void test("all four exterior and eleven interior doors retain their placement at the allowed extremes", () : void => {
  const env: import("@automovie/interface").IAutoMovieBuiltEnvironment & { pendingMapGround: { parts: string[]; zones: string[]; }; } = buildHouseEnvironment(buildHouse()),
    external: import("../instances/ExteriorDoorFills").ExteriorDoorFills = new ExteriorDoorFills(),
    interior: import("../instances/InteriorDoorFills").InteriorDoorFills = new InteriorDoorFills();
  const a: { prototypes: ({ model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, Face>>; } | { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "sash" | "glass" | "exterior-trim" | "leaf-panel" | "jamb" | "leaf-exterior" | "leaf-interior" | "panel-edge" | "rail">>; joints: readonly Readonly<{ z: number; y: number; }>[]; } | { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "leaf-panel" | "handle" | "hinge" | "gate-batten">>; })[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = external.build(env),
    b: { prototypes: ({ model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, Face>>; } | { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "sash" | "glass" | "exterior-trim" | "leaf-panel" | "jamb" | "leaf-exterior" | "leaf-interior" | "panel-edge" | "rail">>; joints: readonly Readonly<{ z: number; y: number; }>[]; } | { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "leaf-panel" | "handle" | "hinge" | "gate-batten">>; })[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = external.build(env, true),
    c: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "jamb-a" | "jamb-b" | "jamb-core" | "casing-a" | "casing-b" | "leaf" | "leaf-panel" | "handle" | "hinge">>; hingePivot: readonly [number, number, number]; angle: number; clearWidth: number; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = interior.build(env, "closed"),
    d: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, "jamb-a" | "jamb-b" | "jamb-core" | "casing-a" | "casing-b" | "leaf" | "leaf-panel" | "handle" | "hinge">>; hingePivot: readonly [number, number, number]; angle: number; clearWidth: number; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = interior.build(env, "maximum");
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
void test("fixed closets and the shower use their already declared travel ranges", () : void => {
  const house: IHouse = buildHouse(),
    owner: import("../instances/ArchitecturalFitout").ArchitecturalFitout = new ArchitecturalFitout(),
    a: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = owner.build(house),
    b: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; } = owner.build(house, true);
  assert.deepEqual(a.instances, b.instances);
  assert.equal(
    a.prototypes.filter(
      (p: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }, i: number) : boolean =>
        JSON.stringify(p.model) !== JSON.stringify(b.prototypes[i]!.model),
    ).length,
    4,
  );
});
void test("each sliding closet extreme leaves an open half instead of exchanging two closed leaves", () : void => {
  const house: IHouse = buildHouse(),
    owner: import("../instances/ArchitecturalFitout").ArchitecturalFitout = new ArchitecturalFitout();
  const states: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; }[] = [
    owner.build(house),
    owner.build(house, true),
    owner.build(house, true, true),
  ];
  for (const [id, axis, minimumGap] of [
    ["closet:coat", 2, 0.44],
    ["closet:linen", 0, 0.46],
    ["fitting:bedroom-sliding-closet", 0, 0.7],
  ] as const) {
    const leaves: (readonly [number, number])[][] = states.map((state: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; }) : (readonly [number, number])[] => {
      const model: import("@automovie/interface").IAutoMovieModel = state.prototypes.find((p: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }) : boolean => p.model.id === id)!.model;
      return ["front", "rear"].map((leaf: string) : readonly [number, number] => {
        const values: number[] = model.parts
          .filter((p: import("@automovie/interface").IAutoMovieModelPart) : boolean => p.id.startsWith(`door/${leaf}/`))
          .flatMap((p: import("@automovie/interface").IAutoMovieModelPart) : number[] => {
            assert.equal(p.geometry.type, "mesh");
            return p.geometry.type === "mesh"
              ? p.geometry.mesh.positions.filter((_: number, i: number) : boolean => i % 3 === axis)
              : [];
          });
        assert.ok(values.length > 0);
        return [Math.min(...values), Math.max(...values)] as const;
      });
    });
    const low: number = Math.min(...leaves[0]!.map((v: readonly [number, number]) : number => v[0])),
      high: number = Math.max(...leaves[0]!.map((v: readonly [number, number]) : number => v[1]));
    for (const [state, stationary] of [
      [1, 1],
      [2, 0],
    ] as const) {
      assert.deepEqual(leaves[state]![stationary], leaves[0]![stationary]);
      const coverage: (readonly [number, number])[] = leaves[state]!.slice().sort((a: readonly [number, number], b: readonly [number, number]) : number => a[0] - b[0]);
      const union: number =
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
void test("a moving shower compares closed and maximum with one camera and face palette", () : void => {
  const owner: Bathrooms = new Bathrooms(),
    closed: FittingBuilt = owner.showerBooth(),
    maximum: FittingBuilt = owner.showerBooth(1);
  const input: (built: FittingBuilt) => { prototypes: FittingBuilt[]; instances: never[]; finishes: { [k: string]: { color: number; roughness: number; metalness: number; }; }; } = (built: typeof closed) : { prototypes: FittingBuilt[]; instances: never[]; finishes: { [k: string]: { color: number; roughness: number; metalness: number; }; }; } => ({
    prototypes: [built],
    instances: [],
    finishes: Object.fromEntries(
      Object.values(built.faceByPart).map((f: string) : [string, { color: number; roughness: number; metalness: number; }] => [
        f,
        { color: 0xababab, roughness: 0.4, metalness: 0 },
      ]),
    ),
  });
  const f: Frame = new Frame(),
    a: IViewerScene = f.build(
      input(closed),
      closed.model.id,
      "diagonal",
      false,
      "b",
      input(maximum),
    ),
    b: IViewerScene = f.build(
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
    a.items.filter((p: IViewerSceneItem) : boolean => p.role === "model").map((p: IViewerSceneItem) : number[] => p.positions),
    b.items.filter((p: IViewerSceneItem) : boolean => p.role === "model").map((p: IViewerSceneItem) : number[] => p.positions),
  );
});
