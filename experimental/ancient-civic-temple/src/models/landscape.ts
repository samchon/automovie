/** Site silhouettes from docs/models/landscape.md. Placement remains with instances. */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import { modelEllipsoid, modelExtrudeYZ } from "../geometry/model-source-shapes";

const p=(x:number,y:number,z:number)=>({x,y,z});
/**
 * Emits local vegetation and two neighboring house envelopes.
 * @evidence models/landscape.md These four builders provide the three site plants and the two variants of the neighboring house envelope.
 * @evidenceReview models/landscape.md #b783ce2 Compared the four H2s with cypress, broadTree, grassTuft and neighborHouse; the last selects the documented gable or shed shell.
 * @evidence principles/core/source-units.md#source-scope-preservation The methods own local trunks, foliage, blades and house shells; world placement and count remain with instances.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The four outputs are local silhouettes with no site transform or population count; those choices remain outside this class.
 * @evidence principles/core/source-units.md#source-substantive-completion Each method emits deterministic triangles and named parts for the reviewed local prototype, including the closed recess backing of both house variants.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Tree and blade loops emit faces, and neighborHouse closes each opening behind its recess instead of returning an empty envelope record.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The landscape H2s specify the plant sections, blade formulas and both house envelopes, so these builders need no new site boundary or variant decision.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c All four H2s fix their local plant or envelope recipes; no method selected a new plot boundary or third house variant.
 * @evidence obligations/design/model-sources.md#design-owned-construction The source directly emits the landscape H2s' plant and house profiles rather than passing descriptive data to a later modeller.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 ObjectMesh builds trunks, blade triangles and roof/wall faces in this source, preserving the cited design parts as emitted meshes.
 */
export class TempleLandscape {
  /**
   * @evidence models/landscape.md#cypress A 12-sided tapered trunk and three 10-by-6 ellipsoid crowns use the reviewed centers and half-axes.
   * @evidenceReview models/landscape.md#cypress #6779f9e The frustum has 12 sides and the three modelEllipsoid calls use the H2's offset centers and decreasing crown radii.
   * @evidence principles/core/source-units.md#source-scope-preservation Its ground-centered local prototype has trunk and crown parts and does not select any site position.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 cypress() accepts no planting coordinate and returns only trunk and crown geometry about its local ground center.
   * @evidence principles/core/source-units.md#source-substantive-completion The three overlapping crowns and tapered trunk emit actual normals, UVs and triangles, retaining the narrow vertical silhouette.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f m.frustum and the three ellipsoids supply mesh attributes for the narrow stacked silhouette before m.model returns it.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The cypress H2 fixes all three crown centers and extents and the trunk taper, leaving no unowned tree profile.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The three center/half-axis tuples and trunk taper match the cypress H2, so no fourth crown or source-chosen foliage profile was needed.
   */
  cypress():IAutoMovieModel {
    const m=new ObjectMesh();m.frustum("trunk",0,0,0,1.4,0.12,0.08,12);
    for(const [x,y,r,h] of [[0,3,0.75,3.6],[0.10,5.4,0.62,3.4],[-0.10,7.6,0.42,2.8]])
      modelEllipsoid(m,"crown",p(x,y,0),p(r,h/2,r),10,6);
    return m.model("landscape.cypress","좁고 높은 상록수");
  }

  /**
   * @evidence models/landscape.md#broad-tree A tapered trunk, three rods to the reviewed endpoints and six ellipsoid crowns make the broad silhouette.
   * @evidenceReview models/landscape.md#broad-tree #98af66b The three cylinder endpoints and six ellipsoid center/radius tuples realize the H2's lateral branches and broad canopy.
   * @evidence principles/core/source-units.md#source-scope-preservation It builds a ground-centered trunk/branch/crown model without choosing a planting point.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 broadTree has no position argument; its branches and crown share the same local trunk root, with placement left to instances.
   * @evidence principles/core/source-units.md#source-substantive-completion Three branch rods remain separate from six crown volumes so their gaps can be inspected in emitted geometry.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The three branch cylinders terminate at Y=2.6 within the lower crown region; six ellipsoids retain a separate crown part above them.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The broad-tree H2 determines each rod endpoint, crown center, half-axis and sector count used here.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The broad-tree endpoint list, ellipsoid axes and 10-by-6 sectors were already authored in its H2; the loop required no new branching rule.
   */
  broadTree():IAutoMovieModel {
    const m=new ObjectMesh();m.frustum("trunk",0,0,0,1.6,0.18,0.13,12);
    for(const [x,y,z] of [[-1.05,2.6,-0.55],[1.05,2.6,-0.55],[0,2.6,1.10]])
      m.cylinder("branch",p(0,1.5,0),p(x,y,z),0.07,8);
    for(const [x,y,z,rx,ry,rz] of [
      [-1.05,3.25,-0.55,1.15,1.35,1.05],[1.05,3.25,-0.55,1.15,1.35,1.05],
      [0,3.55,0.85,1.20,1.65,1.20],[-1.15,3.45,0.95,0.90,1.30,1.10],
      [1.15,3.45,0.95,0.90,1.30,1.10],[0,3.50,-0.95,1.05,1.40,1.15],
    ]) modelEllipsoid(m,"crown",p(x,y,z),p(rx,ry,rz),10,6);
    return m.model("landscape.broad-tree","넓은 수관의 나무");
  }

