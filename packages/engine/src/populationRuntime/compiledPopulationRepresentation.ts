import type {
  IAutoMovieCompiledFormationLod,
  IAutoMovieModel,
  IAutoMovieModelLod,
} from "@automovie/interface";

import { productionRuntimeModelId } from "../productionRuntimeModelId";
import { compiledLodModelDigest } from "./compiledLodModelDigest";

/**
 * The compiled tiers and measured or fallback radius of one population prototype.
 *
 * A formation's anonymous members and each prototype of an instance set are
 * drawn the same way: through the tiers the population design declares, or
 * through one `near` tier of the base model group when it declares none, each
 * bound to its model group digest and runtime model id. The member radius is
 * the largest radius over those tiers, where a tier whose group has no known
 * radius borrows the base group's, and one with neither is half a metre; no
 * member is ever smaller than a centimetre for projection. The kernel does not verify supplied estimates against geometry; the fallback is an estimate for missing geometry, and any enclosure proof belongs to the host.
 *
 * Radii are supplied by the host, which measures its own model groups and
 * adopted proxies, so this reads a table and never inspects geometry.
 *
 * The caller chooses which declared tiers apply: a formation's anonymous batch
 * drops the `hero` tier, which is drawn by named nodes, while an instance set
 * has no heroes and keeps every tier. Shared by both kernels; package-private.
 *
 * @evidence contracts/common.md#principled-implementation Bind applicable tiers to canonical model group digests and runtime model ids, defaulting an empty list to base near; choose the maximum supplied tier radius with base then 0.5m fallback and a 0.01m floor. Supplied estimates are not geometrically verified here, and fallback does not prove conservative enclosure.
 * @evidence contracts/common.md#clear-and-simple-design The population design declares tiers and the host measures geometry; this shared helper composes those inputs with the referenced model groups and no registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The explicit legacy radius fallback and near-tier default remain caller policy; neither a model id nor expected viewport result selects a hidden measurement.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish measured radii from fallback estimates, metre units, caller-selected hero filtering and per-tier model/digest references.
 * @evidence contracts/performance.md#efficient-algorithms T tiers require O(T) map lookups plus canonicalization/hash cost of referenced model bytes and O(T) returned records; the argument spread still scales with admitted tier count.
 * @evidence contracts/performance.md#reuse-equivalent-work Formation and instance compilers share this representation owner; tier digests are recomputed because model maps and measured radii can mutate.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fresh tier records and one radius transfer to the caller; no registry, measurement task or cache is retained.
 */
export const compiledPopulationRepresentation: (props: {
  /** Base model group the population prototype names. */ model: string;
  /** Declared tiers that apply to this population, before the default. */ tiers: readonly IAutoMovieModelLod[];
  /** Model groups keyed by the id populations and tiers name, for tier digests. */ models: ReadonlyMap<
    string,
    IAutoMovieModel
  >;
  /** Supplied root-centered radius estimate in metres keyed by model group id. */ projectionRadii: ReadonlyMap<
    string,
    number
  >;
}) => {
  lod: IAutoMovieCompiledFormationLod[];
  projectionRadius: number;
} = (props: {
  /** Base model group the population prototype names. */
  model: string;
  /** Declared tiers that apply to this population, before the default. */
  tiers: readonly IAutoMovieModelLod[];
  /** Model groups keyed by the id populations and tiers name, for tier digests. */
  models: ReadonlyMap<string, IAutoMovieModel>;
  /** Supplied root-centered radius estimate in metres keyed by model group id. */
  projectionRadii: ReadonlyMap<string, number>;
}): { lod: IAutoMovieCompiledFormationLod[]; projectionRadius: number } => {
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
