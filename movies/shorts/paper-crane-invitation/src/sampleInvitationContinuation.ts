import * as THREE from "three";
import { invitationContinuationBeats } from "./invitationContinuationBeats";
import { sampleFootstepRoute } from "./sampleFootstepRoute";

/** Measured accepted-entry footprints and their common staging frame. */
type Entry = Omit<Parameters<typeof sampleFootstepRoute>[0],"seconds"|"steps">;
/** One actor's deterministic route and separate, not yet admitted seat intent. */
type Actor = ReturnType<typeof sampleFootstepRoute> & {seatWeight:number;seatTarget:THREE.Vector3|null;lookAt:THREE.Vector3};

/**
 * Sample the remaining invitation actions without assembling an unreviewed join.
 * @evidence contracts/common.md#implementation-and-ownership Explicit alternating footfalls keep stance references fixed. Carina's forward approach permits real toe support while the other foot swings; paired landings settle flat. Waypoints use the finite bay's right/front access, preserve the accepted entry and compensate its measured footprint/root offset. Seat lowering remains an unadmitted intention with an actual bench target for subsequent Human fitting. Paper orientation is role-specific; cups retain an upright requirement. This shared-clock plan records intended timing/custody and note-before-cups order, but actual contact events in the assembled action own opening, receiving and release. Its nominal shape progress cannot open a paper without admitted touch. Unassembled later intentions are never a completed movie claim.
 * @evidence contracts/common.md#authoring-interface Supply finite9–60seconds and the two actual accepted entry states/rest centres. Outputs are owned staging values, full per-foot headings, seat intentions, look targets and prop custody phases. The assembled consumer must fit actual bodies/feet/seat/hand material and inspect every frame and join before adopting them. No mesh, original pose, clock or input state is mutated.
 */
