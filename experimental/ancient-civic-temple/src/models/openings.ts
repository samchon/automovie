/**
 * Door and clerestory prototypes from docs/models/openings.md. The reviewed
 * passage table supplies each clear size and wall depth. Geometry is local to
 * its threshold or hinge; instances still own wall placement and swing side.
 * Changing this family invalidates opening clearance and model-board views.
 */
import {
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import {
  modelBox,
  modelMesh,
  modelTorus,
  reviewedModel,
} from "../geometry/model-source-shapes";
import { templeClerestories, templeDoorPassages } from "../spaces/openings";

const p=(x:number,y:number,z:number)=>({ x,y,z });
const mesh=(part:string, add:(builder:ObjectMesh)=>void):IAutoMovieMesh=>{
  const b=new ObjectMesh();
  add(b);
  return modelMesh(b,part);
};
const box=(b:ObjectMesh,id:string,x0:number,y0:number,z0:number,
  x1:number,y1:number,z1:number)=>modelBox(b,id,p(x0,y0,z0),p(x1,y1,z1));

const posed=(model:IAutoMovieModel, pivot:{ x:number;z:number },state:"closed"|"open"):IAutoMovieModel=>{
  if(state==="closed") return model;
  const q={ x:0,y:-Math.SQRT1_2,z:0,w:Math.SQRT1_2 };
  return {
    ...model,
    parts:model.parts.map((part)=>{
      if(part.geometry.type!=="mesh") throw new Error(`${model.id}/${part.id}: mesh required`);
      const shifted=transformAutoMovieMesh(part.geometry.mesh, {
        translation:p(-pivot.x, 0, -pivot.z),
      });
      const rotated=transformAutoMovieMesh(shifted, { rotation:q });
      return {
        ...part,
        geometry:{
          type:"mesh" as const,
          mesh:transformAutoMovieMesh(rotated, {
            translation:p(pivot.x, 0, pivot.z),
          }),
        },
      };
    }),
  };
};

/** Four reviewed families preserve the clear opening and named moving leaf. */
export class TempleOpenings {
  /** Deep lining through the actual host thickness, plus two outer surrounds. */
  doorFrame(id:typeof templeDoorPassages[number]["id"]):IAutoMovieModel{
    const door=templeDoorPassages.find((entry)=>entry.id===id);
    if(door===undefined) throw new Error(`${id}: reviewed door missing`);
    const w=door.width,h=door.height,t=door.wallHigh-door.wallLow;
    const lining=mesh("lining", (b)=>{
      for(const side of [-1,1]){
        const inner=side*w/2,outer=side*(w/2+0.06);
        box(
          b,
          "lining",
          Math.min(inner, outer),
          0,
          -t/2,
          Math.max(inner, outer),
          h,
          t/2,
        );
      }
      box(b, "lining", -w/2-0.06, h, -t/2, w/2+0.06, h+0.06, t/2);
    });
    const surround=mesh("surround", (b)=>{
      for(const face of [-1,1]){
        const z0=face>0 ? t/2 : -t/2-0.03,z1=z0+0.03;
        for(const side of [-1,1]){
          const inner=side*(w/2+0.06),outer=side*(w/2+0.22);
          box(
            b,
            "surround",
            Math.min(inner, outer),
            0,
            z0,
            Math.max(inner, outer),
            h+0.06,
            z1,
          );
        }
        box(b, "surround", -w/2-0.06, h+0.06, z0, w/2+0.06, h+0.22, z1);
      }
    });
    return reviewedModel(`frame.${id}`, `석재 문틀 ${id}`, [
      ["lining", lining],
      ["surround", surround],
    ]);
  }

  /** One reviewed half leaf; its two-part door placement belongs to instances. */
  doubleLeaf(id:"door-entry"|"door-sanctuary",state:"closed"|"open"="closed"):IAutoMovieModel{
    const door=templeDoorPassages.find((entry)=>entry.id===id);
    if(door===undefined) throw new Error(`${id}: reviewed double door missing`);
    const w=door.width/2,h=door.height;
    const frame=mesh("frame",(b)=>{
      for(const [a,c] of [[0,0.10],[w-0.10,w]])
        box(b,"frame",a,0.01,-0.05,c,h,0);
      for(const [a,c] of [[0.01,0.17],[1.00,1.10],[h-0.10,h]])
        box(b,"frame",0.10,a,-0.05,w-0.10,c,0);
    });
    const panel=mesh("panel", (b)=>{
      box(b, "panel", 0.10, 0.17, -0.035, w-0.10, 1.00, -0.015);
      box(b, "panel", 0.10, 1.10, -0.035, w-0.10, h-0.10, -0.015);
    });
    const handleX=w-0.15;
    const plates=mesh("plate", (b)=>{
      for(const [z0,z1] of [[0,0.006],[-0.056,-0.05]]){
        const polygon=Array.from({ length:16 }, (_,i)=>{
          const a=2*Math.PI*i/16;
          return p(handleX+0.06*Math.cos(a), 1.05+0.06*Math.sin(a), z1);
        });
        b.face("plate", polygon);
        b.face(
          "plate",
          [...polygon].reverse().map((q)=> p(q.x, q.y, z0)),
        );
        for(let i=0;i<16;i++){
          const a=polygon[i]!,c=polygon[(i+1)%16]!;
          b.face("plate", [p(a.x, a.y, z0), p(c.x, c.y, z0), c, a]);
        }
      }
    });
    const ring=mergeAutoMovieMeshes([
      modelTorus(p(handleX, 1.05, 0.015), 0.054, 0.006, "xy", 16, 8),
      modelTorus(p(handleX, 1.05, -0.065), 0.054, 0.006, "xy", 16, 8),
    ]);
    const pin=mesh("pin", (b)=>{
      b.rod(
        "pin",
        p(handleX, 1.104, 0.006),
        p(handleX, 1.104, 0.015),
        0.006,
        12,
      );
      b.rod(
        "pin",
        p(handleX, 1.104, -0.056),
        p(handleX, 1.104, -0.065),
        0.006,
        12,
      );
    });
    const hinge=mesh("hinge",(b)=>{
      for(const y of [0.25,h-0.25])
        b.frustum("hinge",0.021,0,y-0.05,y+0.05,0.02,0.02,12);
    });
    return posed(
      reviewedModel(`door.double.${id}`, `양개 문짝 ${id}`, [
        ["frame", frame],
        ["panel", panel],
        ["plate", plates],
        ["pin", pin],
        ["ring", ring],
        ["hinge", hinge],
      ]),
      { x:0.021, z:0 },
      state,
    );
  }

  /** The fixed board has four recessed back seams and two front battens. */
  singleLeaf(id:"door-offering"|"door-administration"|"door-records"|
    "door-storage"|"door-yard"|"door-service-exterior",
    state:"closed"|"open"="closed"):IAutoMovieModel{
    const door=templeDoorPassages.find((entry)=>entry.id===id);
    if(door===undefined) throw new Error(`${id}: reviewed single door missing`);
    const w=door.width,h=door.height;
    const board=mesh("board",(b)=>{
      box(b,"board",0,0.01,-0.046,w,h,0);
      for(let i=0;i<5;i++) box(b,"board",
        i*w/5+(i===0?0:0.005),0.01,-0.05,
        (i+1)*w/5-(i===4?0:0.005),h,-0.046);
    });
    const batten=mesh("batten", (b)=>{
      for(const y of [0.25,h-0.40]) box(b,"batten",0,y,0,w,y+0.12,0.025);
    });
    const strap=mesh("strap", (b)=>{
      for(const y of [0.31,h-0.34]) box(b,"strap",0,y-0.02,0.025,0.6*w,y+0.02,0.031);
    });
    const ring=mergeAutoMovieMeshes([
      modelTorus(p(w-0.12, 1.05, 0.025), 0.045, 0.005, "xy", 16, 8),
      modelTorus(p(w-0.12, 1.05, -0.063), 0.045, 0.005, "xy", 16, 8),
    ]);
    const pin=mesh("pin",(b)=>{
      b.rod("pin",p(w-0.12,1.095,0),p(w-0.12,1.095,0.025),0.006,12);
      b.rod("pin",p(w-0.12,1.095,-0.05),p(w-0.12,1.095,-0.063),0.006,12);
    });
    return posed(
      reviewedModel(`door.single.${id}`, `외개 문짝 ${id}`, [
        ["board", board],
        ["batten", batten],
        ["strap", strap],
        ["pin", pin],
        ["ring", ring],
      ]),
      { x:0, z:0.031 },
      state,
    );
  }

  /** Four-sided lining and an outer-only trim leave a real 0.4 m square void. */
  windowFrame(thickness:0.30|0.60):IAutoMovieModel{
    if(!templeClerestories().some((entry)=>
      Math.abs(entry.wallHigh-entry.wallLow-thickness)<1e-8))
      throw new Error(`${thickness}: no reviewed clerestory host`);
    const t=thickness;
    const lining=mesh("lining",(b)=>{
      for(const side of [-1,1]){
        const a=side*0.20,c=side*0.26;
        box(b,"lining",Math.min(a,c),-0.06,-t/2,
          Math.max(a,c),0.46,t/2);
        box(b,"lining",-0.20,side>0?0.40:-0.06,-t/2,
          0.20,side>0?0.46:0,t/2);
      }
    });
    const surround=mesh("surround", (b)=>{
      for(const side of [-1,1]){
        const a=side*0.26,c=side*0.36;
        box(
          b,
          "surround",
          Math.min(a, c),
          -0.16,
          t/2,
          Math.max(a, c),
          0.56,
          t/2+0.03,
        );
        box(
          b,
          "surround",
          -0.26,
          side>0 ? 0.46 : -0.16,
          t/2,
          0.26,
          side>0 ? 0.56 : -0.06,
          t/2+0.03,
        );
      }
    });
    return reviewedModel(`frame.window.${t}`, `채광구 틀 ${t}m`, [
      ["lining", lining],
      ["surround", surround],
    ]);
  }
}
