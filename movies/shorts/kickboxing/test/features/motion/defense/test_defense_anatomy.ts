import {
  type AutoMovieHumanClinicalIk,
  AutoMovieHumanRigControls,
} from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { LabActor } from "../../../../src/motion-lab/LabActor";
import { labDefenseConfig } from "../../../../src/motion-lab/labDefenseConfig";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { MotionSupportChannels } from "../../../../src/motion/core/MotionSupportChannels";
import { DefenseMotion } from "../../../../src/motion/defense/DefenseMotion";

/**
 * Connect both checking sides to the actual original Human's articulated curve.
 *
 * Scenarios:
 * 1. One real body supplies independent side contexts, guards and a hip-relative pelvis displacement.
 * 2. Internal guard/leg references stay outside external tasks and follow the same clinical pose.
 * 3. Zero-lift delivery retains the preparation WORLD frame; airborne load and landing remain distinct.
 * 4. Original WORLD support goals enter once, retaining detached errors, clamps and bounded work.
 * 5. Incoming contact holds the stopped state before connected withdrawal and explicit load acceptance.
 *
 * @evidence contracts/testing.md#observable-behavior Reuses one actual original polygon actor across both sides. Drawing matrices independently check clinical references outside external tasks. Original emitted frame goals agree at zero lift. The public whole-foot planner's actual original WORLD goals/residuals/floor and sixteen-update ceiling remain visible. Dwell, withdrawal and landing/load are separate; final displayed admission belongs to actual consumer cases.
 * @evidence contracts/testing.md#independent-cases IBA p.36 and the retained Chan check establish support-before-lift and connected return, not empirical milliseconds or angles. Exact witness identity and matrix transforms define the metre oracle; local durations remain explicit authored inputs. A single same-dimension fixture is reused across sides/phases and disposed once. Pure catch/parry cases and full two-actor collision tests own the remaining behaviors.
 */
