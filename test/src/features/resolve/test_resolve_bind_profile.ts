import { bindProfile } from "@automovie/engine";
import {
  IAutoMovieAimDriver,
  IAutoMovieChannel,
  IAutoMovieCopyDriver,
  IAutoMovieDrivenDriver,
  IAutoMovieDriver,
  IAutoMovieIKDriver,
  IAutoMovieParentDriver,
  IAutoMovieProfile,
  IAutoMovieProfileBinding,
  IAutoMovieSpringDriver,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import type { IAutoMovieBoundProfile } from "./../../../../packages/engine/src/resolve/IAutoMovieBoundProfile";

const nodeChannel: (id: string) => IAutoMovieChannel = (
  id: string,
): IAutoMovieChannel => ({
  kind: "node",
  node: id,
  path: "rotation",
});

const POINTER: IAutoMovieChannel = {
  kind: "pointer",
  pointer: "/cameras/0/fovY",
  valueType: "scalar",
};

const DRIVERS: IAutoMovieDriver[] = [
  {
    type: "copy",
    owner: "a",
    source: "b",
    translation: true,
    rotation: true,
    scale: false,
    influence: 1,
  },
  {
    type: "aim",
    owner: "a",
    target: "b",
    aimAxis: { x: 1, y: 0, z: 0 },
    upAxis: { x: 0, y: 1, z: 0 },
    worldUp: { x: 0, y: 1, z: 0 },
    influence: 1,
  },
  {
    type: "ik",
    chain: ["a", "b", "c"],
    goal: "g",
    pole: { node: "p", angle: 15 },
    solver: "twoBone",
    iterations: null,
    influence: 1,
  },
  {
    type: "ik",
    chain: ["a", "b", "c"],
    goal: "g",
    pole: { node: null, angle: 0 },
    solver: "ccd",
    iterations: 5,
    influence: 1,
  },
  {
    type: "ik",
    chain: ["a", "b"],
    goal: "g",
    pole: null,
    solver: "fabrik",
    iterations: 5,
    influence: 1,
  },
  {
    type: "parent",
    owner: "a",
    parent: "b",
    translation: true,
    rotation: true,
    scale: true,
  },
  {
    type: "driven",
    output: nodeChannel("a"),
    source: POINTER,
    inRange: [0, 1],
    outRange: [0, 2],
    clamp: true,
  },
  {
    type: "spring",
    chain: ["a", "b"],
    stiffness: 1,
    drag: 0.4,
    gravityPower: 0,
    gravityDir: { x: 0, y: -1, z: 0 },
    hitRadius: 0.02,
    center: "c",
  },
  {
    type: "spring",
    chain: ["a"],
    stiffness: 1,
    drag: 0.4,
    gravityPower: 0,
    gravityDir: { x: 0, y: -1, z: 0 },
    hitRadius: 0.02,
    center: null,
  },
];

const makeProfile: (drivers: IAutoMovieDriver[]) => IAutoMovieProfile = (
  drivers: IAutoMovieDriver[],
): IAutoMovieProfile => ({
  id: "rig",
  name: "rig",
  drivers,
  limits: [
    { channel: nodeChannel("a"), min: [0, 0, 0, 0], max: [1, 1, 1, 1] },
    { channel: POINTER, min: [10], max: [90] },
  ],
});

const MAP: Record<string, string> = {
  a: "A",
  b: "B",
  c: "C",
  g: "G",
  p: "P",
};

const makeBinding: (
  boneMap: Record<string, string>,
) => IAutoMovieProfileBinding = (
  boneMap: Record<string, string>,
): IAutoMovieProfileBinding => ({
  profile: "rig",
  boneMap,
});

/**
 * `bindProfile` resolves every semantic node reference a profile's limits and
 * drivers carry through the binding's boneMap (then the placement prefix),
 * refusing silent drops: an unmapped or empty mapping throws instead of quietly
 * un-constraining the rig.
 *
 * Scenarios:
 *
 * 1. Every driver type's node fields remap through boneMap + `"actor/"` prefix:
 *    copy owner/source, aim owner/target, ik chain/goal/pole.node (with a
 *    null-pole-node and a null-pole twin left untouched), parent owner/parent,
 *    spring chain/center (with a null-center twin), and a driven's node-channel
 *    output, while its pointer-channel source passes through unchanged.
 * 2. Limits remap the node channel and leave the pointer-channel limit untouched;
 *    with no prefix the mapped ids are the bare boneMap values.
 * 3. A semantic key missing from boneMap throws naming the profile and key.
 * 4. A key mapped to an empty id throws.
 * 5. A binding whose `profile` id does not match the applied profile throws.
 * 6. An unknown driver discriminator throws.
 * 7. Prototype spellings require explicit own mappings; declared own constructor and __proto__ names bind normally.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual bindProfile across all supported driver/channel arms, prefix and refusal paths; inherited prototype names must take the missing-key diagnostic while declared own names remain valid bindings.
 * @evidence contracts/testing.md#independent-expectations The authored a/b/c/g/p map defines exact A/B/C/G/P ids after actor/ prefix. Object.fromEntries supplies constructor/__proto__ as own string entries, whereas an empty ordinary record declares neither despite its prototype properties.
 * @evidence contracts/testing.md#distinguishing-cases Covers every remapped driver reference, pointer pass-through, null pole/center, bare/prefixed ids, absent/blank mapping, profile mismatch and unknown discriminator, plus own versus inherited reserved property spellings. Frame composition of bound profiles belongs to the profile frame suites.
 * @evidence contracts/testing.md#execution-ownership The exported test_resolve_bind_profile owns synchronous portable data-binding cases and starts no consumer, Human scene or renderer; all assertions observe the real returned limits/drivers or thrown diagnostics.
 */
export function test_resolve_bind_profile(): void {
  const bound: IAutoMovieBoundProfile = bindProfile({
    profile: makeProfile(DRIVERS),
    binding: makeBinding(MAP),
    nodePrefix: "actor/",
  });

  const [
    copy,
    aim,
    ikPole,
    ikNullNode,
    ikNullPole,
    parent,
    driven,
    spring,
    springNull,
  ]: [
    IAutoMovieCopyDriver,
    IAutoMovieAimDriver,
    IAutoMovieIKDriver,
    IAutoMovieIKDriver,
    IAutoMovieIKDriver,
    IAutoMovieParentDriver,
    IAutoMovieDrivenDriver,
    IAutoMovieSpringDriver,
    IAutoMovieSpringDriver,
  ] = bound.drivers as [
    Extract<IAutoMovieDriver, { type: "copy" }>,
    Extract<IAutoMovieDriver, { type: "aim" }>,
    Extract<IAutoMovieDriver, { type: "ik" }>,
    Extract<IAutoMovieDriver, { type: "ik" }>,
    Extract<IAutoMovieDriver, { type: "ik" }>,
    Extract<IAutoMovieDriver, { type: "parent" }>,
    Extract<IAutoMovieDriver, { type: "driven" }>,
    Extract<IAutoMovieDriver, { type: "spring" }>,
    Extract<IAutoMovieDriver, { type: "spring" }>,
  ];
  TestValidator.equals(
    "copy remaps",
    [copy.owner, copy.source],
    ["actor/A", "actor/B"],
  );
  TestValidator.equals(
    "aim remaps",
    [aim.owner, aim.target],
    ["actor/A", "actor/B"],
  );
  TestValidator.equals(
    "ik chain+goal remap",
    [...ikPole.chain, ikPole.goal],
    ["actor/A", "actor/B", "actor/C", "actor/G"],
  );
  TestValidator.equals("ik pole node remaps", ikPole.pole?.node, "actor/P");
  TestValidator.equals("null pole node kept", ikNullNode.pole?.node, null);
  TestValidator.equals("null pole kept", ikNullPole.pole, null);
  TestValidator.equals(
    "parent remaps",
    [parent.owner, parent.parent],
    ["actor/A", "actor/B"],
  );
  TestValidator.equals(
    "driven node-channel output remaps",
    driven.output.kind === "node" ? driven.output.node : null,
    "actor/A",
  );
  TestValidator.equals(
    "driven pointer source untouched",
    driven.source,
    POINTER,
  );
  TestValidator.equals(
    "spring chain+center remap",
    [...spring.chain, spring.center],
    ["actor/A", "actor/B", "actor/C"],
  );
  TestValidator.equals("null spring center kept", springNull.center, null);

  TestValidator.equals(
    "node-channel limit remaps",
    bound.limits[0]!.channel.kind === "node"
      ? bound.limits[0]!.channel.node
      : null,
    "actor/A",
  );
  TestValidator.equals(
    "pointer limit untouched",
    bound.limits[1]!.channel,
    POINTER,
  );

  const bare: IAutoMovieBoundProfile = bindProfile({
    profile: makeProfile([]),
    binding: makeBinding(MAP),
  });
  for (const key of ["constructor", "__proto__", "toString"]) {
    const profile: IAutoMovieProfile = {
      ...makeProfile([]),
      limits: [{ channel: nodeChannel(key), min: null, max: null }],
    };
    TestValidator.predicate(
      "inherited property is not an authored profile mapping",
      throwsError(
        (): IAutoMovieBoundProfile =>
          bindProfile({ profile, binding: makeBinding({}) }),
        `has no boneMap entry for "${key}"`,
      ),
    );
    const own: ReturnType<typeof bindProfile> = bindProfile({
      profile,
      binding: makeBinding(Object.fromEntries([[key, "joint"]])),
      nodePrefix: "actor/",
    });
    TestValidator.equals(
      "own reserved spelling binds exactly",
      own.limits[0]!.channel.kind === "node"
        ? own.limits[0]!.channel.node
        : null,
      "actor/joint",
    );
  }
  TestValidator.equals(
    "no prefix uses bare boneMap value",
    bare.limits[0]!.channel.kind === "node"
      ? bare.limits[0]!.channel.node
      : null,
    "A",
  );

  TestValidator.predicate(
    "unmapped key throws",
    throwsError(
      (): IAutoMovieBoundProfile =>
        bindProfile({
          profile: makeProfile([]),
          binding: makeBinding({}),
        }),
      ["rig", "a"],
    ),
  );
  TestValidator.predicate(
    "empty mapped id throws",
    throwsError(
      (): IAutoMovieBoundProfile =>
        bindProfile({
          profile: makeProfile([]),
          binding: makeBinding({ ...MAP, a: "  " }),
        }),
      "empty node id",
    ),
  );
  TestValidator.predicate(
    "binding/profile id mismatch throws",
    throwsError(
      (): IAutoMovieBoundProfile =>
        bindProfile({
          profile: makeProfile([]),
          binding: { ...makeBinding(MAP), profile: "other" },
        }),
      ["other", "rig"],
    ),
  );
  TestValidator.predicate(
    "unknown driver type throws",
    throwsError(
      (): IAutoMovieBoundProfile =>
        bindProfile({
          profile: makeProfile([
            { type: "warp" } as unknown as IAutoMovieDriver,
          ]),
          binding: makeBinding(MAP),
        }),
      'unknown driver type "warp"',
    ),
  );
}
