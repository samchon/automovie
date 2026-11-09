import { SetGeometry } from "../../sets/SetGeometry";
import type { IStageProp } from "../IStageProp";

/**
 * The invitation note: one uncreased 10 × 15 cm white paper with three short
 * black lines on one face, held by its lower short edge. Its figure is a
 * thin card with the writing as dark stripes on the +X face.
 *
 * @evidence docs/body/settings/props/invitation-note.md#note 10 × 15 cm white paper, black writing on one face, 2 g.
 * @evidence docs/body/settings/props/invitation-note.md#handling Held by the lower short edge.
 * @evidence contracts/development/entities.md#settings-realization Dimensions and colours from the record.
 * @evidence contracts/development/entities.md#object-shape A frozen class built from its id; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the dimensions.
 */
export class InvitationNote implements IStageProp {
  /** Stable id. */
  public readonly id: string;

  /** Kind. */
  public readonly kind = "invitation-note" as const;

  /** About 2 g. */
  public readonly mass: number = 0.002;

  /** Carina wrote it for Harry. */
  public readonly personal: boolean = true;

  /** Held at its lower short edge, lying flat when set down. */
  public readonly rest: number = 0.002;

  /**
   * Build the note.
   *
   * @param id Stable id.
   */
  public constructor(id: string = "note") {
    this.id = id;
    Object.freeze(this);
  }

  /** @returns The note's figure, held at its lower short edge: the card rises 15 cm above the grip. */
  public figure(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    g.box([0.003, 0.15, 0.1], [0, 0.07, 0], 0xfbfbf7);
    for (const y of [0.11, 0.085, 0.06]) g.box([0.004, 0.006, 0.07], [0.001, y, 0], 0x202020);
    return g.done();
  }
}
