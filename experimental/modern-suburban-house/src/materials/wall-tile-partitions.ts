/** Partition existing wall faces at the authored wet-zone boundaries. */
import type { IAutoMovieMesh } from "@automovie/interface";
import type { IHousePart } from "../spaces/solid-records";
type Vertex={p:number[];n:number[];uv:number[]|null};
type Zone={box:readonly [number,number,number,number,number,number];normal:readonly [number,number,number]|null;part?:string};
const EPS=1e-8;
const zones:readonly Zone[]=[
  {box:[.82,.90000001,3.06,5.66,-8.8,-7.7],normal:null,part:"shower-primary-partition"},
  {box:[.9,2.15,3.06,5.66,-8.80000001,-8.79999999],normal:[0,0,1]},
  {box:[5.49999999,5.50000001,3.06,5.66,-8.7,-6.9],normal:[-1,0,0]},
  {box:[4.7,5.5,3.06,5.66,-8.80000001,-8.79999999],normal:[0,0,1]},
  {box:[-5.50000001,-5.49999999,.91,1.45,-9.8,-7.4],normal:[1,0,0]},
  {box:[-5.5,-2.15,.91,1.45,-10.45000001,-10.44999999],normal:[0,0,1]},
];
const split=(polygon:Vertex[],axis:number,value:number):[Vertex[],Vertex[]]=>{
  const low:Vertex[]=[],high:Vertex[]=[];
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i]!,b=polygon[(i+1)%polygon.length]!,da=a.p[axis]!-value,db=b.p[axis]!-value;
    if(da<=EPS)low.push(a);if(da>=-EPS)high.push(a);
    if((da<-EPS&&db>EPS)||(da>EPS&&db<-EPS)){
      const t=da/(da-db),mix=(u:number[],v:number[])=>u.map((x,j)=>x+(v[j]!-x)*t);
      const cross={p:mix(a.p,b.p),n:mix(a.n,b.n),uv:a.uv&&b.uv?mix(a.uv,b.uv):null};
      low.push(cross);high.push(cross);
    }
  }
  return [low,high];
};
const meshOf=(polygons:Vertex[][]):IAutoMovieMesh=>{
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(const poly of polygons)for(let i=1;i<poly.length-1;i++){
    const tri=[poly[0]!,poly[i]!,poly[i+1]!],a=tri[0]!.p,b=tri[1]!.p,c=tri[2]!.p;
    const u=b.map((v,j)=>v-a[j]!),v=c.map((x,j)=>x-a[j]!);
    if(Math.hypot(u[1]!*v[2]!-u[2]!*v[1]!,u[2]!*v[0]!-u[0]!*v[2]!,u[0]!*v[1]!-u[1]!*v[0]!)<1e-12)continue;
    const offset=positions.length/3;
    for(const vertex of tri){positions.push(...vertex.p);normals.push(...vertex.n);if(vertex.uv)uvs.push(...vertex.uv);}
    indices.push(offset,offset+1,offset+2);
  }
  return {positions,normals,indices,uvs:uvs.length===positions.length/3*2?uvs:null,skin:null};
};

/** The material owner splits a face; it adds no wall body or displaced surface. */
export class WallTilePartitions {
  /** Preserve area, winding and attributes while separating paint and wet tile. */
  public build(part:Pick<IHousePart,"id"|"role">,mesh:IAutoMovieMesh):{paint:IAutoMovieMesh;tile:IAutoMovieMesh|null} {
    if(part.role!=="wall"&&part.role!=="partition")return {paint:mesh,tile:null};
    return this.partition(part,mesh,zones);
  }
  /** Keep exterior masonry while painting the upper bedroom's existing inside face. */
  public chimney(part:Pick<IHousePart,"id"|"role">,mesh:IAutoMovieMesh):{masonry:IAutoMovieMesh;paint:IAutoMovieMesh|null} {
    if(part.id!=="chimney-body"||part.role!=="chimney")return {masonry:mesh,paint:null};
    const result=this.partition(part,mesh,[{box:[-5.50000001,-5.49999999,3.06,5.66,-2.75,-1.65],normal:[1,0,0]}]);
    return {masonry:result.paint,paint:result.tile};
  }
  private partition(part:Pick<IHousePart,"id"|"role">,mesh:IAutoMovieMesh,selectedZones:readonly Zone[]):{paint:IAutoMovieMesh;tile:IAutoMovieMesh|null} {
    if(mesh.normals===null||mesh.indices===null||mesh.skin!==null)throw new Error(`wet wall requires unskinned indexed normals: ${part.id}`);
    const paint:Vertex[][]=[],tile:Vertex[][]=[];
    for(let i=0;i<mesh.indices.length;i+=3){
      const polygon=mesh.indices.slice(i,i+3).map(index=>({p:mesh.positions.slice(index*3,index*3+3),n:mesh.normals!.slice(index*3,index*3+3),uv:mesh.uvs?.slice(index*2,index*2+2)??null}));
      let pending=[polygon];
      for(const zone of selectedZones){
        if(zone.part&&zone.part!==part.id)continue;
        const normal=polygon[0]!.n;
        if(zone.normal&&zone.normal.reduce((s,n,j)=>s+n*normal[j]!,0)<.99)continue;
        if([0,1,2].some(axis=>Math.max(...polygon.map(v=>v.p[axis]!))<zone.box[axis*2]!-EPS||Math.min(...polygon.map(v=>v.p[axis]!))>zone.box[axis*2+1]!+EPS))continue;
        const outside:Vertex[][]=[],within:Vertex[][]=[];
        for(const poly of pending){
          let remainder=poly;
          for(let axis=0;axis<3&&remainder.length>=3;axis++){
            const [below,rest]=split(remainder,axis,zone.box[axis*2]!);
            if(below.length>=3&&below.some(v=>v.p[axis]!<zone.box[axis*2]!-EPS))outside.push(below);
            remainder=rest;
            const [inside,above]=split(remainder,axis,zone.box[axis*2+1]!);
            if(above.length>=3&&above.some(v=>v.p[axis]!>zone.box[axis*2+1]!+EPS))outside.push(above);
            remainder=inside;
          }
          if(remainder.length>=3)within.push(remainder);
        }
        tile.push(...within);pending=outside;
      }
      paint.push(...pending);
    }
    const wet=meshOf(tile);
    return {paint:meshOf(paint),tile:wet.positions.length>0?wet:null};
  }
}
