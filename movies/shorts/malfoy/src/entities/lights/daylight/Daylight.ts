import * as THREE from "three";

import type { IStageSet } from "../../sets/IStageSet";

/**
 * Each set's daylight: a hemisphere fill and one directional sun placed as
 * the set's light fact gives it (late-morning high cloud from the
 * south-west on the court, low warm sun through the corridor's window, low
 * sun from the south-west over the courtyard, high clear sun from the south
 * over the pitch). The light never changes within a film.
 *
 * ```ts
 * scene.add(new Daylight(set.light).object);
 * ```
 *
 * @evidence docs/body/settings/sets/training-court.md#light Soft daylight from the south-west under high cloud.
 * @evidence docs/body/settings/sets/school-corridor.md#light Warm low sun through the west-facing window, cooler corridor fill.
 * @evidence docs/body/settings/sets/side-courtyard.md#light Low sun from the south-west.
 * @evidence docs/body/settings/sets/quidditch-pitch.md#light High sun in the south, clear sky.
 * @evidence docs/body/settings/cinematography/vertical-look.md#daylight Set daylight only; it never changes.
 * @evidence contracts/development/entities.md#settings-realization Directions and warmth from each set's light fact.
 * @evidence contracts/development/entities.md#object-shape A light entity built from a preset; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the presets.
 */
export class Daylight {
  /** The lights' root. */
  public readonly object: THREE.Group = new THREE.Group();

  /**
   * Build the light of a set.
   *
   * @param preset The set's light preset.
   */
  public constructor(preset: IStageSet["light"]) {
    const spec = {
      "court-late-morning": { sky: 0xe4eaf0, ground: 0x6b5d4c, fill: 1.5, sun: 0xfff3e2, power: 1.9, at: [-6, 9, 6] },
      "corridor-late-afternoon": { sky: 0xd9d2c8, ground: 0x4e4a44, fill: 1.3, sun: 0xffd29a, power: 2.4, at: [1, 3.5, -6] },
      "courtyard-late-afternoon": { sky: 0xe6e3d8, ground: 0x6a6450, fill: 1.4, sun: 0xffdcae, power: 2.2, at: [-6, 5, 7] },
      "pitch-early-afternoon": { sky: 0xdfeefc, ground: 0x4d6a35, fill: 1.6, sun: 0xfff7ea, power: 2.4, at: [0, 30, 20] },
    }[preset];
    const fill: THREE.HemisphereLight = new THREE.HemisphereLight(spec.sky, spec.ground, spec.fill);
    const sun: THREE.DirectionalLight = new THREE.DirectionalLight(spec.sun, spec.power);
    sun.position.set(spec.at[0]!, spec.at[1]!, spec.at[2]!);
    this.object.add(fill, sun, sun.target);
  }

  /** Release the lights. */
  public dispose(): void {
    this.object.removeFromParent();
  }
}
