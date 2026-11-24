import type {
  import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: Tangle.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: Tangle.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
.IPart): boolean => p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: Tangle.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
.IPart): boolean => p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: Tangle.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: Tangle.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
.IPart): boolean => p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";

/**
 * Measure one pair of seated-body segments beyond their built-in overlap. Use
 * the same directed hull and axis probes in both directions as the
 * displayed-body collision reading.
 */
export function seatedPairDepth(
  body: IAutoMovieMotionHumanBody,
  first: AutoMovieHumanoidBone,
  second: AutoMovieHumanoidBone,
): (placed: readonly IAutoMovieMotionHumanColliders.IPlaced[]) => number {
  const model: Tangle.IModel = body.tangle;
  const a: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === first,
  );
  const b: number = model.parts.findIndex(
    (p: Tangle.IPart): boolean => p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
.IPart): boolean => p.bone === second,
  );
  return (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number => {
    if (a < 0 || b < 0) return 0;
    return Math.max(
      Tangle.excess(model, placed, a, b),
      Tangle.excess(model, placed, b, a),
    );
  };
}
