/**
 * Reviewed roof modules Each prototype stays in
 * its roof-local metre frame. roofTile uses +Z uphill and +Y roof normal;
 * ridgeTile uses +Z along the ridge and +Y vertically. Instances
 * own pitches, clipping to roof pieces, coping clearance and placements.
 * Changes invalidate tile contact checks and every roof-module board view.
 */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/ObjectMesh";
import { reviewedModel } from "../geometry/reviewedModel";
import { modelMesh } from "../geometry/modelMesh";
import { TempleRectilinearUnion } from "./TempleRectilinearUnion";
import { cutTileMesh } from "../geometry/cutTileMesh";
import { type TileCutPlane } from "../geometry/TileCutPlane";

const p=(x:number,y:number,z:number)=>({ x,y,z });
type RectilinearSolid=Parameters<typeof TempleRectilinearUnion.mesh>[1][number];

/**
 * Tile prototypes and declared host-cut variants preserve overlaps and empty semicircles.
 */
export class TempleCladding {
  roofTileCut(id: string, planes: readonly TileCutPlane[], ridgeEnd: number | null = null): IAutoMovieModel | null {
    const original = this.roofTile(ridgeEnd);
    const parts = original.parts.flatMap((part) => {
      if (part.geometry.type !== "mesh") throw new Error("tile crop requires a mesh");
      const mesh = (() => {
        try { return cutTileMesh(part.geometry.mesh, planes); }
        catch (error) { throw new Error(`${id}/${part.id}: ${String(error)}`); }
      })();
      return mesh === null ? [] : [{ ...part, geometry: { type: "mesh" as const, mesh } }];
    });
    return parts.length === 0 ? null : { ...original, id: `tile.roof.cut.${id}`, parts };
  }
  /**
   * One 0.40 m-wide pitch, with the lifted 0.08 m leading overlap.
   */
  roofTile(ridgeEnd: number | null = null):IAutoMovieModel{
    if (ridgeEnd !== null && !Number.isFinite(ridgeEnd)) throw new Error("invalid tile ridge end");
    const solids:RectilinearSolid[]=[
      { min:p(-0.20, 0, ridgeEnd !== null && ridgeEnd < 0.08 ? Math.max(0, ridgeEnd) : 0.08), max:p(0.20, 0.02, 0.52) },
    ];
    const ribEnd = ridgeEnd === null ? 0.44 : Math.min(0.44, ridgeEnd);
    for(const [a,b] of [
      [-0.20, -0.10],
      [0.10, 0.20],
    ])
      if (ribEnd > 0.08) solids.push({ min:p(a,0.02,0.08),max:p(b,0.04,ribEnd) });
    const tegula=TempleRectilinearUnion.mesh("tegula",solids);
    // The raised leading lap meets the bed and ribs only on an edge. It is a
    // separate tile surface, not a Boolean union at that zero-area contact.
    const originalLip=TempleRectilinearUnion.mesh("lip", [
      { min:p(-0.20, 0.02, 0), max:p(0.20, 0.04, 0.08) },
    ]);
    const lip = ridgeEnd === null ? originalLip : cutTileMesh(originalLip,
      [{ x: 0, y: 0, z: -1, constant: ridgeEnd }]);
    // Roof top uses U=X and V=uphill Z, rather than the common +Y projection.
    const roofUvs=(mesh:IAutoMovieMesh):IAutoMovieMesh=>{
      const uvs=[...mesh.uvs!];
      for(let i=0;i<mesh.positions.length/3;i++) if(mesh.normals![i*3+1]!>0.99){
        uvs[i*2]=mesh.positions[i*3]!;
        uvs[i*2+1]=mesh.positions[i*3+2]!;
      }
      return { ...mesh,uvs };
    };
    const cover=new ObjectMesh(), rings=8;
    const outer=(j:number,z:number)=>{
      const radius=0.085+(0.075-0.085)*(z-0.08)/0.44;
      const angle=Math.PI-Math.PI*j/rings;
      return p(0.20+radius*Math.cos(angle),0.04+radius*Math.sin(angle),z);
    };
    const inner=(j:number,z:number)=>{
      const radius=0.085+(0.075-0.085)*(z-0.08)/0.44-0.015;
      const angle=Math.PI-Math.PI*j/rings;
      return p(0.20+radius*Math.cos(angle),0.04+radius*Math.sin(angle),z);
    };
    for(let j=0;j<rings;j++){
      const u0=j*Math.PI/rings,u1=(j+1)*Math.PI/rings;
      const a=outer(j,0.08),b=outer(j+1,0.08),c=outer(j+1,0.52),d=outer(j,0.52);
      const r0=0.085,r1=0.075;
      cover.face(
        "imbrex",
        [a, d, c, b],
        [
          [r0*u0, 0.08],
          [r1*u0, 0.52],
          [r1*u1, 0.52],
          [r0*u1, 0.08],
        ],
      );
      const e=inner(j,0.08),f=inner(j+1,0.08),g=inner(j+1,0.52),h=inner(j,0.52);
      cover.face("imbrex",[e,f,g,h]);
      // Only the eave-facing cut closes: the upper end meets the next shell.
      cover.face("imbrex",[e,a,b,f]);
      if(j===0) cover.face("imbrex",[e,h,d,a]);
      if(j===rings-1) cover.face("imbrex",[b,c,g,f]);
    }
    const imbrex = ridgeEnd === null ? modelMesh(cover, "imbrex") :
      cutTileMesh(modelMesh(cover, "imbrex"), [{ x: 0, y: 0, z: -1, constant: ridgeEnd }]);
    return reviewedModel("tile.roof", "Flat and round roof tiles", [
      ["tegula", roofUvs(tegula)],
      ...(lip === null ? [] : [["lip", roofUvs(lip)] as [string, IAutoMovieMesh]]),
      ...(imbrex === null ? [] : [["imbrex", imbrex] as [string, IAutoMovieMesh]]),
    ]);
  }

