import * as THREE from "three";

import { departureWalkCycles } from "./departureWalkCycles";
import { evaluateSharedReach } from "./evaluateSharedReach";
import { evaluateTwoSteps } from "./evaluateTwoSteps";
import type { IPerformanceIntent } from "./IPerformanceIntent";

/**
 * Plan the cleared solo pickup, successful exchange and separate departing smiles.
 *
 * @evidence contracts/common.md#implementation-and-ownership Starts only from the shared reach's settled48s state, including Harry's completed0.5m retreat. Carina crouches in the clear space, requests an edge pickup and straightens before offering the note; Harry closes before Carina's give request. Those requests cannot change custody without actual geometry admission. The English cue windows use the retained2.88/2.24s speech timings but remain silent visual cues until soundtrack acceptance. The existing pivot gathers the old reaching stance to the actual neutral foot references before walking; the root follows those same supports continuously. Westward departure, a note-directed head incline and separate left-forehead touches carry the ending.
 * @evidence contracts/common.md#authoring-interface Actor, seconds, matching sole references, measured shared event and actual note short-edge location return clinical/frame intent. Pickup/give/receive fields are permissions for a coupled scene owner, never timestamp-only successful handoffs. The assembled48–60s consumer still requires actual low-reach, contact, clearance and view inspection before export.
 */
