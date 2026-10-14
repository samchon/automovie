import {
  IAutoMovieChannel,
  IAutoMovieClip,
  IAutoMovieNode,
  IAutoMovieProfile,
  IAutoMovieProfileBinding,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieResolveOutput } from "@automovie/engine";
import { resolveFrame } from "@automovie/engine";
import { nclose } from "../internal/nclose";

const IDENTITY: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

const node: (id: string) => IAutoMovieNode = (id: string): IAutoMovieNode => ({
  id,
  name: null,
  parent: null,
  kind: "group",
  transform: IDENTITY,
  mesh: null,
  camera: null,
  light: null,
  skin: null,
});

const translation: (id: string) => IAutoMovieChannel = (
  id: string,
): IAutoMovieChannel => ({
  kind: "node",
  node: id,
  path: "translation",
});

const clipTo: (x: number) => IAutoMovieClip = (x: number): IAutoMovieClip => ({
  id: "clip",
  name: null,
  duration: 1,
  loop: false,
  tracks: [
    {
      channel: translation("slider"),
      times: [0],
      values: [x, 0, 0],
      interpolation: "linear",
    },
  ],
});

const PROFILE: IAutoMovieProfile = {
  id: "slider-profile",
  name: "slider",
  drivers: [],
  limits: [
    {
      channel: translation("knob"),
      min: [0, null, null],
      max: [50, null, null],
    },
  ],
};

const BINDING: IAutoMovieProfileBinding = {
  profile: "slider-profile",
  boneMap: { knob: "slider" },
};

const tx: (m: number[]) => number = (m: number[]): number => m[12]!;

/**
 * Bound profile limits clamp sampled channels and report their profile ids; directly supplied limits apply afterward.
 *
 * Scenarios:
 *
 * 1. An overshooting sample (x=100) against the profile's bound limit ([0, 50])
 *    clamps to 50 in the composed world matrix, reporting exactly one violation
 *    tagged `profile: "slider-profile"`.
 * 2. An in-range sample (x=25) passes: no violations, world untouched by the clamp
 *    (the negative twin).
 * 3. A direct limit ([0, 30]) alongside the profile's ([0, 50]) on the same
 *    channel: the value clamps through both (profile first, direct last) to 30,
 *    with two violations in order: the profile-tagged one, then the direct one
 *    carrying no profile tag.
 * 4. Empty and omitted profiles yield the same empty diagnostics and world x
 *    within the existing numerical predicate; full serialized bytes are not checked.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs resolveFrame with semantic profile limits and caller limits, observing concrete world clamps and profile-tagged diagnostics, then compares the empty-profile neighbor with direct resolution.
 * @evidence contracts/testing.md#independent-expectations Authored intervals project the sampled translations onto their bounds and direct limits apply afterward; literal semantic/concrete ids determine diagnostic provenance. Empty-profile parity compares two product paths rather than supplying an independent numerical oracle.
 * @evidence contracts/testing.md#distinguishing-cases Mapped over-limit/in-range targets, direct-after-profile clamps and empty versus omitted profiles distinguish binding/order from unconditional changes; node-prefix and malformed binding admission belong to other tests.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_frame_profile_limits entry directly executes portable synchronous frame resolution, comparing numerical values with predicates rather than claiming physical pixels.
 */
export function test_resolve_frame_profile_limits(): void {
  const clamped: IAutoMovieResolveOutput = resolveFrame({
    nodes: [node("slider")],
    clip: clipTo(100),
    limits: [],
    profiles: [{ profile: PROFILE, binding: BINDING }],
    seconds: 0,
  });
  TestValidator.equals("one violation", clamped.violations.length, 1);
  TestValidator.equals(
    "violation tagged with profile id",
    clamped.violations[0]!.profile,
    "slider-profile",
  );
  TestValidator.predicate(
    "world clamped to the profile bound",
    nclose(tx(clamped.world.get("slider")!), 50),
  );

  const inRange: IAutoMovieResolveOutput = resolveFrame({
    nodes: [node("slider")],
    clip: clipTo(25),
    limits: [],
    profiles: [{ profile: PROFILE, binding: BINDING }],
    seconds: 0,
  });
  TestValidator.equals("in-range sample passes", inRange.violations.length, 0);
  TestValidator.predicate(
    "in-range world unclamped",
    nclose(tx(inRange.world.get("slider")!), 25),
  );

  const layered: IAutoMovieResolveOutput = resolveFrame({
    nodes: [node("slider")],
    clip: clipTo(100),
    limits: [
      {
        channel: translation("slider"),
        min: [0, null, null],
        max: [30, null, null],
      },
    ],
    profiles: [{ profile: PROFILE, binding: BINDING }],
    seconds: 0,
  });
  TestValidator.equals("both limits fire", layered.violations.length, 2);
  TestValidator.equals(
    "profile-bound limit fires first",
    layered.violations[0]!.profile,
    "slider-profile",
  );
  TestValidator.equals(
    "direct limit carries no profile tag",
    layered.violations[1]!.profile,
    undefined,
  );
  TestValidator.predicate(
    "direct limit clamps last (final bound 30)",
    nclose(tx(layered.world.get("slider")!), 30),
  );

  const explicit: IAutoMovieResolveOutput = resolveFrame({
    nodes: [node("slider")],
    clip: clipTo(100),
    limits: [],
    profiles: [],
    seconds: 0,
  });
  const omitted: IAutoMovieResolveOutput = resolveFrame({
    nodes: [node("slider")],
    clip: clipTo(100),
    limits: [],
    seconds: 0,
  });
  TestValidator.equals(
    "empty profiles === omitted (violations)",
    [explicit.violations.length, omitted.violations.length],
    [0, 0],
  );
  TestValidator.predicate(
    "empty profiles === omitted (world)",
    nclose(tx(explicit.world.get("slider")!), tx(omitted.world.get("slider")!)),
  );
}
