import { AutoMovieChain } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import { StageAction } from "../../../laws/staging/StageAction";
import { SetGeometry } from "../../sets/SetGeometry";
import type { IStageProp } from "../IStageProp";

/**
 * The practice match's balls: the 30 cm scarlet leather Quaffle, the two
 * 25 cm jet-black iron Bludgers and the 4 cm gold Snitch with its 12 cm
 * pale wing blur. A ball's capability `fly` sends it along a route of places
 * or points at a speed from an absolute second; the Quaffle also travels
 * between hands by passes.
 *
 * ```ts
 * snitch.fly(["eastSouthGap", "eastRunoff"], { speed: 14, start: 8 });
 * ```
 *
 * @evidence docs/body/settings/props/quaffle.md#ball Scarlet leather, 30 cm.
 * @evidence docs/body/settings/props/bludgers.md#balls Jet-black iron, 25 cm.
 * @evidence docs/body/settings/props/snitch.md#ball Gold, 4 cm, wings 12 cm as a pale blur.
 * @evidence docs/body/settings/props/snitch.md#flight Darts, hovers, up to 18 m/s, never caught here unless a hand closes.
 * @evidence contracts/development/entities.md#settings-realization Sizes and colours from the records.
 * @evidence contracts/development/entities.md#object-shape A frozen prop whose capability returns an intent.
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds and the capability.
 */
export class QuidditchBall implements IStageProp {
  /** Stable id. */
  public readonly id: string;

  /** Kind. */
  public readonly kind: "quaffle" | "bludger" | "snitch";

  /** Mass, kilograms. */
  public readonly mass: number;

  /** Not a token. */
  public readonly personal: boolean = false;

  /** Resting centre height. */
  public readonly rest: number;

  /**
   * Build a ball.
   *
   * @param id Stable id.
   * @param kind Which ball.
   */
  public constructor(id: string, kind: "quaffle" | "bludger" | "snitch") {
    this.id = id;
    this.kind = kind;
    this.mass = kind === "quaffle" ? 0.45 : kind === "bludger" ? 15 : 0.03;
    this.rest = kind === "quaffle" ? 0.15 : kind === "bludger" ? 0.125 : 0.02;
    Object.freeze(this);
  }

  /** Fly a route at a speed from an absolute second. */
  public fly(route: (string | IAutoMovieVector3)[], options: { speed: number; start?: number }): AutoMovieChain {
    return AutoMovieChain.of(
      StageAction.intent(this.id, {
        kind: "path",
        route: route.map((r) => (typeof r === "string" ? { place: r } : { point: r })),
        speed: options.speed,
        ...(options.start === undefined ? {} : { start: options.start }),
      }),
    );
  }

  /** @returns The ball's figure. */
  public figure(): IStageProp.IFigure {
    const g: SetGeometry = new SetGeometry();
    const radius: number = this.kind === "quaffle" ? 0.15 : this.kind === "bludger" ? 0.125 : 0.02;
    const color: number = this.kind === "quaffle" ? 0xa3201c : this.kind === "bludger" ? 0x141414 : 0xf2c234;
    const sphere: THREE.SphereGeometry = new THREE.SphereGeometry(radius, 14, 10);
    g.object.add(new THREE.Mesh(sphere, g.material(color, this.kind === "snitch" ? { emissive: 0x6a4a00 } : {})));
    if (this.kind === "snitch") for (const s of [-1, 1]) g.box([0.03, 0.002, 0.05], [0, 0.005, s * 0.045], 0xeef2f6);
    const figure: IStageProp.IFigure = g.done();
    return { ...figure, dispose: (): void => { sphere.dispose(); figure.dispose(); } };
  }
}
