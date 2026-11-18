import { createTorch } from "@automovie/archetypes";
import {
  Quaternion,
  Transform,
  compilePracticalLightMotion,
  performShot,
  resolveShotLighting,
  sampleClip,
  stageScene,
} from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieCompilePracticalLightMotion,
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMoviePerformShotProps,
  IAutoMoviePerformedShot,
  IAutoMoviePracticalLightBinding,
  IAutoMovieQuaternion,
  IAutoMovieSampledChannel,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieSkeleton,
  IAutoMovieStagedSet,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * A torch's practical spot originates at its lens and follows its prop's translation, rotation and staged scale while switching independently.
 *
 * Scenarios:
 *
 * 1. performShot admits the source with the object clips. Before the object's first keys, the source uses the staged prop frame.
 * 2. While only translation has started, the source follows that channel with the staged aim and scale.
 * 3. During the turn, the lens offset and spotlight aim both follow the prop at requested samples, including a time between prop keys.
 * 4. Exact switch edges change intensity without changing which frame supplies the pose.
 * 5. An attachTo cue supplies the prop motion to the binding without an authored object clip.
 * 6. Without an interval, a still point source uses the staged intensity and lens location. Malformed timing, missing emitter references, omitted moving-prop samples and competing light channels are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs practical compilation, performShot admission, and ordinary light resolution to catch a source following the prop root, a missing turn, a fade in place of a switch, or a binding evaluated before coupling.
 * @evidence contracts/development/testing.md#independent-expectations The published torch length locates the +Y lens tip, doubled by the staged scale. A quarter-turn about negative Z carries +Y to +X, with a 45-degree midpoint giving equal positive X and Y projections. The coupling case measures the light against the final baked prop track and the same physical lens offset.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates held placement, translation-only authority, interior rotation and endpoint rotation, adjacent switch samples, steady point emission, and malformed timing; shadow and native render mapping have separate tests.
 * @evidence contracts/development/testing.md#execution-ownership Named synchronous film unit using in-memory source and engine light resolution. Starts no host and makes no claim about rendered illumination.
 * @evidence contracts/development/common.md#meaningful-documentation Scenarios identify the lens, world-motion channels, sampling boundaries and switch semantics under test.
 */
