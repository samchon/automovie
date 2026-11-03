import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { AutoMovieHumanPoseChannels } from "../../../../packages/human/src/skeleton/AutoMovieHumanPoseChannels";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HUMAN_DEBUG_POSES as HUMAN_STICKMAN_POSES } from "../../../../packages/human/debug/poses/HUMAN_DEBUG_POSES";
import { HumanPeople } from "../internal/HumanPeople";

/** Distance between the two kinematics a bone may show, metres. */
const SAME: number = 1e-6;

/** Degrees an achieved clinical angle may lie from the request. */
const ANGLE: number = 1.5;

/** Metres a pose's mirror may lie from the other side's, on a symmetric body. */
const MIRROR: number = 2e-3;

/** Metres a fully raised arm's shoulder rises with its girdle, at least. */
const LIFT: number = 0.01;

/** Degrees a straight joint, a plumb limb or a level sole may read at neutral. */
const STRAIGHT: number = 0.01;

/** Degrees a resting arm may stand off the plumb line. */
const RESTING: number = 20;

/** Degrees a thumb may stand off forward at neutral, its hand's arch included. */
const FACING: number = 0.01;

/** Millimetres an ankle may leave its height at neutral. */
const FLOOR: number = 0.5;

type V3 = [number, number, number];

/** A pose holding one field. */
function field(path: string, value: number): IAutoMovieHumanPose {
  const out: Record<string, unknown> = {};
  let node: Record<string, unknown> = out;
  const keys: string[] = path.split(".");
  for (const key of keys.slice(0, -1)) {
    const next: Record<string, unknown> = {};
    node[key] = next;
    node = next;
  }
  node[keys[keys.length - 1]!] = value;
  return out as IAutoMovieHumanPose;
}

/**
 * Every field's zero, both ends, mirror and clamp on every person, and the
 * clinical angle a limb's bones reach, read from the placements alone.
 */
