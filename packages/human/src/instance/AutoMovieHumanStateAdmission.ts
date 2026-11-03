import { AutoMovieHumanPoseChannels } from "../skeleton/AutoMovieHumanPoseChannels";
import type { AutoMovieHumanSkeleton } from "../skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanExpression } from "../structures/expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanPose } from "../structures/pose/IAutoMovieHumanPose";
import { AutoMovieHumanActionUnit } from "../typings/AutoMovieHumanActionUnit";

/**
 * Runtime admission of a Human instance's mutable state: pose, expression and
 * root placement.
 *
 * Every value arrives as `unknown`, from JSON, a page or typed code alike, and
 * leaves as an independent copy whose shape was checked field by field, so no
 * consumer casts untrusted data to a Human type.
 *
 * - Pose: a tree of plain objects whose leaves are finite numbers at a path
 *   of {@link AutoMovieHumanPoseChannels}. Range is not checked here; the
 *   skeleton evaluator clamps it and reports each clamp.
 * - Expression: unique units with a finite intensity in [0, 1]. The generated
 *   skin has no FACS shapes, so only the neutral face (no unit above zero and
 *   no mouth record) is admitted. Jaw units are refused separately because
 *   the jaw belongs to `pose.head.jaw` and eye gaze to `pose.head.eyes`: an
 *   expression never writes a skeletal channel the pose owns.
 * - Root: a finite translation in metres and a nonzero finite quaternion,
 *   returned normalized.
 */
export namespace AutoMovieHumanStateAdmission {
  /** Placement of an instance's model root in its parent, metres. */
  export interface IRoot {
    /** Translation, metres. */
    translation: [number, number, number];

    /** Unit rotation `[x, y, z, w]`. */
    rotation: [number, number, number, number];
  }

  /** The root that leaves a model where it was built. */
  export function identity(): IRoot {
    return { translation: [0, 0, 0], rotation: [0, 0, 0, 1] };
  }

  /**
   * Admit a pose.
   *
   * @param value Candidate pose.
   * @returns An independent copy.
   * @throws {Error} Naming every leaf that is not a finite number on a pose channel.
   */
  export function pose(value: unknown): IAutoMovieHumanPose {
    if (!isRecord(value)) throw new Error("Human pose must be an object");
    const wrong: string[] = [];
    const copy: Record<string, unknown> = walk(value, "", wrong);
    if (wrong.length !== 0 || !isPose(copy))
      throw new Error(
        "Human pose has inadmissible fields: " + wrong.join(", "),
      );
    return copy;
  }

  /**
   * Admit an expression for the generated skin.
   *
   * @param value Candidate expression.
   * @returns An independent copy of the neutral expression.
   * @throws {Error} Listing every malformed or unsupported unit with its reason.
   */
  export function expression(value: unknown): IAutoMovieHumanExpression {
    if (!isRecord(value) || !Array.isArray(value.units))
      throw new Error("Human expression must hold a units array");
    const refused: string[] = [];
    const seen: Set<string> = new Set();
    const sides: Map<string, Set<string>> = new Map();
    for (const entry of value.units) {
      if (
        !isRecord(entry) ||
        typeof entry.unit !== "string" ||
        !UNITS.has(entry.unit) ||
        typeof entry.side !== "string" ||
        !SIDES.has(entry.side) ||
        typeof entry.intensity !== "number" ||
        !Number.isFinite(entry.intensity) ||
        entry.intensity < 0 ||
        entry.intensity > 1
      ) {
        refused.push("malformed unit " + JSON.stringify(entry));
        continue;
      }
      const key: string = entry.unit + "/" + entry.side;
      const used: Set<string> = sides.get(entry.unit) ?? new Set();
      if (
        seen.has(key) ||
        (entry.side === "both" ? used.size !== 0 : used.has("both"))
      )
        refused.push(`duplicate or overlapping ${key}`);
      seen.add(key);
      used.add(entry.side);
      sides.set(entry.unit, used);
      if (entry.intensity === 0) continue;
      refused.push(
        JAW.has(entry.unit)
          ? `${key}: the jaw is articulated by pose.head.jaw`
          : `${key}: the generated skin synthesizes no FACS shape`,
      );
    }
    if (value.mouth !== undefined)
      refused.push("mouth: lips, tongue and visemes are not consumed");
    if (refused.length !== 0)
      throw new Error("Human expression is unsupported: " + refused.join("; "));

    // Only zero-intensity units remain, so the admitted value is the neutral
    // face whatever was listed; it is rebuilt rather than cast from the input.
    return { units: [] };
  }

