import type {
  IAutoMovieCompiledFormationLod,
  IAutoMovieCompiledPopulationRepresentation,
  IAutoMovieModelLod,
} from "@automovie/interface";

import { productionRuntimeModelId } from "../../model/internal/productionRuntimeModelId";
import { compiledLodModelDigest } from "./compiledLodModelDigest";

/**
 * The compiled tiers and measured or fallback radius of one population
 * prototype.
 *
 * A formation's anonymous members and each prototype of an instance set are
 * drawn the same way: through the tiers the population design declares, or
 * through one `near` tier of the base model group when it declares none, each
 * bound to its model group digest and runtime model id. The member radius is
 * the largest radius over those tiers, where a tier whose group has no known
 * radius borrows the base group's, and one with neither is half a metre; no
 * member is ever smaller than a centimetre for projection. The kernel does not
 * verify supplied estimates against geometry; the fallback is an estimate for
 * missing geometry, and any enclosure proof belongs to the host.
 *
 * Radii are supplied by the host, which measures its own model groups and
 * adopted proxies, so this reads a table and never inspects geometry.
 *
 * The caller chooses which declared tiers apply: a formation's anonymous batch
 * drops the `hero` tier, which is drawn by named nodes, while an instance set
 * has no heroes and keeps every tier. Shared by both kernels; package-private.
 */
export const compiledPopulationRepresentation: (
  props: IAutoMovieCompiledPopulationRepresentation.IProps,
) => IAutoMovieCompiledPopulationRepresentation.IResult = (
  props: IAutoMovieCompiledPopulationRepresentation.IProps,
): IAutoMovieCompiledPopulationRepresentation.IResult => {
  const lod: IAutoMovieCompiledFormationLod[] = (
    props.tiers.length === 0
      ? [
          {
            tier: "near" as const,
            maxDistance: null,
            model: props.model,
          },
        ]
      : props.tiers
  ).map(
    (item: IAutoMovieModelLod): IAutoMovieCompiledFormationLod => ({
      ...item,
      modelDigest: compiledLodModelDigest(props.models, item.model),
      runtimeModel: productionRuntimeModelId(item.model),
    }),
  );
  return {
    lod,
    projectionRadius: Math.max(
      0.01,
      ...lod.map(
        (item: IAutoMovieCompiledFormationLod): number =>
          props.projectionRadii.get(item.model) ??
          props.projectionRadii.get(props.model) ??
          0.5,
      ),
    ),
  };
};
