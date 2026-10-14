import {
  IAutoMovieChannel,
  IAutoMovieDrivenDriver,
  type IAutoMovieDriver,
  IAutoMovieNode,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieResolveOutput, IAutoMovieSampledChannel, resolveDrivers, resolveFrame } from "@automovie/engine";



import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

const node: (id: string) => IAutoMovieNode = (id: string): IAutoMovieNode => ({
  id,
  name: null,
  parent: null,
  kind: "mesh",
  transform: {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  mesh: "m",
  camera: null,
  light: null,
  skin: null,
});

const weightsChannel: (id: string) => IAutoMovieChannel = (
  id: string,
): IAutoMovieChannel => ({
  kind: "node",
  node: id,
  path: "weights",
});

const driven: (
  over: Partial<IAutoMovieDrivenDriver>,
) => IAutoMovieDrivenDriver = (
  over: Partial<IAutoMovieDrivenDriver>,
): IAutoMovieDrivenDriver => ({
  type: "driven",
  output: weightsChannel("k"),
  source: { kind: "pointer", pointer: "/in", valueType: "scalar" },
  inRange: [0, 1],
  outRange: [0.6, 1],
  clamp: false,
  ...over,
});

/**
 * A driven scalar may create or replace singleton node weights, which resolveFrame publishes as morph output. Existing multiple weights and TRS channels reject a scalar write rather than losing components.
 *
 * Scenarios:
 *
 * 1. End-to-end: a driven driver writing `node:k:weights` with no sampled weights
 *    creates the scalar channel (exactly as a width-1 clip track would) and
 *    `resolveFrame` folds it into `weights`: the classic corrective-morph
 *    driver works again.
 * 2. A sampled width-1 weights channel is overwritten in place (the driver
 *    replaces the clip's value).
 * 3. Negative twin: sampled three-morph weights refuse the scalar write, naming
 *    the narrowing.
 * 4. Negative twin: a TRS output still rejects with the NaN-poisoning rationale.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs resolveDrivers and resolveFrame, observing scalar weights creation/replacement and refusal of narrowing a three-weight channel or writing one scalar into TRS.
 * @evidence contracts/testing.md#independent-expectations An absent source uses the authored lower input endpoint, which maps to outRange[0]=0.6; a width-one morph channel can carry that scalar while three-component scale cannot.
 * @evidence contracts/testing.md#distinguishing-cases Unsampled and sampled singleton weights are positive neighbors to existing three-weight and scale-output refusals; general curve mapping and dependency ordering belong to their driver tests.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_driver_weights entry directly executes portable value-driving and frame output semantics; it checks numerical morph weights without asserting rendered deformation.
 */
export function test_resolve_driver_weights(): void {
  // 1. unsampled weights: the driver creates the scalar channel and it folds
  const out: IAutoMovieResolveOutput = resolveFrame({
    nodes: [node("k")],
    clip: null,
    limits: [],
    drivers: [driven({})],
    seconds: 0,
  });
  TestValidator.predicate(
    "a driven weights output folds into resolveFrame's weights",
    out.weights.get("k")?.length === 1 &&
      nclose(out.weights.get("k")![0]!, 0.6, 0),
  );

  // 2. sampled width-1 weights are overwritten in place
  const single: Map<string, IAutoMovieSampledChannel> = new Map<
    string,
    IAutoMovieSampledChannel
  >([["node:k:weights", { channel: weightsChannel("k"), value: [0.2] }]]);
  resolveDrivers([driven({})], single, new Map([["k", node("k")]]));
  TestValidator.predicate(
    "a width-1 sampled weights channel takes the driven value",
    single.get("node:k:weights")!.value.length === 1 &&
      nclose(single.get("node:k:weights")!.value[0]!, 0.6, 0),
  );

  // 3. negative twin: multi-morph weights refuse the narrowing write
  const multi: Map<string, IAutoMovieSampledChannel> = new Map<
    string,
    IAutoMovieSampledChannel
  >([
    ["node:k:weights", { channel: weightsChannel("k"), value: [0.2, 0.5, 1] }],
  ]);
  TestValidator.predicate(
    "multi-morph sampled weights refuse a scalar driven write",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers([driven({})], multi, new Map([["k", node("k")]])),
      ["node:k:weights", "3 morph targets", "narrow"],
    ),
  );

  // 4. negative twin: TRS outputs keep the NaN-poisoning ban
  TestValidator.predicate(
    "a TRS output still rejects as non-scalar",
    throwsError(
      (): IAutoMovieDriver[] =>
        resolveDrivers(
          [driven({ output: { kind: "node", node: "k", path: "scale" } })],
          new Map(),
          new Map([["k", node("k")]]),
        ),
      ["driven driver output", "scalar", "scale", "NaN-poison"],
    ),
  );
}
