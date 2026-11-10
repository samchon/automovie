import { AutoMovieBernstein64, AutoMovieCurveMath64, generateAutoMovieContourLoft64, type IAutoMovieContourLoft64, type IAutoMovieCurve64 } from "@automovie/engine";

import inputs from "./AutoMovieHumanHeadF1JunctionInputs.json";

/** One emitted ordinary operator range, retaining its original interval ownership. */
type Primitive = NonNullable<IAutoMovieContourLoft64.IResult["primitiveRanges"]>[number];

/** The fixed F1 head's contour-owned junctions in their declared world charts. */
export namespace AutoMovieHumanHeadF1Junctions {
  /** One locally generated indexed skin and the exact named boundary walks it emits. */
  export interface IOutput {
    /** Absolute ISB world millimetres and newly generated triangles. */
    mesh: { positions: number[]; indices: number[] };

    /** Actual ordered indices of the output's named rails. */
    rails: Map<string, number[]>;

    /**
     * Records from this same kernel invocation, before any physical cap removal.
     * Primitive ordinals address that pre-removal buffer, not the final mesh.
     * Absent only for the older named-junction path, which does not publish them.
     * Their qualification flags do not certify injectivity or visual quality.
     */
    observations?: Pick<IAutoMovieContourLoft64.IResult, "primitiveRanges" | "stripObservations" | "interactionObservations" | "unresolved">;
  }

  /** Replay an accepted F1 contour branch using its exact knots and signed incidence. */
  export function of(name: string): IOutput {
    const data = inputs.find((item): boolean => item.name === name);
    if (data === undefined) throw new Error(`No recorded F1 head junction named ${name}`);
    const sections: IAutoMovieContourLoft64.ISection[] = data.sections.map(({ coordinateMm, loops }) => ({
      coordinateMm,
      loops: loops.map(({ winding, curve }) => ({
        winding: winding === -1 ? -1 : 1,
        curve: {
          type: "cubicBezier", name: curve.name, closed: true, unit: "mm", phaseUnit: "mm", phaseIntervals: curve.phaseIntervals,
          spans: curve.spans.map((span): IAutoMovieCurve64.Span => [
            AutoMovieCurveMath64.clone(span[0]!), AutoMovieCurveMath64.clone(span[1]!),
            AutoMovieCurveMath64.clone(span[2]!), AutoMovieCurveMath64.clone(span[3]!),
          ]),
        },
      })),
    }));
    const events: IAutoMovieContourLoft64.IEvent[] = data.events.map((event): IAutoMovieContourLoft64.IEvent => {
      const kind: string = event.kind;
      if (kind !== "minimum" && kind !== "maximum" && kind !== "saddle") throw new Error(`Invalid F1 event at ${event.name}`);
      return { ...event, kind, terminal: event.terminal === null ? null : AutoMovieCurveMath64.clone(event.terminal) };
    });
    const positions: number[] = [];
    const indices: number[] = [];
    const vertices: Map<IAutoMovieCurve64.Vector, number> = new Map();
    const rails: Map<string, number[]> = new Map();
    const result: ReturnType<typeof generateAutoMovieContourLoft64> = generateAutoMovieContourLoft64(
      { sections, intervals: data.intervals, events, chordToleranceMm: data.chordToleranceMm },
      {
        vertex: (index: number, point: IAutoMovieCurve64.Vector): void => { vertices.set(point, index); positions.push(point[0], point[1], -point[2]); },
        triangle: (a: number, b: number, c: number): void => { indices.push(a, c, b); },
        construction: (id: string, points: readonly IAutoMovieCurve64.Vector[]): void => {
          const key: RegExpExecArray | null = /\.section\.(\d+)\.loop\.(\d+)$/.exec(id);
          const row: (number | undefined)[] = points.map((point: IAutoMovieCurve64.Vector): number | undefined => vertices.get(point));
          if (key !== null && row.every((index: number | undefined): index is number => index !== undefined)) rails.set(`${key[1]}:${key[2]}`, row);
        },
      },
    );
    let keep: readonly Primitive[] | null = null;
    if (name === "forehead exterior") {
      keep = data.intervals.flatMap((interval): Primitive[] => {
        const group: number = interval.groups.findIndex((item): boolean => item.supported && item.before.includes(0) && item.after.includes(0));
        const part: Primitive | undefined = result.primitiveRanges?.find((row: Primitive): boolean =>
          row.kind === "strip" && row.triangleCount > 0 && row.beforeMm === interval.beforeMm && row.afterMm === interval.afterMm && row.group === group);
        const qualified: boolean = result.stripObservations?.some((row): boolean =>
          row.qualified && row.beforeMm === interval.beforeMm && row.afterMm === interval.afterMm && row.group === group) === true;
        return part === undefined || !qualified ? [] : [part];
      });
      if (keep.length !== data.intervals.length) throw new Error("The recorded F1 forehead is incomplete");
      rails.set("forehead:top", rails.get(`${sections.length - 1}:0`)!);
    } else if (result.unresolved.length !== 0) throw new Error(`The fixed F1 head junction ${name} has unresolved source incidence`);
    if (data.lastExterior !== undefined) {
      const cutoff: number = sections[data.lastExterior - data.first]!.coordinateMm;
      keep = (result.primitiveRanges ?? []).filter((range: Primitive): boolean =>
        range.beforeMm < cutoff || !data.intervals.find((interval): boolean => interval.beforeMm === range.beforeMm)?.groups[range.group]?.before.includes(0));
    }
    if (name === "mouth aperture") {
      rails.set("mouth:first", rails.get("0:0")!);
      rails.set("mouth:last", rails.get(`${sections.length - 1}:0`)!);
    }
    const faces: number[] = keep === null ? indices : keep.flatMap((range: Primitive): number[] =>
      indices.slice(3 * range.firstTriangle, 3 * (range.firstTriangle + range.triangleCount)));
    return { mesh: { positions, indices: faces }, rails };
  }

