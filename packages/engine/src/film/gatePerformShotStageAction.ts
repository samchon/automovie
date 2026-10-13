import {
  IAutoMovieActionCall,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { armChainFault } from "../kinematics/armChainFault";
import { classifyLocomoteGroundDisplacement } from "../motion/classifyLocomoteGroundDisplacement";
import { POSITIONAL_TARGET_SHAPE } from "../perform/constants/POSITIONAL_TARGET_SHAPE";
import { ViolationCollector } from "../validation/ViolationCollector";
import { isRecord } from "../validation/isRecord";
import { IPerformShotActionPlan } from "./IPerformShotActionPlan";
import { IPerformShotGateContext } from "./IPerformShotGateContext";
import { resolvePerformShotTarget } from "./resolvePerformShotTarget";
import { validatePerformShotId } from "./validatePerformShotId";

/**
 * Gate the verb-specific fields of one non-`frame` action, and record the
 * `launch` and `attachTo` jobs that pass.
 *
 * Per verb, at `<base>[i]`:
 *
 * - `locomote`: a gait the actor's own context lists, when gaits were supplied,
 *   and a non-relative destination that resolves at the action's start and
 *   leaves each staged actor horizontal travel, since a vertical-only move is
 *   not a walk.
 * - `launch`: a positive finite speed, an `onHit` force in `[0, 1]`, a staged
 *   projectile that is not one of the launching actors, an aim that resolves
 *   and is not the projectile itself, and no `onHit` aimed at a camera, because
 *   the injected recoil would name a camera as a performer.
 * - `enact`: a non-blank clip id, since an empty one can never resolve.
 * - `react`: a force in `[0, 1]` and a blow source that resolves, because the
 *   reference synthesizer otherwise snaps the body back as if struck from the
 *   front.
 * - `emote`: an intensity in `[0, 1]`.
 * - `lookAt` and `reach`: a target that resolves; `reach` also needs a rig
 *   whose elbow can bend the named arm.
 * - `point` and `strike` gestures: a right arm that can bend, because the
 *   reference synthesizer solves that arm, and an aim that resolves.
 * - `attachTo`: a child that is not its own parent and a parent that is a
 *   rigged staged node carrying the named bone.
 * - `hold`: nothing beyond the shared checks.
 *
 * An unbendable arm is refused here because the synthesizer answers such a
 * verb with `null` and the builder skips a `null` clip, so the shot would
 * otherwise succeed having performed nothing.
 *
 * @param context The shot's staged tables and collector.
 * @param plan The plan being built; passing launches and attachments join it.
 * @param action The non-`frame` action.
 * @param actors The actor ids the action names.
 * @param index Position of the action in the performing action list.
 *
 * @evidence contracts/common.md#principled-implementation Each verb's fields are checked against the domain its consumer requires, the gait against the actor's vocabulary, forces against `[0, 1]`, arms against the rig's own elbow geometry through `armChainFault`, and a locomote destination against `classifyLocomoteGroundDisplacement`, so an action that passes is one the synthesizer and compilers can realize.
 * @evidence contracts/common.md#clear-and-simple-design The verb dispatch of the action gate, separate from the checks every action shares in `gatePerformShotActions`; target resolution is `resolvePerformShotTarget` and id checks `validatePerformShotId`, both shared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor, gait or prop is special-cased; a `null` synthesis is prevented by refusing the action that would produce it rather than by accepting an empty clip, and a camera aim stays legal for a launch without `onHit`.
 * @evidence contracts/common.md#meaningful-documentation States every verb's requirements and the reason behind the non-obvious ones, why an unbendable arm is refused here, and which jobs are recorded.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per verb plus the actor list for gait, travel and arm checks; an arm check reads one rig's chain per actor.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Gates one action per call; the staged tables are the shared context's.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Appends at most one job to the caller's plan and retains nothing itself.
 */
export const gatePerformShotStageAction = (
  context: IPerformShotGateContext,
  plan: IPerformShotActionPlan,
  action: Exclude<IAutoMovieActionCall, { verb: "frame" }>,
  actors: readonly string[],
  index: number,
): void => {
  const path: string = `${context.base}[${index}]`;
  const out: ViolationCollector = context.out;
  switch (action.verb) {
    case "locomote": {
      if (context.gaits !== undefined)
        for (const actor of actors) {
          const available: readonly string[] | undefined =
            context.gaits(actor);
          if (available !== undefined && !available.includes(action.gait))
            out.push(
              "type",
              `${path}.gait`,
              `locomote gait "${action.gait}" is not one of actor "${actor}"'s gaits (${
                available.length === 0 ? "none supplied" : available.join(", ")
              })`,
              action.gait,
            );
        }
      const relative: boolean =
        isRecord(action.to) &&
        (action.to.kind === "direction" || action.to.kind === "offscreen");
      if (relative) return;
      const destination: IAutoMovieVector3 | null = resolvePerformShotTarget(
        context,
        {
          target: action.to,
          path: `${path}.to`,
          label: "locomote target",
          subject: "a locomote destination",
          seconds: action.start,
          formationsFramed: false,
        },
      );
      if (destination === null) return;
      for (const actor of actors) {
        if (!context.nodeIds.has(actor)) continue;
        const origin: IAutoMovieVector3 = context.nodePositions.get(actor)!;
        const displacement: ReturnType<
          typeof classifyLocomoteGroundDisplacement
        > = classifyLocomoteGroundDisplacement({
          x: destination.x - origin.x,
          y: destination.y - origin.y,
          z: destination.z - origin.z,
        });
        if (displacement.verticalOnly)
          out.push(
            "range",
            `${path}.to`,
            `actor "${actor}" cannot locomote to a vertical-only destination (${Math.abs(destination.y - origin.y)} m height change with ${displacement.groundDistance} m XZ travel); choose a walkable ground point with horizontal travel or use another action verb`,
            action.to,
          );
      }
      return;
    }
    case "launch": {
      if (!Number.isFinite(action.speed) || !(action.speed > 0))
        out.push(
          "range",
          `${path}.speed`,
          `a launch speed must be a finite number > 0 m/s, but was ${action.speed}`,
          action.speed,
        );
      if (
        action.onHit !== undefined &&
        !(action.onHit.force >= 0 && action.onHit.force <= 1)
      )
        out.push(
          "range",
          `${path}.onHit.force`,
          `reaction force must be within [0, 1], but was ${action.onHit.force}`,
          action.onHit.force,
        );
      validatePerformShotId(
        out,
        action.projectile,
        `${path}.projectile`,
        "launch projectile id",
      );
      const target: IAutoMovieVector3 | null = resolvePerformShotTarget(
        context,
        {
          target: action.at,
          path: `${path}.at`,
          label: "launch target",
          subject: "a launch target",
          seconds: 0,
          formationsFramed: false,
        },
      );
      const aimNode: string | null =
        isRecord(action.at) &&
        (action.at.kind === "node" || action.at.kind === "bone") &&
        typeof action.at.node === "string"
          ? action.at.node
          : null;
      // A camera is a place to aim at, never a performer, but `onHit` injects
      // a recoil naming the struck id past the actor gate above.
      if (
        action.onHit !== undefined &&
        aimNode !== null &&
        context.cameraIds.has(aimNode)
      )
        out.push(
          "type",
          `${path}.at`,
          `a launch's onHit recoils the id it strikes, but "${aimNode}" is a camera, and a camera performs nothing but frame; drop onHit to shoot at the lens, or aim at a staged scene node`,
          action.at,
        );
      const stagedProjectile: boolean = context.nodeIds.has(action.projectile);
      if (!stagedProjectile)
        out.push(
          "type",
          `${path}.projectile`,
          `a launch's projectile "${action.projectile}" must be a staged scene node`,
          action.projectile,
        );
      if (actors.includes(action.projectile))
        out.push(
          "type",
          `${path}.projectile`,
          `a launch's projectile "${action.projectile}" cannot also be a launching actor`,
          action.projectile,
        );
      if (
        isRecord(action.at) &&
        action.at.kind === "node" &&
        action.at.node === action.projectile
      )
        out.push(
          "type",
          `${path}.at`,
          `a launch's projectile "${action.projectile}" cannot target itself`,
          action.at,
        );
      if (stagedProjectile && target !== null)
        plan.launches.push({
          action,
          index,
          origin: context.nodePositions.get(action.projectile)!,
          target,
          targetNode: aimNode,
        });
      return;
    }
    case "enact":
      validatePerformShotId(out, action.clip, `${path}.clip`, "enact clip id");
      return;
    case "react":
      if (!(action.force >= 0 && action.force <= 1))
        out.push(
          "range",
          `${path}.force`,
          `reaction force must be within [0, 1], but was ${action.force}`,
          action.force,
        );
      resolvePerformShotTarget(context, {
        target: action.from,
        path: `${path}.from`,
        label: "react source",
        subject: "a react source",
        seconds: 0,
        formationsFramed: false,
      });
      return;
    case "emote":
      if (!(action.intensity >= 0 && action.intensity <= 1))
        out.push(
          "range",
          `${path}.intensity`,
          `emote intensity must be within [0, 1], but was ${action.intensity}`,
          action.intensity,
        );
      return;
    case "lookAt":
      resolvePerformShotTarget(context, {
        target: action.to,
        path: `${path}.to`,
        label: "lookAt target",
        subject: "a lookAt target",
        seconds: 0,
        formationsFramed: false,
      });
      return;
    case "reach":
      resolvePerformShotTarget(context, {
        target: action.to,
        path: `${path}.to`,
        label: "reach target",
        subject: "a reach target",
        seconds: 0,
        formationsFramed: false,
      });
      refuseUnbendableArm(context, action.hand, `${path}.hand`, actors);
      return;
    case "gesture":
      if (action.kind !== "point" && action.kind !== "strike") return;
      refuseUnbendableArm(context, "right", `${path}.kind`, actors);
      if (action.at !== undefined)
        resolvePerformShotTarget(context, {
          target: action.at,
          path: `${path}.at`,
          label: `${action.kind} gesture target`,
          subject: `a ${action.kind} gesture target`,
          seconds: 0,
          formationsFramed: false,
        });
      else
        out.push(
          "type",
          `${path}.at`,
          `a ${action.kind} gesture target must resolve to a point (${POSITIONAL_TARGET_SHAPE}), but none was given`,
          action.at,
        );
      return;
    case "attachTo": {
      for (const child of actors)
        if (child === action.parent)
          out.push(
            "type",
            `${path}.actor`,
            `an attachTo child "${child}" cannot attach to itself`,
            child,
          );
      validatePerformShotId(
        out,
        action.parent,
        `${path}.parent`,
        "attach parent id",
      );
      if (!context.nodeIds.has(action.parent)) {
        out.push(
          "type",
          `${path}.parent`,
          `an attachTo parent "${action.parent}" must be a staged scene node`,
          action.parent,
        );
        return;
      }
      const rig: IAutoMovieSkeleton | null = context.skeleton(action.parent);
      if (rig === null)
        out.push(
          "type",
          `${path}.parent`,
          `an attachTo parent "${action.parent}" must have a rig to attach a bone of`,
          action.parent,
        );
      else if (
        !rig.bones.some(
          (bone: IAutoMovieSkeleton["bones"][number]): boolean =>
            bone.bone === action.bone,
        )
      )
        out.push(
          "type",
          `${path}.bone`,
          `bone "${action.bone}" is not on ${action.parent}'s skeleton`,
          action.bone,
        );
      else plan.attachments.push({ action, index });
      return;
    }
    case "hold":
      return;
  }
};

/** Refuse an arm verb asked of a rig whose elbow cannot bend that arm. */
const refuseUnbendableArm = (
  context: IPerformShotGateContext,
  side: "left" | "right",
  path: string,
  performers: readonly string[],
): void => {
  for (const performer of performers) {
    const rig: IAutoMovieSkeleton | null = context.skeleton(performer);
    if (rig === null) continue;
    const fault: ReturnType<typeof armChainFault> = armChainFault(rig, side);
    if (fault === null) continue;
    context.out.push(
      "type",
      path,
      `"${performer}" cannot perform an arm verb on its ${side} arm: ${fault.reason}`,
      side,
    );
  }
};