  /**
   * Admit a root placement.
   *
   * @param value Candidate root.
   * @returns An independent copy with a unit rotation.
   * @throws {Error} When a component is not finite or the rotation is zero.
   */
  export function root(value: unknown): IRoot {
    if (
      !isRecord(value) ||
      !finiteTuple(value.translation, 3) ||
      !finiteTuple(value.rotation, 4)
    )
      throw new Error(
        "Human root needs a finite translation and rotation quaternion",
      );
    const q: number[] = value.rotation;
    const n: number = Math.hypot(...q);
    if (!(n > 0) || !Number.isFinite(n))
      throw new Error("Human root rotation must be a nonzero quaternion");
    return {
      translation: [
        value.translation[0]!,
        value.translation[1]!,
        value.translation[2]!,
      ],
      rotation: [q[0]! / n, q[1]! / n, q[2]! / n, q[3]! / n],
    };
  }

  /**
   * Merge a pose patch into a pose: objects merge field by field and a number
   * replaces the number at its path. Both inputs must already be admitted.
   *
   * @param base Current pose.
   * @param patch Fields to change.
   * @returns A new pose; neither input is changed.
   */
  export function merge(
    base: IAutoMovieHumanPose,
    patch: IAutoMovieHumanPose,
  ): IAutoMovieHumanPose {
    const join = (a: unknown, b: unknown): unknown => {
      if (!isRecord(a) || !isRecord(b)) return structuredClone(b);
      const out: Record<string, unknown> = structuredClone(a);
      for (const [key, value] of Object.entries(b))
        out[key] = join(a[key], value);
      return out;
    };
    return pose(join(base, patch));
  }

  /**
   * Write each clamped field's applied value into a copy of the pose, so the
   * state records what the skeleton showed.
   *
   * @param value Admitted pose.
   * @param clamped The evaluator's clamps for that pose.
   * @returns A new pose.
   */
  export function clamp(
    value: IAutoMovieHumanPose,
    clamped: readonly AutoMovieHumanSkeleton.IClamp[],
  ): IAutoMovieHumanPose {
    const out: Record<string, unknown> = walk(record(pose(value)), "", []);
    for (const entry of clamped) {
      const keys: string[] = entry.path.split(".");
      let node: Record<string, unknown> = out;
      for (const key of keys.slice(0, -1)) {
        const next: unknown = node[key];
        if (!isRecord(next))
          throw new Error(`Human clamp names a missing field: ${entry.path}`);
        node = next;
      }
      node[keys[keys.length - 1]!] = entry.applied;
    }
    return pose(out);
  }

  /**
   * Canonical text of a plain value: object keys sorted, so two equal states
   * written in different field order compare equal.
   *
   * @param value Plain data.
   */
  export function key(value: unknown): string {
    return JSON.stringify(value, (_: string, v: unknown): unknown =>
      isRecord(v)
        ? Object.fromEntries(
            Object.keys(v)
              .sort((a: string, b: string): number =>
                a < b ? -1 : a > b ? 1 : 0,
              )
              .map((k: string): [string, unknown] => [k, v[k]]),
          )
        : v,
    );
  }
}

/** Copy a pose subtree, collecting every inadmissible leaf path. */
function walk(
  node: Record<string, unknown>,
  prefix: string,
  wrong: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    const path: string = prefix === "" ? key : prefix + "." + key;
    if (isRecord(value)) {
      if (!BRANCHES.has(path)) wrong.push(path);
      else out[key] = walk(value, path, wrong);
    } else if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      !LEAVES.has(path)
    )
      wrong.push(path);
    else out[key] = value;
  }
  return out;
}

