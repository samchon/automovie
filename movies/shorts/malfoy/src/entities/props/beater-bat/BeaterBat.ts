import * as THREE from "three";

import { SetGeometry } from "../../sets/SetGeometry";
import type { IStageProp } from "../IStageProp";

/**
 * A Beater's bat: a 0.55 m mid-brown wooden club, a 20 cm grip 3.5 cm thick
 * widening to an 8 cm rounded head. Its figure points along +X from the grip.
 *
 * @evidence docs/body/settings/props/beater-bats.md#bats 0.55 m, grip 3.5 cm, head 8 cm, mid-brown.
 * @evidence contracts/development/entities.md#settings-realization Dimensions and colour from the record.
 * @evidence contracts/development/entities.md#object-shape A frozen prop built from its id.
 * @evidence contracts/development/common.md#meaningful-documentation States its frame.
 */
export class BeaterBat implements IStageProp {
  /** Stable id. */
  public readonly id: string;

  /** Kind. */
  public readonly kind = "beater-bat" as const;

  /** About 0.6 kg. */
  public readonly mass: number = 0.6;

  /** Not a token. */
  public readonly personal: boolean = false;

  /** Lies on its side. */
  public readonly rest: number = 0.04;

  /**
   * Build a bat.
   *
   * @param id Stable id.
   */
  public constructor(id: string) {
    this.id = id;
    Object.freeze(this);
  }

  /** @returns The bat's figure along +X. */
  public figure(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    const club: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.04, 0.0175, 0.55, 8);
    const mesh: THREE.Mesh = new THREE.Mesh(club, g.material(0x7a5634));
    mesh.rotation.z = -Math.PI / 2;
    mesh.position.x = 0.55 / 2 - 0.08;
    g.object.add(mesh);
    const figure: IStageProp.IFigure = g.done();
    return { ...figure, dispose: (): void => { club.dispose(); figure.dispose(); } };
  }
}
