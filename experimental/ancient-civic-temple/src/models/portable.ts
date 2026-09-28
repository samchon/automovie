/** Basic portable silhouettes from docs/models/portable.md; no finish or motion. */
import type { IAutoMovieModel } from "@automovie/interface";
import { triangulateAutoMovieRegion } from "@automovie/engine";
import { ObjectMesh } from "../geometry/object-mesh";
import { modelBox, modelMesh, reviewedModel } from "../geometry/model-source-shapes";
import { TempleRectilinearUnion } from "./rectilinear-union";

const p=(x:number,y:number,z:number)=>({x,y,z});
const box=(m:ObjectMesh,id:string,x:number,y:number,z:number,w:number,h:number,d:number)=>
  m.box(id,x,y,z,w,h,d);
const woodBox=(m:ObjectMesh,id:string,x:number,y:number,z:number,w:number,h:number,d:number)=>{
  const min=p(x-w/2,y,z-d/2),max=p(x+w/2,y+h,z+d/2);
  const direction=w>=h&&w>=d?p(1,0,0):h>=d?p(0,1,0):p(0,0,1);
  modelBox(m,id,min,max,{origin:min,direction});
};

/**
 * Portable fixed-form props without room placement or animated use.
 * @evidence models/portable.md This class exposes thirteen named portable-object builders and the two authored bench/textile size branches.
 * @evidence principles/core/source-units.md#source-scope-preservation Its methods keep the portable H2 identities separate from furniture, vessels and ritual fit-out, leaving all placements to instances.
 * @evidence principles/core/source-units.md#source-substantive-completion Each method returns actual named mesh parts for a recognizable rough silhouette instead of an empty asset placeholder.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The portable H2s already name each object's major form, size family and fixed state used by these approximate meshes.
 * @evidence obligations/design/model-sources.md#design-owned-construction The emitted part names and box/rod/vessel primitives follow the portable H2 identities, with no hand-transcribed bulk mesh arrays.
 */
export class TemplePortable {
  /**
   * @evidence models/portable.md#bench The standard and short widths share a 0.45 m deep stone seat and two inset piers under an open middle.
   * @evidence principles/core/source-units.md#source-scope-preservation Only the two H2 bench lengths are selectable; neither waiting-place position nor upholstery is added.
   * @evidence principles/core/source-units.md#source-substantive-completion The seat and paired pier meshes meet at Y=0.40 m and reach a 0.46 m seat top.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bench H2 fixes both widths, pier offsets and the open support gap used by this box assembly.
   */
  bench(kind:"standard"|"short"):IAutoMovieModel {
    const m=new ObjectMesh(),w=kind==="standard"?1.40:1.10;
    box(m,"seat",0,0.40,0,w,0.06,0.45);
    for(const x of [-w/2+0.17,w/2-0.17]) box(m,"pier",x,0,0,0.12,0.40,0.36);
    return m.model(`portable.bench.${kind}`,`석재 벤치 ${kind}`);
  }

