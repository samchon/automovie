import type {
  IAutoMovieBodyMeasure,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeDensity,
  AutoMovieArchetypeRefusal,
} from "../core";
import type { createArmour } from "./createArmour";

/**
 * Named envelopes and fitting boundaries shared by every armour wall.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates literal museum dimensions and mass, admitted body fitting dimensions, authored coarse topology and the mail's density-equivalent wall; all lengths are metres.
 * @evidence contracts/development/design.md#principled-representation One profile holds the independent source envelope and body boundary, while closed convex wall cells carry their corners rather than a filled proxy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Profile creation and wall-cell records serve the current public producer and its form modules; no renderer, Human or motion state enters the law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Historical measurements remain distinct from authored coarse proportions and steel-equivalent mail; missing body fields, thickness or density are never filled with a biological estimate.
 */
export namespace ArmourProfile {
  /**
   * Explicit coarse shirt/torso topology, dimensionless and not historical measurements.
   */
  export const TORSO: Readonly<{
    breadthShare: number;
    neckBreadthShare: number;
    neckHeightShare: number;
    sleeveHeightShare: number;
  }> = {
    breadthShare: 1 / 3,
    neckBreadthShare: 1 / 3,
    neckHeightShare: 1 / 6,
    sleeveHeightShare: 1 / 3,
  };

  /**
   * One closed convex wall cell in model metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the stable part identity and independent local corner coordinates consumed by the shared builder's convex-cell owner.
   * @evidence contracts/development/design.md#principled-representation A finite corner set describes one wall volume; the core owns hull topology, rendered faces, mass and collider from the same set.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The producer needs only an identity and corners at identity placement; no duplicate triangulation or physical proxy escapes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A cell is a wall region, never the hull of a whole hollow helmet or shirt, and no hidden bounding solid supplies mass.
   */
  export interface ICell {
    /** Stable identity within the produced piece. */
    id: string;
    /** Convex wall corners, model metres. */
    points: readonly IAutoMovieVector3[];
    /** One already admitted immutable cell, reused only at rigidly equivalent sectors. */
    prepared?: AutoMovieArchetypeConvexCell.ICell;
    /** Proper rigid placement of a reused local cell; absent is identity. */
    rotation?: IAutoMovieQuaternion;
  }

  /**
   * Source record, admitted fitting boundary and coarse wall dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents kind/model identity, fitted status, original record envelope, outer envelope, inner fitting boundary, plate/pad and wall units.
   * @evidence contracts/development/design.md#principled-representation Independent museum size remains separate from the fitted envelope and the inner body boundary; model identity preserves missing/associated artifact scope.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every field is consumed by current helmet, torso or limb generation; there is no optional reconstruction mode or unconsumed physical coefficient.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Mail wall is a geometry-equivalent value under the existing steel preset and recorded mass, not measured wire thickness or a claim about historical alloy composition.
   */
  export interface IProfile {
    /** Public kind and selected original museum record. */
    kind: createArmour.Kind;
    /** Selected original museum record, including its partial-artifact scope. */
    model: createArmour.Model;
    /** Whether an admitted body boundary was supplied. */
    fitted: boolean;
    /** Literal record width, height and depth, unchanged in the public dimensions. */
    record: IAutoMovieVector3;
    /** Nominal covered-section width/height/depth; mail sleeves retain the independent record spread. */
    outer: IAutoMovieVector3;
    /** Cavity width, height and depth; radial fitted guards use half its width as body radius. */
    inner: IAutoMovieVector3;
    /** Plate band value: exact fitted normal gauge, minimum on unfitted elliptical walls; zero for mail. */
    plate: number;
    /** Existing provisional modern helmet pad; zero outside helmets. */
    pad: number;
    /** Positive wall gauge, a minimum on unfitted ellipses, or mail's explicit equivalent wall. */
    wall: number;
  }

