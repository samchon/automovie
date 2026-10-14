import {
  IAutoMovieChannel,
  IAutoMovieCopyDriver,
  IAutoMovieDrivenDriver,
  IAutoMovieDriver,
  IAutoMovieNode,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { IAutoMovieSampledChannel } from "./IAutoMovieSampledChannel";
import { channelKey } from "./channelKey";
import { evaluateDrivenCurve } from "./evaluateDrivenCurve";
import { orderValueDrivers } from "./orderValueDrivers";

/** The two channel-space drivers this pass resolves (no world transform needed). */
type ValueDriver = IAutoMovieCopyDriver | IAutoMovieDrivenDriver;

const VALUE_DRIVER_TYPES: Set<unknown> = new Set<unknown>(["copy", "driven"]);
const DEFERRED_DRIVER_TYPES: Set<unknown> = new Set<unknown>([
  "aim",
  "ik",
  "parent",
  "spring",
]);

/**
 * Evaluate copy and driven channels in stable dependency order, mutating samples before constraints. Return world/stateful descriptors in original order. Unknown kinds and reciprocal dependencies throw; a null/absent curve selects linear range mapping.
 *
 * @evidence contracts/common.md#principled-implementation Partition supported value/world drivers, dependency-order copy/driven operations through orderValueDrivers, update sampled channels and return world/stateful descriptors in original order.
 * @evidence contracts/common.md#clear-and-simple-design Indexed ordering is separate from copy/remap/curve arithmetic and subsequent constraint/world phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown kinds/cycles throw and self-input retains one-step policy; nullable curves select linear mode, while extreme remap overflow remains unproven.
 * @evidence contracts/common.md#meaningful-documentation Docs identify sampled-map mutation, rest fallback, loud refusal and explicit world-driver deferral.
 * @evidence contracts/performance.md#efficient-algorithms D drivers and E dependencies determine graph work, with per-curve O(P) validation/interpolation and output-vector storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One producer index/DFS shares dependency completion and later consumers read completed producer samples, without persistent mutable-graph caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns changed samples/deferred references; graph arrays release with the call and no handle or task survives.
 */
export const resolveDrivers: (
  drivers: IAutoMovieDriver[],
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
) => IAutoMovieDriver[] = (
  drivers: IAutoMovieDriver[],
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
): IAutoMovieDriver[] => {
  const value: ValueDriver[] = [];
  const deferred: IAutoMovieDriver[] = [];
  for (const d of drivers) {
    const type: unknown = (d as { type?: unknown }).type;
    if (VALUE_DRIVER_TYPES.has(type)) value.push(d as ValueDriver);
    else if (DEFERRED_DRIVER_TYPES.has(type)) deferred.push(d);
    else throw new Error(`unknown driver type "${String(type)}"`);
  }

  for (const d of orderValueDrivers(value))
    if (d.type === "copy") applyCopy(d, sampled, nodesById);
    else applyDriven(d, sampled);

  return deferred;
};

// copy

const applyCopy: (
  d: IAutoMovieCopyDriver,
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
) => void = (
  d: IAutoMovieCopyDriver,
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
): void => {
  validateCopyFlag(d.translation, "translation");
  validateCopyFlag(d.rotation, "rotation");
  validateCopyFlag(d.scale, "scale");
  validateCopyInfluence(d.influence);
  if (d.translation) writeBlend(d, "translation", false, sampled, nodesById);
  if (d.rotation) writeBlend(d, "rotation", true, sampled, nodesById);
  if (d.scale) writeBlend(d, "scale", false, sampled, nodesById);
};

const validateCopyFlag: (
  value: boolean,
  label: "translation" | "rotation" | "scale",
) => void = (
  value: boolean,
  label: "translation" | "rotation" | "scale",
): void => {
  if (typeof value !== "boolean")
    throw new Error(
      `copy driver ${label} flag must be boolean, but was ${value}`,
    );
};

const validateCopyInfluence: (influence: number) => void = (
  influence: number,
): void => {
  if (!Number.isFinite(influence))
    throw new Error(
      `copy driver influence must be finite, but was ${influence}`,
    );
  if (influence < 0)
    throw new Error(
      `copy driver influence must be between 0 and 1, but was ${influence}`,
    );
  if (influence > 1)
    throw new Error(
      `copy driver influence must be between 0 and 1, but was ${influence}`,
    );
};

const writeBlend: (
  d: IAutoMovieCopyDriver,
  path: "translation" | "rotation" | "scale",
  isRotation: boolean,
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
) => void = (
  d: IAutoMovieCopyDriver,
  path: "translation" | "rotation" | "scale",
  isRotation: boolean,
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
): void => {
  const owner: number[] = readTRS(d.owner, "owner", path, sampled, nodesById);
  const source: number[] = readTRS(
    d.source,
    "source",
    path,
    sampled,
    nodesById,
  );
  const result: number[] = isRotation
    ? slerpArray(owner, source, d.influence)
    : lerpArray(owner, source, d.influence);
  setChannel(
    sampled,
    `node:${d.owner}:${path}`,
    { kind: "node", node: d.owner, path },
    result,
  );
};

/** Current value of a node TRS channel: the sampled override, else rest pose. */
const readTRS: (
  node: string,
  role: "owner" | "source",
  path: "translation" | "rotation" | "scale",
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
) => number[] = (
  node: string,
  role: "owner" | "source",
  path: "translation" | "rotation" | "scale",
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
): number[] => {
  const nodeDef: IAutoMovieNode | undefined = nodesById.get(node);
  if (nodeDef === undefined)
    throw new Error(`copy driver ${role} node "${node}" was not provided`);
  const hit: IAutoMovieSampledChannel | undefined = sampled.get(
    `node:${node}:${path}`,
  );
  if (hit !== undefined) {
    validateCopySampledValue(role, path, hit.value);
    return hit.value;
  }
  const t: IAutoMovieTransform = nodeDef.transform;
  if (path === "translation")
    return [t.translation.x, t.translation.y, t.translation.z];
  if (path === "rotation")
    return [t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w];
  return [t.scale.x, t.scale.y, t.scale.z];
};

const validateCopySampledValue: (
  role: "owner" | "source",
  path: "translation" | "rotation" | "scale",
  value: number[],
) => void = (
  role: "owner" | "source",
  path: "translation" | "rotation" | "scale",
  value: number[],
): void => {
  const expected: 3 | 4 = COPY_SAMPLE_WIDTHS[path];
  if (!Array.isArray(value))
    throw new Error(`copy driver ${role} ${path} value must be an array`);
  if (value.length !== expected)
    throw new Error(
      `copy driver ${role} ${path} value must contain exactly ${expected} entries, but had ${value.length}`,
    );
};

const COPY_SAMPLE_WIDTHS: {
  readonly translation: 3;
  readonly rotation: 4;
  readonly scale: 3;
} = {
  translation: 3,
  rotation: 4,
  scale: 3,
} as const;

// driven

const applyDriven: (
  d: IAutoMovieDrivenDriver,
  sampled: Map<string, IAutoMovieSampledChannel>,
) => void = (
  d: IAutoMovieDrivenDriver,
  sampled: Map<string, IAutoMovieSampledChannel>,
): void => {
  validateDrivenOutputChannel(d.output, sampled);
  const src: IAutoMovieSampledChannel | undefined = sampled.get(
    channelKey(d.source),
  );
  const source: number | undefined =
    src !== undefined ? readDrivenSourceValue(src.value) : undefined;
  if (source !== undefined) validateDrivenFinite("source value", source);
  const y: number =
    d.curve !== null && d.curve !== undefined
      ? evaluateDrivenCurve(source, d.curve)
      : remapDriven(d, source);
  setChannel(sampled, channelKey(d.output), d.output, [y]);
};

/**
 * A driven driver computes ONE scalar (the interface contract: "one scalar
 * channel computed from another"), so its output must be a scalar-width
 * channel. Node TRS channels are rejected outright: composing `[y]` into world
 * matrices downstream is silent NaN poisoning with no violation (#1055). Node
 * `weights` is variable-width, so it is judged by the width actually in play
 * (#1100): an already-sampled multi-morph array must not be narrowed to `[y]`,
 * while a width-1 array (or an unsampled channel, where the driver CREATES the
 * scalar weights exactly as a width-1 clip track would) is the classic
 * single-morph corrective driver and folds into `resolveFrame`'s weights. (A
 * scalar JSON pointer is NOT a remedy for in-engine consumers: pointer channels
 * never fold into node outputs.) Mirrors the width gate `readDrivenSourceValue`
 * applies to the source.
 */
const validateDrivenOutputChannel: (
  output: IAutoMovieChannel,
  sampled: Map<string, IAutoMovieSampledChannel>,
) => void = (
  output: IAutoMovieChannel,
  sampled: Map<string, IAutoMovieSampledChannel>,
): void => {
  if (output.kind === "node") {
    if (output.path !== "weights")
      throw new Error(
        `driven driver output must be a scalar channel, but addressed node "${output.node}" ${output.path}; a width-1 write into a TRS channel would NaN-poison the composed world matrices`,
      );
    const existing: IAutoMovieSampledChannel | undefined = sampled.get(
      channelKey(output),
    );
    if (existing !== undefined && existing.value.length !== 1)
      throw new Error(
        `driven driver output "node:${output.node}:weights" must stay scalar-width, but the sampled weights carry ${existing.value.length} morph targets: a scalar write would silently narrow them`,
      );
    return;
  }
  if (output.valueType !== "scalar")
    throw new Error(
      `driven driver output must be a scalar channel, but pointer "${output.pointer}" has valueType "${output.valueType}"`,
    );
};

const readDrivenSourceValue: (value: number[]) => number = (
  value: number[],
): number => {
  validateDrivenSourceValue(value);
  return value[0]!;
};

const validateDrivenSourceValue: (value: number[]) => void = (
  value: number[],
): void => {
  if (!Array.isArray(value))
    throw new Error("driven driver source value must be an array");
  if (value.length !== 1)
    throw new Error(
      `driven driver source value must contain exactly 1 entry, but had ${value.length}`,
    );
};

const validateDrivenClamp: (clamp: boolean) => void = (
  clamp: boolean,
): void => {
  if (typeof clamp !== "boolean")
    throw new Error(`driven driver clamp must be boolean, but was ${clamp}`);
};

const validateDrivenRange: (
  inRange: [number, number],
  outRange: [number, number],
) => void = (inRange: [number, number], outRange: [number, number]): void => {
  validateDrivenRangeTuple("inRange", inRange);
  validateDrivenRangeTuple("outRange", outRange);
  validateDrivenFinite("inRange[0]", inRange[0]);
  validateDrivenFinite("inRange[1]", inRange[1]);
  validateDrivenFinite("outRange[0]", outRange[0]);
  validateDrivenFinite("outRange[1]", outRange[1]);
};

const validateDrivenRangeTuple: (
  label: "inRange" | "outRange",
  range: [number, number],
) => void = (label: "inRange" | "outRange", range: [number, number]): void => {
  if (!Array.isArray(range))
    throw new Error(`driven driver ${label} must be an array`);
  if (range.length !== 2)
    throw new Error(
      `driven driver ${label} must contain exactly 2 entries, but had ${range.length}`,
    );
};

const validateDrivenFinite: (label: string, value: number) => void = (
  label: string,
  value: number,
): void => {
  if (!Number.isFinite(value))
    throw new Error(`driven driver ${label} must be finite, but was ${value}`);
};

const remapDriven: (
  d: IAutoMovieDrivenDriver,
  source: number | undefined,
) => number = (
  d: IAutoMovieDrivenDriver,
  source: number | undefined,
): number => {
  const { inRange, outRange }: IAutoMovieDrivenDriver = d;
  if (inRange === undefined || outRange === undefined)
    throw new Error(
      "driven driver without a curve requires inRange and outRange",
    );
  validateDrivenRange(inRange, outRange);
  if (d.clamp !== undefined) validateDrivenClamp(d.clamp);
  return remap(source ?? inRange[0], inRange, outRange, d.clamp ?? false);
};

const remap: (
  x: number,
  [i0, i1]: [number, number],
  [o0, o1]: [number, number],
  clamp: boolean,
) => number = (
  x: number,
  [i0, i1]: [number, number],
  [o0, o1]: [number, number],
  clamp: boolean,
): number => {
  const t: number = i1 === i0 ? 0 : (x - i0) / (i1 - i0);
  const tc: number = clamp ? Math.min(1, Math.max(0, t)) : t;
  return o0 + (o1 - o0) * tc;
};

// shared

const setChannel: (
  sampled: Map<string, IAutoMovieSampledChannel>,
  key: string,
  channel: IAutoMovieSampledChannel["channel"],
  value: number[],
) => void = (
  sampled: Map<string, IAutoMovieSampledChannel>,
  key: string,
  channel: IAutoMovieSampledChannel["channel"],
  value: number[],
): void => {
  const existing: IAutoMovieSampledChannel | undefined = sampled.get(key);
  if (existing !== undefined) existing.value = value;
  else sampled.set(key, { channel, value });
};

const lerpArray: (a: number[], b: number[], t: number) => number[] = (
  a: number[],
  b: number[],
  t: number,
): number[] => a.map((v: number, i: number): number => v + (b[i]! - v) * t);

const slerpArray: (a: number[], b: number[], t: number) => number[] = (
  a: number[],
  b: number[],
  t: number,
): number[] => {
  const q: IAutoMovieQuaternion = Quaternion.slerp(
    { x: a[0]!, y: a[1]!, z: a[2]!, w: a[3]! },
    { x: b[0]!, y: b[1]!, z: b[2]!, w: b[3]! },
    t,
  );
  return [q.x, q.y, q.z, q.w];
};
