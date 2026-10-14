import type {
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceAdapterResult } from "./IFilmCameraClearanceAdapterResult";
import type { IFilmCameraClearanceDeformationInputs } from "./IFilmCameraClearanceDeformationInputs";
import { createModel, createSkeleton } from "./fixtures";

/** Run the original articulated reach, unsupported deformation and motion boundary assertions. */
export function assertFilmCameraClearanceDeformation(
  input: IFilmCameraClearanceDeformationInputs,
): IAutoMovieClip {
  const {
    performed,
    clearStage,
    heroCamera,
    sourceNode,
    movingNode,
    propModel,
    inspectAdapter,
    runtimeModels,
    identity,
    offClockCameraMotion,
    runtime,
  }: IFilmCameraClearanceDeformationInputs = input;
  const [actorNode, actorMotion]: [string, IAutoMovieMotion] = Object.entries(
    performed.motions,
  )[0]!;
  const foldedSkeleton: IAutoMovieSkeleton = createSkeleton();
  foldedSkeleton.bones = foldedSkeleton.bones.map(
    (
      bone: IAutoMovieSkeleton["bones"][number],
    ): IAutoMovieSkeleton["bones"][number] =>
      bone.bone === "leftUpperArm"
        ? { ...bone, rest: identity(2) }
        : bone.bone === "leftLowerArm"
          ? { ...bone, rest: identity(-2) }
          : bone,
  );
  const foldedRigModel: IAutoMovieModel = {
    ...createModel(foldedSkeleton),
    id: "folded-rig",
    parts: [
      ...createModel(foldedSkeleton).parts.map(
        (
          part: IAutoMovieModel["parts"][number],
        ): IAutoMovieModel["parts"][number] => ({
          ...part,
          attachedBone: "leftLowerArm" as const,
        }),
      ),
      {
        id: "folded-skin",
        name: null,
        geometry: {
          type: "mesh" as const,
          mesh: {
            positions: [0, 0, 0, 0.1, 0, 0, 0, 0.1, 0],
            normals: null,
            uvs: null,
            indices: [0, 1, 2],
            skin: {
              joints: ["leftLowerArm" as const],
              boneIndices: new Array<number>(12).fill(0),
              weights: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            },
          },
        },
        material: null,
        attachedBone: null,
        transform: null,
      },
    ],
  };
  const cameraPosition: IAutoMovieVector3 = heroCamera.transform.translation;
  const foldedRigNode: IAutoMovieSceneNode = {
    ...sourceNode,
    id: "folded-rig",
    model: foldedRigModel.id,
    transform: identity(
      cameraPosition.x + 5,
      cameraPosition.y,
      cameraPosition.z,
    ),
  };
  const extendedRig: IFilmCameraClearanceAdapterResult = inspectAdapter({
    scene: {
      ...clearStage.scene,
      nodes: [...clearStage.scene.nodes, foldedRigNode],
    },
    motions: { [foldedRigNode.id]: actorMotion },
    models: [...runtimeModels(), foldedRigModel],
  });
  TestValidator.predicate(
    "a folded rig keeps the full articulated and skinned deformation reach",
    extendedRig.reports === undefined &&
      extendedRig.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path.endsWith(".clearance.body") &&
          item.expected.includes('obstacle "folded-rig"'),
      ),
  );

  const malformedRig: (
    id: string,
    bones: IAutoMovieSkeleton["bones"],
  ) => IFilmCameraClearanceAdapterResult = (
    id: string,
    bones: IAutoMovieSkeleton["bones"],
  ): IFilmCameraClearanceAdapterResult => {
    const model: IAutoMovieModel = {
      ...foldedRigModel,
      id,
      skeleton: { ...foldedSkeleton, id: `${id}-skeleton`, bones },
    };
    const node: IAutoMovieSceneNode = { ...foldedRigNode, id, model: id };
    return inspectAdapter({
      scene: { ...clearStage.scene, nodes: [...clearStage.scene.nodes, node] },
      motions: { [id]: actorMotion },
      models: [...runtimeModels(), model],
    });
  };
  const cyclicRig: IFilmCameraClearanceAdapterResult = malformedRig(
    "cyclic-rig",
    foldedSkeleton.bones.map(
      (
        bone: IAutoMovieSkeleton["bones"][number],
      ): IAutoMovieSkeleton["bones"][number] =>
        bone.bone === "hips" ? { ...bone, parent: "spine" as const } : bone,
    ),
  );
  const absentParentRig: IFilmCameraClearanceAdapterResult = malformedRig(
    "absent-parent-rig",
    foldedSkeleton.bones.map(
      (
        bone: IAutoMovieSkeleton["bones"][number],
      ): IAutoMovieSkeleton["bones"][number] =>
        bone.bone === "hips"
          ? {
              ...bone,
              parent: "missingBone" as (typeof bone)["parent"],
            }
          : bone,
    ),
  );
  const nonFiniteRig: IFilmCameraClearanceAdapterResult = malformedRig(
    "non-finite-rig",
    foldedSkeleton.bones.map(
      (
        bone: IAutoMovieSkeleton["bones"][number],
      ): IAutoMovieSkeleton["bones"][number] =>
        bone.bone === "hips"
          ? { ...bone, rest: identity(Number.POSITIVE_INFINITY) }
          : bone,
    ),
  );
  const overflowingRig: IFilmCameraClearanceAdapterResult = malformedRig(
    "overflowing-rig",
    foldedSkeleton.bones.map(
      (
        bone: IAutoMovieSkeleton["bones"][number],
      ): IAutoMovieSkeleton["bones"][number] =>
        bone.bone === "hips" || bone.bone === "spine"
          ? { ...bone, rest: identity(Number.MAX_VALUE) }
          : bone,
    ),
  );
  const radiusOverflowRig: IFilmCameraClearanceAdapterResult = malformedRig(
    "radius-overflow-rig",
    foldedSkeleton.bones.map(
      (
        bone: IAutoMovieSkeleton["bones"][number],
      ): IAutoMovieSkeleton["bones"][number] =>
        bone.bone === "leftLowerArm"
          ? { ...bone, rest: identity(Number.MAX_VALUE * 0.4) }
          : bone.bone === "leftUpperArm"
            ? { ...bone, rest: identity() }
            : bone,
    ),
  );
  const duplicatedRig: IFilmCameraClearanceAdapterResult = malformedRig(
    "duplicated-rig",
    [...foldedSkeleton.bones, foldedSkeleton.bones[0]!],
  );
  TestValidator.predicate(
    "malformed or overflowing public rig bounds are addressed at their staged obstacle",
    (
      [
        [cyclicRig, "exactly one root"],
        [absentParentRig, "is not a bone"],
        [nonFiniteRig, "non-finite"],
        [overflowingRig, "overflows"],
        [radiusOverflowRig, "deformation radius"],
        [duplicatedRig, "must be unique"],
      ] satisfies Array<[IFilmCameraClearanceAdapterResult, string]>
    ).every(
      ([result, expected]: [
        IFilmCameraClearanceAdapterResult,
        string,
      ]): boolean => {
        const inspected: IFilmCameraClearanceAdapterResult = result;
        return (
          inspected.reports === undefined &&
          inspected.out.items.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              item.path.endsWith(".model") && item.expected.includes(expected),
          )
        );
      },
    ),
  );

  const morphRefusal: IFilmCameraClearanceAdapterResult = inspectAdapter({
    scene: {
      ...clearStage.scene,
      nodes: [...clearStage.scene.nodes, movingNode],
    },
    motions: {},
    models: [...runtimeModels(), propModel],
    objectMotions: [
      {
        id: "unbounded-morph-expansion",
        name: null,
        duration: 2,
        loop: false,
        tracks: [
          {
            channel: {
              kind: "node",
              node: movingNode.id,
              path: "weights",
            },
            times: [0, 2],
            values: [0, 1],
            interpolation: "linear",
          },
        ],
      },
    ],
  });
  TestValidator.predicate(
    "morph expansion without a portable bound is refused at the exact track",
    morphRefusal.reports === undefined &&
      morphRefusal.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.objectMotions[0].tracks[0].channel.path" &&
          item.expected.includes("morph-target expansion envelope"),
      ),
  );

  const actorLoop: (
    firstRoot: IAutoMovieTransform | null,
    lastRoot: IAutoMovieTransform | null,
  ) => IAutoMovieMotion = (
    firstRoot: IAutoMovieTransform | null,
    lastRoot: IAutoMovieTransform | null,
  ): IAutoMovieMotion => ({
    ...actorMotion,
    loop: true,
    keyframes: actorMotion.keyframes.map(
      (
        keyframe: IAutoMovieMotion["keyframes"][number],
        index: number,
      ): IAutoMovieMotion["keyframes"][number] => ({
        ...keyframe,
        pose: {
          ...keyframe.pose,
          root:
            index === 0
              ? firstRoot
              : index === actorMotion.keyframes.length - 1
                ? lastRoot
                : keyframe.pose.root,
        },
      }),
    ),
  });
  const closedActorLoop: IFilmCameraClearanceAdapterResult = inspectAdapter({
    motions: {
      ...performed.motions,
      [actorNode]: actorLoop(identity(), identity()),
    },
  });
  const nullActorLoop: IFilmCameraClearanceAdapterResult = inspectAdapter({
    motions: { ...performed.motions, [actorNode]: actorLoop(null, null) },
  });
  const openActorLoop: IFilmCameraClearanceAdapterResult = inspectAdapter({
    motions: {
      ...performed.motions,
      [actorNode]: actorLoop(identity(), identity(1)),
    },
  });
  const mixedActorLoop: IFilmCameraClearanceAdapterResult = inspectAdapter({
    motions: {
      ...performed.motions,
      [actorNode]: actorLoop(null, identity()),
    },
  });
  const emptyActorLoop: IFilmCameraClearanceAdapterResult = inspectAdapter({
    motions: {
      ...performed.motions,
      [actorNode]: { ...actorMotion, loop: true, keyframes: [] },
    },
  });
  TestValidator.predicate(
    "only closed actor root and clearance-radius loops are sampled",
    [closedActorLoop, nullActorLoop].every(
      ({ reports, out }: IFilmCameraClearanceAdapterResult): boolean =>
        reports !== undefined && out.items.length === 0,
    ) &&
      [openActorLoop, mixedActorLoop, emptyActorLoop].every(
        ({ reports, out }: IFilmCameraClearanceAdapterResult): boolean =>
          reports === undefined &&
          out.items.some((item: IAutoMovieConstraintViolation): boolean =>
            item.expected.includes("loop seam"),
          ),
      ),
  );

  const objectLoop: (
    id: string,
    values: number[],
    interpolation?: "linear" | "cubicspline",
  ) => IFilmCameraClearanceAdapterResult = (
    id: string,
    values: number[],
    interpolation: "linear" | "cubicspline" = "linear",
  ): IFilmCameraClearanceAdapterResult =>
    inspectAdapter({
      scene: {
        ...clearStage.scene,
        nodes: [...clearStage.scene.nodes, movingNode],
      },
      motions: {},
      models: [...runtimeModels(), propModel],
      objectMotions: [
        {
          id,
          name: null,
          duration: 2,
          loop: true,
          tracks: [
            {
              channel: {
                kind: "node",
                node: movingNode.id,
                path: "translation",
              },
              times: [0, 2],
              values,
              interpolation,
            },
            {
              channel: {
                kind: "node",
                node: movingNode.id,
                path: "rotation",
              },
              times: [0, 2],
              values: [0, 0, 0, 1, 0, 1, 0, 0],
              interpolation: "linear",
            },
          ],
        },
      ],
    });
  const closedObjectLoop: IFilmCameraClearanceAdapterResult = objectLoop(
    "closed-object-loop",
    [30, 30, 30, 30, 30, 30],
  );
  const openObjectLoop: IFilmCameraClearanceAdapterResult = objectLoop(
    "open-object-loop",
    [30, 30, 30, 31, 30, 30],
  );
  const malformedObjectLoop: IFilmCameraClearanceAdapterResult = objectLoop(
    "malformed-object-loop",
    [30, 30, 30, 30, 30],
  );
  const cubicObjectLoop: IFilmCameraClearanceAdapterResult = objectLoop(
    "cubic-object-loop",
    [30, 30, 30, 30, 30, 30],
    "cubicspline",
  );
  TestValidator.predicate(
    "object loops close translation and scale while rotation remains sphere-invariant",
    closedObjectLoop.reports !== undefined &&
      closedObjectLoop.out.items.length === 0 &&
      [openObjectLoop, malformedObjectLoop].every(
        ({ reports, out }: IFilmCameraClearanceAdapterResult): boolean =>
          reports === undefined &&
          out.items.some((item: IAutoMovieConstraintViolation): boolean =>
            item.expected.includes("loop seam"),
          ),
      ) &&
      cubicObjectLoop.reports === undefined &&
      cubicObjectLoop.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.expected.includes("cubicspline"),
      ),
  );

  const cubicActor: IFilmCameraClearanceAdapterResult = inspectAdapter({
    motions: {
      ...performed.motions,
      [actorNode]: {
        ...actorMotion,
        keyframes: actorMotion.keyframes.map(
          (
            keyframe: IAutoMovieMotion["keyframes"][number],
            index: number,
          ): IAutoMovieMotion["keyframes"][number] =>
            index === 0
              ? {
                  ...keyframe,
                  easing: "cubicBezier" as const,
                  bezier: [0.25, -2, 0.75, 2] as const,
                }
              : keyframe,
        ),
      },
    },
  });
  const cubicCamera: IFilmCameraClearanceAdapterResult = inspectAdapter({
    hero: {
      camera: heroCamera,
      motion: {
        ...offClockCameraMotion,
        tracks: offClockCameraMotion.tracks.map(
          (track: IAutoMovieTrack): IAutoMovieTrack => ({
            ...track,
            interpolation: "cubicspline" as const,
          }),
        ),
      },
    },
  });
  const invalidSequence: IFilmCameraClearanceAdapterResult = inspectAdapter({
    hero: {
      camera: heroCamera,
      motion: { ...offClockCameraMotion, duration: 0 },
    },
  });
  const openLoop: IFilmCameraClearanceAdapterResult = inspectAdapter({
    hero: {
      camera: heroCamera,
      motion: {
        ...offClockCameraMotion,
        tracks: offClockCameraMotion.tracks.map(
          (track: IAutoMovieTrack): IAutoMovieTrack => ({
            ...track,
            values: track.values.map((value: number, index: number): number =>
              index >= track.values.length - 3 ? value + 1 : value,
            ),
          }),
        ),
      },
    },
  });
  TestValidator.predicate(
    "overshooting interpolation, open loops, and invalid sequences are addressed, never approximated",
    [cubicActor, cubicCamera, invalidSequence, openLoop].every(
      ({ reports, out }: IFilmCameraClearanceAdapterResult): boolean =>
        reports === undefined &&
        out.items.some((item: IAutoMovieConstraintViolation): boolean =>
          item.path.endsWith(".clearance"),
        ),
    ) &&
      cubicActor.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.expected.includes("cubicBezier"),
      ) &&
      cubicCamera.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.expected.includes("cubicspline"),
      ) &&
      openLoop.out.items.some((item: IAutoMovieConstraintViolation): boolean =>
        item.expected.includes("loop seam"),
      ),
  );

  const evaluatorFault: IFilmCameraClearanceAdapterResult = inspectAdapter({
    runtime: { ...runtime, sampleRate: 0 },
  });
  TestValidator.predicate(
    "an invalid builder clock is returned at the camera envelope",
    evaluatorFault.reports === undefined &&
      evaluatorFault.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.cameraClearance.sampleRate" &&
          item.expected.includes("sample rate"),
      ),
  );
  const invalidDuration: IFilmCameraClearanceAdapterResult = inspectAdapter({
    duration: -1,
  });
  TestValidator.predicate(
    "an invalid shot duration is returned at the declaring envelope",
    invalidDuration.reports === undefined &&
      invalidDuration.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path.endsWith(".clearance") &&
          item.expected.includes("duration"),
      ),
  );
  const hostileMotion: IAutoMovieClip = new Proxy(
    performed.shot.cameraMotion!,
    {
      get: (): never => {
        throw new Error("hostile camera motion");
      },
    },
  );
  const hostile: IFilmCameraClearanceAdapterResult = inspectAdapter({
    hero: { camera: heroCamera, motion: hostileMotion },
  });
  const hostileThrownValue: { [Symbol.toPrimitive](): never } = {
    [Symbol.toPrimitive]: (): never => {
      throw new Error("hostile diagnostic coercion");
    },
  };
  const hostileCoercionMotion: IAutoMovieClip = new Proxy(
    performed.shot.cameraMotion!,
    {
      get: (): never => {
        throw hostileThrownValue;
      },
    },
  );
  const hostileCoercion: IFilmCameraClearanceAdapterResult = inspectAdapter({
    hero: { camera: heroCamera, motion: hostileCoercionMotion },
  });
  TestValidator.predicate(
    "hostile runtime and diagnostic coercion remain addressed refusals",
    hostile.reports === undefined &&
      hostile.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path.endsWith(".clearance") &&
          item.expected.includes("hostile camera motion"),
      ) &&
      hostileCoercion.reports === undefined &&
      hostileCoercion.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path.endsWith(".clearance") &&
          item.expected.includes("an uninspectable thrown value"),
      ),
  );

  return hostileCoercionMotion;
}