/** Whether a value is a pose tree with only channel leaves, by the same walk. */
function isPose(value: unknown): value is IAutoMovieHumanPose {
  const wrong: string[] = [];
  if (!isRecord(value)) return false;
  walk(value, "", wrong);
  return wrong.length === 0;
}

/** The own fields of an object as a fresh record. */
function record(value: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value));
}

/** A plain object that is not an array. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** An array of `length` finite numbers. */
function finiteTuple(value: unknown, length: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every(
      (v: unknown): boolean => typeof v === "number" && Number.isFinite(v),
    )
  );
}

/** Every pose channel path, sides resolved. */
const LEAVES: ReadonlySet<string> = new Set(
  AutoMovieHumanPoseChannels.flatMap(([path]): string[] =>
    path.includes("<side>")
      ? [path.replace("<side>", "left"), path.replace("<side>", "right")]
      : [path],
  ),
);

/** Every object path above a channel. */
const BRANCHES: ReadonlySet<string> = new Set(
  [...LEAVES].flatMap((path: string): string[] => {
    const keys: string[] = path.split(".");
    return keys
      .slice(0, -1)
      .map((_: string, i: number): string => keys.slice(0, i + 1).join("."));
  }),
);

/**
 * Every action unit name. The unit type is a `const enum` with no runtime
 * object, so the names are listed here and the record's key type makes the
 * compiler refuse a list that misses or invents one.
 */
const UNITS: ReadonlySet<string> = new Set<string>(
  Object.keys({
    [AutoMovieHumanActionUnit.InnerBrowRaiser]: null,
    [AutoMovieHumanActionUnit.OuterBrowRaiser]: null,
    [AutoMovieHumanActionUnit.BrowLowerer]: null,
    [AutoMovieHumanActionUnit.UpperLidRaiser]: null,
    [AutoMovieHumanActionUnit.CheekRaiser]: null,
    [AutoMovieHumanActionUnit.LidTightener]: null,
    [AutoMovieHumanActionUnit.NoseWrinkler]: null,
    [AutoMovieHumanActionUnit.UpperLipRaiser]: null,
    [AutoMovieHumanActionUnit.NasolabialDeepener]: null,
    [AutoMovieHumanActionUnit.LipCornerPuller]: null,
    [AutoMovieHumanActionUnit.SharpLipPuller]: null,
    [AutoMovieHumanActionUnit.Dimpler]: null,
    [AutoMovieHumanActionUnit.LipCornerDepressor]: null,
    [AutoMovieHumanActionUnit.LowerLipDepressor]: null,
    [AutoMovieHumanActionUnit.ChinRaiser]: null,
    [AutoMovieHumanActionUnit.LipPucker]: null,
    [AutoMovieHumanActionUnit.LipStretcher]: null,
    [AutoMovieHumanActionUnit.NeckTightener]: null,
    [AutoMovieHumanActionUnit.LipFunneler]: null,
    [AutoMovieHumanActionUnit.LipTightener]: null,
    [AutoMovieHumanActionUnit.LipPressor]: null,
    [AutoMovieHumanActionUnit.LipsPart]: null,
    [AutoMovieHumanActionUnit.JawDrop]: null,
    [AutoMovieHumanActionUnit.MouthStretch]: null,
    [AutoMovieHumanActionUnit.LipSuck]: null,
    [AutoMovieHumanActionUnit.NostrilDilator]: null,
    [AutoMovieHumanActionUnit.NostrilCompressor]: null,
    [AutoMovieHumanActionUnit.LidDroop]: null,
    [AutoMovieHumanActionUnit.EyesClosed]: null,
  } satisfies Record<AutoMovieHumanActionUnit, null>),
);

/** Admitted sides of an action unit. */
const SIDES: ReadonlySet<string> = new Set(["left", "right", "both"]);

/** Units whose action is the jaw's own movement, which the pose owns. */
const JAW: ReadonlySet<string> = new Set<string>([
  AutoMovieHumanActionUnit.JawDrop,
  AutoMovieHumanActionUnit.MouthStretch,
]);
