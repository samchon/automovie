import { AutoMovieChain } from "@automovie/engine";
import * as THREE from "three";

import { StageAction } from "../../../laws/staging/StageAction";
import { SetGeometry } from "../../sets/SetGeometry";
import type { IStageProp } from "../IStageProp";

/**
 * The support's cap and everything its failure can release: the 0.8 × 1.0
 * × 0.25 m grey limestone block, two mortar chips, a grit stream, three
 * fragments and a dust puff. Its capability `fail` asks the cap to fail at a
 * second with a chosen tipping time; a deflected jinx striking the cracked
 * fillet also starts the failure. The masonry track places every part.
 *
 * ```ts
 * cap.fail({ tipping: 1.2, start: 30 });
 * ```
 *
 * @evidence docs/body/settings/props/falling-masonry.md#cap 0.80 × 1.00 × 0.25 m grey limestone, about 500 kg.
 * @evidence docs/body/settings/props/falling-masonry.md#debris Two chips up to 4 cm, a grit stream, three fragments up to 8 cm, one dust puff.
 * @evidence docs/body/settings/props/falling-masonry.md#failure The stages in order.
 * @evidence contracts/development/entities.md#settings-realization Dimensions and colours from the record.
 * @evidence contracts/development/entities.md#object-shape A frozen prop whose capability returns an intent; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the parts and the capability.
 */
export class FallingMasonry implements IStageProp {
  /** Stable id. */
  public readonly id: string;

  /** Kind. */
  public readonly kind = "falling-masonry" as const;

  /** About 500 kg. */
  public readonly mass: number = 500;

  /** Not a token. */
  public readonly personal: boolean = false;

  /** The block's centre is its placed point. */
  public readonly rest: number = 0;

  /**
   * Build the cap.
   *
   * @param id Stable id.
   */
  public constructor(id: string = "cap") {
    this.id = id;
    Object.freeze(this);
  }

  /** Fail at a second (its `start`), or without one at the deflected jinx's impact on the cracked fillet, with a tipping time in seconds (0.8–1.5). */
  public fail(options: { tipping?: number; start?: number } = {}): AutoMovieChain {
    return AutoMovieChain.of(
      StageAction.intent(this.id, { kind: "fail", tipping: options.tipping ?? 1.2, ...(options.start === undefined ? {} : { start: options.start }) }),
    );
  }

  /** @returns The block's figure; the track adds the debris. */
  public figure(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    g.box([0.8, 0.25, 1.0], [0, 0, 0], 0x6f6d68);
    return g.done();
  }

  /** @returns The debris figure: two chips, three fragments, a grit stream and a dust puff, each a named child. */
  public debris(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    for (let k = 0; k < 2; k++) g.box([0.04, 0.03, 0.035], [0, 0, 0], 0xb9b7b0).name = `chip-${k}`;
    for (let k = 0; k < 3; k++) g.box([0.08, 0.06, 0.07], [0, 0, 0], 0x6f6d68).name = `fragment-${k}`;
    g.box([0.015, 1, 0.015], [0, 0, 0], 0xb9b7b0).name = "grit";
    const dust: THREE.Mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), g.material(0xa8a49c, { opacity: 0.5 }));
    dust.name = "dust";
    g.object.add(dust);
    const figure: IStageProp.IFigure = g.done();
    return { ...figure, dispose: (): void => { dust.geometry.dispose(); figure.dispose(); } };
  }
}