function auditRange(name: string): string[] {
  const out: string[] = [];
  const { evaluate } = HumanPeople.rigged(name);
  const rest = evaluate({});
  const placed = (o: typeof rest, bone: string): V3 =>
    o.posed.find((p): boolean => p.bone === bone)!.position;
  const line = (o: typeof rest, a: string, b: string): V3 => {
    const p: V3 = placed(o, a);
    const q: V3 = placed(o, b);
    const n: number = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    return [(q[0] - p[0]) / n, (q[1] - p[1]) / n, (q[2] - p[2]) / n];
  };
  const degrees = (r: number): number => (r * 180) / Math.PI;
  const between = (u: V3, v: V3): number =>
    degrees(Math.acos(Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])));

  for (const side of ["left", "right"]) {
    const s: number = side === "left" ? 1 : -1;
    const expect = (label: string, path: string, value: number, got: (o: typeof rest) => number): void => {
      const reached: number = got(evaluate(field(path, value)));
      if (Math.abs(reached - value) > ANGLE)
        out.push(`${name} ${side} ${label} asked ${value} reached ${reached.toFixed(2)}`);
    };
    const arm = (o: typeof rest): V3 => line(o, `${side}UpperArm`, `${side}LowerArm`);
    const fore = (o: typeof rest): V3 => line(o, `${side}LowerArm`, `${side}Hand`);
    const thigh = (o: typeof rest): V3 => line(o, `${side}UpperLeg`, `${side}LowerLeg`);
    const shank = (o: typeof rest): V3 => line(o, `${side}LowerLeg`, `${side}Foot`);

    // `{}` is the anatomical neutral: the arm rests at the side with its elbow
    // straight and its thumb forward, the leg hangs plumb and the foot stays down.
    const resting: number = degrees(Math.atan2(s * arm(rest)[2], -arm(rest)[1]));
    const hand: V3 = line(rest, `${side}LowerArm`, `${side}Hand`);
    const palm: V3 = line(rest, `${side}LittleProximal`, `${side}IndexProximal`);
    const across: number = palm[0] * hand[0] + palm[1] * hand[1] + palm[2] * hand[2];
    const radial: V3 = [palm[0] - hand[0] * across, palm[1] - hand[1] * across, palm[2] - hand[2] * across];
    const facing: number = degrees(Math.atan2(Math.hypot(radial[1], radial[2]), radial[0]));
    const foot = rest.posed.find((p): boolean => p.bone === `${side}Foot`)!;
    const ankle = rest.bones.find((b): boolean => b.bone === `${side}Foot`)!;
    for (const [label, off, limit] of [
      ["elbow at neutral", between(arm(rest), fore(rest)), STRAIGHT],
      ["knee at neutral", between(thigh(rest), shank(rest)), STRAIGHT],
      ["thigh from the plumb line", between(thigh(rest), [0, -1, 0]), STRAIGHT],
      ["resting arm from the plumb line", Math.abs(resting), RESTING],
      ["thumb from forward", facing, FACING],
      ["sole's turn", degrees(2 * Math.acos(Math.min(1, Math.abs(foot.rotation[3])))), STRAIGHT],
      ["ankle's height, mm", Math.abs(foot.position[1] - ankle.position[1]) * 1000, FLOOR],
    ] as [string, number, number][])
      if (off > limit) out.push(`${name} ${side} ${label} reads ${off.toFixed(2)}`);
    for (const v of [45, 90, 147.3])
      expect("elbow", `arms.${side}.elbow.flexion`, v, (o): number => between(arm(o), fore(o)));
    for (const v of [45, 90, 139.8])
      expect("knee", `legs.${side}.knee.flexion`, v, (o): number => between(thigh(o), shank(o)));
    for (const v of [-60, 90, 170.4])
      expect("shoulder flexion", `arms.${side}.shoulder.flexion`, v, (o): number => degrees(Math.atan2(arm(o)[0], -arm(o)[1])));
    for (const v of [-40, 90, 179])
      expect("shoulder abduction", `arms.${side}.shoulder.abduction`, v, (o): number => (degrees(Math.atan2(s * arm(o)[2], -arm(o)[1])) - resting) / (1 - resting / 180));
    for (const v of [-17.75, 90, 132.1])
      expect("hip flexion", `legs.${side}.hip.flexion`, v, (o): number => degrees(Math.atan2(thigh(o)[0], -thigh(o)[1])));
    for (const v of [-20, 40])
      expect("hip abduction", `legs.${side}.hip.abduction`, v, (o): number => degrees(Math.atan2(s * thigh(o)[2], -thigh(o)[1])));

    // A raised arm brings its girdle, which a low one leaves alone.
    const raised = evaluate(field(`arms.${side}.shoulder.abduction`, 179));
    const rise: number = placed(raised, `${side}UpperArm`)[1] - placed(rest, `${side}UpperArm`)[1];
    if (rise < LIFT) out.push(`${name} ${side} shoulder rises ${rise.toFixed(4)} m with a raised arm`);
    const low = evaluate(field(`arms.${side}.shoulder.abduction`, 10));
    const still: number = Math.abs(placed(low, `${side}UpperArm`)[1] - placed(rest, `${side}UpperArm`)[1]);
    if (still > 1e-9) out.push(`${name} ${side} shoulder moves ${still.toFixed(4)} m with a low arm`);
  }

  for (const [path, bone, , , min, max] of AutoMovieHumanPoseChannels) {
    if (path.endsWith("knee.rotation")) continue;
    const sides: string[] = path.includes("<side>") ? ["left", "right"] : [""];

    // A field at zero is the same as the field left out.
    for (const side of sides) {
      const zero = evaluate(field(path.replace("<side>", side), 0));
      if (zero.clamped.length !== 0) continue;
      for (const [i, p] of zero.posed.entries()) {
        const q = rest.posed[i]!;
        if (Math.hypot(p.position[0] - q.position[0], p.position[1] - q.position[1], p.position[2] - q.position[2]) > 1e-9) {
          out.push(`${name} ${path} at zero is not neutral at ${p.bone}`);
          break;
        }
      }
    }
    for (const value of [min, max])
      for (const side of sides) {
        const key: string = path.replace("<side>", side);
        const over = evaluate(field(key, value + (value === max ? 1 : -1)));
        if (over.clamped.length !== 1) out.push(`${name} ${key} past ${value} clamps ${over.clamped.length} fields`);
        if (evaluate(field(key, value)).clamped.length !== 0) out.push(`${name} ${key} clamps its own end ${value}`);
      }
    if (sides.length === 1) continue;
    for (const value of [min, max]) {
      const left = evaluate(field(path.replace("<side>", "left"), value));
      const right = evaluate(field(path.replace("<side>", "right"), value));
      for (const [i, p] of left.posed.entries()) {
        const mate: string = p.bone.startsWith("left")
          ? p.bone.replace("left", "right")
          : p.bone.startsWith("right")
            ? p.bone.replace("right", "left")
            : p.bone;
        const moved: V3 = [
          p.position[0] - rest.posed[i]!.position[0],
          p.position[1] - rest.posed[i]!.position[1],
          p.position[2] - rest.posed[i]!.position[2],
        ];
        const q: V3 = placed(right, mate);
        const q0: V3 = placed(rest, mate);
        const e: number = Math.hypot(
          moved[0] - (q[0] - q0[0]),
          moved[1] - (q[1] - q0[1]),
          moved[2] + (q[2] - q0[2]),
        );
        if (e > MIRROR) {
          out.push(`${name} ${path} ${value} mirrors ${bone} off by ${(e * 1000).toFixed(1)} mm at ${p.bone}`);
          break;
        }
      }
    }
  }
  return out;
}