export function test_defense_anatomy(): void {
  const actor: LabActor = new LabActor("receiver", "b", 0, 0, "left");
  try {
    const guard: Record<MotionAction.Side, DefenseMotion.Patch> = {
      left: guardPatch(actor, "left"),
      right: guardPatch(actor, "right"),
    };
    for (const side of ["left", "right"] as const) {
      const other: MotionAction.Side = side === "left" ? "right" : "left";
      const request: MotionAction.Request = {
        id: `check-${side}`,
        actorId: actor.id,
        targetId: "independent-attacker",
        side,
        leadSide: "left",
        direction: [1, 0, 0],
        timing: {
          preparation: 0.1,
          delivery: 0.12,
          contact: 0.04,
          retraction: 0.2,
          recovery: 0.1,
        },
      };
      const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
      const evasion: DefenseMotion.Config = {
        guard,
        guardBinding: "clinical",
        rootDropMetres: 0.08,
        lateralMetres: 0.05,
      };
      const weaveLeft: MotionAction.Sample = DefenseMotion.sample(
        "weave",
        request,
        context,
        0.19,
        evasion,
      );
      const weaveRight: MotionAction.Sample = DefenseMotion.sample(
        "weave",
        request,
        context,
        0.37,
        evasion,
      );
      assert.ok(weaveLeft.rootOffset[2] > 0 && weaveRight.rootOffset[2] < 0);
      assert.ok(weaveLeft.rootOffset[1] < 0 && weaveRight.rootOffset[1] < 0);
      const bone: MotionAction.Effector["bone"] =
        AutoMovieHumanRigControls.joint(`${side}LowerLeg`);
      const localPoint: MotionAction.Vec3 = [0, -0.1, 0];
      const baseline: MotionAction.Sample = {
        pose: actor.basePose,
        rootOffset: [0, 0, 0],
        support: { left: 0.5, right: 0.5 },
        effectors: [],
        phase: "idle",
        elapsed: 0,
        progress: 0,
      };
      const rest: MotionAction.Vec3 = actualPoint(
        actor,
        baseline,
        bone,
        localPoint,
      );
      const stationary: MotionAction.Vec3 = actor.basePoint(
        AutoMovieHumanRigControls.joint(`${other}Foot`),
      );
      const stationaryHip: MotionAction.Vec3 = actor.basePoint(
        AutoMovieHumanRigControls.joint(`${other}UpperLeg`),
      );
      const originalPatches: string = JSON.stringify(context.supportPatches);
      const shift: MotionAction.Vec3 = DefenseMotion.supportShift(
        context,
        side,
      );
      vector(
        [
          stationaryHip[0] + shift[0],
          stationary[1],
          stationaryHip[2] + shift[2],
        ],
        stationary,
      );
      assert.equal(shift[1], 0);
      assert.equal(JSON.stringify(context.supportPatches), originalPatches);
      assert.throws(
        (): MotionAction.Vec3 =>
          DefenseMotion.supportShift(
            { ...context, evaluatePose: undefined },
            side,
          ),
      );
      const initial: DefenseMotion.Config = {
        guard,
        guardBinding: "clinical",
        receivingReturn: "clinical",
        receiving: {
          bone,
          localPoint,
          restTarget: rest,
          target: rest,
          radius: 0.055,
        },
        supportShift: shift,
      };
      const peakPose: MotionAction.Sample = DefenseMotion.sample(
        "check",
        request,
        context,
        0.22,
        initial,
      );
      const peak: MotionAction.Vec3 = actualPoint(
        actor,
        peakPose,
        bone,
        localPoint,
      );
      const config: DefenseMotion.Config = {
        ...initial,
        receiving: { ...initial.receiving!, target: peak },
      };
      const preparing: MotionAction.Sample = DefenseMotion.sample(
        "check",
        request,
        context,
        0.05,
        config,
      );
      assert.ok(preparing.support[side] > 0 && preparing.support[side] < 0.5);
      const beforeLift: DefenseMotion.Sample = DefenseMotion.sample(
        "check",
        request,
        context,
        request.timing.preparation - Number.EPSILON,
        config,
      );
      const atLift: DefenseMotion.Sample = DefenseMotion.sample(
        "check",
        request,
        context,
        request.timing.preparation,
        config,
      );
      const beforeFrame: MotionAction.SupportPatch =
        beforeLift.support.patches!.find(
          (patch: MotionAction.SupportPatch): boolean =>
            patch.side === side && patch.mode === "free",
        )!;
      const liftFrame: MotionAction.SupportPatch = atLift.support.patches!.find(
        (patch: MotionAction.SupportPatch): boolean =>
          patch.side === side && patch.mode === "free",
      )!;
      vector(beforeFrame.world, liftFrame.world);
      const beforeTargets: readonly MotionAction.Immutable<AutoMovieHumanClinicalIk.ITarget>[] =
        context.supportTargets!(beforeFrame);
      const liftTargets: readonly MotionAction.Immutable<AutoMovieHumanClinicalIk.ITarget>[] =
        context.supportTargets!(liftFrame);
      assert.equal(beforeTargets.length, liftTargets.length);
      for (let index: number = 0; index < beforeTargets.length; index++) {
        assert.equal(beforeTargets[index]!.bone, liftTargets[index]!.bone);
        vector(
          [...beforeTargets[index]!.position],
          [...liftTargets[index]!.position],
        );
        vector(
          [...(beforeTargets[index]!.localPoint ?? [0, 0, 0])],
          [...(liftTargets[index]!.localPoint ?? [0, 0, 0])],
        );
      }
      assert.ok(actor.supportPlanning.calls > 0);
      assert.ok(
        actor.supportPlanning.last &&
          actor.supportPlanning.last.iterations <= 16,
      );
      assert.equal(actor.supportPlanning.last.status, "admitted");
      for (const time of [0, 0.16, 0.22, 0.36, 0.47, 0.56]) {
        const sample: DefenseMotion.Sample = DefenseMotion.sample(
          "check",
          request,
          context,
          time,
          config,
        );
        const guides: MotionAction.Effector[] =
          sample.clinicalWitnesses!.filter(
            (point: MotionAction.Effector): boolean => point.role === "guide",
          );
        assert.equal(guides.length, 2);
        for (const guide of guides) {
          assert.equal(guide.constraint, undefined);
          vector(
            guide.target,
            actualPoint(actor, sample, guide.bone, guide.localPoint),
          );
        }
        for (const target of sample.clinicalWitnesses!.filter(
          (point: MotionAction.Effector): boolean =>
            point.bone.endsWith("Hand"),
        ))
          vector(
            target.target,
            actualPoint(actor, sample, target.bone, target.localPoint),
          );
        assert.ok(
          !sample.effectors.some(
            (target: MotionAction.Effector): boolean =>
              target.role === "guide" || target.bone.endsWith("Hand"),
          ),
          "Clinical shape must not become an external hard or soft task",
        );
        const seed: NonNullable<LabActor["supportPlanning"]["last"]> =
          actor.supportPlanning.last!;
        assert.ok(
          seed.iterations >= 0 &&
            seed.iterations <= 16 &&
            Number.isFinite(seed.error),
        );
        const residual: number = Math.max(
          ...seed.worldTargets.map(
            (target: AutoMovieHumanClinicalIk.ITarget, index: number): number =>
              new THREE.Vector3(...target.position).distanceTo(
                new THREE.Vector3(...seed.actual[index]!),
              ),
          ),
        );
        near(seed.error, residual);
        assert.equal(seed.status, "admitted");
        assert.ok(seed.error <= 0.00025 && seed.floorMinimum >= -0.000001);
        for (const target of seed.worldTargets) {
          const original: MotionAction.SupportPatch =
            context.supportPatches!.find(
              (patch: MotionAction.SupportPatch): boolean =>
                patch.mode === "planted" && target.bone.startsWith(patch.side),
            )!;
          const goals: readonly MotionAction.Immutable<AutoMovieHumanClinicalIk.ITarget>[] =
            context.supportTargets!({
              ...original,
              frameRotation: [0, 0, 0, 1],
            });
          assert.ok(
            goals.some(
              (
                goal: MotionAction.Immutable<AutoMovieHumanClinicalIk.ITarget>,
              ): boolean =>
                goal.bone === target.bone &&
                JSON.stringify(goal.localPoint) ===
                  JSON.stringify(target.localPoint) &&
                new THREE.Vector3(...goal.position).distanceTo(
                  new THREE.Vector3(...target.position),
                ) < 1e-12,
            ),
          );
        }
        assert.ok(
          sample.preservedChannels!.includes(
            AutoMovieHumanRigControls.channel(`legs.${side}.knee.flexion`),
          ),
        );
        for (const foot of ["left", "right"] as const)
          for (const channel of MotionSupportChannels.select(foot, "planted")
            .preserved)
            assert.ok(sample.preservedChannels!.includes(channel));
        assert.ok(
          !sample.preservedChannels!.includes(
            AutoMovieHumanRigControls.channel(`legs.${other}.knee.flexion`),
          ),
        );
        assert.ok(
          !sample.preservedChannels!.includes(
            AutoMovieHumanRigControls.channel(
              `legs.${other}.foot.subtalarInversion`,
            ),
          ),
        );
        const shin: MotionAction.Effector = sample.effectors.find(
          (point: MotionAction.Effector): boolean =>
            point.bone === bone && point.role === "guard",
        )!;
        vector(shin.target, actualPoint(actor, sample, bone, localPoint));
        const patches: MotionAction.SupportPatch[] =
          sample.support.patches!.filter(
            (point: MotionAction.SupportPatch): boolean => point.side === other,
          );
        const frame: MotionAction.SupportPatch = patches.find(
          (point: MotionAction.SupportPatch): boolean => point.mode === "free",
        )!;
        const ground: MotionAction.SupportPatch = patches.find(
          (point: MotionAction.SupportPatch): boolean =>
            point.mode === "planted",
        )!;
        assert.ok(
          frame && ground,
          "The loaded side requires its frame and actual ground witness",
        );
        near(frame.world[0], actor.patches[other].low.world[0]);
        near(frame.world[2], actor.patches[other].low.world[2]);
        near(ground.world[1], 0);
        assert.equal(ground.frameRotation, undefined);
      }
      const lifted: DefenseMotion.Sample = DefenseMotion.sample(
        "check",
        request,
        context,
        0.16,
        config,
      );
      const retainedPose: MotionAction.Sample["pose"] = structuredClone(
        lifted.pose,
      );
      lifted.pose.legs!.left.hip!.flexion = 123;
      assert.deepEqual(
        DefenseMotion.sample("check", request, context, 0.16, config).pose,
        retainedPose,
        "Caller mutations cannot replace cached source clinical output",
      );
      lifted.pose = retainedPose;
      near(lifted.support[side], 0);
      near(lifted.support[other], 1);
      assert.equal(
        lifted.support.patches!.find(
          (patch: MotionAction.SupportPatch): boolean => patch.side === side,
        )!.mode,
        "free",
      );
      assert.equal(
        lifted.support.patches!.find(
          (patch: MotionAction.SupportPatch): boolean => patch.side === side,
        )!.constraint,
        "hard",
      );
      assert.ok(
        lifted.preservedChannels!.includes(
          AutoMovieHumanRigControls.channel(
            `legs.${side}.foot.subtalarInversion`,
          ),
        ),
      );
      const landing: MotionAction.Sample = DefenseMotion.sample(
        "check",
        request,
        context,
        0.47,
        config,
      );
      vector(landing.rootOffset, [0, 0, 0]);
      assert.ok(
        landing.preservedChannels!.includes(
          AutoMovieHumanRigControls.channel(`legs.${side}.ankle.dorsiflexion`),
        ),
      );
      assert.ok(
        landing.support.patches!.some(
          (patch: MotionAction.SupportPatch): boolean =>
            patch.side === side && patch.mode === "planted",
        ),
      );
      vector(
        landing.effectors.find(
          (point: MotionAction.Effector): boolean =>
            point.bone === bone && point.role === "guard",
        )!.target,
        rest,
      );
      const event: MotionAction.ContactEvent = {
        actionId: "incoming",
        actorId: request.targetId,
        targetId: actor.id,
        time: 9.7,
        relation: "shin-check",
        point: [0, 0.7, 0],
        normal: [1, 0, 0],
      };
      const contact: MotionAction.Context = {
        ...context,
        contact: { event, sample: lifted },
      };
      const released: MotionAction.Sample = DefenseMotion.sample(
        "check",
        request,
        contact,
        0.16,
        { ...config, contactElapsed: 0 },
      );
      assert.equal(released.phase, "contact");
      vector(released.effectors[0]!.target, lifted.effectors[0]!.target);
      for (const age of [0.02, 0.04]) {
        const held: MotionAction.Sample = DefenseMotion.sample(
          "check",
          request,
          contact,
          0.16 + age,
          { ...config, contactElapsed: age },
        );
        assert.equal(held.phase, "contact");
        vector(held.rootOffset, lifted.rootOffset);
        for (let index: number = 0; index < held.effectors.length; index++)
          vector(
            held.effectors[index]!.target,
            lifted.effectors[index]!.target,
          );
      }
      const returning: DefenseMotion.Sample = DefenseMotion.sample(
        "check",
        request,
        contact,
        0.3,
        { ...config, contactElapsed: 0.14 },
      );
      assert.deepEqual(
        returning.preservedChannels,
        lifted.preservedChannels,
        "Clinical return retains the actual stopped authored-foot policy through landing",
      );
      for (const guide of returning.clinicalWitnesses!.filter(
        (point: MotionAction.Effector): boolean => point.role === "guide",
      ))
        vector(guide.target, actualPoint(actor, returning, guide.bone));
      const returningShin: MotionAction.Effector =
        returning.clinicalWitnesses!.find(
          (target: MotionAction.Effector): boolean =>
            target.bone === bone && target.role === "guard",
        )!;
      vector(
        returningShin.target,
        actualPoint(
          actor,
          returning,
          returningShin.bone,
          returningShin.localPoint,
        ),
      );
      near(returning.support[side], 0);
      assert.ok(
        !returning.support.patches!.some(
          (patch: MotionAction.SupportPatch): boolean =>
            patch.side === side && patch.mode !== "free",
        ),
      );
      const landed: MotionAction.Sample = DefenseMotion.sample(
        "check",
        request,
        contact,
        0.4,
        {
          ...config,
          contactElapsed: request.timing.contact + request.timing.retraction,
        },
      );
      assert.equal(landed.phase, "recovery");
      near(landed.support[side], 0);
      assert.ok(
        landed.support.patches!.some(
          (patch: MotionAction.SupportPatch): boolean =>
            patch.side === side && patch.mode === "planted",
        ),
      );
      const accepting: MotionAction.Sample = DefenseMotion.sample(
        "check",
        request,
        contact,
        0.45,
        { ...config, contactElapsed: 0.29 },
      );
      assert.ok(accepting.support[side] > 0 && accepting.support[side] < 0.5);
      assert.ok(
        accepting.support.patches!.some(
          (patch: MotionAction.SupportPatch): boolean =>
            patch.side === side && patch.mode === "planted",
        ),
      );
      const returned: MotionAction.Sample = DefenseMotion.sample(
        "check",
        request,
        contact,
        0.5,
        {
          ...config,
          contactElapsed:
            request.timing.contact +
            request.timing.retraction +
            request.timing.recovery,
        },
      );
      assert.equal(returned.phase, "complete");
      assert.ok(
        returned.preservedChannels!.includes(
          AutoMovieHumanRigControls.channel(`legs.${side}.knee.flexion`),
        ),
      );
      near(returned.support.left, 0.5);
      near(returned.support.right, 0.5);
      for (const patch of returned.support.patches!.filter(
        (point: MotionAction.SupportPatch): boolean => point.mode === "planted",
      ))
        near(patch.world[1], 0);
      const immediate: MotionAction.Sample = DefenseMotion.sample(
        "check",
        { ...request, timing: { ...request.timing, recovery: 0 } },
        contact,
        0.39,
        { ...config, contactElapsed: 0.23 },
      );
      near(immediate.support[side], 0);
      assert.throws(
        (): MotionAction.Sample =>
          DefenseMotion.sample("guard", request, context, 0.1, {
            ...config,
            guard: {
              ...guard,
              left: {
                ...guard.left,
                target: [
                  guard.left.target[0] + 0.01,
                  guard.left.target[1],
                  guard.left.target[2],
                ],
              },
            },
          }),
      );
      assert.throws(
        (): MotionAction.Sample =>
          DefenseMotion.sample(
            "check",
            request,
            { ...context, evaluatePose: undefined },
            0.16,
            config,
          ),
      );
      assert.throws(
        (): MotionAction.Sample =>
          DefenseMotion.sample(
            "check",
            request,
            { ...context, supportTargets: undefined },
            0.16,
            config,
          ),
      );
    }
  } finally {
    actor.dispose();
  }
}

