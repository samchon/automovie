import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanAnatomyPose } from "../internal/HumanAnatomyPose";
import { HumanPeople } from "../internal/HumanPeople";
import { HumanPoseMirror } from "../internal/HumanPoseMirror";

/**
 * A pose and its mirror place a person and the person's mirror image as
 * mirror images, joint by joint and skin vertex by skin vertex, on every
 * person.
 *
 * @evidence contracts/testing.md#behavioral-verification For each person it rebuilds the mirror image from the person's own inputs with every left-right pair swapped, the orthodox way to honour inputs given per side (a person whose pairs are equal is its own mirror). It poses the person in each pose of `HumanAnatomyPose.POSES` and the mirror image in that pose's mirror, every side's values on the other side and the midline fields the pose type declares toward the person's left negated with the eyes' horizontal gaze, through each body's public pose evaluator, rig binding and dual-quaternion blend. It requires every joint centre and rotation to mirror its other-side bone across the median plane, and every skin vertex to mirror the mirror image's bind vertex nearest its reflection, and fails once with every skin chain, bone, pose and person that breaks it, with the error, its allowance and where. It catches a joint axis whose sign is wrong on one side, a side-specific offset, twist or weight, a midline turn applied to one side only, and a side whose inputs the rig reads from the other side. Any posture that the two bodies take as mirror images passes.
 * @evidence contracts/testing.md#independent-expectations The median plane is the body's symmetry by definition, and the pose type declares every field's direction: limb fields are anatomical, measured on their own side, and the listed midline fields and horizontal gaze read toward the person's left, so a pose's mirror is fixed by the type and not by the rig; a midline field no list names is refused. A body rebuilt from swapped inputs is the person's mirror image, so the two posed bodies must be mirror images up to arithmetic and to how far the two binds already miss each other: a skin vertex may miss by its bind correspondence distance, a joint centre by the sum of its own and its ancestors' rest offset mismatches, each plus a billionth of the coordinates; a rotation by the arithmetic tolerance stated with the observer, the bind frames being unrotated. No construction constant enters. Made red on f1 by a side-specific axis sign flip, the left forearm's pronation turned the other way on both bodies: the demo pose, the only one that pronates a forearm, then fails in the forearm and hand chains and bones of the side opposite the flipped one and nowhere else.
 * @evidence contracts/testing.md#distinguishing-cases The pose mirror is an involution on every pose, keeps flexion, tilt, jaw opening and protrusion, negates every listed leftward field and refuses an unlisted one; swapping inputs twice is the identity. All nine people, f1, f2, m1, m2 and the tall, short, wide, narrow and masculine people, in the neutral, demo, limit, raised and flexed poses, so asymmetric poses with one-sided midline turns and symmetric poses at range ends are both read. The engine pose test owns each joint's angle against its clinical definition and the pose test owns the skin's deformation; this test owns only that the two sides behave alike.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_pose_mirror`, building the mirror images and posing both bodies in process on the CPU with no renderer, browser or GPU.
 */
export const test_human_pose_mirror: () => void = (): void => {
  const failures: string[] = controls();
  const findings: HumanPoseMirror.IFinding[] = [];

  // Every person is audited even when another fails, so one run lists everything.
  for (const name of HumanPeople.names()) {
    try {
      findings.push(...HumanPoseMirror.audit(name, HumanAnatomyPose.POSES));
    } catch (error) {
      failures.push(`${name} could not be mirrored: ${(error as Error).message}`);
    }
  }

  const lines: string[] = [...failures, ...findings.map(HumanPoseMirror.format)];

  if (lines.length)
    throw new Error(`${findings.length} mirror findings and ${failures.length} control or audit failures:\n${lines.join("\n")}`);
};

/** Every control's mismatch, empty when all hold. */
function controls(): string[] {
  return [...mirrorControls(), ...swapControls(), ...flipControl()];
}

/** Whether two values serialise alike once their keys are put in order. */
function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(normal(a)) === JSON.stringify(normal(b));
}

/** A value with its keys in a fixed order, for comparison. */
function normal(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;

  const record: Record<string, unknown> = value as Record<string, unknown>;

  return Object.fromEntries(
    Object.keys(record)
      .sort((a: string, b: string): number => a.localeCompare(b))
      .map((k: string): [string, unknown] => [k, normal(record[k])]),
  );
}

