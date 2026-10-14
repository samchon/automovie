import { validateModel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieHumanBodyBoneId } from "../anatomy/identity/AutoMovieHumanBodyBoneId";
import { measureHumanBodyGroundSupport } from "../measure/measureHumanBodyGroundSupport";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyGroundPlacementProps } from "../structures/IHumanBodyGroundPlacementProps";
import type { AutoMovieHumanBodyToeBone } from "../structures/rig/AutoMovieHumanBodyToeBone";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * Place the lowest of the two performed feet on the fixed source ground.
 *
 * This is a vertical rigid placement, not a joint solve. It keeps every requested angle and every relative body position, so unequal foot heights still leave the higher foot airborne. The caller explicitly requests this placement; an omitted request retains an intentionally airborne pose. The actual foot-region minimum determines the translation. The source-neutral floor and rest landmarks stay fixed; posed bones, unsplit skin and every static part receive that one translation so the person builder carries the head with the same body. No weight, friction, balance or physiological claim follows. A supplied pre-garment sourceSkinModel receives that same translation; contact must not compare its old frame with the placed posedSurfaces.
 *
 * @evidence contracts/common.md#principled-implementation Actual performed foot-region gaps select one vertical shift, applied consistently to static meshes, posed skin/bones, anatomical sites and any retained source skin while neutral ground/rest landmarks stay fixed.
 * @evidence contracts/common.md#clear-and-simple-design Shared position, frame and model translation helpers carry one support-derived shift across every relevant build representation before returning the placed copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing ground/feet, nonfinite shift or nonstatic source meshes refuse; unequal feet remain unequal and placement supplies no joint IK, balance, friction or physiological guarantee.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies explicit request semantics, lowest-foot choice, shared source frame, unchanged rest data and the higher foot's remaining airborne state.
 * @evidence contracts/performance.md#efficient-algorithms Support measurement belongs to its foot owner, then translation and model validation walk affected coordinates/parts linearly; bones/sites add their actual record counts, with no iterative joint solve.
 * @evidence contracts/performance.md#reuse-equivalent-work One measured support shift and common translation helpers serve render skin, contact source and rig records, preserving material/topology objects instead of rebuilding unchanged channels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned build copies own translated coordinate/frame records while unchanged metadata remains shared; support/helper temporaries expire, with no persistent cache, external handle or task.
 */
