import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";
import type { AutoMovieArchetypeCannon } from "../AutoMovieArchetypeCannon";

/** A cannon under construction. */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeCannon.Affordance,
  AutoMovieArchetypeCannon.Dimension
>;

/** A cannon's drawn and read dimensions. */
type Drawn = Readonly<Partial<Record<AutoMovieArchetypeCannon.Dimension, number>>>;

/**
 * The naval gun, the mortar and the swivel gun, built on their read figures: a
 * 32-pounder of 56 cwt on a four-truck carriage, a mortar on its bed at its
 * fixed 45 degrees, and a swivel gun on its yoke. Every size the sources do not
 * give is a named estimate in `ESTIMATES`; the searches are recorded in
 * records-cannon.md.
 *
 * Each stands on level ground or deck, its muzzle toward `+Z`. `muzzle` is the
 * muzzle's face and `vent` the vent's orifice, sockets, `+Y` out; a naval gun's
 * tube turns on `elevation`, a hinge on its trunnions' axis, and its trucks
 * stand under the carriage's cheeks; a mortar's tube is fixed on its bed at 45
 * degrees.
 */
export namespace CannonPieces {
  /**
   * The sizes no source read gives, each an estimate:
   *
   * - `tube`: a tube's outside radius over its bore's, a ratio.
   * - `trunnion`: the trunnions behind the tube's middle, a share of its length.
   * - `carriage`: a naval carriage's length, width and height of its cheeks,
   *   metres, and its trucks' spacing along it as a share of its length.
   * - `elevation`, `depression`: a naval gun's quoin range, degrees.
   * - `vent`: the vent ahead of the breech's end, a share of the tube's length.
   * - `mortar`: a mortar's trunnions above its bed's top, a share of the bed's
   *   width.
   * - `bed`: a mortar bed's height, a share of its width.
   * - `swivel`: a swivel gun's pin above its socket, the yoke's arms' height and
   *   their spread, metres, its tilt either way, degrees, and the tiller's
   *   length, metres; the National Park Service's demonstration manual draws a
   *   Y-shaped swivel and a wooden tiller without sizes (secondary).
   *
   * Searched: the 1861 Ordnance Manual, Griffiths 1856, Douglas 1860, the 1852
   * and 1866 US Navy ordnance instructions (records-cannon.md).
   */
  export const ESTIMATES: Readonly<{
    tube: number;
    trunnion: number;
    carriage: Readonly<{
      length: number;
      width: number;
      height: number;
      trucks: number;
    }>;
    elevation: number;
    depression: number;
    vent: number;
    mortar: number;
    bed: number;
    swivel: Readonly<{
      pin: number;
      arm: number;
      spread: number;
      tilt: number;
      tiller: number;
    }>;
  }> = {
    tube: 2,
    trunnion: 0.1,
    carriage: { length: 1.8, width: 0.9, height: 0.6, trucks: 0.7 },
    elevation: 10,
    depression: 5,
    vent: 0.05,
    mortar: 0.4,
    bed: 0.4,
    swivel: { pin: 0.15, arm: 0.12, spread: 0.12, tilt: 30, tiller: 0.4 },
  };

