import { projectileAt, resolveImpact } from "@automovie/engine";
import * as THREE from "three";

/** One measured release/catch pair on the existing scene clock. */
interface Pass { release: number; catch: number; origin: THREE.Vector3; target: THREE.Vector3; receiver: string; receiverVelocity: THREE.Vector3; }
/** A measured moving bat tip and its outward contact normal. */
interface Strike { actor: string; time: number; position: THREE.Vector3; normal: THREE.Vector3; batVelocity: THREE.Vector3; }
/** Frozen free-flight launch, separate from any later actor state. */
interface Throw extends Pass { velocity: THREE.Vector3; }
/** Normal collision result followed by a separate magical steering law. */
interface Impact { actor: string; time: number; position: THREE.Vector3; incoming: THREE.Vector3; outgoing: THREE.Vector3; batBefore: THREE.Vector3; batAfter: THREE.Vector3; normal: THREE.Vector3; impulse: number; kind: string; }
/** A finite-mass impact's velocity jump and controlled return, in world units. */
interface Response { actor: string; time: number; deltaVelocity: THREE.Vector3; tau: number; kind: "catch" | "strike"; }
/** Coupled inelastic receiver/ball state at the same measured catch point. */
interface Catch { actor: string; time: number; position: THREE.Vector3; incoming: THREE.Vector3; before: THREE.Vector3; after: THREE.Vector3; ballAfter: THREE.Vector3; impulse: THREE.Vector3; }

/**
 * Freeze actual world release/impact states, then evaluate independent balls.
 * Quaffle uses terrestrial gravity. Self-moving magical Bludgers use a bounded
 * training orbit/drag controller after a normal collision. Bat2kg/ball1kg are
 * explicit effective impact proxies, not inferred solid-iron or human masses.
 * Catch assembly3kg/Quaffle0.3kg are disclosed impulse proxies. Both sides of
 * every impulse feed the actual held ball/hand or bat/arm response. Subsequent
 * damped return is an actuated carry action, not a muscle or material solver.
 *
 * @evidence contracts/common.md#implementation-and-ownership Calls public projectileAt and resolveImpact with fixed measured event inputs. Free balls never inherit later hand/bat transforms. Bounce coefficients0.8 each select the installed policy's0.64bounce; both returned velocities own ball flight and Beater recoil. Inelastic catch response derives from incoming projectile and receiver velocity and drives the held-ball hands.
 * @evidence contracts/common.md#authoring-interface Passes supply metre endpoints and global release/catch seconds. Strikes supply metre ball-centre contacts, unit-normal direction and actual tip m/s. Returns owned states and acquisition-free diagnostic event data; catch absorption/visible motion remain scene responsibilities.
 */
