import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { EquineHarness } from "./EquineHarness";

/**
 * An equid's pack saddle, laid on its body: the Phillips cargo pack saddle of
 * FM 25-7 (War Department, Pack Transportation, 1944;
 * https://ciehub.info/ref/FM/25-7_1944.pdf), its pads over the back, a cinch
 * round the barrel, a breast collar, a croup piece and a breeching, with a load
 * against each side.
 *
 * The saddle is sized for the equid it is laid on: the manual's cargo saddle
 * fits its pack mule, 14 3/4 to 15 1/2 hands, so an equid of another height
 * takes its pads scaled by its height over that mule's, and its weight by the
 * cube of that ratio, the isometric similarity the equids' mass law rests on
 * (`AutoMovieArchetypeEquine.mass`); a mule of the manual's middle height
 * carries the read saddle. The pads drape over the barrel from the spine,
 * centred where a riding saddle sits (`AutoMovieArchetypeEquine.SADDLE`, an
 * estimate the manual's placement, 2 or 3 inches behind the shoulder blade,
 * cannot replace, since the body has no shoulder blade). The breast collar
 * bears just above the point of shoulder (par. 13d), the breeching's body piece
 * an inch behind the buttocks (par. 13c(1)), and the croup piece ends over the
 * croup a hand's breadth above the tail's root (par. 13c(1)), the packer's hand
 * being ANSUR II's (`BANDS`).
 */
export namespace EquinePack {
  /**
   * The Phillips cargo pack saddle, FM 25-7 par. 8a, p. 20: "Pads are 23 by 25
   * inches", taken as 23 along the back and 25 across it, a provisional
   * assignment since the manual does not say which is which; it "weighs 72
   * pounds (exclusive of breeching and cinches)", and rigged "with these
   * accessories, it weighs approximately 95 pounds" (par. 9, p. 20).
   */
  export const CARGO: Readonly<{
    along: number;
    across: number;
    mass: number;
    rigged: number;
  }> = {
    along: 23 * AutoMovieArchetypeUnits.INCH,
    across: 25 * AutoMovieArchetypeUnits.INCH,
    mass: 72 * AutoMovieArchetypeUnits.POUND,
    rigged: 95 * AutoMovieArchetypeUnits.POUND,
  };

  /**
   * The height at the withers the cargo saddle fits, metres: the middle of FM
   * 25-7's pack mule, "from 14 3/4 to 15 1/2 hands in height" (par. 5b, p. 4),
   * 59 to 62 in at four inches to the hand.
   */
  export const MULE: number = ((59 + 62) / 2) * AutoMovieArchetypeUnits.INCH;

  /**
   * The breeching's body piece behind the buttocks, metres: "about 1 inch
   * clearance between the body piece and the animal's buttocks" (FM 25-7 par.
   * 13c(1), p. 31).
   */
  export const BREECHING: number = 1 * AutoMovieArchetypeUnits.INCH;

  /** The pads' thickness, metres: an estimate, no source read gives it. */
  export const PAD: number = 0.04;

  /**
   * The band of the pack's drawn dimension: `croupClearance`, the croup piece's
   * end above the tail's root, one hand's breadth (FM 25-7 par. 13c(1)), over
   * ANSUR II's women's and men's mean hand breadths across the second to fifth
   * metacarpals, 78.2 and 88.3 mm, as the human figure states them
   * (`IAutoMovieHumanArmIdentity.handBreadth`).
   */
  export const BANDS: Readonly<
    Partial<Record<AutoMovieArchetypeEquine.Free, IAutoMovieArchetypeBand>>
  > = {
    croupClearance: AutoMovieArchetypeBand.metres(
      0.0782,
      0.0883,
      "ANSUR II hand breadth, women's mean 78.2 mm and men's 88.3 mm, as packages/human's IAutoMovieHumanArmIdentity.handBreadth states them; FM 25-7 par. 13c(1): the croup piece's clearance is one hand's breadth",
    ),
  };

  /**
   * The cargo saddle's size for an equid: its pads along and across the back,
   * its weight and its rigged weight, scaled from the manual's mule by height
   * and by height cubed.
   *
   * @param withers The equid's height at the withers, metres.
   * @returns The pads' length along and width across the back, metres, and the
   *   saddle's mass and its rigged mass, kilograms.
   */
  export function saddle(
    withers: number,
  ): Readonly<{ along: number; across: number; mass: number; rigged: number }> {
    const ratio: number = withers / MULE;
    return {
      along: CARGO.along * ratio,
      across: CARGO.across * ratio,
      mass: CARGO.mass * ratio ** 3,
      rigged: CARGO.rigged * ratio ** 3,
    };
  }

