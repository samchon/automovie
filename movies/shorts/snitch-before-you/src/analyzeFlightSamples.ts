import { segmentSegmentDistance } from "@automovie/engine";
import * as THREE from "three";

/** Actual displayed unit-mass points, not requested IK targets. */
interface Proxy { centre: number[]; points: { weight: number; position: number[] }[]; }
/** One analytic moving platform in the same world frame. */
interface Path { position: number[]; velocity: number[]; acceleration: number[]; quaternion: number[]; }
/** The diagnostic subset retained by the actual whole-film Viewer. */
interface Sample {
  seconds: number; carinaErrorMetres: number; harryErrorMetres: number; clamps: string[];
  harryLeft: number[]; harryRight: number[]; seatedOnNewGeometry: boolean; bootBristleClearanceMetres: number[];
  riders: number; brooms: number; bats: number; hoops: number;
  supportingPlayers: { error: number; clamps: string[] }[];
  supportErrors: { name: string; error: number }[]; supportAmounts: { name: string; amount: number }[];
  dynamics: {
    carinaProxy: Proxy; harryProxy: Proxy; carinaPath: Path; oldPath: Path;
    support: { newLoadShare: number }; oldShaftHeadClearance: number[];
    harryRib: number[]; harryForearm: number[];
    bodies: { hips: number[]; neck: number[]; head: number[] }[];
    supportingPaths: (Path & { id: string })[];
  };
}
/** A measured maximum/minimum with the responsible actual sample time. */
interface Extreme { value: number; seconds: number; label: string; }

/**
 * Audit the actual displayed whole scene, including inverse-dynamics proxies.
 * Finite differences of the disclosed point masses give a_COM-g and angular
 * momentum rate. Contact shares give a required constraint moment; this is
 * inverse dynamics, not a forward muscle simulation or injury-safety claim.
 *
 * @evidence contracts/common.md#implementation-and-ownership Consumes actual Viewer FK diagnostics rather than rerunning an alternate pose generator. Checks platform speed/acceleration, common-frame force, real contacts, population, seat/clearance and body capsules; computes disclosed support-share reaction/moment and carrier force over mass ratios0.8/1/1.2.
 * @evidence contracts/common.md#authoring-interface Ordered uniform24Hz samples0–60 are required. Returns extrema and every gate together without suppression.12m/s,5m/s² and2.5g carrier budgets are adopted magical-controller assumptions, not universal human limits; sampled capsules/point masses do not prove all mesh collisions or peak continuous forces.
 */
