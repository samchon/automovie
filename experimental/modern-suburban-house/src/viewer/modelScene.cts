/** Isolated current-source model view. Each request builds the actual 62-item
 * catalogue and selects one named prototype; no preview geometry is copied.
 * Materials use their authored bitmap-free fallback while the binding carries
 * metric UV and scale for the later texture asset lane. */
import type { IAutoMovieMesh } from "@automovie/interface";
import { buildHouseObjects, buildHousePrototypes } from "../models/catalogue";
import type { IViewerScene, IViewerSceneItem } from "./scenePayload";

const extent=(mesh:IAutoMovieMesh) => {
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<mesh.positions.length;i+=3) for(let k=0;k<3;k++) {
    min[k]=Math.min(min[k]!,mesh.positions[i+k]!);
    max[k]=Math.max(max[k]!,mesh.positions[i+k]!);
  }
  return {min,max};
};

/** Return one actual prototype at its local origin with fit-derived views. */
export function buildModelScene(sourceDigest:string,id:string):IViewerScene {
  const parents=buildHousePrototypes();
  const prototype=[...parents,...buildHouseObjects(parents)].find((p)=>p.id===id);
  if(!prototype) throw Error(`unknown model prototype ${id}`);
  const bounds=prototype.model.parts.map((part)=>{
    if(part.geometry.type!=="mesh") throw Error(`${id}/${part.id}: non-mesh part`);
    return extent(part.geometry.mesh);
  });
  const min=[0,1,2].map((k)=>Math.min(...bounds.map((b)=>b.min[k]!)));
  const max=[0,1,2].map((k)=>Math.max(...bounds.map((b)=>b.max[k]!)));
  const center:[number,number,number]=[(min[0]!+max[0]!)/2,(min[1]!+max[1]!)/2,(min[2]!+max[2]!)/2];
  const radius=Math.max(0.25,Math.hypot(max[0]!-min[0]!,max[1]!-min[1]!,max[2]!-min[2]!)/2);
  const distance=radius*3.4;
  const items:IViewerSceneItem[]=prototype.model.parts.map((part)=>{
    if(part.geometry.type!=="mesh") throw Error(`${id}/${part.id}: non-mesh part`);
    const mesh=part.geometry.mesh;
    if(!mesh.normals||!mesh.indices) throw Error(`${id}/${part.id}: missing normals/indices`);
    const binding=prototype.bindings.find((candidate)=>candidate.surface===part.material);
    if(!binding) throw Error(`${id}/${part.id}: missing surface binding`);
    const material=prototype.model.materials.find((candidate)=>candidate.id===part.material);
    if(!material) throw Error(`${id}/${part.id}: missing material`);
    return {id:`${id}/${part.id}`,role:"model",owner:prototype.owner,color:binding.fallback,
      opacity:material.opacity,roughness:material.roughness,metalness:material.metallic,
      position:[0,0,0],positions:mesh.positions,normals:mesh.normals,indices:mesh.indices,
      castShadow:true,receiveShadow:true};
  });
  const views=[
    {id:"front",position:[center[0],center[1]+radius*0.32,center[2]+distance],target:center},
    {id:"three-quarter",position:[center[0]+distance*0.65,center[1]+radius*0.55,center[2]+distance*0.76],target:center},
    {id:"side",position:[center[0]+distance,center[1]+radius*0.32,center[2]],target:center},
    {id:"top",position:[center[0]+0.01,center[1]+distance,center[2]],target:center},
  ];
  return {subject:"model",inspection:true,sourceDigest,raster:{width:1536,height:1024,pixelRatio:1},
    camera:{position:views[1]!.position as [number,number,number],target:center,fovDeg:45,near:0.01,far:Math.max(100,distance*10)},
    lighting:{keyFrom:[-4,8,5],keyTarget:center,keyIntensity:3,skyColor:0xdfe8f2,groundColor:0x8a7f6e,fillIntensity:0.9,exposure:1,shadowHalfExtent:Math.max(8,radius*4)},
    items,observations:views.map((view)=>({id:view.id,position:view.position as [number,number,number],target:view.target}))};
}
