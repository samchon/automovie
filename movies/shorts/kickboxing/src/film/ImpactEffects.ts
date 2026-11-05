import * as THREE from "three";

import { Ease } from "../rig/Ease";
import { Vec3 } from "../rig/Vec3";

/**
 * What a landed blow leaves behind: sweat and blood thrown from the struck
 * surface, blood stains on the canvas, a flush that builds on struck skin and
 * the squash of a glove at contact.
 *
 * @evidence contracts/common.md#implementation-and-ownership Every droplet is precomputed once from the measured impacts with a seeded generator and then follows a closed-form ballistic path in film time, so seek, playback and export draw the same spray. Blood that reaches the canvas becomes a stain from its landing second to the end of the film. Flush and squash are pure functions of the impacts and the second.
 * @evidence contracts/common.md#authoring-interface `configure` takes the impacts measured by FilmRuntime; `update(t)` places the droplets and stains for a film second; `flush` and `squash` answer per performer. World metres, film seconds, values in [0, 1].
 */
export class ImpactEffects {
  /** Scene group holding the sweat, blood and stain instances. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly sweat: THREE.InstancedMesh;
  private readonly blood: THREE.InstancedMesh;
  private readonly stains: THREE.InstancedMesh;
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private droplets: ImpactEffects.Droplet[] = [];
  private landed: number[] = [];

  public constructor() {
    const drop: THREE.SphereGeometry = new THREE.SphereGeometry(1, 6, 4);
    const disc: THREE.CircleGeometry = new THREE.CircleGeometry(1, 10);
    disc.rotateX(-Math.PI / 2);
    this.geometries.push(drop, disc);
    const sweat: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6f3ff,
      roughness: 0.08,
      transparent: true,
      opacity: 0.8,
    });
    const blood: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c0b12,
      roughness: 0.35,
    });
    const stain: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
      color: 0x5e080d,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.materials.push(sweat, blood, stain);
    this.sweat = new THREE.InstancedMesh(drop, sweat, CAPACITY);
    this.blood = new THREE.InstancedMesh(drop, blood, CAPACITY);
    this.stains = new THREE.InstancedMesh(disc, stain, CAPACITY);
    for (const mesh of [this.sweat, this.blood, this.stains]) {
      mesh.count = 0;
      mesh.frustumCulled = false;
      this.object.add(mesh);
    }
    this.object.name = "impact-effects";
  }

  /**
   * Precompute every droplet and stain of the measured impacts.
   *
   * @evidence contracts/common.md#implementation-and-ownership One seeded generator per impact (hashed from its id) fixes counts, sizes and velocities; landing seconds solve the ballistic height for the canvas plane, and stains are stored in landing order so `update` only advances a count.
   * @evidence contracts/common.md#authoring-interface Replaces any previous configuration; impacts must come from measured receipts.
   */
  public configure(impacts: readonly ImpactEffects.Impact[]): void {
    this.droplets = impacts.flatMap(ImpactEffects.spray);
    const stains: ImpactEffects.Droplet[] = this.droplets
      .filter((d: ImpactEffects.Droplet): boolean => d.stain !== undefined)
      .sort(
        (x: ImpactEffects.Droplet, y: ImpactEffects.Droplet): number =>
          x.end - y.end,
      )
      .slice(0, CAPACITY);
    this.landed = stains.map((d: ImpactEffects.Droplet): number => d.end);
    const matrix: THREE.Matrix4 = new THREE.Matrix4();
    stains.forEach((d: ImpactEffects.Droplet, index: number): void => {
      const [x, z, radius] = d.stain!;
      matrix.compose(
        new THREE.Vector3(x, 0.002, z),
        new THREE.Quaternion(),
        new THREE.Vector3(radius, 1, radius * 0.8),
      );
      this.stains.setMatrixAt(index, matrix);
    });
    this.stains.instanceMatrix.needsUpdate = true;
    this.stains.count = 0;
  }

  /**
   * Place the airborne droplets and the stains already on the canvas.
   *
   * @evidence contracts/common.md#implementation-and-ownership Linear scan of the precomputed droplets for those airborne at `t`; each position is p0 + v·τ + ½gτ². Stain count is a binary search over landing seconds.
   * @evidence contracts/common.md#authoring-interface Film second; returns the drawn counts.
   */
  public update(t: number): { sweat: number; blood: number; stains: number } {
    const matrix: THREE.Matrix4 = new THREE.Matrix4();
    const rotation: THREE.Quaternion = new THREE.Quaternion();
    const counts: { sweat: number; blood: number } = { sweat: 0, blood: 0 };
    for (const d of this.droplets) {
      if (t < d.start || t >= d.end) continue;
      const mesh: THREE.InstancedMesh =
        d.kind === "sweat" ? this.sweat : this.blood;
      const index: number = counts[d.kind];
      if (index >= CAPACITY) continue;
      const p: Vec3.Value = ImpactEffects.position(d, t);
      matrix.compose(
        new THREE.Vector3(...p),
        rotation,
        new THREE.Vector3(d.radius, d.radius, d.radius),
      );
      mesh.setMatrixAt(index, matrix);
      counts[d.kind]++;
    }
    this.sweat.count = counts.sweat;
    this.blood.count = counts.blood;
    this.sweat.instanceMatrix.needsUpdate = true;
    this.blood.instanceMatrix.needsUpdate = true;
    let low: number = 0;
    let high: number = this.landed.length;
    while (low < high) {
      const middle: number = (low + high) >> 1;
      if (this.landed[middle]! <= t) low = middle + 1;
      else high = middle;
    }
    this.stains.count = low;
    return { ...counts, stains: low };
  }

