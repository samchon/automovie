import type { IGeometryFormationTestCompiledShotProps } from "./IGeometryFormationTestCompiledShotProps";
import { IAutoMovieCompiledShotSource, IAutoMovieQuaternion, IAutoMovieSceneNode } from "@automovie/interface";
import { createModel, createSkeleton, joint, keyframe, makeMotion, makePose } from "./fixtures";


const LOOKING_BACK: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };


const SWAY = {
  ...makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftLowerArm", { flexion: 5 })], {
          translation: { x: 0, y: 0, z: 1 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
      keyframe(
        4,
        makePose([joint("leftLowerArm", { flexion: 5 })], {
          translation: { x: 0, y: 0, z: 1 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
    ],
    4,
  ),
  id: "sway",
};


/** Stage the banner and its optional performance with the requested compiled formation. */
export const geometryFormationTestCompiledShot = (props: IGeometryFormationTestCompiledShotProps): IAutoMovieCompiledShotSource => {
  const hero = props.runtime?.heroes[0];
  const nodes: IAutoMovieSceneNode[] =
    props.banner === "absent" || hero === undefined
      ? []
      : [
          {
            id: "banner",
            model: props.banner === "performed" ? "rigged-banner" : "banner",
            transform: hero.transform,
            motion: props.banner === "performed" ? "sway" : null,
            pose: null,
          },
        ];
  return {
    eventSamples: [],
    scene: {
      id: `${props.id}-scene`,
      name: null,
      nodes,
      cameras: [
        {
          id: "cam",
          transform: {
            translation: { x: 0, y: 6, z: 20 },
            rotation: props.cameraRotation ?? LOOKING_BACK,
            scale: { x: 1, y: 1, z: 1 },
          },
          fovY: 60,
          near: 0.1,
          far: 100,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
      lights: [],
    },
    motions: [SWAY],
    shot: {
      id: props.id,
      name: null,
      scene: `${props.id}-scene`,
      camera: props.cameraId ?? "cam",
      cameraMotion: null,
      performances: [],
      objectMotions: [],
      duration: 4,
    },
    models: [
      { ...createModel(null), id: "banner" },
      { ...createModel(createSkeleton()), id: "rigged-banner" },
    ],
    formations: props.runtime === null ? [] : [props.runtime],
    instanceSets: [],
    formationMotions: [],
    formationSlotMotions: props.slotMotions ?? [],
    effects: [],
  };
};
