import {
  measureAutoMovieGeometry,
  reachPose,
  validatePose,
} from "@automovie/engine";
import {
  AutoMovieGeometryQuery,
  IAutoMovieBone,
  IAutoMovieCamera,
  IAutoMovieCompiledShotSource,
  IAutoMovieModel,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel, createSkeleton } from "../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

const place: (translation: { x : number ; y : number ; z : number }, rotation?: IAutoMovieQuaternion, scale?: IAutoMovieVector3) => IAutoMovieTransform = (
  translation: { x: number; y: number; z: number },
  rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
  scale: IAutoMovieVector3 = { x: 1, y: 1, z: 1 },
): IAutoMovieTransform => ({ translation, rotation, scale });

const QUARTER_Y: IAutoMovieQuaternion = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };

/** The shared humanoid with its left lower arm collapsed onto the upper arm. */
const collapsedLeftSkeleton: () => IAutoMovieSkeleton = (): IAutoMovieSkeleton => {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  return {
    id: "collapsed-left",
    bones: [
      ...skeleton.bones.map(
        (bone: IAutoMovieBone): IAutoMovieBone =>
          bone.bone === "leftLowerArm"
            ? { ...bone, rest: place({ x: 0, y: 0, z: 0 }) }
            : bone,
      ),
      {
        bone: "rightHand",
        parent: "rightLowerArm",
        rest: place({ x: -0.25, y: 0, z: 0 }),
        constraint: null,
      },
    ],
  };
};

/** A spine and head with no arms at all. */
const armlessSkeleton: () => IAutoMovieSkeleton = (): IAutoMovieSkeleton => ({
  id: "armless",
  bones: createSkeleton().bones.filter(
    (bone: IAutoMovieBone): boolean =>
      bone.bone.includes("Arm") === false &&
      bone.bone.includes("Hand") === false,
  ),
});

const model: (id: string, skeleton: IAutoMovieSkeleton | null) => IAutoMovieModel = (
  id: string,
  skeleton: IAutoMovieSkeleton | null,
): IAutoMovieModel => ({
  ...createModel(skeleton),
  id,
});

const node: (id: string, modelId: string, transform?: IAutoMovieTransform) => IAutoMovieSceneNode = (
  id: string,
  modelId: string,
  transform: IAutoMovieTransform = place({ x: 0, y: 0, z: 0 }),
): IAutoMovieSceneNode => ({
  id,
  model: modelId,
  transform,
  motion: null,
  pose: null,
});

const camera: IAutoMovieCamera = {
  id: "cam",
  transform: place({ x: 0, y: 1, z: 10 }),
  fovY: 60,
  near: 0.1,
  far: 100,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
};

const shot: IAutoMovieCompiledShotSource = {
  eventSamples: [],
  scene: {
    id: "reach-scene",
    name: null,
    nodes: [
      node("hero", "rigged"),
      node("turned", "rigged", place({ x: 10, y: 0, z: 0 }, QUARTER_Y)),
      node(
        "flatX",
        "rigged",
        place({ x: 0, y: 0, z: 0 }, undefined, { x: 0, y: 1, z: 1 }),
      ),
      node(
        "flatY",
        "rigged",
        place({ x: 0, y: 0, z: 0 }, undefined, { x: 1, y: 0, z: 1 }),
      ),
      node(
        "flatZ",
        "rigged",
        place({ x: 0, y: 0, z: 0 }, undefined, { x: 1, y: 1, z: 0 }),
      ),
      node("collapsed", "collapsed-left"),
      node("armless", "armless"),
      node("crate", "crate"),
    ],
    cameras: [camera],
    lights: [],
  },
  motions: [],
  shot: {
    id: "reach",
    name: null,
    scene: "reach-scene",
    camera: "cam",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration: 4,
  },
  models: [
    model("rigged", createSkeleton()),
    model("collapsed-left", collapsedLeftSkeleton()),
    model("armless", armlessSkeleton()),
    model("crate", null),
  ],
  formations: [],
  instanceSets: [],
  formationMotions: [],
  formationSlotMotions: [],
  effects: [],
};

