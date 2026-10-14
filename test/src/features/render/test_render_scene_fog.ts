import { IAutoMovieModelObject } from "../../../../packages/viewer/src/IAutoMovieModelObject";
import { IAutoMoviePoseKeypointFrame } from "../../../../packages/render/src/IAutoMoviePoseKeypointFrame";
import { IAutoMoviePoseKeypointActor } from "../../../../packages/render/src/IAutoMoviePoseKeypointActor";
import { IAutoMoviePoseKeypointSidecar } from "../../../../packages/render/src/IAutoMoviePoseKeypointSidecar";
import { IAutoMovieSkeleton, IAutoMovieFog, IAutoMovieMotion, IAutoMovieScene, IAutoMovieSequence, IAutoMovieShot, IAutoMovieTransform } from "@automovie/interface";
import { sceneFogTransmittance } from "../../../../packages/engine/src/scene/sceneFogTransmittance";
import { planPoseKeypointSidecar } from "../../../../packages/render/src/planPoseKeypointSidecar";
import { renderPoseKeypointSidecar } from "../../../../packages/render/src/renderPoseKeypointSidecar";
import { buildModel } from "../../../../packages/viewer/src/buildModel";
import { buildScene } from "../../../../packages/viewer/src/buildScene";
import { TestValidator } from "@nestia/e2e";
import { createModel, createSkeleton, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { namedFacts, nclose } from "../internal/predicates";
import * as THREE from "three";




const IDENTITY_Q: { x: number; y: number; z: number; w: number; } = { x: 0, y: 0, z: 0, w: 1 };
const t3: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: IDENTITY_Q,
  scale: { x: 1, y: 1, z: 1 },
});

const skeleton: IAutoMovieSkeleton = createSkeleton();

const FOG: IAutoMovieFog = {
  density: 0.02,
  color: { r: 0.6, g: 0.65, b: 0.7, a: null, hex: null },
};

/** Depths the receding actor is at on the two sampled output frames. */
const NEAR_DEPTH: number = 5;
const FAR_DEPTH: number = 25;

/** A 1 s clip whose root recedes from 5 m to 45 m down the camera's −Z. */
const recede: () => IAutoMovieMotion = (): IAutoMovieMotion => ({
  ...makeMotion(
    [
      keyframe(0, makePose([], t3(0, 0, -NEAR_DEPTH))),
      keyframe(1, makePose([], t3(0, 0, -45))),
    ],
    1,
  ),
  id: "m1",
});

const sceneOf: (fog: IAutoMovieFog | null | undefined) => IAutoMovieScene = (fog: IAutoMovieScene["fog"]): IAutoMovieScene => ({
  id: "scene-1",
  name: null,
  nodes: [
    {
      id: "hero",
      model: "m",
      transform: t3(0, 0, 0),
      motion: null,
      pose: null,
    },
  ],
  cameras: [
    {
      id: "cam",
      transform: t3(0, 0, 0),
      fovY: 60,
      near: 0.1,
      far: 200,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
    },
  ],
  lights: [],
  fog,
});

const shot: IAutoMovieShot = {
  id: "shot:b1",
  name: null,
  scene: "scene-1",
  camera: "cam",
  cameraMotion: null,
  performances: [{ node: "hero", motion: "m1", startOffset: 0 }],
  objectMotions: [],
  duration: 1,
};

const sequence: IAutoMovieSequence = {
  id: "seq-1",
  name: null,
  fps: 24,
  shots: [{ shot: "shot:b1", trim: null, transition: null }],
};

/** Two output frames: the actor at 5 m, then the same actor at 25 m. */
const sidecarOf: (fog: IAutoMovieFog | null | undefined) => IAutoMoviePoseKeypointSidecar = (fog: IAutoMovieScene["fog"]): IAutoMoviePoseKeypointSidecar =>
  planPoseKeypointSidecar({
    sequence,
    shots: [shot],
    scenes: [sceneOf(fog)],
    motions: [recede()],
    skeletons: [skeleton],
    fps: 2,
  });

const actorOn: (fog: IAutoMovieFog | null | undefined, frame: number) => IAutoMoviePoseKeypointActor = (fog: IAutoMovieScene["fog"], frame: number): IAutoMoviePoseKeypointActor =>
  sidecarOf(fog).frames[frame]!.actors[0]!;