  /**
   * Free the instance buffers, geometries and materials.
   *
   * @evidence contracts/common.md#implementation-and-ownership Detaches the group and disposes everything this instance created.
   * @evidence contracts/common.md#authoring-interface The instance must not be used afterwards.
   */
  public dispose(): void {
    this.object.removeFromParent();
    for (const mesh of [this.sweat, this.blood, this.stains]) mesh.dispose();
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
  }
}

/** Most droplets or stains drawn at once per kind. */
const CAPACITY: number = 512;

/** Gravity, metres per second squared. */
const GRAVITY: number = 9.81;

/**
 * Types and pure helpers of {@link ImpactEffects}.
 */
export namespace ImpactEffects {
  /**
   * One measured landing.
   *
   * @evidence contracts/common.md#implementation-and-ownership Plain record built by FilmRuntime from a contact receipt and the displayed FK at its second.
   * @evidence contracts/common.md#authoring-interface World metres; `direction` is the unit travel of the blow; `side` is the receiver's struck side; `weapon` is the attacker's glove side, or "shin".
   */
  export interface Impact {
    /** Action identity (seeds the spray). */ id: string;
    /** Contact second. */ seconds: number;
    /** Striking performer. */ attacker: "a" | "b";
    /** Struck performer. */ receiver: "a" | "b";
    /** Measured receiving surface. */ relation:
      | "head"
      | "body"
      | "guard"
      | "shin-check";
    /** Receiver's struck side. */ side: "left" | "right";
    /** Striking glove side, or the shin. */ weapon: "left" | "right" | "shin";
    /** Contact point, world metres. */ point: Vec3.Value;
    /** Unit direction of the blow. */ direction: Vec3.Value;
    /** Measured contact strength in [0, 1]. */ strength: number;
    /** The finishing blow throws the most. */ finish: boolean;
  }

  /**
   * One precomputed droplet.
   *
   * @evidence contracts/common.md#implementation-and-ownership Ballistic state fixed at configuration.
   * @evidence contracts/common.md#authoring-interface Film seconds and world metres; `stain` is [x, z, radius] where blood lands.
   */
  export interface Droplet {
    /** Sweat or blood. */ kind: "sweat" | "blood";
    /** Release second. */ start: number;
    /** Second it lands or fades. */ end: number;
    /** Release point. */ origin: Vec3.Value;
    /** Release velocity, metres per second. */ velocity: Vec3.Value;
    /** Drawn radius, metres. */ radius: number;
    /** Canvas stain left on landing. */ stain?: readonly [
      number,
      number,
      number,
    ];
  }

  /**
   * The droplets one impact throws.
   *
   * @evidence contracts/common.md#implementation-and-ownership Counts follow the receiving surface and the measured strength: a clean face blow throws sweat and a few drops of blood, a body blow sweat, a guard or shin contact a little sweat; the knockout throws the most. Velocities fan around the blow's direction with an upward component, sweat fast and wide, blood slow enough to fall within about a metre; each droplet lives until it reaches the canvas (blood leaves a stain) or 0.8 s for sweat.
   * @evidence contracts/common.md#authoring-interface Pure; the same impact always yields the same droplets.
   */
  export function spray(impact: Impact): Droplet[] {
    const random: () => number = seeded(impact.id);
    const s: number = Math.max(0, Math.min(1, impact.strength));
    const counts: Record<Droplet["kind"], number> =
      impact.relation === "head"
        ? { sweat: impact.finish ? 40 : 24, blood: impact.finish ? 22 : 6 }
        : impact.relation === "body"
          ? { sweat: 20, blood: 0 }
          : { sweat: 7, blood: 0 };
    const forward: Vec3.Value = Vec3.normalize([
      impact.direction[0],
      0,
      impact.direction[2],
    ]);
    const across: Vec3.Value = [-forward[2], 0, forward[0]];
    const result: Droplet[] = [];
    for (const kind of ["sweat", "blood"] as const)
      for (let i: number = 0; i < Math.round(counts[kind] * s); i++) {
        // Sweat flies off fast and wide; heavier blood drops fall near the fighters.
        const blood: boolean = kind === "blood";
        const speed: number = blood
          ? 0.4 + 1.2 * random()
          : 1.2 + 2.2 * random();
        const velocity: Vec3.Value = Vec3.add(
          Vec3.add(
            Vec3.scale(forward, speed),
            Vec3.scale(across, (random() - 0.5) * (blood ? 1.0 : 2.4)),
          ),
          [0, (blood ? 0.1 : 0.3) + (blood ? 0.9 : 1.6) * random(), 0],
        );
        const origin: Vec3.Value = Vec3.add(impact.point, [
          (random() - 0.5) * 0.06,
          (random() - 0.5) * 0.06,
          (random() - 0.5) * 0.06,
        ]);
        const start: number = impact.seconds + 0.01 + 0.04 * random();
        const fall: number =
          (velocity[1] +
            Math.sqrt(
              velocity[1] ** 2 + 2 * GRAVITY * Math.max(0, origin[1]),
            )) /
          GRAVITY;
        const radius: number =
          kind === "blood"
            ? 0.009 + 0.009 * random()
            : 0.008 + 0.008 * random();
        const land: Vec3.Value = Vec3.add(origin, Vec3.scale(velocity, fall));
        result.push(
          kind === "blood"
            ? {
                kind,
                start,
                end: start + fall,
                origin,
                velocity,
                radius,
                stain: [land[0], land[2], radius * (1.6 + 1.4 * random())],
              }
            : {
                kind,
                start,
                end: start + Math.min(fall, 0.8),
                origin,
                velocity,
                radius,
              },
        );
      }
    return result;
  }

