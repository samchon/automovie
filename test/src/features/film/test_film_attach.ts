import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  compileAttach,
  resolveAttachment,
  sampleClip,
  sampleMotion,
} from "@automovie/engine";
import { type IAutoMovieClip, type IAutoMovieMotion, type IAutoMoviePose, type IAutoMovieTrack, type IAutoMovieTransform, type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  createSkeleton,
  createValidMotion,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose, qclose, throwsError, vclose } from "../internal/predicates";

const IDENTITY_OFFSET: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** The parent placed off the origin and turned 90° about +Y. */
const parentTransform: IAutoMovieTransform = {
  translation: { x: 1, y: 0, z: 2 },
  rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  scale: { x: 1, y: 1, z: 1 },
};

const posAt: (clip: IAutoMovieClip, t: number) => IAutoMovieVector3 = (
  clip: ReturnType<typeof compileAttach>,
  t: number,
): IAutoMovieVector3 => {
  const v: number[] = sampleClip(clip, t).get("node:sword:translation")!.value;
  return { x: v[0]!, y: v[1]!, z: v[2]! };
};

/**
 * A baked attachment composes the parent's staged placement with its bone frame and preserves shot-local timing for resting and moving parents.
 *
 * Scenarios:
 *
 * 1. A resting parent: the child is static and sits exactly at the bone's world
 *    point, the `leftHand` rest position (0.75, 1.4, 0) in the parent's model
 *    space, composed onto the staged placement (hand-computed FK oracle), and
 *    inherits the parent's facing.
 * 2. The clip is shot-local: its times run over `[start, start + duration]` and it
 *    spans the shot.
 * 3. A moving parent (an elbow flexing 0 → 120°) carries the child: the baked
 *    position changes over the span, and at a frame-aligned instant it equals
 *    the staged placement composed onto `resolveAttachment` of the sampled
 *    pose.
 * 4. A supplied clinical rest frame changes the raised arm's baked hand point, distinguished from the unframed rig-space result by independent ninety- and 180-degree calculations.
 * 5. A zero-span coupling throws before baking duplicate key times.
 * 6. A sample rate that is zero, negative, NaN or infinite throws instead of
 *    baking a clip with no keys or an endless loop.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls compileAttach and observes sampled child channels, pose-driven motion, shot-local endpoints, inherited orientation, clinical-frame contrast and span/rate refusals. This catches a bake left in model space, an unchanging child or an ignored rest-frame input.
 * @evidence contracts/testing.md#independent-expectations Fixture segment lengths give the resting hand at (0.75,1.4,0), which the authored ninety-degree Y placement maps to (1,1.4,1.25). At t=2/3 the elbow rotates eighty degrees; elementary sine/cosine gives the moving point. The clinical shoulder's ninety-degree offset yields (1,1.95,1.8), versus (1,1.4,2.35) unframed. Existing resolveAttachment parity remains supplemental and cannot alone satisfy these independent numeric checks.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all six numbered groups: static bone and facing, coupling endpoints and shot span, a moving elbow, framed versus unframed shoulder, zero duration and four invalid rates; chained parent callbacks, nonunit staged scale and extreme sample populations are outside this case set.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_attach entry owns all numeric engine calls using the existing conventional skeleton fixture, without new Human assets, consumer installation, native compilation or a renderer; its baked-channel observations make no real-viewer acceptance claim.
 */
