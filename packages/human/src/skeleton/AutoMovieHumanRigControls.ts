import type {
  AutoMovieHumanJointName,
  AutoMovieHumanPoseChannel,
  AutoMovieHumanPoseDegreeChannel,
  AutoMovieHumanPoseMillimetreChannel,
  IAutoMovieHumanAnatomicalChain,
  IAutoMovieHumanPose,
  IAutoMovieHumanPoseClamp,
  IAutoMovieHumanRigControls,
} from "@automovie/interface";

import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";

/** Typed clinical controls derived from the public pose and the canonical joint/channel table. */
export namespace AutoMovieHumanRigControls {
  /**
   * Admit an exact canonical Human joint name from a string. Returns the input
   * spelling as the joint name. Throws for an unregistered value.
   */
  export function joint(value: string): AutoMovieHumanJointName {
    if (!isJoint(value))
      throw new Error(`Unknown canonical Human joint: ${value}`);
    return value;
  }
  /**
   * Check whether a string names a registered Human joint. Use this type guard
   * when an unknown value should return false.
   */
  export function isJoint(value: string): value is AutoMovieHumanJointName {
    return JOINTS.has(value);
  }
  /**
   * Admit an exact Human angular pose path from a string. Returns the path in
   * clinical degrees. Use millimetreBounds for the separate jaw distances.
   * Throws for an unregistered angular path.
   */
  export function channel(value: string): AutoMovieHumanPoseDegreeChannel {
    if (!isChannel(value))
      throw new Error(`Unknown Human degree channel: ${value}`);
    return value;
  }
  /**
   * Check whether a string names a registered angular Human pose path. The
   * type guard returns false for a jaw distance path or an unknown spelling.
   */
  export function isChannel(
    value: string,
  ): value is AutoMovieHumanPoseDegreeChannel {
    return ANGLES.has(value);
  }
  /**
   * Read the limits of a registered angular control, in degrees. For knee
   * rotation, a supplied pose scales both endpoints by the same-side flexion
   * divided by 90 and bounded to [0, 1]. Without a pose, returns the nominal
   * interval. Throws for an unknown angular path.
   */
  export function bounds(
    path: AutoMovieHumanPoseDegreeChannel,
    pose?: IAutoMovieHumanPose,
  ): IAutoMovieHumanRigControls.IBoundsResult {
    const row: CompiledChannel | undefined = ANGLES.get(path);
    if (!row) throw new Error(`Unknown Human degree channel: ${path}`);
    const flexion: CompiledChannel | undefined =
      pose && path.endsWith(".knee.rotation")
        ? ANGLES.get(path.replace("rotation", "flexion"))
        : undefined;
    const scale: number =
      flexion && pose
        ? Math.min(
            1,
            Math.max(
              0,
              Math.max(
                flexion.minimum,
                Math.min(flexion.maximum, scalar(pose, flexion)),
              ) / 90,
            ),
          )
        : 1;
    return { minimum: row.minimum * scale, maximum: row.maximum * scale };
  }
  /**
   * Read the inclusive millimetre limits for a registered jaw travel path.
   * Throws for a path outside the jaw distance catalogue.
   */
  export function millimetreBounds(
    path: AutoMovieHumanPoseMillimetreChannel,
  ): IAutoMovieHumanRigControls.IMillimetreBoundsResult {
    const row: CompiledChannel | undefined = MILLIMETRES.get(path);
    if (!row) throw new Error(`Unknown Human millimetre channel: ${path}`);
    return { minimum: row.minimum, maximum: row.maximum };
  }
  /**
   * Read the applied value of one Human pose control in clinical degrees or
   * jaw millimetres. Supply the original pose and clamp records from the same
   * evaluation. An omitted control reads as zero. Validates every clamp record
   * and throws for an unknown path, malformed value, duplicate path or a
   * receipt inconsistent with the pose.
   */
  export function readApplied(
    pose: IAutoMovieHumanPose,
    path: AutoMovieHumanPoseChannel,
    clamped: readonly IAutoMovieHumanPoseClamp[],
  ): number {
    const selected: CompiledChannel | undefined =
      ANGLES.get(path) ?? MILLIMETRES.get(path);
    if (!selected) throw new Error(`Unknown canonical Human channel: ${path}`);
    let value: number = scalar(pose, selected);
    if (!Array.isArray(clamped))
      throw new Error("Human applied controls require a clamp array");
    const seen: Set<string> = new Set();
    for (const clamp of clamped) {
      if (clamp === null || typeof clamp !== "object")
        throw new Error("Malformed Human clamp receipt");
      const row: CompiledChannel | undefined =
        ANGLES.get(clamp.path) ?? MILLIMETRES.get(clamp.path);
      if (
        !row ||
        seen.has(clamp.path) ||
        !Number.isFinite(clamp.requested) ||
        !Number.isFinite(clamp.applied) ||
        clamp.requested === clamp.applied ||
        clamp.requested !== scalar(pose, row)
      )
        throw new Error(`Inconsistent Human clamp receipt: ${clamp.path}`);
      seen.add(clamp.path);
      if (clamp.path === path) value = clamp.applied;
    }
    return value;
  }
  /**
   * Select the ordered angular paths of a named anatomical chain. Use the
   * person's own side for a sided chain. An arm stops at the forearm. A leg
   * includes hip, knee, ankle, hindfoot and midfoot. Fingers and toes have
   * individual chains. Returns a fresh list and throws for unknown, empty or
   * oversized selections.
   */
  export function chain(
    selection: IAutoMovieHumanAnatomicalChain,
  ): AutoMovieHumanPoseDegreeChannel[] {
    if (
      "side" in selection &&
      selection.side !== "left" &&
      selection.side !== "right"
    )
      throw new Error("Human chain requires its own left/right side");
    let prefix: string;
    switch (selection.region) {
      case "arm":
        prefix = `arms.${selection.side}.`;
        break;
      case "leg":
        prefix = `legs.${selection.side}.`;
        break;
      case "eyes":
        prefix = `head.eyes.${selection.side}.`;
        break;
      case "spine":
        prefix = "spine.";
        break;
      case "neck":
        prefix = "neck.";
        break;
      case "pelvis":
        prefix = "pelvis.";
        break;
      case "finger":
        prefix = `arms.${selection.side}.hand.${selection.digit}.`;
        break;
      case "toe":
        prefix = `legs.${selection.side}.foot.${selection.digit}.`;
        break;
      default:
        throw new Error("Unknown Human anatomical chain");
    }
    const paths: AutoMovieHumanPoseDegreeChannel[] = [...ANGLES.keys()].filter(
      isChannel,
    );
    const result: AutoMovieHumanPoseDegreeChannel[] = paths.filter(
      (path: AutoMovieHumanPoseDegreeChannel): boolean =>
        path.startsWith(prefix) &&
        !(
          selection.region === "arm" &&
          (path.includes(".hand.") || path.includes(".wrist."))
        ) &&
        !(
          selection.region === "leg" &&
          path.includes(".foot.") &&
          !path.endsWith("subtalarInversion") &&
          !path.endsWith("midfootSupination")
        ),
    );
    if (result.length === 0 || result.length > 12)
      throw new Error("Unknown or oversized Human anatomical chain");
    return result;
  }
  /**
   * Linearly blend two poses over a finite weight in [0, 1]. Omitted controls
   * contribute zero. Angular values interpolate their stated degrees and jaw
   * travel interpolates millimetres. Returns a fresh pose. Throws for an
   * invalid weight or a malformed or nonfinite input control.
   */
  export function blend(
    from: IAutoMovieHumanPose,
    to: IAutoMovieHumanPose,
    weight: number,
  ): IAutoMovieHumanPose {
    if (!Number.isFinite(weight) || weight < 0 || weight > 1)
      throw new Error("Human pose blend requires a finite closed-unit weight");
    const pose: IAutoMovieHumanPose = {};
    for (const row of CATALOGUE) {
      const a: number = scalar(from, row);
      const b: number = scalar(to, row);
      if (a === 0 && b === 0) continue;
      assign(pose, row.parts, a + (b - a) * weight);
    }
    return pose;
  }
}

