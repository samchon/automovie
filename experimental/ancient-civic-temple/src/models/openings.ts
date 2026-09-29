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
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieMovablePanel,
  IAutoMovieOpeningOperation,
} from "@automovie/interface";
import { ObjectMesh } from "../geometry/object-mesh";
import {
  modelBox,
  modelMesh,
  modelTorus,
  reviewedModel,
} from "../geometry/model-source-shapes";
import { TempleRectilinearUnion } from "./rectilinear-union";
import { templeClerestories, templeDoorPassages } from "../spaces/openings";

const p=(x:number,y:number,z:number)=>({ x,y,z });
type RectilinearSolid=Parameters<typeof TempleRectilinearUnion.mesh>[1][number];
const mesh=(part:string, add:(builder:ObjectMesh)=>void):IAutoMovieMesh=>{
  const b=new ObjectMesh();
  add(b);
  return modelMesh(b,part);
};
const rectMesh=(part:string, add:(solids:RectilinearSolid[])=>void):IAutoMovieMesh=>{
  const solids:RectilinearSolid[]=[];
  add(solids);
  return TempleRectilinearUnion.mesh(part,solids);
};
const box=(b:ObjectMesh|RectilinearSolid[],id:string,x0:number,y0:number,z0:number,
  x1:number,y1:number,z1:number,
  grain?:"x"|"y"):void=>{
  const min=p(x0,y0,z0),max=p(x1,y1,z1);
  const direction=grain===undefined?undefined:grain==="x"?p(1,0,0):p(0,1,0);
  if(Array.isArray(b)) b.push({ min,max,grain:direction });
  else modelBox(
    b,
    id,
    min,
    max,
    direction===undefined ? undefined : { origin:min, direction },
  );
};

/** Z-axis pin: U follows the face-facing rim, and V follows its Z direction. */
const pinZ=(b:ObjectMesh,id:string,x:number,y:number,z0:number,z1:number,
  radius:number,segments:number,direction:1|-1):void=>{
  const low=Math.min(z0,z1),high=Math.max(z0,z1);
  const ring=(z:number)=>Array.from({ length:segments }, (_,i)=>{
    const a=direction*2*Math.PI*i/segments;
    return p(x+radius*Math.cos(a), y+radius*Math.sin(a), z);
  });
  const a=ring(direction>0?low:high),c=ring(direction>0?high:low);
  b.face(id,[...a].reverse());
  b.face(id,c);
  for(let i=0;i<segments;i++){
    const next=(i+1)%segments;
    const u0=2*Math.PI*radius*i/segments,u1=2*Math.PI*radius*(i+1)/segments;
    const v0=direction>0?low:0,v1=direction>0?high:high-low;
    b.face(
      id,
      [a[i]!, a[next]!, c[next]!, c[i]!],
      [
        [u0, v0],
        [u1, v0],
        [u1, v1],
        [u0, v1],
      ],
    );
  }
};

