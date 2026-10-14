import { resolveFrame } from "../../../../packages/engine/src/resolve/resolveFrame";
import { IAutoMovieChannel, IAutoMovieChannelLimit, IAutoMovieClip, IAutoMovieDrivenDriver, IAutoMovieNode, IAutoMovieTrack, IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { type IAutoMovieResolveOutput } from "../../../../packages/engine/src/resolve/IAutoMovieResolveOutput";

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

const nodeChannel: (id: string, path: "translation" | "rotation" | "scale" | "weights") => IAutoMovieChannel = (
  id: string,
  path: "translation" | "rotation" | "scale" | "weights",
): IAutoMovieChannel => ({ kind: "node", node: id, path });

const track: (channel: IAutoMovieChannel, times: number[], values: number[]) => IAutoMovieTrack = (
  channel: IAutoMovieChannel,
  times: number[],
  values: number[],
): IAutoMovieTrack => ({ channel, times, values, interpolation: "linear" });

const tx: (m: number[]) => number = (m: number[]): number => m[12]!;

/**
 * Resolve a frame through sampling, constraints and composition, including morph weights and a null-clip rest pose.
 *
 * Five nodes exercise translation/rotation, rotation-only, scale-only, morph and static paths. Assertions check world X translation, one scale coefficient and morph values; they do not establish every world coefficient or channel combination.
 *
 * Scenarios:
 *
 * 1. A null clip keeps the translation+rotation node's world x at rest, and no
 *    weights or violations are produced.
 * 2. With the clip, the translation+rotation node animates (translation and
 *    rotation channels present, scale absent → kept from rest), the scale node
 *    animates scale only, and rotation-only/static nodes keep their world x at
 *    rest. Full rotation and rest-scale preservation are not checked here.
 * 3. A channel limit on the translation channel clamps the sampled overshoot
 *    (x=100 → 50) and reports exactly one violation tagged with that channel;
 *    the clamped value flows through to the composed world matrix.
 * 4. A limit on a channel the clip does not animate is skipped (no sample to
 *    clamp), producing no violation.
 * 5. The morph-weights channel populates the weights map for that node only; the
 *    static and TRS nodes never appear in it.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs resolveFrame and observes clamped world translation, scale/rest fallback, morph output and original overshoot diagnostics; missing sampled nodes and non-scalar driven outputs must reject.
 * @evidence contracts/testing.md#independent-expectations Authored endpoint x=100 exceeds max50, so projection yields world x=50 while reporting actual100; the scale and singleton-weight endpoints are literal input values, independent of resolver output.
 * @evidence contracts/testing.md#distinguishing-cases Null/animated clips, sampled/unsampled limits, present/absent TRS and morph channels, a missing node and scalar-pointer/non-scalar-node outputs cover this frame-folding boundary; driver dependency and spring histories are tested separately.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_frame entry directly executes portable synchronous sample/constrain/compose semantics and observes output maps, without a renderer, native asset or foreign replacement.
 */
export function test_resolve_frame(): void {
  const nodes: IAutoMovieNode[] = [
    node("trs"),
    node("rot"),
    node("scl"),
    node("morph"),
    node("static"),
  ];
  const clip: IAutoMovieClip = {
    id: "c",
    name: null,
    duration: 1,
    loop: false,
    tracks: [
      track(nodeChannel("trs", "translation"), [0, 1], [0, 0, 0, 100, 0, 0]),
      track(nodeChannel("trs", "rotation"), [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
      track(nodeChannel("rot", "rotation"), [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
      track(nodeChannel("scl", "scale"), [0, 1], [1, 1, 1, 2, 2, 2]),
      track(nodeChannel("morph", "weights"), [0, 1], [0, 1]),
    ],
  };
  const limits: IAutoMovieChannelLimit[] = [
    {
      channel: nodeChannel("trs", "translation"),
      min: null,
      max: [50, null, null],
    },
    // a limit on a channel the clip never animates → skipped
    {
      channel: nodeChannel("ghost", "translation"),
      min: [0, 0, 0],
      max: null,
    },
  ];

  // 1. null clip → rest pose
  const rest: IAutoMovieResolveOutput = resolveFrame({ nodes, clip: null, limits, seconds: 1 });
  TestValidator.predicate(
    "null clip leaves node at rest",
    nclose(tx(rest.world.get("trs")!), 0),
  );
  TestValidator.equals("null clip: no weights", rest.weights.size, 0);
  TestValidator.equals("null clip: no violations", rest.violations.length, 0);

  // 2-5. resolve the animated frame
  const out: IAutoMovieResolveOutput = resolveFrame({ nodes, clip, limits, seconds: 1 });

  // 3. translation clamped to 50 and surfaced as one violation
  TestValidator.predicate(
    "translation clamped into the world matrix",
    nclose(tx(out.world.get("trs")!), 50),
  );
  TestValidator.equals(
    "one violation, tagged with the channel",
    out.violations.map((entry: typeof out.violations[number]): { channel: string; component: number; bound: "min" | "max" } => ({ channel: entry.channel, component: entry.component, bound: entry.bound })),
    [
      {
        channel: "node:trs:translation",
        component: 0,
        bound: "max",
      },
    ],
  );
  TestValidator.predicate("violation preserves limit and original overshoot", nclose(out.violations[0]!.limit, 50, 0) && nclose(out.violations[0]!.actual, 100, 0));
  TestValidator.equals("violation has only the expected output fields", Object.keys(out.violations[0]!).sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0), ["actual", "bound", "channel", "component", "limit"]);

  // 2. scale-only node animates scale, keeps rest translation/rotation
  TestValidator.predicate(
    "scale node scaled to 2 on the diagonal",
    nclose(out.world.get("scl")![0]!, 2),
  );
  // rotation-only node animates rotation, keeps rest translation
  TestValidator.predicate(
    "rotation-only node keeps rest translation",
    nclose(tx(out.world.get("rot")!), 0),
  );
  // static node keeps rest transform
  TestValidator.predicate(
    "static node stays at rest",
    nclose(tx(out.world.get("static")!), 0),
  );

  // 5. weights map carries the morph node only
  TestValidator.predicate("morph weights captured", out.weights.get("morph")?.length === 1 && nclose(out.weights.get("morph")![0]!, 1, 0));
  TestValidator.equals(
    "trs node not in weights",
    out.weights.has("trs"),
    false,
  );
  TestValidator.equals(
    "static node not in weights",
    out.weights.has("static"),
    false,
  );

  const ghostClip: IAutoMovieClip = {
    ...clip,
    tracks: [
      track(nodeChannel("ghost", "translation"), [0, 1], [0, 0, 0, 1, 0, 0]),
    ],
  };
  TestValidator.predicate(
    "clip channel rejects missing resolve node",
    throwsError(
      (): IAutoMovieResolveOutput  => resolveFrame({ nodes, clip: ghostClip, limits: [], seconds: 0 }),
      ['sampled channel "node:ghost:translation"', 'missing node "ghost"'],
    ),
  );

  // a driven output onto a node channel rejects as NON-SCALAR before the
  // missing-node check can even see it (#1055): the ghost-node validator
  // keeps its own pin through the clip-track path above
  const ghostOutput: IAutoMovieDrivenDriver = {
    type: "driven",
    source: { kind: "pointer", pointer: "/input", valueType: "scalar" },
    output: nodeChannel("ghost", "translation"),
    inRange: [0, 1],
    outRange: [0, 1],
    clamp: false,
  };
  TestValidator.predicate(
    "driver output rejects a node channel as non-scalar",
    throwsError(
      (): IAutoMovieResolveOutput  =>
        resolveFrame({
          nodes,
          clip: null,
          limits: [],
          drivers: [ghostOutput],
          seconds: 0,
        }),
      ["driven driver output", "scalar", 'node "ghost"'],
    ),
  );

  const pointerOutput: IAutoMovieDrivenDriver = {
    ...ghostOutput,
    output: { kind: "pointer", pointer: "/scratch", valueType: "scalar" },
  };
  const pointerOut: IAutoMovieResolveOutput = resolveFrame({
    nodes,
    clip: null,
    limits: [],
    drivers: [pointerOutput],
    seconds: 0,
  });
  TestValidator.equals(
    "pointer driver output does not require a scene node",
    pointerOut.violations.length,
    0,
  );
}
