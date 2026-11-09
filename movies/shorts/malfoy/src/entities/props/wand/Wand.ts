import * as THREE from "three";

import { SetGeometry } from "../../sets/SetGeometry";
import type { IStageProp } from "../IStageProp";

/**
 * One wand: Carina's ten-inch pale grey-brown hawthorn or Harry's
 * eleven-inch dark brown holly, a 7 cm grip tapering to a 0.6 cm tip. Its
 * figure points along +X from the held grip.
 *
 * ```ts
 * new Wand("wand-carina", "hawthorn");
 * ```
 *
 * @evidence docs/body/settings/props/wands.md#carinas-wand 25.4 cm pale grey-brown hawthorn, 7 cm grip 1.4 cm thick, 0.6 cm tip.
 * @evidence docs/body/settings/props/wands.md#harrys-wand 27.9 cm dark brown holly, grip 1.5 cm thick.
 * @evidence docs/body/settings/props/wands.md#holding Held in the right fist, tip forward.
 * @evidence contracts/development/entities.md#settings-realization Lengths and colours from the record.
 * @evidence contracts/development/entities.md#object-shape A frozen class built from its id and wood; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the two woods.
 */
export class Wand implements IStageProp {
  /** Stable id. */
  public readonly id: string;

  /** Kind. */
  public readonly kind = "wand" as const;

  /** About 20 g. */
  public readonly mass: number = 0.02;

  /** Not offered as a token. */
  public readonly personal: boolean = false;

  /** Lies on its side. */
  public readonly rest: number = 0.008;

  /** Overall length, metres. */
  public readonly length: number;

  /** Wood colour. */
  public readonly color: number;

  /**
   * Build a wand.
   *
   * @param id Stable id.
   * @param wood Carina's hawthorn or Harry's holly.
   */
  public constructor(id: string, wood: "hawthorn" | "holly") {
    this.id = id;
    this.length = wood === "hawthorn" ? 0.254 : 0.279;
    this.color = wood === "hawthorn" ? 0xa89a86 : 0x4a2c1c;
    Object.freeze(this);
  }

  /** The tip's offset from the held point along the wand, metres. */
  public get tip(): number {
    return this.length - 0.035;
  }

  /** @returns The wand's figure along +X: the grip behind the hand centre, the shaft tapering ahead. */
  public figure(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    const geometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.003, 0.0075, this.length, 8);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, g.material(this.color));
    mesh.rotation.z = -Math.PI / 2;
    mesh.position.x = this.length / 2 - 0.035;
    g.object.add(mesh);
    const figure: IStageProp.IFigure = g.done();
    return {
      ...figure,
      dispose: (): void => {
        geometry.dispose();
        figure.dispose();
      },
    };
  }
}
