import { projectileAt, resolveImpact } from "@automovie/engine";
import * as THREE from "three";

/** One measured release/catch pair on the existing scene clock. */
interface Pass { release: number; catch: number; origin: THREE.Vector3; target: THREE.Vector3; }
/** A measured moving bat tip and its outward contact normal. */
interface Strike { time: number; position: THREE.Vector3; normal: THREE.Vector3; batVelocity: THREE.Vector3; }

/**
 * Freeze actual world release/impact states, then evaluate independent balls.
 * Quaffle uses terrestrial gravity. Self-moving magical Bludgers use a bounded
 * training orbit/drag controller after a normal collision. Bat2kg/ball1kg are
 * explicit effective impact proxies, not inferred solid-iron or human masses.
 *
 * @evidence contracts/common.md#implementation-and-ownership Calls public projectileAt and resolveImpact with fixed measured event inputs. Free balls never inherit later hand/bat transforms. Each impact changes velocity at one actual contact; deterministic magical steering is separate from that impulse.
 * @evidence contracts/common.md#authoring-interface Passes supply metre endpoints and global release/catch seconds. Strikes supply metre ball-centre contacts, unit-normal direction and actual tip m/s. Returns owned states and acquisition-free diagnostic event data; catch absorption/visible motion remain scene responsibilities.
 */
export function createBallFlights(passes: readonly Pass[], strikes: readonly Strike[]): {
  sample: (seconds: number) => { quaffle?: THREE.Vector3; bludgers: { position: THREE.Vector3; velocity: THREE.Vector3; acceleration: THREE.Vector3 }[] };
  events: { passes: object[]; strikes: object[] };
} {
  const gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0);
  const throws = passes.map((p: Pass): { release: number; catch: number; origin: THREE.Vector3; velocity: THREE.Vector3; target: THREE.Vector3 } => {
    const duration: number = p.catch - p.release;
    if (!(duration > 0)) throw new Error("Ball pass requires increasing event times");
    const velocity: THREE.Vector3 = p.target.clone().sub(p.origin).addScaledVector(gravity, -0.5 * duration * duration).divideScalar(duration);
    return { ...p, origin: p.origin.clone(), target: p.target.clone(), velocity };
  });
  const impacts = strikes.map((s: Strike): { time: number; position: THREE.Vector3; incoming: THREE.Vector3; outgoing: THREE.Vector3; normal: THREE.Vector3; impulse: number } => {
    const normal: THREE.Vector3 = s.normal.clone().normalize();
    const incoming: THREE.Vector3 = normal.clone().multiplyScalar(-3);
    const result: ReturnType<typeof resolveImpact> = resolveImpact(
      { mass: 2, velocity: s.batVelocity, restitution: 0.7, hardness: 1, penetrability: 0 },
      { mass: 1, velocity: incoming, restitution: 0.7, hardness: 1, penetrability: 0 }, normal,
    );
    const outgoing: THREE.Vector3 = new THREE.Vector3(result.velocityB.x, result.velocityB.y, result.velocityB.z);
    return { time: s.time, position: s.position.clone(), incoming, outgoing, normal, impulse: outgoing.clone().sub(incoming).dot(normal) };
  });
  return {
    sample,
    events: { passes: throws.map((p): object => ({ release: p.release, catch: p.catch, origin: p.origin.toArray(), target: p.target.toArray(), velocity: p.velocity.toArray(), gravity: gravity.toArray() })), strikes: impacts.map((s): object => ({ time: s.time, position: s.position.toArray(), normal: s.normal.toArray(), incoming: s.incoming.toArray(), outgoing: s.outgoing.toArray(), normalImpulseKgMetresPerSecond: s.impulse, effectiveBatMassKg: 2, effectiveBallMassKg: 1 })) },
  };

  /** Pure event-relative evaluation keeps arbitrary seek order reproducible. */
  function sample(seconds: number): ReturnType<ReturnType<typeof createBallFlights>["sample"]> {
    if (!Number.isFinite(seconds)) throw new Error("Ball time must be finite");
    const p = throws.find((item): boolean => seconds >= item.release && seconds < item.catch);
    const flight: ReturnType<typeof projectileAt> | undefined = p ? projectileAt({ origin: p.origin, velocity: p.velocity, gravity }, seconds - p.release) : undefined;
    return {
      quaffle: flight ? new THREE.Vector3(flight.position.x, flight.position.y, flight.position.z) : undefined,
      bludgers: impacts.map((s): { position: THREE.Vector3; velocity: THREE.Vector3; acceleration: THREE.Vector3 } => {
        const dt: number = seconds - s.time;
        if (dt < 0) return {
          position: s.position.clone().addScaledVector(s.incoming, 2 * Math.sin(dt / 2)),
          velocity: s.incoming.clone().multiplyScalar(Math.cos(dt / 2)),
          acceleration: s.incoming.clone().multiplyScalar(-0.5 * Math.sin(dt / 2)),
        };
        const tau: number = 0.9;
        const decay: number = Math.exp(-dt / tau);
        const q: { value: number; first: number; second: number } = orbitPhase(dt);
        const orbit: THREE.Vector3 = new THREE.Vector3(2 * Math.sin(0.8 * dt), 0.8 * (1 - Math.cos(0.8 * dt)), 2 * (1 - Math.cos(0.8 * dt)));
        const ov: THREE.Vector3 = new THREE.Vector3(1.6 * Math.cos(0.8 * dt), 0.64 * Math.sin(0.8 * dt), 1.6 * Math.sin(0.8 * dt));
        const oa: THREE.Vector3 = new THREE.Vector3(-1.28 * Math.sin(0.8 * dt), 0.512 * Math.cos(0.8 * dt), 1.28 * Math.cos(0.8 * dt));
        return {
          position: s.position.clone().addScaledVector(s.outgoing, dt * decay).addScaledVector(orbit, q.value),
          velocity: s.outgoing.clone().multiplyScalar(decay * (1 - dt / tau)).addScaledVector(ov, q.value).addScaledVector(orbit, q.first),
          acceleration: s.outgoing.clone().multiplyScalar(decay * (dt / (tau * tau) - 2 / tau)).addScaledVector(oa, q.value).addScaledVector(ov, 2 * q.first).addScaledVector(orbit, q.second),
        };
      }),
    };
  }
}

/** Zero value/velocity/acceleration at orbit engagement avoids a hidden impulse. */
function orbitPhase(seconds: number): { value: number; first: number; second: number } {
  if (seconds <= 0) return { value: 0, first: 0, second: 0 };
  if (seconds >= 2) return { value: 1, first: 0, second: 0 };
  const u: number = seconds / 2;
  return { value: u ** 3 * (10 - 15 * u + 6 * u * u), first: 15 * u * u * (1 - u) ** 2, second: 15 * u * (1 - u) * (1 - 2 * u) };
}
