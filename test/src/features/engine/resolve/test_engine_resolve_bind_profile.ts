import { AutoMovieEngineResolve } from "@automovie/engine";
import type {
  IAutoMovieBoundProfile,
  IAutoMovieProfile,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/** A profile on the generic nodes a and b: a limit on a, a copy a <- b. */
const PROFILE: IAutoMovieProfile = {
  id: "generic",
  name: "generic",
  limits: [
    {
      channel: { kind: "node", node: "a", path: "rotation" },
      min: null,
      max: null,
    },
    {
      channel: { kind: "pointer", pointer: "/x", valueType: "scalar" },
      min: null,
      max: null,
    },
  ],
  drivers: [
    {
      type: "copy",
      owner: "a",
      source: "b",
      translation: true,
      rotation: false,
      scale: false,
      influence: 1,
    },
  ],
};

/**
 * `bindProfile` renames a profile's generic node keys to a rig's nodes, with an
 * optional prefix, leaving pointer channels as they are.
 *
 * Scenarios:
 *
 * 1. With the bone map {a: "x", b: "y"} and prefix "p/", the limit on a is on
 *    "p/x", the pointer limit is unchanged, and the copy runs from "p/y" to
 *    "p/x".
 * 2. A binding of another profile, and a key the bone map lacks, are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the prefixed bone mapping, unchanged pointer limit, and refusals for a wrong profile or missing bone key.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `bindProfile` with a typed profile containing one node limit, one pointer limit, and one copy driver. It compares the resulting channel descriptors and owner/source pair. Each malformed binding checks its error message.
 * @evidence contracts/development/testing.md#independent-expectations The map sends a to x and b to y. Prefix p/ makes p/x the rotation limit and copy owner, and p/y the copy source. The /x pointer remains literal.
 */
export function test_engine_resolve_bind_profile(): void {
  const bound: IAutoMovieBoundProfile = AutoMovieEngineResolve.bindProfile({
    profile: PROFILE,
    binding: { profile: "generic", boneMap: { a: "x", b: "y" } },
    nodePrefix: "p/",
  });
  TestValidator.equals(
    "the limits",
    bound.limits.map((limit: { channel: unknown }): unknown => limit.channel),
    [
      { kind: "node", node: "p/x", path: "rotation" },
      { kind: "pointer", pointer: "/x", valueType: "scalar" },
    ],
  );
  TestValidator.equals(
    "the copy",
    bound.drivers.map(
      (driver: IAutoMovieBoundProfile["drivers"][number]): unknown =>
        driver.type === "copy" ? [driver.owner, driver.source] : null,
    ),
    [["p/x", "p/y"]],
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      (): unknown =>
        AutoMovieEngineResolve.bindProfile({
          profile: PROFILE,
          binding: { profile: "other", boneMap: { a: "x", b: "y" } },
        }),
      "binding targets profile",
    ) &&
      throwsError(
        (): unknown =>
          AutoMovieEngineResolve.bindProfile({
            profile: PROFILE,
            binding: { profile: "generic", boneMap: { a: "x" } },
          }),
        'no boneMap entry for "b"',
      ),
  );
}