  /**
   * @evidence models/portable.md#portable-lamp A short round foot and slender stem hold an open dish at Y=0.23–0.28 m.
   * @evidence principles/core/source-units.md#source-scope-preservation This unlit portable lamp is distinct from the tall fixture and leaves its room use to instances.
   * @evidence principles/core/source-units.md#source-substantive-completion Foot, stem and dish are three 16-sector mesh parts, with an actual cup opening.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The portable-lamp H2 sets the low foot, stem and shallow cup proportions used by this fixed proxy.
   */
  portableLamp():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("foot",0,0,0,0.035,0.10,0.10,16);
    m.frustum("stem",0,0,0.035,0.23,0.012,0.012,16);
    m.vessel("dish",0,0,[[0.23,0.12],[0.28,0.12]],
      [[0.28,0.105],[0.238,0.105]],16);
    return m.model("portable.lamp","소형 등잔");
  }

  /**
   * @evidence models/portable.md#jar-rack A low rectangular top stands on four legs; two 0.16 m circular well markers identify the jar positions on its upper face.
   * @evidence principles/core/source-units.md#source-scope-preservation The rack model contains no jars and chooses no storage-room placement.
   * @evidence principles/core/source-units.md#source-substantive-completion Top, leg and well-marker parts make the two-place stand legible at rough blocking scale.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The jar-rack H2 gives the top footprint, four leg centers and paired jar-site centers used by this approximate proxy.
   */
  jarRack():IAutoMovieModel {
    const m=new ObjectMesh();
    const outer=[[-0.59,-0.29],[0.59,-0.29],[0.59,0.29],[-0.59,0.29]]
      .map(([x,z])=>({x:x!,y:z!}));
    const holes=[-0.29,0.29].map(x=>Array.from({length:16},(_,i)=>({
      x:x+0.16*Math.cos(2*Math.PI*i/16),y:0.16*Math.sin(2*Math.PI*i/16),
    })));
    const cap=triangulateAutoMovieRegion({outer,holes});
    for(let i=0;i<cap.triangles.length;i+=3){
      const corners=cap.triangles.slice(i,i+3).map(j=>cap.points[j]!);
      m.face("top",corners.reverse().map(q=>p(q.x,0.28,q.y)));
    }
    m.face("top",outer.map(q=>p(q.x,0.22,q.y)));
    for(let i=0;i<outer.length;i++){
      const a=outer[i]!,b=outer[(i+1)%outer.length]!;
      m.face("top",[p(a.x,0.22,a.y),p(a.x,0.28,a.y),p(b.x,0.28,b.y),p(b.x,0.22,b.y)]);
    }
    for(const hole of holes){
      m.face("well",[...hole].reverse().map(q=>p(q.x,0.268,q.y)));
      for(let i=0;i<hole.length;i++){
        const a=hole[i]!,b=hole[(i+1)%hole.length]!;
        m.face("top",[p(a.x,0.268,a.y),p(b.x,0.268,b.y),p(b.x,0.28,b.y),p(a.x,0.28,a.y)]);
      }
    }
    for(const x of [-0.52,0.52]) for(const z of [-0.22,0.22])
      woodBox(m,"leg",x,0,z,0.07,0.22,0.07);
    return m.model("portable.jar-rack","항아리 두 자리 받침대");
  }

  /**
   * @evidence models/portable.md#carrying-yoke A 1.16 m X-axis bar carries two hanging YZ rings at X ±0.50 m.
   * @evidence principles/core/source-units.md#source-scope-preservation The yoke remains a laid-down rigid prototype without load or carrying behavior.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate beam and hook parts preserve the two visible holes below the bar.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The carrying-yoke H2 locates its straight bar and two ring centers, enough for this fixed silhouette.
   */
  carryingYoke():IAutoMovieModel {
    const m=new ObjectMesh();box(m,"beam",0,-0.025,0,1.16,0.05,0.05);
    for(const x of [-0.50,0.50])m.loop("hook",x,-0.085,0,0.05,0.01,"yz",16);
    return m.model("portable.carrying-yoke","양손 운반 멜대");
  }

  /**
   * @evidence models/portable.md#handcart A raised deck, X axle, two solid wheels, two upright supports and two backward sloping handles form the open cart outline.
   * @evidence principles/core/source-units.md#source-scope-preservation The wheels are fixed mesh parts and no rolling interface or service-yard position is chosen.
   * @evidence principles/core/source-units.md#source-substantive-completion All five named parts exist; the axle center is Y=0.23 m and the deck starts at Y=0.43 m.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The handcart H2 provides the deck, axle, wheel and handle sites used for this approximate support silhouette.
   */
  handcart():IAutoMovieModel {
    const m=new ObjectMesh();
    woodBox(m,"deck",0,0.43,-0.025,0.60,0.06,1.25);
    m.cylinder("axle",p(-0.34,0.23,0.10),p(0.34,0.23,0.10),0.018,16,"x");
    for(const x of [-0.34,0.34]){
      m.cylinder("wheel",p(x-0.04,0.23,0.10),p(x+0.04,0.23,0.10),0.23,16,"x");
      woodBox(m,"support",x<0?-0.24:0.24,0.248,0.10,0.04,0.182,0.04);
    }
    for(const x of [-0.24,0.24])
      m.rod("handle",p(x,0.45,-0.65),p(x,0.70,-1.20),0.02,8);
    return m.model("portable.handcart","작은 손수레");
  }

  /**
   * @evidence models/portable.md#bucket An open tapered body supports a twelve-segment half-ellipse handle from one rim side to the other.
   * @evidence principles/core/source-units.md#source-scope-preservation This fixed empty bucket has no water surface or carrying motion.
   * @evidence principles/core/source-units.md#source-substantive-completion Vessel and handle are separate mesh parts, with the handle crest near Y=0.44 m above the open mouth.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bucket H2 gives the widening vessel and twelve-point handle route consumed by this rough proxy.
   */
  bucket():IAutoMovieModel {
    const m=new ObjectMesh();
    m.vessel("body",0,0,[[0,0.11],[0.28,0.15]],
      [[0.28,0.135],[0.02,0.095]],16);
    // The reviewed fixed carry arc remains open above the vessel mouth.
    for(let i=0;i<12;i++){
      const a=Math.PI*i/12,b=Math.PI*(i+1)/12;
      m.rod("handle",p(0.1475*Math.cos(a),0.27+0.17*Math.sin(a),0),
        p(0.1475*Math.cos(b),0.27+0.17*Math.sin(b),0),0.01,8);
    }
    return m.model("portable.bucket","손잡이 있는 물동이");
  }

  /**
   * @evidence models/portable.md#planter A wide open pot surrounds a lower conical soil mass, keeping pot and soil as separate parts.
   * @evidence principles/core/source-units.md#source-scope-preservation No plant is baked into this planter; later instances choose any grass-tuft placement.
   * @evidence principles/core/source-units.md#source-substantive-completion The 16-sector pot reaches Y=0.36 m while the soil top stops at Y=0.27 m.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The planter H2 fixes the broad rim and inset soil level used by this static form.
   */
  planter():IAutoMovieModel {
    const m=new ObjectMesh();
    m.vessel("pot",0,0,[[0,0.14],[0.36,0.21]],
      [[0.36,0.19],[0.03,0.12]],16);
    m.frustum("soil",0,0,0.03,0.27,0.12,0.165,16);
    return m.model("portable.planter","낮은 화분");
  }

  /**
   * @evidence models/portable.md#votive-plaque A narrow blank upright slab rises from a wider 0.04 m base plate.
   * @evidence principles/core/source-units.md#source-scope-preservation No carved inscription or donor identity is added to this portable plaque.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate base and slab meshes reach Y=0.42 m and expose a real thickness in side view.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The votive-plaque H2 specifies the plain slab and its supporting base used by these two boxes.
   */
  votivePlaque():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"base",0,0,0,0.36,0.04,0.14);
    box(m,"slab",0,0.04,0,0.32,0.38,0.035);
    return m.model("portable.votive-plaque","무문양 봉헌판");
  }

  /**
   * @evidence models/portable.md#offering-tray Four narrow rim bars surround a 0.52 by 0.34 m floor with an open center.
   * @evidence principles/core/source-units.md#source-scope-preservation This tray contains no bowls and chooses no altar or table placement.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor and rim parts form a shallow rectangular outline up to Y=0.055 m.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The offering-tray H2 fixes the floor and four rim positions followed by the box calls.
   */
  offeringTray():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"floor",0,0,0,0.52,0.018,0.34);
    const solids=[
      {min:p(-0.26,0.018,-0.17),max:p(0.26,0.055,-0.155)},
      {min:p(-0.26,0.018,0.155),max:p(0.26,0.055,0.17)},
      {min:p(-0.26,0.018,-0.155),max:p(-0.245,0.055,0.155)},
      {min:p(0.245,0.018,-0.155),max:p(0.26,0.055,0.155)},
    ];
    return reviewedModel("portable.offering-tray","낮은 봉헌 쟁반",[
      ["floor",modelMesh(m,"floor")],["rim",TempleRectilinearUnion.mesh("rim",solids)],
    ]);
  }

  /**
   * @evidence models/portable.md#textile Two thin cloth plates and front/back fold bars form either reviewed width/depth/thickness variant.
   * @evidence principles/core/source-units.md#source-scope-preservation The builder keeps a folded rigid cloth proxy and adds neither wrinkles nor placement.
   * @evidence principles/core/source-units.md#source-substantive-completion The upper and lower layers leave a middle gap, joined at two Z edges by the fold part geometry.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The textile H2 sets both dimensions and the two-layer/fold arrangement implemented by these four boxes.
   */
  textile(kind:"standard"|"small"):IAutoMovieModel {
    const w=kind==="standard"?0.55:0.42;
    const d=kind==="standard"?0.40:0.36,t=kind==="standard"?0.045:0.03;
    return reviewedModel(`portable.textile.${kind}`,`접은 직물 ${kind}`,[
      ["cloth",TempleRectilinearUnion.mesh("cloth",[
        {min:p(-w/2,0,-d/2),max:p(w/2,t/4,d/2)},
        {min:p(-w/2,3*t/4,-d/2),max:p(w/2,t,d/2)},
        {min:p(-w/2,t/4,-d/2),max:p(w/2,3*t/4,-d/2+0.015)},
        {min:p(-w/2,t/4,d/2-0.015),max:p(w/2,3*t/4,d/2)},
      ])],
    ]);
  }

  /**
   * @evidence models/portable.md#stylus A slim X-axis rod ends in eight triangular faces converging to a point at X=0.11 m.
   * @evidence principles/core/source-units.md#source-scope-preservation The stylus emits no letters or marks and leaves writing-tablet contact to instances.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate shaft and tip surfaces distinguish the pointed end from the round 0.20 m body.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The stylus H2 provides the rod and conical tip lengths/radii used by this rough tool mesh.
   */
  stylus():IAutoMovieModel {
    const m=new ObjectMesh();
    m.cylinder("shaft",p(-0.11,0,0),p(0.09,0,0),0.006,8,"x");
    for(let i=0;i<8;i++){
      const a=2*Math.PI*i/8,b=2*Math.PI*(i+1)/8;
      m.face("tip",[p(0.09,0.006*Math.cos(a),0.006*Math.sin(a)),
        p(0.09,0.006*Math.cos(b),0.006*Math.sin(b)),p(0.11,0,0)]);
    }
    return m.model("portable.stylus","필기용 첨필");
  }

  /**
   * @evidence models/portable.md#writing-tablet Raised edge strips frame a lower blank writing-face panel on a thin rectangular backing.
   * @evidence principles/core/source-units.md#source-scope-preservation This tablet chooses no text, scribe action or desk position.
   * @evidence principles/core/source-units.md#source-substantive-completion Frame and writing-face are distinct mesh parts within the 0.28 by 0.22 m footprint.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The writing-tablet H2 supplies the outer dimensions, rim width and inset blank center used by these boxes.
   */
  writingTablet():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"writing-face",0,0.013,0,0.244,0.001,0.184);
    return reviewedModel("portable.writing-tablet","글자 없는 필기판",[
      ["frame",TempleRectilinearUnion.mesh("frame",[
        {min:p(-0.14,0,-0.11),max:p(0.14,0.013,0.11)},
        {min:p(-0.14,0.013,-0.11),max:p(-0.122,0.025,0.11)},
        {min:p(0.122,0.013,-0.11),max:p(0.14,0.025,0.11)},
        {min:p(-0.122,0.013,-0.11),max:p(0.122,0.025,-0.092)},
        {min:p(-0.122,0.013,0.092),max:p(0.122,0.025,0.11)},
      ])],
      ["writing-face",modelMesh(m,"writing-face")],
    ]);
  }

  /**
   * @evidence models/portable.md#rope-coil Three concentric XZ loops carry one straight narrow tie strip across their upper faces.
   * @evidence principles/core/source-units.md#source-scope-preservation This static cord bundle has no winding simulation or actual attachment to another object.
   * @evidence principles/core/source-units.md#source-substantive-completion Rope and tie remain two material-addressable parts with three visible radial gaps.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The rope-coil H2 sets the three radii and single tie role used by the loop and box calls.
   */
  ropeCoil():IAutoMovieModel {
    const m=new ObjectMesh();
    for(const r of [0.045,0.075,0.105])m.loop("rope",0,0.008,0,r,0.008,"xz",16);
    box(m,"tie",0,0.016,0,0.024,0.008,0.226);
    return m.model("portable.rope-coil","묶는 끈 뭉치");
  }
}
