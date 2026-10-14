import { validateGroundContact } from "@automovie/engine";
import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validationHasWarning } from "../internal/predicates";

const t: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const skeleton: IAutoMovieSkeleton = {
  id: "walker",
  bones: [
    { bone: "hips", parent: null, rest: t(0, 0, 0), constraint: null },
    { bone: "leftFoot", parent: "hips", rest: t(0, 0, 0), constraint: null },
  ],
};

/** Root slides x 0 → 1 over one second at a constant height. */
const slide: (footY: number) => IAutoMovieMotion = (
  footY: number,
): IAutoMovieMotion => ({
  id: "slide",
  skeleton: "walker",
  duration: 1,
  loop: false,
  keyframes: [0, 1].map(
    (time: number): IAutoMovieKeyframe => ({
      time,
      pose: {
        skeleton: "walker",
        root: t(time, footY, 0),
        joints: [],
      },
      expression: null,
      easing: "linear" as const,
      bezier: null,
    }),
  ),
});

/** Ground rises with x: h(x) = 0.5·x. */
const rising: (x: number) => number = (x: number): number => 0.5 * x;

/**
 * Foot-point ground advice reads the supplied height at the current plan position; scalar and constant-callback ground preserve the same selected admission verdict.
 *
 * Scenarios:
 *
 * 1. A foot gliding at y=0.1 over h(x)=0.5x receives a physics warning at its world-Y address while admission succeeds.
 * 2. The same existing glide lifted to y=0.6 succeeds; its warning population is not asserted.
 * 3. Constant zero callback and scalar zero ground both succeed on the same flat-clearing clip.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual ground sampling with a rising callback and checks a located warning, then contrasts lifted, scalar and constant-callback inputs through their success verdicts.
 * @evidence contracts/testing.md#independent-expectations At the final x=1, the ramp is 0.5m, above the low 0.1m foot and below the lifted 0.6m foot; constant zero equals the scalar surface. Only warning presence for the low glide and admission for the neighbors are observed, not byte parity, exact depth or every warning population.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts low/lifted existing clips and rising/scalar/constant surfaces; malformed clocks, flat-plane depth and capsule endpoints have separate entries. Arbitrary curved surfaces and continuous collision are outside this test.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns existing generic rig/clip data and a pure supplied ground callback, invokes portable FK sampling and starts no Human builder, renderer, process or native artifact.
 */
export function test_validation_ground_contact_surface(): void {
  const sunk: IAutoMovieValidation = validateGroundContact({
    motion: slide(0.1),
    skeleton,
    footBones: ["leftFoot"],
    groundY: rising,
  });
  TestValidator.predicate(
    "warning names the foot's world y",
    validationHasWarning(
      "surface ground contact",
      sunk,
      "physics",
      ".leftFoot.worldPosition.y",
    ),
  );

  TestValidator.equals(
    "high glide clears the slope",
    validateGroundContact({
      motion: slide(0.6),
      skeleton,
      footBones: ["leftFoot"],
      groundY: rising,
    }).success,
    true,
  );

  const scalar: IAutoMovieValidation = validateGroundContact({
    motion: slide(0.1),
    skeleton,
    footBones: ["leftFoot"],
    groundY: 0,
  });
  const constant: IAutoMovieValidation = validateGroundContact({
    motion: slide(0.1),
    skeleton,
    footBones: ["leftFoot"],
    groundY: (): number => 0,
  });
  TestValidator.equals("scalar passes the flat clip", scalar.success, true);
  TestValidator.equals(
    "constant callback matches the scalar verdict",
    constant.success,
    scalar.success,
  );
}
