/** Recognizable fixed furniture and ritual fittings from docs/models/fixtures.md.
 * These are static metre prototypes; instances own placement and materials own finish. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import { modelBox } from "../geometry/model-source-shapes";

const p=(x:number,y:number,z:number)=>({x,y,z});
const box=(m:ObjectMesh,id:string,x:number,y:number,z:number,w:number,h:number,d:number)=>
  m.box(id,x,y,z,w,h,d);
const woodBox=(m:ObjectMesh,id:string,x:number,y:number,z:number,w:number,h:number,d:number)=>{
  const axis=w>=h&&w>=d?p(1,0,0):h>=d?p(0,1,0):p(0,0,1);
  const min=p(x-w/2,y,z-d/2),max=p(x+w/2,y+h,z+d/2);
  modelBox(m,id,min,max,{origin:min,direction:axis});
};
const disc=(m:ObjectMesh,id:string,y0:number,y1:number,r:number,n=16)=>
  m.frustum(id,0,0,y0,y1,r,r,n);

/**
 * Fixed fit-out prototypes with placement and finish left to later branches.
 * @evidence models/fixtures.md This class exposes the ten fixture H2s as separate rough part-based meshes.
 * @evidenceReview models/fixtures.md #7adf628 Matched each of the ten H2 names to a public builder and checked that fountain, furniture and fittings retain distinct proxy part IDs.
 * @evidence principles/core/source-units.md#source-scope-preservation Its public methods make only reviewed fountain, altar, niche, lamp and furniture families, without choosing room transforms.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The ten methods return local objects only; none supplies a room transform or chooses the number of furnishings.
 * @evidence principles/core/source-units.md#source-substantive-completion Each method returns a stable model ID and actual named mesh parts, including the two shelf and desk variants.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Each method reaches m.model with actual mesh calls; displayShelf and desk vary by their two explicit kind values.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The fixture H2s name their characteristic parts, broad extents and fixed states; these approximate proxy builders needed no additional object identity.
 * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The ten design H2s already identify these fixed objects and their recognizable parts; the coarse mesh helpers add no eleventh fitting identity.
 * @evidence obligations/design/model-sources.md#design-owned-construction The box, frustum, vessel and loop calls use each H2's recognizable sections and part names as the construction basis.
 * @evidenceReview obligations/design/model-sources.md#design-owned-construction #535df68 ObjectMesh calls emit separate stone, wood or metal-facing parts under the H2 names rather than substituting a texture-only object.
 */
export class TempleFixtures {
  /**
   * @evidence models/fixtures.md#fountain Seven emitted parts separate the circular step, hollow rim, basin floor, water disc, ripple, nozzle and single jet.
   * @evidenceReview models/fixtures.md#fountain #36a0541 The step disc, vessel rim, inner disc, water plane, loop, nozzle and tapered jet remain seven named meshes around one center.
   * @evidence principles/core/source-units.md#source-scope-preservation This fixed 2.30 m footprint makes no flowing-water state or courtyard position.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 fountain() takes no site coordinate or time input; its 1.15 radius step is a local static basin.
   * @evidence principles/core/source-units.md#source-substantive-completion The 48-sector rings and vessels return a low basin with a jet reaching Y=1.09 m, rather than one solid cylinder.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The rim has an inner contour, the water is a separate thin disc, and the 48-sector frustum reaches Y=1.09 as a visible jet.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The fountain H2 supplies the low rim, water level, centered nozzle and one upward jet used by this rough stationary proxy.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2's seven fixed fountain roles match these mesh calls; the source does not introduce a second spout or a flow-state rule.
   */
  fountain():IAutoMovieModel {
    const m=new ObjectMesh();
    disc(m,"step",0,0.08,1.15,48);
    m.vessel("rim",0,0,[[0.08,1],[0.52,1]],[[0.52,0.82],[0.12,0.82]],48);
    disc(m,"basin-inner",0.115,0.12,0.82,48);
    disc(m,"water",0.435,0.44,0.82,48);
    m.loop("ripple",0,0.446,0,0.11,0.004,"xz",48);
    disc(m,"nozzle",0.12,0.49,0.08,48);
    m.frustum("jet",0,0,0.49,1.09,0.025,0.012,48);
    return m.model("fixture.fountain","중정 분수");
  }

