import * as THREE from "three";

import { SetGeometry } from "../../sets/SetGeometry";
import type { IStageProp } from "../IStageProp";

/**
 * A school practice broom: a 1.65 m honey-brown ash shaft 3.2 cm thick with
 * a 3 cm house-colour band behind the nose and a 0.45 m bundle of dark twigs
 * spreading to 0.25 m. Its figure's origin is the seat point, 0.85 m behind
 * the nose, with the nose along +X; the clear rear section runs from 0.2 to
 * 0.75 m behind the seat point.
 *
 * ```ts
 * new Broom("broom-carina", "slytherin");
 * ```
 *
 * @evidence docs/body/settings/props/brooms.md#broom 2.10 m: 1.65 m shaft, 3.2 cm thick; 0.45 m twigs to 0.25 m; house band at the nose.
 * @evidence docs/body/settings/props/brooms.md#zones Hands 0.15–0.50 m from the nose, seat at 0.85 m, clear rear 1.05–1.60 m, twigs from 1.65 m.
 * @evidence contracts/development/entities.md#settings-realization Dimensions and colours from the record.
 * @evidence contracts/development/entities.md#object-shape A frozen prop built from its id and house.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame of its figure.
 */
export class Broom implements IStageProp {
  /** Stable id. */
  public readonly id: string;

  /** Kind. */
  public readonly kind = "broom" as const;

  /** About 3 kg. */
  public readonly mass: number = 3;

  /** Not a token. */
  public readonly personal: boolean = false;

  /** Seat point. */
  public readonly rest: number = 0;

  /** House band colour. */
  public readonly band: number;

  /**
   * Build a broom.
   *
   * @param id Stable id.
   * @param house The team's house.
   */
  public constructor(id: string, house: "slytherin" | "gryffindor") {
    this.id = id;
    this.band = house === "slytherin" ? 0x1d5e3a : 0x8e1c22;
    Object.freeze(this);
  }

  /** @returns The broom's figure along +X from its seat point. */
  public figure(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    const shaft: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.016, 0.016, 1.65, 8);
    const twigs: THREE.ConeGeometry = new THREE.ConeGeometry(0.125, 0.45, 10);
    const band: THREE.CylinderGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8);
    const a: THREE.Mesh = new THREE.Mesh(shaft, g.material(0xc59a5a));
    a.rotation.z = Math.PI / 2;
    a.position.x = 0.85 - 1.65 / 2;
    const b: THREE.Mesh = new THREE.Mesh(twigs, g.material(0x4a3420));
    b.rotation.z = -Math.PI / 2;
    b.position.x = -0.8 - 0.225;
    const c: THREE.Mesh = new THREE.Mesh(band, g.material(this.band));
    c.rotation.z = Math.PI / 2;
    c.position.x = 0.85 - 0.06;
    g.object.add(a, b, c);
    const figure: IStageProp.IFigure = g.done();
    return { ...figure, dispose: (): void => { shaft.dispose(); twigs.dispose(); band.dispose(); figure.dispose(); } };
  }
}
