import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";

/** Typed clinical controls derived from the public pose and the canonical joint/channel table. */
export namespace AutoMovieHumanRigControls {
  /** A person's own side, independent of scene facing or camera. */
  export type Side = "left" | "right";
  /** Every numeric leaf in the existing public pose; jaw leaves use millimetres. */
  export type Channel = NumericPath<IAutoMovieHumanPose>;
  /** Angular clinical paths accepted by IK; jaw translations/opening are excluded. */
  export type DegreeChannel = Exclude<Channel, `head.jaw.${string}`>;
  /** Canonical jaw translation/opening paths, whose scalar unit is millimetres. */
  export type MillimetreChannel = Extract<Channel, `head.jaw.${string}`>;
  /** Canonical table spelling before own-side expansion. */
  export type ChannelTemplate = Template<Channel>;
  /** Exact Human FK joint identities, including original custom finger/foot joints. */
  export type Joint = Expand<(typeof AutoMovieHumanPoseChannels)[number][1]>;
  /** Metres in a prepared Human evaluator's registered +X forward/+Y up/+Z left frame. */
  export type MetrePoint = [xMetres:number,yMetres:number,zMetres:number];
  /** Unit rigid quaternion from the bind, in x/y/z/w component order. */
  export type Rotation = [x:number,y:number,z:number,w:number];
  /** Reusable anatomical chain selection; no activity or film catalogue. */
  export type Chain =
    | {region:"arm"|"leg"|"eyes";side:Side}
    | {region:"spine"|"neck"|"pelvis"}
    | {region:"finger";side:Side;digit:"thumb"|"index"|"middle"|"ring"|"little"}
    | {region:"toe";side:Side;digit:"hallux"|"second"|"third"|"fourth"|"fifth"};

