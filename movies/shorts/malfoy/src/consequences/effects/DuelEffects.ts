import * as THREE from "three";

import type { FallingMasonry } from "../../entities/props/falling-masonry/FallingMasonry";
import type { IStageProp } from "../../entities/props/IStageProp";
import { ShieldTrack } from "../../interactions/duelling/ShieldTrack";
import type { SpellTrack } from "../../interactions/duelling/SpellTrack";
import type { MasonryTrack } from "../../interactions/physics/MasonryTrack";
import { FallLaw } from "../../laws/physics/FallLaw";

/**
 * What the duel's computed outcomes leave on screen: each spell's streak (a
 * 0.4 m bar of blue-white or scarlet light moving at its speed, with a small
 * flash at its end), each shield's translucent pale-blue oval growing,
 * standing and fading, and the failing cap with its chips, grit, fragments
 * and dust. It draws only from the resolved tracks.
 *
 * ```ts
 * const effects = new DuelEffects(spells, shields, masonry, cap);
 * scene.add(effects.object); effects.place(30.4);
 * ```
 *
 * @evidence docs/body/settings/world/magic.md#practice-only Streak 0.4 m long and 2 cm thick; blue-white jinx, scarlet disarm; a small flash on impact; the shield's form.
 * @evidence docs/body/settings/props/shield.md#surface Translucent pale-blue oval with a brighter rim, about 70% transmission.
 * @evidence docs/body/settings/props/falling-masonry.md#failure The cap's stages and debris.
 * @evidence contracts/development/behaviors.md#relational-goals Every mark follows a computed outcome.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns its meshes until `dispose`.
 * @evidence contracts/development/common.md#meaningful-documentation States what is drawn and from what.
 */
export class DuelEffects {
  /** Root of every effect. */
  public readonly object: THREE.Group = new THREE.Group();

  private readonly owned: { dispose(): void }[] = [];

  private readonly streakMeshes: THREE.Mesh[];

  private readonly flashMeshes: THREE.Mesh[];

  private readonly shieldMeshes: { surface: THREE.Mesh; rim: THREE.Mesh; material: THREE.MeshStandardMaterial }[];

  private readonly cap: IStageProp.IFigure | undefined;

  private readonly debris: IStageProp.IFigure | undefined;