  /**
   * @evidence models/landscape.md#grass-tuft Twelve indexed radial blades use the H2 width, height and lean expressions and emit both sides of each triangle.
   * @evidenceReview models/landscape.md#grass-tuft #d5cc020 Each i from 0 to 11 computes H2 width, height and outward tip before two opposite-winding blade faces are emitted.
   * @evidence principles/core/source-units.md#source-scope-preservation The blades use the ground-center origin, leaving exclusion from paths and thresholds to site placement.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 grassTuft returns one ground-centered blade part and has no path, threshold or world-coordinate selector.
   * @evidence principles/core/source-units.md#source-substantive-completion The blade part contains twenty-four faces, with deterministic outward tips rather than a placeholder tuft box.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The twelve fixed iterations each add front and back triangles, yielding an actual two-sided tuft rather than a proxy box.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The grass H2 gives the twelve formulas and local origin; the source chooses no new plant distribution.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The modulo formulas and center offset are present in the grass H2; this source does not decide how tufts are distributed on site.
   */
  grassTuft():IAutoMovieModel {
    const m=new ObjectMesh();
    for(let i=0;i<12;i++){
      const theta=2*Math.PI*i/12,c=Math.cos(theta),s=Math.sin(theta);
      const width=0.02+0.005*(i%3),height=0.20+0.15*((5*i%12)/11);
      const extent=0.03+0.08+0.04*((i%4)/3);
      const a=p(0.03*c-width*s/2,0,0.03*s+width*c/2);
      const b=p(0.03*c+width*s/2,0,0.03*s-width*c/2);
      const tip=p(extent*c,height,extent*s);
      m.face("blade",[a,b,tip]);m.face("blade",[tip,b,a]);
    }
    return m.model("landscape.grass-tuft","벽 밑 풀");
  }