/**
 * The pose sidecar predicts fog transmittance at live actor depths using the same declared density that constructs the viewer's FogExp2 object.
 *
 * This portable test compares CPU-side prediction, serialized field omission and a JavaScript transcription of the squared-depth expression. It starts no renderer or GPU, so its agreement does not certify actual pixels, shader precision or cross-host byte equality.
 *
 * Scenarios (camera at the origin looking down −Z, one actor receding):
 *
 * 1. Absent or null fog omits the sidecar field and serialized atmosphere key; this checks omission rather than comparison with a historical byte artifact.
 * 2. Declared fog attenuates the far frame more than the near one using the actor's live root depth. The node stays at the origin while its clip carries the travel, so staged-depth substitution would report depth-zero transmittance on both frames.
 * 3. The built FogExp2 density and its JavaScript squared-depth expression agree with sidecar predictions at the two selected depths within 1e-12. Actual shader execution is not observed.
 *
 * @evidence contracts/testing.md#behavioral-verification Plans real fog-aware sidecars and inspects a built Three FogExp2 object, detecting staged-depth substitution, omitted density or unwanted atmosphere fields.
 * @evidence contracts/testing.md#independent-expectations The authored root depths five and 25 metres and exp(-(density times depth)^2) give selected CPU expectations within 1e-12. Engine helper agreement is a consistency check; the separate JavaScript expression and object density check do not execute a shader or certify historical/cross-host bytes.
 * @evidence contracts/testing.md#distinguishing-cases Absent and null fog contrast with near/far receding frames, including omission in JSON and the actual built fog density. Pixel appearance, shader precision and other fog profiles are not asserted.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_scene_fog owns its cases. Portable Engine sidecar and Three object construction only, with no renderer, browser or GPU.
 */
export function test_render_scene_fog(): void {
  // 1. An absent declaration omits the field and its serialized key.
  const clear: IAutoMoviePoseKeypointSidecar = sidecarOf(undefined);
  TestValidator.equals(
    "a scene without fog writes a sidecar without atmosphere",
    namedFacts([
      [
        "fieldAbsent",
        (): boolean => clear.frames.every((f: IAutoMoviePoseKeypointFrame): boolean => !("atmosphere" in f.actors[0]!)),
      ],
      [
        "bytesUnchanged",
        (): boolean => renderPoseKeypointSidecar(clear).includes("atmosphere") === false,
      ],
      ["nullIsAbsentToo", (): boolean => !("atmosphere" in actorOn(null, 0))],
    ]),
    { fieldAbsent: true, bytesUnchanged: true, nullIsAbsentToo: true },
  );

  // 2. the far frame is the more attenuated one, by the exact law.
  const near: number | undefined = actorOn(FOG, 0).atmosphere;
  const far: number | undefined = actorOn(FOG, 1).atmosphere;
  TestValidator.equals(
    "the distant frame keeps less of the actor than the near one",
    namedFacts([
      ["nearPresent", (): boolean => near !== undefined],
      ["farPresent", (): boolean => far !== undefined],
      ["farIsDimmer", (): boolean => far! < near!],
      // These two depths are the clip's, not the node's: the node sits at the
      // origin for the whole shot and the performance carries all the travel,
      // so a sidecar keyed to the staged transform would report the depth-zero
      // transmittance of exactly one on both frames. Saying separately that the
      // two numbers differ would only restate `farIsDimmer`.
      [
        "nearIsExact",
        (): boolean => nclose(near!, sceneFogTransmittance(FOG, NEAR_DEPTH), 1e-12),
      ],
      [
        "farIsExact",
        (): boolean => nclose(far!, sceneFogTransmittance(FOG, FAR_DEPTH), 1e-12),
      ],
    ]),
    {
      nearPresent: true,
      farPresent: true,
      farIsDimmer: true,
      nearIsExact: true,
      farIsExact: true,
    },
  );

  // 3. compare the built fog object and a CPU transcription of the expression.
  const viewerFog: THREE.Fog | THREE.FogExp2 | null = buildScene(sceneOf(FOG), (): IAutoMovieModelObject =>
    buildModel({ ...createModel(), id: "m" }),
  ).scene.fog;
  if (!(viewerFog instanceof THREE.FogExp2))
    throw new Error("the viewer must build an exponential fog for this scene");
  const shaderAt: (depth: number) => number = (depth: number): number =>
    1 - (1 - Math.exp(-viewerFog.density * viewerFog.density * depth * depth));
  TestValidator.equals(
    "viewer and renderer derive the same value from the same declaration",
    namedFacts([
      ["sameDensity", (): boolean => nclose(viewerFog.density, FOG.density, 1e-12)],
      ["nearAgrees", (): boolean => nclose(near!, shaderAt(NEAR_DEPTH), 1e-12)],
      ["farAgrees", (): boolean => nclose(far!, shaderAt(FAR_DEPTH), 1e-12)],
    ]),
    { sameDensity: true, nearAgrees: true, farAgrees: true },
  );
}