export function analyzeFlightSamples(frames: readonly Sample[]): {
  samples: number; extrema: Record<string, Extreme>; failures: { gate: string; seconds: number; value: number }[]; assumptions: string[];
} {
  if (frames.length !== 1441) throw new Error("Whole audit requires1441actual24Hzsamples including60s");
  const dt: number = 1 / 24;
  const extrema: Record<string, Extreme> = {};
  const failures: { gate: string; seconds: number; value: number }[] = [];
  const gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0);
  const reactions: Record<"carina" | "harry", THREE.Vector3[]> = { carina: [], harry: [] };
  const momenta: Record<"carina" | "harry", THREE.Vector3[]> = { carina: [], harry: [] };
  for (let i: number = 0; i < frames.length; i++) {
    const f: Sample = frames[i]!;
    if (Math.abs(f.seconds - i * dt) > 1e-7) throw new Error("Whole sample clock is not ordered24Hz");
    for (const actor of ["carina", "harry"] as const) {
      const centreAt: (j: number) => THREE.Vector3 = (j: number): THREE.Vector3 => vector(frames[j]!.dynamics[`${actor}Proxy`].centre);
      const acceleration: THREE.Vector3 = second(centreAt, i);
      const reaction: THREE.Vector3 = acceleration.sub(gravity);
      reactions[actor].push(reaction);
      const p: Proxy = f.dynamics[`${actor}Proxy`];
      const centre: THREE.Vector3 = vector(p.centre);
      for (const point of p.points) { minimum("groundClearance", point.position[1]! - 0.17, f.seconds, "displayed point-mass segment proxy"); check("groundPenetration", 0.17 - point.position[1]!, 0, f.seconds); }
      const velocity: THREE.Vector3 = first(centreAt, i);
      const momentum: THREE.Vector3 = new THREE.Vector3();
      p.points.forEach((point: { weight: number; position: number[] }, k: number): void => {
        const pv: THREE.Vector3 = first((j: number): THREE.Vector3 => vector(frames[j]!.dynamics[`${actor}Proxy`].points[k]!.position), i).sub(velocity);
        momentum.addScaledVector(vector(point.position).sub(centre).cross(pv), point.weight);
      });
      momenta[actor].push(momentum);
      maximum(`${actor}ReactionPerKg`, reaction.length(), f.seconds, "actual point-mass COM acceleration minus gravity");
    }
    maximum("wristResidual", Math.max(f.carinaErrorMetres, f.harryErrorMetres), f.seconds, "actual displayed wrist");
    check("wristResidual", Math.max(f.carinaErrorMetres, f.harryErrorMetres), 0.015, f.seconds);
    check("romClamps", f.clamps.length, 0, f.seconds);
    for (const player of f.supportingPlayers) {
      maximum("supportingWristResidual", player.error, f.seconds, "actual supporting Human hand/response targets");
      check("supportingWristResidual", player.error, 0.015, f.seconds);
      check("supportingRomClamps", player.clamps.length, 0, f.seconds);
    }
    check("population", Math.abs(f.riders - 14) + Math.abs(f.brooms - 14) + Math.abs(f.bats - 4) + Math.abs(f.hoops - 6), 0, f.seconds);
    if (f.seconds >= 50.5) check("rearSeat", f.seatedOnNewGeometry ? 0 : 1, 0, f.seconds);
    f.supportErrors.forEach((s: { name: string; error: number }): void => {
      if ((f.supportAmounts.find((a: { name: string }): boolean => a.name === s.name)?.amount ?? 0) >= 0.999) {
        maximum("bearingResidual", s.error, f.seconds, s.name); check("bearingResidual", s.error, 0.015, f.seconds);
      }
    });
    if (f.seconds >= 43) {
      minimum("bootBristleClearance", Math.min(...f.bootBristleClearanceMetres), f.seconds, "conservative boot capsule");
      check("bootBristlePenetration", -Math.min(...f.bootBristleClearanceMetres), 0.001, f.seconds);
    }
    minimum("oldShaftHeadClearance", Math.min(...f.dynamics.oldShaftHeadClearance), f.seconds, "visible head spheres versus old shaft capsule");
    check("oldShaftHeadPenetration", -Math.min(...f.dynamics.oldShaftHeadClearance), 0.001, f.seconds);
    const [c, h] = f.dynamics.bodies;
    if (!c || !h) throw new Error("Missing displayed body proxies");
    const torsoGap: number = segmentSegmentDistance(vector(c.hips), vector(c.neck), vector(h.hips), vector(h.neck)) - 0.33;
    const headGap: number = vector(c.head).distanceTo(vector(h.head)) - 0.28;
    const crossGap: number = Math.min(segmentSegmentDistance(vector(c.head), vector(c.head), vector(h.hips), vector(h.neck)), segmentSegmentDistance(vector(h.head), vector(h.head), vector(c.hips), vector(c.neck))) - 0.305;
    minimum("bodyClearance", Math.min(torsoGap, headGap, crossGap), f.seconds, "torso/head capsule proxy");
    check("bodyPenetration", -Math.min(torsoGap, headGap, crossGap), 0.001, f.seconds);
    for (const p of [f.dynamics.carinaPath, f.dynamics.oldPath, ...f.dynamics.supportingPaths]) {
      const speed: number = vector(p.velocity).length(); const acceleration: number = vector(p.acceleration).length();
      maximum("platformSpeed", speed, f.seconds, "analytic platform derivative"); maximum("platformAcceleration", acceleration, f.seconds, "analytic platform derivative");
      check("platformSpeed", speed, 12, f.seconds); check("platformAcceleration", acceleration, 5, f.seconds);
    }
    for (const path of [f.dynamics.carinaPath, f.dynamics.oldPath]) {
      const forward: THREE.Vector3 = vector(path.velocity).normalize();
      const force: THREE.Vector3 = vector(path.acceleration).sub(gravity);
      force.addScaledVector(forward, -force.dot(forward)).normalize();
      const displayedUp: THREE.Vector3 = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion().fromArray(path.quaternion));
      maximum("liftFrameResidual", force.distanceTo(displayedUp), f.seconds, "actual analytic lift and shared platform normal");
      check("liftFrameResidual", force.distanceTo(displayedUp), 1e-7, f.seconds);
      const bank: number = Math.abs(Math.atan2(displayedUp.z, displayedUp.y));
      maximum("heroBank", bank, f.seconds, "shared hero frame absolute bank radians");
      check("heroBank", bank, 0.45, f.seconds);
    }
  }
  for (let i: number = 2; i < frames.length - 2; i++) {
    const f: Sample = frames[i]!;
    const share: number = f.dynamics.support.newLoadShare;
    for (const actor of ["carina", "harry"] as const) {
      const proxy: Proxy = f.dynamics[`${actor}Proxy`];
      let support: THREE.Vector3 = vector(f.dynamics.bodies[actor === "carina" ? 0 : 1]!.hips);
      if (actor === "harry" && f.seconds >= 23 && f.seconds < 50.5) {
        if (f.seconds < 43) support = vector(f.harryRight);
        else if (f.seconds < 44.3) support = vector(f.harryRight).lerp(vector(f.harryLeft), share);
        else if (f.seconds < 45.2) support = vector(f.harryLeft);
        else {
          const rib: number = 0.65 * (f.supportAmounts.find((a: { name: string }): boolean => a.name === "lower-rib surface")?.amount ?? 0);
          const forearm: number = 0.2 * (f.supportAmounts.find((a: { name: string }): boolean => a.name === "left forearm hook")?.amount ?? 0);
          support = vector(f.harryLeft).lerp(vector(f.harryRight), 0.5).multiplyScalar(1 - rib - forearm).addScaledVector(vector(f.dynamics.harryRib), rib).addScaledVector(vector(f.dynamics.harryForearm), forearm);
        }
      }
      const rate: THREE.Vector3 = momenta[actor][i + 1]!.clone().sub(momenta[actor][i - 1]!).divideScalar(2 * dt);
      const moment: THREE.Vector3 = rate.sub(support.sub(vector(proxy.centre)).cross(reactions[actor][i]!));
      maximum(`${actor}ConstraintMomentPerKg`, moment.length(), f.seconds, "required support wrench under declared proxy, not muscle capacity");
    }
    for (const harryRatio of [0.8, 1, 1.2]) {
      const load: number = f.seconds < 43 ? 0 : f.seconds >= 44.3 ? 1 : share;
      const force: THREE.Vector3 = reactions.carina[i]!.clone().addScaledVector(reactions.harry[i]!, harryRatio * load).addScaledVector(vector(f.dynamics.carinaPath.acceleration).sub(gravity), 0.05).divideScalar(1.05 + harryRatio * load);
      maximum("carrierForcePerKg", force.length(), f.seconds, `Harry/Carina mass ratio${harryRatio},broom ratio0.05`);
      check("carrierForcePerKg", force.length(), 2.5 * 9.81, f.seconds);
    }
  }
  return { samples: frames.length, extrema, failures, assumptions: ["Unit-mass disclosed FK point proxy, not measured teen anatomy", "Mass ratios0.8/1/1.2 and broom0.05 are sensitivity assumptions", "Forces/moments are inverse-dynamics demands, not forward dynamics or injury safety", "12m/s,5m/s²,2.5g are adopted magical actuator budgets", "24Hz finite differences and capsule surfaces do not prove all intervening peaks or cloth collisions"] };

  /** Central derivatives use actual neighbours; endpoint estimates stay one-sided. */
  function first(at: (index: number) => THREE.Vector3, i: number): THREE.Vector3 {
    const a: number = Math.max(0, i - 1); const b: number = Math.min(frames.length - 1, i + 1);
    return at(b).sub(at(a)).divideScalar((b - a) * dt);
  }
  /** Three-point acceleration, using the nearest full interval at an endpoint. */
  function second(at: (index: number) => THREE.Vector3, i: number): THREE.Vector3 {
    const k: number = Math.max(1, Math.min(frames.length - 2, i));
    return at(k + 1).add(at(k - 1)).addScaledVector(at(k), -2).divideScalar(dt * dt);
  }
  /** Every nonfinite result is a failure rather than an omitted extreme. */
  function check(gate: string, value: number, limit: number, seconds: number): void {
    if (!Number.isFinite(value) || value > limit) failures.push({ gate, seconds, value });
  }
  /** Preserve responsible time, including a nonfinite diagnostic. */
  function maximum(name: string, value: number, seconds: number, label: string): void {
    if (!extrema[name] || value > extrema[name]!.value || !Number.isFinite(value)) extrema[name] = { value, seconds, label };
  }
  /** Clearance minima are not converted into a passing label. */
  function minimum(name: string, value: number, seconds: number, label: string): void {
    if (!extrema[name] || value < extrema[name]!.value || !Number.isFinite(value)) extrema[name] = { value, seconds, label };
  }
}

/** Read a stored world-metre vector without sharing its mutable array. */
function vector(value: number[]): THREE.Vector3 { return new THREE.Vector3().fromArray(value); }
