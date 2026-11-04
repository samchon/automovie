import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSupportFrame,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { LabActor } from "../../../../src/motion-lab/LabActor";
import type { LabFootworkStance } from "../../../../src/motion-lab/LabFootworkStance";
import { labFootworkSample } from "../../../../src/motion-lab/labFootworkSample";
import { requireLabSupport } from "../../../../src/motion-lab/requireLabSupport";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { FootworkMotion } from "../../../../src/motion/defense/FootworkMotion";

/**
 * Cross-check the public measurement hook against actual displayed bone matrices and full feet.
 * @evidence contracts/testing.md#observable-behavior One original CPU polygon actor supplies both anatomical feet and a pi world heading. Each authored roll is applied directly to its real bone graph; independent native vertex extrema and world quaternions are compared with the shared measurement callback. Caller X/Z, exact metadata and actor state remain unchanged.
 * @evidence contracts/testing.md#independent-cases Zero, intermediate and full roll distinguish the free elevated frame from its separate minimum-vertex ground contact. The oracle reads every emitted foot/toe vertex and the contact's native bone matrix. The same immutable context remains usable after drawing retirement without a rendering dependency.
 */
export function test_support_frame_actual_geometry(): void {
  const actor: LabActor = new LabActor("frame", "b", 0.7, Math.PI);
  let retired: boolean = false;
  try {
    let detached: (() => MotionAction.SupportMeasurement) | undefined;
    let expected: string | undefined;
    for (const side of ["left", "right"] as const) {
      actor.reset(0.7, Math.PI, "left");
      const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
      const patch: MotionAction.SupportPatch = {
        ...structuredClone(actor.patches[side].pivot),
        mode: "free",
        constraint: "hard",
      };
      patch.world[0] += 0.03;
      patch.world[2] -= 0.04;
      const carrier: THREE.Group = actor.person.drawing.bones.get(patch.bone)!;
      const initial: THREE.Quaternion = carrier.getWorldQuaternion(
        new THREE.Quaternion(),
      );
      for (const progress of [0, 0.4, 1]) {
        const pose: IAutoMovieHumanPose = structuredClone(actor.basePose);
        pose.legs![side].ankle = {
          ...pose.legs![side].ankle,
          dorsiflexion:
            (pose.legs![side].ankle?.dorsiflexion ?? 0) - 12 * progress,
        };
        pose.legs![side].foot = {
          ...pose.legs![side].foot,
          hallux: { mtpFlexion: -20 * progress },
          second: { mtpFlexion: -20 * progress },
          third: { mtpFlexion: -20 * progress },
          fourth: { mtpFlexion: -20 * progress },
          fifth: { mtpFlexion: -20 * progress },
        };
        const rootOffset: MotionAction.Vec3 = [0.02, -0.01, 0.03];
        actor.person.object.position.copy(
          new THREE.Vector3(...rootOffset)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), actor.yaw)
            .add(actor.origin),
        );
        actor.person.pose(pose);
        const actualPoint: THREE.Vector3 = carrier.localToWorld(
          new THREE.Vector3(...patch.localPoint),
        );
        let minimum: number = Infinity;
        for (const [bone, mesh] of actor.person.drawing.parts) {
          if (
            !bone.startsWith(side) ||
            !/(Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth)/u.test(
              bone,
            )
          )
            continue;
          const attribute:
            | THREE.BufferAttribute
            | THREE.InterleavedBufferAttribute =
            mesh.geometry.getAttribute("position");
          for (let index: number = 0; index < attribute.count; index++)
            minimum = Math.min(
              minimum,
              mesh.localToWorld(
                new THREE.Vector3().fromBufferAttribute(attribute, index),
              ).y,
            );
        }
        const before: string = JSON.stringify({
          root: actor.person.object.position.toArray(),
          output: actor.person.output,
        });
        const measurement: MotionAction.SupportMeasurement =
          context.supportFrame!(pose, rootOffset, patch);
        const measured: MotionAction.SupportPatch = measurement.frame;
        assert.equal(
          JSON.stringify({
            root: actor.person.object.position.toArray(),
            output: actor.person.output,
          }),
          before,
        );
        assert.equal(measured.world[0], patch.world[0]);
        assert.equal(measured.world[2], patch.world[2]);
        assert.ok(
          Math.abs(measured.world[1] - (actualPoint.y - minimum)) < 1e-9,
        );
        const rotation: THREE.Quaternion = carrier
          .getWorldQuaternion(new THREE.Quaternion())
          .multiply(initial.clone().invert());
        assert.ok(
          rotation.angleTo(new THREE.Quaternion(...measured.frameRotation!)) <
            1e-7,
        );
        assert.equal(measured.mode, "free");
        assert.equal(measured.constraint, "hard");
        assert.deepEqual(measured.initialWorld, patch.initialWorld);
        const contact: MotionAction.SupportPatch = measurement.contact;
        assert.equal(contact.mode, "planted");
        assert.equal(contact.constraint, "hard");
        assert.equal(contact.frameRotation, undefined);
        assert.equal(contact.world[1], 0);
        assert.ok(
          actor
            .footPoints(side)
            .some(
              (point: AutoMovieHumanSupportFrame.IPoint): boolean =>
                point.bone === contact.bone &&
                point.localPoint.every(
                  (value: number, index: number): boolean =>
                    value === contact.localPoint[index],
                ),
            ),
        );
        const contactPoint: THREE.Vector3 = actor.person.drawing.bones
          .get(contact.bone)!
          .localToWorld(new THREE.Vector3(...contact.localPoint));
        const placementDelta: THREE.Vector3 = new THREE.Vector3(
          ...measured.world,
        ).sub(actualPoint);
        assert.ok(
          Math.abs(contactPoint.y - minimum) < 1e-9,
          "Contact must be an actual native full-foot minimum",
        );
        assert.ok(
          contactPoint
            .add(placementDelta)
            .distanceTo(new THREE.Vector3(...contact.world)) < 1e-9,
          "Frame and contact must describe the same rigid placement",
        );
        assert.ok(Math.abs(minimum + placementDelta.y) < 1e-9);
        if (progress === 1) {
          detached = (): MotionAction.SupportMeasurement =>
            context.supportFrame!(pose, rootOffset, patch);
          expected = JSON.stringify(measurement);
        }
      }
    }
    const source: AutoMovieHumanSupportFrame.IPoint[] =
      actor.footPoints("left");
    const original: number = source[0]!.localPoint[0];
    source[0]!.localPoint[0] += 100;
    assert.equal(actor.footPoints("left")[0]!.localPoint[0], original);
    actor.dispose();
    retired = true;
    assert.equal(JSON.stringify(detached!()), expected);
  } finally {
    if (!retired) actor.dispose();
  }
}