/**
 * A Human pose reaches the engine as its own clinical pose, not a cast.
 *
 * @evidence contracts/testing.md#behavioral-verification Converts evaluated poses through the public adapter and runs the engine's own forward kinematics on the rig, comparing every bone's world place with the Human skeleton's. It catches a wrong axis, order, handedness, angle unit or root.
 * @evidence contracts/testing.md#independent-expectations The Human skeleton's placements are computed by separate code from the engine's FK, so the two disagree if the adapter is wrong; the rig's composition is the premise both share.
 * @evidence contracts/testing.md#distinguishing-cases Runs neutral, the step-and-reach pose and the range-limit pose on a slender and a broad person, across forearms with their distal twist and every other joint. A bone the adapter reports as translated is exempt, because the engine's rig has no channel for it, and its descendants with it. On every person it also reads that `{}` is the anatomical neutral, that a field at zero is the field left out, both ends, clamp and left-right mirror, and the clinical angle the elbows, knees, shoulders and hips reach from the placements alone, so a wrong sign, a zero taken from the achieved posture or a turn in a tilted plane each shows as an angle or a mirror off.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_engine_pose`, importing pure engine kinematics, reading the people `HumanPeople` generates once per run and starting no renderer or host.
 */
export const test_human_engine_pose = (): void => {
  const problems: string[] = [];
  for (const name of HumanPeople.names()) problems.push(...auditRange(name));
  for (const name of ["f1", "m2"]) {
    const { rig, evaluate } = HumanPeople.rigged(name);
    for (const label of ["neutral", "demo", "limit"]) {
      const output = evaluate(HUMAN_STICKMAN_POSES[label]!);
      const { pose, translated } = AutoMovieHumanRig.enginePose(rig.skeleton, output);
      const skip = new Set<string>(translated);
      for (const bone of rig.skeleton.bones)
        if (bone.parent !== null && skip.has(bone.parent)) skip.add(bone.bone);
      const placed = new Map(output.posed.map((p) => [p.bone, p]));
      for (const r of resolvePose(pose, rig.skeleton)) {
        if (skip.has(r.bone)) continue;
        const want = placed.get(r.bone.endsWith("Toes") ? r.bone.replace("Toes", "HalluxProximal") : r.bone)!;
        const off: number = Math.hypot(
          r.worldPosition.x - want.position[0],
          r.worldPosition.y - want.position[1],
          r.worldPosition.z - want.position[2],
        );
        if (!(off < SAME)) problems.push(`${name} ${label} ${r.bone} off by ${off.toFixed(6)} m`);
      }
    }
  }
  if (problems.length !== 0)
    throw new Error(`${problems.length} bones disagree:\n${problems.join("\n")}`);
};