  /**
   * Lay the pack saddle on an equid under construction.
   *
   * @param builder The equid under construction, its body laid.
   * @param d The equid's dimensions.
   * @param rig The equid's rest rig.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    d: Readonly<Record<AutoMovieArchetypeEquine.Dimension, number>>,
    rig: AutoMovieArchetypeEquine.IRig,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const r: number = EquineHarness.ESTIMATES.strap;
    const steps: number = EquineHarness.ESTIMATES.arc;
    const size: ReturnType<typeof saddle> = saddle(d.withersHeight);
    // The straps, laid once all are placed, so the rigging's mass is shared among them.
    const straps: [string, IAutoMovieVector3, IAutoMovieVector3][] = [];
    const barrel: number = rig.barrel;
    const axis: number = rig.back - barrel;
    // The pads' middle where a riding saddle's would be: the rig's hitch, `AutoMovieArchetypeEquine.SADDLE` behind the shoulder joints, an estimate.
    const centre: number = rig.hitch.z;
    const outer: number = barrel + PAD / 2;
    // The pads' arc from the spine down each side: half their width over the barrel's surface, never past its underside.
    const sweep: number = Math.min(Math.PI, size.across / 2 / barrel);
    const round = (
      angle: number,
      sign: number,
      radius: number,
    ): IAutoMovieVector3 =>
      v(
        sign * radius * Math.sin(angle),
        axis + radius * Math.cos(angle),
        centre,
      );

    for (const [side, sign] of EquineHarness.SIDES) {
      for (let k: number = 0; k < steps; k++) {
        const a: IAutoMovieVector3 = round((sweep * k) / steps, sign, outer);
        const b: IAutoMovieVector3 = round(
          (sweep * (k + 1)) / steps,
          sign,
          outer,
        );
        const middle: IAutoMovieVector3 = Vector3.scale(Vector3.add(a, b), 0.5);
        const tangent: number = Vector3.length(Vector3.subtract(b, a));
        builder.box(
          `pad-${side}-${k + 1}`,
          v(tangent, PAD, size.along),
          middle,
          {
            color: CANVAS,
            share: (100 * size.mass) / d.mass / (2 * steps),
            rotation: Quaternion.fromAxisAngle(
              v(0, 0, 1),
              (-sign * ((sweep * (k + 0.5)) / steps)) /
                AutoMovieArchetypeUnits.DEGREE,
            ),
          },
        );
      }
      // The load rests against the pad's side, its frame at the side's middle facing out.
      const angle: number = sweep / 2;
      builder.affordance({
        id: `${side}Load`,
        kind: "surface",
        frame: AutoMovieArchetypeFrame.facing(
          round(angle, sign, barrel + PAD),
          v(sign * Math.sin(angle), Math.cos(angle), 0),
          v(0, 0, 1),
        ),
        extent: null,
        width: size.along,
        depth: barrel * sweep,
      });
    }

    // The cinch round the barrel under it, from one pad's lower edge to the other's.
    const cinch = (angle: number): IAutoMovieVector3 =>
      round(angle, 1, barrel + r);
    const under: IAutoMovieVector3[] = Array.from(
      { length: steps + 1 },
      (_: unknown, k: number): IAutoMovieVector3 =>
        cinch(sweep + ((2 * Math.PI - 2 * sweep) * k) / steps),
    );
    under.slice(1).forEach((to: IAutoMovieVector3, k: number): void => {
      straps.push([`cinch-${k + 1}`, under[k]!, to]);
    });

    // The breast collar round the front of the chest at the point of shoulder's height, from one pad's front to the other's.
    const collar: IAutoMovieVector3[] = Array.from(
      { length: steps + 1 },
      (_: unknown, k: number): IAutoMovieVector3 =>
        EquineHarness.chest(rig, (Math.PI * k) / steps),
    );
    collar.slice(1).forEach((to: IAutoMovieVector3, k: number): void => {
      straps.push([`breast-${k + 1}`, collar[k]!, to]);
    });
    for (const [side, sign] of EquineHarness.SIDES)
      straps.push([
        `breast-${side}`,
        v(sign * rig.draft.x, rig.draft.y, rig.draft.z),
        round(sweep, sign, outer + PAD / 2),
      ]);

    // The croup piece along the spine from the pads' back to its clearance above the tail's root.
    const end: IAutoMovieVector3 = v(
      0,
      rig.dock.y + d.croupClearance,
      rig.dock.z,
    );
    straps.push(["croup", v(0, rig.back + r, centre - size.along / 2), end]);

    // The tie a following animal's lead is made fast to: the pads' back on the spine, where the croup piece leaves the saddle.
    builder.affordance({
      id: "tie",
      kind: "rein",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, rig.back + r, centre - size.along / 2),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      symmetry: "round",
    });

    // The breeching an inch behind the hindquarters' rounded end at the point of buttock's height, held up from the croup piece's end.
    // Its straight straps circumscribe the strap's circle: each strap's middle, its nearest to the body, keeps the inch.
    const reach: number =
      (barrel + BREECHING + r) / Math.cos(Math.PI / (2 * steps));
    const behind = (angle: number): IAutoMovieVector3 =>
      v(
        reach * Math.cos(angle),
        rig.buttock.y,
        rig.quarters.z - reach * Math.sin(angle),
      );
    const breeching: IAutoMovieVector3[] = Array.from(
      { length: steps + 1 },
      (_: unknown, k: number): IAutoMovieVector3 =>
        behind((Math.PI * k) / steps),
    );
    breeching.slice(1).forEach((to: IAutoMovieVector3, k: number): void => {
      straps.push([`breeching-${k + 1}`, breeching[k]!, to]);
    });
    for (const [side, sign] of EquineHarness.SIDES)
      straps.push([
        `hip-${side}`,
        end,
        v(sign * reach, rig.buttock.y, rig.quarters.z),
      ]);
    const share: number =
      (100 * (size.rigged - size.mass)) / d.mass / straps.length;
    for (const [id, from, to] of straps)
      builder.rod(id, r, from, to, { color: CANVAS, share });
  }
}

/** Pack canvas and its straps. */
const CANVAS: string = "#6b5d45";
