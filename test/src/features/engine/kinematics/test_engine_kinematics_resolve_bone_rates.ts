import {
  indexSkeletonTopology,
  resolveAutoMovieBoneRates,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * Actual native FK records, with no alternate forward-kinematics
 * implementation.
 */
type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** Explicit moving-bone angular declarations, radians per second. */
type LocalRates = Map<AutoMovieHumanoidBone, IAutoMovieVector3>;

/** Common-frame origin linear and angular rates returned by the product. */
type Rates = Map<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate>;

/**
 * Differentiate one three-link mathematical rig through the actual native FK.
 * This fixture specifies rigid transforms, not a substitute Human character.
 * The expected rates come from differentiating planar circles and translations,
 * independently of the propagation implementation and its vector products.
 *
 * Scenarios:
 *
 * 1. A quarter-turned, translated root gives v=(3-2d,-4,1) at distances d=2,5,10
 *    metres. Removing its spin leaves the common translation rate; explicit
 *    zero declarations give the constant consumer's zero bone rates.
 * 2. A 60-degree Z hinge at the middle origin leaves that pivot fixed and moves
 *    the five-metre distal offset at (-15 sin(theta),15 cos(theta),0).
 * 3. A fixed Z quarter-turn maps a middle bone's body-frame X rate to world Y.
 * 4. Missing rate, missing ancestor, unknown topology and nonfinite data decline
 *    the analytical path; empty and ancestor-complete root demand remain
 *    valid.
 * 5. Output edits affect neither the declarations nor a subsequent rate query.
 */
export function test_engine_kinematics_resolve_bone_rates(): void {
  const skeleton: IAutoMovieSkeleton = rig();
  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton);
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: [],
  };
  const rest: Bones = native(skeleton, pose);
  const local: LocalRates = declared(rest);
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const still: resolveAutoMovieBoneRates.IRoot = {
    position: zero,
    linear: zero,
    angular: zero,
  };
  const precision: number = 64 * Number.EPSILON * 32;
  const root: resolveAutoMovieBoneRates.IRoot = {
    position: { x: 11, y: -7, z: 2 },
    linear: { x: 3, y: -4, z: 1 },
    angular: { x: 0, y: 0, z: 2 },
  };

  // Differentiating (11,-7,2)+Rz(theta)*(d,0,0) at theta=pi/2
  // gives (-2d,0,0), before the independent root translation rate.
  const turned: Bones = native(skeleton, {
    ...pose,
    root: {
      translation: root.position,
      rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      scale: { x: 2, y: 3, z: 4 },
    },
  });
  const rigid: Rates = available(
    resolveAutoMovieBoneRates(topology, turned, local, root),
  );
  const translated: Rates = available(
    resolveAutoMovieBoneRates(topology, turned, local, {
      ...root,
      angular: zero,
    }),
  );
  const constant: Rates = available(
    resolveAutoMovieBoneRates(topology, rest, local, still),
  );
  const distances: readonly [AutoMovieHumanoidBone, number][] = [
    ["hips", 2],
    ["spine", 5],
    ["chest", 10],
  ];
  for (const [name, distance] of distances) {
    TestValidator.predicate(
      `${name}: native quarter-turned unscaled origin`,
      vclose(
        turned.get(name)!.worldPosition,
        { x: 11, y: -7 + distance, z: 2 },
        precision,
      ),
    );
    TestValidator.predicate(
      `${name}: simultaneous root spin and translation`,
      vclose(
        rigid.get(name)!.linear,
        { x: 3 - 2 * distance, y: -4, z: 1 },
        precision,
      ) && vclose(rigid.get(name)!.angular, { x: 0, y: 0, z: 2 }, precision),
    );
    TestValidator.predicate(
      `${name}: pure root translation`,
      vclose(translated.get(name)!.linear, { x: 3, y: -4, z: 1 }, precision) &&
        vclose(translated.get(name)!.angular, zero, precision),
    );
    TestValidator.predicate(
      `${name}: the native constant consumer's explicit zero rates`,
      vclose(constant.get(name)!.linear, zero, 0) &&
        vclose(constant.get(name)!.angular, zero, 0),
    );
  }

  // The middle joint turns about its own fixed origin. Its distal origin
  // follows (5+5*cos(theta),5*sin(theta),0), whose derivative is independent.
  const hinge: Bones = native(skeleton, {
    ...pose,
    joints: [{ bone: "spine", flexion: null, abduction: 60, twist: null }],
  });
  const hingeLocal: LocalRates = declared(hinge);
  hingeLocal.set("spine", { x: 0, y: 0, z: 3 });
  const moving: Rates = available(
    resolveAutoMovieBoneRates(topology, hinge, hingeLocal, still),
  );
  const theta: number = Math.PI / 3;
  TestValidator.predicate(
    "hinge pivot has zero origin velocity and the declared spin",
    vclose(moving.get("spine")!.linear, zero, precision) &&
      vclose(moving.get("spine")!.angular, { x: 0, y: 0, z: 3 }, precision),
  );
  TestValidator.predicate(
    "hinge distal offset follows the independent circular derivative",
    vclose(
      moving.get("chest")!.linear,
      { x: -15 * Math.sin(theta), y: 15 * Math.cos(theta), z: 0 },
      precision,
    ) && vclose(moving.get("chest")!.angular, { x: 0, y: 0, z: 3 }, precision),
  );
  TestValidator.predicate(
    "the hinge does not turn its ancestor",
    vclose(moving.get("hips")!.linear, zero, precision) &&
      vclose(moving.get("hips")!.angular, zero, precision),
  );

  const quarter: IAutoMovieSkeleton = rig({
    x: 0,
    y: 0,
    z: Math.SQRT1_2,
    w: Math.SQRT1_2,
  });
  const quarterBones: Bones = native(quarter, pose);
  const bodyLocal: LocalRates = declared(quarterBones);
  bodyLocal.set("spine", { x: 4, y: 0, z: 0 });
  const body: Rates = available(
    resolveAutoMovieBoneRates(
      indexSkeletonTopology(quarter),
      quarterBones,
      bodyLocal,
      still,
    ),
  );
  TestValidator.predicate(
    "rest Z90 maps local BODY X to common-frame Y",
    vclose(body.get("spine")!.angular, { x: 0, y: 4, z: 0 }, precision) &&
      vclose(body.get("chest")!.angular, { x: 0, y: 4, z: 0 }, precision) &&
      vclose(body.get("spine")!.linear, zero, precision),
  );

  const missingRate: LocalRates = new Map(local);
  missingRate.delete("spine");
  const missingAncestor: Bones = new Map(rest);
  missingAncestor.delete("hips");
  const shorter: IAutoMovieSkeleton = {
    ...skeleton,
    bones: skeleton.bones.slice(0, 2),
  };
  TestValidator.predicate(
    "an absent declared rate is unknown, not zero",
    resolveAutoMovieBoneRates(topology, rest, missingRate, still) === undefined,
  );
  TestValidator.predicate(
    "a missing ancestor cannot provide a parent rate",
    resolveAutoMovieBoneRates(topology, missingAncestor, local, still) ===
      undefined,
  );
  TestValidator.predicate(
    "a bone absent from this topology has no propagated rate",
    resolveAutoMovieBoneRates(
      indexSkeletonTopology(shorter),
      rest,
      local,
      still,
    ) === undefined,
  );

  const empty: Rates = available(
    resolveAutoMovieBoneRates(topology, new Map(), new Map(), still),
  );
  const rootOnly: Bones = new Map([["hips", rest.get("hips")!]]);
  const one: Rates = available(
    resolveAutoMovieBoneRates(topology, rootOnly, declared(rootOnly), still),
  );
  TestValidator.predicate(
    "empty demand and an ancestor-complete single root are valid",
    empty.size === 0 &&
      one.size === 1 &&
      vclose(one.get("hips")!.linear, zero, precision),
  );

  rigid.get("chest")!.linear.x = 999;
  rigid.get("spine")!.angular.z = 999;
  const again: Rates = available(
    resolveAutoMovieBoneRates(topology, turned, local, root),
  );
  TestValidator.predicate(
    "mutated outputs cannot change inputs or later reads",
    vclose(local.get("spine")!, zero, precision) &&
      vclose(again.get("chest")!.linear, { x: -17, y: -4, z: 1 }, precision) &&
      vclose(again.get("spine")!.angular, { x: 0, y: 0, z: 2 }, precision),
  );
}

