/** Physical census of every authored 10–19 model prototype. The denominator
 * comes from design H2s and the independent surface account. The same grammar
 * checks every generated part: indexed triangles, winding, metric UV, material
 * address, finite bounds and the declared source population. */
import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import { validateModel } from "@automovie/engine";
import { buildHouseObjects, buildHousePrototypes, housePrototypeSpecs } from "../models/catalogue";
import type { HousePrototype } from "../models/parts";

const root=join(dirname(fileURLToPath(import.meta.url)),"../..");
const design=new Map<string,string>();
for (let n=10;n<=19;n++) {
  const names=["kitchen-dining","living","service-rooms","bedrooms","bathrooms","outdoor","planting","light-fixtures","house-props","room-accents"];
  const file=`${n}-${names[n-10]}.md`;
  const source=readFileSync(join(root,"docs/models",file),"utf8");
  for (const match of source.matchAll(/^## (.*?) \{#([^}]+)\}/gm)) {
    if (design.has(match[2])) throw Error(`duplicate model H2: ${match[2]}`);
    design.set(match[2],file);
  }
}
const account=new Map<string,Set<string>>();
const declaredOwners=new Map<string,string>();
const accountSource=readFileSync(join(root,"docs/accounts/models/surface-ownership.md"),"utf8");
for (const row of accountSource.split(/\r?\n/)) {
  const match=/^\| \[[^\]]+\]\(\.\.\/\.\.\/models\/(1[^#)]+)#([^)]+)\) \| ([^|]+) \| ([^|]+) \|/.exec(row);
  if (!match) continue;
  if (account.has(match[2])) throw Error(`duplicate surface account: ${match[2]}`);
  account.set(match[2],new Set([...match[4].matchAll(/`([a-z0-9-]+)`/g)].map((m)=>m[1])));
  const sourceOwner=/`(src\/models\/[^`]+)`/.exec(match[3])?.[1];
  if(sourceOwner) declaredOwners.set(match[2],sourceOwner);
}

export interface PrototypeAudit {
  designed: number;
  accounted: number;
  built: number;
  engineValidated: number;
  measuredParts: number;
  measuredSurfaces: number;
  failures: string[];
}
type Bounds = { min:[number,number,number]; max:[number,number,number] };
const bounds=(mesh:IAutoMovieMesh):Bounds=>{
  const min:[number,number,number]=[Infinity,Infinity,Infinity];
  const max:[number,number,number]=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<mesh.positions.length;i+=3) for(let k=0;k<3;k++) {
    min[k]=Math.min(min[k],mesh.positions[i+k]!);
    max[k]=Math.max(max[k],mesh.positions[i+k]!);
  }
  return {min,max};
};
const partMesh=(part:IAutoMovieModelPart):IAutoMovieMesh=>{
  if(part.geometry.type!=="mesh") throw Error(`non-mesh part ${part.id}`);
  return part.geometry.mesh;
};
const overlap=(a:Bounds,b:Bounds)=>[0,1,2].reduce((v,k)=>v*Math.max(0,Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])),1);

/** Optional reference compares a mutated output with a fresh independent run.
 * Document/account checks stand on their own; this reference is solely the
 * adversarial output mutation oracle, not a design acceptance claim. */
export function auditPrototypePopulation(population:readonly HousePrototype[], reference?:readonly HousePrototype[]):PrototypeAudit {
  const failures:string[]=[];
  const ids=new Set<string>();
  let measuredParts=0,measuredSurfaces=0;
  let engineValidated=0;
  const canonical=new Map((reference??[]).map((p)=>[p.id,p]));
  const specs=new Map(housePrototypeSpecs.map((s)=>[s.id,s]));
  if(design.size!==account.size) failures.push(`design/account count ${design.size}/${account.size}`);
  for(const [id,owner] of design) {
    if(!account.has(id)) failures.push(`${id}: missing surface account`);
    if(specs.get(id)?.design!==owner) failures.push(`${id}: design owner missing or wrong`);
    if(specs.get(id)?.owner!==declaredOwners.get(id)) failures.push(`${id}: source owner differs from model account`);
  }
  for(const spec of housePrototypeSpecs) if(!design.has(spec.id)) failures.push(`${spec.id}: undesigned source prototype`);
  for(const p of population) {
    if(ids.has(p.id)) failures.push(`${p.id}: duplicate prototype`);
    ids.add(p.id);
    const expected=account.get(p.id);
    if(!reference) {
      const engine=validateModel({model:p.model});
      engineValidated++;
      if(!engine.success) for(const violation of engine.violations)
        failures.push(`${p.id}: engine ${violation.path} ${violation.expected}`);
    }
    if(!expected) { failures.push(`${p.id}: no model account`); continue; }
    const faces=new Set(p.model.parts.map((part)=>part.material));
    const boundFaces=new Set(p.bindings.map((binding)=>binding.surface));
    for(const face of expected) {
      measuredSurfaces++;
      if(!faces.has(face)) failures.push(`${p.id}: unmade face ${face}`);
      if(!boundFaces.has(face)) failures.push(`${p.id}: unbound face ${face}`);
    }
    for(const face of faces) if(face===null||!expected.has(face)) failures.push(`${p.id}: extra face ${face}`);
    for(const binding of p.bindings) {
      if(!["box-metric","cylinder-metric","ellipsoid-metric","mixed-metric"].includes(binding.uv))
        failures.push(`${p.id}/${binding.surface}: unknown UV projection`);
      if(binding.scale.some((n)=>!Number.isFinite(n)||n<=0)) failures.push(`${p.id}/${binding.surface}: invalid texture scale`);
      if(!Number.isInteger(binding.fallback)||binding.fallback<0||binding.fallback>0xffffff) failures.push(`${p.id}/${binding.surface}: no fallback colour`);
      if(!p.model.materials.some((m)=>m.id===binding.surface && m.baseColorTexture===null)) failures.push(`${p.id}/${binding.surface}: missing bitmap-free material`);
    }
    if(boundFaces.size!==p.bindings.length) failures.push(`${p.id}: duplicate surface binding`);
    const partIds=new Set<string>();
    const refParts=new Map(canonical.get(p.id)?.model.parts.map((part)=>[part.id,part])??[]);
    for(const part of p.model.parts) {
      measuredParts++;
      if(partIds.has(part.id)) failures.push(`${p.id}: duplicate part ${part.id}`);
      partIds.add(part.id);
      const mesh=partMesh(part), count=mesh.positions.length/3;
      if(!count||!Number.isInteger(count)||mesh.normals?.length!==mesh.positions.length||mesh.uvs?.length!==count*2||!mesh.indices?.length||mesh.indices.length%3)
        { failures.push(`${p.id}/${part.id}: incomplete mesh attributes`); continue; }
      if(![...mesh.positions,...mesh.normals,...mesh.uvs].every(Number.isFinite)) failures.push(`${p.id}/${part.id}: nonfinite attribute`);
      const bb=bounds(mesh);
      const spec=specs.get(p.id);
      if(spec) {
        const [width,height,depth]=spec.size;
        const margin=0.40;
        const back=spec.kind==="plant"?-depth/2-margin:spec.kind==="panel"?-depth-margin:-margin;
        const front=spec.kind==="plant"?depth/2+margin:depth+margin;
        const floor=spec.curtain?-spec.curtain.floorDrop-margin:spec.pendant?-height-margin:-margin;
        const ceiling=spec.curtain?spec.curtain.openingHeight+0.12+margin:spec.pendant?margin:height+margin;
        const left=spec.curtain?-0.10-margin:-width/2-margin;
        const right=spec.curtain?spec.curtain.openingWidth+0.10+margin:width/2+margin;
        if(bb.min[0]<left||bb.max[0]>right||
          bb.min[1]<floor||bb.max[1]>ceiling||
          bb.min[2]<back||bb.max[2]>front)
          failures.push(`${p.id}/${part.id}: outside declared model envelope`);
      }
      for(const index of mesh.indices) if(!Number.isInteger(index)||index<0||index>=count) failures.push(`${p.id}/${part.id}: invalid index ${index}`);
      for(let i=0;i<mesh.indices.length;i+=3) {
        const ia=mesh.indices[i]!,ib=mesh.indices[i+1]!,ic=mesh.indices[i+2]!;
        if(ia>=count||ib>=count||ic>=count) continue;
        const a=ia*3,b=ib*3,c=ic*3;
        const u=[mesh.positions[b]!-mesh.positions[a]!,mesh.positions[b+1]!-mesh.positions[a+1]!,mesh.positions[b+2]!-mesh.positions[a+2]!];
        const v=[mesh.positions[c]!-mesh.positions[a]!,mesh.positions[c+1]!-mesh.positions[a+1]!,mesh.positions[c+2]!-mesh.positions[a+2]!];
        const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
        const normal=[mesh.normals[a]!,mesh.normals[a+1]!,mesh.normals[a+2]!];
        const area=Math.hypot(...cross);
        if(area<1e-12||cross.reduce((sum,n,k)=>sum+n*normal[k]!,0)<area*0.5)
          failures.push(`${p.id}/${part.id}: degenerate or inverted triangle ${i/3}`);
        const ta=ia*2,tb=ib*2,tc=ic*2;
        const uvArea=Math.abs((mesh.uvs[tb]!-mesh.uvs[ta]!)*(mesh.uvs[tc+1]!-mesh.uvs[ta+1]!)
          -(mesh.uvs[tb+1]!-mesh.uvs[ta+1]!)*(mesh.uvs[tc]!-mesh.uvs[ta]!));
        if(uvArea<1e-12) failures.push(`${p.id}/${part.id}: collapsed metric UV triangle ${i/3}`);
      }
      const old=refParts.get(part.id);
      if(reference && old) {
        const before=bounds(partMesh(old));
        if(JSON.stringify(bb)!==JSON.stringify(before)) failures.push(`${p.id}/${part.id}: changed measured bounds`);
      }
    }
    if(reference) {
      for(const id of refParts.keys()) if(!partIds.has(id)) failures.push(`${p.id}: missing part ${id}`);
      for(let i=0;i<p.model.parts.length;i++) for(let j=i+1;j<p.model.parts.length;j++) {
        const a=p.model.parts[i]!,b=p.model.parts[j]!;
        const ra=refParts.get(a.id),rb=refParts.get(b.id);
        if(!ra||!rb) continue;
        const current=overlap(bounds(partMesh(a)),bounds(partMesh(b)));
        const before=overlap(bounds(partMesh(ra)),bounds(partMesh(rb)));
        if(current>before+1e-8) failures.push(`${p.id}: new overlapping volume ${a.id}/${b.id}`);
      }
    }
  }
  for(const id of design.keys()) if(!ids.has(id)) failures.push(`${id}: missing prototype`);
  return {designed:design.size,accounted:account.size,built:ids.size,engineValidated,measuredParts,measuredSurfaces,failures};
}

/** Fresh random index per trial; no chosen model id or fixed damaged part. */
export function runRandomMutations(trials:number):{trials:number;red:number;types:Record<string,number>} {
  const baseline=buildHousePrototypes();
  let red=0;
  const types:Record<string,number>={shift:0,float:0,delete:0,overlap:0};
  for(let t=0;t<trials;t++) {
    const population=structuredClone(baseline);
    const kind=["shift","float","delete","overlap"][t%4]!;
    const eligible=kind==="overlap" ? population.filter((p)=>{
      const parts=p.model.parts;
      for(let i=0;i<parts.length;i++) for(let j=i+1;j<parts.length;j++)
        if(overlap(bounds(partMesh(parts[i]!)),bounds(partMesh(parts[j]!)))<1e-12) return true;
      return false;
    }) : population;
    const candidate=eligible[randomInt(eligible.length)]!;
    const parts=candidate.model.parts;
    const index=randomInt(parts.length);
    types[kind]++;
    if(kind==="delete") parts.splice(index,1);
    else {
      const mesh=partMesh(parts[index]!);
      if(kind==="shift"||kind==="float") {
        const axis=kind==="shift"?2:1;
        for(let i=axis;i<mesh.positions.length;i+=3) mesh.positions[i]+=0.5;
      } else {
        const disjoint=parts.flatMap((a,i)=>parts.slice(i+1).flatMap((b,j)=>
          overlap(bounds(partMesh(a)),bounds(partMesh(b)))<1e-12 ? [[i,i+j+1] as const] : []));
        const [a,b]=disjoint[randomInt(disjoint.length)]!;
        const moved=partMesh(parts[a]!),source=bounds(moved),target=bounds(partMesh(parts[b]!));
        const delta=[0,1,2].map((k)=>(target.min[k]+target.max[k]-source.min[k]-source.max[k])/2);
        for(let i=0;i<moved.positions.length;i+=3) for(let k=0;k<3;k++) moved.positions[i+k]+=delta[k]!;
      }
    }
    if(auditPrototypePopulation(population,baseline).failures.length) red++;
  }
  return {trials,red,types};
}

if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const prototypes=buildHousePrototypes();
  const audit=auditPrototypePopulation(prototypes);
  const selectable=buildHouseObjects(prototypes);
  const checked=selectable.map((object)=>({id:object.id,result:validateModel({model:object.model})}));
  const objectFailures=checked.flatMap(({id,result})=>result.success?[]:result.violations.map((v)=>`${id}: engine ${v.path} ${v.expected}`));
  const trials=Number(process.argv[2]??0);
  const mutations=trials>0?runRandomMutations(trials):null;
  const failures=[...audit.failures,...objectFailures];
  console.log(JSON.stringify({...audit,selectableObjects:selectable.length,selectableEngineValidated:checked.filter(({result})=>result.success).length,
    failures:failures.slice(0,30),failureCount:failures.length,mutations}));
  if(failures.length||mutations&&mutations.red!==mutations.trials) process.exitCode=1;
}
