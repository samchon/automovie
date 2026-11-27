import {
  IAutoMovieChannel,
  IAutoMovieCopyDriver,
  IAutoMovieDrivenDriver,
  IAutoMovieDriver,
  IAutoMovieNode,
  type IAutoMovieSampledChannel,
  IAutoMovieTransform,
} from "@automovie/interface";

import { channelKey } from "./channelKey";
import { evaluateDrivenCurve } from "./evaluateDrivenCurve";
import { lerpChannelValues } from "./lerpChannelValues";
import { slerpChannelValues } from "./slerpChannelValues";
import { orderValueDrivers } from "./orderValueDrivers";

/*
 * Evaluate copy and driven channels in stable dependency order, mutating
 * samples before constraints. Return world/stateful descriptors in original
 * order. Unknown kinds and reciprocal dependencies throw; a null/absent curve
 * selects linear range mapping.
 */
export function resolveDrivers(
  drivers: IAutoMovieDriver[],
  sampled: Map<string, IAutoMovieSampledChannel>,
  nodesById: Map<string, IAutoMovieNode>,
): IAutoMovieDriver[] {
  const value: ValueDriver[] = [];
  const deferred: IAutoMovieDriver[] = [];
  for (const d of drivers)
    if (d.type === "copy" || d.type === "driven") value.push(d);
    else deferred.push(d);

  for (const d of orderValueDrivers(value))
    if (d.type === "copy") applyCopy(d, sampled, nodesById);
    else applyDriven(d, sampled);

  return deferred;
}

/*
 * The two channel-space drivers this pass resolves (no world transform needed).
 */
type ValueDriver = IAutoMovieCopyDriver | IAutoMovieDrivenDriver;

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
  validateCopyInfluence(d.influence);
  if (d.translation) writeBlend(d, "translation", false, sampled, nodesById);
  if (d.rotation) writeBlend(d, "rotation", true, sampled, nodesById);
  if (d.scale) writeBlend(d, "scale", false, sampled, nodesById);
};

const validateCopyInfluence: (influence: number) => void = (
  influence: number,
): void => {
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
    ? slerpChannelValues(owner, source, d.influence)
    : lerpChannelValues(owner, source, d.influence);
  setChannel(
    sampled,
    `node:${d.owner}:${path}`,
    { kind: "node", node: d.owner, path },
    result,
  );
};

/*
 * Current value of a node TRS channel: the sampled override, else rest pose.
 */
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
  const y: number =
    d.curve !== null && d.curve !== undefined
      ? evaluateDrivenCurve(source, d.curve)
      : remapDriven(d, source);
  setChannel(sampled, channelKey(d.output), d.output, [y]);
};

/*
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
  if (value.length !== 1)
    throw new Error(
      `driven driver source value must contain exactly 1 entry, but had ${value.length}`,
    );
};

function validateDrivenRange(
  inRange: [number, number],
  outRange: [number, number],
): void {
  validateDrivenRangeTuple("inRange", inRange);
  validateDrivenRangeTuple("outRange", outRange);
}

const validateDrivenRangeTuple: (
  label: "inRange" | "outRange",
  range: [number, number],
) => void = (label: "inRange" | "outRange", range: [number, number]): void => {
  if (range.length !== 2)
    throw new Error(
      `driven driver ${label} must contain exactly 2 entries, but had ${range.length}`,
    );
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
