/** Shared dimensional prototypes. A template is selected by physical role;
 * individual rooms supply only dimensions and the declared surface vocabulary.
 * All dimensions are local metres; world positions belong to instances. */
import { PrototypeBuilder, type HousePrototype, type Size } from "./parts";

export type PrototypeKind =
  | "cabinet" | "appliance" | "table" | "chair" | "sofa" | "shelf"
  | "bed" | "mat" | "panel" | "bath" | "toilet" | "shower" | "tub" | "fixture" | "plant" | "props";
export interface PrototypeSpec {
  id: string;
  design: string;
  owner: string;
  kind: PrototypeKind;
  size: Size;
  faces: readonly string[];
  /** Worktop height when the full model height includes an accessory. */
  bodyTop?: number;
  /** Top of a mattress beneath its separate bedding layer. */
  mattressTop?: number;
}

/** A canonical 62-item spec is built by the domain files. This function
 * refuses an unmade surface rather than silently drawing a token-shaped proxy. */
export function buildPrototype(spec: PrototypeSpec): HousePrototype {
  const [w,h,d]=spec.size;
  if (!(w>0&&h>0&&d>0)) throw Error(`${spec.id}: invalid dimensions`);
  const b=new PrototypeBuilder(spec.id,spec.owner);
  const pending=new Set(spec.faces);
  const box=(face:string,x0:number,y0:number,z0:number,x1:number,y1:number,z1:number) => {
    if (!pending.has(face)) return;
    b.box(face,[x0,y0,z0],[x1,y1,z1]);
    pending.delete(face);
  };
  const cylinder=(face:string,x:number,y:number,z:number,r0:number,r1:number,t:number) => {
    if (!pending.has(face)) return;
    b.frustum(face,[x,y,z],r0,r1,t);
    pending.delete(face);
  };
  const side=(face:string,rear=0,top=h) => {
    if (!pending.has(face)) return;
    b.box(face,[-w/2,0,rear],[-w/2+0.025,top,d]);
    b.box(face,[w/2-0.025,0,rear],[w/2,top,d]);
    b.box(face,[-w/2+0.025,0,rear],[w/2-0.025,top,rear+0.025]);
    pending.delete(face);
  };
  const legs=(face:string,top:number) => {
    if (!pending.has(face)) return;
    const t=Math.min(0.06,w/8,d/8);
    for (const x of [-w/2,w/2-t]) for (const z of [0,d-t])
      b.box(face,[x,0,z],[x+t,top,z+t]);
    pending.delete(face);
  };

  switch (spec.kind) {
    case "cabinet":
      {
      const island=pending.has("basin"), vanity=pending.has("ceramic");
      const bodyTop=spec.bodyTop??h;
      const rear=island?Math.min(0.30,d*0.29):0;
      box("plinth",-w/2,0,rear,w/2,0.10,d-0.07);
      if (spec.bodyTop && pending.has("carcass"))
        b.box("carcass",[-w/2+0.025,0,d-0.025],[w/2-0.025,bodyTop-0.20,d]);
      if (spec.bodyTop && pending.has("carcass"))
        b.box("carcass",[-w/2,bodyTop-0.025,0],[w/2,bodyTop,d]);
      side("carcass",rear,bodyTop);
      if(island||vanity) {
        const cavityWidth=island?Math.min(0.50,w-0.20):Math.min(0.38,w*0.60);
        const cavityDepth=island?Math.min(0.50,d-0.20):Math.min(0.28,d*0.52);
        const x0=island?-w/2+0.10:-cavityWidth/2,x1=x0+cavityWidth;
        const z1=island?d-0.10:d*0.76,z0=z1-cavityDepth;
        const top=h-0.03;
        const face=pending.has("countertop")?"countertop":"top";
        // Four slabs leave a true cut-out. The bowl floor and side walls
        // meet that cut without a solid counter hiding the opening.
        b.box(face,[-w/2,top,0],[x0,h,d]);
        b.box(face,[x1,top,0],[w/2,h,d]);
        b.box(face,[x0,top,0],[x1,h,z0]);
        b.box(face,[x0,top,z1],[x1,h,d]);
        pending.delete(face);
        const bowl=pending.has("basin")?"basin":"ceramic";
        const t=0.012,bottom=h-(island?0.20:0.15);
        b.box(bowl,[x0,bottom,z0],[x1,bottom+t,z1]);
        b.box(bowl,[x0,bottom+t,z0],[x0+t,h,z1]);
        b.box(bowl,[x1-t,bottom+t,z0],[x1,h,z1]);
        b.box(bowl,[x0+t,bottom+t,z0],[x1-t,h,z0+t]);
        b.box(bowl,[x0+t,bottom+t,z1-t],[x1-t,h,z1]);
        pending.delete(bowl);
        if(pending.has("faucet")) {
          const fx=(x0+x1)/2,fz=Math.max(0.025,z0-0.03),height=island?0.35:0.23;
          b.frustum("faucet",[fx,h,fz],0.0125,0.0125,height);
          b.box("faucet",[fx-0.009,h+height-0.018,fz],[fx+0.009,h+height,fz+Math.min(0.20,cavityDepth*0.48)]);
          pending.delete("faucet");
        }
      } else {
        box("countertop",-w/2,h-0.04,0,w/2,h,d);
        box("top",-w/2,h-0.04,0,w/2,h,d);
      }
      const dresser=pending.has("leg")&&pending.has("drawer-front");
      const slots=dresser?2:Math.max(1,Math.round(w/0.60));
      for(let i=0;i<slots;i++) {
        const left=-w/2+i*w/slots+0.02,right=-w/2+(i+1)*w/slots-0.02;
        if(pending.has("leaf")) b.box("leaf",[left,0.11,d-0.025],[right,Math.max(0.12,bodyTop-0.20),d]);
        if(pending.has("drawer-front")) {
          const count=dresser?3:1;
          const start=dresser?0.08:Math.max(0.12,bodyTop-0.20);
          const span=(bodyTop-0.05-start)/count;
          for(let row=0;row<count;row++) {
            const bottom=start+row*span,top=bottom+span-0.008;
            b.box("drawer-front",[left,bottom,d-0.026],[right,top,d]);
            if(dresser&&pending.has("handle")) {
              const x=(left+right)/2;
              b.box("handle",[x-0.06,top-0.04,d-0.012],[x+0.06,top-0.015,d]);
            }
          }
        }
        if(!dresser&&pending.has("handle")) {
          const x=(left+right)/2;
          b.box("handle",[x-0.06,Math.max(0.14,bodyTop-0.13),d],[x+0.06,Math.max(0.16,bodyTop-0.112),d+0.012]);
        }
      }
      pending.delete("leaf"); pending.delete("drawer-front"); pending.delete("handle");
      cylinder("accessory",w*0.3,h,d*0.15,0.028,0.028,0.10);
      legs("leg",Math.min(0.08,h*0.18));
      if(pending.has("lamp-base")) {
        b.frustum("lamp-base",[0,bodyTop,d*0.5],0.07,0.07,0.025);
        b.frustum("lamp-base",[0,bodyTop+0.025,d*0.5],0.009,0.009,Math.max(0.02,h-bodyTop-0.245));
        pending.delete("lamp-base");
      }
      cylinder("lamp-shade",0,h-0.22,d*0.5,0.125,0.08,0.22);
      break;
      }
    case "appliance":
      if(pending.has("door-ring")) {
        const cy=Math.min(0.42,h*0.48),front=d-0.03;
        const body=pending.has("appliance-body");
        side("appliance-body");
        if(body) {
          b.box("appliance-body",[-w/2,h-0.025,0],[w/2,h,d]);
          b.ringZ("appliance-body",[0,cy,front-0.08],0.20,0.26,0.08);
        }
        if(pending.has("appliance-interior")) {
          b.beam("appliance-interior",[0,cy,front-0.10],[0,cy,front-0.094],0.20,0.20,16);
          pending.delete("appliance-interior");
        }
        if(pending.has("drum")) {
          b.ringZ("drum",[0,cy,front-0.09],0.174,0.18,0.06);
          pending.delete("drum");
        }
        if(pending.has("leaf")) {
          b.ringZ("leaf",[0,cy,front],0.195,0.225,0.018);
          pending.delete("leaf");
        }
        if(pending.has("door-ring")) {
          b.ringZ("door-ring",[0,cy,front+0.018],0.20,0.225,0.004);
          pending.delete("door-ring");
        }
        if(pending.has("glass")) {
          b.beam("glass",[0,cy,front+0.014],[0,cy,front+0.018],0.195,0.195,16);
          pending.delete("glass");
        }
        box("control-panel",-w/2+0.025,h-0.12,d-0.025,w/2-0.025,h-0.02,d);
        box("handle",-w*0.28,cy-0.045,d-0.008,-w*0.22,cy+0.045,d);
        break;
      }
      // Side/back/top panels leave a real front mouth for the leaf and interior.
      side("appliance-body");
      box("appliance-interior",-w*0.43,h*0.20,0.03,w*0.43,h*0.80,d*0.22);
      box("leaf",-w/2+0.015,0.03,d-0.035,w/2-0.015,h*0.80,d-0.012);
      box("drawer-front",-w/2+0.02,0.03,d-0.01,w/2-0.02,h*0.27,d+0.005);
      box("control-panel",-w/2+0.02,h*0.82,d-0.015,w/2-0.02,h*0.97,d+0.005);
      box("cooktop",-w/2+0.02,h-0.025,0.03,w/2-0.02,h,d-0.015);
      if (pending.has("burner")) {
        for (const x of [-w*0.24,w*0.24]) for (const z of [d*0.30,d*0.69])
          b.frustum("burner",[x,h,z],Math.min(w,d)*0.09,Math.min(w,d)*0.09,0.006);
        pending.delete("burner");
      }
      box("appliance-glass",-w*0.32,h*0.28,d-0.009,w*0.32,h*0.68,d+0.002);
      box("glass",-w*0.29,h*0.27,d-0.006,w*0.29,h*0.69,d+0.002);
      cylinder("door-ring",0,h*0.48,d-0.006,Math.min(w,h)*0.24,Math.min(w,h)*0.24,0.01);
      cylinder("drum",0,h*0.44,d*0.20,Math.min(w,h)*0.20,Math.min(w,h)*0.20,0.20);
      box("handle",w*0.25,h*0.35,d,w*0.30,h*0.72,d+0.03);
      break;
    case "table":
      box("top",-w/2,h-0.04,0,w/2,h,d);
      box("countertop",-w/2,h-0.04,0,w/2,h,d);
      box("apron",-w/2+0.06,h-0.15,0.06,w/2-0.06,h-0.04,d-0.06);
      legs("leg",h-0.04);
      if (pending.has("cleat")) {
        b.box("cleat",[-w/2,h-0.13,0],[-w/2+0.035,h-0.04,d]);
        b.box("cleat",[w/2-0.035,h-0.13,0],[w/2,h-0.04,d]);
        pending.delete("cleat");
      }
      box("drawer-front",-w*0.30,h-0.19,d-0.015,w*0.30,h-0.05,d);
      box("handle",-0.06,h-0.14,d,0.06,h-0.12,d+0.012);
      box("shelf",-w*0.35,h*0.35,0.04,w*0.35,h*0.35+0.025,d-0.04);
      box("book",-w*0.22,h+0.003,d*0.28,w*0.22,h+0.025,d*0.65);
      cylinder("container",w*0.28,h,d*0.40,0.035,0.035,0.09);
      cylinder("pencil",w*0.28,h+0.09,d*0.40,0.004,0.004,0.10);
      break;
    case "chair":
      {
      const stool=pending.has("footrest");
      const seatTop=stool?h:Math.min(0.45,h*0.54);
      box("seat",-w/2,seatTop-0.03,0,w/2,seatTop,d);
      legs("leg",seatTop-0.03);
      if(pending.has("back")) {
        const t=Math.min(0.035,w*0.08);
        for(const x of [-w/2,-w/2+w-t]) b.box("back",[x,seatTop-0.03,0.05],[x+t,h,0.05+t]);
        for(const y of [seatTop+0.14,h-0.03]) b.box("back",[-w/2+t,y,0.055],[w/2-t,y+0.03,0.075]);
        const inside=w-2*t,slat=t,gap=(inside-4*slat)/5;
        for(let i=0;i<4;i++) {
          const x=-w/2+t+(i+1)*gap+i*slat;
          b.box("back",[x,seatTop+0.17,0.055],[x+slat,h-0.03,0.075]);
        }
        pending.delete("back");
      }
      box("footrest",-w/2+0.03,seatTop*0.36,d*0.66,w/2-0.03,seatTop*0.36+0.025,d*0.71);
      break;
      }
    case "sofa":
      legs("leg",0.09);
      box("base",-w/2+0.02,0.09,0,w/2-0.02,0.31,d);
      if (pending.has("seat-cushion")) {
        const count=w>1.5?3:1;
        for (let i=0;i<count;i++) {
          const q=w/count;
          b.box("seat-cushion",[-w/2+i*q+0.006,0.31,d*0.20],[-w/2+(i+1)*q-0.006,0.43,d*0.94]);
        }
        pending.delete("seat-cushion");
      }
      box("back",-w/2+0.12,0.31,0,w/2-0.12,h,d*0.20);
      if (pending.has("arm")) {
        b.box("arm",[-w/2,0.31,0],[-w/2+0.12,0.62,d]);
        b.box("arm",[w/2-0.12,0.31,0],[w/2,0.62,d]);
        pending.delete("arm");
      }
      break;
    case "shelf":
      side("carcass");
      legs("post",h);
      box("plinth",-w/2,0,0,w/2,0.08,d);
      if (pending.has("shelf")) {
        for (let i=1;i<=4;i++) b.box("shelf",[-w/2+0.025,h*i/5,0.025],[w/2-0.025,h*i/5+0.025,d]);
        pending.delete("shelf");
      }
      box("cleat",-w/2,h*0.20,0,w/2,h*0.20+0.025,0.035);
      box("bin",-w*0.25,h*0.21,d*0.18,w*0.25,h*0.34,d*0.80);
      box("book",-w*0.26,h*0.62,d*0.20,w*0.26,h*0.85,d*0.30);
      box("shoe",-w*0.28,h*0.26,d*0.30,w*0.28,h*0.32,d*0.70);
      box("shoe-box",-w*0.35,h*0.22,d*0.23,w*0.35,h*0.34,d*0.75);
      box("basket",-w*0.35,h*0.63,d*0.23,w*0.35,h*0.77,d*0.75);
      box("folded",-w*0.38,h*0.43,d*0.20,w*0.38,h*0.48,d*0.78);
      cylinder("rod",0,h*0.78,d*0.45,0.012,0.012,0.03);
      box("clothes",-w*0.25,h*0.34,d*0.25,w*0.25,h*0.77,d*0.75);
      box("leaf",-w/2+0.02,0.04,d-0.03,w/2-0.02,h-0.03,d);
      box("handle",w*0.28,h*0.42,d,w*0.31,h*0.65,d+0.02);
      box("rail",-w/2,h*0.95,d-0.04,w/2,h*0.95+0.02,d);
      box("casing",-w/2,h*0.95,d-0.04,w/2,h,d);
      box("seat",-w/2,h-0.04,0,w/2,h,d);
      break;
    case "bed": {
      const mattressTop=spec.mattressTop??h*0.60;
      box("headboard",-w/2,0,0,w/2,h,0.06);
      if(pending.has("bed-frame")) {
        b.box("bed-frame",[-w/2,0.10,0.06],[w/2,0.30,d]);
        for(const x of [-w/2,w/2-0.05]) for(const z of [0.06,d-0.05])
          b.box("bed-frame",[x,0,z],[x+0.05,0.10,z+0.05]);
        pending.delete("bed-frame");
      }
      box("mattress",-w/2+0.02,0.30,0.06,w/2-0.02,mattressTop-0.03,d-0.02);
      box("bedding",-w/2+0.02,mattressTop-0.03,0.42,w/2-0.02,mattressTop,d-0.02);
      if (pending.has("pillow")) {
        for (const x of w>1.3?[-w*0.25,w*0.25]:[0]) b.box("pillow",[x-0.25,mattressTop,0.12],[x+0.25,mattressTop+0.12,0.52]);
        pending.delete("pillow");
      }
      break;
    }
    case "mat":
      box("field",-w/2+0.025,0,0.025,w/2-0.025,h,d-0.025);
      if (pending.has("border")) {
        for (const [x0,z0,x1,z1] of [[-w/2,0,w/2,0.025],[-w/2,d-0.025,w/2,d],[-w/2,0.025,-w/2+0.025,d-0.025],[w/2-0.025,0.025,w/2,d-0.025]])
          b.box("border",[x0,0,z0],[x1,h,z1]);
        pending.delete("border");
      }
      break;
    case "panel":
      // Physical profiles are separate addressable sheets, not a solid cube.
      box("siding-face",-w/2,0,d-0.006,w/2,h,d);
      box("siding-butt",-w/2,0,0,w/2,0.006,d);
      box("siding-back",-w/2,0,0,w/2,h,0.006);
      box("siding-top",-w/2,h-0.006,0,w/2,h,d);
      box("siding-cut",-w/2,0,0,-w/2+0.006,h,d);
      box("exterior-trim",-w/2,0,0,w/2,h,d);
      box("shingle-face",-w/2,h-0.006,0,w/2,h,d);
      box("shingle-butt",-w/2,0,0,w/2,h,0.008);
      box("shingle-back",-w/2,0,0,w/2,0.006,d);
      box("shingle-cut",-w/2,0,0,-w/2+0.008,h,d);
      box("roof-flashing",w/2-0.008,0,0,w/2,h,d);
      box("gutter",-w/2,0,0,w/2,h,d*0.35);
      box("downspout",w/2-0.08,-h*3,d*0.35,w/2,h,d*0.35+0.06);
      box("firebox",-w/2,0,0,w/2,h,d*0.85);
      box("firebox-trim",-w/2,0,d*0.85,w/2,h,d);
      box("mantel",-w/2,h,0,w/2,h+0.05,d);
      box("mirror-frame",-w/2,0,0,w/2,h,d*0.6);
      box("mirror",-w/2+0.02,0.02,d*0.6,w/2-0.02,h-0.02,d*0.85);
      break;
    case "bath":
      cylinder("faucet",0,h*0.72,d*0.15,0.018,0.018,0.18);
      box("rail",-w/2,h-0.03,d-0.04,w/2,h,d);
      box("rod",-w/2,h-0.04,d*0.5,w/2,h-0.02,d*0.53);
      box("curtain",-w/2,h*0.22,d-0.018,w/2,h-0.04,d-0.008);
      box("container",-w*0.30,0,d*0.35,w*0.30,h*0.80,d*0.65);
      cylinder("lid",0,h*0.80,d*0.5,w*0.13,w*0.13,Math.max(0.005,h*0.06));
      box("bracket",-w/2,0,0,-w/2+0.025,0.05,d*0.4);
      box("towel",-w*0.36,h*0.15,d*0.32,w*0.36,h*0.90,d*0.70);
      break;
    case "toilet": {
      // The same sanitary prototype serves all three bathrooms. The tank,
      // seat and lever share the declared occupied envelope.
      if (pending.has("ceramic")) {
        b.box("ceramic",[-w/2,0.40,0],[w/2,h-0.04,0.20]);
        b.box("ceramic",[-w/2,h-0.04,0],[w/2,h,0.20]);
        b.box("ceramic",[-0.12,0,0.32],[0.12,0.20,0.67]);
        b.frustum("ceramic",[0,0.20,0.53],0.17,0.19,0.21,12);
        pending.delete("ceramic");
      }
      if (pending.has("toilet-seat")) {
        const x=0.19,z0=0.30,z1=d;
        b.box("toilet-seat",[-x,0.41,z0],[-0.12,0.43,z1]);
        b.box("toilet-seat",[0.12,0.41,z0],[x,0.43,z1]);
        b.box("toilet-seat",[-0.12,0.41,z0],[0.12,0.43,z0+0.06]);
        b.box("toilet-seat",[-0.12,0.41,z1-0.06],[0.12,0.43,z1]);
        pending.delete("toilet-seat");
      }
      box("lid",-0.19,0.43,0.31,0.19,0.455,d);
      box("handle",w/2-0.075,0.63,0.19,w/2-0.015,0.655,0.21);
      break;
    }
    case "shower": {
      box("shower-tray",-w/2,0,0,w/2,0.018,d);
      if (pending.has("glass")) {
        b.box("glass",[w/2-0.008,0.018,0],[w/2,h,d]);
        const panel=(w+0.04)/3;
        for(let i=0;i<3;i++) {
          const left=-w/2+i*(panel-0.02);
          b.box("glass",[left,0.043,d-0.008-i*0.03],[left+panel,h-0.025,d-i*0.03]);
        }
        pending.delete("glass");
      }
      if (pending.has("rail")) {
        for(let i=0;i<3;i++) for(const y of [0.018,h-0.025])
          b.box("rail",[-w/2,y,d-0.09+i*0.03],[w/2,y+0.025,d-0.06+i*0.03]);
        pending.delete("rail");
      }
      if (pending.has("handle")) {
        b.frustum("handle",[-w/2+0.39,0.90,d-0.02],0.009,0.009,0.20);
        pending.delete("handle");
      }
      if (pending.has("faucet")) {
        b.frustum("faucet",[-0.375,1.05,0.06],0.04,0.04,0.025);
        b.frustum("faucet",[-0.375,2.03,0.18],0.07,0.07,0.025);
        pending.delete("faucet");
      }
      break;
    }
    case "tub":
      // Five walls and bottom leave the cavity visibly open. The front apron
      // meets the rim while the inner floor stays 0.15 m above ground.
      if (pending.has("ceramic")) {
        const rim=0.06;
        b.box("ceramic",[-w/2,0,0],[w/2,0.15,d]);
        b.box("ceramic",[-w/2,0.15,0],[-w/2+rim,h,d]);
        b.box("ceramic",[w/2-rim,0.15,0],[w/2,h,d]);
        b.box("ceramic",[-w/2+rim,0.15,0],[w/2-rim,h,rim]);
        b.box("ceramic",[-w/2+rim,0.15,d-rim],[w/2-rim,h,d]);
        pending.delete("ceramic");
      }
      cylinder("faucet",-w*0.40,h,d*0.5,0.016,0.016,0.18);
      break;
    case "fixture":
      cylinder("fixture-housing",0,0,0,w*0.47,w*0.47,Math.min(h*0.35,0.08));
      cylinder("fixture-diffuser",0,Math.min(h*0.35,0.08),0,w*0.40,w*0.40,Math.min(h*0.25,0.08));
      cylinder("fixture-canopy",0,0,0,0.05,0.05,0.025);
      cylinder("fixture-stem",0,0.025,0,0.006,0.006,Math.max(0.02,h*0.60));
      cylinder("fixture-shade",0,h*0.62,0,w*0.50,w*0.30,Math.max(0.02,h*0.35));
      cylinder("fixture-glass",0,h*0.35,0,w*0.35,w*0.35,Math.max(0.02,h*0.40));
      break;
    case "plant":
      {
      const shrub=h<=w;
      if(pending.has("bark")) {
        if(shrub) {
          for(let i=0;i<8;i++) {
            const angle=i*Math.PI/4;
            b.beam("bark",[0,0,0],[0.27*Math.cos(angle),0.42+0.04*(i%3),0.27*Math.sin(angle)],0.025,0.006,8);
          }
        } else {
          const radius=w/2;
          b.beam("bark",[0,0,0],[0,h*0.32,0],h*0.045,h*0.025);
          b.beam("bark",[0,h*0.32,0],[0,h*0.76,0],h*0.025,h*0.010);
          for(let i=0;i<6;i++) {
            const angle=i*Math.PI/3+(i%2)*Math.PI/12;
            b.beam("bark",[0,h*0.32,0],[
              radius*(0.72+0.04*(i%3))*Math.cos(angle),h*(0.69+0.025*(i%3)),
              radius*(0.72+0.04*(i%3))*Math.sin(angle)],h*0.018,h*0.006);
          }
        }
        pending.delete("bark");
      }
      if (pending.has("foliage")) {
        const radius=w/2;
        if(shrub) {
          b.ellipsoid("foliage",[0,0.57,0],[0.23,0.165,0.23]);
          for(let i=0;i<8;i++) {
            const angle=i*Math.PI/4;
            b.ellipsoid("foliage",[0.27*Math.cos(angle),0.42+0.04*(i%3),0.27*Math.sin(angle)],[0.18,0.14,0.18]);
          }
        } else {
          b.ellipsoid("foliage",[0,h*0.76,0],[radius*0.35,radius*0.35*0.72,radius*0.35]);
          for(let j=0;j<12;j++) {
            const angle=j*5*Math.PI/6;
            const offset=radius*(0.48+0.07*(j%3));
            const horizontal=radius*(0.30+0.025*(j%3));
            b.ellipsoid("foliage",[offset*Math.cos(angle),h*(0.68+0.04*(j%4)),offset*Math.sin(angle)],
              [horizontal,horizontal*0.72,horizontal]);
          }
        }
        pending.delete("foliage");
      }
      break;
      }
    case "props":
      if(pending.size===1&&pending.has("folded")) {
        for(let shelf=0;shelf<5;shelf++) for(let pile=0;pile<3;pile++) for(let layer=0;layer<2;layer++) {
          const x=-w/2+0.16+pile*0.30;
          const y=0.20+0.40*shelf+0.06*layer;
          b.box("folded",[x,y,0.05],[x+0.28,y+0.06,0.37]);
        }
        pending.delete("folded");
        break;
      }
      if(pending.has("pillow")&&pending.has("folded")) {
        for(const x of [-w*0.35,w*0.35])
          b.box("pillow",[x-0.21,0.43,0.15],[x+0.21,0.85,0.25]);
        for(let i=0;i<5;i++)
          b.box("folded",[w/2-0.13,0.62+0.025*i,0.25],[w/2,0.645+0.025*i,0.70]);
        pending.delete("pillow");pending.delete("folded");
        break;
      }
      if(pending.has("cutting-board")) {
        b.box("cutting-board",[-w/2,0,0],[-w/2+0.35,0.02,0.25]);
        b.cup("container",[w/2-0.12,0,0.13],0.05,0.06,0.18,0.007);
        b.box("container",[w/2-0.12,0,0.27],[w/2,0.20,0.39]);
        const toolX=w/2-0.12;
        for(let i=0;i<5;i++) {
          const offset=(i-2)*0.018;
          b.beam("utensil",[toolX+offset,0.13,0.13],[toolX+offset*1.5,0.28,0.13],0.006,0.006,8);
          if(i<2) b.box("utensil",[toolX+offset*1.5-0.015,0.28,0.128],[toolX+offset*1.5+0.015,0.34,0.132]);
          else b.ellipsoid("utensil",[toolX+offset*1.5,0.31,0.13],[0.018,0.025,0.006]);
        }
        const bowlZ=d-0.15;
        b.cup("bowl",[-0.02,0,bowlZ],0.11,0.14,0.075,0.008);
        for(let i=0;i<5;i++) {
          const angle=i*Math.PI/2;
          const radial=i===4?0:0.08;
          const diameter=0.06+0.005*i;
          b.ellipsoid("fruit",[-0.02+radial*Math.cos(angle),0.08,bowlZ+radial*Math.sin(angle)],
            [diameter/2,diameter/2,diameter/2]);
        }
        for(const face of ["cutting-board","container","utensil","bowl","fruit"]) pending.delete(face);
        break;
      }
      if(pending.has("book")&&pending.has("tray")) {
        for(let i=0;i<2;i++) b.box("book",[-w/2,0.025*i,0.02],[-w/2+0.22,0.025*(i+1),0.18]);
        b.box("tray",[-0.10,0,d-0.20],[0.14,0.025,d-0.02]);
        b.cup("container",[w/2-0.10,0,d*0.34],0.04,0.03,0.12,0.006);
        for(let i=0;i<3;i++) {
          const angle=i*2*Math.PI/3;
          const x=w/2-0.10+0.04*Math.cos(angle),z=d*0.34+0.04*Math.sin(angle);
          b.beam("stem",[w/2-0.10,0.12,d*0.34],[x,0.24,z],0.002,0.002,8);
          b.ellipsoid("foliage",[x,0.26,z],[0.02,0.02,0.02]);
        }
        for(const face of ["book","tray","container","stem","foliage"]) pending.delete(face);
        break;
      }
      if(pending.has("field")&&pending.has("border")&&pending.has("container")) {
        b.box("field",[-w/2+0.025,0,0.025],[w/2-0.025,0.012,d-0.025]);
        for(const [x0,z0,x1,z1] of [[-w/2,0,w/2,0.025],[-w/2,d-0.025,w/2,d],[-w/2,0.025,-w/2+0.025,d-0.025],[w/2-0.025,0.025,w/2,d-0.025]])
          b.box("border",[x0,0,z0],[x1,0.012,z1]);
        b.cup("container",[w*0.25,0,d*0.5],0.10,0.12,0.22,0.012);
        for(let i=0;i<5;i++) {
          const a=i*2*Math.PI/5;
          const x=w*0.25+0.11*Math.cos(a),z=d*0.5+0.11*Math.sin(a);
          b.beam("stem",[w*0.25,0.20,d*0.5],[x,0.48+0.04*(i%2),z],0.009,0.004,8);
          b.ellipsoid("foliage",[x,0.50+0.04*(i%2),z],[0.11,0.14,0.11]);
        }
        for(const face of ["field","border","container","stem","foliage"]) pending.delete(face);
        break;
      }
      if(pending.has("art-frame")) {
        const artHeight=Math.min(0.40,h*0.78),frame=0.025;
        b.box("art-frame",[-w/2,0,0],[-w/2+frame,artHeight,0.025]);
        b.box("art-frame",[w/2-frame,0,0],[w/2,artHeight,0.025]);
        b.box("art-frame",[-w/2+frame,0,0],[w/2-frame,frame,0.025]);
        b.box("art-frame",[-w/2+frame,artHeight-frame,0],[w/2-frame,artHeight,0.025]);
        b.box("art-print",[-w/2+frame,frame,0.018],[w/2-frame,artHeight-frame,0.021]);
        const x=w*0.25,z=d*0.70;
        b.cup("container",[x,0,z],0.065,0.075,0.14,0.008);
        for(let i=0;i<3;i++) {
          const a=i*2*Math.PI/3,px=x+0.07*Math.cos(a),pz=z+0.07*Math.sin(a);
          b.beam("stem",[x,0.14,z],[px,0.35,pz],0.005,0.003,8);
          b.ellipsoid("foliage",[px,0.37,pz],[0.075,0.09,0.075]);
        }
        for(const face of ["art-frame","art-print","container","stem","foliage"]) pending.delete(face);
        break;
      }
      if(pending.has("container")&&pending.has("lid")&&pending.has("basket")) {
        b.box("container",[-w/2,0,0],[-w/2+0.12,0.18,0.12]);
        b.box("lid",[-w/2,0.18,0],[-w/2+0.12,0.20,0.12]);
        b.box("box",[-0.09,0,0],[0.09,0.25,0.18]);
        const x=w/2-0.30,z=d-0.20,t=0.01;
        b.box("basket",[x,0,z],[x+0.30,0.015,z+0.20]);
        b.box("basket",[x,0.015,z],[x+t,0.15,z+0.20]);
        b.box("basket",[x+0.30-t,0.015,z],[x+0.30,0.15,z+0.20]);
        b.box("basket",[x+t,0.015,z],[x+0.30-t,0.15,z+t]);
        b.box("basket",[x+t,0.015,z+0.20-t],[x+0.30-t,0.15,z+0.20]);
        for(const face of ["container","lid","box","basket"]) pending.delete(face);
        break;
      }
      if(pending.has("board")&&pending.has("hook")) {
        b.box("board",[-w/2,h*0.77,0],[w/2,h*0.88,Math.min(0.025,d*0.1)]);
        for(let i=0;i<4;i++) {
          const x=-w*0.36+i*w*0.24;
          b.beam("hook",[x,h*0.78,0.02],[x,h*0.70,0.10],0.012,0.012,8);
        }
        for(const x of [-w*0.28,w*0.15])
          b.box("clothes",[x,h*0.05,0.10],[x+w*0.14,h*0.72,d*0.80]);
        for(const face of ["board","hook","clothes"]) pending.delete(face);
        break;
      }
      if(pending.has("board")&&pending.has("tool-steel")) {
        b.box("board",[-w/2,0,0],[w/2,h,0.025]);
        for(let i=0;i<3;i++) {
          const x=-w*0.35+i*w*0.30;
          b.box("tool-grip",[x,0.13,0.025],[x+0.045,0.48,0.075]);
          b.box("tool-steel",[x-0.02,0.48,0.025],[x+0.065,0.78-0.07*i,0.075]);
        }
        for(const x of [-w*0.30,w*0.10]) b.box("bin",[x,0.02,0.025],[x+w*0.19,0.16,0.14]);
        for(const face of ["board","tool-grip","tool-steel","bin"]) pending.delete(face);
        break;
      }
      // A cluster is a reusable model whose individually named components can
      // be moved together as set dressing. Every token below has a physical part.
      box("cutting-board",-w*0.42,0,0,w*0.15,0.02,d*0.35);
      cylinder("container",w*0.28,0,d*0.32,w*0.14,w*0.16,h*0.45);
      cylinder("bowl",0,0,d*0.67,w*0.20,w*0.20,h*0.22);
      if(pending.has("fruit")) {
        for(let i=0;i<5;i++) {
          const angle=i*2*Math.PI/5;
          b.ellipsoid("fruit",[0.07*Math.cos(angle),h*0.23,d*0.67+0.07*Math.sin(angle)],[0.035,0.035,0.035]);
        }
        pending.delete("fruit");
      }
      if(pending.has("utensil")) {
        for(let i=0;i<5;i++) {
          const x=w*0.28+(i-2)*0.018;
          b.beam("utensil",[x,h*0.37,d*0.32],[x+(i-2)*0.014,h*0.85,d*0.32],0.005,0.004,8);
        }
        pending.delete("utensil");
      }
      box("book",-w*0.42,0,d*0.04,-w*0.02,0.025,d*0.32);
      box("tray",-w*0.12,0,d*0.42,w*0.28,0.025,d*0.72);
      box("folded",-w*0.40,0,d*0.42,w*0.40,Math.max(0.025,h*0.20),d*0.78);
      box("pillow",-w*0.45,0,0,-w*0.05,h*0.60,d*0.45);
      box("art-frame",-w/2,0,0,w/2,h,0.025);
      box("art-print",-w/2+0.025,0.025,0.026,w/2-0.025,h-0.025,0.028);
      if(pending.has("stem")||pending.has("foliage")) {
        const count=spec.faces.includes("field")?5:3;
        for(let i=0;i<count;i++) {
          const angle=i*2*Math.PI/count,r=spec.faces.includes("field")?0.06:Math.min(w,d)*0.10;
          const x=w*0.28+r*Math.cos(angle),z=d*0.32+r*Math.sin(angle);
          if(pending.has("stem")) b.beam("stem",[w*0.28,h*0.40,d*0.32],[x,h*0.70,z],0.006,0.004,8);
          if(pending.has("foliage")) b.ellipsoid("foliage",[x,h*0.82,z],[w*0.09,h*0.14,w*0.09]);
        }
        pending.delete("stem"); pending.delete("foliage");
      }
      box("field",-w/2+0.025,0,0.025,w/2-0.025,0.008,d-0.025);
      box("border",-w/2,0,0,w/2,0.008,0.025);
      box("board",-w/2,0,0,w/2,pending.has("tool-steel")?h:h*0.13,Math.max(0.015,d*0.1));
      if(pending.has("hook")) {
        for(let i=0;i<5;i++) b.frustum("hook",[-w*0.38+i*w*0.19,h*0.13,Math.max(0.015,d*0.1)],0.012,0.012,h*0.10);
        pending.delete("hook");
      }
      box("clothes",-w*0.20,h*0.23,d*0.10,w*0.20,h,d*0.70);
      box("lid",w*0.14,h*0.44,d*0.17,w*0.42,h*0.49,d*0.47);
      box("box",-w*0.45,0,d*0.48,-w*0.10,h*0.50,d*0.90);
      box("basket",-w*0.02,0,d*0.56,w*0.37,h*0.37,d*0.94);
      if(pending.has("bin")) {
        for(const x of [-w*0.25,w*0.08]) b.box("bin",[x,h*0.12,d*0.13],[x+w*0.16,h*0.24,d*0.78]);
        pending.delete("bin");
      }
      if(pending.has("tool-steel")) {
        b.box("tool-steel",[-w*0.36,h*0.67,d*0.12],[-w*0.26,h*0.705,d*0.35]);
        b.box("tool-steel",[-w*0.04,h*0.43,d*0.12],[w*0.01,h*0.75,d*0.32]);
        b.box("tool-steel",[w*0.10,h*0.50,d*0.12],[w*0.30,h*0.66,d*0.32]);
        pending.delete("tool-steel");
      }
      if(pending.has("tool-grip")) {
        b.box("tool-grip",[-w*0.32,h*0.35,d*0.14],[-w*0.30,h*0.67,d*0.31]);
        b.box("tool-grip",[w*0.30,h*0.53,d*0.13],[w*0.37,h*0.64,d*0.33]);
        pending.delete("tool-grip");
      }
      break;
  }
  if (pending.size) throw Error(`${spec.id}: unbuilt surfaces ${[...pending].join(", ")}`);
  return b.finish();
}
