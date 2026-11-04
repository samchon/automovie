import {
  AutoMovieHumanSkeleton,
  AutoMovieHumanRigControls as Controls,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { HumanPeople } from "../internal/HumanPeople";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Canonical applied scalar reads preserve real FK clamps and clinical units.
 *
 * Scenarios:
 * 1. Real Human FK clamps an extended knee's requested rotation to zero.
 * 2. Increasing raw rotation remains zero-rate after that actual clamp.
 * 3. Admitted degrees, jaw millimetres and omitted neutral retain their units.
 * 4. Duplicate, foreign, stale, unchanged and nonfinite receipts refuse.
 * 5. Reads preserve input poses and exact evaluation receipts.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads actual public Skeleton evaluation clamp receipts through the public Controls getter and compares the applied scalar against zero or independently specified admitted input. Raw moving requests cannot masquerade as applied rate; malformed receipts and inputs must throw and caller records remain unchanged.
 * @evidence contracts/testing.md#independent-expectations A fully extended knee permits zero tibial rotation, while a90-degree flexed knee permits the authored12degrees. Jaw opening4.5 and protrusion2 remain millimetres without radian conversion, and an omitted canonical channel is neutral zero. These are scalar/unit checks, not dynamics or contact admission.
 * @evidence contracts/testing.md#distinguishing-cases Covers two increasing clamped requests, admitted angular and jaw channels, jaw clamping from100 to52.9mm, neutral absence, wrong-pose/stale receipt association, unknown paths, duplicate/unchanged/nonfinite/malformed receipts and immutable inputs. The existing IK and whole-foot tests own fitting behavior and physical residuals.
 * @evidence contracts/testing.md#execution-ownership This named synchronous root unit reuses one existing in-memory Human calibration and public portable FK; no process, browser, GPU, consumer installation or native artifact is started or built.
 */
export function test_human_rig_controls_applied(): void {
  const person: HumanPeople.IPerson = HumanPeople.person("m1");
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator =
    AutoMovieHumanSkeleton.prepare(person.params, { calibration: person.body });
  const raw: IAutoMovieHumanPose[] = [
    {
      legs: { left: { knee: { flexion: 0, rotation: 12 } }, right: {} },
      head: { jaw: { opening: 4.5, protrusion: 2 } },
    },
    {
      legs: { left: { knee: { flexion: 0, rotation: 20 } }, right: {} },
      head: { jaw: { opening: 4.5, protrusion: 2 } },
    },
  ];
  const saved: string = JSON.stringify(raw);
  const outputs: AutoMovieHumanSkeleton.IOutput[] = raw.map(
    (pose: IAutoMovieHumanPose): AutoMovieHumanSkeleton.IOutput =>
      evaluate(pose),
  );
  const receipts: string = JSON.stringify(
    outputs.map(
      (
        output: AutoMovieHumanSkeleton.IOutput,
      ): AutoMovieHumanSkeleton.IClamp[] => output.clamped,
    ),
  );
  const observed: number[] = raw.map(
    (pose: IAutoMovieHumanPose, index: number): number =>
      Controls.readApplied(
        pose,
        "legs.left.knee.rotation",
        outputs[index]!.clamped,
      ),
  );
  TestValidator.predicate(
    "actual FK clamp overrides first request",
    nclose(observed[0]!, 0, 0),
  );
  TestValidator.predicate(
    "actual FK clamp overrides moving second request",
    nclose(observed[1]!, 0, 0),
  );
  TestValidator.predicate(
    "applied rate is zero while raw rate is eighty degrees per second",
    nclose((observed[1]! - observed[0]!) / 0.1, 0, 0) &&
      nclose(
        (raw[1]!.legs!.left.knee!.rotation! -
          raw[0]!.legs!.left.knee!.rotation!) /
          0.1,
        80,
        1e-12,
      ),
  );
  TestValidator.predicate(
    "jaw opening retains millimetres",
    nclose(
      Controls.readApplied(raw[0]!, "head.jaw.opening", outputs[0]!.clamped),
      4.5,
      0,
    ),
  );
  TestValidator.predicate(
    "jaw protrusion retains millimetres",
    nclose(
      Controls.readApplied(raw[0]!, "head.jaw.protrusion", outputs[0]!.clamped),
      2,
      0,
    ),
  );
  TestValidator.predicate(
    "omitted canonical channel means clinical neutral",
    nclose(Controls.readApplied({}, "neck.cervical.flexion", []), 0, 0),
  );

  const bent: IAutoMovieHumanPose = {
    legs: { left: { knee: { flexion: 90, rotation: 12 } }, right: {} },
  };
  const bentOutput: AutoMovieHumanSkeleton.IOutput = evaluate(bent);
  TestValidator.predicate(
    "admitted degree channel remains twelve degrees",
    nclose(
      Controls.readApplied(bent, "legs.left.knee.rotation", bentOutput.clamped),
      12,
      0,
    ),
  );
  const open: IAutoMovieHumanPose = { head: { jaw: { opening: 100 } } };
  const openOutput: AutoMovieHumanSkeleton.IOutput = evaluate(open);
  TestValidator.predicate(
    "actual jaw clamp remains millimetres",
    nclose(
      Controls.readApplied(open, "head.jaw.opening", openOutput.clamped),
      52.9,
      1e-12,
    ),
  );

  const clamp: AutoMovieHumanSkeleton.IClamp = outputs[0]!.clamped.find(
    (item: AutoMovieHumanSkeleton.IClamp): boolean =>
      item.path === "legs.left.knee.rotation",
  )!;
  TestValidator.predicate(
    "actual fixture provides the exact clamp",
    clamp !== undefined,
  );
  const badReceipts: readonly (readonly AutoMovieHumanSkeleton.IClamp[])[] = [
    [clamp, { ...clamp }],
    [{ ...clamp, path: "legs.left.knee.missing" }],
    [{ ...clamp, requested: 11 }],
    [{ ...clamp, applied: clamp.requested }],
    [{ ...clamp, requested: NaN }],
    [{ ...clamp, applied: Infinity }],
    [null as unknown as AutoMovieHumanSkeleton.IClamp],
  ];
  for (const receipt of badReceipts)
    TestValidator.predicate(
      "malformed or inconsistent receipt refuses",
      throwsError((): unknown =>
        Controls.readApplied(raw[0]!, "legs.left.knee.rotation", receipt),
      ),
    );
  TestValidator.predicate(
    "receipt from another actual time refuses",
    throwsError((): unknown =>
      Controls.readApplied(
        raw[1]!,
        "legs.left.knee.rotation",
        outputs[0]!.clamped,
      ),
    ),
  );
  TestValidator.predicate(
    "invalid receipt container refuses",
    throwsError((): unknown =>
      Controls.readApplied(
        raw[0]!,
        "legs.left.knee.rotation",
        null as unknown as readonly AutoMovieHumanSkeleton.IClamp[],
      ),
    ),
  );
  TestValidator.predicate(
    "unknown channel refuses",
    throwsError((): unknown =>
      Controls.readApplied({}, "neck.missing" as Controls.Channel, []),
    ),
  );
  TestValidator.predicate(
    "nonfinite requested scalar refuses",
    throwsError((): unknown =>
      Controls.readApplied(
        { neck: { cervical: { flexion: NaN } } },
        "neck.cervical.flexion",
        [],
      ),
    ),
  );
  TestValidator.predicate(
    "malformed pose region refuses",
    throwsError((): unknown =>
      Controls.readApplied(
        { neck: null } as unknown as IAutoMovieHumanPose,
        "neck.cervical.flexion",
        [],
      ),
    ),
  );
  TestValidator.equals("poses remain authored", JSON.stringify(raw), saved);
  TestValidator.equals(
    "actual evaluation receipts remain unchanged",
    JSON.stringify(
      outputs.map(
        (
          output: AutoMovieHumanSkeleton.IOutput,
        ): AutoMovieHumanSkeleton.IClamp[] => output.clamped,
      ),
    ),
    receipts,
  );
}