  /** World-mm numeric sections and original component incidence for one fixed F1 head course. */
  export interface IClosedHead {
    /** Actual cutting frame; u cross v equals n, with no runtime reference dependency. */
    frame: { u: readonly number[]; v: readonly number[] };
    /** Every declared closed curve, including both children at actual split sections. */
    sections: readonly {
      /** Signed distance in mm along the measured observation normal. */
      coordinateMm: number;
      /** Signed material side and the exact ordered source PL controls. */
      loops: readonly {
        /** Actual material-side publication, independent of raw curve visit sense. */
        winding: number;
        /** Declared physical PL points, or original measured knots for an unchanged cubic. */
        pointsMm: readonly (readonly number[])[];
        /** Null is physical skin; other tags belong only to observation support. */
        segmentDomains: readonly ("lower"|"upper"|null)[];
        /** Complete offline cubic controls; null retains exact PL port segments. */
        curve: { spans: readonly (readonly (readonly number[])[])[]; phaseIntervals: readonly number[] } | null;
      }[];
    }[];
    /** Complete source-owned section correspondence, never geometric nearest matching. */
    intervals: readonly IAutoMovieContourLoft64.IInterval[];
    /** Original source criticals with their actual branches and extremum points. */
    events: readonly IAutoMovieContourLoft64.IEvent[];
    /** Original physical port curves; these are ownership keys, never a positional weld. */
    boundary: readonly { name: string; pointsMm: readonly (readonly number[])[] }[];
    /** Physical lower and upper world-Y port values in mm. */
    boundsMm: readonly number[];
    /** Literal global source point-sections; their raw contact publication remains unqualified. */
    endpoints: readonly {
      /** Exact adjacent observation interval, in the turned station chart. */
      beforeMm: number; afterMm: number;
      /** Finite original section and loop owned by this first/last point section. */
      sectionMm: number; loop: number;
      /** Incoming and outgoing closed-curve counts from the actual source group. */
      incoming: number; outgoing: number;
      /** The original isolated source vertex in world mm, never a centroid. */
      pointMm: readonly number[];
    }[];
  }