  /** Admit a drawing/asset string at the explicit canonical Human-joint boundary. */
  export function joint(value: string): Joint {
    if (!isJoint(value)) throw new Error(`Unknown canonical Human joint: ${value}`);
    return value;
  }
  /** Check exact canonical Human joint identity without preparing a body. */
  export function isJoint(value: string): value is Joint {
    return JOINTS.has(value);
  }
  /** Admit an angular channel from untyped input; jaw millimetres remain a distinct API. */
  export function channel(value: string): DegreeChannel {
    if (!isChannel(value)) throw new Error(`Unknown Human degree channel: ${value}`);
    return value;
  }
  /** Check exact registered angular pose paths; no spelling aliases or invented knobs. */
  export function isChannel(value: string): value is DegreeChannel {
    return ANGLES.has(value);
  }
  /** Read the canonical degree interval; an optional current pose applies FK's flexion-dependent tibial interval. */
  export function bounds(path:DegreeChannel,pose?:IAutoMovieHumanPose):{minimum:number;maximum:number} {
    const row:CompiledChannel|undefined=ANGLES.get(path);
    if(!row)throw new Error(`Unknown Human degree channel: ${path}`);
    const flexion:CompiledChannel|undefined=pose&&path.endsWith(".knee.rotation")?ANGLES.get(path.replace("rotation","flexion")):undefined;
    const scale:number=flexion&&pose?Math.min(1,Math.max(0,Math.max(flexion.minimum,Math.min(flexion.maximum,scalar(pose,flexion)))/90)):1;
    return {minimum:row.minimum*scale,maximum:row.maximum*scale};
  }
  /** Read canonical jaw millimetre bounds without admitting a jaw path as degrees. */
  export function millimetreBounds(path:MillimetreChannel):{minimum:number;maximum:number} {
    const row:CompiledChannel|undefined=MILLIMETRES.get(path);
    if(!row)throw new Error(`Unknown Human millimetre channel: ${path}`);
    return {minimum:row.minimum,maximum:row.maximum};
  }
  /**
   * Read one canonical scalar after the supplied evaluation's clamp receipt. Angular paths retain degrees and jaw paths retain millimetres. Omitted controls mean clinical neutral, zero. A matching applied value overrides the request without recomputing any clinical bound. The caller supplies the exact pose and clamps from the same evaluation; this reader verifies receipt consistency, not its provenance or physical admission.
   *
   * Unknown paths, malformed/nonfinite scalars, duplicate receipt paths and receipt requests unequal to this pose throw without changing inputs.
   *
   * @evidence contracts/common.md#principled-implementation The existing canonical compiled scalar reader supplies each requested degree or millimetre value, including omitted neutral zero. Every clamp must address a canonical path, match that pose's request and report a finite changed applied scalar; the selected applied value takes precedence without a second bound calculation.
   * @evidence contracts/common.md#clear-and-simple-design One typed getter reuses the existing channel catalogue and scalar traversal. It returns a scalar rather than introducing a pose, rate or motion schema, and the caller owns evaluation provenance and time differencing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No joint or consumer has a substituted value. Neutral zero belongs only to omitted canonical controls; malformed input or inconsistent receipts throw, and the getter neither invents a clamp nor certifies a supplied receipt's origin.
   * @evidence contracts/common.md#meaningful-documentation States canonical degree/millimetre units, omitted neutral semantics, applied precedence, same-evaluation premise, receipt validation and lack of physical/provenance certification or mutation.
   * @evidence contracts/performance.md#efficient-algorithms Reads one selected fixed-depth path and scans C clamp rows once, reading their canonical fixed-depth paths to verify the pose association; time and temporary path-identity storage are O(C).
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The existing body-independent channel catalogue and compiled paths are reused, but current pose and receipt verdicts are not cached across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The local seen-path set is released on return and only a number escapes; no pose, receipt, evaluator or external resource is retained.
   */
  export function readApplied(
    pose:IAutoMovieHumanPose,
    path:Channel,
    clamped:readonly AutoMovieHumanSkeleton.IClamp[],
  ):number {
    const selected:CompiledChannel|undefined=ANGLES.get(path)??MILLIMETRES.get(path);
    if(!selected)throw new Error(`Unknown canonical Human channel: ${path}`);
    let value:number=scalar(pose,selected);
    if(!Array.isArray(clamped))throw new Error("Human applied controls require a clamp array");
    const seen:Set<string>=new Set();
    for(const clamp of clamped){
      if(clamp===null||typeof clamp!=="object")throw new Error("Malformed Human clamp receipt");
      const row:CompiledChannel|undefined=ANGLES.get(clamp.path)??MILLIMETRES.get(clamp.path);
      if(!row||seen.has(clamp.path)||!Number.isFinite(clamp.requested)||!Number.isFinite(clamp.applied)||clamp.requested===clamp.applied||clamp.requested!==scalar(pose,row))
        throw new Error(`Inconsistent Human clamp receipt: ${clamp.path}`);
      seen.add(clamp.path);
      if(clamp.path===path)value=clamp.applied;
    }
    return value;
  }
  /**
   * Select a small canonical anatomical chain. Arm includes girdle through
   * forearm; leg includes hip, knee rotation, ankle and hind/midfoot. Digits
   * have separate bounded chains. Returns owned paths and validates unknown
   * JavaScript requests rather than silently selecting a default side.
   */
  export function chain(selection: Chain): DegreeChannel[] {
    if ("side" in selection && selection.side !== "left" && selection.side !== "right")
      throw new Error("Human chain requires its own left/right side");
    let prefix: string;
    switch (selection.region) {
      case "arm": prefix=`arms.${selection.side}.`; break;
      case "leg": prefix=`legs.${selection.side}.`; break;
      case "eyes": prefix=`head.eyes.${selection.side}.`; break;
      case "spine": prefix="spine."; break;
      case "neck": prefix="neck."; break;
      case "pelvis": prefix="pelvis."; break;
      case "finger": prefix=`arms.${selection.side}.hand.${selection.digit}.`; break;
      case "toe": prefix=`legs.${selection.side}.foot.${selection.digit}.`; break;
      default: throw new Error("Unknown Human anatomical chain");
    }
    const paths: DegreeChannel[] = [...ANGLES.keys()].filter(isChannel);
    const result: DegreeChannel[] = paths.filter((path: DegreeChannel): boolean => path.startsWith(prefix) &&
      !(selection.region === "arm" && (path.includes(".hand.") || path.includes(".wrist."))) &&
      !(selection.region === "leg" && path.includes(".foot.") && !path.endsWith("subtalarInversion") && !path.endsWith("midfootSupination")));
    if (result.length === 0 || result.length > 12) throw new Error("Unknown or oversized Human anatomical chain");
    return result;
  }
  /**
   * Interpolate every canonical clinical scalar into an independent pose.
   * Missing controls mean clinical neutral (zero). Angular channels interpolate
   * their stated degrees, including rotation without a shortest-arc wrap; jaw
   * channels interpolate millimetres. This carries articulation only: world
   * placement, support, collision and FK remain the consumer's responsibility.
   * Finite values and a closed-unit weight are required. Canonical channel
   * bounds are still applied by the public evaluator, not silently enlarged.
   */
  export function blend(from:IAutoMovieHumanPose,to:IAutoMovieHumanPose,weight:number):IAutoMovieHumanPose {
    if(!Number.isFinite(weight)||weight<0||weight>1)throw new Error("Human pose blend requires a finite closed-unit weight");
    const pose:IAutoMovieHumanPose={};
    for(const row of CATALOGUE){
      const a:number=scalar(from,row);
      const b:number=scalar(to,row);
      if(a===0&&b===0)continue;
      assign(pose,row.parts,a+(b-a)*weight);
    }
    return pose;
  }
}