/**
 * Zero route displacement retains the declared WORLD tuple through a nonzero heading.
 * @evidence contracts/testing.md#observable-behavior Calls the actual Footwork producer and Human adapter on a real original actor at a nonzero yaw. Both source goals deliberately retain a50micrometre admitted offset from their achieved points. At zero displacement frame and plant targets must equal those original tuples exactly, exposing inverse/forward roundtrip drift or achieved-target substitution.
 * @evidence contracts/testing.md#independent-cases Direct producer offsets independently establish zero, while literal source tuple copies establish authority. The existing FilmRoute consumer test separately compares a40mm moving endpoint against a rotated world displacement and exercises compose/adopt/reverse seeking. Full native geometry remains in the actual adapter and no target tolerance replaces equality.
 */
export function test_support_frame_declared_route_world(): void {
  const actor: LabActor = new LabActor(
    "declared-route",
    "a",
    0.123,
    0.43,
    "left",
    -0.217,
  );
  try {
    const source: LabFootworkStance = {
      pose: structuredClone(actor.basePose),
      origin: actor.origin.toArray(),
      patches: {
        left: structuredClone(actor.patches.left.low),
        right: structuredClone(actor.patches.right.low),
      },
    };
    source.patches.left.world[0] += 0.00005;
    source.patches.right.world[0] += 0.00005;
    const feet: Record<MotionAction.Side, MotionAction.Vec3> = {
      left: actor.local(source.patches.left.world),
      right: actor.local(source.patches.right.world),
    };
    const motion: FootworkMotion = new FootworkMotion(actor.id, feet, [
      {
        start: 0,
        unload: 0.1,
        swing: 0.2,
        load: 0.1,
        follow: 0.2,
        settle: 0.1,
        first: "left",
        displacement: [0.04, 0, 0],
        clearance: 0.02,
      },
    ]);
    const route: FootworkMotion.Sample = motion.sample(0);
    assert.deepEqual(route.feet.left.offset, [0, 0, 0]);
    assert.deepEqual(route.feet.right.offset, [0, 0, 0]);
    const sample: MotionAction.Sample = labFootworkSample(
      actor,
      route,
      0,
      motion.duration,
      source,
    );
    for (const side of ["left", "right"] as const)
      for (const patch of sample.support.patches!.filter(
        (point: MotionAction.SupportPatch): boolean => point.side === side,
      ))
        assert.deepEqual(patch.world, source.patches[side].world);
    assert.notStrictEqual(
      sample.support.patches![0]!.world,
      source.patches.left.world,
    );
  } finally {
    actor.dispose();
  }
}