/*
 * Read clinical neutral for an omitted control while refusing nonfinite input.
 */
function scalar(pose: IAutoMovieHumanPose, row: CompiledChannel): number {
  let value: unknown = pose;
  for (const part of row.parts) {
    if (value === undefined) return 0;
    if (typeof value !== "object" || value === null)
      throw new Error(`Malformed Human pose region: ${row.path}`);
    value = Reflect.get(value, part);
  }
  if (value === undefined) return 0;
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`Nonfinite Human pose channel: ${row.path}`);
  return value;
}

/*
 * Write an already canonical numeric leaf without exposing an untyped authoring API.
 */
function assign(
  pose: IAutoMovieHumanPose,
  parts: readonly string[],
  value: number,
): void {
  let node: object = pose;
  for (const part of parts.slice(0, -1)) {
    const child: unknown = Reflect.get(node, part);
    if (typeof child !== "object" || child === null)
      Reflect.set(
        node,
        part,
        node === pose && (part === "arms" || part === "legs")
          ? { left: {}, right: {} }
          : {},
      );
    node = Reflect.get(node, part) as object;
  }
  Reflect.set(node, parts[parts.length - 1]!, value);
}

/*
 * Body-independent compiled paths derived once from the single canonical table.
 */
interface CompiledChannel {
  /*
   * Expanded own-side clinical path.
   */
  path: string;
  /*
   * Registered FK joint identity.
   */
  bone: string;
  /*
   * Cached object traversal; no input pose or result is retained.
   */
  parts: readonly string[];
  /*
   * Canonical lower bound in the row's declared unit.
   */
  minimum: number;
  /*
   * Canonical upper bound in the row's declared unit.
   */
  maximum: number;
}
/*
 * Immutable schema work shared by admission, bounds, chain selection and blending.
 */