export function test_film_attach(): void {
  // 1. a resting parent → a static child at the hand's world point
  const rest: IAutoMovieClip = compileAttach({
    child: "sword",
    bone: "leftHand",
    parentTransform,
    parentSkeleton: createSkeleton(),
    start: 0.5,
    duration: 1,
    shotDuration: 3,
  });
  TestValidator.equals("the clip is the child's", rest.id, "attach:sword");
  TestValidator.equals(
    "the clip drives the child node",
    rest.tracks.map((t: IAutoMovieTrack): string => (t.channel.kind === "node" ? t.channel.node : "")),
    ["sword", "sword"],
  );

  // leftHand rest model position: hips(0,1,0) → chest(0,1.4,0) → arm chain
  // +0.2 +0.3 +0.25 along x → (0.75, 1.4, 0). Compose onto the placement.
  const handModel: IAutoMovieVector3 = { x: 0.75, y: 1.4, z: 0 };
  const expected: IAutoMovieVector3 = Vector3.add(
    parentTransform.translation,
    Quaternion.rotateVector(parentTransform.rotation, handModel),
  );
  TestValidator.predicate(
    "the rest attach lands on the hand's world point",
    vclose(posAt(rest, 0.5), expected, 1e-9),
  );
  TestValidator.predicate("rest attach agrees with the independent quarter-turn composition", vclose(posAt(rest, 0.5), { x: 1, y: 1.4, z: 1.25 }, 1e-9));
  TestValidator.predicate(
    "a resting parent → a static child",
    vclose(posAt(rest, 0.5), posAt(rest, 1.5), 1e-12),
  );
  const r: number[] = sampleClip(rest, 0.5).get("node:sword:rotation")!.value;
  TestValidator.predicate(
    "the child inherits the parent's facing",
    qclose(
      { x: r[0]!, y: r[1]!, z: r[2]!, w: r[3]! },
      parentTransform.rotation,
    ),
  );

  // 2. shot-local timing
  TestValidator.predicate(
    "the coupling begins at the action's start",
    nclose(rest.tracks[0]!.times[0]!, 0.5),
  );
  TestValidator.predicate(
    "and closes at its end",
    nclose(rest.tracks[0]!.times[rest.tracks[0]!.times.length - 1]!, 1.5),
  );
  TestValidator.predicate("the clip spans the shot", nclose(rest.duration, 3));

  // 3. a moving parent carries the child
  const motion: IAutoMovieMotion = createValidMotion(); // leftLowerArm flexion 0 → 120° over 1 s
  const dyn: IAutoMovieClip = compileAttach({
    child: "sword",
    bone: "leftHand",
    parentTransform,
    parentSkeleton: createSkeleton(),
    parentMotion: motion,
    start: 0,
    duration: 1,
    shotDuration: 1,
    fps: 60,
    jointAxes: HUMANOID_JOINT_AXES,
  });
  TestValidator.predicate(
    "a moving parent → a moving child",
    !vclose(posAt(dyn, 0), posAt(dyn, 1), 1e-3),
  );

  // at a frame-aligned instant the baked value matches the composed FK exactly
  const t: number = 20 / 30;
  const pose: IAutoMoviePose = sampleMotion(motion, t).pose;
  const local: IAutoMovieTransform = resolveAttachment(
    pose,
    createSkeleton(),
    { parentBone: "leftHand", offset: IDENTITY_OFFSET },
    HUMANOID_JOINT_AXES,
  );
  const composed: IAutoMovieVector3 = Vector3.add(
    parentTransform.translation,
    Quaternion.rotateVector(parentTransform.rotation, local.translation),
  );
  TestValidator.predicate(
    "the child rides the posed bone in scene space",
    vclose(posAt(dyn, t), composed, 1e-9),
  );
  const elbowRadians: number = (80 * Math.PI) / 180;
  TestValidator.predicate("moving hand agrees with independent elbow and staged rotations", vclose(posAt(dyn, t), { x: 1 - 0.25 * Math.sin(elbowRadians), y: 1.4, z: 1.5 - 0.25 * Math.cos(elbowRadians) }, 1e-9));

  // 4. Clinical parent motion reads the supplied rest-frame offset.
  const raisedMotion: IAutoMovieMotion = makeMotion(
    [
      keyframe(0, makePose([joint("leftUpperArm", { abduction: 180 })])),
      keyframe(1, makePose([joint("leftUpperArm", { abduction: 180 })])),
    ],
    1,
  );
  const framed: IAutoMovieClip = compileAttach({
    child: "sword",
    bone: "leftHand",
    parentTransform,
    parentSkeleton: createSkeleton(),
    parentMotion: raisedMotion,
    start: 0,
    duration: 1,
    shotDuration: 1,
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  });
  const raw: IAutoMovieClip = compileAttach({
    child: "sword",
    bone: "leftHand",
    parentTransform,
    parentSkeleton: createSkeleton(),
    parentMotion: raisedMotion,
    start: 0,
    duration: 1,
    shotDuration: 1,
    jointAxes: HUMANOID_JOINT_AXES,
  });
  const framedLocal: IAutoMovieTransform = resolveAttachment(
    sampleMotion(raisedMotion, 0.5).pose,
    createSkeleton(),
    { parentBone: "leftHand", offset: IDENTITY_OFFSET },
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  );
  const framedExpected: IAutoMovieVector3 = Vector3.add(
    parentTransform.translation,
    Quaternion.rotateVector(parentTransform.rotation, framedLocal.translation),
  );
  TestValidator.predicate(
    "rest-framed attach follows clinical FK",
    vclose(posAt(framed, 0.5), framedExpected, 1e-9),
  );
  TestValidator.predicate(
    "rest-framed attach differs from raw rig-space FK",
    !vclose(posAt(framed, 0.5), posAt(raw, 0.5), 1e-3),
  );
  TestValidator.predicate("clinical ninety-degree shoulder maps the hand above its pivot", vclose(posAt(framed, 0.5), { x: 1, y: 1.95, z: 1.8 }, 1e-9));
  TestValidator.predicate("unframed 180-degree shoulder maps the hand across its pivot", vclose(posAt(raw, 0.5), { x: 1, y: 1.4, z: 2.35 }, 1e-9));

  // 5. a non-positive span throws before it can bake a degenerate clip (#1224).
  // With duration 0 the sample loop emits `start` for both endpoints, so the
  // clip's keyframe times would be [start, start]: an unsamplable follow. The
  // baker rejects it up front, the same precondition projectileTrajectory
  // enforces, so no caller can slip a zero-span coupling past.
  const zeroSpanAttach: () => void = (): void => {
    compileAttach({
      child: "sword",
      bone: "leftHand",
      parentTransform,
      parentSkeleton: createSkeleton(),
      start: 2,
      duration: 0,
      shotDuration: 2,
    });
  };
  TestValidator.predicate(
    "a zero-span attach throws",
    throwsError(zeroSpanAttach, "duration"),
  );

  // 6. a sample rate that is not finite and positive throws instead of
  // baking a clip with no keys.
  for (const fps of [0, -30, Number.NaN, Number.POSITIVE_INFINITY])
    TestValidator.predicate(
      `an attach sampled at ${fps} fps throws`,
      throwsError(
        (): IAutoMovieClip =>
          compileAttach({
            child: "sword",
            bone: "leftHand",
            parentTransform,
            parentSkeleton: createSkeleton(),
            start: 0,
            duration: 1,
            shotDuration: 2,
            fps,
          }),
        "fps",
      ),
    );
}