export function createBallFlights(passes: readonly Pass[], strikes: readonly Strike[]): {
  sample: (seconds: number) => { quaffle?: THREE.Vector3; bludgers: { position: THREE.Vector3; velocity: THREE.Vector3; acceleration: THREE.Vector3 }[] };
  response: (actor: string, seconds: number) => { offset: THREE.Vector3; velocity: THREE.Vector3; acceleration: THREE.Vector3 };
  events: { passes: object[]; strikes: object[]; catches: object[]; responses: object[] };
} {
  const gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0);
  const throws: Throw[] = passes.map((p: Pass): Throw => {
    const duration: number = p.catch - p.release;
    if (!(duration > 0)) throw new Error("Ball pass requires increasing event times");
    const velocity: THREE.Vector3 = p.target.clone().sub(p.origin).addScaledVector(gravity, -0.5 * duration * duration).divideScalar(duration);
    return { ...p, origin: p.origin.clone(), target: p.target.clone(), receiverVelocity: p.receiverVelocity.clone(), velocity };
  });
  const impacts: Impact[] = strikes.map((s: Strike): Impact => {
    const normal: THREE.Vector3 = s.normal.clone().normalize();
    const incoming: THREE.Vector3 = normal.clone().multiplyScalar(-3);
    const result: ReturnType<typeof resolveImpact> = resolveImpact(
      { mass: 2, velocity: s.batVelocity, restitution: 0.8, hardness: 1, penetrability: 0 },
      { mass: 1, velocity: incoming, restitution: 0.8, hardness: 1, penetrability: 0 }, normal,
    );
    const outgoing: THREE.Vector3 = new THREE.Vector3(result.velocityB.x, result.velocityB.y, result.velocityB.z);
    return { actor: s.actor, time: s.time, position: s.position.clone(), incoming, outgoing, batBefore: s.batVelocity.clone(), batAfter: new THREE.Vector3(result.velocityA.x, result.velocityA.y, result.velocityA.z), normal, impulse: outgoing.clone().sub(incoming).dot(normal), kind: result.kind };
  });
  const catches: Catch[] = throws.map((p: Throw): Catch => {
    const flight: ReturnType<typeof projectileAt> = projectileAt({ origin: p.origin, velocity: p.velocity, gravity }, p.catch - p.release);
    const incoming: THREE.Vector3 = new THREE.Vector3(flight.velocity.x, flight.velocity.y, flight.velocity.z);
    const normal: THREE.Vector3 = p.receiverVelocity.clone().sub(incoming);
    if (normal.lengthSq() < 1e-16) normal.set(0, 1, 0);
    normal.normalize();
    const result: ReturnType<typeof resolveImpact> = resolveImpact(
      { mass: 3, velocity: p.receiverVelocity, restitution: 0, hardness: 1, penetrability: 0 },
      { mass: 0.3, velocity: incoming, restitution: 0, hardness: 1, penetrability: 0 }, normal,
    );
    return { actor: p.receiver, time: p.catch, position: p.target.clone(), incoming, before: p.receiverVelocity, after: new THREE.Vector3(result.velocityA.x, result.velocityA.y, result.velocityA.z), ballAfter: new THREE.Vector3(result.velocityB.x, result.velocityB.y, result.velocityB.z), impulse: new THREE.Vector3(result.impulse.x, result.impulse.y, result.impulse.z) };
  });
  const responses: Response[] = [
    ...impacts.map((s: Impact): Response => ({ actor: s.actor, time: s.time, deltaVelocity: s.batAfter.clone().sub(s.batBefore), tau: 0.12, kind: "strike" })),
    ...catches.map((s: Catch): Response => ({ actor: s.actor, time: s.time, deltaVelocity: s.after.clone().sub(s.before), tau: 0.18, kind: "catch" })),
  ];
  return {
    sample, response,
    events: {
      passes: throws.map((p: Throw): object => ({ release: p.release, catch: p.catch, receiver: p.receiver, origin: p.origin.toArray(), target: p.target.toArray(), velocity: p.velocity.toArray(), gravity: gravity.toArray() })),
      strikes: impacts.map((s: Impact): object => ({ actor: s.actor, time: s.time, position: s.position.toArray(), normal: s.normal.toArray(), incoming: s.incoming.toArray(), outgoing: s.outgoing.toArray(), batBefore: s.batBefore.toArray(), batAfter: s.batAfter.toArray(), kind: s.kind, effectiveRestitution: 0.64, normalImpulseKgMetresPerSecond: s.impulse, effectiveBatMassKg: 2, effectiveBallMassKg: 1 })),
      catches: catches.map((s: Catch): object => ({ actor: s.actor, time: s.time, position: s.position.toArray(), incoming: s.incoming.toArray(), receiverBefore: s.before.toArray(), receiverAfter: s.after.toArray(), ballAfter: s.ballAfter.toArray(), impulse: s.impulse.toArray(), effectiveReceiverMassKg: 3, ballMassKg: 0.3 })),
      responses: responses.map((s: Response): object => ({ actor: s.actor, time: s.time, kind: s.kind, deltaVelocity: s.deltaVelocity.toArray(), timeConstantSeconds: s.tau })),
    },
  };

  /** Shared post-impulse response is consumed by actual Human hands and props. */
  function response(actor: string, seconds: number): ReturnType<ReturnType<typeof createBallFlights>["response"]> {
    if (!Number.isFinite(seconds)) throw new Error("Response time must be finite");
    const offset: THREE.Vector3 = new THREE.Vector3();
    const velocity: THREE.Vector3 = new THREE.Vector3();
    const acceleration: THREE.Vector3 = new THREE.Vector3();
    for (const s of responses) {
      const dt: number = seconds - s.time;
      if (actor !== s.actor || dt < 0) continue;
      const decay: number = Math.exp(-dt / s.tau);
      offset.addScaledVector(s.deltaVelocity, dt * decay);
      velocity.addScaledVector(s.deltaVelocity, decay * (1 - dt / s.tau));
      acceleration.addScaledVector(s.deltaVelocity, decay * (dt / (s.tau * s.tau) - 2 / s.tau));
    }
    return { offset, velocity, acceleration };
  }

  /** Pure event-relative evaluation keeps arbitrary seek order reproducible. */
  function sample(seconds: number): ReturnType<ReturnType<typeof createBallFlights>["sample"]> {
    if (!Number.isFinite(seconds)) throw new Error("Ball time must be finite");
    const p: Throw | undefined = throws.find((item: Throw): boolean => seconds >= item.release && seconds < item.catch);
    const flight: ReturnType<typeof projectileAt> | undefined = p ? projectileAt({ origin: p.origin, velocity: p.velocity, gravity }, seconds - p.release) : undefined;
    return {
      quaffle: flight ? new THREE.Vector3(flight.position.x, flight.position.y, flight.position.z) : undefined,
      bludgers: impacts.map((s: Impact): { position: THREE.Vector3; velocity: THREE.Vector3; acceleration: THREE.Vector3 } => {
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
