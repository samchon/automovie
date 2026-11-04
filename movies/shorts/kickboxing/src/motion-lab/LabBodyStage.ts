import { AutoMovieHumanRigControls } from "@automovie/human";

import type { MotionAction } from "../motion/core/MotionAction";
import { MotionSupportChannels } from "../motion/core/MotionSupportChannels";
import { LabArmAnatomy } from "./LabArmAnatomy";
import type { LabArmWriter } from "./LabArmWriter";
import { LabPlacement } from "./LabPlacement";

/**
 * Copy the two declared stages without deriving new world tasks from their achieved result.
 * @evidence contracts/common.md#implementation-and-ownership Body preparation retains authored relative foot articulation and original support goals. Arm consumption copies only the separately authored arms into the realized body; root and lower-body pose cannot be changed by that stage.
 * @evidence contracts/common.md#authoring-interface Body placement is immutable input, while each mutable sample is owned by its consumer. No achieved contact replaces the requested support anchor or independent opponent aim.
 */
export namespace LabBodyStage {
  /**
   * Make a support-only request at the existing solver boundary.
   * @evidence contracts/common.md#implementation-and-ownership Optional original body tasks, including a kick's leg strike, remain independent copied goals in the body solve. Foot shape channels stay authored while the host realizes the original frame and load plan; subsequent arm writers cannot replace those body tasks.
   * @evidence contracts/common.md#authoring-interface The synthetic idle clock denotes preparation, not technique or film time. The host retains requested body tasks for final fixed-body residual checks after applying arms. Omission preserves support-only preparation.
   */
  export function sample(
    plan: MotionAction.BodyPlacement,
    bodyEffectors: readonly MotionAction.Effector[] = [],
  ): MotionAction.Sample {
    return {
      pose: structuredClone(plan.pose),
      rootOffset: [...plan.rootOffset],
      ...(plan.rootRotation ? { rootRotation: [...plan.rootRotation] } : {}),
      support: copySupport(plan.support),
      effectors: structuredClone(bodyEffectors) as MotionAction.Effector[],
      preservedChannels: [
        ...new Set([
          ...(plan.preservedChannels ?? []),
          ...(["left", "right"] as const).flatMap(
            (
              side: MotionAction.Side,
            ): AutoMovieHumanRigControls.DegreeChannel[] =>
              MotionSupportChannels.select(side, "planted").preserved,
          ),
        ]),
      ],
      phase: "idle",
      elapsed: 0,
      progress: 0,
    };
  }

  /**
   * Apply arm authoring to a previously realized body without a second body policy.
   * @evidence contracts/common.md#implementation-and-ownership Only the named arm is replaced; the continuing other arm, realized lower-body, trunk and root remain the same pose. Original planned support world tasks are copied rather than measured from the achieved feet.
   * @evidence contracts/common.md#authoring-interface Only the named arm pose and locks are authoritative; other pose regions are ignored in favor of placement. Root/support must match the host frame. The actor's arm-only solver still must pass all original support, floor and loaded-foot checks.
   */
  export function arm(
    sample: MotionAction.Sample,
    placement: MotionAction.BodyPlacement,
    side: MotionAction.Side,
  ): MotionAction.Sample {
    if (side !== "left" && side !== "right")
      throw new Error("Arm writer requires an anatomical side");
    if (!LabPlacement.sameFrame(sample, placement))
      throw new Error(
        "Arm writer must consume the single realized root and support",
      );
    if (
      sample.effectors.some(
        (effector: MotionAction.Effector): boolean =>
          !LabArmAnatomy.contains(effector.bone, side),
      )
    )
      throw new Error("Arm writer requires its own anatomical arm task");
    const selected:
      | NonNullable<MotionAction.Sample["pose"]["arms"]>["left"]
      | undefined = sample.pose.arms?.[side];
    if (!selected)
      throw new Error("Arm writer requires its explicitly authored arm");
    const pose: MotionAction.Sample["pose"] = structuredClone(placement.pose);
    pose.arms = {
      left: pose.arms?.left ?? {},
      right: pose.arms?.right ?? {},
      [side]: structuredClone(selected),
    };
    return {
      ...structuredClone(sample),
      pose,
      rootOffset: [...placement.rootOffset],
      rootRotation: placement.rootRotation
        ? [...placement.rootRotation]
        : undefined,
      support: copySupport(placement.support),
      preservedChannels: [
        ...new Set([
          ...(placement.preservedChannels ?? []),
          ...(sample.preservedChannels ?? []).filter(
            (channel: AutoMovieHumanRigControls.DegreeChannel): boolean =>
              channel.startsWith(`arms.${side}.`),
          ),
        ]),
      ],
    };
  }

