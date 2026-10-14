import { IAutoMovieRecoilPush, impactRecoil } from "@automovie/engine";
import {
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const rest: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
const bone: (name: IAutoMovieBone["bone"], parent: IAutoMovieBone["parent"], constraint: IAutoMovieBone["constraint"]) => IAutoMovieBone = (
  name: IAutoMovieBone["bone"],
  parent: IAutoMovieBone["parent"],
  constraint: IAutoMovieBone["constraint"],
): IAutoMovieBone => ({ bone: name, parent, rest, constraint });

const skeleton: IAutoMovieSkeleton = {
  id: "finite-push-rig",
  bones: [
    bone("spine", null, {
      flexion: { min: -30, max: 40 },
      abduction: { min: -15, max: 15 },
      twist: { min: -20, max: 20 },
    }),
    bone("chest", "spine", null),
  ],
};

const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

/**
 * Recoil push axes are caller-provided impulse deflections. A present axis must
 * be finite before propagation so unconstrained bones cannot emit non-finite
 * joint poses and constrained bones cannot mask invalid caller input.
 *
 * Scenarios:
 *
 * 1. Non-finite push axes throw before propagation.
 * 2. Finite large push axes still use the existing ROM clamp behavior.
 *
 * @evidence contracts/testing.md#behavioral-verification Rejects non-finite recoil axes, then checks all three finite saturated axes against authored ROM bounds, catching invalid push admission or a guard that suppresses valid clamping.
 * @evidence contracts/testing.md#independent-expectations Finite degree targets are the input contract; the rig's explicit maxima/minimum independently define 40/-15/20. Exception presence is asserted without claiming exact diagnostic identity or evaluation order.
 * @evidence contracts/testing.md#distinguishing-cases Separates flexion NaN, abduction infinity and twist negative infinity from a finite three-axis positive twin; omitted/zero axes, falloff and default/coupled constraints belong to neighboring recoil units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns the local loop assertions and calls impactRecoil with an in-memory rig; no host or dynamic cases are installed.
 */
export function test_physics_impact_recoil_push_finite(): void {
  const cases: [keyof IAutoMovieRecoilPush, number][] = [
    ["flexion", Number.NaN],
    ["abduction", Infinity],
    ["twist", -Infinity],
  ];
  for (const [axis, value] of cases)
    TestValidator.predicate(
      `${axis} ${value} throws`,
      throws((): ReturnType<typeof impactRecoil> =>
        impactRecoil({ [axis]: value }, ["spine", "chest"], skeleton, 1),
      ),
    );

  const pose: ReturnType<typeof impactRecoil> = impactRecoil(
    { flexion: 200, abduction: -100, twist: 50 },
    ["spine"],
    skeleton,
    1,
  );
  TestValidator.predicate(
    "finite flexion keeps ROM max clamp",
    nclose(pose.joints[0]!.flexion!, 40),
  );
  TestValidator.predicate(
    "finite abduction keeps ROM min clamp",
    nclose(pose.joints[0]!.abduction!, -15),
  );
  TestValidator.predicate(
    "finite twist keeps ROM max clamp",
    nclose(pose.joints[0]!.twist!, 20),
  );
}
