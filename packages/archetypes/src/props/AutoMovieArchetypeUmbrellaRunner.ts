import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeBuilder, AutoMovieArchetypeFrame } from "../core";

/**
 * A stick umbrella's opening mechanism: the runner sliding up the shaft and
 * the ribs it raises through their stretchers.
 *
 * Each rib hangs from the top notch at the shaft's top; a stretcher joins a
 * point `STRETCHER_AT` of the way down the rib to the runner. With the rib
 * at `phi` from hanging straight down, the runner stands
 * `a cos(phi) + sqrt(k^2 - a^2 sin^2(phi))` below the notch, by the triangle
 * of rib, stretcher and shaft (`a` the rib's joint, `k` the stretcher), so
 * pushing the runner up the shaft swings every rib out together. A rib's
 * opening follows the runner's travel through that relation, tabled every
 * `STEP` degrees. Open, the ribs stand `OPEN` degrees from hanging, and
 * their length makes the canopy's span the model's open diameter, so the
 * canopy's size follows the runner: its radius is the rib's length times
 * `sin(phi)`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mechanism, the runner's closed form and how the canopy's size follows it.
 * @evidence contracts/development/design.md#principled-representation One slider and one coupled hinge per rib, tabled from the closed-form linkage.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The construction `createUmbrella` calls and the ids it declares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rib count, the open angle and the stretcher's proportions are named construction estimates.
 */
export namespace AutoMovieArchetypeUmbrellaRunner {
  /** The ribs, as stick umbrellas commonly have eight: a construction estimate. */
  export const RIBS: number = 8;

  /** The open ribs' angle from hanging, degrees: a construction estimate for a canopy whose ribs droop a little below level. */
  export const OPEN: number = 75;

  /** Where the stretcher joins the rib, as a share of its length down from the notch: a construction estimate. */
  export const STRETCHER_AT: number = 0.3;

  /** The stretcher's length, as a share of the rib's: a construction estimate. */
  export const STRETCHER: number = 0.35;

  /** The opening table's step, degrees. */
  export const STEP: number = 15;

  /**
   * A rib's hinge id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names a rib hinge by its number.
   * @evidence contracts/development/design.md#principled-representation A template literal `rib` followed by the rib's number.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the umbrella's contacts include it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No restated ids.
   */
  export type Rib = `rib${number}`;

  /**
   * The runner and the rib hinges.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the contacts the runner adds.
   * @evidence contracts/development/design.md#principled-representation The runner id and every rib hinge.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; `createUmbrella` joins it to its own contacts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No restated ids.
   */
  export type Affordance = "runner" | Rib;

  /**
   * Add the runner and the furled ribs to a closed umbrella.
   *
   * @param builder The umbrella's builder.
   * @param length The closed length: the notch stands at the shaft's top.
   * @param canopy The open canopy's diameter, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is added and where.
   * @evidence contracts/development/implementation.md#principled-implementation The runner's place below the notch is the linkage's closed form at each tabled rib angle; the ribs' length spans the open diameter at `OPEN`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Size the rib and stretcher, table the linkage, then the runner and each rib.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The canopy's fabric between the ribs is not drawn; the ribs are straight.
   * @evidence contracts/development/implementation.md#efficient-algorithms One table shared by every rib.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No equivalent linkage exists.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function furl<Id extends string, D extends string>(
    builder: AutoMovieArchetypeBuilder<Affordance | Id, D>,
    length: number,
    canopy: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const rib: number = canopy / 2 / Math.sin((OPEN * Math.PI) / 180);
    const below: (phi: number) => number = (phi: number): number => {
      const a: number = STRETCHER_AT * rib;
      const k: number = STRETCHER * rib;
      const s: number = a * Math.sin((phi * Math.PI) / 180);
      return a * Math.cos((phi * Math.PI) / 180) + Math.sqrt(k * k - s * s);
    };
    const furled: number = below(0);
    const angles: number[] = [];
    for (let phi: number = 0; phi < OPEN; phi += STEP) angles.push(phi);
    angles.push(OPEN);
    const table: [number, number][] = angles.map(
      (phi: number): [number, number] => [furled - below(phi), phi],
    );
    const travel: number = furled - below(OPEN);
    const notch: number = length;
    builder.rod(
      "runner",
      0.012,
      v(0, notch - furled - 0.015, 0),
      v(0, notch - furled + 0.015, 0),
      { color: "#2c2f33" },
    );
    builder.affordance({
      id: "runner",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, notch - furled, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      travel,
      parts: ["runner"],
    });
    for (let i: number = 0; i < RIBS; ++i) {
      const theta: number = (2 * Math.PI * i) / RIBS;
      const out: IAutoMovieVector3 = v(Math.sin(theta), 0, Math.cos(theta));
      const pivot: IAutoMovieVector3 = v(0.012 * out.x, 0, 0.012 * out.z);
      const id: Rib = `rib${i}`;
      builder.box(
        id,
        v(0.004, rib, 0.004),
        v(pivot.x, notch - rib / 2, pivot.z),
        { color: "#1f2a44" },
      );
      builder.affordance({
        id,
        kind: "hinge",
        extent: null,
        travel: OPEN,
        parts: [id],
        // The rib swings out about the tangent at the notch.
        frame: AutoMovieArchetypeFrame.facing(
          v(pivot.x, notch, pivot.z),
          v(-Math.cos(theta), 0, Math.sin(theta)),
          out,
        ),
        follows: { id: "runner", table },
      });
    }
  }
}