  /**
   * Merge disjoint arm writers without averaging independent tasks or support plans.
   * @evidence contracts/common.md#implementation-and-ownership Validates every writer and rejects duplicate sides or conflicting root/orientation/support values before constructing output. Only each named arm is copied; each external task and preserved same-side channel retains its source authority, while the single placement owns all body and support fields.
   * @evidence contracts/common.md#authoring-interface One or two writers are accepted. Channels are unique public own-side arm paths and arm tasks exclude feet and eyes. Optional retainedBodyEffectors are the host's original non-arm WORLD goals reexpressed at this realized root, never new arm goals. Local clocks, body locks and closed support variants remain with their existing owners.
   */
  export function arms(
    writers: readonly LabArmWriter[],
    placement: MotionAction.BodyPlacement,
    retainedBodyEffectors: readonly MotionAction.Effector[] = [],
  ): MotionAction.Sample {
    const sides: Set<MotionAction.Side> = new Set();
    if (writers.length < 1 || writers.length > 2)
      throw new Error("One or two explicit arm writers are required");
    const bodyKeys: string[] = retainedBodyEffectors.map(
      (effector: MotionAction.Effector): string =>
        JSON.stringify([
          effector.bone,
          effector.localPoint ?? [0, 0, 0],
          effector.role,
          effector.constraint ?? "hard",
        ]),
    );
    if (
      new Set(bodyKeys).size !== bodyKeys.length ||
      retainedBodyEffectors.some(
        (effector: MotionAction.Effector): boolean =>
          !AutoMovieHumanRigControls.isJoint(effector.bone) ||
          LabArmAnatomy.contains(effector.bone),
      )
    )
      throw new Error("Retained body tasks must be unique non-arm goals");
    for (const writer of writers) {
      if (sides.has(writer.side))
        throw new Error(`Duplicate arm writer: ${writer.side}`);
      sides.add(writer.side);
      if (!LabPlacement.sameFrame(writer.sample, placement))
        throw new Error(
          "Arm writer must consume the single realized root and support",
        );
      if (
        writer.channels.length === 0 ||
        new Set(writer.channels).size !== writer.channels.length ||
        writer.channels.some(
          (channel: AutoMovieHumanRigControls.DegreeChannel): boolean =>
            !channel.startsWith(`arms.${writer.side}.`) ||
            AutoMovieHumanRigControls.channel(channel) !== channel,
        )
      )
        throw new Error(
          "Arm writer channels must be unique own-side public paths",
        );
      if (
        writer.sample.effectors.some(
          (effector: MotionAction.Effector): boolean =>
            !LabArmAnatomy.contains(effector.bone, writer.side),
        )
      )
        throw new Error("Arm writer requires its own anatomical arm task");
    }
    let output: MotionAction.Sample = sample(placement);
    const bodyPreserved: readonly AutoMovieHumanRigControls.DegreeChannel[] =
      output.preservedChannels ?? [];
    for (const writer of writers)
      output = arm(
        writer.sample,
        {
          pose: output.pose,
          rootOffset: placement.rootOffset,
          rootRotation: placement.rootRotation,
          preservedChannels: output.preservedChannels,
          support: placement.support,
        },
        writer.side,
      );
    output.effectors = [
      ...structuredClone(retainedBodyEffectors),
      ...writers.flatMap((writer: LabArmWriter): MotionAction.Effector[] =>
        structuredClone(writer.sample.effectors),
      ),
    ];
    output.preservedChannels = [
      ...new Set([
        ...bodyPreserved,
        ...writers.flatMap(
          (writer: LabArmWriter): AutoMovieHumanRigControls.DegreeChannel[] =>
            [...(writer.sample.preservedChannels ?? [])].filter(
              (channel: AutoMovieHumanRigControls.DegreeChannel): boolean =>
                channel.startsWith(`arms.${writer.side}.`),
            ),
        ),
      ]),
    ];
    return output;
  }

  /** Preserve tuples while copying an immutable declared support request. */
  function copySupport(
    support: MotionAction.Immutable<MotionAction.Support>,
  ): MotionAction.Support {
    return structuredClone(support) as MotionAction.Support;
  }
}
