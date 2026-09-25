/** Complete docs/models/10–19 prototype census. Dimensions live only in
 * their reviewed domain owner files; this file only composes the population. */
import { buildPrototype, type PrototypeSpec } from "./templates";
import type { HousePrototype } from "./parts";
import { kitchenDiningSpecs } from "./furnishings/kitchen-dining";
import { livingSpecs } from "./furnishings/living";
import { serviceRoomSpecs } from "./furnishings/service-rooms";
import { bedroomSpecs } from "./furnishings/bedrooms";
import { bathroomSpecs } from "./furnishings/bathrooms";
import { outdoorFurnitureSpecs } from "./furnishings/outdoor";
import { sidingSpecs } from "./exterior/siding";
import { exteriorTrimSpecs } from "./exterior/trim";
import { shingleSpecs } from "./exterior/shingle";
import { drainageSpecs } from "./exterior/drainage";
import { plantingSpecs } from "./planting";
import { lightingFixtureSpecs } from "./lighting-fixtures";
import { housePropSpecs } from "./furnishings/props";

export const housePrototypeSpecs: readonly PrototypeSpec[] = [
  ...kitchenDiningSpecs,
  ...livingSpecs,
  ...serviceRoomSpecs,
  ...bedroomSpecs,
  ...bathroomSpecs,
  ...outdoorFurnitureSpecs,
  ...sidingSpecs,
  ...exteriorTrimSpecs,
  ...shingleSpecs,
  ...drainageSpecs,
  ...plantingSpecs,
  ...lightingFixtureSpecs,
  ...housePropSpecs,
];

export const buildHousePrototypes = () => housePrototypeSpecs.map(buildPrototype);

/** Separately movable objects within two reviewed multi-object design hosts. */
const objectVariants = [
  ["porch-mat", "porch-mat-planter", ["field", "border"]],
  ["porch-planter", "porch-mat-planter", ["container", "stem", "foliage"]],
  ["wall-art", "wall-art-indoor-plant", ["art-frame", "art-print"]],
  ["indoor-plant", "wall-art-indoor-plant", ["container", "stem", "foliage"]],
  ["pantry-container", "pantry-containers", ["container", "lid"]],
  ["pantry-box", "pantry-containers", ["box"]],
  ["pantry-basket", "pantry-containers", ["basket"]],
  ["kitchen-prep-props", "kitchen-food-utensils", ["cutting-board", "container", "utensil"]],
  ["dining-fruit-bowl", "kitchen-food-utensils", ["bowl", "fruit"]],
] as const;

function extractObject(parent: HousePrototype, id: string, surfaces: readonly string[]): HousePrototype {
  const members=parent.model.parts.filter((part)=>part.material!==null && surfaces.includes(part.material));
  if(!members.length) throw Error(`${id}: empty object from ${parent.id}`);
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const part of members) {
    if(part.geometry.type!=="mesh") throw Error(`${id}: non-mesh component`);
    const values=part.geometry.mesh.positions;
    for(let i=0;i<values.length;i+=3) for(let k=0;k<3;k++) {
      min[k]=Math.min(min[k]!,values[i+k]!);
      max[k]=Math.max(max[k]!,values[i+k]!);
    }
  }
  const offset=[(min[0]!+max[0]!)/2,min[1]!, (min[2]!+max[2]!)/2];
  const parts=members.map((part)=>{
    if(part.geometry.type!=="mesh") throw Error(`${id}: non-mesh component`);
    const source=part.geometry.mesh;
    const positions=source.positions.map((value,i)=>value-offset[i%3]!);
    return {...part,geometry:{type:"mesh" as const,mesh:{...source,positions}}};
  });
  const bindings=parent.bindings.filter((binding)=>surfaces.includes(binding.surface));
  const materials=parent.model.materials.filter((material)=>surfaces.includes(material.id));
  if(bindings.length!==surfaces.length||materials.length!==surfaces.length)
    throw Error(`${id}: incomplete extracted material faces`);
  return {id,owner:parent.owner,bindings,model:{...parent.model,id,name:id,parts,materials}};
}

/** Physical objects for placement. Each named member has its own local origin. */
export function buildHouseObjects(parents: HousePrototype[] = buildHousePrototypes()): HousePrototype[] {
  const byId=new Map(parents.map((p)=>[p.id,p]));
  const splitParents=new Set<string>(objectVariants.map(([,parent])=>parent));
  const separate=objectVariants.map(([id,parent,surfaces])=>{
    const source=byId.get(parent);
    if(!source) throw Error(`${id}: missing design host ${parent}`);
    return extractObject(source,id,surfaces);
  });
  for(const parentId of splitParents) {
    const source=byId.get(parentId)!;
    const union=new Set<string>(objectVariants.filter(([,parent])=>parent===parentId).flatMap(([, ,faces])=>[...faces] as string[]));
    if(source.bindings.some((binding)=>!union.has(binding.surface)))
      throw Error(`${parentId}: unassigned object face`);
  }
  return [...parents.filter((p)=>!splitParents.has(p.id)),...separate];
}
