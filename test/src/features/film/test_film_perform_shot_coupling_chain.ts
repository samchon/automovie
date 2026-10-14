import {
  IAutoMovieActionCall,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieSkeleton,
  IAutoMovieStage,
  IAutoMovieStageCamera,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { performShot } from "../../../../packages/engine/src/film/performShot";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { HUMANOID_JOINT_AXES } from "../../../../packages/engine/src/kinematics/constants/HUMANOID_JOINT_AXES";
import { resolveAttachment } from "../../../../packages/engine/src/kinematics/resolveAttachment";
import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { sampleMotion } from "../../../../packages/engine/src/motion/sampleMotion";
import { IAutoMovieActionSynthesizer } from "../../../../packages/engine/src/perform/IAutoMovieActionSynthesizer";
import { sampleClip } from "../../../../packages/engine/src/resolve/sampleClip";
import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import {
  IDENTITY_TRANSFORM,
  createSkeleton,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { vclose } from "../internal/predicates";

/** The dragon strides +x by 2 m over the 2 s shot (root translation only). */
const dragonWalk: IAutoMovieMotion = makeMotion(
  [
    keyframe(
      0,
      makePose([], {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      }),
    ),
    keyframe(
      2,
      makePose([], {
        translation: { x: 2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      }),
    ),
  ],
  2,
);

/** The dragon animates its stride; launch/attach fatten objects, not rigs. */
const synth: IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
  actor: string,
): IAutoMovieMotion | null =>
  action.verb === "launch" || action.verb === "attachTo"
    ? null
    : actor === "dragon"
      ? dragonWalk
      : validSynthesizer(action, actor);

const scriptOf: () => IAutoMovieScript = (): IAutoMovieScript =>
  makeScriptWrite({
    cast: [
      { node: "dragon", character: "the wyrm", modelRef: "stickman" },
      { node: "horse", character: "the steed", modelRef: "stickman" },
      { node: "rider", character: "the knight", modelRef: "stickman" },
      { node: "sword", character: "the blade", modelRef: null },
    ],
    beats: [
      {
        id: "beat-1",
        name: "the caravan",
        summary: "the mounted column strides out",
        durationHint: 2,
      },
    ],
  });

const cameraOf: () => IAutoMovieStageCamera[] =
  (): IAutoMovieStage["cameras"] => [
    {
      node: "cam",
      position: { x: 4, y: 2, z: 4 },
      lookAt: { kind: "node", node: "dragon" },
      fovDeg: 45,
      near: 0.1,
      far: 1000,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
    },
  ];

/**
 * Every intermediate parent is staged at a decoy coordinate the chain must
 * override: the horse rides the dragon's hips, the rider rides the horse's
 * spine, and the sword is grabbed per beat: three couplings deep.
 */
const stagingOf: () => IAutoMovieStage = (): IAutoMovieStage =>
  makeStagingWrite({
    scene: { id: "scene-caravan", name: "the caravan" },
    actors: [
      { node: "dragon", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
      {
        node: "horse",
        position: { x: 7, y: 7, z: 7 },
        facingDeg: 0,
        attach: { parent: "dragon", bone: "hips" },
      },
      {
        node: "rider",
        position: { x: 5, y: 5, z: 5 },
        facingDeg: 0,
        attach: { parent: "horse", bone: "spine" },
      },
      { node: "sword", position: { x: 3, y: 3, z: 3 }, facingDeg: 0 },
    ],
    cameras: cameraOf(),
  });

const posAt: (
  clip: IAutoMovieClip,
  node: string,
  t: number,
) => IAutoMovieVector3 = (
  clip: IAutoMovieClip,
  node: string,
  t: number,
): IAutoMovieVector3 => {
  const v: number[] = sampleClip(clip, t).get(
    `node:${node}:translation`,
  )!.value;
  return { x: v[0]!, y: v[1]!, z: v[2]! };
};

/** Compose `local` onto a parent world frame: compileAttach's composition. */
const composed: (
  parent: { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
  local: IAutoMovieTransform,
) => { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion } = (
  parent: { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion },
  local: IAutoMovieTransform,
): { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion } => ({
  translation: Vector3.add(
    parent.translation,
    Quaternion.rotateVector(parent.rotation, local.translation),
  ),
  rotation: Quaternion.multiply(parent.rotation, local.rotation),
});

/**
 * Coupling paths compose through mounted ancestors and refuse cycles.
 *
 * Scenarios:
 * 1. Bake a three-deep sword/rider/horse/dragon chain and its two-metre displacement, distinct from staged decoys.
 * 2. Refuse persistent/per-beat cycles and a rigless intermediate parent.
 * 3. Read a late parent's staged placement before its coupling and baked path afterward.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs performShot and samples follow clips, checking every coupling id, composed endpoints, root displacement, cycle/mount faults and late-start authority; detects a bake attached to stale staged parents.
 * @evidence contracts/testing.md#independent-expectations The two-metre root travel and distinct staged decoys independently distinguish a moving composed path. Endpoint reference composition reuses resolveAttachment/Quaternion, so it checks graph composition rather than independently proving FK/rotation primitives.
 * @evidence contracts/testing.md#distinguishing-cases Keeps three-depth composition, stale-placement exclusion, mount cycle, mutual attach cycle, rigless parent and before/after late-start samples; disjoint handoffs and id-independent beat-end choice remain in attach.
 * @evidence contracts/testing.md#execution-ownership This synchronous discoverable unit owns portable compilation/sampling cases and starts no rig renderer, browser or native host; sampled double-precision points prove no displayed coupling appearance.
 */
export function test_film_perform_shot_coupling_chain(): void {
  const staged: IAutoMovieStagedSet = stageScene(scriptOf(), stagingOf());
  if (staged.success !== true) throw new Error("staging must succeed");

  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const ok: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        {
          verb: "gesture",
          actor: "dragon",
          start: 0,
          duration: 2,
          kind: "bow",
        },
        {
          verb: "attachTo",
          actor: "sword",
          parent: "rider",
          bone: "leftHand",
          start: 0,
          duration: 2,
        },
      ],
      revise: { review: "the caravan reads.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "sword" ? null : skeleton,
  });
  TestValidator.equals("the chained shot performs", ok.success, true);
  if (ok.success !== true) return;
  TestValidator.equals(
    "every coupling bakes a follow clip",
    ok.shot.objectMotions
      .map((c: IAutoMovieClip): string => c.id)
      .sort((a: string, b: string): number => a.localeCompare(b)),
    ["attach:horse", "attach:rider", "attach:sword"],
  );

  // 1. the shared-FK chain reference: dragon staged ∘ dragon pose FK(hips) → horse,
  //    ∘ rest FK(spine) → rider, ∘ rest FK(leftHand) → sword.
  const rest: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: [],
  };
  const dragonStaged: IAutoMovieTransform = staged.scene.nodes.find(
    (n: IAutoMovieSceneNode): boolean => n.id === "dragon",
  )!.transform;
  const swordClip: IAutoMovieClip = ok.shot.objectMotions.find(
    (c: IAutoMovieClip): boolean => c.id === "attach:sword",
  )!;
  const expectedSwordAt: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => {
    const horse: {
      translation: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
    } = composed(
      dragonStaged,
      resolveAttachment(
        sampleMotion(ok.motions["dragon"]!, t).pose,
        skeleton,
        { parentBone: "hips", offset: IDENTITY_TRANSFORM },
        HUMANOID_JOINT_AXES,
      ),
    );
    const rider: {
      translation: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
    } = composed(
      horse,
      resolveAttachment(
        rest,
        skeleton,
        { parentBone: "spine", offset: IDENTITY_TRANSFORM },
        HUMANOID_JOINT_AXES,
      ),
    );
    return composed(
      rider,
      resolveAttachment(
        rest,
        skeleton,
        { parentBone: "leftHand", offset: IDENTITY_TRANSFORM },
        HUMANOID_JOINT_AXES,
      ),
    ).translation;
  };
  TestValidator.predicate(
    "the sword's baked follow equals the composed chain at the start",
    vclose(posAt(swordClip, "sword", 0), expectedSwordAt(0), 1e-9),
  );
  TestValidator.predicate(
    "the sword's baked follow equals the composed chain at the end",
    vclose(posAt(swordClip, "sword", 2), expectedSwordAt(2), 1e-9),
  );

  // 2. the chain carries the dragon's stride, link-invariant.
  TestValidator.predicate(
    "the sword's net displacement is the dragon's +2 m travel within 1e-9",
    vclose(
      Vector3.subtract(
        posAt(swordClip, "sword", 2),
        posAt(swordClip, "sword", 0),
      ),
      { x: 2, y: 0, z: 0 },
      1e-9,
    ),
  );

  // 3. the pre-fix composition (rider's staged decoy placement) is dead.
  const staleSword: IAutoMovieVector3 = composed(
    { translation: { x: 5, y: 5, z: 5 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    resolveAttachment(
      rest,
      skeleton,
      { parentBone: "leftHand", offset: IDENTITY_TRANSFORM },
      HUMANOID_JOINT_AXES,
    ),
  ).translation;
  TestValidator.predicate(
    "the sword's end differs from the stale staged-parent composition",
    !vclose(posAt(swordClip, "sword", 2), staleSword, 1e-3),
  );

  // 4. a mount cycle violates instead of baking frozen couplings.
  const cyclic: IAutoMovieStagedSet = stageScene(
    scriptOf(),
    makeStagingWrite({
      scene: { id: "scene-cycle", name: "the ouroboros" },
      actors: [
        { node: "dragon", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
        {
          node: "horse",
          position: { x: 1, y: 0, z: 0 },
          facingDeg: 0,
          attach: { parent: "rider", bone: "spine" },
        },
        {
          node: "rider",
          position: { x: 2, y: 0, z: 0 },
          facingDeg: 0,
          attach: { parent: "horse", bone: "spine" },
        },
        { node: "sword", position: { x: 3, y: 3, z: 3 }, facingDeg: 0 },
      ],
      cameras: cameraOf(),
    }),
  );
  if (cyclic.success !== true) throw new Error("cyclic staging must succeed");
  const cycleShot: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged: cyclic,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        {
          verb: "gesture",
          actor: "dragon",
          start: 0,
          duration: 2,
          kind: "bow",
        },
      ],
      revise: { review: "the ouroboros cannot ride.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "sword" ? null : skeleton,
  });
  TestValidator.equals(
    "a mount cycle fails the shot",
    cycleShot.success,
    false,
  );
  if (cycleShot.success === false)
    TestValidator.predicate(
      "the violation names the cycle",
      cycleShot.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.expected.includes("cycle"),
      ),
    );

  // 5. a mutual per-beat attachTo violates the same way.
  const mutual: (draft: IAutoMovieActionCall[]) => IAutoMoviePerformedShot = (
    draft: IAutoMovieActionCall[],
  ): IAutoMoviePerformedShot =>
    performShot({
      script: scriptOf(),
      staged,
      performance: makePerformanceWrite({
        beat: "beat-1",
        draft,
        revise: { review: "the mutual grip cannot resolve.", final: null },
        duration: 2,
      }),
      synthesize: synth,
      skeleton: (node: string): IAutoMovieSkeleton | null =>
        node === "sword" ? null : skeleton,
    });
  const grip: IAutoMoviePerformedShot = mutual([
    {
      verb: "attachTo",
      actor: "horse",
      parent: "rider",
      bone: "leftHand",
      start: 0,
      duration: 2,
    },
    {
      verb: "attachTo",
      actor: "rider",
      parent: "horse",
      bone: "leftHand",
      start: 0,
      duration: 2,
    },
  ]);
  TestValidator.equals("a mutual attachTo fails the shot", grip.success, false);
  if (grip.success === false)
    TestValidator.predicate(
      "the mutual grip violation names the cycle",
      grip.violations.some((v: IAutoMovieConstraintViolation): boolean =>
        v.expected.includes("cycle"),
      ),
    );

  // 6. a rig-less intermediate parent still reports the mount-rig violation.
  const riglessLink: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        {
          verb: "gesture",
          actor: "dragon",
          start: 0,
          duration: 2,
          kind: "bow",
        },
      ],
      revise: { review: "the wyrm has no rig.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "sword" || node === "dragon" ? null : skeleton,
  });
  TestValidator.equals(
    "a rig-less chain link fails the shot",
    riglessLink.success,
    false,
  );
  if (riglessLink.success === false)
    TestValidator.predicate(
      "the chain does not mask the mount-rig violation",
      riglessLink.violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.path === "$staged.mounts",
      ),
    );

  // 7. a parent coupled only from t = 1 stands staged before it.
  const late: IAutoMoviePerformedShot = performShot({
    script: scriptOf(),
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft: [
        {
          verb: "gesture",
          actor: "dragon",
          start: 0,
          duration: 2,
          kind: "bow",
        },
        {
          verb: "attachTo",
          actor: "rider",
          parent: "horse",
          bone: "spine",
          start: 1,
          duration: 1,
        },
        {
          verb: "attachTo",
          actor: "sword",
          parent: "rider",
          bone: "leftHand",
          start: 0,
          duration: 2,
        },
      ],
      revise: { review: "the knight mounts mid-stride.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "sword" ? null : skeleton,
  });
  TestValidator.equals("the late coupling performs", late.success, true);
  if (late.success !== true) return;
  const riderStaged: IAutoMovieTransform = staged.scene.nodes.find(
    (n: IAutoMovieSceneNode): boolean => n.id === "rider",
  )!.transform;
  const lateSword: IAutoMovieClip = late.shot.objectMotions.find(
    (c: IAutoMovieClip): boolean => c.id === "attach:sword",
  )!;
  const handAt: (parent: {
    translation: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
  }) => IAutoMovieVector3 = (parent: {
    translation: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
  }): IAutoMovieVector3 =>
    composed(
      parent,
      resolveAttachment(
        rest,
        skeleton,
        { parentBone: "leftHand", offset: IDENTITY_TRANSFORM },
        HUMANOID_JOINT_AXES,
      ),
    ).translation;
  TestValidator.predicate(
    "before the rider's coupling starts the sword rides its staged placement",
    vclose(posAt(lateSword, "sword", 0.5), handAt(riderStaged), 1e-9),
  );
  const riderClip: IAutoMovieClip = late.shot.objectMotions.find(
    (c: IAutoMovieClip): boolean => c.id === "attach:rider",
  )!;
  const riderAt: (t: number) => IAutoMovieTransform = (
    t: number,
  ): IAutoMovieTransform => {
    const p: number[] = sampleClip(riderClip, t).get(
      "node:rider:translation",
    )!.value;
    const q: number[] = sampleClip(riderClip, t).get(
      "node:rider:rotation",
    )!.value;
    return {
      translation: { x: p[0]!, y: p[1]!, z: p[2]! },
      rotation: { x: q[0]!, y: q[1]!, z: q[2]!, w: q[3]! },
      scale: { x: 1, y: 1, z: 1 },
    };
  };
  TestValidator.predicate(
    "after the rider's coupling starts the sword rides its baked path",
    vclose(posAt(lateSword, "sword", 1.5), handAt(riderAt(1.5)), 1e-9),
  );
}