const measure: (actor: string, target: { x : number ; y : number ; z : number }, time?: number) => Record < string , number | string | boolean > = (
  actor: string,
  target: { x: number; y: number; z: number },
  time?: number,
): Record<string, number | string | boolean> => {
  const request: AutoMovieGeometryQuery = {
    query: "reach",
    actor,
    shot: "reach",
    target: { kind: "point", position: target },
    ...(time === undefined ? {} : { time }),
  };
  const result: ReturnType<typeof measureAutoMovieGeometry> = measureAutoMovieGeometry({
    request,
    design: {
      production: null,
      world: null,
      formations: new Map(),
      shots: new Map(),
    },
    compiled: new Map([["reach", shot]]),
    timeline: null,
  });
  if (result.kind !== "measurement")
    throw new Error("reach answers a measurement");
  return result.values;
};

/**
 * A reach query answers each arm's gap from its own rest chain, in the actor's
 * model space, and refuses an actor that has no arm to measure.
 *
 * The shared humanoid's left arm starts at the chest's side, 0.2 m out and
 * 1.4 m up, with a 0.3 m upper arm and a 0.25 m forearm, so its chain reaches
 * 0.55 m. Its right arm has no hand, so it is not a measurable chain. Every gap
 * below is that hand arithmetic; whether a solved reach stays inside the rig's
 * range is the engine's reach solver and pose validator, which this query
 * reports rather than decides.
 *
 * Scenarios:
 *
 * 1. A target 0.3 m from the left shoulder is reachable with no gap at the
 *    default time zero; the handless right arm is reported unmeasurable with no
 *    gap and no pose.
 * 2. A target 2 m from the shoulder leaves a 1.45 m gap and is unreachable at the
 *    asked time.
 * 3. The same reachable target expressed in the world for an actor turned a
 *    quarter about +Y and moved 10 m along x is still reachable, because the
 *    target is taken into model space before it is measured.
 * 4. An actor whose left forearm has zero length and whose right arm is whole
 *    reports the left arm unmeasurable and the right arm's own gap.
 * 5. A collapsed scale on any one axis, an actor with no skeleton, and a skeleton
 *    with no arm chain at all each refuse by name.
 * 6. A root quarter turn under nonuniform node scale preserves the two affine
 *    stages: a model target at x=2.2 maps to world z=-2.2, and the rest hand
 *    maps to z=-0.75. Flattening these stages doubles the wrong axis.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public reach and distance query entry; asserts arm gaps, measurability, ROM reporting and named refusal, including affine composition.
 * @evidence contracts/testing.md#independent-expectations Shoulder x=0.2 plus lengths 0.3+0.25 gives far gap 1.45; a +Y quarter turn sends x to -z before node x scaling. ROM comparisons only verify delegation to the separately tested pose validator.
 * @evidence contracts/testing.md#distinguishing-cases Near/far, handless/collapsed/absent chains, all three zero-scale axes and a translated turn distinguish refusal from valid measurements; the nonuniform root-turn case catches TRS flattening. Selector lookup and terrain boundaries belong to the selector suite.
 * @evidence contracts/testing.md#execution-ownership Portable unit test discovered as test_engine_geometry_query_reach by the repository test runner; this export directly owns every case and starts no host or native build.
 */
