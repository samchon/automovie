/** Closed front entry infill. The host supplies the rough width and height;
 * this producer owns jamb, leaf, glass, trim and hardware dimensions only. */
import { PrototypeBuilder, type HousePrototype } from "./parts";

export const frontDoorProfile = {
  jamb:0.03,
  wallDepth:0.25,
  thresholdTop:0.02,
  thresholdClearance:0.01,
  leafDepth:0.04,
  leafWeatherInset:0.105,
  stile:0.12,
  glassBottom:1.30,
  gridColumns:3,
  gridRows:2,
  muntin:0.03,
  glassDepth:0.006,
  exteriorTrim:0.10,
  exteriorTrimDepth:0.035,
  casing:0.07,
  casingDepth:0.015,
  handleY:0.95,
  handleInset:0.07,
  handleRadius:0.008,
  hingeLevels:[0.20,1.05,1.90],
} as const;

export function buildFrontDoorPrototype(id:string,roughWidth:number,roughHeight:number):HousePrototype {
  const p=frontDoorProfile;
  if(![roughWidth,roughHeight].every((n)=>Number.isFinite(n)&&n>0)) throw Error(`${id}: invalid door opening`);
  const x0=-roughWidth/2+p.jamb,x1=roughWidth/2-p.jamb;
  const y0=p.thresholdTop+p.thresholdClearance,y1=roughHeight-p.jamb;
  const glassTop=y1-p.stile;
  const innerLeft=x0+p.stile,innerRight=x1-p.stile;
  const liteWidth=(innerRight-innerLeft-(p.gridColumns-1)*p.muntin)/p.gridColumns;
  const liteHeight=(glassTop-p.glassBottom-(p.gridRows-1)*p.muntin)/p.gridRows;
  if(liteWidth<=0||liteHeight<=0||y1<=Math.max(...p.hingeLevels)+0.04)
    throw Error(`${id}: door opening cannot contain its members`);
  const b=new PrototypeBuilder(id,"src/models/exterior-door.ts",{
    jamb:"trim-white","exterior-trim":"trim-white",casing:"trim-white",
    "leaf-exterior":"furniture-wood","leaf-interior":"furniture-wood",
    "leaf-edge":"furniture-wood","leaf-panel":"furniture-wood",
    muntin:"furniture-wood",hinge:"charcoal-metal",handle:"charcoal-metal",
  });
  const box=(face:string,a:[number,number,number],z:[number,number,number])=>b.box(face,a,z);
  const wallBack=-p.wallDepth;
  for(const [a,c] of [[-roughWidth/2,-roughWidth/2+p.jamb],[roughWidth/2-p.jamb,roughWidth/2]] as const)
    box("jamb",[a,p.thresholdTop,wallBack],[c,roughHeight-p.jamb,0]);
  box("jamb",[-roughWidth/2+p.jamb,roughHeight-p.jamb,wallBack],
    [roughWidth/2-p.jamb,roughHeight,0]);
  for(const [a,c] of [[-roughWidth/2-p.exteriorTrim,-roughWidth/2],[roughWidth/2,roughWidth/2+p.exteriorTrim]] as const)
    box("exterior-trim",[a,0,0],[c,roughHeight,p.exteriorTrimDepth]);
  box("exterior-trim",[-roughWidth/2-p.exteriorTrim,roughHeight,0],
    [roughWidth/2+p.exteriorTrim,roughHeight+p.exteriorTrim,p.exteriorTrimDepth]);
  for(const [a,c] of [[-roughWidth/2-p.casing,-roughWidth/2],[roughWidth/2,roughWidth/2+p.casing]] as const)
    box("casing",[a,0,wallBack-p.casingDepth],[c,roughHeight,wallBack]);
  box("casing",[-roughWidth/2-p.casing,roughHeight,wallBack-p.casingDepth],
    [roughWidth/2+p.casing,roughHeight+p.casing,wallBack]);
  const zWeather=-p.leafWeatherInset,zRoom=zWeather-p.leafDepth;
  const mid=(zWeather+zRoom)/2;
  // The lower weather face leaves a real recess for the inset wood panel.
  const panelBottom=y0+p.stile,panelTop=p.glassBottom-p.stile;
  box("leaf-interior",[x0,y0,zRoom],[x1,p.glassBottom,mid]);
  box("leaf-exterior",[x0,y0,mid],[innerLeft,p.glassBottom,zWeather]);
  box("leaf-exterior",[innerRight,y0,mid],[x1,p.glassBottom,zWeather]);
  box("leaf-exterior",[innerLeft,y0,mid],[innerRight,panelBottom,zWeather]);
  box("leaf-exterior",[innerLeft,panelTop,mid],[innerRight,p.glassBottom,zWeather]);
  box("leaf-panel",[innerLeft,panelBottom,mid],[innerRight,panelTop,zWeather-0.008]);
  // Weather and room-side rails meet at the mid-plane around six glass lites.
  for(const [face,z0,z1] of [["leaf-exterior",mid,zWeather],["leaf-interior",zRoom,mid]] as const) {
    box(face,[x0,p.glassBottom,z0],[innerLeft,y1-0.004,z1]);
    box(face,[innerRight,p.glassBottom,z0],[x1,y1-0.004,z1]);
    box(face,[innerLeft,glassTop,z0],[innerRight,y1-0.004,z1]);
  }
  box("leaf-edge",[x0,y1-0.004,zRoom],[x1,y1,zWeather]);
  for(let row=0;row<p.gridRows;row++) for(let col=0;col<p.gridColumns;col++) {
    const a=innerLeft+col*(liteWidth+p.muntin);
    const c=p.glassBottom+row*(liteHeight+p.muntin);
    box("glass",[a,c,mid-p.glassDepth/2],[a+liteWidth,c+liteHeight,mid+p.glassDepth/2]);
  }
  for(let col=1;col<p.gridColumns;col++) {
    const x=innerLeft+col*liteWidth+(col-1)*p.muntin;
    box("muntin",[x,p.glassBottom,zRoom],[x+p.muntin,glassTop,zWeather]);
  }
  for(let row=1;row<p.gridRows;row++) {
    const y=p.glassBottom+row*liteHeight+(row-1)*p.muntin;
    box("muntin",[innerLeft,y,zRoom],[innerRight,y+p.muntin,zWeather]);
  }
  for(const level of p.hingeLevels)
    b.frustum("hinge",[x1,level-0.04,zRoom],0.009,0.009,0.08,12);
  const hx=x0+p.handleInset;
  for(const z of [zWeather+0.01,zRoom-0.018]) {
    b.ringZ("handle",[hx,p.handleY,z],0.003,0.0325,0.008);
    b.beam("handle",[hx,p.handleY,z],[hx+0.11,p.handleY,z],p.handleRadius,p.handleRadius,12);
  }
  return b.finish();
}
