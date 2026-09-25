/** Complete docs/models/10–19 prototype census. Dimensions live only in
 * their reviewed domain owner files; this file only composes the population. */
import { buildPrototype, curtainEnvelope, type PrototypeSpec, type WindowCurtainSize } from "./templates";
import type { HousePrototype } from "./parts";
import { kitchenDiningSpecs } from "./furnishings/kitchen-dining";
import { livingSpecs } from "./furnishings/living";
import { serviceRoomSpecs, laundryMachineSizes } from "./furnishings/service-rooms";
import { bedroomSpecs, bedSizes, bedMattressTop, deskSizes, nightstandSizes, nightstandBodyTop } from "./furnishings/bedrooms";
import { bathroomSpecs } from "./furnishings/bathrooms";
import { outdoorFurnitureSpecs } from "./furnishings/outdoor";
import { sidingSpecs } from "./exterior/siding";
import { exteriorTrimSpecs } from "./exterior/trim";
import { shingleSpecs } from "./exterior/shingle";
import { drainageSpecs } from "./exterior/drainage";
import { plantingSpecs } from "./planting";
import { lightingFixtureSpecs, pendantDimensions } from "./lighting-fixtures";
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

/** Reuse the same window object for each host opening; only its host-derived size changes. */
export function buildWindowCurtains(input:WindowCurtainSize):HousePrototype {
  const base=housePrototypeSpecs.find((spec)=>spec.id==="primary-window-curtains");
  if(!base) throw Error("primary-window-curtains: missing design host");
  return buildPrototype({...base,size:curtainEnvelope(input),curtain:input});
}

/** A design H2 may specify several objects whose placement belongs to
 * different room hosts. The partition names the actual parts, never guessed
 * screen positions; each partition gets its own bottom-centred local origin. */
type ObjectVariant = {
  id: string;
  parent: string;
  surfaces?: readonly string[];
  parts?: readonly string[];
};
const objectVariants: readonly ObjectVariant[] = [
  {id:"porch-mat",parent:"porch-mat-planter",surfaces:["field","border"]},
  {id:"porch-planter",parent:"porch-mat-planter",surfaces:["container","stem","foliage"]},
  {id:"wall-art",parent:"wall-art-indoor-plant",surfaces:["art-frame","art-print"]},
  {id:"indoor-plant",parent:"wall-art-indoor-plant",surfaces:["container","stem","foliage"]},
  {id:"pantry-container",parent:"pantry-containers",surfaces:["container","lid"]},
  {id:"pantry-box",parent:"pantry-containers",surfaces:["box"]},
  {id:"pantry-basket",parent:"pantry-containers",surfaces:["basket"]},
  {id:"kitchen-cutting-board",parent:"kitchen-food-utensils",parts:["cutting-board-1"]},
  {id:"kitchen-tool-cup",parent:"kitchen-food-utensils",parts:["container-1"],surfaces:["utensil"]},
  {id:"kitchen-food-jar",parent:"kitchen-food-utensils",parts:["container-2"]},
  {id:"dining-fruit-bowl",parent:"kitchen-food-utensils",surfaces:["bowl","fruit"]},
  {id:"living-book-one",parent:"living-tabletop-props",parts:["book-1"]},
  {id:"living-book-two",parent:"living-tabletop-props",parts:["book-2"]},
  {id:"living-tray",parent:"living-tabletop-props",surfaces:["tray"]},
  {id:"living-vase-flowers",parent:"living-tabletop-props",surfaces:["container","stem","foliage"]},
  {id:"sofa-pillow-left",parent:"sofa-throws",parts:["pillow-1"]},
  {id:"sofa-pillow-right",parent:"sofa-throws",parts:["pillow-2"]},
  {id:"sofa-folded-throw",parent:"sofa-throws",surfaces:["folded"]},
  {id:"nightstand",parent:"nightstand-lamp",surfaces:["carcass","drawer-front"]},
  {id:"nightstand-lamp-object",parent:"nightstand-lamp",surfaces:["lamp-base","lamp-shade"]},
];

function membersOf(parent: HousePrototype, variant: ObjectVariant): HousePrototype["model"]["parts"] {
  const members=parent.model.parts.filter((part)=>
    (variant.parts?.includes(part.id)??false)||
    (part.material!==null && (variant.surfaces?.includes(part.material)??false)));
  if(!members.length) throw Error(`${variant.id}: empty object from ${parent.id}`);
  if(variant.parts?.some((id)=>!members.some((part)=>part.id===id)))
    throw Error(`${variant.id}: missing declared object part`);
  if(variant.surfaces?.some((surface)=>!members.some((part)=>part.material===surface)))
    throw Error(`${variant.id}: missing declared object face`);
  return members;
}

