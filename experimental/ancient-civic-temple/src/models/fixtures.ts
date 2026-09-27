/** Recognizable fixed furniture and ritual fittings from docs/models/fixtures.md.
 * These are static metre prototypes; instances own placement and materials own finish. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

const box=(m:ObjectMesh,id:string,x:number,y:number,z:number,w:number,h:number,d:number)=>
  m.box(id,x,y,z,w,h,d);
const disc=(m:ObjectMesh,id:string,y0:number,y1:number,r:number,n=16)=>
  m.frustum(id,0,0,y0,y1,r,r,n);

/**
 * Fixed fit-out prototypes with placement and finish left to later branches.
 * @evidence models/fixtures.md This class exposes the ten fixture H2s as separate rough part-based meshes.
 * @evidence principles/core/source-units.md#source-scope-preservation Its public methods make only reviewed fountain, altar, niche, lamp and furniture families, without choosing room transforms.
 * @evidence principles/core/source-units.md#source-substantive-completion Each method returns a stable model ID and actual named mesh parts, including the two shelf and desk variants.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The fixture H2s name their characteristic parts, broad extents and fixed states; these approximate proxy builders needed no additional object identity.
 * @evidence obligations/design/model-sources.md#design-owned-construction The box, frustum, vessel and loop calls use each H2's recognizable sections and part names as the construction basis.
 */
