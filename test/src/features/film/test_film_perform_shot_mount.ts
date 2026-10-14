import {
  AutoMovieHumanoidBone,
  IAutoMovieActionCall,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieInteractionEvent,
  IAutoMovieMotion,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot } from "@automovie/engine";
import { IAutoMovieStagedSet } from "@automovie/engine";
import { performShot } from "@automovie/engine";
import { resolveBeatEnd } from "@automovie/engine";
import { stageScene } from "@automovie/engine";
import { IAutoMovieJointAxes } from "@automovie/engine";
import { HUMANOID_JOINT_AXES } from "@automovie/engine";
import { resolveAttachment } from "@automovie/engine";
import { Quaternion } from "@automovie/engine";
import { Vector3 } from "@automovie/engine";
import { sampleMotion } from "@automovie/engine";
import { IAutoMovieActionSynthesizer } from "@automovie/engine";
import { sampleClip } from "@automovie/engine";
import { IAutoMovieRestFrame } from "@automovie/engine";
import { HUMANOID_REST_FRAME } from "@automovie/engine";
import { FILM_MOUNT_WALK as horseWalk } from "../internal/FILM_MOUNT_WALK";
import { createFilmClinicalMountFixture } from "../internal/createFilmClinicalMountFixture";
import { createFilmMountScript as scriptOf } from "../internal/createFilmMountScript";
import { createFilmMountStage as stagingOf } from "../internal/createFilmMountStage";
import {
  makePerformanceWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { IDENTITY_TRANSFORM, createSkeleton } from "../internal/fixtures";
import { nclose, vclose } from "../internal/predicates";

/**
 * The horse animates its own walk; every other actor uses the shared clip.
 */
const synth: IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
  actor: string,
): IAutoMovieMotion | null =>
  actor === "horse" ? horseWalk : validSynthesizer(action, actor);

const riderPosAt: (clip: IAutoMovieClip, t: number) => IAutoMovieVector3 = (
  clip: IAutoMovieClip,
  t: number,
): IAutoMovieVector3 => {
  const v: number[] = sampleClip(clip, t).get("node:rider:translation")!.value;
  return { x: v[0]!, y: v[1]!, z: v[2]! };
};

