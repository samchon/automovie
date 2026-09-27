/** Open ceramic wares and unmarked scroll silhouettes from docs/models/wares.md. */
import type { IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";

const p=(x:number,y:number,z:number)=>({x,y,z});
const jar=(id:string,name:string,
  outside:readonly (readonly [number,number])[],
  inside:readonly (readonly [number,number])[],
  handles:readonly (readonly [number,number,number,number])[],n:number):IAutoMovieModel=>{
  const m=new ObjectMesh();m.vessel("body",0,0,outside,inside,n);
  for(const [x,y,r,t] of handles)m.loop("handle",x,y,0,r,t,"xy",16);
  return m.model(id,name);
};

/**
 * Open vessel and unmarked scroll silhouettes in their own local frames.
 * @evidence models/wares.md This class exposes five ceramic/basket forms and three scroll states through six public builders.
 * @evidence principles/core/source-units.md#source-scope-preservation Its methods make only wares.md proxies; material, shelf placement and counts are left to later owners.
 * @evidence principles/core/source-units.md#source-substantive-completion Vessel profiles and scroll branches emit distinct body, handle, sheet and tie meshes instead of one generic cylinder.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The six wares H2s give the major open profiles, rough extents and state identities needed for these fixed blocking meshes.
 * @evidence obligations/design/model-sources.md#design-owned-construction Explicit vessel profile arrays and the scroll-state branch follow their H2s and keep part IDs stable for later binding.
 */
export class TempleWares {
  /**
   * @evidence models/wares.md#storage-jar Five outer profile points swell from a narrow foot to a shoulder and neck, with an open inner profile and two shoulder loops.
   * @evidence principles/core/source-units.md#source-scope-preservation This builder yields the large storage shape alone; jar placement and finish are absent.
   * @evidence principles/core/source-units.md#source-substantive-completion A 16-sector body mesh and two handle rings form distinct parts with an open top.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The storage-jar H2 fixes the foot, belly, neck, lip and opposed handle sites used by the profile and loop calls.
   */
  storageJar():IAutoMovieModel {
    return jar("ware.storage-jar","큰 저장 항아리",
      [[0,0.10],[0.40,0.24],[0.58,0.18],[0.64,0.08],[0.70,0.10]],
      [[0.70,0.08],[0.64,0.055],[0.55,0.04]],
      [[-0.20,0.58,0.04,0.0075],[0.20,0.58,0.04,0.0075]],16);
  }

  /**
   * @evidence models/wares.md#carry-jar The second vessel profile is 0.50 m tall with a 0.15 m belly and two side-loop handle proxies.
   * @evidence principles/core/source-units.md#source-scope-preservation Its body/handle parts make the medium carrier variant, with no actual carrying motion.
   * @evidence principles/core/source-units.md#source-substantive-completion The 16-sector open vessel and separate paired loops distinguish this prototype from storageJar's larger profile.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The carry-jar H2 supplies the medium outline and two handle positions used for this approximate fixed form.
   */
  carryJar():IAutoMovieModel {
    return jar("ware.carry-jar","운반 항아리",
      [[0,0.07],[0.28,0.15],[0.40,0.10],[0.45,0.05],[0.50,0.06]],
      [[0.50,0.04],[0.45,0.03],[0.40,0.025]],
      [[-0.145,0.365,0.065,0.018],[0.145,0.365,0.065,0.018]],16);
  }

  /**
   * @evidence models/wares.md#small-vessel A 0.20 m open profile narrows above its belly and carries only one +X handle loop.
   * @evidence principles/core/source-units.md#source-scope-preservation This is the small table-vessel prototype, leaving tool-container contents and placement outside the mesh.
   * @evidence principles/core/source-units.md#source-substantive-completion The 12-sector body and one handle part produce a distinct open-mouth silhouette.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The small-vessel H2 fixes its shorter belly/neck and one-sided handle, enough for the emitted rough proxy.
   */
  smallVessel():IAutoMovieModel {
    return jar("ware.small-vessel","작은 탁상 용기",
      [[0,0.05],[0.10,0.08],[0.16,0.035],[0.20,0.045]],
      [[0.20,0.028],[0.16,0.022],[0.15,0.018]],
      [[0.0675,0.13,0.0325,0.01]],12);
  }

  /**
   * @evidence models/wares.md#offering-bowl The 24-sector vessel follows a shallow 0.11 m outer radius and an inset inner profile to leave a visible open bowl.
   * @evidence principles/core/source-units.md#source-scope-preservation One bowl part represents the H2's unadorned offering vessel; its material and altar position are not selected here.
   * @evidence principles/core/source-units.md#source-substantive-completion The profile produces a rim, sloped inner face and base rather than a flat disc.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The offering-bowl H2 gives the low rim and inner profile used by this rotational mesh.
   */
  offeringBowl():IAutoMovieModel {
    const m=new ObjectMesh();
    m.vessel("bowl",0,0,
      [[0.01,0.04],[0.018,0.085],[0.04,0.104],[0.06,0.11]],
      [[0.06,0.098],[0.043,0.08],[0.027,0.05],[0.015,0.01]],24);
    return m.model("ware.offering-bowl","얕은 봉헌 그릇");
  }

  /**
   * @evidence models/wares.md#basket An open tapered wall and floor carry ten alternating raised ring bands beneath a separate upper rim.
   * @evidence principles/core/source-units.md#source-scope-preservation This builder emits the basket's coarse circular body and ribbed band proxy, without choosing carried contents.
   * @evidence principles/core/source-units.md#source-substantive-completion The 24-sector wall, closed base, ten bands and rim make the vessel open at the top and divided into named parts.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The basket H2 supplies the widening wall, closed floor, raised band rhythm and upper rim for this approximate silhouette.
   */
  basket():IAutoMovieModel {
    const m=new ObjectMesh();
    m.vessel("wall",0,0,[[0.02,0.18],[0.305,0.20]],
      [[0.305,0.185],[0.02,0.165]],24);
    m.frustum("floor",0,0,0,0.02,0.18,0.18,24);
    m.loop("rim",0,0.305,0,0.20,0.015,"xz",24);
    for(let i=0;i<10;i++){
      const y=0.02+(i+0.5)*(0.285/10);
      m.loop("wall",0,y,0,0.20+(i%2===0?0.004:0),0.008,"xz",24);
    }
    return m.model("ware.basket","운반 바구니");
  }

  /**
   * @evidence models/wares.md#scroll The open branch makes a flat sheet with two rolled ends; rolled makes one cylinder and tie, while bundle emits three individually named cylinders and a tie proxy.
   * @evidence principles/core/source-units.md#source-scope-preservation The state union selects only the three H2 forms and emits no writing or scroll animation.
   * @evidence principles/core/source-units.md#source-substantive-completion Each branch returns geometry and a state-specific ID, with sheet-1/2/3 remaining separately addressable in the bundle.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The scroll H2 names rolled, three-piece bundle and open-sheet states; these rough meshes preserve those three identities without choosing shelf counts.
   */
  scroll(state:"rolled"|"bundle"|"open"):IAutoMovieModel {
    const m=new ObjectMesh();
    if(state==="open"){
      m.box("sheet",0,0,0,0.25,0.002,0.35);
      for(const z of [-0.1837,0.1837])
        m.rod("sheet",p(-0.125,0.02,z),p(0.125,0.02,z),0.02,16);
    }else{
      const centers=state==="rolled"?[[0,0]]:[[0,-0.03],[0,0.03],[0.03*Math.sqrt(3),0]];
      centers.forEach(([y,z],i)=>{
        const part=state==="rolled"?"sheet":`sheet-${i+1}`;
        m.rod(part,p(-0.14,y!,z!),p(0.14,y!,z!),0.03,16);
        for(const x of [-0.144,0.14])
          m.rod(part,p(x,y!,z!),p(x+0.004,y!,z!),0.012,16);
      });
      m.loop("tie",0,0,0,state==="rolled"?0.0325:0.065,0.0025,"yz",16);
    }
    return m.model(`ware.scroll.${state}`,`두루마리 ${state}`);
  }
}
