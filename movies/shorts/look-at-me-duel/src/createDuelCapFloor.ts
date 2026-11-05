import * as THREE from "three";

/** A normalized-mass planar rigid-cap state after its first actual corner contact. */
interface State { y: number; z: number; angle: number; vy: number; vz: number; omega: number }

/** Actual floor-supported base extruded across the full cap width. */
interface Base { minZ: number; maxZ: number; top: number }

/** One real planar point/face contact, with accumulated step impulses. */
interface Contact { y: number; z: number; gap: number; ny: number; nz: number; normal: number; tangent: number }

/**
 * Prepare the cap's inelastic response against the floor and finite base.
 * @evidence contracts/common.md#implementation-and-ownership Actual height/depth give inertia per unit mass (h²+d²)/12. Floor corners, finite base top/front faces and its actual front-top edge supply point/face contacts in the YZ plane; the base spans the cap width. Gravity, unilateral normal impulses and Coulomb-limited tangent impulses precede integration. Only real static contacts change angular momentum. SAT measures base separation and bounded numerical stabilization is reported. This small cap-specific model is not a general rigid-body engine, calibrated masonry or fracture simulation.
 * @evidence contracts/common.md#authoring-interface Supply actual first floor-contact COM/velocity/spin, dimensions, global seconds and optional actual base extent behind its south/front face. Default4800Hz/24 sweeps and9600Hz inspection retain restitution0/friction0.65 assumptions. A supported state sleeps below0.1mm/s and0.0001rad/s, including a legitimate inclined rest on base and floor. Diagnostics refuse excessive floor/base stabilization, velocity violation, energy increase or missing rest. Queries read fixed prepared states; no Human solver or geometry proxy is used.
 */