  /**
   * Generate the complete fixed F1 head with the existing ordinary operator.
   * All observed children remain explicit. The planar closure used only to
   * measure an original port domain is excluded by its actual source span
   * ownership; it is not emitted as skin or used to close an aperture.
   * Oral walls share this source family and are not added twice. Explicit
   * reference-artifact reconnections belong to the numeric inputs; they are
   * not inferred here or hidden by a material-label exception.
   */
  export function head(data: IClosedHead): IOutput {
    /** Mutable engine vector in the fixed world-mm chart. */
    type Vector = IAutoMovieCurve64.Vector;
    const positive: { points: Vector[]; domains: readonly ("lower"|"upper"|null)[]; prefix: number[] }[][] = [];
    const sections: IAutoMovieContourLoft64.ISection[] = data.sections.map((section, si: number): IAutoMovieContourLoft64.ISection => {
      positive[si]=[];
      return { coordinateMm: section.coordinateMm, loops: section.loops.map((loop, li: number): IAutoMovieContourLoft64.ISection["loops"][number] => {
        const points: Vector[]=loop.pointsMm.map(AutoMovieCurveMath64.clone);
        let domains: readonly ("lower"|"upper"|null)[]=loop.segmentDomains;
        const project=(p: Vector, axis: readonly number[]): number => p[0]*axis[0]!+p[1]*axis[1]!+p[2]*axis[2]!;
        let area: number=points.reduce((sum: number,a: Vector,i: number): number=>{
          const b: Vector=points[(i+1)%points.length]!;
          const pa: Vector=AutoMovieCurveMath64.sub(a,points[0]!);
          const pb: Vector=AutoMovieCurveMath64.sub(b,points[0]!);
          return sum+project(pa,data.frame.u)*project(pb,data.frame.v)-project(pb,data.frame.u)*project(pa,data.frame.v);
        },0);
        // A sparse knot polygon can have the opposite area sign from its
        // actual cubic. Integrate x*y'-y*x' from the retained Bernstein
        // controls; translating by the first point reduces cancellation.
        if(loop.curve!==null)area=loop.curve.spans.reduce((sum:number,span:readonly (readonly number[])[]):number=>{
          const x:number[]=span.map((p:readonly number[]):number=>project(AutoMovieCurveMath64.sub(AutoMovieCurveMath64.clone(p),points[0]!),data.frame.u));
          const y:number[]=span.map((p:readonly number[]):number=>project(AutoMovieCurveMath64.sub(AutoMovieCurveMath64.clone(p),points[0]!),data.frame.v));
          const dx:number[]=[0,1,2].map((i:number):number=>3*(x[i+1]!-x[i]!));
          const dy:number[]=[0,1,2].map((i:number):number=>3*(y[i+1]!-y[i]!));
          return sum+(AutoMovieBernstein64.product(x,dy).reduce((a:number,b:number):number=>a+b,0)
            -AutoMovieBernstein64.product(y,dx).reduce((a:number,b:number):number=>a+b,0))/6;
        },0);
        if(!Number.isFinite(area)||area===0)throw new Error("An actual F1 generating curve has no signed planar area");
        if(area<0){points.reverse();domains=domains.map((_:unknown,i:number)=>loop.segmentDomains[(loop.segmentDomains.length-2-i+loop.segmentDomains.length)%loop.segmentDomains.length]!);}
        const prefix: number[]=[0];
        let phaseIntervals:number[]=[];
        let spans: IAutoMovieCurve64.Span[]=points.map((a: Vector,i: number): IAutoMovieCurve64.Span=>{
          const b: Vector=points[(i+1)%points.length]!;
          const length: number=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
          if(!(length>0))throw new Error("An observed fixed-head-course curve has a collapsed source edge");
          phaseIntervals.push(length);
          prefix.push(prefix.at(-1)!+length);
          return [a,[a[0]+(b[0]-a[0])/3,a[1]+(b[1]-a[1])/3,a[2]+(b[2]-a[2])/3],
            [a[0]+2*(b[0]-a[0])/3,a[1]+2*(b[1]-a[1])/3,a[2]+2*(b[2]-a[2])/3],b];
        });
        if(loop.curve!==null){
          const controls:IAutoMovieCurve64.Span[]=loop.curve.spans.map((span):IAutoMovieCurve64.Span=>[
            AutoMovieCurveMath64.clone(span[0]!),AutoMovieCurveMath64.clone(span[1]!),
            AutoMovieCurveMath64.clone(span[2]!),AutoMovieCurveMath64.clone(span[3]!),
          ]);
          if(controls.length!==points.length||loop.curve.phaseIntervals.length!==controls.length||domains.some((domain):boolean=>domain!==null))
            throw new Error("A reduced physical source curve changed its domain or control population");
          spans=area<0?controls.map((_:IAutoMovieCurve64.Span,i:number):IAutoMovieCurve64.Span=>{
            const span:IAutoMovieCurve64.Span=controls[(controls.length-2-i+controls.length)%controls.length]!;
            return [span[3],span[2],span[1],span[0]];
          }):controls;
          const widths:readonly number[]=area<0?loop.curve.phaseIntervals.map((_:number,i:number):number=>
            loop.curve!.phaseIntervals[(controls.length-2-i+controls.length)%controls.length]!):loop.curve.phaseIntervals;
          phaseIntervals=Array.from(widths);
          prefix.length=1;
          for(const width of widths){if(!(width>0))throw new Error("A reduced source curve has a collapsed phase interval");prefix.push(prefix.at(-1)!+width);}
        }
        positive[si]!.push({points,domains,prefix});
        if(loop.winding!==1&&loop.winding!==-1)throw new Error("The fixed head course is missing its actual material publication");
        return {winding:loop.winding,curve:{type:"cubicBezier",name:`head.fixed.direct.${si}.${li}`,closed:true,unit:"mm",phaseUnit:"mm",
          spans,phaseIntervals}};
      })};
    });
    const positions: number[]=[], indices: number[]=[];
    const ids: Map<Vector,number>=new Map(), masks: Map<number,number>=new Map();
    const generated: Map<string,number[]>=new Map();
    const poles: Map<string,number>=new Map();
    for(const boundary of data.boundary)for(const p of boundary.pointsMm){
      const key: string=p.join(",");
      poles.set(key,(poles.get(key)??0)|(boundary.name==="lower"?1:2));
    }
    const result: ReturnType<typeof generateAutoMovieContourLoft64>=generateAutoMovieContourLoft64(
      {sections,intervals:data.intervals,events:data.events,chordToleranceMm:0.1},{
        vertex:(index: number,p: Vector):void=>{ids.set(p,index);positions.push(...p);masks.set(index,poles.get(p.join(","))??0);},
        triangle:(a: number,b: number,c: number):void=>{indices.push(a,b,c);},
        construction:(id: string,points: readonly Vector[],phase:(p:Vector)=>number):void=>{
          const address:RegExpExecArray|null=/\.section\.(\d+)\.loop\.(\d+)$/.exec(id);
          if(address===null)throw new Error("The fixed head course lost its actual generating curve address");
          const row: { points: Vector[]; domains: readonly ("lower"|"upper"|null)[]; prefix: number[] }=positive[Number(address[1])]![Number(address[2])]!;
          const period:number=row.prefix.at(-1)!;
          const rail:number[]=[];
          for(const p of points){
            let index:number|undefined=ids.get(p);
            if(index===undefined){index=positions.length/3;positions.push(...p);ids.set(p,index);}
            rail.push(index);
            const raw:number=phase(p), value:number=raw-Math.floor(raw/period)*period;
            let mask:number=masks.get(index)??0;
            for(let i:number=0;i<row.domains.length;i++){
              const kind: "lower"|"upper"|null|undefined=row.domains[i];
              if(kind!==null&&kind!==undefined&&value>=row.prefix[i]!&&value<=row.prefix[i+1]!)mask|=kind==="lower"?1:2;
            }
            masks.set(index,mask);
          }
          generated.set(data.sections[Number(address[1])]!.coordinateMm+":"+address[2],rail);
        },
      });
    const observations: NonNullable<IOutput["observations"]> = {
      primitiveRanges: result.primitiveRanges, stripObservations: result.stripObservations,
      interactionObservations: result.interactionObservations, unresolved: result.unresolved,
    };
    const unresolved=result.unresolved.filter((item):boolean=>!data.endpoints.some((end):boolean=>
      item.beforeMm===end.beforeMm&&item.afterMm===end.afterMm&&item.incoming===end.incoming&&item.outgoing===end.outgoing));
    if(unresolved.length!==0)throw new Error("The fixed head course has unresolved original contour incidence and actual kernel observations: "+JSON.stringify(observations));
    for(const end of data.endpoints){
      const rail:number[]|undefined=generated.get(end.sectionMm+":"+end.loop);
      if(rail===undefined||rail.length<3)throw new Error("A literal source point-section lacks its finite original curve");
      const uses:Map<string,number>=new Map();
      for(let i:number=0;i<indices.length;i+=3)for(let j:number=0;j<3;j++){
        const key:string=indices[i+j]+":"+indices[i+(j+1)%3];uses.set(key,(uses.get(key)??0)+1);
      }
      const forward:boolean=rail.every((a:number,i:number):boolean=>uses.get(a+":"+rail[(i+1)%rail.length])===1&&!uses.has(rail[(i+1)%rail.length]+":"+a));
      const backward:boolean=rail.every((a:number,i:number):boolean=>uses.get(rail[(i+1)%rail.length]+":"+a)===1&&!uses.has(a+":"+rail[(i+1)%rail.length]));
      if(forward===backward)throw new Error("A literal source extremum does not own one coherent finite free ring");
      const apex:number=positions.length/3;positions.push(...end.pointMm);masks.set(apex,poles.get(end.pointMm.join(","))??0);
      for(let i:number=0;i<rail.length;i++)indices.push(apex,forward?rail[(i+1)%rail.length]!:rail[i]!,forward?rail[i]!:rail[(i+1)%rail.length]!);
    }
    const retained:number[]=[];
    for(let i:number=0;i<indices.length;i+=3){
      const common:number=(masks.get(indices[i]!)??0)&(masks.get(indices[i+1]!)??0)&(masks.get(indices[i+2]!)??0);
      if(common===0)retained.push(indices[i]!,indices[i+1]!,indices[i+2]!);
    }
    const cycles:number[][]=neckCycles(retained);
    if(cycles.length!==data.boundsMm.length)throw new Error("Excluding auxiliary domains changed the declared actual boundary population");
    const rails:Map<string,number[]>=new Map();
    for(const [i,y]of data.boundsMm.entries()){
      const found:number[][]=cycles.filter((cycle:number[]):boolean=>cycle.every((id:number):boolean=>
        Math.abs(positions[3*id+1]!-y)<=8*Number.EPSILON*Math.max(1,Math.abs(y))));
      if(found.length!==1)throw new Error("An emitted physical neck port does not remain on its original plane");
      rails.set(i===0?"course:lower":"course:upper",found[0]!);
    }
    return {mesh:{positions,indices:retained},rails,observations};
  }