const CATALOGUE: readonly CompiledChannel[] =
  AutoMovieHumanPoseChannels.flatMap(
    (row: (typeof AutoMovieHumanPoseChannels)[number]): CompiledChannel[] => {
      const sides: readonly string[] = row[0].includes("<side>")
        ? ["left", "right"]
        : [""];
      return sides.map((side: string): CompiledChannel => {
        const path: string = row[0].replace("<side>", side);
        return {
          path,
          bone: row[1].replace("<side>", side),
          parts: path.split("."),
          minimum: row[4],
          maximum: row[5],
        };
      });
    },
  );
/*
 * Exact expanded angular entries; jaw millimetres remain outside degree admission.
 */
const ANGLES: ReadonlyMap<string, CompiledChannel> = new Map(
  CATALOGUE.filter(
    (row: CompiledChannel): boolean => !row.path.startsWith("head.jaw."),
  ).map((row: CompiledChannel): [string, CompiledChannel] => [row.path, row]),
);
/*
 * Exact jaw entries use their table's millimetre unit and remain disjoint from angles.
 */
const MILLIMETRES: ReadonlyMap<string, CompiledChannel> = new Map(
  CATALOGUE.filter((row: CompiledChannel): boolean =>
    row.path.startsWith("head.jaw."),
  ).map((row: CompiledChannel): [string, CompiledChannel] => [row.path, row]),
);
/*
 * Exact expanded joint names from the same canonical source, with no body cache.
 */
const JOINTS: ReadonlySet<string> = new Set(
  CATALOGUE.map((row: CompiledChannel): string => row.bone),
);
