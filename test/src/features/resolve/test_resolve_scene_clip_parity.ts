import {
  IAutoMovieClip,
  IAutoMovieModel,
  type IAutoMovieNode,
  type IAutoMovieSceneNode,
  type IAutoMovieScript,
  type IAutoMovieSkeleton,
  type IAutoMovieTrack,
  type IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieForgedCast } from "@automovie/engine";
import { type IAutoMoviePerformedShot } from "@automovie/engine";
import { type IAutoMovieStagedSet } from "@automovie/engine";
import { forgeCast } from "@automovie/engine";
import { performShot } from "@automovie/engine";
import { stageScene } from "@automovie/engine";
import { type IAutoMovieResolvedBone } from "@automovie/engine";
import { resolvePose } from "@automovie/engine";
import { Matrix4 } from "@automovie/engine";
import { motionToClip } from "@automovie/engine";
import { sampleMotion } from "@automovie/engine";
import { resolveFrame } from "@automovie/engine";
import { sceneToNodes } from "@automovie/engine";
import { bakeTimes } from "../internal/bakeTimes";
import { createModel } from "../internal/createModel";
import { createSkeleton } from "../internal/createSkeleton";
import { forgeEntry } from "../internal/forgeEntry";
import { makePerformanceWrite } from "../internal/makePerformanceWrite";
import { makeScriptWrite } from "../internal/makeScriptWrite";
import { makeStagingWrite } from "../internal/makeStagingWrite";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { validSynthesizer } from "../internal/validSynthesizer";
import { vclose } from "../internal/vclose";

/**
 * The existing duel fixture runs forge/stage/perform, merges both actors' prefixed motion tracks into one clip and compares its resolved bones with specialized motion/FK under each placement at bake-clock times. Agreement uses the stated numerical predicates and shared product math.
 *
 * Scenarios:
 *
 * 1. The merge precondition: every compiled motion fits the shot and at least one
 *    spans it exactly: a shorter actor's tracks end early and HOLD, the same
 *    clamp-hold boundary rule `sampleMotion` applies, so the merged clip is
 *    well-formed (track times ≤ clip duration).
 * 2. For every bake time and both actors, every bone's world position and rotation
 *    agree between the specialized and general paths (1e-6), including the hold
 *    window where the shorter actor has ended (the hold semantics agree across
 *    both pipelines).
 * 3. The negative twin: reading knightA's bones through knightB's prefix does not
 *    match: the per-placement prefixes really keep the two actors' subtrees
 *    distinct (the knights stand 0.7 m apart, facing opposite ways).
 *
 * @evidence contracts/testing.md#behavioral-verification Executes forge/stage/perform, lowers the resulting two-actor graph and motion clips, and compares every resolved bone with specialized FK at the endpoint-inclusive bake clock, including an actor-prefix negative twin.
 * @evidence contracts/testing.md#independent-expectations Specialized resolvePose/sampleMotion plus placement multiplication provides a separate execution path, not an independent external kinematics oracle; shared quaternion/matrix defects may cancel and inter-sample clinical easing is not proven.
 * @evidence contracts/testing.md#distinguishing-cases Both actor prefixes, all returned bones, shorter-motion hold time and the crossed hips lookup distinguish naming/time errors from parity; arbitrary rigs, clinical truth and continuous-time equality are outside this existing duel fixture.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_scene_clip_parity entry owns portable synchronous engine pipeline execution with the existing injected fixture synthesizer; it renders no Human asset or frame and replaces no product implementation.
 */
export function test_resolve_scene_clip_parity(): void {
  const script: IAutoMovieScript = makeScriptWrite();
  const forged: IAutoMovieForgedCast = forgeCast(script, {
    entries: [forgeEntry("knightB")],
  });
  if (forged.success !== true) throw new Error("forge must succeed");
  const staged: IAutoMovieStagedSet = stageScene(script, makeStagingWrite());
  if (staged.success !== true) throw new Error("stage must succeed");
  const performed: IAutoMoviePerformedShot = performShot({
    script,
    staged,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
  if (performed.success !== true) throw new Error("perform must succeed");

  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const models: Record<string, IAutoMovieModel> = {
    stickman: { ...createModel(skeleton), id: "stickman" },
    knightB: forged.models["knightB"]!,
  };
  const nodes: IAutoMovieNode[] = sceneToNodes({ scene: staged.scene, models });

  const actors: readonly ["knightA", "knightB"] = [
    "knightA",
    "knightB",
  ] as const;
  TestValidator.equals(
    "every motion fits the shot and one spans it (a shorter one holds)",
    namedFacts([
      [
        "actorsEveryNode",
        (): boolean =>
          actors.every(
            (node: "knightA" | "knightB"): boolean =>
              performed.motions[node]!.duration <= performed.shot.duration,
          ),
      ],
      [
        "actorsSomeNode",
        (): boolean =>
          actors.some((node: "knightA" | "knightB"): boolean =>
            nclose(
              performed.motions[node]!.duration,
              performed.shot.duration,
              0,
            ),
          ),
      ],
    ]),
    { actorsEveryNode: true, actorsSomeNode: true },
  );

  const merged: IAutoMovieClip = {
    id: "duel",
    name: null,
    duration: performed.shot.duration,
    loop: false,
    tracks: actors.flatMap(
      (node: "knightA" | "knightB"): IAutoMovieTrack[] =>
        motionToClip({
          motion: performed.motions[node]!,
          skeleton,
          nodePrefix: `${node}/`,
        }).clip.tracks,
    ),
  };

  const times: number[] = bakeTimes(performed.shot.duration);
  let parity: boolean = true;
  let crossed: boolean = false;
  for (const time of times) {
    const world: Map<string, number[]> = resolveFrame({
      nodes,
      clip: merged,
      limits: [],
      seconds: time,
    }).world;
    for (const node of actors) {
      const placement: IAutoMovieTransform = staged.scene.nodes.find(
        (n: IAutoMovieSceneNode): boolean => n.id === node,
      )!.transform;
      const placementMatrix: number[] = Matrix4.compose(
        placement.translation,
        placement.rotation,
        placement.scale,
      );
      const expected: IAutoMovieResolvedBone[] = resolvePose(
        sampleMotion(performed.motions[node]!, time).pose,
        skeleton,
      );
      for (const bone of expected) {
        const matrix: number[] | undefined = world.get(`${node}/${bone.bone}`);
        if (matrix === undefined) {
          parity = false;
          break;
        }
        const specialized: number[] = Matrix4.multiply(
          placementMatrix,
          Matrix4.compose(bone.worldPosition, bone.worldRotation, {
            x: 1,
            y: 1,
            z: 1,
          }),
        );
        if (
          !vclose(Matrix4.position(matrix), Matrix4.position(specialized)) ||
          !qclose(
            Matrix4.decompose(matrix).rotation,
            Matrix4.decompose(specialized).rotation,
          )
        ) {
          parity = false;
          break;
        }
        // the cross-actor twin: knightA's specialized world must NOT match
        // knightB's lowered node (they stand apart, facing opposite ways).
        if (node === "knightA" && bone.bone === "hips") {
          const other: number[] = world.get(`knightB/${bone.bone}`)!;
          if (!vclose(Matrix4.position(other), Matrix4.position(specialized)))
            crossed = true;
        }
      }
      if (!parity) break;
    }
    if (!parity) break;
  }
  TestValidator.predicate(
    "every bone of both actors agrees between the two paths at every time",
    parity,
  );
  TestValidator.predicate(
    "prefixes keep the actors' subtrees distinct (cross-read differs)",
    crossed,
  );
}