export function evaluateDeparture(person: "carina" | "harry", time: number, reference: { left: THREE.Vector3; right: THREE.Vector3 }, contact: { time: number; progress: number }, shortEdge: THREE.Vector3): IPerformanceIntent {
  const inherited: IPerformanceIntent = evaluateSharedReach(person, Math.min(time, 48), reference, contact, shortEdge);
  if (time <= 48) return inherited;
  const result: IPerformanceIntent = { ...inherited, requests: [], gripWeight: 0, bendAmount: 0 };
  const start: IPerformanceIntent = evaluateSharedReach(person, 48, reference, contact, shortEdge);
  const bend: number = ease((time - 48) / 0.9) * (1 - ease((time - 49.5) / 1));
  if (person === "carina") {
    const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(start.heading), 0, -Math.sin(start.heading));
    result.position = start.position.clone().addScaledVector(forward, -0.28 * bend);
    result.bendAmount = bend;
    result.pose = { legs: { left: { knee: { flexion: 12 + 98 * bend } }, right: { knee: { flexion: 12 + 98 * bend } } },
      spine: { thoracic: { flexion: 28 * bend }, lumbar: { flexion: 45 * bend } }, neck: { cervical: { flexion: -30 * bend } },
      head: { jaw: { opening: jaw(time, 52.2, 55.08) } }, arms: { left: { elbow: { flexion: 8 } }, right: { shoulder: { flexion: 20 }, elbow: { flexion: 35 } } } };
    const lift: number = ease((time - 49.5) / 1);
    result.rightTarget = shortEdge.clone().lerp(new THREE.Vector3(-1.65, 1.12, -0.20), lift);
    result.targetWeight = ease((time - 48) / 0.8);
    result.rightNormal = new THREE.Vector3(0, 1, 0);
    result.rightLongAxis = new THREE.Vector3(-1, 0, 0);
    result.gripWeight = ease((time - 49.25) / 0.25) * (1 - ease((time - 52.1) / 0.1));
    if (time >= 49) result.requests.push("pickup");
    if (time >= 50.5) {
      const offer: number = ease((time - 50.5) / 1.0);
      result.rightTarget.lerp(new THREE.Vector3(-1.72, 1.13, 0.20), offer);
      result.pose.spine = { thoracic: { flexion: 5 * offer }, lumbar: { flexion: 5 * offer } };
    }
    if (time >= 52.1) result.requests = ["give"];
    if (time >= 55.1) {
      delete result.rightTarget; delete result.targetWeight; delete result.rightNormal; delete result.rightLongAxis;
      result.pose.arms = { left: { elbow: { flexion: 8 } }, right: { elbow: { flexion: 8 } } };
      result.pose.spine = {};
      const pivot: THREE.Vector3 = start.left.clone();
      const destination: THREE.Vector3 = new THREE.Vector3(-4.6, 0, 0.6);
      const across: THREE.Vector3 = destination.clone().sub(pivot).setY(0);
      const radius: THREE.Vector3 = start.position.clone().sub(pivot).setY(0);
      const completeTurn: number = Math.acos(Math.max(-1, Math.min(1, radius.x / across.length()))) - Math.atan2(across.z, across.x);
      const turn: number = ease((time - 55.1) / 0.65);
      const angle: number = completeTurn * turn;
      result.position = start.position.clone().sub(pivot).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).add(pivot);
      result.right = start.right.clone().sub(pivot).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).add(pivot).setY(0.001 + 0.05 * Math.sin(Math.PI * turn) ** 2);
      result.heading = start.heading + angle;
      // The existing right-foot turn also gathers the old reaching stance
      // underneath the hips before it becomes an ordinary walking stance.
      const yaw: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
      const alignedRight: THREE.Vector3 = reference.right.clone().sub(reference.left).applyAxisAngle(yaw, result.heading).add(pivot).setY(result.right.y);
      const alignedRoot: THREE.Vector3 = pivot.clone().sub(reference.left.clone().applyAxisAngle(yaw, result.heading)).setY(result.position.y);
      result.right.lerp(alignedRight, turn);
      result.position.lerp(alignedRoot, turn);
      if (time >= 55.75) {
        const direction: THREE.Vector3 = destination.clone().sub(result.position).setY(0).normalize();
        const distance: number = result.position.clone().setY(0).distanceTo(destination);
        const progress: number = Math.max(0, Math.min(1, (time - 55.75) / 3.95));
        const cycle: number = Math.min(departureWalkCycles - 1, Math.floor(progress * departureWalkCycles));
        const length: number = distance / departureWalkCycles;
        const step: ReturnType<typeof evaluateTwoSteps> = evaluateTwoSteps(progress * departureWalkCycles - cycle, 1, length);
        result.position.addScaledVector(direction, cycle * length + step.root);
        result.left.addScaledVector(direction, cycle * length + step.left.forward).setY(0.001 + step.left.lift);
        result.right.addScaledVector(direction, cycle * length + step.right.forward).setY(0.001 + step.right.lift);
      }
      const touch: number = ease((time - 58.0) / 0.4) * (1 - ease((time - 59.0) / 0.6));
      result.pose.arms.left = { shoulder: { flexion: 65 * touch, abduction: -10 * touch }, elbow: { flexion: 8 + 110 * touch } };
      result.face = time >= 58 ? "smile" : "neutral";
    }
  } else {
    const offer: number = ease((time - 49.8) / 0.7);
    result.pose = { head: { jaw: { opening: jaw(time, 55.5, 57.74) } }, spine: { thoracic: { flexion: 4 * offer }, lumbar: { flexion: 4 * offer } },
      arms: { left: { elbow: { flexion: 8 } }, right: { shoulder: { flexion: 30 }, elbow: { flexion: 60 }, forearm: { pronation: -70 } } } };
    result.rightTarget = new THREE.Vector3(-1.87, 1.13, 0.20); result.targetWeight = offer;
    result.rightNormal = new THREE.Vector3(0, 1, 0); result.rightLongAxis = new THREE.Vector3(1, 0, 0);
    result.gripWeight = ease((time - 51.8) / 0.3);
    if (time >= 51.8) result.requests.push("receive");
    if (time >= 54.9) {
      const touch: number = ease((time - 54.9) / 0.45) * (1 - ease((time - 56.2) / 0.6));
      result.pose.arms!.left = { shoulder: { flexion: 65 * touch, abduction: -10 * touch }, elbow: { flexion: 8 + 110 * touch } };
      result.pose.neck = { cervical: { flexion: 20 * ease((time - 57.2) / 0.6) } };
      result.rightTarget.lerp(new THREE.Vector3(-1.95, 1.10, 0.68), ease((time - 55.1) / 0.8));
      result.face = time >= 57 ? "smile" : "neutral";
    }
  }
  return result;
}

/** Bounded cubic phase; no state is carried between arbitrary seeks. */
function ease(value: number): number { const t: number = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); }

/** Coarse mouth cue follows candidate words' measured slots, not phoneme alignment. */
function jaw(time: number, start: number, end: number): number { return time >= start && time < end ? Math.round(Math.abs(Math.sin(time * 12)) * 3) * 4 : 0; }