  /**
   * @evidence models/landscape.md#neighbor-house The gable or shed branch emits roof slabs with eave-to-high UV0, sloped side walls, a 0.30 m wall shell, plinth band and closed 0.20 m door/window recesses.
   * @evidenceReview models/landscape.md#neighbor-house #72a3d80 The kind branch builds both authored roof profiles, 0.30 wall strips and backed 0.20 recesses; the UV loop distinguishes +Z front from −Z rear slope.
   * @evidence principles/core/source-units.md#source-scope-preservation This local exterior has no navigable room, tile modules, world transform or independent site floor.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 neighborHouse returns wall, recess, roof and plinth parts only; it neither tiles the roof nor constructs an interior or site position.
   * @evidence principles/core/source-units.md#source-substantive-completion The emitted wall faces omit each front opening, recess faces bridge to a backing plane, and both roof profiles and plinth surfaces are separate parts.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The opening-cell skip leaves cutouts, five recess faces close each one, and modelExtrudeYZ supplies roof slabs distinct from the plinth.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The neighbor-house H2 fixes both footprints, roof slopes, opening arrays, wall thickness and recess depth; the source derives the two envelopes from them.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The gable/shed dimensions, slope and opening coordinates match the H2's two backgrounds; construction found no unowned room or window family.
   * @evidence obligations/design/model-sources.md#unsupported-fidelity-is-explicit These are background envelope slabs with opaque openings and no interior or individual roof tiles, as the model H2 limits their detail.
   * @evidenceReview obligations/design/model-sources.md#unsupported-fidelity-is-explicit #15c03fa The two output IDs remain background shells with solid recess backs and slab roofs; neither path silently adds an interior or detailed tiles.
   */
  neighborHouse(kind:"gable"|"shed"):IAutoMovieModel {
    const m=new ObjectMesh();
    const gable=kind==="gable",w=gable?8:6,d=gable?6:7;
    const front=gable?3.361:4.24,rear=gable?3.361:5.728;
    const halfW=w/2,halfD=d/2,wallDepth=0.30,recessDepth=0.20;
    const openings=[{ x:0,y:0,width:1,height:2.10 }];
    const windowXs=gable?[-2.20,2.20]:[-1.70,1.70];
    for(const x of windowXs)for(const y of gable?[1.35]:[1.25,2.95])
      openings.push({ x,y,width:0.60,height:0.80 });
    const xs=[-halfW,halfW,...openings.flatMap((o)=>[o.x-o.width/2,o.x+o.width/2])]
      .sort((a,b)=>a-b);
    const ys=[0,front,...openings.flatMap((o)=>[o.y,o.y+o.height])]
      .sort((a,b)=>a-b);
    const frontZ=halfD,backZ=frontZ-recessDepth;
    for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
      const x0=xs[i]!,x1=xs[i+1]!,y0=ys[j]!,y1=ys[j+1]!;
      if(x1<=x0||y1<=y0)continue;
      const cx=(x0+x1)/2,cy=(y0+y1)/2;
      if(openings.some((o)=>Math.abs(cx-o.x)<o.width/2&&cy>o.y&&cy<o.y+o.height))
        continue;
      m.face("wall",[p(x0,y0,frontZ),p(x1,y0,frontZ),
        p(x1,y1,frontZ),p(x0,y1,frontZ)]);
    }
    m.face("wall",[p(-halfW,0,frontZ-wallDepth),p(-halfW,front,frontZ-wallDepth),
      p(halfW,front,frontZ-wallDepth),p(halfW,0,frontZ-wallDepth)]);
    for(const o of openings){
      const x0=o.x-o.width/2,x1=o.x+o.width/2,y0=o.y,y1=o.y+o.height;
      m.face("recess",[p(x0,y0,backZ),p(x1,y0,backZ),
        p(x1,y1,backZ),p(x0,y1,backZ)]);
      m.face("recess",[p(x0,y0,frontZ),p(x0,y0,backZ),
        p(x0,y1,backZ),p(x0,y1,frontZ)]);
      m.face("recess",[p(x1,y0,backZ),p(x1,y0,frontZ),
        p(x1,y1,frontZ),p(x1,y1,backZ)]);
      m.face("recess",[p(x0,y0,frontZ),p(x1,y0,frontZ),
        p(x1,y0,backZ),p(x0,y0,backZ)]);
      m.face("recess",[p(x0,y1,backZ),p(x1,y1,backZ),
        p(x1,y1,frontZ),p(x0,y1,frontZ)]);
    }
    m.box("wall",0,0,-halfD+wallDepth/2,w,rear,wallDepth);
    const slope=gable?22*Math.PI/180:12*Math.PI/180;
    for(const side of [-1,1]){
      const x0=side<0?-halfW:halfW-wallDepth;
      const x1=side<0?-halfW+wallDepth:halfW;
      const top=(z:number)=>gable
        ? 4.573-Math.abs(z)*Math.tan(slope)
        : front+(halfD-z)*Math.tan(slope);
      const section=gable
        ? [[0,-halfD],[top(-halfD),-halfD],[top(0),0],
          [top(halfD),halfD],[0,halfD]]
        : [[0,-halfD],[top(-halfD),-halfD],[top(halfD),halfD],[0,halfD]];
      modelExtrudeYZ(m,"wall",section as [number,number][],x0,x1);
    }
    for(const [x0,x1] of [[-halfW,-0.5],[0.5,halfW]])
      m.box("plinth",(x0+x1)/2,0,halfD+0.004,x1-x0,0.50,0.008);
    m.box("plinth",0,0,-halfD-0.004,w,0.50,0.008);
    for(const side of [-1,1])
      m.box("plinth",side*(halfW+0.004),0,0,0.008,0.50,d);
    if(gable){
      modelExtrudeYZ(m,"roof",[[3.40,-3.30],[4.733,0],[4.573,0],[3.24,-3.30]],-4.3,4.3);
      modelExtrudeYZ(m,"roof",[[4.733,0],[3.40,3.30],[3.24,3.30],[4.573,0]],-4.3,4.3);
    }else{
      modelExtrudeYZ(m,"roof",[[5.952,-3.8],[4.336,3.8],[4.176,3.8],[5.792,-3.8]],-3.3,3.3);
    }
    const model=m.model(`landscape.neighbor-house.${kind}`,`이웃 회벽집 ${kind}`);
    const roof=model.parts.find((part)=>part.id==="roof")!.geometry as {type:"mesh";mesh:IAutoMovieMesh};
    const { positions }=roof.mesh,normals=roof.mesh.normals!,uvs=roof.mesh.uvs!;
    const edge=gable?3.3:3.8,halfRoofWidth=gable?4.3:3.3;
    for(let i=0;i<positions.length/3;i++){
      const ny=normals[3*i+1]!,nz=normals[3*i+2]!;
      if(ny<0.8||Math.abs(nz)<0.1)continue;
      const x=positions[3*i]!,z=positions[3*i+2]!;
      const rearSlope=gable&&nz<0;
      uvs[2*i]=rearSlope?halfRoofWidth-x:x+halfRoofWidth;
      uvs[2*i+1]=(rearSlope?z+edge:edge-z)/Math.cos(slope);
    }
    return model;
  }
}