  /**
   * World position of a droplet at a film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed-form ballistic path.
   * @evidence contracts/common.md#authoring-interface Film second within the droplet's life; world metres.
   */
  export function position(droplet: Droplet, t: number): Vec3.Value {
    const tau: number = t - droplet.start;
    return [
      droplet.origin[0] + droplet.velocity[0] * tau,
      droplet.origin[1] + droplet.velocity[1] * tau - 0.5 * GRAVITY * tau * tau,
      droplet.origin[2] + droplet.velocity[2] * tau,
    ];
  }

  /**
   * How flushed a performer's skin is at a second.
   *
   * @evidence contracts/common.md#implementation-and-ownership Each clean face blow adds a mark that settles to half its peak over about eight seconds and never fades below it; body blows mark the struck side the same way. Four clean blows (the knockout counts double) saturate a region.
   * @evidence contracts/common.md#authoring-interface Values in [0, 1] for the face and each side of the trunk.
   */
  export function flush(
    impacts: readonly Impact[],
    receiver: "a" | "b",
    t: number,
  ): { face: number; left: number; right: number } {
    const total: { face: number; left: number; right: number } = {
      face: 0,
      left: 0,
      right: 0,
    };
    for (const impact of impacts) {
      if (impact.receiver !== receiver || impact.seconds > t) continue;
      if (impact.relation !== "head" && impact.relation !== "body") continue;
      const mark: number =
        impact.strength *
        (impact.finish ? 2 : 1) *
        (0.5 + 0.5 * Math.exp(-(t - impact.seconds) / 8)) *
        Ease.ramp(t, impact.seconds, impact.seconds + 0.25);
      if (impact.relation === "head") total.face += mark;
      else total[impact.side] += mark;
    }
    return {
      face: Math.min(1, total.face / 4),
      left: Math.min(1, total.left / 4),
      right: Math.min(1, total.right / 4),
    };
  }

  /**
   * How far a glove is squashed against what it hit.
   *
   * @evidence contracts/common.md#implementation-and-ownership A glove flattens as it lands and springs back over about 0.12 s: the striking glove of every measured punch, and the receiving glove of a guard contact.
   * @evidence contracts/common.md#authoring-interface Squash in [0, 1] for one performer's glove at a second.
   */
  export function squash(
    impacts: readonly Impact[],
    actor: "a" | "b",
    side: "left" | "right",
    t: number,
  ): number {
    let amount: number = 0;
    for (const impact of impacts) {
      if (Math.abs(t - impact.seconds) > 0.2) continue;
      const striking: boolean =
        impact.attacker === actor && impact.weapon === side;
      const receiving: boolean =
        impact.receiver === actor &&
        impact.relation === "guard" &&
        impact.side === side;
      if (!striking && !receiving) continue;
      amount = Math.max(
        amount,
        impact.strength *
          Ease.pulse(
            t,
            impact.seconds - 0.03,
            impact.seconds,
            impact.seconds + 0.12,
          ),
      );
    }
    return amount;
  }

  /** Deterministic generator seeded from a string (FNV-1a hash into mulberry32). */
  function seeded(text: string): () => number {
    let state: number = 2166136261;
    for (let i: number = 0; i < text.length; i++)
      state = Math.imul(state ^ text.charCodeAt(i), 16777619);
    return (): number => {
      state = (state + 0x6d2b79f5) | 0;
      let x: number = Math.imul(state ^ (state >>> 15), 1 | state);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
}
