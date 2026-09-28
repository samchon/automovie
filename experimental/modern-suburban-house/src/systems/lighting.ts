/** The house's one deterministic daylight and practical-light rest state. */
import type { IAutoMovieLight, IAutoMovieSceneEnvironment, IAutoMovieColor } from "@automovie/interface";
const color=(r:number,g:number,b:number):IAutoMovieColor=>({r,g,b,a:1,hex:null});
const warm=color(1,.72,.45),lamp=color(1,.66,.38),vanity=color(1,.78,.55);
const transform=(x:number,y:number,z:number)=>({translation:{x,y,z},rotation:{x:0,y:0,z:0,w:1},scale:{x:1,y:1,z:1}});
const direction=(x:number,y:number,z:number)=>{
  const length=Math.hypot(x,y,z),bx=-x/length,by=-y/length,bz=-z/length,s=Math.hypot(by,-bx,1-bz);
  return {x:by/s,y:-bx/s,z:0,w:(1-bz)/s};
};

/** Serialize the authored systems decisions without a clock, seed or view override. */
export class HouseLighting {
  /** Four directional lights, twenty-eight point lights and a fixed environment. */
  public build():{lights:IAutoMovieLight[];environment:IAutoMovieSceneEnvironment} {
    const lights:IAutoMovieLight[]=[{
      id:"light:daylight:sun",type:"directional",transform:{...transform(0,0,0),rotation:direction(-Math.cos(32*Math.PI/180)/Math.SQRT2,Math.sin(32*Math.PI/180),Math.cos(32*Math.PI/180)/Math.SQRT2)},
      color:color(1,.89,.76),intensity:3,castShadow:true,
      shadow:{mapSize:4096,bias:-.0005,normalBias:.02,near:.5,far:136},
    },{
      id:"light:daylight:sky-fill",type:"directional",transform:{...transform(0,0,0),rotation:direction(.6,1,-.6)},
      color:color(.8,.88,1),intensity:.8,castShadow:false,
    },{
      id:"light:daylight:sky-front-fill",type:"directional",transform:{...transform(0,0,0),rotation:direction(-.6,1,.6)},
      color:color(.8,.88,1),intensity:.8,castShadow:false,
    },{
      id:"light:daylight:ground-bounce",type:"directional",transform:{...transform(0,0,0),rotation:direction(-.1,-1,.1)},
      color:color(.75,.72,.65),intensity:.16,castShadow:false,
    }];
    const point=(id:string,x:number,y:number,z:number,intensity=7.5,range=5,c=warm):void=>{
      lights.push({id:`light:${id}`,type:"point",transform:transform(x,y,z),color:c,intensity,range,castShadow:false});
    };
    point("kitchen-dining-family:island-pendant-1",-3.125,1.95,-8.10,6,4);
    point("kitchen-dining-family:island-pendant-2",-3.125,1.95,-7.05,6,4);
    point("kitchen-dining-family:dining-pendant",.5,1.55,-7.95,9,4);
    for(const [id,x,z] of [
      ["living-room:ceiling",-3.725,-3.15],["kitchen-dining-family:family-ceiling",3.95,-7.8],
      ["front-entry:ceiling",.76,-1.83],["service-access:right-strip",2.545,-3.15],
      ["service-access:rear-strip",.11,-5.38],["powder-room:ceiling",4.36,-1.075],
      ["laundry-mudroom:ceiling",4.36,-3.3],["pantry:ceiling",4.36,-5.375],
    ] as const)point(id,x,2.70,z);
    for(const [id,x,z] of [
      ["main-stair:landing-ceiling",-1.225,-3.985],["upper-hall:arm-ceiling",-.065,-5.31],
      ["upper-hall:arrival-ceiling",2.47,-4.06],["bedroom-two:ceiling",-3.725,-2.405],
      ["bedroom-three:ceiling",2.5,-1.38],["primary-bedroom:ceiling",-2.375,-8.255],
      ["primary-wardrobe:ceiling",3.2,-9.70],["shower-bathroom:ceiling",1.985,-7.43],
      ["tub-bathroom:ceiling",4.36,-6.755],
    ] as const)point(id,x,5.61,z);
    point("bedroom-two:nightstand-lamp",-3.725,3.96,-4.275,1.2,2.5,lamp);
    point("bedroom-three:nightstand-lamp",1.275,3.96,-2.875,1.2,2.5,lamp);
    point("primary-bedroom:nightstand-lamp-rear",.40,4.01,-8.90,1.2,2.5,lamp);
    point("primary-bedroom:nightstand-lamp-front",.40,4.01,-6.80,1.2,2.5,lamp);
    point("powder-room:vanity",3.95,2,-.33,3,2.5,vanity);
    point("shower-bathroom:vanity",2.99,5.06,-6.45,3,2.5,vanity);
    point("tub-bathroom:vanity",5.42,5.06,-5.325,3,2.5,vanity);
    point("garage:ceiling",8.6,2.50,-4.80,9,6,color(1,.85,.7));
    return {lights,environment:{image:null,background:color(.70,.75,.82),intensity:0,rotationDeg:0,exposure:1,toneMapping:"acesFilmic",shadows:{enabled:true,type:"pcfSoft"}}};
  }
}