  /**
   * Raised 0.05 m front nose and 0.40 m rear shell for one ridge pitch.
   */
  ridgeTile(slopeDegrees:19|22, length = 0.45):IAutoMovieModel{
    if (!(length > 0 && length <= 0.45 && Number.isFinite(length))) throw new Error("invalid ridge tile cut length");
    const angle=slopeDegrees*Math.PI/180, y0=0.02/Math.cos(angle)-0.13*Math.tan(angle);
    const tile=(x:number)=>0.02/Math.cos(angle)-Math.abs(x)*Math.tan(angle);
    const shell=new ObjectMesh();
    const segment=(radius:number,z0:number,z1:number):void=>{
      const inside=radius-0.02;
      let low=0,high=inside;
      for(let i=0;i<24;i++){
        const mid=(low+high)/2;
        if(y0+Math.sqrt(inside*inside-mid*mid)>tile(mid))low=mid;
        else high=mid;
      }
      const crossing=(low+high)/2;
      const xs=[...Array.from({ length:13 },(_,i)=>-radius*Math.cos(i*Math.PI/12)),
        -crossing,crossing].sort((a,b)=>a-b);
      const unique=xs.filter((x,i)=>i===0||x-xs[i-1]!>1e-10);
      const inner=(x:number)=>Math.abs(x)<=inside
        ? Math.max(y0+Math.sqrt(Math.max(0,inside*inside-x*x)), tile(x))
        : tile(x);
      const outer=(x:number)=>y0+Math.sqrt(Math.max(0,radius*radius-x*x));
      for(let j=0;j<unique.length-1;j++){
        const a=unique[j]!,b=unique[j+1]!;
        const oa=p(a,outer(a),z0),ob=p(b,outer(b),z0);
        const oc=p(a,outer(a),z1),od=p(b,outer(b),z1);
        const ia=p(a,inner(a),z0),ib=p(b,inner(b),z0);
        const ic=p(a,inner(a),z1),id=p(b,inner(b),z1);
        const arc=(x:number)=>radius*(Math.asin(Math.max(-1,Math.min(1,x/radius)))+Math.PI/2);
        shell.face(
          "ridge",
          [oa, oc, od, ob],
          [
            [arc(a), z0],
            [arc(a), z1],
            [arc(b), z1],
            [arc(b), z0],
          ],
        );
        shell.face("ridge",[ia,ib,id,ic]);
        const front=outer(a)-inner(a)<1e-10
          ? [ia, ob, ib]
          : outer(b)-inner(b)<1e-10
            ? [ia, oa, ob]
            : [ia, oa, ob, ib];
        const back=outer(a)-inner(a)<1e-10
          ? [ic, id, od]
          : outer(b)-inner(b)<1e-10
            ? [ic, id, oc]
            : [ic, id, od, oc];
        shell.face("ridge",front);
        shell.face("ridge",back);
      }
      for(const x of [-radius,radius]){
        if(outer(x)-inner(x)<1e-10)continue;
        const a=p(x,outer(x),z0),b=p(x,outer(x),z1),
          c=p(x,inner(x),z1),d=p(x,inner(x),z0);
        shell.face("ridge",x<0?[d,c,b,a]:[a,b,c,d]);
      }
    };
    segment(0.15,0,Math.min(0.05, length));
    if (length > 0.05) segment(0.13,0.05,length);
    return reviewedModel(
      `tile.ridge.${slopeDegrees}${length === 0.45 ? "" : `.end.${length.toFixed(8)}`}`,
      `Ridge ${slopeDegrees}°`,
      [["ridge", modelMesh(shell, "ridge")]],
    );
  }
}