/**
 * Body punches and body kicks consume different actual protective surfaces.
 *
 * Scenarios:
 * 1. Either arm lowers its actual glove for a body-punch catch.
 * 2. A body kick meets an actual forearm brace while the other hand protects the head.
 * 3. Original independent receiving targets survive source IK and actual host fitting.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the shared configuration, source defense and same original actor through actual public FK/Grounding. It checks original carrier/local-point identity, lower receiving height, unchanged external task and final .25mm/1micrometre admission, distinguishing a real forearm brace from a renamed head glove.
 * @evidence contracts/testing.md#independent-cases Measured original Hand/glove and LowerArm surface identities define the two branches. Public clinical bounds and actual bone matrices supply independent final residuals; this portable test does not claim an observed incoming collision or force response.
 */
export function test_defense_body_guards(): void {
  const actor: LabActor = new LabActor("body-guard", "a", 0, 0);
  const failures: string[] = [];
  try {
    for (const family of ["punch", "kick"] as const)
      for (const side of ["left", "right"] as const) {
        try {
          actor.reset(0, side === "left" ? 0 : Math.PI, "left");
          const request: MotionAction.Request = {
            id: `${family}-${side}`,
            actorId: actor.id,
            targetId: "incoming",
            side,
            leadSide: "left",
            direction: [1, 0, 0],
            timing: {
              preparation: 0.1,
              delivery: 0.12,
              contact: 0.04,
              retraction: 0.2,
              recovery: 0.1,
            },
          };
          const config: DefenseMotion.Config = labDefenseConfig(
            actor,
            request,
            "catch",
            "body",
            0.22,
            family,
          );
          const original: string = JSON.stringify(config.receiving);
          assert.equal(
            config.bodyGuard,
            family === "kick" ? "forearm" : "glove",
          );
          assert.equal(
            config.receiving!.bone,
            `${side}${family === "kick" ? "LowerArm" : "Hand"}`,
          );
          assert.ok(
            config.receiving!.target[1] < config.guard[side].target[1] - 0.05,
          );
          const sample: DefenseMotion.Sample = DefenseMotion.sample(
            "catch",
            request,
            actor.context(side, [0, 0, 0]),
            0.22,
            config,
          );
          assert.equal(JSON.stringify(config.receiving), original);
          const external: MotionAction.Effector = sample.effectors.find(
            (effector: MotionAction.Effector): boolean =>
              effector.bone === config.receiving!.bone,
          )!;
          assert.ok(external);
          vector(external.target, config.receiving!.target);
          assert.deepEqual(external.localPoint, config.receiving!.localPoint);
          assert.ok(
            sample.receivingFit &&
              sample.receivingFit.iterations <= 16 &&
              sample.receivingFit.error <= 0.00025,
          );
          actor.apply(sample);
          assert.equal(actor.support?.status, "admitted");
          assert.ok(actor.support!.floorMinimum >= -0.000001);
          assert.ok(
            actor.errors.every(
              (error: { error: number }): boolean => error.error <= 0.00025,
            ),
          );
          const other: MotionAction.Side = side === "left" ? "right" : "left";
          const guard: MotionAction.Effector = sample.clinicalWitnesses!.find(
            (effector: MotionAction.Effector): boolean =>
              effector.bone === `${other}Hand`,
          )!;
          assert.ok(guard && guard.target[1] > external.target[1] + 0.05);
          vector(
            guard.target,
            actor.person.object
              .worldToLocal(new THREE.Vector3(...actor.effector(guard)))
              .toArray(),
          );
        } catch (error: unknown) {
          failures.push(
            `${family}/${side}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    assert.equal(failures.length, 0, failures.join("\n"));
  } finally {
    actor.dispose();
  }
}

/** Read the actual hand-bound baseline pad already measured by the actor. */
function guardPatch(
  actor: LabActor,
  side: MotionAction.Side,
): DefenseMotion.Patch {
  const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
  return {
    bone: AutoMovieHumanRigControls.joint(`${side}Hand`),
    localPoint: context.geometry.handLocalPoint,
    target: context.geometry.hand!,
    radius: context.geometry.gloveRadiusMetres!,
  };
}

/** Read the actual original polygon bone matrix under the complete supplied pose. */
function actualPoint(
  actor: LabActor,
  sample: MotionAction.Sample,
  bone: MotionAction.Effector["bone"],
  local: MotionAction.Vec3 = [0, 0, 0],
): MotionAction.Vec3 {
  actor.person.pose(sample.pose);
  actor.person.object.updateWorldMatrix(true, true);
  const group: THREE.Group | undefined = actor.person.drawing.bones.get(bone);
  if (!group) throw new Error(`Missing actual guide bone ${bone}`);
  return actor.person.object
    .worldToLocal(group.localToWorld(new THREE.Vector3(...local)))
    .toArray();
}

/** Matrix/FK agreement uses one micrometre, separate from physical admission. */
function near(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-6,
    `${actual} differs from ${expected}`,
  );
}

/** Compare an independent actual-drawing metre oracle component by component. */
function vector(actual: MotionAction.Vec3, expected: MotionAction.Vec3): void {
  for (const axis of [0, 1, 2] as const) near(actual[axis], expected[axis]);
}