/**
 * Fit actual low-point frames while preserving a distinct requested root and fixed world oracle.
 * @evidence contracts/testing.md#observable-behavior Original native low witnesses deliberately differ from the calibrated forefoot frame. Both frame/contact pairs fit in one public Grounding configuration, with clinical leg channels preserved and a vertically displaced requested root. The applied root, original requested root and direct native hand residual remain separate.
 * @evidence contracts/testing.md#independent-cases This catches using a side's unrelated pivot centre for another bone, counting a free frame as loaded support, and recomputing a hand target around the fitted root. It uses actual polygon vertices, the real solver and the unchanged hard/floor tolerances.
 */
export function test_support_frame_root_and_world_targets(): void {
  const actor: LabActor = new LabActor("root", "a", 0, 0);
  try {
    const context: MotionAction.Context = actor.context("left", [0, 0, 0]);
    const patches: MotionAction.SupportPatch[] = (
      ["left", "right"] as const
    ).flatMap((side: MotionAction.Side): MotionAction.SupportPatch[] => {
      const measured: MotionAction.SupportMeasurement = context.supportFrame!(
        actor.basePose,
        [0, 0.02, 0],
        actor.patches[side].low,
      );
      return [measured.frame, measured.contact];
    });
    const originalRoot: THREE.Vector3 = actor.origin
      .clone()
      .add(new THREE.Vector3(0, 0.02, 0));
    const expectedHand: THREE.Vector3 = new THREE.Vector3(
      ...context.geometry.hand!,
    ).add(originalRoot);
    const effector: MotionAction.Effector = {
      bone: "leftHand",
      localPoint: context.geometry.handLocalPoint,
      target: context.geometry.hand!,
      role: "guard",
      radius: 0,
    };
    const preservedChannels: AutoMovieHumanRigControls.DegreeChannel[] = (
      ["left", "right"] as const
    ).flatMap(
      (side: MotionAction.Side): AutoMovieHumanRigControls.DegreeChannel[] =>
        AutoMovieHumanRigControls.chain({ region: "leg", side }),
    );
    actor.apply({
      pose: structuredClone(actor.basePose),
      rootOffset: [0, 0.02, 0],
      effectors: [effector],
      preservedChannels,
      support: { left: 0.5, right: 0.5, patches },
      phase: "preparation",
      elapsed: 0,
      progress: 0,
    });
    const result: {
      requestedRoot: { translation: MotionAction.Vec3 };
      appliedRoot: MotionAction.Vec3;
      rootDelta: MotionAction.Vec3;
      actualWorldGoals: { position: MotionAction.Vec3 }[];
      loadedGround: { grounded: boolean }[];
    } = actor.inspect() as {
      requestedRoot: { translation: MotionAction.Vec3 };
      appliedRoot: MotionAction.Vec3;
      rootDelta: MotionAction.Vec3;
      actualWorldGoals: { position: MotionAction.Vec3 }[];
      loadedGround: { grounded: boolean }[];
    };
    assert.deepEqual(result.requestedRoot.translation, originalRoot.toArray());
    assert.deepEqual(
      result.appliedRoot,
      actor.person.object.position.toArray(),
    );
    assert.ok(
      Math.abs(result.rootDelta[1]) > 0.01,
      "Fixed legs require a visible root correction",
    );
    assert.ok(
      new THREE.Vector3(...result.actualWorldGoals[0]!.position).distanceTo(
        expectedHand,
      ) < 1e-12,
    );
    assert.ok(
      Math.abs(
        actor.errors[0]!.error -
          new THREE.Vector3(...actor.effector(effector)).distanceTo(
            expectedHand,
          ),
      ) < 1e-12,
    );
    assert.equal(actor.support?.status, "admitted");
    assert.ok(
      result.loadedGround.every(
        (side: { grounded: boolean }): boolean => side.grounded,
      ),
    );
    assert.ok(actor.support!.floorMinimum >= -0.000001);
  } finally {
    actor.dispose();
  }
}

