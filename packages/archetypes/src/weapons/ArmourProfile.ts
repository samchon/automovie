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

/** Named envelopes and fitting boundaries shared by every armour wall. */
export namespace ArmourProfile {
  /**
   * Explicit coarse shirt/torso topology, dimensionless and not historical
   * measurements.
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

  /** One closed convex wall cell in model metres. */
  export interface ICell {
    /** Stable identity within the produced piece. */
    id: string;
    /** Convex wall corners, model metres. */
    points: readonly IAutoMovieVector3[];
    /**
     * One already admitted immutable cell, reused only at rigidly equivalent
     * sectors.
     */
    prepared?: AutoMovieArchetypeConvexCell.ICell;
    /** Proper rigid placement of a reused local cell; absent is identity. */
    rotation?: IAutoMovieQuaternion;
  }

  /** Source record, admitted fitting boundary and coarse wall dimensions. */
  export interface IProfile {
    /** Public kind and selected original museum record. */
    kind: createArmour.Kind;
    /** Selected original museum record, including its partial-artifact scope. */
    model: createArmour.Model;
    /** Whether an admitted body boundary was supplied. */
    fitted: boolean;
    /**
     * Literal record width, height and depth, unchanged in the public
     * dimensions.
     */
    record: IAutoMovieVector3;
    /**
     * Nominal covered-section width/height/depth; mail sleeves retain the
     * independent record spread.
     */
    outer: IAutoMovieVector3;
    /**
     * Cavity width, height and depth; radial fitted guards use half its width
     * as body radius.
     */
    inner: IAutoMovieVector3;
    /**
     * Plate band value: exact fitted normal gauge, minimum on unfitted
     * elliptical walls; zero for mail.
     */
    plate: number;
    /** Existing provisional modern helmet pad; zero outside helmets. */
    pad: number;
    /**
     * Positive wall gauge, a minimum on unfitted ellipses, or mail's explicit
     * equivalent wall.
     */
    wall: number;
  }

  /**
   * Resolve a whole record and admitted body's exact existing fitting
   * dimensions.
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
        (value: number): boolean => value > 0,
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
