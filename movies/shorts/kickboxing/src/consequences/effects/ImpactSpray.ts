import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { ContactReceipts } from "../../interactions/kickboxing/ContactReceipts";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";

/**
 * Sweat thrown off struck skin and blood from a clean face blow, as droplets
 * flying ballistically from the measured contact and, for the finish, drops
 * that stay on the canvas. Every droplet is a pure function of its receipt,
 * a seeded draw and the second, so seeking shows the same spray.
 *
 * ```ts
 * const spray = new ImpactSpray(filmSeed, receipts, points);
 * spray.place(150.2);
 * ```
 *
 * @evidence docs/body/settings/cast/fighter-a.md#marks Each clean blow throws sweat off the struck skin; a clean face blow also draws blood.
 * @evidence docs/body/settings/sets/ring.md#blood Blood from the finish marks the canvas and stays.
 */
export class ImpactSpray {
  /** The droplets' root. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly sweat: THREE.InstancedMesh;

  private readonly blood: THREE.InstancedMesh;

  private readonly drops: ImpactSpray.IDrop[];

  /** Droplets thrown by one landed blow (film choice: a readable fan at medium size). */
  public static readonly DROPLETS: number = 14;

  /** Gravity, m/s^2. */
  public static readonly GRAVITY: number = 9.81;

  /** Seconds a droplet flies before it is gone or lies on the canvas. */
  public static readonly FLIGHT: number = 0.6;

  /**
   * Prepare the spray.
   *
   * @param seed The film seed.
   * @param receipts The measured contacts.
   * @param points The world contact point of each receipt by anchor.
   */
  public constructor(seed: string, receipts: readonly ContactReceipts.IReceipt[], points: Readonly<Record<string, IAutoMovieVector3>>) {
    this.drops = [];
    for (const r of receipts) {
      if (r.outcome !== "landed" || !r.contact || !points[r.anchor]) continue;
      const spec: KickboxingTechnique.ISpec = KickboxingTechnique.table[r.technique];
      const random = createAutoMovieRandom(deriveAutoMovieSeed(seed, "spray", r.anchor));
      const bleeds: boolean = spec.level === "head";
      for (let k: number = 0; k < ImpactSpray.DROPLETS; k++) {
        // A fan away from the striker: random direction in the upper hemisphere, speed 1.5-3.5 m/s.
        const azimuth: number = random.float(k * 4) * Math.PI * 2;
        const rise: number = random.float(k * 4 + 1) * 0.6 + 0.2;
        const speed: number = 1.5 + random.float(k * 4 + 2) * 2;
        this.drops.push({
          start: r.seconds,
          origin: points[r.anchor]!,
          velocity: { x: Math.cos(azimuth) * speed * (1 - rise), y: rise * speed, z: Math.sin(azimuth) * speed * (1 - rise) },
          blood: bleeds && random.float(k * 4 + 3) < (spec.disguise !== undefined ? 0.6 : 0.3),
          stays: spec.disguise !== undefined,
        });
      }
    }
    const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(0.008, 6, 4);
    this.sweat = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color: 0xdfe8ee, roughness: 0.2, transparent: true, opacity: 0.8 }), Math.max(1, this.drops.length));
    this.blood = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ color: 0x8a0f16, roughness: 0.4 }), Math.max(1, this.drops.length));
    this.object.add(this.sweat, this.blood);
  }

  /**
   * Show the droplets at a second.
   *
   * @param seconds Film seconds.
   */
  public place(seconds: number): void {
    const matrix: THREE.Matrix4 = new THREE.Matrix4();
    let sweat: number = 0;
    let blood: number = 0;
    for (const d of this.drops) {
      const t: number = seconds - d.start;
      if (t < 0 || (t > ImpactSpray.FLIGHT && !(d.blood && d.stays))) continue;
      const f: number = Math.min(t, ImpactSpray.FLIGHT);
      const y: number = Math.max(0.002, d.origin.y + d.velocity.y * f - 0.5 * ImpactSpray.GRAVITY * f * f);
      matrix.makeTranslation(d.origin.x + d.velocity.x * f, y, d.origin.z + d.velocity.z * f);
      if (d.blood) this.blood.setMatrixAt(blood++, matrix);
      else this.sweat.setMatrixAt(sweat++, matrix);
    }
    this.sweat.count = sweat;
    this.blood.count = blood;
    this.sweat.instanceMatrix.needsUpdate = true;
    this.blood.instanceMatrix.needsUpdate = true;
  }

  /** Release the droplets. */
  public dispose(): void {
    this.sweat.geometry.dispose();
    (this.sweat.material as THREE.Material).dispose();
    (this.blood.material as THREE.Material).dispose();
    this.object.removeFromParent();
  }
}

/** Companion types of {@link ImpactSpray}. */
export namespace ImpactSpray {
  /** One droplet. */
  export interface IDrop {
    /** Seconds it leaves the skin. */
    start: number;

    /** Where it leaves, world metres. */
    origin: IAutoMovieVector3;

    /** Initial velocity, m/s. */
    velocity: IAutoMovieVector3;

    /** Whether it is blood. */
    blood: boolean;

    /** Whether it stays on the canvas. */
    stays: boolean;
  }
}
