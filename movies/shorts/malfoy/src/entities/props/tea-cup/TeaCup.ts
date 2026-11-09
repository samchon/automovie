import * as THREE from "three";

import { SetGeometry } from "../../sets/SetGeometry";
import type { IStageProp } from "../IStageProp";

/**
 * One white glazed tea cup, 8 cm across and 8.5 cm tall with a round side
 * handle, holding amber tea to 2 cm below the rim and weighing about 0.45 kg
 * full. Its figure's `level` lowers the tea as it is drunk.
 *
 * @evidence docs/body/settings/props/tea-cups.md#cups 8 cm across, 8.5 cm tall, handle 3 cm out; tea 2 cm below the rim; 0.45 kg full; no steam.
 * @evidence docs/body/settings/props/tea-cups.md#tea-level The level drops only when someone drinks.
 * @evidence contracts/development/entities.md#settings-realization Dimensions, colour and mass from the record.
 * @evidence contracts/development/entities.md#object-shape A frozen class built from its id; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the dimensions and the level control.
 */
export class TeaCup implements IStageProp {
  /** Stable id. */
  public readonly id: string;

  /** Kind. */
  public readonly kind = "tea-cup" as const;

  /** About 0.45 kg full. */
  public readonly mass: number = 0.45;

  /** Hospitality, not a personal token. */
  public readonly personal: boolean = false;

  /** Held at the handle, 5 cm above the base. */
  public readonly rest: number = 0.05;

  /**
   * Build a cup.
   *
   * @param id Stable id.
   */
  public constructor(id: string) {
    this.id = id;
    Object.freeze(this);
  }

  /** @returns The cup's figure: body, handle and the tea surface. */
  public figure(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    const body: THREE.Mesh = g.cylinder(0.04, 0.085, [0, -0.05, 0], 0xf3f1ea);
    body.name = "cup";
    const handle: THREE.Mesh = g.ring(0.012, 0.004, [0.052, -0.005, 0], 0xf3f1ea);
    handle.rotation.set(0, 0, 0);
    const tea: THREE.Mesh = g.cylinder(0.037, 0.002, [0, -0.05 + 0.065, 0], 0x9a5a1e);
    const full: number = tea.position.y;
    const figure: IStageProp.IFigure = g.done();
    return {
      ...figure,
      level: (share: number): void => {
        tea.position.y = full - (1 - Math.max(0, Math.min(1, share))) * 0.05;
      },
    };
  }
}