  /**
   * @evidence models/fixtures.md#altar A 2.40 m step carries two side supports and a 1.40 m top slab, leaving the middle under the slab open.
   * @evidenceReview models/fixtures.md#altar #bbf1f10 The step box is 2.40 long, support boxes sit at X=±0.52, and the top box spans 1.40 above their open center.
   * @evidence principles/core/source-units.md#source-scope-preservation This builder makes only the altar/step prototype; the northern sanctuary placement is not chosen here.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 altar() emits one local stone assembly; no call assigns it a sanctuary coordinate or fills it with offerings.
   * @evidence principles/core/source-units.md#source-substantive-completion Three named part meshes establish the step, paired supports and top at Y=1.10 m.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The three part keys carry a continuous 0.15 step, two supports up to 0.96 and a slab whose top reaches 1.10.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The altar H2 fixes the step and two-support arrangement and top height needed for this blocking shape.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 already locates the paired supports and raised slab; the builder needed no new altar pedestal arrangement.
   */
  altar():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"step",0,0,0,2.4,0.15,1.6);
    box(m,"top",0,0.96,-0.20,1.40,0.14,0.75);
    for(const x of [-0.52,0.52]) box(m,"support",x,0.15,-0.20,0.28,0.81,0.67);
    return m.model("fixture.altar","석조 제단");
  }

  /**
   * @evidence models/fixtures.md#niche Side blocks and upper/lower frame bars surround a shallower back slab beneath a wider cap.
   * @evidenceReview models/fixtures.md#niche #7748b9c The two body sides and two recess-frame bars stand ahead of the rear slab, while the cap projects beyond the sides.
   * @evidence principles/core/source-units.md#source-scope-preservation This unmarked niche has no statue or wall hole; only the freestanding plinth/body/recess-frame/recess/cap parts are emitted.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 niche() returns five fixed parts and has neither a wall-cut input nor a statue mesh path.
   * @evidence principles/core/source-units.md#source-substantive-completion The rear slab is set back from the front bars, so the central bay has actual depth in the mesh.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The recess box starts behind the front framing at Z=0.09, leaving an observable inset bay between the side blocks.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The niche H2 fixes its five part roles and recessed bay, which these box sections realize at approximate blocking fidelity.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 names the five niche layers and inset; the boxes keep that hierarchy without selecting an icon or additional ornament.
   */
  niche():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"plinth",0,0,0.20,1.20,0.60,0.40);
    for(const x of [-0.425,0.425]) box(m,"body",x,0.60,0.20,0.25,1.20,0.36);
    box(m,"recess-frame",0,0.60,0.20,0.60,0.15,0.36);
    box(m,"recess-frame",0,1.55,0.20,0.60,0.25,0.36);
    box(m,"recess",0,0.75,0.09,0.60,0.80,0.14);
    box(m,"cap",0,1.80,0.21,1.24,0.14,0.42);
    return m.model("fixture.niche","무문양 감실");
  }

  /**
   * @evidence models/fixtures.md#lampstand A tapered foot, narrow 1.02 m stem, two small knops and open vessel dish produce the unlit standing-lamp outline.
   * @evidenceReview models/fixtures.md#lampstand #59f6389 The frustum foot, thin stem, knops at two Y levels and vessel dish form the H2's unlit floor lamp outline.
   * @evidence principles/core/source-units.md#source-scope-preservation The builder emits the fixed lampstand without flame, light source or sanctuary placement.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 lampstand() has no light or location parameter and emits geometry only, with the dish left empty.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate foot/stem/knop/dish meshes reach the reviewed 1.15 m rim height.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The four part keys remain separate and m.vessel brings the dish lip to Y=1.15 rather than ending at the stem.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The lampstand H2 gives the foot, stem, two knops and cup heights used by this static proxy.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The two knop levels and dish height are specified by the lampstand H2; no flame geometry was improvised in source.
   */
  lampstand():IAutoMovieModel {
    const m=new ObjectMesh();
    m.frustum("foot",0,0,0,0.06,0.13,0.08,16); disc(m,"foot",0.06,0.08,0.08);
    disc(m,"stem",0.08,1.10,0.015);
    for(const y of [0.335,0.785]) disc(m,"knop",y,y+0.03,0.03);
    m.vessel("dish",0,0,[[1.10,0.11],[1.15,0.11]],
      [[1.15,0.10],[1.106,0.10]],16);
    return m.model("fixture.lampstand","금속 등잔대");
  }

  /**
   * @evidence models/fixtures.md#offering-table A 2.20 m long top rests on two thin stone trestles at Z ±0.75 m, leaving the center underneath open.
   * @evidenceReview models/fixtures.md#offering-table #51d02ef The top's Z length is 2.20 and the two trestle boxes stand near its ends, retaining an open middle as the H2 requires.
   * @evidence principles/core/source-units.md#source-scope-preservation It supplies the empty table prototype alone; offerings and its position in the room remain instance decisions.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 offeringTable() makes only top and trestles; no offering object or room coordinate enters its return value.
   * @evidence principles/core/source-units.md#source-substantive-completion The top and trestle parts meet at Y=0.72 m and form the H2's low, long blocking silhouette.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The trestles rise to the top's lower Y=0.72 plane and the top remains a separately addressed slab.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The offering-table H2 locates its slab and two end supports, sufficient for this rough fixed mesh.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The table H2 supplies its long slab and support spacing; these three boxes add no new ritual surface or load state.
   */
  offeringTable():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"top",0,0.72,0,0.75,0.10,2.20);
    for(const z of [-0.75,0.75]) box(m,"trestle",0,0,z,0.60,0.72,0.12);
    return m.model("fixture.offering-table","봉헌 탁자");
  }

  /**
   * @evidence models/fixtures.md#display-shelf The offering branch spans 1.60 m with 1.40 m-high, 0.40 m-deep sides and four boards; administration spans 1.00 m with 1.20 m-high, 0.30 m-deep sides and three boards.
   * @evidenceReview models/fixtures.md#display-shelf #3785543 The kind branch selects the H2's two width/depth/height sets and the four-versus-three board Y lists.
   * @evidence principles/core/source-units.md#source-scope-preservation Only the two reviewed shelf identities are available, with no contents or wall-side placement embedded.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 displayShelf returns offering or administration ID from a local kind and contains no books, objects or wall coordinate.
   * @evidence principles/core/source-units.md#source-substantive-completion Side and board parts create open front and back bays at the branch-specific heights.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Two side woodBox calls and the selected board loop leave shelves open at front and rear in both variants.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The display-shelf H2 supplies both widths, depths, heights and board counts used by these coarse shelves.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c Both variant sizes and board levels come from the display-shelf H2, so the proxy loop needed no third shelf layout.
   */
  displayShelf(kind:"offering"|"administration"):IAutoMovieModel {
    const m=new ObjectMesh();
    const wide=kind==="offering",w=wide?1.60:1.00,d=wide?0.40:0.30,h=wide?1.40:1.20;
    const half=w/2,side=wide?0.04:0.04;
    for(const x of [-half+side/2,half-side/2]) woodBox(m,"side",x,0,d/2,side,h,d);
    for(const y of wide?[0.10,0.55,1.00,1.37]:[0.10,0.65,1.17])
      woodBox(m,"board",0,y,d/2,w-2*side,0.03,d);
    return m.model(`fixture.display-shelf.${kind}`,`벽 선반 ${kind}`);
  }

  /**
   * @evidence models/fixtures.md#desk Two size branches make a thin top, four legs at inset corners and four low stretcher bars around the open under-space.
   * @evidenceReview models/fixtures.md#desk #3487b13 The writing/reading size branch changes the top, and nested corner loops emit four legs plus four perimeter stretcher bars.
   * @evidence principles/core/source-units.md#source-scope-preservation Writing and reading dimensions are the only desk variants; drawers and room placement are absent.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 desk() accepts only writing or reading and returns an open local table without drawer meshes or a room location.
   * @evidence principles/core/source-units.md#source-substantive-completion Each branch returns top/leg/stretcher parts with a four-legged silhouette rather than a solid desk box.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The nested leg loop and two brace loops reach m.model as separate top, leg and stretcher parts for either branch.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The desk H2 fixes both top sizes, leg inset and low brace arrangement realized by the loops.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 defines the two desk footprints and low four-leg arrangement; the code does not add a hidden drawer or unsupported joinery.
   */
  desk(kind:"writing"|"reading"):IAutoMovieModel {
    const m=new ObjectMesh(),writing=kind==="writing";
    const w=writing?1.10:0.90,d=writing?0.60:0.55,h=writing?0.75:0.72;
    woodBox(m,"top",0,h-0.04,0,w,0.04,d);
    const lx=w/2-0.06,lz=d/2-0.06;
    for(const x of [-lx,lx]) for(const z of [-lz,lz])
      woodBox(m,"leg",x,0,z,0.06,h-0.04,0.06);
    for(const z of [-lz,lz]) woodBox(m,"stretcher",0,0.15,z,2*lx,0.05,0.04);
    for(const x of [-lx,lx]) woodBox(m,"stretcher",x,0.15,0,0.04,0.05,2*lz);
    return m.model(`fixture.desk.${kind}`,`작업 탁자 ${kind}`);
  }

  /**
   * @evidence models/fixtures.md#stool A 0.40 by 0.35 m seat stands on four short legs joined by low stretchers, reaching 0.45 m.
   * @evidenceReview models/fixtures.md#stool #bb390b5 The seat woodBox is 0.40 by 0.35 and reaches Y=0.45, above four legs and their low cross braces.
   * @evidence principles/core/source-units.md#source-scope-preservation The builder keeps this backless seat fixed and leaves desk pairing to instances.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 stool() emits no back panel or desk reference; pairing and placement are not part of its local mesh.
   * @evidence principles/core/source-units.md#source-substantive-completion Seat, leg and stretcher parts give the H2's open under-seat outline.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The four corner leg boxes and four low brace boxes support one thin seat without filling the under-seat void.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The stool H2 already gives the seat, leg centers and brace level used by these boxes.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 fixes the small seat, leg centers and brace height, leaving no new stool back or proportion choice for the builder.
   */
  stool():IAutoMovieModel {
    const m=new ObjectMesh();woodBox(m,"seat",0,0.41,0,0.40,0.04,0.35);
    for(const x of [-0.16,0.16]) for(const z of [-0.135,0.135])
      woodBox(m,"leg",x,0,z,0.04,0.41,0.04);
    for(const z of [-0.135,0.135]) woodBox(m,"stretcher",0,0.12,z,0.32,0.03,0.025);
    for(const x of [-0.16,0.16]) woodBox(m,"stretcher",x,0.12,0,0.025,0.03,0.27);
    return m.model("fixture.stool","스툴");
  }

  /**
   * @evidence models/fixtures.md#scroll-shelf Two side frames and six horizontal boards bound five levels, with three dividers per level making four open bays across.
   * @evidenceReview models/fixtures.md#scroll-shelf #4431b7e The two X=±0.88 frames, six board Y entries and three-by-five divider loop form the H2's twenty open compartments.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the 1.80 m record-room shelf only; scroll placement and counts are not emitted.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 scrollShelf returns one shelf prototype and does not construct scroll contents or a records-room coordinate.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate frame, board and divider parts make an actual 4 by 5 cell silhouette without a back panel.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The frame, board and divider part IDs survive m.model, and the nested spaces remain open through the absent back.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The scroll-shelf H2 sets the 4 by 5 partition and board/divider intervals used by the nested loops.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The H2 specifies the five vertical tiers and four cross bays, so the divider loop introduces no unowned storage grid.
   */
  scrollShelf():IAutoMovieModel {
    const m=new ObjectMesh();
    for(const x of [-0.88,0.88]) woodBox(m,"frame",x,0,0.20,0.04,1.70,0.40);
    for(const [y,t] of [[0,0.04],[0.34,0.03],[0.67,0.03],[1,0.03],[1.33,0.03],[1.66,0.04]])
      woodBox(m,"board",0,y,0.20,1.72,t,0.40);
    for(const x of [-0.4375,0,0.4375])
      for(const [low,high] of [[0.04,0.34],[0.37,0.67],[0.70,1],[1.03,1.33],[1.36,1.66]])
        woodBox(m,"divider",x,low,0.20,0.03,high-low,0.40);
    return m.model("fixture.scroll-shelf","기록 선반");
  }

  /**
   * @evidence models/fixtures.md#chest A body box and slightly wider raised lid retain a visible seam, with a front hasp and metal strip proxies on the rear and corners.
   * @evidenceReview models/fixtures.md#chest #b7614a2 The lid begins above the 0.44-high body, and front hasp and rear/corner straps keep the H2's closure readable at proxy fidelity.
   * @evidence principles/core/source-units.md#source-scope-preservation It returns the H2's closed fixed chest outline; no opening animation or stored contents are added.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 chest() returns fixed wood and metal geometry with no hinge state, interior inventory or placement input.
   * @evidence principles/core/source-units.md#source-substantive-completion Body, lid, hasp and strap are four separate named mesh parts, so the closure reads independently from the wood.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f m.model retains four part IDs, with woodBox used for body/lid and separate box calls for the visible hardware.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The chest H2 gives the body/lid seam and front/rear hardware positions used for this approximate fixed proxy.
   * @evidenceExcludeReview upstream/design/model-sources.md#design-revision-from-model-source-work #2f8f56c The chest H2 already assigns its seam and hardware faces; the rough proxy adds no new contents or movable lid decision.
   */
  chest():IAutoMovieModel {
    const m=new ObjectMesh();
    woodBox(m,"body",0,0,0,0.80,0.44,0.50);
    woodBox(m,"lid",0,0.445,0,0.82,0.06,0.52);
    box(m,"hasp",0,0.35,0.255,0.08,0.155,0.01);
    for(const x of [-0.27,0.27]) box(m,"strap",x,0.36,-0.2575,0.04,0.145,0.005);
    for(const x of [-0.40,0.40]) for(const z of [-0.25,0.25])
      box(m,"strap",x,0,z,0.04,0.44,0.005);
    return m.model("fixture.chest","보관 궤");
  }
}