export function createDuelCapFloor(centre: THREE.Vector3, velocity: THREE.Vector3, angle: number, angularVelocity: number, height: number, depth: number, impactSeconds: number, rate: number = 4800, base?: Base): {
  at: (seconds: number) => { centre: THREE.Vector3; rotationX: number; landed: boolean };
  settledSeconds: number;
  diagnostics: { admitted: boolean; rate: number; restitution: number; friction: number; inertiaPerUnitMass: number; steps: number; maxStabilizationMetres: number; maxVelocityViolation: number; maxEnergyIncreasePerUnitMass: number; restSpeedThreshold: number; staticBase: Base | null; minimumBaseSeparation: number | null; settled: boolean };
} {
  if (![...centre.toArray(), ...velocity.toArray(), angle, angularVelocity, height, depth, impactSeconds, rate].every(Number.isFinite) || height <= 0 || depth <= 0 || !Number.isInteger(rate) || rate < 4800 || rate > 19200 || velocity.x !== 0) throw new Error("Finite actual planar-cap first-contact input required");
  if (base !== undefined && (![base.minZ, base.maxZ, base.top].every(Number.isFinite) || base.minZ >= base.maxZ || base.top <= 0 || centre.z <= base.maxZ)) throw new Error("Actual planar base must stand behind the first-contact cap centre");
  const halfHeight: number = height / 2;
  const halfDepth: number = depth / 2;
  const inertia: number = (height * height + depth * depth) / 12;
  const dt: number = 1 / rate;
  const friction: number = 0.65;
  const local: readonly (readonly [number, number])[] = [[-halfHeight, -halfDepth], [-halfHeight, halfDepth], [halfHeight, -halfDepth], [halfHeight, halfDepth]];
  const states: State[] = [{ y: centre.y, z: centre.z, angle, vy: velocity.y, vz: velocity.z, omega: angularVelocity }];
  let maximumCorrection: number = 0;
  let maximumViolation: number = 0;
  let maximumEnergyIncrease: number = 0;
  let settled: boolean = false;
  let minimumBaseSeparation: number = Infinity;

  /** Actual lowest rectangular-cap corner relative to the floor. */
  function minimum(state: State): number { return state.y - halfHeight * Math.abs(Math.cos(state.angle)) - halfDepth * Math.abs(Math.sin(state.angle)); }
  /** Specific mechanical energy; mass is normalized, not inferred from the image. */
  function energy(state: State): number { return (state.vy ** 2 + state.vz ** 2 + inertia * state.omega ** 2) / 2 + 9.81 * state.y; }
  /** Separating-axis distance of these exact extruded rectangles, positive outside. */
  function separation(state: State): { gap: number; ny: number; nz: number } {
    if (base === undefined) return { gap: Infinity, ny: 1, nz: 0 };
    const c: number = Math.cos(state.angle); const s: number = Math.sin(state.angle);
    const dy: number = state.y - base.top / 2; const dz: number = state.z - (base.minZ + base.maxZ) / 2;
    const by: number = base.top / 2; const bz: number = (base.maxZ - base.minZ) / 2;
    let best: { gap: number; ny: number; nz: number } = { gap: -Infinity, ny: 1, nz: 0 };
    for (const [ny, nz] of [[1, 0], [0, 1], [c, s], [-s, c]]) {
      const distance: number = dy * ny! + dz * nz!;
      const radius: number = halfHeight * Math.abs(c * ny! + s * nz!) + halfDepth * Math.abs(-s * ny! + c * nz!) + by * Math.abs(ny!) + bz * Math.abs(nz!);
      const gap: number = Math.abs(distance) - radius;
      if (gap > best.gap) best = { gap, ny: ny! * (distance < 0 ? -1 : 1), nz: nz! * (distance < 0 ? -1 : 1) };
    }
    return best;
  }
  /** Bounded positional roundoff correction, independent of contact impulses. */
  function stabilize(state: State): number {
    const y: number = state.y; const z: number = state.z;
    for (let pass: number = 0; pass < 4; pass++) {
      state.y += Math.max(0, -minimum(state));
      const contact: ReturnType<typeof separation> = separation(state);
      if (contact.gap < 0) { state.y -= contact.gap * contact.ny; state.z -= contact.gap * contact.nz; }
    }
    return Math.hypot(state.y - y, state.z - z);
  }
  if (Math.abs(minimum(states[0]!)) > 1e-7) throw new Error("Cap floor response must start at actual first corner contact");

  for (let step: number = 1; step <= 2 * rate; step++) {
    const before: State = states.at(-1)!;
    const state: State = { ...before, vy: before.vy - 9.81 * dt };
    const contacts: Contact[] = [];
    const cosine: number = Math.cos(state.angle); const sine: number = Math.sin(state.angle);
    for (const [y, z] of local) {
      const ry: number = y * Math.cos(state.angle) - z * Math.sin(state.angle);
      const rz: number = y * Math.sin(state.angle) + z * Math.cos(state.angle);
      contacts.push({ y: ry, z: rz, gap: state.y + ry, ny: 1, nz: 0, normal: 0, tangent: 0 });
      if (base !== undefined) {
        const worldY: number = state.y + ry; const worldZ: number = state.z + rz;
        if (worldZ >= base.minZ && worldZ <= base.maxZ) contacts.push({ y: ry, z: rz, gap: worldY - base.top, ny: 1, nz: 0, normal: 0, tangent: 0 });
        if (worldY >= 0 && worldY <= base.top) contacts.push({ y: ry, z: rz, gap: worldZ - base.maxZ, ny: 0, nz: 1, normal: 0, tangent: 0 });
      }
    }
    if (base !== undefined) {
      // The finite base front-top edge can meet the interior of a cap face;
      // testing only the cap's corners would miss this contact.
      const dy: number = base.top - state.y; const dz: number = base.maxZ - state.z;
      const ly: number = dy * cosine + dz * sine; const lz: number = -dy * sine + dz * cosine;
      if (lz >= -halfDepth && lz <= halfDepth && ly < 0) contacts.push({ y: -halfHeight * cosine - lz * sine, z: -halfHeight * sine + lz * cosine, gap: -halfHeight - ly, ny: cosine, nz: sine, normal: 0, tangent: 0 });
      if (ly >= -halfHeight && ly <= halfHeight && lz < 0) contacts.push({ y: ly * cosine + halfDepth * sine, z: ly * sine - halfDepth * cosine, gap: -halfDepth - lz, ny: -sine, nz: cosine, normal: 0, tangent: 0 });
    }
    for (let iteration: number = 0; iteration < 24; iteration++) for (const contact of contacts) {
      const normalArm: number = contact.y * contact.nz - contact.z * contact.ny;
      const tangentArm: number = contact.y * contact.ny + contact.z * contact.nz;
      const normalSpeed: number = state.vy * contact.ny + state.vz * contact.nz + state.omega * normalArm;
      const wanted: number = -Math.max(0, contact.gap) / dt;
      const impulse: number = Math.max(0, contact.normal + (wanted - normalSpeed) / (1 + normalArm ** 2 / inertia));
      const delta: number = impulse - contact.normal;
      contact.normal = impulse;
      state.vy += contact.ny * delta;
      state.vz += contact.nz * delta;
      state.omega += normalArm * delta / inertia;
      const tangentSpeed: number = -state.vy * contact.nz + state.vz * contact.ny + state.omega * tangentArm;
      const tangent: number = THREE.MathUtils.clamp(contact.tangent - tangentSpeed / (1 + tangentArm ** 2 / inertia), -friction * impulse, friction * impulse);
      const deltaTangent: number = tangent - contact.tangent;
      contact.tangent = tangent;
      state.vy -= contact.nz * deltaTangent;
      state.vz += contact.ny * deltaTangent;
      state.omega += tangentArm * deltaTangent / inertia;
    }
    for (const contact of contacts) maximumViolation = Math.max(maximumViolation, -Math.max(0, contact.gap) / dt - (state.vy * contact.ny + state.vz * contact.nz + state.omega * (contact.y * contact.nz - contact.z * contact.ny)));
    state.y += state.vy * dt;
    state.z += state.vz * dt;
    state.angle += state.omega * dt;
    const correction: number = stabilize(state);
    maximumCorrection = Math.max(maximumCorrection, correction);
    minimumBaseSeparation = Math.min(minimumBaseSeparation, separation(state).gap);
    maximumEnergyIncrease = Math.max(maximumEnergyIncrease, energy(state) - energy(before));
    states.push(state);
    if (step > 4 && Math.max(Math.abs(state.vy), Math.abs(state.vz), Math.abs(state.omega)) < 1e-4 && Math.min(minimum(state), separation(state).gap) < 1e-5) { settled = true; break; }
  }
  const settledSeconds: number = impactSeconds + (states.length - 1) * dt;
  return {
    settledSeconds,
    diagnostics: { admitted: settled && maximumCorrection <= 1e-5 && maximumViolation <= 0.001 && maximumEnergyIncrease <= 0.001 && minimumBaseSeparation >= -1e-8, rate, restitution: 0, friction, inertiaPerUnitMass: inertia, steps: states.length - 1, maxStabilizationMetres: maximumCorrection, maxVelocityViolation: maximumViolation, maxEnergyIncreasePerUnitMass: maximumEnergyIncrease, restSpeedThreshold: 1e-4, staticBase: base === undefined ? null : { ...base }, minimumBaseSeparation: base === undefined ? null : minimumBaseSeparation, settled },
    at: (seconds: number): { centre: THREE.Vector3; rotationX: number; landed: boolean } => {
      if (!Number.isFinite(seconds)) throw new Error("Finite cap floor seconds required");
      const sample: number = THREE.MathUtils.clamp((seconds - impactSeconds) * rate, 0, states.length - 1);
      const low: State = states[Math.floor(sample)]!;
      const high: State = states[Math.min(states.length - 1, Math.floor(sample) + 1)]!;
      const mix: number = sample - Math.floor(sample);
      const current: State = { ...low, y: THREE.MathUtils.lerp(low.y, high.y, mix), z: THREE.MathUtils.lerp(low.z, high.z, mix), angle: THREE.MathUtils.lerp(low.angle, high.angle, mix) };
      const correction: number = stabilize(current);
      if (correction > 1e-5) throw new Error("Interpolated cap floor stabilization exceeded its admitted numerical bound");
      return { centre: new THREE.Vector3(centre.x, current.y, current.z), rotationX: current.angle, landed: settled && seconds >= settledSeconds };
    },
  };
}
