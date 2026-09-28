/** Fixed model inspection views from docs/models/00-model-frame.md; metres, Y up. */
import {lowerViewerModels,type IViewerModelInputs} from "../viewer/modelScene.cjs";
import type {IViewerScene} from "../viewer/scenePayload";
import {FittingParts} from "./furnishings/geometry";
import {sectionCap} from "../viewer/sectionCaps";

/** View poses preserve source geometry, metric UVs and physical size. */
export class Frame {
  public build(input:IViewerModelInputs,id:string,view:"front"|"side"|"diagonal",overlay:boolean,sourceDigest:string):IViewerScene {
    const prototype=input.prototypes.find(p=>p.model.id===id);
    if(prototype===undefined)throw Error(`unknown review model: ${id}`);
    const yaw=prototype.reviewYaw??0;
    const items=lowerViewerModels({prototypes:[prototype],instances:[{id:"review",modelId:id,transform:{rotation:{x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)}}}],finishes:input.finishes});
    const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
    for(const item of items)for(let k=0;k<item.positions.length;k++){
      const axis=k%3;low[axis]=Math.min(low[axis]!,item.positions[k]!);high[axis]=Math.max(high[axis]!,item.positions[k]!);
    }
    if(!low.every(Number.isFinite))throw Error(`empty review model: ${id}`);
    const width=high[0]!-low[0]!,height=high[1]!-low[1]!,depth=high[2]!-low[2]!;
    const centre=[(high[0]!+low[0]!)/2,low[1]!, (high[2]!+low[2]!)/2];
    const faces=[...new Set(items.map(i=>i.faceId!))].sort((a,b)=>a.localeCompare(b,"en"));
    for(const item of items){
      item.positions=item.positions.map((n,k)=>n-centre[k%3]!);
      if(overlay){
        item.inspectionFace=true;
        item.color=Math.imul(faces.indexOf(item.faceId!)+1,0x9e3779)&0xffffff;
        item.texture=undefined;item.metalness=0;item.roughness=1;item.transmission=0;item.opacity=1;
      }
    }
    if(view==="side")items.push(...items.flatMap(item=>{
      const cap=sectionCap(item);return cap===undefined?[]:[cap];
    }));
    const scale=new FittingParts();
    const x=view==="side"?-width/2-.65:width/2+.65,z=view==="side"?depth/2+.70:0;
    scale.box("person-occupancy","occupancy",[x-.30,x+.30,0,1.90,z-.225,z+.225]);
    const built=scale.finish("review-person-occupancy");
    const scaleItems=lowerViewerModels({prototypes:[built],instances:[{id:"reference",modelId:built.model.id,transform:{}}],finishes:{occupancy:{color:0x9a9a9a,roughness:1,metalness:0}}});
    for(const item of scaleItems)item.role="reference";
    items.push(...scaleItems);
    const span=Math.max(height,1.90,(view==="side"?depth+1.2:width+1.2)/(1536/1024))*1.20;
    const distance=Math.max(span/(2*Math.tan(Math.PI/8)),depth+width)*1.25;
    return {subject:"model-review",inspection:true,sourceDigest,raster:{width:1536,height:1024,pixelRatio:1},
      camera:{position:view==="front"?[0,span/2,distance]:view==="side"?[distance,span/2,0]:[distance/Math.SQRT2,1.6,distance/Math.SQRT2],target:[0,span/2,0],fovDeg:45,near:.05,far:300,orthographicSpan:view==="diagonal"?undefined:span},
      lighting:{keyFrom:[-4,6,5],keyTarget:[0,0,0],keyIntensity:2,skyColor:0xffffff,groundColor:0xffffff,fillIntensity:1,exposure:1,shadowHalfExtent:12},
      items,modelReview:{id,view,overlay,faces,models:input.prototypes.map(p=>p.model.id)},sectionX:view==="side"?0:undefined};
  }
}
