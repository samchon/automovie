import * as THREE from "three";
/** Actual shoe support role, not a substituted foot shape. */
type Contact="flat"|"toe"|"heel"|"air";

/**
 * Author alternating landings with fixed stance references and explicit supports.
 * @evidence contracts/common.md#implementation-and-ownership Each explicit step moves only its selected foot from the last actual landing to the next root-relative landing. Stance position/heading remain fixed while the other foot swings. The step's explicit stance role can retain a real toe or heel rather than forcing a full flat walking frame. The landing foot becomes flat; the other keeps its stance role until its next step. When both authored landings share the same neutral root/heading, both settle flat. Root XZ comes from the two footprint centres and measured neutral offset, preserving the accepted initial root. This planner duplicates no anatomy or joint solver; actual Human support admits every output.
 * @evidence contracts/common.md#authoring-interface Supply measured rest centres, accepted initial footprints/headings and ordered nonoverlapping timed steps. Optional step stance selects flat(default), toe or heel for the other foot; the moving foot is air. Returned feet/headings/contact roles are owned staging values, not claims of physical admission. Y swing is5cm; root height remains the initial seed while Human support owns its applied Y. Common-landing equality is a deterministic planning test, not a physical tolerance.
 */
export function sampleFootstepRoute(options: {
  seconds: number;
  rest: { left: THREE.Vector3; right: THREE.Vector3 };
  initial: { root: THREE.Vector3; yaw: number; feet: { left: THREE.Vector3; right: THREE.Vector3 }; headings: { left: number; right: number } };
  steps: { begin: number; end: number; side: "left" | "right"; root: THREE.Vector3; yaw: number; stance?:"flat"|"toe"|"heel" }[];
}): { root: THREE.Vector3; yaw: number; feet: { left: THREE.Vector3; right: THREE.Vector3 }; headings: { left: number; right: number }; swing: "left" | "right" | null;contacts:{left:Contact;right:Contact} } {
  if (![options.seconds,options.initial.yaw,options.initial.headings.left,options.initial.headings.right,...options.initial.root.toArray(),...options.initial.feet.left.toArray(),...options.initial.feet.right.toArray(),...options.rest.left.toArray(),...options.rest.right.toArray()].every(Number.isFinite)) throw new Error("Footstep route requires finite time and initial geometry");
  const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: options.initial.feet.left.clone(), right: options.initial.feet.right.clone() };
  const headings: { left: number; right: number } = { ...options.initial.headings };
  const contacts:{left:Contact;right:Contact}={left:"flat",right:"flat"};
  let yaw: number = options.initial.yaw;
  let previousEnd: number = -Infinity;
  let swing: "left" | "right" | null = null;
  for (const step of options.steps) {
    if (![step.begin, step.end, step.yaw, ...step.root.toArray()].every(Number.isFinite) || step.end <= step.begin || step.begin < previousEnd)
      throw new Error("Footstep intervals must be finite, positive and ordered");
    previousEnd = step.end;
    if (options.seconds <= step.begin) continue;
    const phase: number = THREE.MathUtils.clamp((options.seconds - step.begin) / (step.end - step.begin), 0, 1);
    const eased: number = phase * phase * (3 - 2 * phase);
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), step.yaw);
    const landing: THREE.Vector3 = options.rest[step.side].clone().applyQuaternion(rotation).add(step.root); landing.y = 0;
    feet[step.side].lerp(landing, eased); feet[step.side].y = phase < 1 ? Math.sin(Math.PI * phase) * 0.05 : 0;
    const turn: number = Math.atan2(Math.sin(step.yaw - yaw), Math.cos(step.yaw - yaw));
    yaw += turn * eased;
    const footTurn: number = Math.atan2(Math.sin(step.yaw - headings[step.side]), Math.cos(step.yaw - headings[step.side]));
    headings[step.side] += footTurn * eased;
    contacts[step.side]=phase<1?"air":"flat";
    contacts[step.side==="left"?"right":"left"]=step.stance??"flat";
    if (phase < 1) { swing = step.side; break; }
  }
  const offset: THREE.Vector3 = options.rest.left.clone().add(options.rest.right).multiplyScalar(0.5).applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
  const initialCentre: THREE.Vector3 = options.initial.feet.left.clone().add(options.initial.feet.right).multiplyScalar(0.5);
  const initialOffset: THREE.Vector3 = options.rest.left.clone().add(options.rest.right).multiplyScalar(0.5).applyAxisAngle(new THREE.Vector3(0,1,0),options.initial.yaw);
  const root: THREE.Vector3 = options.initial.root.clone().add(feet.left.clone().add(feet.right).multiplyScalar(0.5).sub(initialCentre)).sub(offset.sub(initialOffset)); root.y = options.initial.root.y;
  const leftLanding:THREE.Vector3=feet.left.clone().sub(options.rest.left.clone().applyAxisAngle(new THREE.Vector3(0,1,0),headings.left));
  const rightLanding:THREE.Vector3=feet.right.clone().sub(options.rest.right.clone().applyAxisAngle(new THREE.Vector3(0,1,0),headings.right));
  if(swing===null&&Math.abs(headings.left-headings.right)<1e-9&&leftLanding.distanceToSquared(rightLanding)<1e-16){contacts.left="flat";contacts.right="flat";}
  return { root, yaw, feet, headings, swing,contacts };
}