export function placeHumanBodyOnGround(
  props: IHumanBodyGroundPlacementProps,
): IAutoMovieHumanBodyBuild {
  const { basis, build }: IHumanBodyGroundPlacementProps = props;
  const ground: number = basis.landmarks.ids.indexOf("joint-ground");
  if (ground === -1)
    throw new Error(
      "Lowest-foot placement needs the source-neutral joint-ground plane.",
    );
  const groundPlaneHeightMetres: number =
    basis.landmarks.positions[ground * 3 + 1];
  const support: ReturnType<typeof measureHumanBodyGroundSupport> =
    measureHumanBodyGroundSupport(
      basis,
      build.posedSurfaces.map(
        (
          surface: IAutoMovieHumanBodyBuild["posedSurfaces"][number],
        ): number[] => surface.positions,
      ),
      build.landmarks,
      groundPlaneHeightMetres,
    );
  if (support === null || support.length !== 2)
    throw new Error(
      "Lowest-foot placement needs joint-ground and both registered foot skin regions.",
    );
  const shift: number = -Math.min(
    ...support.map(
      (foot: NonNullable<typeof support>[number]): number => foot.gapMetres,
    ),
  );
  if (!Number.isFinite(shift))
    throw new Error("Lowest-foot placement needs finite final foot positions.");
  const translate: (positions: readonly number[]) => number[] = (
    positions: readonly number[],
  ): number[] =>
    positions.map((value: number, index: number): number =>
      index % 3 === 1 ? value + shift : value,
    );
  const translateFrame: <T extends IAutoMovieHumanBodyBoneTransform>(
    bone: T,
  ) => T = <T extends IAutoMovieHumanBodyBoneTransform>(bone: T): T => ({
    ...bone,
    posed: {
      ...bone.posed,
      position: { ...bone.posed.position, y: bone.posed.position.y + shift },
    },
  });
  const translateModel: (input: IAutoMovieModel) => IAutoMovieModel = (
    input: IAutoMovieModel,
  ): IAutoMovieModel => ({
    ...input,
    parts: input.parts.map(
      (
        part: IAutoMovieModel["parts"][number],
      ): IAutoMovieModel["parts"][number] => {
        if (
          part.geometry.type !== "mesh" ||
          part.transform !== null ||
          part.attachedBone !== null
        )
          throw new Error(
            "Lowest-foot placement needs a static source-frame mesh: " +
              part.id,
          );
        return {
          ...part,
          geometry: {
            type: "mesh" as const,
            mesh: {
              ...part.geometry.mesh,
              positions: translate(part.geometry.mesh.positions),
            },
          },
        };
      },
    ),
  });
  const model: IAutoMovieModel = translateModel(build.model);
  const validation: ReturnType<typeof validateModel> = validateModel({ model });
  if (!validation.success)
    throw new Error(
      "The ground-placed body is not a valid resident model: " +
        JSON.stringify(validation),
    );
  return {
    ...build,
    groundPlaneHeightMetres,
    model,
    ...(build.sourceSkinModel === undefined
      ? {}
      : {
          sourceSkinModel: translateModel(build.sourceSkinModel),
        }),
    posedSurfaces: build.posedSurfaces.map(
      (
        surface: IAutoMovieHumanBodyBuild["posedSurfaces"][number],
      ): IAutoMovieHumanBodyBuild["posedSurfaces"][number] => ({
        ...surface,
        positions: translate(surface.positions),
      }),
    ),
    bones: build.bones.map(translateFrame),
    ...(build.anatomicalRig === undefined
      ? {}
      : {
          anatomicalRig: {
            bones: new Map(
              [...build.anatomicalRig.bones].map(
                ([id, bone]: [
                  AutoMovieHumanBodyBoneId,
                  IAutoMovieHumanBodyBoneTransform,
                ]): [
                  AutoMovieHumanBodyBoneId,
                  IAutoMovieHumanBodyBoneTransform,
                ] => [id, translateFrame(bone)],
              ),
            ),
            projections: new Map(
              [...build.anatomicalRig.projections].map(
                ([id, bone]: [
                  AutoMovieHumanoidBone,
                  IAutoMovieHumanBodyBoneTransform,
                ]): [
                  AutoMovieHumanoidBone,
                  IAutoMovieHumanBodyBoneTransform,
                ] => [id, translateFrame(bone)],
              ),
            ),
            toeProjections: new Map(
              [...build.anatomicalRig.toeProjections].map(
                ([id, bone]: [
                  AutoMovieHumanBodyToeBone,
                  IAutoMovieHumanBodyBoneTransform,
                ]): [
                  AutoMovieHumanBodyToeBone,
                  IAutoMovieHumanBodyBoneTransform,
                ] => [id, translateFrame(bone)],
              ),
            ),
            sites: new Map(
              [...build.anatomicalRig.sites].map(
                ([id, sites]: [
                  AutoMovieHumanBodyBoneId,
                  ReadonlyMap<string, IAutoMovieVector3>,
                ]): [
                  AutoMovieHumanBodyBoneId,
                  ReadonlyMap<string, IAutoMovieVector3>,
                ] => [
                  id,
                  new Map(
                    [...sites].map(
                      ([site, position]: [string, IAutoMovieVector3]): [
                        string,
                        IAutoMovieVector3,
                      ] => [site, { ...position, y: position.y + shift }],
                    ),
                  ),
                ],
              ),
            ),
          },
        }),
  };
}