export function test_film_practical_light_motion(): void {
  const torch: ReturnType<typeof createTorch> = createTorch({}, "practical");
  const length: number = torch.dimensions.length!;
  const diagonal: number = Math.SQRT2 * length;
  const script: IAutoMovieScript = makeScriptWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite({
      set: [
        {
          node: "held-torch",
          model: torch.id,
          position: { x: -1, y: 2, z: 3 },
          scale: { x: 1, y: 2, z: 1 },
        },
      ],
      lights: [
        {
          node: "practical/beam~spot",
          type: "spot",
          position: { x: -1, y: 2, z: 3 },
          direction: { x: 0, y: 1, z: 0 },
          color: { r: 1, g: 0.8, b: 0.6, a: null, hex: null },
          intensity: 7,
          range: 12,
          coneAngle: 15,
        },
      ],
    }),
  );
  if (!staged.success) throw new Error(JSON.stringify(staged.violations));
  const light: IAutoMovieLight | undefined = staged.scene.lights[0];
  if (light?.type !== "spot") throw new Error("the practical must be a spot");
  const prop: IAutoMovieSceneNode = staged.scene.nodes.find(
    (node: IAutoMovieSceneNode): boolean => node.id === "held-torch",
  )!;

  const objectMotion: IAutoMovieClip = {
    id: "turn-the-torch",
    name: null,
    duration: 1,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "held-torch", path: "translation" },
        times: [0.25, 0.75],
        values: [1, 2, 3, 3, 2, 3],
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: "held-torch", path: "rotation" },
        times: [0.5, 1],
        values: [0, 0, 0, 1, 0, 0, -Math.SQRT1_2, Math.SQRT1_2],
        interpolation: "linear",
      },
    ],
  };
  const input: IAutoMovieCompilePracticalLightMotion = {
    id: "lens-emission",
    duration: 1,
    light,
    prop,
    objectMotions: [objectMotion],
    emitter: torch.affordance("lens"),
    sampleTimes: [0.75, 0.375, 0.75],
    on: [0.375, 0.875],
  };
  const binding: IAutoMoviePracticalLightBinding = {
    id: input.id,
    light: light.id,
    prop: prop.id,
    emitter: "lens",
    sampleTimes: input.sampleTimes,
    on: input.on,
  };
  const props: IAutoMoviePerformShotProps = {
    script,
    staged,
    performance: makePerformanceWrite({
      duration: 1,
      draft: [
        {
          verb: "gesture",
          actor: "knightA",
          start: 0,
          duration: 1,
          kind: "wave",
        },
      ],
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    practicalLights: [binding],
    models: [torch],
    objectMotions: [objectMotion],
  };
  const performed: IAutoMoviePerformedShot = performShot(props);
  if (!performed.success) throw new Error(JSON.stringify(performed.violations));
  const clips: IAutoMovieClip[] | undefined = performed.shot.lightMotions;
  if (clips === undefined)
    throw new Error("shot lost its practical light motion");
  const at: (seconds: number) => IAutoMovieLight = (
    seconds: number,
  ): IAutoMovieLight =>
    resolveShotLighting({ lights: staged.scene.lights, clips, seconds })[0]!;
  const aim: (state: IAutoMovieLight) => IAutoMovieVector3 = (
    state: IAutoMovieLight,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(state.transform.rotation, { x: 0, y: 0, z: -1 });

  TestValidator.predicate(
    "staged frame supplies the emitter before object channels begin",
    vclose(at(0).transform.translation, { x: -1, y: 2 + 2 * length, z: 3 }) &&
      vclose(aim(at(0)), { x: 0, y: 1, z: 0 }),
  );
  TestValidator.predicate(
    "translation alone advances the emitter while retaining staged rotation and scale",
    vclose(at(0.375).transform.translation, {
      x: 1.5,
      y: 2 + 2 * length,
      z: 3,
    }) && vclose(aim(at(0.375)), { x: 0, y: 1, z: 0 }),
  );
  TestValidator.predicate(
    "the lens offset and beam turn together at the sampled midpoint",
    vclose(at(0.75).transform.translation, {
      x: 3 + diagonal,
      y: 2 + diagonal,
      z: 3,
    }) && vclose(aim(at(0.75)), { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 }),
  );
  TestValidator.predicate(
    "emitter placement keeps following the prop after switch-off",
    vclose(at(1).transform.translation, { x: 3 + 2 * length, y: 2, z: 3 }) &&
      vclose(aim(at(1)), { x: 1, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "the switch is an exact half-open interval",
    nclose(at(0.374999).intensity, 0) &&
      nclose(at(0.375).intensity, 7) &&
      nclose(at(0.874999).intensity, 7) &&
      nclose(at(0.875).intensity, 0) &&
      nclose(at(1).intensity, 0),
  );

  const carried: IAutoMoviePerformedShot = performShot({
    ...props,
    objectMotions: [],
    performance: {
      ...props.performance,
      draft: [
        ...props.performance.draft,
        {
          verb: "attachTo",
          actor: "held-torch",
          parent: "knightA",
          bone: "leftHand",
          start: 0,
          duration: 1,
        },
      ],
    },
  });
  if (!carried.success) throw new Error(JSON.stringify(carried.violations));
  const followed: IAutoMovieClip = carried.shot.objectMotions[0]!;
  const attached: Map<string, IAutoMovieSampledChannel> = sampleClip(
    followed,
    0.75,
  );
  const origin: number[] = attached.get("node:held-torch:translation")!.value;
  const turn: number[] = attached.get("node:held-torch:rotation")!.value;
  const orientation: IAutoMovieQuaternion = {
    x: turn[0]!,
    y: turn[1]!,
    z: turn[2]!,
    w: turn[3]!,
  };
  const carriedBeam: IAutoMovieVector3 = Quaternion.rotateVector(orientation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const carriedLight: IAutoMovieLight = resolveShotLighting({
    lights: staged.scene.lights,
    clips: carried.shot.lightMotions ?? [],
    seconds: 0.75,
  })[0]!;
  TestValidator.predicate(
    "the practical follows the baked attachment rather than the staged decoy",
    vclose(aim(carriedLight), carriedBeam) &&
      vclose(carriedLight.transform.translation, {
        x: origin[0]! + carriedBeam.x * 2 * length,
        y: origin[1]! + carriedBeam.y * 2 * length,
        z: origin[2]! + carriedBeam.z * 2 * length,
      }) &&
      !vclose(carriedLight.transform.translation, at(0).transform.translation),
  );

  const point: IAutoMovieCompilePracticalLightMotion["light"] = {
    id: "practical-point",
    type: "point",
    transform: Transform.identity(),
    color: light.color,
    intensity: 4,
    range: 3,
  };
  const still: IAutoMovieClip = compilePracticalLightMotion({
    id: "still-emission",
    duration: input.duration,
    prop: input.prop,
    emitter: input.emitter,
    light: point,
  });
  const steady: IAutoMovieLight = resolveShotLighting({
    lights: [point],
    clips: [still],
    seconds: 1,
  })[0]!;
  TestValidator.predicate(
    "a still point source uses staged emission and no direction channel",
    steady.type === "point" &&
      nclose(steady.intensity, 4) &&
      nclose(steady.range, 3) &&
      steady.transform.rotation === point.transform.rotation &&
      vclose(steady.transform.translation, { x: -1, y: 2 + 2 * length, z: 3 }),
  );
  TestValidator.predicate(
    "unrealizable timing and omitted moving-prop frame samples are refused",
    throwsError(
      (): IAutoMovieClip =>
        compilePracticalLightMotion({ ...input, on: [0.8, 0.2] }),
      "interval",
    ) &&
      throwsError(
        (): IAutoMovieClip =>
          compilePracticalLightMotion({ ...input, sampleTimes: [1.1] }),
        "sample times",
      ) &&
      throwsError(
        (): IAutoMovieClip =>
          compilePracticalLightMotion({ ...input, sampleTimes: [] }),
        "sample times are required",
      ),
  );

  const invalid: IAutoMoviePerformedShot = performShot({
    ...props,
    practicalLights: [
      { ...binding, emitter: "missing" },
      { ...binding, sampleTimes: undefined },
    ],
  });
  TestValidator.predicate(
    "bad emitter and missing motion samples identify their authored bindings",
    !invalid.success &&
      invalid.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.practicalLights[0].emitter",
      ) &&
      invalid.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.practicalLights[1]" &&
          item.expected.includes("sample times are required"),
      ),
  );
  const conflicting: IAutoMoviePerformedShot = performShot({
    ...props,
    lightMotions: [compilePracticalLightMotion({ ...input, id: "manual" })],
  });
  TestValidator.predicate(
    "a manual light clip cannot also own a channel the practical binding writes",
    !conflicting.success &&
      conflicting.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path.startsWith("$input.practicalLights[0].tracks") &&
          item.expected.includes("must be unique"),
      ),
  );
}