  /**
   * Lay a swivel gun: its pin standing in a socket at the origin, the Y-shaped
   * yoke on it, the tube on the yoke's arms and the tiller behind the breech.
   * The `traverse` hinge turns the pin about the vertical, and the `elevation`
   * hinge, riding it, tilts the tube on the arms: a hinge riding a hinge, so
   * the gun pans and tilts.
   *
   * @param builder The cannon under construction.
   * @param d The cannon's dimensions.
   */
  export function swivel(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES.swivel = ESTIMATES.swivel;
    const iron: { color: string } = { color: "#3f4246" };
    const length: number = d.length!;
    const outer: number = (d.bore! / 2) * ESTIMATES.tube;
    const axis: number = e.pin + e.arm;
    builder.rod("pin", outer / 2, v(0, 0, 0), v(0, e.pin, 0), iron);
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      builder.rod(
        `yoke-${side}`,
        outer / 4,
        v(0, e.pin, 0),
        v((sign * e.spread) / 2, axis, 0),
        iron,
      );
    builder.rod(
      "tube",
      outer,
      v(0, axis, -length / 2),
      v(0, axis, length / 2),
      { color: "#8c6a3a" },
    );
    builder.rod(
      "tiller",
      outer / 3,
      v(0, axis, -length / 2),
      v(0, axis, -length / 2 - e.tiller),
      { color: "#6b5a3e" },
    );
    builder.affordance({
      id: "traverse",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, e.pin, 0),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel: 180,
      reverse: 180,
      parts: ["pin", "yoke-left", "yoke-right"],
    });
    builder.affordance({
      id: "elevation",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axis, 0),
        v(-1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel: e.tilt,
      reverse: e.tilt,
      parts: ["tube", "tiller"],
      rides: "traverse",
    });
    builder.affordance({
      id: "muzzle",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axis, length / 2),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      rides: "elevation",
    });
    builder.affordance({
      id: "vent",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axis + outer, -length / 2 + length * ESTIMATES.vent),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      rides: "elevation",
    });
    builder.affordance({
      id: "tiller",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axis, -length / 2 - e.tiller / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: (2 * outer) / 3,
      length: e.tiller,
      rides: "elevation",
    });
  }

  /**
   * A mortar's fixed elevation, degrees: mortars are fired "under the constant
   * angle of 45°, and the charge is varied according to the range required"
   * (Roberts, The Hand-Book of Artillery, 1861, p. 66,
   * https://www.gutenberg.org/cache/epub/71575/pg71575.txt); every range the
   * 1861 Ordnance Manual tables for both mortars is at 45 degrees (p. 390).
   */
  export const MORTAR_ELEVATION: number = 45;

  /**
   * Lay a naval gun on its four-truck carriage.
   *
   * @param builder The cannon under construction.
   * @param d The cannon's dimensions.
   */
  export function naval(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const c: typeof ESTIMATES.carriage = e.carriage;
    const iron: { color: string } = { color: "#3f4246" };
    const wood: { color: string } = { color: "#6b5a3e" };
    const fore: number = d.frontWheelDiameter! / 2;
    const hind: number = d.wheelDiameter! / 2;
    const deck: number = Math.max(fore, hind);
    const axis: number = deck + c.height;
    const length: number = d.length!;
    const outer: number = (d.bore! / 2) * e.tube;
    const trunnions: number = -length * e.trunnion;
    const muzzle: number = trunnions + length / 2 + length * e.trunnion;
    const breech: number = muzzle - length;
    builder.box(
      "carriage",
      v(c.width, c.height, c.length),
      v(0, deck + c.height / 2, 0),
      wood,
    );
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      builder.rod(
        `truck-fore-${side}`,
        fore,
        v((sign * c.width) / 2, fore, (c.length * c.trucks) / 2),
        v(sign * (c.width / 2 + outer / 2), fore, (c.length * c.trucks) / 2),
        wood,
      );
      builder.rod(
        `truck-hind-${side}`,
        hind,
        v((sign * c.width) / 2, hind, (-c.length * c.trucks) / 2),
        v(sign * (c.width / 2 + outer / 2), hind, (-c.length * c.trucks) / 2),
        wood,
      );
    }
    builder.rod("tube", outer, v(0, axis, breech), v(0, axis, muzzle), iron);
    builder.affordance({
      id: "elevation",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axis, trunnions),
        v(-1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel: e.elevation,
      reverse: e.depression,
      parts: ["tube"],
    });
    builder.affordance({
      id: "muzzle",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axis, muzzle),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      rides: "elevation",
    });
    builder.affordance({
      id: "vent",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axis + outer, breech + length * e.vent),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      rides: "elevation",
    });
  }

  /**
   * Lay a mortar on its bed, its tube fixed at 45 degrees.
   *
   * @param builder The cannon under construction.
   * @param d The cannon's dimensions.
   */
  export function mortar(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const width: number = d.bedWidth!;
    const height: number = width * e.bed;
    const pivot: IAutoMovieVector3 = v(0, height + width * e.mortar, 0);
    const length: number = d.length!;
    const outer: number = (d.bore! / 2) * e.tube;
    const angle: number = MORTAR_ELEVATION * AutoMovieArchetypeUnits.DEGREE;
    const along: IAutoMovieVector3 = v(0, Math.sin(angle), Math.cos(angle));
    const muzzle: IAutoMovieVector3 = Vector3.add(
      pivot,
      Vector3.scale(along, length / 2),
    );
    const breech: IAutoMovieVector3 = Vector3.subtract(
      pivot,
      Vector3.scale(along, length / 2),
    );
    builder.box("bed", v(width, height, d.bedLength!), v(0, height / 2, 0), {
      color: "#6b5a3e",
    });
    builder.rod("tube", outer, breech, muzzle, { color: "#3f4246" });
    builder.affordance({
      id: "muzzle",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(muzzle, along, v(1, 0, 0)),
      extent: null,
    });
    builder.affordance({
      id: "vent",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.add(breech, Vector3.scale(along, length * e.vent)),
        v(0, Math.cos(angle), -Math.sin(angle)),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }
}