  /**
   * Build the effects.
   *
   * @param spells The spells.
   * @param shields The shields.
   * @param masonry The cap's track, on the court.
   * @param cap The cap prop, on the court.
   */
  public constructor(
    private readonly spells: SpellTrack.ITrack,
    private readonly shields: ShieldTrack.IShield[],
    private readonly masonry?: MasonryTrack,
    cap?: FallingMasonry,
  ) {
    // A streak is a deep-blue (or scarlet) 2 cm bar with a white core showing at both tips, so it reads over the pale sky and the floor alike.
    const bar: THREE.BoxGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.02);
    const core: THREE.BoxGeometry = new THREE.BoxGeometry(0.46, 0.009, 0.009);
    const ball: THREE.SphereGeometry = new THREE.SphereGeometry(0.06, 8, 6);
    const blue: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x1f56d0 });
    const white: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xeef6ff });
    const red: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xd81e1e });
    this.owned.push(bar, core, ball, blue, white, red);
    this.streakMeshes = spells.streaks.map((s) => {
      const m: THREE.Mesh = new THREE.Mesh(bar, s.spell === "disarm" ? red : blue);
      m.add(new THREE.Mesh(core, white));
      this.object.add(m);
      return m;
    });
    this.flashMeshes = spells.impacts.map((i) => {
      const m: THREE.Mesh = new THREE.Mesh(ball, i.spell === "disarm" ? red : blue);
      this.object.add(m);
      return m;
    });
    const disc: THREE.CircleGeometry = new THREE.CircleGeometry(1, 32);
    const ring: THREE.TorusGeometry = new THREE.TorusGeometry(1, 0.012, 6, 40);
    this.owned.push(disc, ring);
    this.shieldMeshes = shields.map(() => {
      const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xa9d4ff, emissive: 0x335577, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
      const rimMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xcfe8ff });
      this.owned.push(material, rimMaterial);
      const surface: THREE.Mesh = new THREE.Mesh(disc, material);
      const rim: THREE.Mesh = new THREE.Mesh(ring, rimMaterial);
      this.object.add(surface, rim);
      return { surface, rim, material };
    });
    if (cap && masonry) {
      this.cap = cap.figure();
      this.debris = cap.debris();
      this.object.add(this.cap.object, this.debris.object);
    }
  }

  /** Place every effect for a second. */
  public place(seconds: number): void {
    this.spells.streaks.forEach((s, k) => {
      const m: THREE.Mesh = this.streakMeshes[k]!;
      const live: boolean = seconds >= s.start && seconds < s.end;
      m.visible = live;
      if (!live) return;
      const u: number = (seconds - s.start) / Math.max(1e-6, s.end - s.start);
      m.position.set(s.from.x + (s.to.x - s.from.x) * u, s.from.y + (s.to.y - s.from.y) * u, s.from.z + (s.to.z - s.from.z) * u);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(s.to.x - s.from.x, s.to.y - s.from.y, s.to.z - s.from.z).normalize());
    });
    this.spells.impacts.forEach((i, k) => {
      const m: THREE.Mesh = this.flashMeshes[k]!;
      const age: number = seconds - i.at;
      m.visible = age >= 0 && age < 0.15;
      m.position.set(i.point.x, i.point.y, i.point.z);
    });
    this.shields.forEach((s, k) => {
      const look = ShieldTrack.at(s, seconds);
      const { surface, rim, material } = this.shieldMeshes[k]!;
      surface.visible = rim.visible = look.scale > 0;
      if (!surface.visible) return;
      for (const o of [surface, rim]) {
        o.position.set(s.centre.x, s.centre.y, s.centre.z);
        o.rotation.set(0, s.facing, 0);
        o.scale.set(0.75 * look.scale, 0.9 * look.scale, 1);
      }
      material.opacity = 0.3 * look.opacity;
    });
    if (this.masonry && this.cap && this.debris) {
      const block = this.masonry.block(seconds);
      this.cap.object.position.set(block.position.x, block.position.y, block.position.z);
      this.cap.object.rotation.set(block.angle, 0, 0);
      const m: MasonryTrack = this.masonry;
      const fillet = { x: 1.7, y: 2.66, z: -2.25 };
      for (const child of this.debris.object.children) {
        child.visible = false;
        if (child.name.startsWith("chip-") && seconds >= m.struck) {
          const k: number = Number(child.name.slice(5));
          const drop: number = Math.min(2.62, FallLaw.fallen(seconds - m.struck));
          child.visible = true;
          child.position.set(fillet.x - 0.15 + 0.3 * k, fillet.y - drop, fillet.z + 0.35);
        } else if (child.name.startsWith("fragment-") && seconds >= m.landing) {
          const f = m.fragments[Number(child.name.slice(9))]!;
          const u: number = Math.min(1, (seconds - f.start) / Math.max(0.01, f.end - f.start));
          child.visible = true;
          child.position.set(f.from.x + (f.to.x - f.from.x) * u, f.from.y + (f.to.y - f.from.y) * u + 0.3 * Math.sin(Math.PI * u) * (1 - u), f.from.z + (f.to.z - f.from.z) * u);
        } else if (child.name === "grit" && seconds >= m.struck && seconds < m.release) {
          child.visible = true;
          child.position.set(fillet.x, fillet.y / 2, fillet.z + 0.05);
          child.scale.set(1, fillet.y, 1);
        } else if (child.name === "dust" && seconds >= m.landing && seconds < m.landing + FallLaw.DUST.seconds) {
          const u: number = (seconds - m.landing) / FallLaw.DUST.seconds;
          child.visible = true;
          const rest = { x: 1.7, z: -1.65 };
          child.position.set(rest.x, 0.15, rest.z);
          child.scale.set(FallLaw.DUST.radius * (0.4 + 0.6 * u), FallLaw.DUST.height * 0.6 * (0.5 + 0.5 * u), FallLaw.DUST.radius * (0.4 + 0.6 * u));
        }
      }
    }
  }

  /** Release every mesh and material. */
  public dispose(): void {
    for (const o of this.owned) o.dispose();
    this.cap?.dispose();
    this.debris?.dispose();
    this.object.removeFromParent();
  }
}
