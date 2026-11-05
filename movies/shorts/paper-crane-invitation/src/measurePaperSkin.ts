import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import * as THREE from "three";
import { inspectClosedSkin } from "./inspectClosedSkin";

/** Fixed geometry queries are weakly held; scene retirement releases their keys. */
const queries:WeakMap<THREE.BufferGeometry,ReturnType<typeof createAutoMovieSignedMeshQuery>>=new WeakMap();
/**
 * Measure a real finite paper box against every original supplied skin triangle and closed solid.
 * @evidence contracts/common.md#implementation-and-ownership Actual world transforms put original triangles in the paper frame. A one-micrometre interior inset distinguishes boundary touch; geometric closure and fail-closed three-ray parity reject enclosing solids and ray-edge ambiguity. Independent public signed mesh queries require the actual box centre and all eight corners outside every supplied solid. All mesh rows are collected before admission. No material or normal is moved, and no contact witnesses are fabricated.
 * @evidence contracts/common.md#authoring-interface Supply the actual BoxGeometry and nonempty original skin meshes. Retains all coverage, interior, solid and signed observations. valid certifies this finite box against supplied skin only, not the folded wings, self-collision or force balance. Explicit allowBoundaryContact accepts signed-distance boundary touch for palm support only, never negative material penetration. Fixed immutable geometry is required for the weakly cached public query.
 */
export function measurePaperSkin(base:THREE.Mesh,skin:readonly THREE.Mesh[],allowBoundaryContact:boolean=false):{valid:boolean;intersections:number;containments:number;trianglesExamined:number;coverageComplete:boolean;invalidMeshes:string[];triangleCoverage:{name:string;examined:number;intersections:number;closed:boolean;containsPaper:boolean;determinate:boolean}[];independentOutside:boolean;signed:{name:string;distances:number[];error?:string}[]} {
  if(!(base.geometry instanceof THREE.BoxGeometry)||skin.length===0)throw new Error("Paper volume needs an actual box and nonempty skin");
  base.updateWorldMatrix(true,false);base.geometry.computeBoundingBox();
  const bounds:THREE.Box3=base.geometry.boundingBox!;
  const inner: THREE.Box3=bounds.clone().expandByScalar(-0.000001);
  const inverse: THREE.Matrix4=base.matrixWorld.clone().invert();
  let intersections: number=0;
  let trianglesExamined: number=0;
  let containments:number=0;
  const invalidMeshes: string[]=[];
  const triangleCoverage: {name:string;examined:number;intersections:number;closed:boolean;containsPaper:boolean;determinate:boolean}[]=[];
  for(const mesh of skin) {
    const row: typeof triangleCoverage[number]={name:mesh.parent?.name||mesh.name||mesh.uuid,examined:0,intersections:0,closed:false,containsPaper:false,determinate:false};triangleCoverage.push(row);
    const shell:THREE.Triangle[]=[];
    mesh.updateWorldMatrix(true,false);
    const transform: THREE.Matrix4=inverse.clone().multiply(mesh.matrixWorld);
    const positions: THREE.BufferAttribute|undefined=mesh.geometry.getAttribute("position") as THREE.BufferAttribute|undefined;
    const indices: THREE.BufferAttribute|null=mesh.geometry.getIndex();
    const count: number=indices?.count??positions?.count??0;
    const canonicalIndices: boolean=!indices||(indices.itemSize===1&&!indices.normalized&&(indices.array instanceof Uint8Array||indices.array instanceof Uint16Array||indices.array instanceof Uint32Array)&&indices.count===indices.array.length);
    if(!positions||positions.itemSize!==3||positions.count<3||count<3||count%3!==0||!canonicalIndices) {invalidMeshes.push(mesh.name||mesh.uuid);continue;}
    for(let offset: number=0;offset<count;offset+=3) {
      const ids: number[]=[0,1,2].map((n: number): number=>indices?indices.getX(offset+n):offset+n);
      if(!ids.every((id: number): boolean=>Number.isSafeInteger(id)&&id>=0&&id<positions.count)){invalidMeshes.push((mesh.name||mesh.uuid)+": indices");continue;}
      const vertices: THREE.Vector3[]=[0,1,2].map((n: number): THREE.Vector3=>new THREE.Vector3().fromBufferAttribute(positions,ids[n]!).applyMatrix4(transform));
      if(!vertices.every((v: THREE.Vector3): boolean=>v.toArray().every(Number.isFinite))){invalidMeshes.push((mesh.name||mesh.uuid)+": nonfinite triangle");continue;}
      trianglesExamined++;row.examined++;
      const triangle: THREE.Triangle=new THREE.Triangle(vertices[0]!,vertices[1]!,vertices[2]!);
      shell.push(triangle);
      if(inner.intersectsTriangle(triangle)){intersections++;row.intersections++;}
    }
    const volume:ReturnType<typeof inspectClosedSkin>=inspectClosedSkin(shell,bounds.getCenter(new THREE.Vector3()));
    row.closed=volume.closed;row.containsPaper=volume.inside;row.determinate=volume.determinate;
    if(volume.inside)containments++;
    if(!volume.closed||!volume.determinate)invalidMeshes.push(row.name+": indeterminate original solid");
  }
  const coverageComplete: boolean=trianglesExamined>0&&invalidMeshes.length===0;

  const probes:THREE.Vector3[]=[bounds.getCenter(new THREE.Vector3()),...[-1,1].flatMap((x:number):THREE.Vector3[]=>[-1,1].flatMap((y:number):THREE.Vector3[]=>[-1,1].map((z:number):THREE.Vector3=>new THREE.Vector3(x<0?bounds.min.x:bounds.max.x,y<0?bounds.min.y:bounds.max.y,z<0?bounds.min.z:bounds.max.z))))].map((p:THREE.Vector3):THREE.Vector3=>base.localToWorld(p));
  const signed:{name:string;distances:number[];error?:string}[]=[];
  let independentOutside:boolean=true;
  for(const mesh of skin) {
    try {
      let query:ReturnType<typeof createAutoMovieSignedMeshQuery>|undefined=queries.get(mesh.geometry);
      if(!query){const attr:THREE.BufferAttribute=mesh.geometry.getAttribute("position") as THREE.BufferAttribute;query=createAutoMovieSignedMeshQuery({positions:Array.from(attr.array),indices:mesh.geometry.index?Array.from(mesh.geometry.index.array):null,normals:null,uvs:null,skin:null});queries.set(mesh.geometry,query);}
      const distances:number[]=probes.map((p:THREE.Vector3):number=>query!(mesh.worldToLocal(p.clone()).toArray()).signedDistance);
      if(distances.some((v:number):boolean=>!Number.isFinite(v)||(allowBoundaryContact?v< -1e-8:v<=1e-8)))independentOutside=false;
      signed.push({name:mesh.parent?.name||mesh.name,distances});
    } catch(error:unknown) {independentOutside=false;signed.push({name:mesh.name,distances:[],error:String(error)});}
  }

  return {valid:coverageComplete&&independentOutside&&intersections===0&&containments===0,intersections,containments,trianglesExamined,coverageComplete,invalidMeshes,triangleCoverage,independentOutside,signed};
}