const posed=(model:IAutoMovieModel, pivot:{ x:number;z:number },state:"closed"|"open"):IAutoMovieModel=>{
  if(state==="closed") return model;
  if(state!=="open") throw new Error(
    `${model.id}: unsupported door state ${state}`,
  );
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

/**
 * Builds the passage-specific stone frames and timber leaves.
 * @evidence models/openings.md This class exposes the four opening prototypes, keyed by reviewed door passages or clerestory wall thickness.
 * @evidence principles/core/source-units.md#source-scope-preservation The methods take passage dimensions from spaces and leave wall placement and swing orientation to instances.
 * @evidence principles/core/source-units.md#source-substantive-completion Each builder emits named lining, surround, leaf, hardware, or window mesh parts; doorOperation also supplies usable panel states.
 * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The four H2s give frame, leaf, hardware, and window dimensions, and the builders consume those reviewed inputs without adding an opening family.
 * @evidence obligations/design/model-sources.md#design-owned-construction The opening H2s govern the emitted frame and leaf geometry, while spaces owns each passage size and wall depth.
 */
export class TempleOpenings {
  /**
   * Building opening operation over closed rest meshes; instances name and orient leaves.
   * @evidence models/openings.md#double-door-leaf The paired passage IDs produce two separately named Y-axis hinge panels, each with closed and 90-degree open states.
   * @evidence models/openings.md#single-door-leaf Each single passage produces one Y-axis hinge panel with the reviewed closed and open limits.
   * @evidence principles/core/source-units.md#source-scope-preservation It takes the passage ID and caller-owned leaf elements, without choosing the door's world placement.
   * @evidence principles/core/source-units.md#source-substantive-completion It returns complete panel pivots, widths, heights, angular limits, and both operation states for the reviewed passage.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The paired passage IDs and articulation H2 already distinguish two hinges from one, so this method adds no new motion state.
   */
  doorOperation(id:typeof templeDoorPassages[number]["id"],
    leaves:readonly { leafId:string;element:string }[]):IAutoMovieOpeningOperation{
    const door=templeDoorPassages.find((entry)=>entry.id===id);
    if(door===undefined) throw new Error(`${id}: reviewed door missing`);
    const paired=id==="door-entry"||id==="door-sanctuary";
    if(leaves.length!==(paired?2:1))
      throw new Error(`${id}: expected ${paired?2:1} leaf elements`);
    if(new Set(leaves.map((leaf)=>leaf.leafId)).size!==leaves.length ||
      new Set(leaves.map((leaf)=>leaf.element)).size!==leaves.length ||
      leaves.some((leaf)=>!leaf.leafId||!leaf.element))
      throw new Error(`${id}: leaves need distinct stable ids and elements`);
    const panels:IAutoMovieMovablePanel[]=leaves.map((leaf)=>({
      id:`hinge.${leaf.leafId}`,
      element:leaf.element,
      width:door.width/(paired?2:1),
      height:door.height-0.01,
      motion:{
        kind:"revolute",
        axis:p(0, 1, 0),
        pivot:p(paired ? 0.021 : 0, 0, paired ? 0 : 0.031),
        min:-Math.PI/2,
        max:0,
      },
    }));
    return {
      panels,
      states:[
        {
          id:"closed",
          panels:panels.map((panel)=>({ panel:panel.id, value:0 })),
        },
        {
          id:"open",
          panels:panels.map((panel)=>({ panel:panel.id, value:-Math.PI/2 })),
        },
      ],
      state:"open",
      hardware:[],
    };
  }

  /**
   * Deep lining through the actual host thickness, plus two outer surrounds.
   * @evidence models/openings.md#door-frame The passage width, height, frame, and wall thickness set the three-sided lining and 0.16 m outer surrounds on both wall faces.
   * @evidence principles/core/source-units.md#source-scope-preservation It uses the reviewed passage's frame allowance and emits no wall solid or placement transform.
   * @evidence principles/core/source-units.md#source-substantive-completion Lining and surround are separately triangulated mesh parts spanning the full jambs and head on each face.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The door-frame H2 specifies lining depth and trim profile; door.frame owns the common 0.06 m allowance.
   * @evidence obligations/design/model-sources.md#design-owned-construction The source builds the stone lintel and jamb ring from each host passage instead of copying one door's geometry to all eight.
   */
  doorFrame(id:typeof templeDoorPassages[number]["id"]):IAutoMovieModel{
    const door=templeDoorPassages.find((entry)=>entry.id===id);
    if(door===undefined) throw new Error(`${id}: reviewed door missing`);
    const w=door.width,h=door.height,t=door.wallHigh-door.wallLow;
    const frame=door.frame,trim=0.16;
    const lining=rectMesh("lining", (b)=>{
      for(const side of [-1,1]){
        const inner=side*w/2,outer=side*(w/2+frame);
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
      box(b, "lining", -w/2-frame, h, -t/2, w/2+frame, h+frame, t/2);
    });
    const surround=rectMesh("surround", (b)=>{
      for(const face of [-1,1]){
        const z0=face>0 ? t/2 : -t/2-0.03,z1=z0+0.03;
        for(const side of [-1,1]){
          const inner=side*(w/2+frame),outer=side*(w/2+frame+trim);
          box(
            b,
            "surround",
            Math.min(inner, outer),
            0,
            z0,
            Math.max(inner, outer),
            h+frame,
            z1,
          );
        }
        box(
          b,
          "surround",
          -w/2-frame-trim,
          h+frame,
          z0,
          w/2+frame+trim,
          h+frame+trim,
          z1,
        );
      }
    });
    return reviewedModel(`frame.${id}`, `석재 문틀 ${id}`, [
      ["lining", lining],
      ["surround", surround],
    ]);
  }

  /**
   * One reviewed half leaf; its two-part door placement belongs to instances.
   * @evidence models/openings.md#double-door-leaf This method emits the half-width frame, inset panels, paired plate/ring/pin hardware, and two hinges for the entry and sanctuary leaves.
   * @evidence principles/core/source-units.md#source-scope-preservation It uses the passage width and height and keeps the half leaf at its local hinge; paired placement remains with instances.
   * @evidence principles/core/source-units.md#source-substantive-completion Six stable mesh parts include the reviewed closed leaf and an open pose rotated about the local hinge pivot.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The double-door H2 fixes panel bands, hardware sizes, hinge side and two states; no new leaf profile is chosen here.
   * @evidence obligations/design/model-sources.md#deterministic-build The two named passage IDs and state determine fixed loop counts, part order and a reproducible hinge transform.
   */
  doubleLeaf(id:"door-entry"|"door-sanctuary",state:"closed"|"open"="closed"):IAutoMovieModel{
    const door=templeDoorPassages.find((entry)=>entry.id===id);
    if(door===undefined) throw new Error(`${id}: reviewed double door missing`);
    const w=door.width/2,h=door.height;
    const frame=rectMesh("frame",(b)=>{
      for(const [a,c] of [[0,0.10],[w-0.10,w]])
        box(b,"frame",a,0.01,-0.05,c,h,0,"y");
      for(const [a,c] of [[0.01,0.17],[1.00,1.10],[h-0.10,h]])
        box(b,"frame",0.10,a,-0.05,w-0.10,c,0,"x");
    });
    const panel=mesh("panel", (b)=>{
      box(b, "panel", 0.10, 0.17, -0.035, w-0.10, 1.00, -0.015, "y");
      box(b, "panel", 0.10, 1.10, -0.035, w-0.10, h-0.10, -0.015, "y");
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
      pinZ(b, "pin", handleX, 1.104, 0.006, 0.015, 0.006, 12, 1);
      pinZ(b, "pin", handleX, 1.104, -0.056, -0.065, 0.006, 12, -1);
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

  /**
   * The fixed board has four recessed back seams and two front battens.
   * @evidence models/openings.md#single-door-leaf The passage width and height set the five board strips, two battens and straps, paired rings and pins for each single-leaf door.
   * @evidence principles/core/source-units.md#source-scope-preservation It emits a local leaf for the six reviewed single passages without choosing their wall positions.
   * @evidence principles/core/source-units.md#source-substantive-completion Board, batten, strap, pin and ring are separate mesh parts in closed and hinge-rotated open states.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The single-door H2 supplies all board, batten and metal dimensions; the builder changes width by passage rather than inventing a seventh door.
   * @evidence obligations/design/model-sources.md#design-owned-construction The emitted strip and hardware geometry is computed from the selected passage, preserving the common reviewed part names.
   */
  singleLeaf(id:"door-offering"|"door-administration"|"door-records"|
    "door-storage"|"door-yard"|"door-service-exterior",
    state:"closed"|"open"="closed"):IAutoMovieModel{
    const door=templeDoorPassages.find((entry)=>entry.id===id);
    if(door===undefined) throw new Error(`${id}: reviewed single door missing`);
    const w=door.width,h=door.height;
    const board=rectMesh("board",(b)=>{
      box(b,"board",0,0.01,-0.046,w,h,0,"y");
      for(let i=0;i<5;i++) box(b,"board",
        i*w/5+(i===0?0:0.005),0.01,-0.05,
        (i+1)*w/5-(i===4?0:0.005),h,-0.046,"y");
    });
    const batten=mesh("batten", (b)=>{
      for(const y of [0.25,h-0.40]) box(b,"batten",0,y,0,w,y+0.12,0.025,"x");
    });
    const strap=mesh("strap", (b)=>{
      for(const y of [0.31,h-0.34]) box(b,"strap",0,y-0.02,0.025,0.6*w,y+0.02,0.031,"x");
    });
    const ring=mergeAutoMovieMeshes([
      modelTorus(p(w-0.12, 1.05, 0.025), 0.045, 0.005, "xy", 16, 8),
      modelTorus(p(w-0.12, 1.05, -0.063), 0.045, 0.005, "xy", 16, 8),
    ]);
    const pin=mesh("pin", (b)=>{
      pinZ(b, "pin", w-0.12, 1.095, 0, 0.025, 0.006, 12, 1);
      pinZ(b, "pin", w-0.12, 1.095, -0.05, -0.063, 0.006, 12, -1);
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

  /**
   * Four-sided lining and an outer-only trim leave a real 0.4 m square void.
   * @evidence models/openings.md#window-frame The clerestory host supplies 0.4 m clear dimensions and frame width; the builder surrounds that local void through the selected wall depth.
   * @evidence principles/core/source-units.md#source-scope-preservation It selects an existing 0.30 or 0.60 m host and leaves the window's world center and sill with spaces and instances.
   * @evidence principles/core/source-units.md#source-substantive-completion Four lining bars and four exterior surround bars form separate mesh parts with the center left open.
   * @evidenceExclude upstream/design/model-sources.md#design-revision-from-model-source-work The window-frame H2 fixes the clear square and 0.10 m outer trim with 0.03 m projection; the host supplies the clear dimensions and inner frame, so this builder exposes no missing parent choice.
   * @evidence obligations/design/model-sources.md#design-owned-construction The model derives its bounds from host.clearWidth, clearHeight and frame and does not create a pane or shutter.
   */
  windowFrame(thickness:0.30|0.60):IAutoMovieModel{
    const host=templeClerestories().find((entry)=>
      Math.abs(entry.wallHigh-entry.wallLow-thickness)<1e-8);
    if(host===undefined)
      throw new Error(`${thickness}: no reviewed clerestory host`);
    const t=thickness;
    const frame=host.frame,half=host.clearWidth/2;
    const openingTop=frame+host.clearHeight,voidTop=openingTop+frame;
    const trim=0.10;
    const lining=rectMesh("lining", (b)=>{
      for(const side of [-1,1]){
        const a=side*half,c=side*(half+frame);
        box(b, "lining", Math.min(a, c), 0, -t/2, Math.max(a, c), voidTop, t/2);
        box(
          b,
          "lining",
          -half,
          side>0 ? openingTop : 0,
          -t/2,
          half,
          side>0 ? voidTop : frame,
          t/2,
        );
      }
    });
    const surround=rectMesh("surround", (b)=>{
      for(const side of [-1,1]){
        const a=side*(half+frame),c=side*(half+frame+trim);
        box(
          b,
          "surround",
          Math.min(a, c),
          -trim,
          t/2,
          Math.max(a, c),
          voidTop+trim,
          t/2+0.03,
        );
        box(
          b,
          "surround",
          -half-frame,
          side>0 ? voidTop : -trim,
          t/2,
          half+frame,
          side>0 ? voidTop+trim : 0,
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