/**
 * Performs staged mounts, samples baked rider follow and beat-end state, and checks velocity, clinical basis propagation, repeated compilation, explicit override and rig/bone failures.
 *
 * Scenarios:
 * 1. Bake moving rider translation/rotation, distinguish the staged decoy and compare shared attachment FK at the end.
 * 2. Emit no grab/attach/detach/release events for a persistent mount.
 * 3. Read baked beat-end position, trailing velocity and mount binding; distinguish empty, future and short active performance windows and custom clinical bases.
 * 4. Recompile the same staged beat without restating attachTo.
 * 5. Let explicit attachTo replace the persistent mount's clip.
 * 6. Produce no follow when staging has no mount.
 * 7. Refuse a rigless parent or absent mount bone.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs staged mounts, samples baked rider follow and beat-end state, and checks velocity, clinical basis propagation, repeated compilation, explicit override and rig/bone failures.
 * @evidence contracts/testing.md#independent-expectations The airborne staged rider must move and the authored two-metre horse travel over two seconds gives one metre per second. A performance at or before its start has no trailing history; a five-millisecond active window retains that same slope. The 1e-9 attachment reference reuses product FK, so it checks handoff consistency rather than independent FK arithmetic.
 * @evidence contracts/testing.md#distinguishing-cases Covers moving follow, absent handoff events, exact-start and future-start zero velocity, a short positive window, clinical/fallback contrast, recompilation, explicit override, mountless, rigless and missing-bone neighbours. Recompilation uses beat-1 again and does not execute a distinct resumed second beat; override checks clip population rather than independently sampling the requested chest endpoint.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_mount unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_mount(): void {
  const clinicalFixture: ReturnType<typeof createFilmClinicalMountFixture> =
    createFilmClinicalMountFixture();
  const staged: IAutoMovieStagedSet = stageScene(scriptOf(), stagingOf());
  if (staged.success !== true) throw new Error("staging must succeed");
  TestValidator.equals("staging carries the rider mount", staged.mounts, [
    { node: "rider", binding: { parent: "horse", bone: "spine" } },
  ]);

  const perform: (draft: IAutoMovieActionCall[]) => IAutoMoviePerformedShot = (
    draft: IAutoMovieActionCall[],
  ): IAutoMoviePerformedShot =>
    performShot({
      script: scriptOf(),
      staged,
      performance: makePerformanceWrite({
        beat: "beat-1",
        draft,
        revise: { review: "the ride reads.", final: null },
        duration: 2,
      }),
      synthesize: synth,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    });

  // 1. the rider follows the walking horse, never left at its staged (5,5,5).
  const ok: IAutoMoviePerformedShot = perform([
    { verb: "gesture", actor: "horse", start: 0, duration: 2, kind: "bow" },
  ]);
  TestValidator.equals("the mount performs", ok.success, true);
  if (ok.success !== true) return;

  const follow: IAutoMovieClip | undefined = ok.shot.objectMotions.find(
    (c: IAutoMovieClip): boolean => c.id === "attach:rider",
  );
  TestValidator.predicate("a rider follow clip is baked", follow !== undefined);
  TestValidator.equals(
    "the follow's translation and rotation tracks drive the rider node",
    follow!.tracks.map((t: IAutoMovieTrack): string =>
      t.channel.kind === "node" ? t.channel.node : "",
    ),
    ["rider", "rider"],
  );
  const start: IAutoMovieVector3 = riderPosAt(follow!, 0);
  const end: IAutoMovieVector3 = riderPosAt(follow!, 2);
  TestValidator.predicate(
    "the rider rides the moving horse (a live follow)",
    !vclose(start, end, 1e-3),
  );
  TestValidator.predicate(
    "the rider's end differs from its staged (5,5,5)",
    !vclose(end, { x: 5, y: 5, z: 5 }, 1e-3),
  );

  // Shared-FK reference: resolveAttachment on the COMPILED horse motion
  // (what compileAttach sampled) composed with the horse's staged transform.
  const horse: IAutoMovieSceneNode = staged.scene.nodes.find(
    (n: IAutoMovieSceneNode): boolean => n.id === "horse",
  )!;
  const horseMotion: IAutoMovieMotion = ok.motions["horse"]!;
  const localAtEnd: IAutoMovieTransform = resolveAttachment(
    sampleMotion(horseMotion, 2).pose,
    createSkeleton(),
    { parentBone: "spine", offset: IDENTITY_TRANSFORM },
    HUMANOID_JOINT_AXES,
  );
  const expectedEnd: IAutoMovieVector3 = Vector3.add(
    horse.transform.translation,
    Quaternion.rotateVector(horse.transform.rotation, localAtEnd.translation),
  );
  TestValidator.predicate(
    "the baked follow matches the attachment FK within 1e-9",
    vclose(end, expectedEnd, 1e-9),
  );

  // 2. a persistent mount is not a per-shot pickup: no handoff events.
  TestValidator.equals(
    "a mount emits no attach/detach events",
    (ok.shot.events ?? []).filter(
      (e: IAutoMovieInteractionEvent): boolean =>
        e.kind === "grab" ||
        e.kind === "attach" ||
        e.kind === "detach" ||
        e.kind === "release",
    ),
    [],
  );

  // 3. beat-end reads the rider's world from the same baked clip.
  const beatEnd: IAutoMovieBeatEndState = resolveBeatEnd({
    beat: "beat-1",
    scene: staged.scene,
    shot: ok.shot,
    motions: Object.entries(ok.motions).map(
      ([, m]: [string, IAutoMovieMotion]): IAutoMovieMotion => m,
    ),
    mounts: staged.mounts,
  });
  const riderEnd: IAutoMovieBeatEndActorState = beatEnd.actors.find(
    (a: IAutoMovieBeatEndActorState): boolean => a.node === "rider",
  )!;
  TestValidator.predicate(
    "the rider's beat-end sits at the saddle, following the horse",
    vclose(riderEnd.transform.translation, expectedEnd, 1e-9),
  );
  TestValidator.predicate(
    "the rider's beat-end is NOT its airborne staged coordinate",
    !vclose(riderEnd.transform.translation, { x: 5, y: 5, z: 5 }, 1e-3),
  );
  TestValidator.predicate(
    "the rider inherits the horse's trailing velocity (nonzero +x)",
    riderEnd.rootVelocity!.x > 0.5 &&
      nclose(riderEnd.rootVelocity!.y, 0, 1e-6) &&
      Math.abs(riderEnd.rootVelocity!.y) < 1e-6 &&
      nclose(riderEnd.rootVelocity!.z, 0, 1e-6) &&
      Math.abs(riderEnd.rootVelocity!.z) < 1e-6,
  );
  TestValidator.equals("the mount binding is carried", riderEnd.mount, {
    parent: "horse",
    bone: "spine",
  });

  // 3b. A performance cannot inherit velocity from before its own start.
  const offsetSnapshot: Parameters<typeof resolveBeatEnd>[0] = {
    beat: "beat-1",
    scene: staged.scene,
    shot: ok.shot,
    motions: [
      ...Object.entries(ok.motions).map(
        ([, m]: [string, IAutoMovieMotion]): IAutoMovieMotion => m,
      ),
      { ...horseWalk, id: "horse-walk" },
    ],
    mounts: staged.mounts,
  };
  function endAtOffset(startOffset: number): IAutoMovieBeatEndState {
    return resolveBeatEnd({
      ...offsetSnapshot,
      shot: {
        ...offsetSnapshot.shot,
        performances: [
          ...offsetSnapshot.shot.performances,
          { node: "rider", motion: "horse-walk", startOffset },
        ],
      },
    });
  }
  const endStart: IAutoMovieBeatEndState = endAtOffset(2);
  const riderAtStart: IAutoMovieBeatEndActorState = endStart.actors.find(
    (a: IAutoMovieBeatEndActorState): boolean => a.node === "rider",
  )!;
  TestValidator.predicate(
    "a rider mounted at local time 0 has an empty velocity window (zero)",
    vclose(riderAtStart.rootVelocity!, { x: 0, y: 0, z: 0 }),
  );
  const riderBeforeStart: IAutoMovieBeatEndActorState = endAtOffset(
    3,
  ).actors.find(
    (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "rider",
  )!;
  TestValidator.predicate(
    "a rider's future performance also has no velocity history",
    vclose(riderBeforeStart.rootVelocity!, { x: 0, y: 0, z: 0 }),
  );
  const riderJustStarted: IAutoMovieBeatEndActorState = endAtOffset(
    1.995,
  ).actors.find(
    (actor: IAutoMovieBeatEndActorState): boolean => actor.node === "rider",
  )!;
  TestValidator.predicate(
    "a short active window retains the carrier's one-metre-per-second velocity",
    vclose(riderJustStarted.rootVelocity!, { x: 1, y: 0, z: 0 }, 1e-6),
  );
  // 3c. a mount whose parent clip is authored in clinical space threads the
  // parent's custom axes/rest frames into the follow FK.
  const clinical: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        { verb: "gesture", actor: "horse", start: 0, duration: 2, kind: "bow" },
      ],
      revise: { review: "the clinical-space ride.", final: null },
      duration: 2,
    }),
    synthesize: clinicalFixture.synthesize,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    jointAxes: (
      node: string,
    ):
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
      | undefined => (node === "horse" ? clinicalFixture.jointAxes : undefined),
    restFrames: (
      node: string,
    ):
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
      | undefined =>
      node === "horse" ? clinicalFixture.restFrames : undefined,
  });
  TestValidator.equals("the clinical mount performs", clinical.success, true);
  if (clinical.success === true) {
    const clinicalFollow: IAutoMovieClip = clinical.shot.objectMotions.find(
      (c: IAutoMovieClip): boolean => c.id === "attach:rider",
    )!;
    const clinicalEnd: number[] = sampleClip(clinicalFollow, 2).get(
      "node:rider:translation",
    )!.value;
    const localClinical: IAutoMovieTransform = resolveAttachment(
      sampleMotion(clinical.motions["horse"]!, 2).pose,
      createSkeleton(),
      { parentBone: "spine", offset: IDENTITY_TRANSFORM },
      clinicalFixture.jointAxes,
      clinicalFixture.restFrames,
    );
    const expectedClinical: IAutoMovieVector3 = Vector3.add(
      horse.transform.translation,
      Quaternion.rotateVector(
        horse.transform.rotation,
        localClinical.translation,
      ),
    );
    TestValidator.predicate(
      "the mount follow threads the parent's custom clinical mappings into FK",
      vclose(
        { x: clinicalEnd[0]!, y: clinicalEnd[1]!, z: clinicalEnd[2]! },
        expectedClinical,
        1e-9,
      ),
    );
    const fallbackLocal: IAutoMovieTransform = resolveAttachment(
      sampleMotion(clinical.motions["horse"]!, 2).pose,
      createSkeleton(),
      { parentBone: "spine", offset: IDENTITY_TRANSFORM },
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    );
    TestValidator.predicate(
      "the custom mount basis is observably distinct from humanoid fallback",
      !vclose(localClinical.translation, fallbackLocal.translation, 1e-3),
    );
  }

  // 4. Recompiling the same staged beat without attachTo still bakes the follow.
  const beatTwo: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        { verb: "gesture", actor: "horse", start: 0, duration: 2, kind: "bow" },
      ],
      revise: { review: "the ride continues.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("the repeated beat performs", beatTwo.success, true);
  if (beatTwo.success === true)
    TestValidator.predicate(
      "the same staging retains the mount without re-declaration",
      beatTwo.shot.objectMotions.some(
        (c: IAutoMovieClip): boolean => c.id === "attach:rider",
      ),
    );

  // 5. an explicit attachTo for the rider this beat overrides its mount.
  const overridden: IAutoMoviePerformedShot = perform([
    { verb: "gesture", actor: "horse", start: 0, duration: 2, kind: "bow" },
    {
      verb: "attachTo",
      actor: "rider",
      parent: "horse",
      bone: "chest",
      start: 0,
      duration: 2,
    },
  ]);
  TestValidator.equals("the override performs", overridden.success, true);
  if (overridden.success === true)
    TestValidator.equals(
      "one rider follow clip, the explicit attachTo, not a second from the mount",
      overridden.shot.objectMotions.filter(
        (c: IAutoMovieClip): boolean => c.id === "attach:rider",
      ).length,
      1,
    );

  // 6. a mountless staging bakes no follow clip.
  const bare: IAutoMovieStagedSet = stageScene(
    scriptOf(),
    makeStagingWrite({
      scene: { id: "scene-ride", name: "the ride" },
      actors: [
        { node: "horse", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
        { node: "rider", position: { x: 1, y: 0, z: 0 }, facingDeg: 0 },
      ],
      cameras: [
        {
          node: "cam",
          position: { x: 3, y: 2, z: 3 },
          lookAt: { kind: "node", node: "horse" },
          fovDeg: 45,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  if (bare.success !== true) throw new Error("bare staging must succeed");
  const bareShot: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged: bare,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        { verb: "gesture", actor: "horse", start: 0, duration: 2, kind: "bow" },
      ],
      revise: { review: "no mount here.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals("the mountless shot performs", bareShot.success, true);
  if (bareShot.success === true)
    TestValidator.equals(
      "no mount, no follow clip (byte-compatible with pre-#674)",
      bareShot.shot.objectMotions,
      [],
    );

  // 7. a mount onto a rig-less parent, and onto an absent bone, each fail.
  const riglessParent: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        { verb: "gesture", actor: "horse", start: 0, duration: 2, kind: "bow" },
      ],
      revise: { review: "the horse has no rig.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    // horse has no rig now: the mount cannot ride a bone of it.
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "horse" ? null : createSkeleton(),
  });
  TestValidator.equals(
    "a rig-less mount parent fails",
    riglessParent.success,
    false,
  );
  if (riglessParent.success === false)
    TestValidator.predicate(
      "the violation names the mounts",
      riglessParent.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.path === "$staged.mounts",
      ),
    );

  const badBone: IAutoMovieStagedSet = stageScene(
    scriptOf(),
    makeStagingWrite({
      scene: { id: "scene-ride", name: "the ride" },
      actors: [
        { node: "horse", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
        {
          node: "rider",
          position: { x: 5, y: 5, z: 5 },
          facingDeg: 0,
          attach: { parent: "horse", bone: "rightHand" },
        },
      ],
      cameras: [
        {
          node: "cam",
          position: { x: 3, y: 2, z: 3 },
          lookAt: { kind: "node", node: "horse" },
          fovDeg: 45,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  if (badBone.success !== true) throw new Error("badBone staging must succeed");
  const missingBone: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged: badBone,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        { verb: "gesture", actor: "horse", start: 0, duration: 2, kind: "bow" },
      ],
      revise: { review: "the saddle bone is missing.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    // createSkeleton has no rightHand: the saddle bone is absent.
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  TestValidator.equals(
    "an absent mount bone fails",
    missingBone.success,
    false,
  );
  if (missingBone.success === false)
    TestValidator.predicate(
      "the violation names the bone via the mounts path",
      missingBone.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.path === "$staged.mounts" && `${v.value}` === "rightHand",
      ),
    );
}
