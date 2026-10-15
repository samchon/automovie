/**
 * Test actual sanitary producers, authored face finishes and house fit-out placement.
 * The node:test oracle is ten selected instances and containment of every source
 * mesh vertex in its named reservation after the current yaw plus translation,
 * with 1e-7 tolerance. Finish IDs must resolve for the finite prototype sample.
 * This assumes the current unit-scale yaw placements; it checks neither arbitrary
 * transforms, other fittings, continuous clearance, collisions nor GPU appearance.
 * Fixtures are synchronous memory values; producer/assertion failures reach the
 * runner and no renderer, browser or persistent native resource is acquired.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import {buildingModelFinish} from "../materials/buildingModelFinish";
import {SanitaryFittings} from "../models/furnishings/SanitaryFittings";
import type { IHouse } from "../spaces/IHouse";
import type { IRoomReservation } from "../spaces/rooms/IRoomReservation";
import type { IRoomSpace } from "../spaces/rooms/IRoomSpace";
const require: NodeJS.Require=createRequire(import.meta.url);
const { buildHouse }: typeof import("../spaces/buildHouse") =
  require("../spaces/buildHouse.ts") as typeof import("../spaces/buildHouse");
const { ArchitecturalFitout }: typeof import("../instances/ArchitecturalFitout") =
  require("../instances/ArchitecturalFitout.ts") as typeof import("../instances/ArchitecturalFitout");

void test("all sanitary prototype faces resolve to one authored finish",(): void =>{
  const f: SanitaryFittings=new SanitaryFittings();
  for(const built of [f.toilet(),f.mirror(.60),f.mirror(.70),f.mirror(.85),f.towelBar(.25,.40),f.towelBar(.50,.30),f.towelBar(.75,.40),f.curtainRail()])
    for(const face of Object.values(built.faceByPart))assert.ok(buildingModelFinish(built.model.id,face).material.id);
});

void test("three toilets, mirrors and towel bars plus the rail fit their world reservations",(): void =>{
  const house: IHouse=buildHouse(),built: { prototypes: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }[]; instances: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]; }=new ArchitecturalFitout().build(house);
  const prototypes: Map<string, import("@automovie/interface").IAutoMovieModel>=new Map(built.prototypes.map((p: { model: import("@automovie/interface").IAutoMovieModel; faceByPart: Readonly<Record<string, string>>; }): [string, import("@automovie/interface").IAutoMovieModel] =>[p.model.id,p.model]));
  const reservations: Map<string, IRoomReservation>=new Map(house.spaces.flatMap((s: IRoomSpace): readonly IRoomReservation[] =>s.reservations??[]).map((z: IRoomReservation): [string, IRoomReservation] =>[z.id,z]));
  const selected: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }[]=built.instances.filter((i: { id: string; modelId: string; transform: import("@automovie/engine").IAutoMovieMeshTransform; }): boolean =>/-(toilet|mirror|towel)$|curtain-rail$/.test(i.id));
  assert.equal(selected.length,10);
  for(const instance of selected){
    const model: import("@automovie/interface").IAutoMovieModel=prototypes.get(instance.modelId)!,zone: IRoomReservation=reservations.get(instance.id)!;
    assert.ok(model&&zone);
    const q: import("@automovie/interface").IAutoMovieQuaternion=instance.transform.rotation!,t: import("@automovie/interface").IAutoMovieVector3=instance.transform.translation!;
    const yaw: number=2*Math.atan2(q.y,q.w),sin: number=Math.sin(yaw),cos: number=Math.cos(yaw);
    for(const part of model.parts){
      assert.equal(part.geometry.type,"mesh");if(part.geometry.type!=="mesh")throw new Error(part.id);
      const p: number[]=part.geometry.mesh.positions;
      for(let k: number=0;k<p.length;k+=3){
        const world: number[]=[t.x+cos*p[k]!+sin*p[k+2]!,t.y+p[k+1]!,t.z-sin*p[k]!+cos*p[k+2]!];
        for(const [j,axis] of (["x","y","z"] as const).entries()){
          const range: readonly [number, number]=zone[axis]!;
          assert.ok(world[j]!>=range[0]-1e-7&&world[j]!<=range[1]+1e-7,`${instance.id}/${part.id} ${axis}=${world[j]} outside ${range}`);
        }
      }
    }
  }
});
