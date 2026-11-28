import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  ladderAccessSurface
} from "../../../../../packages/motions/src/climbing/internal/ladderAccessSurface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** The chosen half-metre and metre spans are exact binary64 input values. */
const ROUNDING: number = 0;

/**
 * Admit only the named fixed rectangular landing.
 *
 * Scenarios:
 *
 * 1. The named surface keeps its shallow depth available to the stance fitter.
 * 2. A seat of the same size, missing depth or id, a non-fixture or an internally
 *    moving fixture has no valid landing surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a named rectangular fixed landing and refusal of absent dimensions or moving supports.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves an admitted shallow fixture and tries a seat, missing identifier and depth, wrong role, and in-place moving geometry.
 * @evidence contracts/development/testing.md#independent-expectations The specified width and depth must survive preparation. Shape semantics and movement checks independently refuse plausible but invalid alternatives.
 */
export function test_motions_climbing_ladder_access_surface(): void {
  const rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const top: IAutoMovieAffordance = {
    id: "upper",
    kind: "surface",
    extent: null,
    width: 1,
    depth: 0.5,
    frame: {
      translation: { x: 0, y: 1, z: 0 },
      rotation,
      scale: { x: 1, y: 1, z: 1 },
    },
  };
  const prop: ladderAccessSurface.IProp = {
    fixed: true,
    affordances: [{ ...top, id: "stool", kind: "seat" }, top],
  };
  const surface: ladderAccessSurface.ISurface | undefined = ladderAccessSurface(
    prop,
    "upper",
  );
  TestValidator.predicate(
    "only the matching surface retains both rectangular spans",
    surface?.kind === "surface" &&
      nclose(surface.width, 1, ROUNDING) &&
      nclose(surface.depth, 0.5, ROUNDING),
  );
  TestValidator.predicate(
    "unplaced, underspecified or moving candidates are refused",
    ladderAccessSurface(prop, "missing") === undefined &&
      ladderAccessSurface(prop, "stool") === undefined &&
      ladderAccessSurface({ ...prop, fixed: false }, "upper") === undefined &&
      ladderAccessSurface({ ...prop, hasArticulations: true }, "upper") ===
        undefined &&
      ladderAccessSurface(
        { ...prop, affordances: [{ ...top, depth: undefined }] },
        "upper",
      ) === undefined,
  );
}
