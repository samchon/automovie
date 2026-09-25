/** Window infill in the local frame of docs/models/00-model-frame.md.
 * The caller supplies each opening's span and unit count from its spaces owner;
 * this producer owns only the reusable member profile. */
import { PrototypeBuilder, type HousePrototype } from "./parts";

export const windowProfile = {
  frame: 0.06,
  frameDepth: 0.14,
  weatherInset: 0.04,
  mullion: 0.08,
  sash: 0.05,
  sashDepth: 0.05,
  fixedSashInset: 0.04,
  trackMargin: 0.01,
  trackGap: 0.02,
  glassInset: 0.017,
  muntin: 0.025,
  muntinDepth: 0.01,
  glassDepth: 0.006,
  minUnitWidth: 0.30,
} as const;

export type WindowKind = "double-hung" | "fixed" | "awning";
export interface WindowOpening {
  id: string;
  width: number;
  height: number;
  units: number;
  kind: WindowKind;
}

/** All infill solids are bounded by the rough opening; the opening owner keeps
 * world position and orientation. Transparent panes are closed thin meshes. */
export function buildWindowPrototype(opening: WindowOpening): HousePrototype {
  const { id, width, height, units, kind } = opening;
  const p = windowProfile;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 ||
      !Number.isInteger(units) || units < 1 || kind === "awning" && units !== 1)
    throw Error(`${id}: invalid window opening`);
  const unitWidth = (width - 2*p.frame - (units-1)*p.mullion)/units;
  if (unitWidth < p.minUnitWidth || height <= 2*p.frame + 2*p.sash + p.muntin)
    throw Error(`${id}: window members cover the glass`);
  const b = new PrototypeBuilder(id,"src/models/windows.ts",
    {frame:"charcoal-metal",sash:"charcoal-metal",mullion:"charcoal-metal",muntin:"charcoal-metal"});
  const front = -p.weatherInset;
  const back = front-p.frameDepth;
  const left = -width/2;
  const right = width/2;
  const rail = (surface:string,x0:number,x1:number,y0:number,y1:number,z0:number,z1:number) =>
    b.box(surface,[x0,y0,z0],[x1,y1,z1]);
  rail("frame",left,left+p.frame,0,height,back,front);
  rail("frame",right-p.frame,right,0,height,back,front);
  rail("frame",left+p.frame,right-p.frame,0,p.frame,back,front);
  rail("frame",left+p.frame,right-p.frame,height-p.frame,height,back,front);
  for (let unit=0;unit<units;unit++) {
    const x0=left+p.frame+unit*(unitWidth+p.mullion);
    const x1=x0+unitWidth;
    if (unit) rail("mullion",x0-p.mullion,x0,p.frame,height-p.frame,back,front);
    const lower=p.frame;
    const upper=height-p.frame;
    const panels=kind==="double-hung" ? [[lower,(lower+upper)/2],[(lower+upper)/2,upper]] : [[lower,upper]];
    for (const [panelIndex,panel] of panels.entries()) {
      const [y0,y1]=panel as [number,number];
      // Two hung tracks keep equal margins inside the frame. Fixed and awning
      // sashes occupy the shallower common slot specified by the model owner.
      const sashBack=kind==="double-hung"
        ? back+p.trackMargin+(1-panelIndex)*(p.sashDepth+p.trackGap)
        : front-p.fixedSashInset-p.sashDepth;
      const sashFront=sashBack+p.sashDepth;
      rail("sash",x0,x0+p.sash,y0,y1,sashBack,sashFront);
      rail("sash",x1-p.sash,x1,y0,y1,sashBack,sashFront);
      rail("sash",x0+p.sash,x1-p.sash,y0,y0+p.sash,sashBack,sashFront);
      rail("sash",x0+p.sash,x1-p.sash,y1-p.sash,y1,sashBack,sashFront);
      const gx0=x0+p.sash, gx1=x1-p.sash, gy0=y0+p.sash, gy1=y1-p.sash;
      const glassBack=sashBack+p.glassInset;
      const glassFront=glassBack+p.glassDepth;
      b.box(kind==="awning"?"obscured-glass":"glass",
        [gx0,gy0,glassBack],[gx1,gy1,glassFront]);
      if (kind!=="awning") {
        const cx=(gx0+gx1)/2, cy=(gy0+gy1)/2;
        for (const z of [glassBack-p.muntinDepth,glassFront]) {
          rail("muntin",cx-p.muntin/2,cx+p.muntin/2,gy0,gy1,z,z+p.muntinDepth);
          rail("muntin",gx0,gx1,cy-p.muntin/2,cy+p.muntin/2,z,z+p.muntinDepth);
        }
      }
    }
  }
  return b.finish();
}