  /** Trace actual one-face indexed boundaries without merging equal coordinates or sheets. */
  function neckCycles(indices: readonly number[]): number[][] {
    const uses:Map<string,{a:number;b:number;count:number}>=new Map();
    for(let i:number=0;i<indices.length;i+=3)for(let j:number=0;j<3;j++){
      const a:number=indices[i+j]!,b:number=indices[i+(j+1)%3]!,key:string=a<b?a+":"+b:b+":"+a;
      const old:{a:number;b:number;count:number}|undefined=uses.get(key);
      if(old)old.count++;else uses.set(key,{a,b,count:1});
    }
    const next:Map<number,number>=new Map();
    for(const edge of uses.values())if(edge.count===1){
      if(next.has(edge.a))throw new Error("The fixed head course has a branched indexed boundary");
      next.set(edge.a,edge.b);
    }else if(edge.count!==2)throw new Error("The fixed head course has a multiple indexed edge");
    const result:number[][]=[];
    while(next.size){
      const first:number=next.keys().next().value!,cycle:number[]=[],seen:Set<number>=new Set();
      let id:number=first;
      do{
        if(seen.has(id)||!next.has(id))throw new Error("An actual neck boundary is not a closed coherent cycle");
        seen.add(id);cycle.push(id);const after:number=next.get(id)!;next.delete(id);id=after;
      }while(id!==first);
      result.push(cycle);
    }
    return result;
  }
}
