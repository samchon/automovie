import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";
import { AutoMovieArchetypeFirearm } from "./AutoMovieArchetypeFirearm";
import type { AutoMovieArchetypeHandgun } from "../AutoMovieArchetypeHandgun";

/*
 * The revolver's and the flintlock pistol's bodies and mechanisms, the handgun
 * standing as `createHandgun` stands it: on the base of its grip at the origin,
 * its muzzle toward `+Z` and its backstrap at `z = 0`, its lock or loading gate
 * on the right, `-X`.
 *
 * A revolver's `hammer` is cocked back on its pivot at the frame's rear, and
 * its `cylinder` turns one chamber per full cock by following the hammer
 * (`follows`); the `gate` swings out on the right to load, and each chamber is
 * a socket on the cylinder's rear face that rides the cylinder. A flintlock
 * pistol is a stock and a barrel with the musket's lock
 * (`AutoMovieArchetypeFirearm.layFlintlock`). Every place no source gives is a
 * named estimate in `ESTIMATES`; the searches are recorded in the sources
 * record (records-firearms-revolver.md, records-firearms-flintlock.md).
 */
export namespace HandgunActions {
  /*
   * The places no source read gives, each an estimate:
   *
   * - `bore`: the barrel's line below the handgun's top, metres.
   * - `spur`: the hammer spur's distance from its pivot, metres, which turns
   *   Colt's read travel at the spur into the hammer's angle.
   * - `chamber`: the chambers' centres off the cylinder's axis, metres;
   *   `cylinder`: the cylinder's length, metres.
   * - `gate`: the loading gate's swing, degrees; Colt's manual says only that it
   *   swings out to the right.
   * - `stock`: a flintlock pistol's fore-stock's depth below the barrel's line,
   *   metres, and `fore`: the share of the barrel it runs under from the
   *   breech.
   * - `grip`: the grip's width, metres, and `density`: the grip's and the stock's
   *   density against the steel's, a ratio.
   * - `frame`: a revolver frame's height, `barrel`: the barrel's radius,
   *   `hammer`: the hammer's radius and `tip`: its spur behind the backstrap,
   *   metres.
   * - `door`: the loading gate's thickness, height and length, metres.
   * - `trigger`: the trigger's width, height and depth and its face below the
   *   grip's top, metres.
   * - `sight`: the sights above the barrel's line, metres.
   *
   * Searched: Colt's and Ruger's manuals and spec sheets, Gun Tests, Smith &
   * Wesson's pages, Museums Victoria and Royal Museums Greenwich
   * (records-firearms-revolver.md, records-firearms-flintlock.md); none gives
   * these.
   */
  export const ESTIMATES: Readonly<{
    bore: number;
    spur: number;
    chamber: number;
    cylinder: number;
    gate: number;
    stock: number;
    fore: number;
    grip: number;
    density: number;
    frame: number;
    barrel: number;
    hammer: number;
    tip: number;
    door: Readonly<{ thickness: number; height: number; length: number }>;
    trigger: Readonly<{
      width: number;
      height: number;
      depth: number;
      drop: number;
    }>;
    sight: number;
  }> = {
    bore: 0.015,
    spur: 0.045,
    chamber: 0.012,
    cylinder: 0.04,
    gate: 90,
    stock: 0.03,
    fore: 0.5,
    grip: 0.03,
    density: 0.5,
    frame: 0.03,
    barrel: 0.0075,
    hammer: 0.004,
    tip: 0.015,
    door: { thickness: 0.004, height: 0.012, length: 0.015 },
    trigger: { width: 0.008, height: 0.02, depth: 0.006, drop: 0.02 },
    sight: 0.0075,
  };

  /*
   * A Single Action Army's hammer travel at its spur, metres: half cock "about
   * three quarters inch from Safety position", the safety "about a quarter
   * inch" back, and full cock "FULLY back (about an inch and three quarters)",
   * Colt's Single Action Army instruction manual (1993), Sections 3 and 4
   * (https://vdoc.pub/documents/colt-single-action-army-6ej6kgerjtg0).
   */
  export const HAMMER: Readonly<{ half: number; full: number }> = {
    half: (0.25 + 0.75) * AutoMovieArchetypeUnits.INCH,
    full: 1.75 * AutoMovieArchetypeUnits.INCH,
  };