export class TempleFixtures {
  /**
   * @evidence models/fixtures.md#fountain Seven emitted parts separate the circular step, hollow rim, basin floor, water disc, ripple, nozzle and single jet.
   * @evidence principles/core/source-units.md#source-scope-preservation This fixed 2.30 m footprint makes no flowing-water state or courtyard position.
   * @evidence principles/core/source-units.md#source-substantive-completion The 48-sector rings and vessels return a low basin with a jet reaching Y=1.09 m, rather than one solid cylinder.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The fountain H2 supplies the low rim, water level, centered nozzle and one upward jet used by this rough stationary proxy.
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
   * @evidence principles/core/source-units.md#source-scope-preservation This builder makes only the altar/step prototype; the northern sanctuary placement is not chosen here.
   * @evidence principles/core/source-units.md#source-substantive-completion Three named part meshes establish the step, paired supports and top at Y=1.10 m.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The altar H2 fixes the step and two-support arrangement and top height needed for this blocking shape.
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
   * @evidence principles/core/source-units.md#source-scope-preservation This unmarked niche has no statue or wall hole; only the freestanding plinth/body/recess-frame/recess/cap parts are emitted.
   * @evidence principles/core/source-units.md#source-substantive-completion The rear slab is set back from the front bars, so the central bay has actual depth in the mesh.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The niche H2 fixes its five part roles and recessed bay, which these box sections realize at approximate blocking fidelity.
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
   * @evidence principles/core/source-units.md#source-scope-preservation The builder emits the fixed lampstand without flame, light source or sanctuary placement.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate foot/stem/knop/dish meshes reach the reviewed 1.15 m rim height.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The lampstand H2 gives the foot, stem, two knops and cup heights used by this static proxy.
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
   * @evidence principles/core/source-units.md#source-scope-preservation It supplies the empty table prototype alone; offerings and its position in the room remain instance decisions.
   * @evidence principles/core/source-units.md#source-substantive-completion The top and trestle parts meet at Y=0.72 m and form the H2's low, long blocking silhouette.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The offering-table H2 locates its slab and two end supports, sufficient for this rough fixed mesh.
   */
  offeringTable():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"top",0,0.72,0,0.75,0.10,2.20);
    for(const z of [-0.75,0.75]) box(m,"trestle",0,0,z,0.60,0.72,0.12);
    return m.model("fixture.offering-table","봉헌 탁자");
  }

  /**
   * @evidence models/fixtures.md#display-shelf The offering branch uses 1.60 m sides and four boards; administration uses 1.00 m sides and three boards.
   * @evidence principles/core/source-units.md#source-scope-preservation Only the two reviewed shelf identities are available, with no contents or wall-side placement embedded.
   * @evidence principles/core/source-units.md#source-substantive-completion Side and board parts create open front and back bays at the branch-specific heights.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The display-shelf H2 supplies both widths, depths, heights and board counts used by these coarse shelves.
   */
  displayShelf(kind:"offering"|"administration"):IAutoMovieModel {
    const m=new ObjectMesh();
    const wide=kind==="offering",w=wide?1.60:1.00,d=wide?0.40:0.30,h=wide?1.40:1.20;
    const half=w/2,side=wide?0.04:0.04;
    for(const x of [-half+side/2,half-side/2]) box(m,"side",x,0,d/2,side,h,d);
    for(const y of wide?[0.10,0.55,1.00,1.37]:[0.10,0.65,1.17])
      box(m,"board",0,y,d/2,w-2*side,0.03,d);
    return m.model(`fixture.display-shelf.${kind}`,`벽 선반 ${kind}`);
  }

  /**
   * @evidence models/fixtures.md#desk Two size branches make a thin top, four legs at inset corners and four low stretcher bars around the open under-space.
   * @evidence principles/core/source-units.md#source-scope-preservation Writing and reading dimensions are the only desk variants; drawers and room placement are absent.
   * @evidence principles/core/source-units.md#source-substantive-completion Each branch returns top/leg/stretcher parts with a four-legged silhouette rather than a solid desk box.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The desk H2 fixes both top sizes, leg inset and low brace arrangement realized by the loops.
   */
  desk(kind:"writing"|"reading"):IAutoMovieModel {
    const m=new ObjectMesh(),writing=kind==="writing";
    const w=writing?1.10:0.90,d=writing?0.60:0.55,h=writing?0.75:0.72;
    box(m,"top",0,h-0.04,0,w,0.04,d);
    const lx=w/2-0.06,lz=d/2-0.06;
    for(const x of [-lx,lx]) for(const z of [-lz,lz])
      box(m,"leg",x,0,z,0.06,h-0.04,0.06);
    for(const z of [-lz,lz]) box(m,"stretcher",0,0.15,z,2*lx,0.05,0.04);
    for(const x of [-lx,lx]) box(m,"stretcher",x,0.15,0,0.04,0.05,2*lz);
    return m.model(`fixture.desk.${kind}`,`작업 탁자 ${kind}`);
  }

  /**
   * @evidence models/fixtures.md#stool A 0.40 by 0.35 m seat stands on four short legs joined by low stretchers, reaching 0.45 m.
   * @evidence principles/core/source-units.md#source-scope-preservation The builder keeps this backless seat fixed and leaves desk pairing to instances.
   * @evidence principles/core/source-units.md#source-substantive-completion Seat, leg and stretcher parts give the H2's open under-seat outline.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The stool H2 already gives the seat, leg centers and brace level used by these boxes.
   */
  stool():IAutoMovieModel {
    const m=new ObjectMesh();box(m,"seat",0,0.41,0,0.40,0.04,0.35);
    for(const x of [-0.16,0.16]) for(const z of [-0.135,0.135])
      box(m,"leg",x,0,z,0.04,0.41,0.04);
    for(const z of [-0.135,0.135]) box(m,"stretcher",0,0.12,z,0.32,0.03,0.025);
    for(const x of [-0.16,0.16]) box(m,"stretcher",x,0.12,0,0.025,0.03,0.27);
    return m.model("fixture.stool","스툴");
  }

  /**
   * @evidence models/fixtures.md#scroll-shelf Two side frames and six horizontal boards bound five levels, with three dividers per level making four open bays across.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the 1.80 m record-room shelf only; scroll placement and counts are not emitted.
   * @evidence principles/core/source-units.md#source-substantive-completion Separate frame, board and divider parts make an actual 4 by 5 cell silhouette without a back panel.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The scroll-shelf H2 sets the 4 by 5 partition and board/divider intervals used by the nested loops.
   */
  scrollShelf():IAutoMovieModel {
    const m=new ObjectMesh();
    for(const x of [-0.88,0.88]) box(m,"frame",x,0,0.20,0.04,1.70,0.40);
    for(const [y,t] of [[0,0.04],[0.34,0.03],[0.67,0.03],[1,0.03],[1.33,0.03],[1.66,0.04]])
      box(m,"board",0,y,0.20,1.72,t,0.40);
    for(const x of [-0.4375,0,0.4375])
      for(const [low,high] of [[0.04,0.34],[0.37,0.67],[0.70,1],[1.03,1.33],[1.36,1.66]])
        box(m,"divider",x,low,0.20,0.03,high-low,0.40);
    return m.model("fixture.scroll-shelf","기록 선반");
  }

  /**
   * @evidence models/fixtures.md#chest A body box and slightly wider raised lid retain a visible seam, with a front hasp and metal strip proxies on the rear and corners.
   * @evidence principles/core/source-units.md#source-scope-preservation It returns the H2's closed fixed chest outline; no opening animation or stored contents are added.
   * @evidence principles/core/source-units.md#source-substantive-completion Body, lid, hasp and strap are four separate named mesh parts, so the closure reads independently from the wood.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The chest H2 gives the body/lid seam and front/rear hardware positions used for this approximate fixed proxy.
   */
  chest():IAutoMovieModel {
    const m=new ObjectMesh();
    box(m,"body",0,0,0,0.80,0.44,0.50);
    box(m,"lid",0,0.445,0,0.82,0.06,0.52);
    box(m,"hasp",0,0.35,0.255,0.08,0.155,0.01);
    for(const x of [-0.27,0.27]) box(m,"strap",x,0.36,-0.2575,0.04,0.145,0.005);
    for(const x of [-0.40,0.40]) for(const z of [-0.25,0.25])
      box(m,"strap",x,0,z,0.04,0.44,0.005);
    return m.model("fixture.chest","보관 궤");
  }
}