export function sampleInvitationContinuation(options:{seconds:number;carina:Entry;harry:Entry}):{
  carina:Actor;harry:Actor;phase:string;camera:string;
  paper:{owner:"Harry"|"shared return"|"Carina"|"sill";opening:number;folding:number;audienceReveal:boolean;orientation:"blank-back-to-audience"|"legible-front"|"manual-fold"|"supported-free-bank"};
  cups:{leftSillCup:"sill"|"Carina right";rightSillCup:"sill"|"Carina left"|"shared cup"|"Harry right";raise:number;upright:true};
} {
  const seconds:number=options.seconds;
  if(!Number.isFinite(seconds)||seconds<9||seconds>60)throw new Error("Continuation time must be in9–60seconds");
  /** Smooth finite action phase, clamped before and after its own interval. */
  const phase:(begin:number,end:number)=>number=(begin:number,end:number):number=>THREE.MathUtils.smoothstep(seconds,begin,end);
  /** Plan each explicit landing in world metres, compensating the accepted entry offset. */
  const route:(entry:Entry,marks:readonly[number,number,number,number][],stance?:"flat"|"toe"|"heel")=>ReturnType<typeof sampleFootstepRoute>=(entry:Entry,marks:readonly[number,number,number,number][],stance:"flat"|"toe"|"heel"="flat"):ReturnType<typeof sampleFootstepRoute>=>{
    const initialMean:THREE.Vector3=entry.initial.feet.left.clone().add(entry.initial.feet.right).multiplyScalar(0.5);
    const offset:THREE.Vector3=entry.initial.root.clone().sub(initialMean).add(entry.rest.left.clone().add(entry.rest.right).multiplyScalar(0.5).applyAxisAngle(new THREE.Vector3(0,1,0),entry.initial.yaw));offset.y=0;
    const steps:Parameters<typeof sampleFootstepRoute>[0]["steps"]=[];
    let previous:number=9;
    let alternate:number=0;
    for(const [end,x,z,yaw] of marks) {
      steps.push({begin:Math.max(previous,end-0.48),end,side:alternate++%2===0?"left":"right",root:new THREE.Vector3(x,0,z).sub(offset),yaw,stance});
      previous=end;
    }
    return sampleFootstepRoute({...entry,seconds,steps});
  };
  const carinaRoute:ReturnType<typeof sampleFootstepRoute>=route(options.carina,[
    [9.6,4.32,0.78,-2.15],[10.2,4.32,0.96,-2.3],[10.9,4.30,1.16,-2.5],[11.6,4.30,1.48,-2.8],[12.2,4.30,1.48,-2.8],
    [22.6,3.82,1.44,-2.6],[23.3,3.78,1.47,-2.6],
    [25.7,3.98,1.75,2.9],[26.3,3.98,1.75,2.6],[28.4,3.7,1.78,2.2],[29.0,3.7,1.78,2.2],
    [43.6,3.98,1.5,1.8],[44.2,4.15,1.2,1.57],[44.8,4.15,0.9,1.57],[45.4,4.02,0.57,1.57],[46.0,4.02,0.57,1.57],
    [49.8,4.05,0.86,2.0],[50.4,3.97,1.1,2.5],[51.0,3.76,1.37,2.75],[51.6,3.76,1.37,2.75],
    [53.6,3.48,1.43,-2.6],[54.2,3.24,1.43,-1.9],[54.8,3.2,1.43,-Math.PI/2],[55.4,3.2,1.43,-Math.PI/2],
  ],"toe");
  const harryRoute:ReturnType<typeof sampleFootstepRoute>=route(options.harry,[
    [9.7,3.35,1.75,1.2],[10.3,3.35,1.75,0.6],[10.9,3.35,1.75,0.6],
    [22.8,3.48,1.56,0.6],[23.5,3.48,1.56,0.6],
    [25.9,3.33,1.45,0.1],[26.5,3.15,1.43,-0.6],[27.1,3.15,1.43,-1.2],[27.7,3.15,1.43,-Math.PI/2],[28.3,3.15,1.43,-Math.PI/2],
    [44.5,2.86,1.43,-Math.PI/2],[45.1,2.58,1.43,-Math.PI/2],[45.7,2.58,1.43,-Math.PI/2],
  ]);
  const hSeat:number=phase(28.3,29.5)*(1-phase(43,43.6))+phase(45.7,46.4);
  const cSeat:number=phase(55.4,57.4);
  harryRoute.root.z-=0.48*hSeat;harryRoute.root.y-=0.45*hSeat;
  carinaRoute.root.z-=0.48*cSeat;carinaRoute.root.y-=0.45*cSeat;
  const cupsPoint:THREE.Vector3=new THREE.Vector3(3.875,0.995,0.15);
  const hLook:THREE.Vector3=carinaRoute.root.clone().add(new THREE.Vector3(0,1.55,0));
  hLook.lerp(cupsPoint,phase(39,39.8)*(1-phase(40.7,41.5)));
  const cLook:THREE.Vector3=harryRoute.root.clone().add(new THREE.Vector3(0,1.6,0));
  cLook.lerp(cupsPoint,phase(43,44)*(1-phase(47.2,48.1)));
  const beat:typeof invitationContinuationBeats[number]|undefined=invitationContinuationBeats.find((item):boolean=>seconds>=item.begin&&(seconds<item.end||seconds===60&&item.end===60));
  if(!beat)throw new Error("Continuation action clock has a gap");
  return {
    carina:{...carinaRoute,seatWeight:cSeat,seatTarget:cSeat>0?new THREE.Vector3(3.2,0.45,0.775):null,lookAt:cLook},
    harry:{...harryRoute,seatWeight:hSeat,seatTarget:hSeat>0?new THREE.Vector3(seconds<44.5?3.15:2.58,0.45,0.775):null,lookAt:hLook},
    phase:beat.action,camera:beat.camera,
    paper:{owner:seconds<30?"Harry":seconds<31.1?"shared return":seconds<45.5?"Carina":"sill",opening:phase(9,11.5),folding:phase(36.7,39),audienceReveal:seconds>=33.3&&seconds<36.7,orientation:seconds<33.3?"blank-back-to-audience":seconds<36.7?"legible-front":seconds<39?"manual-fold":"supported-free-bank"},
    cups:{leftSillCup:seconds<48.8?"sill":"Carina right",rightSillCup:seconds<48.8?"sill":seconds<51.4?"Carina left":seconds<52.3?"shared cup":"Harry right",raise:phase(58,58.7),upright:true},
  };
}