/** Read clinical neutral for an omitted control while refusing nonfinite input. */
function scalar(pose:IAutoMovieHumanPose,row:CompiledChannel):number {
  let value:unknown=pose;
  for(const part of row.parts){
    if(value===undefined)return 0;
    if(typeof value!=="object"||value===null)throw new Error(`Malformed Human pose region: ${row.path}`);
    value=Reflect.get(value,part);
  }
  if(value===undefined)return 0;
  if(typeof value!=="number"||!Number.isFinite(value))throw new Error(`Nonfinite Human pose channel: ${row.path}`);
  return value;
}

/** Write an already canonical numeric leaf without exposing an untyped authoring API. */
function assign(pose:IAutoMovieHumanPose,parts:readonly string[],value:number):void {
  let node:object=pose;
  for(const part of parts.slice(0,-1)){
    const child:unknown=Reflect.get(node,part);
    if(typeof child!=="object"||child===null)Reflect.set(node,part,node===pose&&(part==="arms"||part==="legs")?{left:{},right:{}}:{});
    node=Reflect.get(node,part) as object;
  }
  Reflect.set(node,parts[parts.length-1]!,value);
}

/** Body-independent compiled paths derived once from the single canonical table. */
interface CompiledChannel {
  /** Expanded own-side clinical path. */
  path:string;
  /** Registered FK joint identity. */
  bone:string;
  /** Cached object traversal; no input pose or result is retained. */
  parts:readonly string[];
  /** Canonical lower bound in the row's declared unit. */
  minimum:number;
  /** Canonical upper bound in the row's declared unit. */
  maximum:number;
}
/** Immutable schema work shared by admission, bounds, chain selection and blending. */
const CATALOGUE:readonly CompiledChannel[]=AutoMovieHumanPoseChannels.flatMap((row:(typeof AutoMovieHumanPoseChannels)[number]):CompiledChannel[]=>{
  const sides:readonly string[]=row[0].includes("<side>")?["left","right"]:[""];
  return sides.map((side:string):CompiledChannel=>{
    const path:string=row[0].replace("<side>",side);
    return {path,bone:row[1].replace("<side>",side),parts:path.split("."),minimum:row[4],maximum:row[5]};
  });
});
/** Exact expanded angular entries; jaw millimetres remain outside degree admission. */
const ANGLES:ReadonlyMap<string,CompiledChannel>=new Map(CATALOGUE.filter((row:CompiledChannel):boolean=>!row.path.startsWith("head.jaw.")).map((row:CompiledChannel):[string,CompiledChannel]=>[row.path,row]));
/** Exact jaw entries use their table's millimetre unit and remain disjoint from angles. */
const MILLIMETRES:ReadonlyMap<string,CompiledChannel>=new Map(CATALOGUE.filter((row:CompiledChannel):boolean=>row.path.startsWith("head.jaw.")).map((row:CompiledChannel):[string,CompiledChannel]=>[row.path,row]));
/** Exact expanded joint names from the same canonical source, with no body cache. */
const JOINTS:ReadonlySet<string>=new Set(CATALOGUE.map((row:CompiledChannel):string=>row.bone));

/** Public numeric leaves remain the sole channel-schema authority. */
type NumericPath<T> = {[K in keyof T & string]-?:NonNullable<T[K]> extends number ? K : NonNullable<T[K]> extends object ? `${K}.${NumericPath<NonNullable<T[K]>>}` : never}[keyof T & string];
/** Resolve the canonical table's side placeholder to the public own-side union. */
type Expand<T extends string> = T extends `${infer Before}<side>${infer After}` ? `${Before}${AutoMovieHumanRigControls.Side}${After}` : T;
/** Resolve either public side spelling into one canonical row template. */
type Template<T extends string> = T extends `${infer Before}.left.${infer After}` | `${infer Before}.right.${infer After}` ? `${Before}.<side>.${After}` : T;