export function test_engine_geometry_query_reach(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const near: IAutoMovieVector3 = { x: 0.5, y: 1.4, z: 0 };
  const expectedLeftRom: (target: IAutoMovieVector3) => boolean = (target: IAutoMovieVector3): boolean => {
    const pose: ReturnType<typeof reachPose> = reachPose(skeleton, "left", target);
    return pose !== null && validatePose({ pose, skeleton }).items.length === 0;
  };

  const reachable: ReturnType<typeof measure> = measure("hero", near);
  const far: ReturnType<typeof measure> = measure("hero", { x: 2.2, y: 1.4, z: 0 }, 2);
  const turned: ReturnType<typeof measure> = measure("turned", { x: 10, y: 1.4, z: -0.5 });
  const collapsed: ReturnType<typeof measure> = measure("collapsed", { x: -0.5, y: 1.4, z: 0 });
  const affineShot: IAutoMovieCompiledShotSource = {
    ...shot,
    scene: {
      ...shot.scene,
      nodes: [{
        ...node("affine", "rigged", place({ x: 0, y: 0, z: 0 }, undefined, { x: 2, y: 1, z: 1 })),
        pose: { skeleton: skeleton.id, root: place({ x: 0, y: 0, z: 0 }, QUARTER_Y), joints: [] },
      }],
    },
  };
  const affineAsk: (request: AutoMovieGeometryQuery) => ReturnType < typeof measureAutoMovieGeometry > = (request: AutoMovieGeometryQuery): ReturnType<typeof measureAutoMovieGeometry> => measureAutoMovieGeometry({
    request,
    design: { production: null, world: null, formations: new Map(), shots: new Map() },
    compiled: new Map([[shot.shot.id, affineShot]]),
    timeline: null,
  });
  const affineReach: ReturnType<typeof affineAsk> = affineAsk({
    query: "reach", actor: "affine", shot: "reach",
    target: { kind: "point", position: { x: 0, y: 1.4, z: -2.2 } },
  });
  const affineHand: ReturnType<typeof affineAsk> = affineAsk({
    query: "distance", shot: "reach",
    from: { kind: "actor", actor: "affine", bone: "leftHand" },
    to: { kind: "point", position: { x: 0, y: 1.4, z: -0.75 } },
  });
  TestValidator.predicate("root turn is applied before nonuniform node scale for reach", (): boolean =>
    affineReach.kind === "measurement" && nclose(affineReach.values.leftGap as number, 1.45, 1e-9));
  TestValidator.predicate("bone selector preserves both affine stages", (): boolean =>
    affineHand.kind === "distance" && nclose(affineHand.meters, 0, 1e-9));

  TestValidator.equals(
    "a reach query measures each arm's own chain in model space",
    namedFacts([
      [
        "reachable",
        () : boolean => reachable.reachable === true && reachable.sampledTime === 0,
      ],
      [
        "leftChain",
        () : boolean =>
          reachable.leftMeasurable === true &&
          nclose(reachable.leftGap as number, 0, 1e-12),
      ],
      [
        "leftRomReported",
        () : boolean => reachable.leftPoseWithinRom === expectedLeftRom(near),
      ],
      [
        "rightHandless",
        () : boolean =>
          reachable.rightMeasurable === false &&
          reachable.rightGap === 0 &&
          reachable.rightPoseWithinRom === false,
      ],
      [
        "farGap",
        () : boolean =>
          nclose(far.leftGap as number, 1.45, 1e-12) && far.reachable === false,
      ],
      ["askedTime", () : boolean => far.sampledTime === 2],
      [
        "modelSpace",
        () : boolean =>
          turned.reachable === true &&
          nclose(turned.leftGap as number, 0, 1e-9),
      ],
      [
        "collapsedLeft",
        () : boolean =>
          collapsed.leftMeasurable === false &&
          collapsed.leftGap === 0 &&
          collapsed.leftPoseWithinRom === false,
      ],
      [
        "wholeRight",
        () : boolean =>
          collapsed.rightMeasurable === true &&
          nclose(collapsed.rightGap as number, 0, 1e-12) &&
          collapsed.reachable === true,
      ],
    ]),
    {
      reachable: true,
      leftChain: true,
      leftRomReported: true,
      rightHandless: true,
      farGap: true,
      askedTime: true,
      modelSpace: true,
      collapsedLeft: true,
      wholeRight: true,
    },
  );

  TestValidator.equals(
    "a reach query refuses an actor with nothing to measure",
    namedFacts([
      [
        "flatX",
        () : boolean =>
          throwsError(
            () : ReturnType<typeof measure> => measure("flatX", near),
            'Actor "flatX" has a degenerate current scale',
          ),
      ],
      [
        "flatY",
        () : boolean =>
          throwsError(
            () : ReturnType<typeof measure> => measure("flatY", near),
            'Actor "flatY" has a degenerate current scale',
          ),
      ],
      [
        "flatZ",
        () : boolean =>
          throwsError(
            () : ReturnType<typeof measure> => measure("flatZ", near),
            'Actor "flatZ" has a degenerate current scale',
          ),
      ],
      [
        "noSkeleton",
        () : boolean =>
          throwsError(
            () : ReturnType<typeof measure> => measure("crate", near),
            'Actor "crate" has no skeleton',
          ),
      ],
      [
        "noArms",
        () : boolean =>
          throwsError(
            () : ReturnType<typeof measure> => measure("armless", near),
            'Actor "armless" has no measurable upper-arm, lower-arm and hand chain',
          ),
      ],
    ]),
    { flatX: true, flatY: true, flatZ: true, noSkeleton: true, noArms: true },
  );
}