function extractObject(parent: HousePrototype, variant: ObjectVariant): HousePrototype {
  const {id}=variant;
  const members=membersOf(parent,variant);
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
  const surfaces=new Set(members.map((part)=>part.material).filter((surface):surface is string=>surface!==null));
  const bindings=parent.bindings.filter((binding)=>surfaces.has(binding.surface));
  const materials=parent.model.materials.filter((material)=>surfaces.has(material.id));
  if(bindings.length!==surfaces.size||materials.length!==surfaces.size)
    throw Error(`${id}: incomplete extracted material faces`);
  return {id,owner:parent.owner,bindings,model:{...parent.model,id,name:id,parts,materials}};
}

/** Physical objects for placement. Each named member has its own local origin. */
export function buildHouseObjects(parents: HousePrototype[] = buildHousePrototypes()): HousePrototype[] {
  const byId=new Map(parents.map((p)=>[p.id,p]));
  const splitParents=new Set<string>(objectVariants.map((variant)=>variant.parent));
  const separate=objectVariants.map((variant)=>{
    const source=byId.get(variant.parent);
    if(!source) throw Error(`${variant.id}: missing design host ${variant.parent}`);
    return extractObject(source,variant);
  });
  for(const parentId of splitParents) {
    const source=byId.get(parentId)!;
    const selected=objectVariants.filter((variant)=>variant.parent===parentId).flatMap((variant)=>membersOf(source,variant));
    const counts=new Map<string,number>();
    for(const part of selected) counts.set(part.id,(counts.get(part.id)??0)+1);
    if(source.model.parts.some((part)=>counts.get(part.id)!==1))
      throw Error(`${parentId}: unassigned or duplicated object part`);
    const union=new Set(selected.map((part)=>part.material));
    if(source.bindings.some((binding)=>!union.has(binding.surface)))
      throw Error(`${parentId}: unassigned object face`);
  }
  const pendantHost=housePrototypeSpecs.find((spec)=>spec.id==="pendant-fixtures")!;
  if(!byId.has(pendantHost.id)) throw Error("pendant-fixtures: missing design host");
  const pendants=([
    ["island-pendant",pendantDimensions.island,"island"],
    ["dining-pendant",pendantDimensions.dining,"dining"],
  ] as const).map(([id,size,pendant])=>buildPrototype({...pendantHost,id,size,pendant}));
  const laundryHost=housePrototypeSpecs.find((spec)=>spec.id==="laundry-machine")!;
  if(!byId.has(laundryHost.id)) throw Error("laundry-machine: missing design host");
  const machines=(["washer","dryer"] as const).map((laundry)=>buildPrototype({
    ...laundryHost,id:`laundry-${laundry}`,size:laundryMachineSizes[laundry],laundry,
  }));
  const bedHost=housePrototypeSpecs.find((spec)=>spec.id==="headboard-bed")!;
  if(!byId.has(bedHost.id)) throw Error("headboard-bed: missing design host");
  const beds=([
    ["primary-bed",bedSizes.primary,"primary-bedding"],
    ["bedroom-two-bed",bedSizes.childTwo,"olive-bedding"],
    ["bedroom-three-bed",bedSizes.childThree,"blue-grey-bedding"],
  ] as const).map(([id,size,cover])=>buildPrototype({...bedHost,id,size,mattressTop:bedMattressTop(size),
    finishes:{...bedHost.finishes,bedding:cover}}));
  const deskHost=housePrototypeSpecs.find((spec)=>spec.id==="child-desk")!;
  if(!byId.has(deskHost.id)) throw Error("child-desk: missing design host");
  const desks=([
    ["bedroom-two-desk",deskSizes.childTwo],
    ["bedroom-three-desk",deskSizes.childThree],
  ] as const).map(([id,size])=>buildPrototype({...deskHost,id,size}));
  const nightstandHost=housePrototypeSpecs.find((spec)=>spec.id==="nightstand-lamp")!;
  if(!byId.has(nightstandHost.id)) throw Error("nightstand-lamp: missing design host");
  const childNightstands=([
    ["bedroom-two",nightstandSizes.childTwo],
    ["bedroom-three",nightstandSizes.childThree],
  ] as const).flatMap(([room,size])=>{
    const source=buildPrototype({...nightstandHost,id:`${room}-nightstand-source`,size,bodyTop:nightstandBodyTop(size)});
    return [
      extractObject(source,{id:`${room}-nightstand`,parent:source.id,surfaces:["carcass","drawer-front"]}),
      extractObject(source,{id:`${room}-nightstand-lamp`,parent:source.id,surfaces:["lamp-base","lamp-shade"]}),
    ];
  });
  return [...parents.filter((p)=>!splitParents.has(p.id)&&p.id!==pendantHost.id&&p.id!==laundryHost.id&&p.id!==bedHost.id&&p.id!==deskHost.id),
    ...separate,...pendants,...machines,...beds,...desks,...childNightstands];
}
