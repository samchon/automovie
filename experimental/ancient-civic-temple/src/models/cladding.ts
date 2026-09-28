/**
 * Reviewed roof modules from docs/models/cladding.md. Each prototype stays in
 * its roof-local metre frame. roofTile uses +Z uphill and +Y roof normal;
 * ridgeTile uses +Z along the ridge and +Y vertically. Instances
 * own pitches, clipping to roof pieces, coping clearance and placements.
 * Changes invalidate tile contact checks and every roof-module board view.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import {
  modelBox,
  modelMesh,
  reviewedModel,
} from "../geometry/model-source-shapes";

const p=(x:number,y:number,z:number)=>({ x,y,z });

/**
 * Two named tile surfaces preserve the actual overlaps and empty semicircle.
 * @evidence models/cladding.md The roofTile builder uses +Z uphill and +Y roof normal, while ridgeTile uses +Z along the ridge and +Y vertically; both keep stable tile part identities.
 * @evidenceReview models/cladding.md #516ad6d Compared the two H2 coordinate frames with roofTile's sloped panel and ridgeTile's Z extrusion; their returned parts retain separate tile identities.
 * @evidence principles/core/source-units.md#source-scope-preservation The two methods make only the reviewed roof and ridge modules; roof-piece clipping, pitch placement and coping clearance stay with instances.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Neither entry point accepts a roof placement or cuts a coping end; the class exposes only the two local modules its citations claim.
 * @evidence principles/core/source-units.md#source-substantive-completion roofTile returns tegula and imbrex meshes, while ridgeTile returns a one-part raised shell for each selected gable slope.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f roofTile returns both keyed meshes and ridgeTile returns a computed ridge mesh for either allowed slope, so the class has usable builders.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work Both cladding H2s specify overlap pitches, radii, foot contacts and local axes; the emitted modules use those inputs without requiring a newly chosen tile silhouette.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Checked both emitted profiles against the cladding H2 radii, pitch, contacts and axes; no extra tile-profile decision was needed in this class.
 * @evidence obligations/design/model-sources.md#design-owned-construction The class emits the reviewed tile profiles from equations and loops rather than transcribing vertex arrays or substituting a roof texture.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 ObjectMesh faces and the ridge intersection calculation produce geometry and UVs from the cited sections, without an authored vertex dump.
 */
export class TempleCladding {
  /**
   * One 0.40 m-wide pitch, with the lifted 0.08 m leading overlap.
   * @evidence models/cladding.md#roof-tile The flat panel raises its leading 0.08 m, omits the last 0.08 m rib, and the eight-sector half shell keeps its underside open between two rib-foot lines.
   * @evidenceReview models/cladding.md#roof-tile #18bc9f5 The two modelBox panel levels, shortened ribs and eight open shell sectors realize the H2's leading overlap and exposed eave cavity.
   * @evidence principles/core/source-units.md#source-scope-preservation Only tegula and imbrex parts are returned; the top-face UV is X/uphill Z, with row count and roof-edge cuts left to instances.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The result has tegula and imbrex only; roofTile does not take row count or an edge plane, while its top UV loop uses X and Z.
   * @evidence principles/core/source-units.md#source-substantive-completion The builder returns a full 0.52 m module with both panel and half-shell geometry, side normals, UVs and 0.44 m overlap interfaces.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The returned part meshes include faces through Z=0.52, the rib strip ends at 0.44, and reviewedModel carries the completed attributes.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The roof-tile H2 locates the raised front, removed rear ribs and tapered imbrex feet; these emitted faces exposed no further thickness or seam decision.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The 0.08 leading lift, 0.44 rib end and 0.085-to-0.075 shell taper have matching H2 instructions; this builder introduced no new seam.
   * @evidence obligations/design/model-sources.md#deterministic-build Fixed boxes, eight angular sectors and a linear radius taper yield the same two ordered part meshes on every no-argument call.
   * @evidenceReview obligations/design/model-sources.md#deterministic-build #27790fe roofTile has no external input or mutable state; fixed modelBox calls and the eight-index loop preserve ordered vertices and bounds.
   */
  roofTile():IAutoMovieModel{
    const flat=new ObjectMesh();
    modelBox(flat,"tegula",p(-0.20,0.02,0),p(0.20,0.04,0.08));
    modelBox(flat,"tegula",p(-0.20,0,0.08),p(0.20,0.02,0.52));
    for(const [a,b] of [
      [-0.20, -0.10],
      [0.10, 0.20],
    ])
      modelBox(flat,"tegula",p(a,0.02,0.08),p(b,0.04,0.44));
    const tegula=modelMesh(flat,"tegula");
    // Roof top uses U=X and V=uphill Z, rather than the common +Y projection.
    const uvs=[...tegula.uvs!];
    for(let i=0;i<tegula.positions.length/3;i++) if(tegula.normals![i*3+1]!>0.99){
      uvs[i*2]=tegula.positions[i*3]!;
      uvs[i*2+1]=tegula.positions[i*3+2]!;
    }
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
    return reviewedModel("tile.roof", "평기와와 둥근기와", [
      ["tegula", { ...tegula, uvs }],
      ["imbrex", modelMesh(cover, "imbrex")],
    ]);
  }

  /**
   * Raised 0.05 m front nose and 0.40 m rear shell for one ridge pitch.
   * @evidence models/cladding.md#ridge-tile The 0.15 m front radius and 0.13 m rear radius meet at Z=0.05 m; each profile's lower edge follows the max of the inner arc and the 19°/22° flat-tile plane.
   * @evidenceReview models/cladding.md#ridge-tile #0d0c3c2 The two segment calls meet at Z=0.05 and tile(x) cuts the inner profile for each permitted slope as the ridge H2 specifies.
   * @evidence principles/core/source-units.md#source-scope-preservation This ridge module uses only the H2's two slope values and one ridge part; roof-line length and final south cut remain with instances.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 ridgeTile accepts only 19 or 22 degrees and emits one ridge part, with no roof-line length or south closure input.
   * @evidence principles/core/source-units.md#source-substantive-completion Twenty-four bisection steps locate each inner arc/tile intersection, and segment extrusions return faces, normals and UVs for both radius zones.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The bisection loop determines both cut crossings before shell.face emits the front and rear sections with arc-length UV coordinates.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The ridge-tile H2 provides both shell radii, 0.02 m thickness, angular sampling, intersection rule and pitched foot plane; constructing the sections needed no new ridge height.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The radius-minus-0.02 inner surface and tile-plane maximum come from the ridge H2, so the segment calculation did not select a fresh height.
   */
  ridgeTile(slopeDegrees:19|22):IAutoMovieModel{
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
    segment(0.15,0,0.05);
    segment(0.13,0.05,0.45);
    return reviewedModel(
      `tile.ridge.${slopeDegrees}`,
      `용마루 ${slopeDegrees}°`,
      [["ridge", modelMesh(shell, "ridge")]],
    );
  }
}
