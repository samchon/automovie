import * as THREE from "three";

import { SetGeometry } from "../../sets/SetGeometry";
import type { IStageProp } from "../IStageProp";

/**
 * The paper crane: a 15 cm square of cream paper folded into a crane about
 * 11 cm long, 10 cm across the wings and 6 cm high, that opens to a creased
 * square and folds once to a 15 × 7.5 cm rectangle with the invitation
 * inside. Its figure shows the form the stage sets: `crane`, `half`, `open`,
 * `folded`.
 *
 * @evidence docs/body/settings/props/paper-crane.md#crane 15 cm cream square; crane 11 × 10 × 6 cm, under 2 g.
 * @evidence docs/body/settings/props/paper-crane.md#opened Crease grid; folded once 15 × 7.5 cm.
 * @evidence docs/body/settings/props/paper-crane.md#writing One line in blue-black ink inside, drawn as a dark stripe on the open sheet.
 * @evidence docs/body/settings/props/paper-crane.md#stages The forms in order.
 * @evidence contracts/development/entities.md#settings-realization Dimensions and colours from the record.
 * @evidence contracts/development/entities.md#object-shape A frozen class built from its id; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the forms.
 */
export class PaperCrane implements IStageProp {
  /** Stable id. */
  public readonly id: string;

  /** Kind. */
  public readonly kind = "paper-crane" as const;

  /** Under 2 g. */
  public readonly mass: number = 0.002;

  /** Carina wrote and folded it for Harry. */
  public readonly personal: boolean = true;

  /** Held at its body's middle, 3 cm above its underside. */
  public readonly rest: number = 0.03;

  /**
   * Build the crane.
   *
   * @param id Stable id.
   */
  public constructor(id: string = "crane") {
    this.id = id;
    Object.freeze(this);
  }

  /** @returns The crane's figure with its four forms. */
  public figure(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    const cream: number = 0xf1e7cc;
    const forms: Record<string, THREE.Group> = {
      crane: new THREE.Group(),
      half: new THREE.Group(),
      open: new THREE.Group(),
      folded: new THREE.Group(),
    };
    // Crane: a body ridge, two wings, neck and tail.
    g.box([0.11, 0.025, 0.02], [0, 0, 0], cream, forms.crane);
    g.box([0.05, 0.004, 0.1], [0, 0.01, 0], cream, forms.crane);
    g.box([0.012, 0.05, 0.008], [0.05, 0.025, 0], cream, forms.crane);
    g.box([0.012, 0.04, 0.008], [-0.05, 0.02, 0], cream, forms.crane);
    // Half open: two flaps at an angle.
    const flapA: THREE.Mesh = g.box([0.15, 0.003, 0.075], [0, 0.02, 0.03], cream, forms.half);
    flapA.rotation.x = 0.6;
    const flapB: THREE.Mesh = g.box([0.15, 0.003, 0.075], [0, 0.02, -0.03], cream, forms.half);
    flapB.rotation.x = -0.6;
    // Open sheet with the writing as a dark stripe, held upright facing its reader along +X.
    g.box([0.003, 0.15, 0.15], [0, 0, 0], cream, forms.open);
    g.box([0.004, 0.012, 0.11], [0.0005, 0.0, 0], 0x20263a, forms.open);
    // Folded once: a flat 15 × 7.5 cm rectangle.
    g.box([0.15, 0.004, 0.075], [0, 0, 0], cream, forms.folded);
    for (const group of Object.values(forms)) g.object.add(group);
    const figure: IStageProp.IFigure = g.done();
    const show = (form: string): void => {
      for (const [name, group] of Object.entries(forms)) group.visible = name === form;
    };
    show("crane");
    return { ...figure, form: show };
  }
}
