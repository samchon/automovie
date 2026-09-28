/** Basic portable silhouettes from docs/models/portable.md; no finish or motion. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import { modelBox } from "../geometry/model-source-shapes";

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
 * @evidenceReview models/portable.md #eaa0c33 Matched the thirteen H2 identities to their methods and checked that bench and textile retain their two reviewed size selectors.
 * @evidence principles/core/source-units.md#source-scope-preservation Its methods keep the portable H2 identities separate from furniture, vessels and ritual fit-out, leaving all placements to instances.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The returned IDs remain portable objects in local frames; the class selects no room coordinate, load or use action.
 * @evidence principles/core/source-units.md#source-substantive-completion Each method returns actual named mesh parts for a recognizable rough silhouette instead of an empty asset placeholder.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Every public path reaches ObjectMesh face-producing calls and m.model, with separate identifying parts for its rough silhouette.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The portable H2s already name each object's major form, size family and fixed state used by these approximate meshes.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The thirteen H2s supply the fixed prop identities and size branches used here; this class did not need a new portable-object category.
 * @evidence obligations/design/model-sources.md#design-owned-construction The emitted part names and box/rod/vessel primitives follow the portable H2 identities, with no hand-transcribed bulk mesh arrays.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 box, rod, vessel and loop calls build the named H2 parts from parameters rather than an opaque vertex dump.
 */
export class TemplePortable {
  /**
   * @evidence models/portable.md#bench The standard and short widths share a 0.45 m deep stone seat and two inset piers under an open middle.
   * @evidenceReview models/portable.md#bench #6dad802 The two w branches both place a 0.45-deep seat over two inset pier boxes with the middle left open.
   * @evidence principles/core/source-units.md#source-scope-preservation Only the two H2 bench lengths are selectable; neither waiting-place position nor upholstery is added.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 bench() accepts only standard or short and returns local stone boxes with no seating site or fabric part.
   * @evidence principles/core/source-units.md#source-substantive-completion The seat and paired pier meshes meet at Y=0.40 m and reach a 0.46 m seat top.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Both piers terminate at the seat's Y=0.40 underside; seat and pier remain separate mesh identities.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bench H2 fixes both widths, pier offsets and the open support gap used by this box assembly.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 already fixes both lengths and support spacing, so the two box branches add no third bench proportion.
   */
  bench(kind:"standard"|"short"):IAutoMovieModel {
    const m=new ObjectMesh(),w=kind==="standard"?1.40:1.10;
    box(m,"seat",0,0.40,0,w,0.06,0.45);
    for(const x of [-w/2+0.17,w/2-0.17]) box(m,"pier",x,0,0,0.12,0.40,0.36);
    return m.model(`portable.bench.${kind}`,`석재 벤치 ${kind}`);
  }

  /**
   * @evidence models/portable.md#portable-lamp A short round foot and slender stem hold an open dish at Y=0.23–0.28 m.
   * @evidenceReview models/portable.md#portable-lamp #05edb71 The 16-sector foot and stem end at the base of a vessel dish whose open lip reaches Y=0.28 as in the H2.
   * @evidence principles/core/source-units.md#source-scope-preservation This unlit portable lamp is distinct from the tall fixture and leaves its room use to instances.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 portableLamp returns the low three-part object only; it has no flame mesh or room-use input.
   * @evidence principles/core/source-units.md#source-substantive-completion Foot, stem and dish are three 16-sector mesh parts, with an actual cup opening.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The vessel has inner and outer profiles above the stem, so the returned dish is open rather than a solid cap.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The portable-lamp H2 sets the low foot, stem and shallow cup proportions used by this fixed proxy.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 supplies the short lamp's foot, stem and cup proportions; source adds no standing-lamp height or combustion state.
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
   * @evidenceReview models/portable.md#jar-rack #096ef29 The 1.18 by 0.58 top, four corner legs and loops at X=±0.29 mark the H2's two jar sites at proxy fidelity.
   * @evidence principles/core/source-units.md#source-scope-preservation The rack model contains no jars and chooses no storage-room placement.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 jarRack() produces only top, leg and well-marker geometry; it has no jar mesh or room coordinate.
   * @evidence principles/core/source-units.md#source-substantive-completion Top, leg and well-marker parts make the two-place stand legible at rough blocking scale.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Two loops at X=−0.29 and +0.29 share the well part ID, while the four leg boxes and top remain separate parts beneath them.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The jar-rack H2 gives the top footprint, four leg centers and paired jar-site centers used by this approximate proxy.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 identifies the paired jar centers and stand footprint; the proxy chooses no extra jar capacity or location.
   */
  jarRack():IAutoMovieModel {
    const m=new ObjectMesh();woodBox(m,"top",0,0.22,0,1.18,0.06,0.58);
    for(const x of [-0.52,0.52]) for(const z of [-0.22,0.22])
      woodBox(m,"leg",x,0,z,0.07,0.22,0.07);
    for(const x of [-0.29,0.29])m.loop("well",x,0.28,0,0.16,0.006,"xz",16);
    return m.model("portable.jar-rack","항아리 두 자리 받침대");
  }

