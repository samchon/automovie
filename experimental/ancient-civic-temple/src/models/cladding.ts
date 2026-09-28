/**
 * Reviewed roof modules from docs/models/cladding.md. Each prototype stays in
 * its roof-local metre frame. roofTile uses +Z uphill and +Y roof normal;
 * ridgeTile uses +Z along the ridge and +Y vertically. Instances
 * own pitches, clipping to roof pieces, coping clearance and placements.
 * Changes invalidate tile contact checks and every roof-module board view.
 */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import { modelMesh, reviewedModel } from "../geometry/model-source-shapes";
import { TempleRectilinearUnion } from "./rectilinear-union";
import { cutTileMesh, type TileCutPlane } from "../geometry/mesh-plane-clip";

const p=(x:number,y:number,z:number)=>({ x,y,z });
type RectilinearSolid=Parameters<typeof TempleRectilinearUnion.mesh>[1][number];

/**
 * Tile prototypes and declared host-cut variants preserve overlaps and empty semicircles.
 * @evidence models/cladding.md The roofTile builder uses +Z uphill and +Y roof normal, while ridgeTile uses +Z along the ridge and +Y vertically; both keep stable tile part identities.
 * @evidence principles/core/source-units.md#source-scope-preservation Roof and ridge builders retain their authored local tile profiles; instances select host cut planes, ridge termination and placement, and the model owns each resulting boundary variant.
 * @evidence principles/core/source-units.md#source-substantive-completion roofTile returns tegula, lip and imbrex meshes; the ridge support strip and host cuts retain their surviving parts, and ridgeTile returns the selected slope's full or terminal shell.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work Both cladding H2s specify overlap pitches, radii, foot contacts and local axes; the emitted modules use those inputs without requiring a newly chosen tile silhouette.
 * @evidence obligations/design/model-sources.md#design-owned-construction The class emits the reviewed tile profiles from equations and loops rather than transcribing vertex arrays or substituting a roof texture.
 */
export class TempleCladding {
  /**
   * @evidence models/cladding.md#roof-tile A boundary variant retains the original metric tegula, lip and imbrex, clips them at the actual roof host planes, and closes each new ceramic cut.
   * @evidence principles/core/source-units.md#source-scope-preservation The crop changes only the tile boundary; it neither scales the tile nor changes its rib, thickness or curvature.
   * @evidence principles/core/source-units.md#source-substantive-completion Every surviving part retains normals and metric UVs, and a crop entirely outside the host returns null rather than a dummy shape.
   * @evidence upstream/design/model-sources.md#design-revision-from-model-source-work The roof-tile H2 now declares host-boundary cut variants because self-render inspection exposed missing valley-edge modules.
   * @evidence obligations/design/model-sources.md#deterministic-build Ordered roof half-spaces clip one immutable prototype through deterministic triangle intersections and planar cap triangulation.
   */
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
   * @evidence models/cladding.md#roof-tile The flat panel raises its leading 0.08 m, omits the last 0.08 m rib, and the eight-sector half shell keeps its underside open between two rib-foot lines.
   * @evidence principles/core/source-units.md#source-scope-preservation Tegula, lip and imbrex retain their local profiles and metric UVs; an optional ridge-end coordinate ends raised parts and retains the declared flat support strip without scaling the tile.
   * @evidence principles/core/source-units.md#source-substantive-completion The builder returns a full 0.52 m module with both panel and half-shell geometry, side normals, UVs and 0.44 m overlap interfaces.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The roof-tile H2 locates the raised front, removed rear ribs and tapered imbrex feet; these emitted faces exposed no further thickness or seam decision.
   * @evidence obligations/design/model-sources.md#deterministic-build Fixed solids, eight angular sectors and linear taper yield deterministic ordered part meshes, and a finite ridge-end coordinate trims only the declared support strip.
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
    return reviewedModel("tile.roof", "평기와와 둥근기와", [
      ["tegula", roofUvs(tegula)],
      ...(lip === null ? [] : [["lip", roofUvs(lip)] as [string, IAutoMovieMesh]]),
      ...(imbrex === null ? [] : [["imbrex", imbrex] as [string, IAutoMovieMesh]]),
    ]);
  }

  /**
   * Raised 0.05 m front nose and 0.40 m rear shell for one ridge pitch.
   * @evidence models/cladding.md#ridge-tile The 0.15 m front radius and 0.13 m rear radius meet at Z=0.05 m; each profile's lower edge follows the max of the inner arc and the 19°/22° flat-tile plane.
   * @evidence principles/core/source-units.md#source-scope-preservation The ridge module uses the H2's two slope values and one ridge part; instances select a terminal length no greater than the nominal 0.45m, preserving the fixed row pitch.
   * @evidence principles/core/source-units.md#source-substantive-completion Twenty-four bisection steps locate each inner arc/tile intersection, and segment extrusions return faces, normals and UVs for both radius zones.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The ridge-tile H2 provides both shell radii, 0.02 m thickness, angular sampling, intersection rule and pitched foot plane; constructing the sections needed no new ridge height.
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
      `용마루 ${slopeDegrees}°`,
      [["ridge", modelMesh(shell, "ridge")]],
    );
  }
}