/** The pose mirror is an involution, mirrors each declared field as declared and refuses an undeclared one. */
function mirrorControls(): string[] {
  const out: string[] = [];

  // Mirroring twice returns every pose the audit reads.
  for (const [name, pose] of Object.entries(HumanAnatomyPose.POSES))
    if (!same(HumanPoseMirror.mirror(HumanPoseMirror.mirror(pose)), pose))
      out.push(`control mirror: mirroring ${name} twice does not return it`);

  // Sides swap, leftward fields and horizontal gaze negate, symmetric fields stay.
  const given: IAutoMovieHumanPose = {
    head: { eyes: { left: { horizontal: 20, vertical: 5 }, right: { horizontal: 10 } }, jaw: { opening: 25, lateralExcursion: 3 } },
    neck: { atlantoAxial: { rotation: 25 }, atlantoOccipital: { flexion: 5 } },
    pelvis: { tilt: 4, obliquity: 2, rotation: 30 },
    arms: { left: { elbow: { flexion: 25 } }, right: { forearm: { pronation: 60 } } },
  };
  const expected: IAutoMovieHumanPose = {
    head: { eyes: { right: { horizontal: -20, vertical: 5 }, left: { horizontal: -10 } }, jaw: { opening: 25, lateralExcursion: -3 } },
    neck: { atlantoAxial: { rotation: -25 }, atlantoOccipital: { flexion: 5 } },
    pelvis: { tilt: 4, obliquity: -2, rotation: -30 },
    arms: { right: { elbow: { flexion: 25 } }, left: { forearm: { pronation: 60 } } },
  };
  const mirrored: IAutoMovieHumanPose = HumanPoseMirror.mirror(given);

  if (!same(mirrored, expected)) out.push(`control mirror: ${JSON.stringify(mirrored)} is not the declared mirror`);

  // A field the type declares no direction for must be refused, not guessed.
  try {
    HumanPoseMirror.mirror({ pelvis: { unknown: 1 } } as unknown as IAutoMovieHumanPose);
    out.push("control mirror: an undeclared midline field was mirrored instead of refused");
  } catch {
    // Refused, as it must be.
  }

  return out;
}

/** Swapping a person's inputs twice returns them, and changes a person whose sides differ. */
function swapControls(): string[] {
  const out: string[] = [];
  const params: IAutoMovieHumanParameters = HumanPeople.person("f1").params;

  if (!same(HumanPoseMirror.swap(HumanPoseMirror.swap(params)), params))
    out.push("control swap: swapping f1's inputs twice does not return them");

  if (same(HumanPoseMirror.swap(params), params)) out.push("control swap: f1's unequal pairs did not change when swapped");

  return out;
}

/** A pose with the left forearm's pronation turned the other way: the made rig defect, an axis sign flip on one side. */
function flip(pose: IAutoMovieHumanPose): IAutoMovieHumanPose {
  const copy: IAutoMovieHumanPose = JSON.parse(JSON.stringify(pose)) as IAutoMovieHumanPose;
  const forearm: { pronation?: number } | undefined = copy.arms?.left?.forearm;

  if (forearm?.pronation !== undefined) forearm.pronation = (forearm.pronation as number) * -1;

  return copy;
}

/** A side-specific axis sign flip, the left forearm's pronation turned the other way, is found where it acts and nowhere else. */
function flipControl(): string[] {
  const out: string[] = [];

  // The findings the flip adds to the unflipped audit of f1.
  const base: Set<string> = new Set(HumanPoseMirror.audit("f1", HumanAnatomyPose.POSES).map(HumanPoseMirror.format));
  const added: HumanPoseMirror.IFinding[] = HumanPoseMirror.audit("f1", HumanAnatomyPose.POSES, flip).filter(
    (f: HumanPoseMirror.IFinding): boolean => !base.has(HumanPoseMirror.format(f)),
  );

  // The mirror image's left forearm is the one the demo pose pronates, so the person's right side breaks.
  if (!added.some((f: HumanPoseMirror.IFinding): boolean => f.kind === "skin" && /^hand\.right/.test(f.region)))
    out.push("control flip: the flipped forearm's hand skin did not fail");

  if (!added.some((f: HumanPoseMirror.IFinding): boolean => f.kind === "joint rotation" && f.region === "rightHand"))
    out.push("control flip: the flipped forearm's hand rotation did not fail");

  for (const f of added)
    if (f.pose !== "demo" || !/right|\.right/.test(f.region))
      out.push(`control flip: a finding outside the flipped side and pose: ${HumanPoseMirror.format(f)}`);

  return out;
}