/**
 * A hard unloaded trajectory cannot satisfy a loaded-side ground-support requirement.
 * @evidence contracts/testing.md#observable-behavior The actual actor refuses a two-foot load request whose exact low witnesses are both hard/free before it mutates the displayed supported guard. The closed support contract requires a retained patch for each explicitly loaded foot.
 * @evidence contracts/testing.md#independent-cases Original source geometry and physical tolerances remain unchanged; only the support relationship is invalid. The actual consumer's immutable snapshot catches scalar-load acceptance and mode/constraint conflation without replacing a solver.
 */
export function test_support_frame_loaded_role(): void {
  const actor: LabActor = new LabActor("load", "a", 0, 0);
  try {
    actor.apply({
      pose: structuredClone(actor.basePose),
      rootOffset: [0, 0, 0],
      effectors: [],
      support: {
        left: 0.5,
        right: 0.5,
        patches: [actor.patches.left.low, actor.patches.right.low],
      },
      phase: "preparation",
      elapsed: 0,
      progress: 0,
    });
    const before: string = JSON.stringify(actor.constrained());
    assert.throws((): void =>
      actor.apply({
        pose: structuredClone(actor.basePose),
        rootOffset: [0, 0, 0],
        effectors: [],
        support: {
          left: 0.5,
          right: 0.5,
          patches: [
            { ...actor.patches.left.low, mode: "free", constraint: "hard" },
            { ...actor.patches.right.low, mode: "free", constraint: "hard" },
          ],
        },
        phase: "preparation",
        elapsed: 0,
        progress: 0,
      }),
    );
    assert.equal(JSON.stringify(actor.constrained()), before);
    assert.equal(actor.support?.status, "admitted");
    requireLabSupport([actor], 0);
  } finally {
    actor.dispose();
  }
}

/**
 * Actual stopped anchors and orientation, rather than requested approximations, begin recovery.
 * @evidence contracts/testing.md#observable-behavior Fits original left/right polygon foot frames, then compares constrained support points and world-axis quaternions directly with the displayed native bone matrices. Measured world Y remains literal and the original raw requested support goals remain unchanged.
 * @evidence contracts/testing.md#independent-cases Both anatomical feet and a pi heading exercise frame conversion. Mutating the returned stopped sample cannot alter the actor or its raw request; no floor projection or achieved-target replacement can satisfy this independent native matrix oracle.
 */
export function test_support_frame_actual_stopped_snapshot(): void {
  const actor: LabActor = new LabActor("stopped", "b", 0.4, Math.PI);
  try {
    const patches: MotionAction.SupportPatch[] = (
      ["left", "right"] as const
    ).flatMap((side: MotionAction.Side): MotionAction.SupportPatch[] => {
      const measured: MotionAction.SupportMeasurement = actor.context(
        side,
        [0, 0, 0],
      ).supportFrame!(actor.basePose, [0, 0, 0], actor.patches[side].pivot);
      return [measured.frame, measured.contact];
    });
    const rotations: Map<string, THREE.Quaternion> = new Map(
      patches.map(
        (patch: MotionAction.SupportPatch): [string, THREE.Quaternion] => [
          patch.bone,
          actor.person.drawing.bones
            .get(patch.bone)!
            .getWorldQuaternion(new THREE.Quaternion()),
        ],
      ),
    );
    actor.apply({
      pose: structuredClone(actor.basePose),
      rootOffset: [0, 0, 0],
      support: { left: 0.5, right: 0.5, patches },
      effectors: [],
      phase: "contact",
      elapsed: 0.2,
      progress: 0,
    });
    const requested: string = JSON.stringify(actor.sample);
    const stopped: MotionAction.Sample = actor.constrained();
    for (const patch of stopped.support.patches!) {
      const bone: THREE.Group = actor.person.drawing.bones.get(patch.bone)!;
      const actual: THREE.Vector3 = bone.localToWorld(
        new THREE.Vector3(...patch.localPoint),
      );
      assert.ok(actual.distanceTo(new THREE.Vector3(...patch.world)) < 1e-12);
      assert.equal(patch.world[1], actual.y);
      if (patch.frameRotation)
        assert.ok(
          bone
            .getWorldQuaternion(new THREE.Quaternion())
            .multiply(rotations.get(patch.bone)!.clone().invert())
            .angleTo(new THREE.Quaternion(...patch.frameRotation)) < 1e-7,
        );
    }
    assert.equal(JSON.stringify(actor.sample), requested);
    stopped.support.patches![0]!.world[0] += 99;
    assert.equal(JSON.stringify(actor.sample), requested);
    assert.notEqual(
      actor.constrained().support.patches![0]!.world[0],
      stopped.support.patches![0]!.world[0],
    );
  } finally {
    actor.dispose();
  }
}