/**
 * Make one three-link kinematics fixture; authored scale is ignored by native
 * FK.
 */
function rig(
  middle: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
): IAutoMovieSkeleton {
  const entries: readonly [
    AutoMovieHumanoidBone,
    AutoMovieHumanoidBone | null,
    number,
  ][] = [
    ["hips", null, 2],
    ["spine", "hips", 3],
    ["chest", "spine", 5],
  ];
  return {
    id: "analytic-rigid-chain",
    bones: entries.map(
      ([bone, parent, x]: [
        AutoMovieHumanoidBone,
        AutoMovieHumanoidBone | null,
        number,
      ]): IAutoMovieBone => ({
        bone,
        parent,
        rest: {
          translation: { x, y: 0, z: 0 },
          rotation:
            bone === "spine" ? { ...middle } : { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 2, y: 3, z: 4 },
        },
        constraint: null,
      }),
    ),
  };
}

/**
 * Obtain every parent-first frame from the product; this adapter only indexes
 * outputs.
 */
function native(skeleton: IAutoMovieSkeleton, pose: IAutoMoviePose): Bones {
  const bones: Bones = new Map();
  for (const bone of resolvePose(pose, skeleton)) bones.set(bone.bone, bone);
  return bones;
}

/**
 * Every fixed joint receives an explicit body-frame zero; absence remains
 * distinguishable.
 */
function declared(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): LocalRates {
  const rates: LocalRates = new Map();
  for (const bone of bones.keys()) rates.set(bone, { x: 0, y: 0, z: 0 });
  return rates;
}

/**
 * Fail at the analytical boundary rather than dereference an unavailable result
 * later.
 */
function available(rates: Rates | undefined): Rates {
  TestValidator.predicate(
    "declared native FK rates are available",
    rates !== undefined,
  );
  if (rates === undefined) throw new Error("Expected complete native FK rates");
  return rates;
}