  /**
   * @evidence models/portable.md#carrying-yoke A 1.16 m X-axis bar carries two hanging YZ rings at X ±0.50 m.
   * @evidenceReview models/portable.md#carrying-yoke #d5408e8 The beam box spans X=−0.58..0.58 and YZ loops centered at ±0.50 leave the two H2 hanging holes visible.
   * @evidence principles/core/source-units.md#source-scope-preservation The yoke remains a laid-down rigid prototype without load or carrying behavior.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 carryingYoke() returns static beam and hook meshes only, without a weight, grip state or transport path.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate beam and hook parts preserve the two visible holes below the bar.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The beam and hook IDs are distinct, and each m.loop forms an actual opening below the bar rather than a painted ring.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The carrying-yoke H2 locates its straight bar and two ring centers, enough for this fixed silhouette.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2's bar length and paired centers determine the emitted local silhouette; no flexible strap mechanics were invented.
   */
  carryingYoke():IAutoMovieModel {
    const m=new ObjectMesh();box(m,"beam",0,-0.025,0,1.16,0.05,0.05);
    for(const x of [-0.50,0.50])m.loop("hook",x,-0.085,0,0.05,0.01,"yz",16);
    return m.model("portable.carrying-yoke","양손 운반 멜대");
  }

  /**
   * @evidence models/portable.md#handcart A raised deck, X axle, two solid wheels, two upright supports and two backward sloping handles form the open cart outline.
   * @evidenceReview models/portable.md#handcart #5b7c053 The deck starts at Y=0.43, the axle crosses X at Y=0.23, and wheels, uprights and rearward rods keep the H2's open cart outline.
   * @evidence principles/core/source-units.md#source-scope-preservation The wheels are fixed mesh parts and no rolling interface or service-yard position is chosen.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 handcart() returns fixed wheel cylinders and no axle joint or service-yard transform.
   * @evidence principles/core/source-units.md#source-substantive-completion All five named parts exist; the axle center is Y=0.23 m and the deck starts at Y=0.43 m.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f All five part names reach m.model, including two wheel cylinders and two backward sloping handle rods.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The handcart H2 provides the deck, axle, wheel and handle sites used for this approximate support silhouette.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 fixes the support arrangement and handle direction; the coarse cart introduces no invented load or rolling operation.
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
   * @evidenceReview models/portable.md#bucket #67ff1fe The vessel widens to its open rim and twelve joined handle rods trace one high arc between opposite rim sides.
   * @evidence principles/core/source-units.md#source-scope-preservation This fixed empty bucket has no water surface or carrying motion.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 bucket() emits only body and handle meshes; no water disc or animated carry state enters the model.
   * @evidence principles/core/source-units.md#source-substantive-completion Vessel and handle are separate mesh parts, with the handle crest near Y=0.44 m above the open mouth.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The rod arc reaches Y=0.44 over the Y=0.28 vessel mouth, with handle and body retaining separate part IDs.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The bucket H2 gives the widening vessel and twelve-point handle route consumed by this rough proxy.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The widening profile and twelve-segment arc already occur in the bucket H2, leaving no new bucket handle route to design in source.
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
   * @evidenceReview models/portable.md#planter #6c96c4a The pot's outer and inner profiles open at Y=0.36 above a separate conical soil frustum ending at Y=0.27.
   * @evidence principles/core/source-units.md#source-scope-preservation No plant is baked into this planter; later instances choose any grass-tuft placement.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 planter() returns pot and soil only and has no plant prototype or grass placement parameter.
   * @evidence principles/core/source-units.md#source-substantive-completion The 16-sector pot reaches Y=0.36 m while the soil top stops at Y=0.27 m.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f A vessel wall surrounds a distinct lower soil frustum, leaving a visible rim above the fill rather than one solid cone.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The planter H2 fixes the broad rim and inset soil level used by this static form.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The planter H2 already sets the rim and lowered soil interface; construction chose no extra vegetation or pot family.
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
   * @evidenceReview models/portable.md#votive-plaque #24dc4a5 The slab box rises from the 0.04 base to Y=0.42 and is narrower and thinner than its supporting plate.
   * @evidence principles/core/source-units.md#source-scope-preservation No carved inscription or donor identity is added to this portable plaque.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 votivePlaque returns two plain boxes and no text, carving or donor selector.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate base and slab meshes reach Y=0.42 m and expose a real thickness in side view.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The 0.035-deep upright slab is a separate part from its 0.14-deep base, retaining visible side thickness.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The votive-plaque H2 specifies the plain slab and its supporting base used by these two boxes.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 only asks for a blank slab on a base, and the two boxes add no new icon or inscription design.
   */
  votivePlaque():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"base",0,0,0,0.36,0.04,0.14);
    box(m,"slab",0,0.04,0,0.32,0.38,0.035);
    return m.model("portable.votive-plaque","무문양 봉헌판");
  }

  /**
   * @evidence models/portable.md#offering-tray Four narrow rim bars surround a 0.52 by 0.34 m floor with an open center.
   * @evidenceReview models/portable.md#offering-tray #d2d1e22 The floor box spans 0.52 by 0.34 and four raised side boxes frame its interior without a lid.
   * @evidence principles/core/source-units.md#source-scope-preservation This tray contains no bowls and chooses no altar or table placement.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 offeringTray has no contents or placement argument; the return contains floor and rim parts alone.
   * @evidence principles/core/source-units.md#source-substantive-completion Floor and rim parts form a shallow rectangular outline up to Y=0.055 m.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The 0.018 floor and 0.037-high edge bars reach Y=0.055, producing a shallow open tray.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The offering-tray H2 fixes the floor and four rim positions followed by the box calls.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 locates the four rim edges and floor, so the source required no extra carrying handle or vessel insert.
   */
  offeringTray():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"floor",0,0,0,0.52,0.018,0.34);
    for(const z of [-0.1625,0.1625])box(m,"rim",0,0.018,z,0.52,0.037,0.015);
    for(const x of [-0.2525,0.2525])box(m,"rim",x,0.018,0,0.015,0.037,0.31);
    return m.model("portable.offering-tray","낮은 봉헌 쟁반");
  }

  /**
   * @evidence models/portable.md#textile Two thin cloth plates and front/back fold bars form either reviewed width/depth/thickness variant.
   * @evidenceReview models/portable.md#textile #92c08fa The kind branch selects two H2 footprints and thicknesses, then places upper/lower plates and two Z-edge fold bars.
   * @evidence principles/core/source-units.md#source-scope-preservation The builder keeps a folded rigid cloth proxy and adds neither wrinkles nor placement.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 textile() returns fixed cloth boxes only; it has no fold animation, surface wrinkles or room transform.
   * @evidence principles/core/source-units.md#source-substantive-completion The upper and lower layers leave a middle gap, joined at two Z edges by the fold part geometry.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Two thin plates occupy the lower and upper t quarters, while narrow edge boxes bridge their open central gap.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The textile H2 sets both dimensions and the two-layer/fold arrangement implemented by these four boxes.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The two sizes and two-layer fold arrangement are already in the textile H2; no new draping state appears in source.
   */
  textile(kind:"standard"|"small"):IAutoMovieModel {
    const m=new ObjectMesh(),w=kind==="standard"?0.55:0.42;
    const d=kind==="standard"?0.40:0.36,t=kind==="standard"?0.045:0.03;
    box(m,"cloth",0,0,0,w,t/4,d);
    box(m,"cloth",0,3*t/4,0,w,t/4,d);
    for(const z of [-d/2+0.0075,d/2-0.0075])
      box(m,"cloth",0,t/4,z,w,t/2,0.015);
    return m.model(`portable.textile.${kind}`,`접은 직물 ${kind}`);
  }

  /**
   * @evidence models/portable.md#stylus A slim X-axis rod ends in eight triangular faces converging to a point at X=0.11 m.
   * @evidenceReview models/portable.md#stylus #7f2479d The shaft cylinder stops at X=0.09 and eight tip triangles converge at X=0.11, preserving the H2's pointed tool.
   * @evidence principles/core/source-units.md#source-scope-preservation The stylus emits no letters or marks and leaves writing-tablet contact to instances.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 stylus() builds a fixed rod and point with no writing trace or tablet-placement operation.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate shaft and tip surfaces distinguish the pointed end from the round 0.20 m body.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Distinct shaft and tip part IDs separate the 0.20-long cylinder from its converging 0.02-long end.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The stylus H2 provides the rod and conical tip lengths/radii used by this rough tool mesh.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The stylus H2 fixes its rod and point dimensions, so the eight-face approximation adds no new writing-tool type.
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
   * @evidenceReview models/portable.md#writing-tablet #08ff79b The backing box, four raised frame strips and inset writing-face form the H2's blank rectangular writing area.
   * @evidence principles/core/source-units.md#source-scope-preservation This tablet chooses no text, scribe action or desk position.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 writingTablet returns frame and face geometry but no glyph, stylus action or desk coordinate.
   * @evidence principles/core/source-units.md#source-substantive-completion Frame and writing-face are distinct mesh parts within the 0.28 by 0.22 m footprint.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f A separate writing-face box lies inside the 0.28 by 0.22 backing and remains addressable apart from the rim.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The writing-tablet H2 supplies the outer dimensions, rim width and inset blank center used by these boxes.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The tablet H2 already fixes its rim and central recess; the builder did not choose any written content or further frame feature.
   */
  writingTablet():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"frame",0,0,0,0.28,0.013,0.22);
    for(const x of [-0.131,0.131])box(m,"frame",x,0.013,0,0.018,0.012,0.22);
    for(const z of [-0.101,0.101])box(m,"frame",0,0.013,z,0.244,0.012,0.018);
    box(m,"writing-face",0,0.013,0,0.244,0.001,0.184);
    return m.model("portable.writing-tablet","글자 없는 필기판");
  }

  /**
   * @evidence models/portable.md#rope-coil Three concentric XZ loops carry one straight narrow tie strip across their upper faces.
   * @evidenceReview models/portable.md#rope-coil #dde663d The radius list makes three visible XZ rings and a thin box crosses them as the H2's single tie.
   * @evidence principles/core/source-units.md#source-scope-preservation This static cord bundle has no winding simulation or actual attachment to another object.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 ropeCoil takes no attachment target or time input and leaves its three turns static.
   * @evidence principles/core/source-units.md#source-substantive-completion Rope and tie remain two material-addressable parts with three visible radial gaps.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Three loop radii stay in rope while the crossing strip is a separate tie part, leaving radial openings between turns.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The rope-coil H2 sets the three radii and single tie role used by the loop and box calls.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 states three coil radii and one binding strip; no rope dynamics or second fastening method was chosen.
   */
  ropeCoil():IAutoMovieModel {
    const m=new ObjectMesh();
    for(const r of [0.045,0.075,0.105])m.loop("rope",0,0.008,0,r,0.008,"xz",16);
    box(m,"tie",0,0.016,0,0.024,0.008,0.226);
    return m.model("portable.rope-coil","묶는 끈 뭉치");
  }
}