  /**
   * Resolve a whole record and admitted body's exact existing fitting dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Takes the selected museum record, SI dimensions and already admitted minimal measure; returns independent model/fit boundaries and refuses a nonpositive or geometrically impossible wall.
   * @evidence contracts/development/implementation.md#principled-implementation Plates retain their band value. Helmets retain head radius plus existing padding and plate; torso/limbs retain their covered dimensions. Mail solves the closed-form quadratic panel-volume law against record mass divided by the existing EN1991 steel density.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the existing body's dimensions by kind, retain the record separately, derive one mail wall if needed and form independent inner/outer boundaries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new measured thickness, alloy density, full-body dependency or altered museum figure is introduced; unrepresentable and impossible positive walls refuse rather than being clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work and storage; the mail wall uses one stable quadratic expression, without mesh generation or iterative sampling.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every cell consumes these same prepared dimensions and the same mail coverage equation, while the core owns all hull and mass integration.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fresh scalar/vector records escape; caller measures and dimension records are not retained or changed.
   */
  export function create(
    kind: createArmour.Kind,
    model: createArmour.Model,
    dimensions: Readonly<Partial<Record<createArmour.Dimension, number>>>,
    measure?: Partial<IAutoMovieBodyMeasure>,
  ): IProfile {
    const record: IAutoMovieVector3 = {
      x: dimensions.width!,
      y: dimensions.height!,
      z: dimensions.depth!,
    };
    const plate: number = dimensions.thickness ?? 0;
    const pad: number = dimensions.pad ?? 0;
    const fitted: boolean = measure !== undefined;
    let outer: IAutoMovieVector3 = { ...record };
    if (measure !== undefined) {
      if (kind.endsWith("Helmet")) {
        const radius: number = measure.headRadius! + pad + plate;
        outer = { x: 2 * radius, y: 2 * radius, z: 2 * radius };
      } else if (kind === "cuirass" || kind === "mail")
        outer = {
          x: measure.chestBreadth! + 2 * plate,
          y:
            kind === "mail"
              ? record.y
              : measure.shoulderHeight! - measure.waistHeight!,
          z: measure.chestDepth! + 2 * plate,
        };
      else {
        const radius: number =
          (kind === "greave" ? measure.shankRadius! : measure.forearmRadius!) +
          plate;
        outer = {
          x: 2 * radius,
          y:
            kind === "greave"
              ? measure.shank!
              : kind === "vambrace"
                ? measure.forearm!
                : measure.hand!,
          z: 2 * radius,
        };
      }
    }
    const wall: number =
      kind === "mail"
        ? mailWall(outer, record.x, dimensions.mass!, fitted)
        : plate;
    if (kind === "mail" && fitted)
      outer = { ...outer, x: outer.x + 2 * wall, z: outer.z + 2 * wall };
    const inner: IAutoMovieVector3 = {
      x: outer.x - 2 * wall,
      y: outer.y,
      z: outer.z - 2 * wall,
    };
    if (
      ![wall, inner.x, inner.z, outer.y].every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      )
    )
      refuse(
        kind,
        "the selected record or fitting boundary cannot contain a positive actual wall",
      );
    return { kind, model, fitted, record, outer, inner, plate, pad, wall };
  }

  /** The shirt's torso/neck/side/sleeve coverage is shared with ArmourTorso. */
  function mailWall(
    size: IAutoMovieVector3,
    spread: number,
    mass: number,
    fitted: boolean,
  ): number {
    const breadth: number = fitted ? size.x : size.x * TORSO.breadthShare;
    const depth: number = size.z;
    const sleeve: number = (spread - breadth) / 2;
    const widthRate: number = fitted ? 2 : 0;
    const depthRate: number = fitted ? 0 : -2;
    const frontHeight: number =
      size.y * (1 - TORSO.neckBreadthShare * TORSO.neckHeightShare);
    const sleeveHeight: number = size.y * TORSO.sleeveHeightShare;
    const sideHeight: number = size.y - sleeveHeight;
    const a: number =
      2 * breadth * frontHeight +
      2 * sideHeight * depth +
      4 * sleeve * sleeveHeight +
      4 * sleeve * depth;
    const b: number =
      2 * widthRate * frontHeight +
      2 * sideHeight * depthRate -
      2 * widthRate * sleeveHeight +
      4 * sleeve * depthRate -
      2 * widthRate * depth;
    const volume: number = mass / AutoMovieArchetypeDensity.STEEL;
    const discriminant: number = a * a + 4 * b * volume;
    const wall: number = (2 * volume) / (a + Math.sqrt(discriminant));
    if (
      !(
        Number.isFinite(wall) &&
        wall > 0 &&
        sleeve > 0 &&
        wall < sleeveHeight / 2 &&
        (fitted || 2 * wall < Math.min(breadth, depth)) &&
        (!fitted || breadth + 2 * wall < spread)
      )
    )
      refuse(
        "mail",
        "the record mass at the declared steel density cannot fit this shirt coverage with a positive cavity and sleeve opening",
      );
    return wall;
  }

  /** Geometrically impossible data remains an actionable producer refusal. */
  function refuse(kind: createArmour.Kind, reason: string): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "armour",
      axis: "measure",
      value: kind,
      feasible: null,
      reason,
      fix: "supply fitting dimensions compatible with the selected record and its real wall geometry",
    });
  }
}
