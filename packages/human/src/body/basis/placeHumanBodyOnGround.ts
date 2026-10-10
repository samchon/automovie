import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { measureHumanBodyGroundSupport } from "../measure/measureHumanBodyGroundSupport";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import type { IHumanBodyGroundPlacementProps } from "../structures/IHumanBodyGroundPlacementProps";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * Place the lowest of the two performed feet on the fixed source ground.
 *
 * This is a vertical rigid placement, not a joint solve. It keeps every
 * requested angle and every relative body position, so unequal foot heights
 * still leave the higher foot airborne. The caller explicitly requests this
 * placement; an omitted request retains an intentionally airborne pose.
 * The actual foot-region minimum determines the translation. The source-neutral floor and
 * rest landmarks stay fixed; posed bones, unsplit skin and every static part
 * receive that one translation so the person builder carries the head with
 * the same body. No weight, friction, balance or physiological claim follows.
 * A supplied pre-garment sourceSkinModel receives that same translation;
 * contact must not compare its old frame with the placed posedSurfaces.
 */
export function placeHumanBodyOnGround(
  props: IHumanBodyGroundPlacementProps,
): IAutoMovieHumanBodyBuild {
  const { basis, build } = props;
  const ground = basis.landmarks.ids.indexOf("joint-ground");
  if (ground === -1)
    throw new Error(
      "Lowest-foot placement needs the source-neutral joint-ground plane.",
    );
  const groundPlaneHeightMetres = basis.landmarks.positions[ground * 3 + 1];
  const support = measureHumanBodyGroundSupport(
    basis,
    build.posedSurfaces.map((surface) => surface.positions),
    build.landmarks,
    groundPlaneHeightMetres,
  );
  if (support === null || support.length !== 2)
    throw new Error(
      "Lowest-foot placement needs joint-ground and both registered foot skin regions.",
    );
  const shift = -Math.min(...support.map((foot) => foot.gapMetres));
  if (!Number.isFinite(shift))
    throw new Error("Lowest-foot placement needs finite final foot positions.");
  const translate = (positions: readonly number[]): number[] =>
    positions.map((value, index) => (index % 3 === 1 ? value + shift : value));
  const translateFrame = <T extends IAutoMovieHumanBodyBoneTransform>(
    bone: T,
  ): T => ({
    ...bone,
    posed: {
      ...bone.posed,
      position: { ...bone.posed.position, y: bone.posed.position.y + shift },
    },
  });
  const translateModel = (input: IAutoMovieModel): IAutoMovieModel => ({
    ...input,
    parts: input.parts.map((part) => {
      if (
        part.geometry.type !== "mesh" ||
        part.transform !== null ||
        part.attachedBone !== null
      )
        throw new Error(
          "Lowest-foot placement needs a static source-frame mesh: " + part.id,
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
    }),
  });
  const model = translateModel(build.model);
  const validation = validateModel({ model });
  if (!validation.success)
    throw new Error(
      "The ground-placed body is not a valid resident model: " +
        JSON.stringify(validation),
    );
  return {
    ...build,
    groundPlaneHeightMetres,
    model,
    ...(build.sourceSkinModel === undefined ? {} : {
      sourceSkinModel: translateModel(build.sourceSkinModel),
    }),
    posedSurfaces: build.posedSurfaces.map((surface) => ({
      ...surface,
      positions: translate(surface.positions),
    })),
    bones: build.bones.map(translateFrame),
    ...(build.anatomicalRig === undefined
      ? {}
      : {
          anatomicalRig: {
            bones: new Map(
              [...build.anatomicalRig.bones].map(
                ([id, bone]) => [id, translateFrame(bone)] as const,
              ),
            ),
            projections: new Map(
              [...build.anatomicalRig.projections].map(
                ([id, bone]) => [id, translateFrame(bone)] as const,
              ),
            ),
            toeProjections: new Map(
              [...build.anatomicalRig.toeProjections].map(
                ([id, bone]) => [id, translateFrame(bone)] as const,
              ),
            ),
            sites: new Map(
              [...build.anatomicalRig.sites].map(
                ([id, sites]) =>
                  [
                    id,
                    new Map(
                      [...sites].map(
                        ([site, position]) =>
                          [
                            site,
                            { ...position, y: position.y + shift },
                          ] as const,
                      ),
                    ),
                  ] as const,
              ),
            ),
          },
        }),
  };
}