  /*
   * A revolver's chambers: "Check each of six chambers", Colt's manual, Section
   * 4; Ruger's Vaquero 5104 holds 6
   * (https://ruger.com/products/vaqueroStainless/specSheets/5104.html).
   */
  export const CHAMBERS: number = 6;

  /*
   * The hammer's angle at a travel at its spur, degrees.
   * Parameter travel: The spur's travel, metres.
   * Returns: The angle.
   */
  export function hammer(travel: number): number {
    return travel / ESTIMATES.spur / AutoMovieArchetypeUnits.DEGREE;
  }

  /*
   * A revolver's sight radius where its maker gives none: from the rear sight's
   * groove over the cylinder's rear to the front sight at the muzzle.
   * Parameter d: The revolver's dimensions, its length and barrel drawn or read.
   * Returns: The sight radius, metres.
   */
  export function radius(d: Drawn): number {
    return d.barrel! + ESTIMATES.cylinder;
  }

  /*
   * Lay a revolver: a frame and grip, the barrel, the cylinder with its
   * chambers, the hammer and the loading gate, and the contacts.
   * Parameter builder: The handgun under construction.
   * Parameter d: The handgun's dimensions.
   */
  export function revolver(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const steel: { color: string } = { color: "#2c2f33" };
    const top: number = d.height!;
    const bore: number = top - e.bore;
    const muzzle: number = d.length! - e.bore;
    const breech: number = muzzle - d.barrel!;
    const axis: number = bore - e.chamber;
    const back: number = breech - e.cylinder;
    builder.box(
      "grip",
      v(e.grip, bore - e.bore, d.gripDepth!),
      v(0, (bore - e.bore) / 2, d.gripDepth! / 2),
      { color: steel.color, density: e.density },
    );
    // The frame as wide as the cylinder, the read width, which it holds.
    builder.box(
      "frame",
      v(d.width!, e.frame, back),
      v(0, bore, back / 2),
      steel,
    );
    builder.rod(
      "cylinder",
      d.width! / 2,
      v(0, axis, back),
      v(0, axis, breech),
      steel,
    );
    builder.rod(
      "barrel",
      e.barrel,
      v(0, bore, breech),
      v(0, bore, muzzle),
      steel,
    );
    builder.rod("hammer", e.hammer, v(0, bore, 0), v(0, top, -e.tip), steel);
    builder.box(
      "gate",
      v(e.door.thickness, e.door.height, e.door.length),
      v(-d.width! / 2, bore, back - e.door.length / 2),
      steel,
    );
    trigger(builder, d, bore - e.bore);
    contacts(builder, d, bore, back, muzzle, "surface");
    const full: number = hammer(HAMMER.full);
    builder.affordance({
      id: "hammer",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, bore, 0),
        v(-1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      travel: full,
      parts: ["hammer"],
    });
    builder.affordance({
      id: "cylinder",
      kind: "knob",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axis, back),
        v(0, 0, -1),
        v(1, 0, 0),
      ),
      extent: null,
      travel: 360,
      parts: ["cylinder"],
      follows: { id: "hammer", ratio: 360 / CHAMBERS / full },
    });
    builder.affordance({
      id: "gate",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(-d.width! / 2, bore, back),
        v(0, 1, 0),
        v(0, 0, -1),
      ),
      extent: null,
      travel: e.gate,
      parts: ["gate"],
    });
    const chamberIds: readonly AutoMovieArchetypeHandgun.Affordance[] = [
      "chamber1",
      "chamber2",
      "chamber3",
      "chamber4",
      "chamber5",
      "chamber6",
    ];
    for (let k: number = 0; k < CHAMBERS; k++) {
      const angle: number = (2 * Math.PI * k) / CHAMBERS;
      builder.affordance({
        id: chamberIds[k]!,
        kind: "socket",
        frame: AutoMovieArchetypeFrame.facing(
          v(
            e.chamber * Math.sin(angle),
            axis + e.chamber * Math.cos(angle),
            back,
          ),
          v(0, 0, -1),
          v(1, 0, 0),
        ),
        extent: null,
        rides: "cylinder",
      });
    }
  }

  /*
   * Lay a flintlock pistol: a stock with its grip, the barrel and the musket's
   * lock at its breech, and the contacts.
   * Parameter builder: The handgun under construction.
   * Parameter d: The handgun's dimensions.
   */
  export function flintlock(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const bore: number = d.height! - e.bore;
    const muzzle: number = d.length! - e.bore;
    const breech: number = muzzle - d.barrel!;
    const wood: { color: string; density: number } = {
      color: "#6b4a2f",
      density: e.density,
    };
    builder.box(
      "grip",
      v(e.grip, bore - e.bore, d.gripDepth!),
      v(0, (bore - e.bore) / 2, d.gripDepth! / 2),
      wood,
    );
    // The fore-stock runs from the backstrap under the barrel's rear `fore` share.
    const fore: number = breech + e.fore * d.barrel!;
    builder.box(
      "stock",
      v(d.width!, e.stock, fore),
      v(0, bore - e.stock / 2, fore / 2),
      wood,
    );
    builder.rod("barrel", e.barrel, v(0, bore, breech), v(0, bore, muzzle), {
      color: "#2c2f33",
    });
    trigger(builder, d, bore - e.bore);
    AutoMovieArchetypeFirearm.layFlintlock(builder, v(0, bore, breech), {
      cock: "cock",
      spur: "spur",
      frizzen: "frizzen",
      pan: "pan",
    });
    contacts(builder, d, bore, breech, muzzle, "socket");
  }

  /*
   * The trigger's part, its face at the read reach from the backstrap and
   * `ESTIMATES.trigger.drop` below the grip's top.
   * Parameter builder: The handgun under construction.
   * Parameter d: The handgun's dimensions.
   * Parameter grip: The grip's top.
   */
  function trigger(builder: Builder, d: Drawn, grip: number): void {
    const t: typeof ESTIMATES.trigger = ESTIMATES.trigger;
    builder.box(
      "trigger",
      Vector3.create(t.width, t.height, t.depth),
      Vector3.create(0, grip - t.drop, d.triggerReach! - t.depth / 2),
      { color: "#55595f" },
    );
  }

  /*
   * The contacts the firearm laws read: the `grip` from behind, the `trigger`'s
   * face at its reach, the `sight` at the breech and the `frontSight` its
   * radius ahead, both on the barrel's line, and the `muzzle`.
   * Parameter builder: The handgun under construction.
   * Parameter d: The handgun's dimensions.
   * Parameter bore: The barrel's line's height.
   * Parameter sight: Where the rear sight stands along the gun.
   * Parameter muzzle: Where the muzzle stands along the gun.
   * Parameter mouth: The muzzle's kind.
   */
  function contacts(
    builder: Builder,
    d: Drawn,
    bore: number,
    sight: number,
    muzzle: number,
    mouth: "socket" | "surface",
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const grip: number = bore - ESTIMATES.bore;
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, grip / 2, d.gripDepth! / 2),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.gripDepth!,
      length: grip,
    });
    builder.affordance({
      id: "trigger",
      kind: "trigger",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, grip - ESTIMATES.trigger.drop, d.triggerReach!),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
      travel: d.triggerTravel!,
      parts: ["trigger"],
    });
    const top: IAutoMovieVector3 = v(0, bore + ESTIMATES.sight, sight);
    builder.affordance({
      id: "sight",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(top),
      extent: null,
    });
    builder.affordance({
      id: "frontSight",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, top.y, sight + d.sightRadius!),
      ),
      extent: null,
    });
    builder.affordance({
      id: "muzzle",
      kind: mouth,
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, bore, muzzle),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }
}

/*
 * A handgun under construction.
 */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeHandgun.Affordance,
  AutoMovieArchetypeHandgun.Dimension
>;

/*
 * A handgun's drawn and read dimensions.
 */
type Drawn = Readonly<Partial<Record<AutoMovieArchetypeHandgun.Dimension, number>>>;
