import { impactRecoil } from "@automovie/engine";
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
const bone: (
  name: IAutoMovieBone["bone"],
  parent: IAutoMovieBone["parent"],
) => IAutoMovieBone = (
  name: IAutoMovieBone["bone"],
  parent: IAutoMovieBone["parent"],
): IAutoMovieBone => ({ bone: name, parent, rest, constraint: null });

const skeleton: IAutoMovieSkeleton = {
  id: "falloff-rig",
  bones: [bone("spine", null), bone("chest", "spine")],
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
 * `impactRecoil` treats `falloff` as an attenuation coefficient down the recoil
 * chain. Invalid falloff must fail before downstream joints can receive
 * non-finite, reversed, or amplified pushes.
 *
 * Scenarios:
 *
 * 1. Non-finite and out-of-range falloff values throw before propagation.
 * 2. Boundary falloff values `0` and `1` remain valid attenuation choices.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds recoil with invalid attenuation expecting throws, then checks zero stops propagation and one preserves it, catching non-finite/amplifying admission or broken valid endpoints.
 * @evidence contracts/testing.md#independent-expectations The finite [0,1] coefficient contract defines refusal; 0^0=1, 0^1=0 and 1^i=1 give independently authored contact/downstream expectations and null rest. Exception type and internal order are not asserted.
 * @evidence contracts/testing.md#distinguishing-cases Covers NaN, infinity, just-below-zero and just-above-one refusal plus both admitted endpoints on two joints; intermediate falloff and explicit joint clamps belong to the recoil unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit calls impactRecoil with a local rig and owns its assertions without hosts or dynamically registered cases.
 */
export function test_physics_impact_recoil_falloff(): void {
  for (const falloff of [Number.NaN, Infinity, -0.1, 1.1])
    TestValidator.predicate(
      `falloff ${falloff} throws`,
      throws(
        (): ReturnType<typeof impactRecoil> =>
          impactRecoil({ flexion: 10 }, ["spine", "chest"], skeleton, falloff),
      ),
    );

  const contactOnly: ReturnType<typeof impactRecoil> = impactRecoil(
    { flexion: 10 },
    ["spine", "chest"],
    skeleton,
    0,
  );
  TestValidator.predicate(
    "falloff zero stops at the next joint",
    nclose(contactOnly.joints[0]!.flexion!, 10) &&
      contactOnly.joints[1]!.flexion === null,
  );

  const noLoss: ReturnType<typeof impactRecoil> = impactRecoil(
    { flexion: 10 },
    ["spine", "chest"],
    skeleton,
    1,
  );
  TestValidator.predicate(
    "falloff one preserves the push",
    nclose(noLoss.joints[0]!.flexion!, 10) &&
      nclose(noLoss.joints[1]!.flexion!, 10),
  );
}
