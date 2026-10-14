import { validateAutoMovieSoftFurnishingDomainOwnership, validateFluidDomain, validatePlantingDomain, validatePlantingInstallations, validateServiceNetwork, validateSoftBodyDomain, validateSoftFurnishings, validateWaterFeatures, validateWetZones } from "@automovie/engine";
import { IAutoMovieProductionShotProgram, IAutoMovieValidation } from "@automovie/interface";
import type { IAutoMovieSourceContentFinding } from "./IAutoMovieSourceContentFinding";
import { autoMovieSourceContentFinding } from "./autoMovieSourceContentFinding";
import { autoMovieValidationFindings } from "./autoMovieValidationFindings";
import type { IProductionEnvironmentBindingAddress as IBindingAddress } from "./IProductionEnvironmentBindingAddress";
import { productionEnvironmentRewriteBindingPath as rewriteBindingPath } from "./productionEnvironmentRewriteBindingPath";
import { productionEnvironmentBindings as bindingsOfEnvironment } from "./productionEnvironmentBindings";

/**
 * Validate building-bound water, cloth, planting and service declarations with authored addresses.
 *
 * Unresolved building references become errors, then each staged environment receives its matching folds; standalone unbound domains are also checked. Engine success warnings and failure violations both retain their kind/severity through the shared finding adapter. Input list positions are restored after filtered validation.
 *
 * @evidence contracts/common.md#principled-implementation The existing engine domain/installation/network validators own physical and structural rules, while exact environment binding and local-to-authored path translation belong here. Unresolved references already block shot assembly even when their cited domain is not separately treated as unbound.
 * @evidence contracts/common.md#clear-and-simple-design The fold dispatcher keeps each validator beside its address mapping, and sourceRuntimeOf consumes the returned findings through one severity/catalog policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warnings are not discarded merely because validation succeeded, and missing buildings cannot bypass all per-building checks. The known-id set checks resolution but does not independently reject duplicate staged environment ids; repeated environments can repeat fold validation.
 * @evidence contracts/common.md#meaningful-documentation States matching and unbound-domain coverage, warning propagation, authored positions, missing-building refusal and duplicate-environment limitation.
 * @evidence contracts/performance.md#efficient-algorithms For E environments and W bound records, per-environment filtering can cost O(EW), with index copies and complete delegated geometry/domain/network validation. Unbound sets and scans add record work; emitted findings and path text determine output storage, with no numeric/render-cost bound asserted.
 * @evidence contracts/performance.md#reuse-equivalent-work The known environment set and unbound-domain sets are shared within this call; item/index arrays come from one filtering pass per fold. Geometry and repeated environment validations are not cached across mutable programs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local sets, selected arrays and mappings expire after synchronous validation; finding strings transfer to the caller. Engine validators own their temporary geometry, and this bridge starts no file/process/GPU task or capped persistent population.
 */
export function buildingBoundDiagnostics(
  program: IAutoMovieProductionShotProgram
): IAutoMovieSourceContentFinding[] {
  const messages: IAutoMovieSourceContentFinding[] = [];
  const environments: NonNullable<IAutoMovieProductionShotProgram["builtEnvironments"]> = program.builtEnvironments ?? [];
  const known: Set<string> = new Set(environments.map((environment: NonNullable<IAutoMovieProductionShotProgram["builtEnvironments"]>[number]): string => environment.id));
  const waterFeatures: NonNullable<IAutoMovieProductionShotProgram["waterFeatures"]> = program.waterFeatures ?? [];
  const softFurnishings: NonNullable<IAutoMovieProductionShotProgram["softFurnishings"]> = program.softFurnishings ?? [];
  const plantingInstallations: NonNullable<IAutoMovieProductionShotProgram["plantingInstallations"]> = program.plantingInstallations ?? [];
  const serviceNetworks: NonNullable<IAutoMovieProductionShotProgram["serviceNetworks"]> = program.serviceNetworks ?? [];
  const unresolved: (key: string, items: readonly { environment: string }[]) => void = (
    key: string,
    items: readonly { environment: string }[],
  ): void => {
    items.forEach((item: { environment: string }, index: number): void => {
      if (known.has(item.environment)) return;
      // A name that resolves to nothing is the record's own content, so it takes
      // the same identity a validator's `type` violation would.
      messages.push({
        kind: "type",
        severity: "error",
        message: `$program.${key}[${index}].environment "${item.environment}" does not resolve to a building this shot stages. Declare that building, or bind the record to one the shot already carries.`,
      });
    });
  };
  unresolved("waterFeatures", waterFeatures);
  unresolved("softFurnishings", softFurnishings);
  unresolved("plantingInstallations", plantingInstallations);
  unresolved("serviceNetworks", serviceNetworks);

  const fluidDomains: NonNullable<IAutoMovieProductionShotProgram["fluidDomains"]> = program.fluidDomains ?? [];
  const softBodyDomains: NonNullable<IAutoMovieProductionShotProgram["softBodyDomains"]> = program.softBodyDomains ?? [];
  const plantingDomains: NonNullable<IAutoMovieProductionShotProgram["plantingDomains"]> = program.plantingDomains ?? [];
  const plantingClusters: NonNullable<IAutoMovieProductionShotProgram["plantingClusters"]> = program.plantingClusters ?? [];
  const allOf: (items: readonly unknown[]) => number[] = (items: readonly unknown[]): number[] =>
    items.map((_: unknown, index: number): number => index);
  // Both branches of the validation are read. A fold that produced only warnings
  // succeeds, and reading the failure branch alone is how an uncited penetration
  // never reached the author at all while the same warning beside an error
  // reached them as a refusal.
  const say: (validation: IAutoMovieValidation, address: IBindingAddress, remedy: string) => void = (
    validation: IAutoMovieValidation,
    address: IBindingAddress,
    remedy: string,
  ): void => {
    for (const violation of autoMovieValidationFindings(validation))
      messages.push(
        autoMovieSourceContentFinding(
          violation,
          `${rewriteBindingPath(violation.path, address)} ${violation.expected}. ${remedy}`,
        ),
      );
  };

  say(
    validateAutoMovieSoftFurnishingDomainOwnership(softFurnishings),
    {
      fields: {
        furnishings: {
          key: "softFurnishings",
          indices: allOf(softFurnishings),
        },
      },
    },
    "Give each world-space soft-body domain exactly one furnishing owner before compiling the shot.",
  );

  for (const environment of environments) {
    const water: ReturnType<typeof bindingsOfEnvironment<NonNullable<IAutoMovieProductionShotProgram["waterFeatures"]>[number]>> = bindingsOfEnvironment(waterFeatures, environment.id);
    if (water.items.length !== 0)
      say(
        validateWaterFeatures({
          environment,
          features: water.items,
          domains: [...fluidDomains],
        }),
        {
          fields: {
            features: { key: "waterFeatures", indices: water.indices },
            domains: { key: "fluidDomains", indices: allOf(fluidDomains) },
          },
        },
        "Correct the water feature or the domain it binds before compiling the shot.",
      );
    const cloth: ReturnType<typeof bindingsOfEnvironment<NonNullable<IAutoMovieProductionShotProgram["softFurnishings"]>[number]>> = bindingsOfEnvironment(softFurnishings, environment.id);
    if (cloth.items.length !== 0)
      say(
        validateSoftFurnishings({
          environment,
          furnishings: cloth.items,
          domains: [...softBodyDomains],
          domainOwnership: "prevalidated",
        }),
        {
          fields: {
            furnishings: { key: "softFurnishings", indices: cloth.indices },
            domains: {
              key: "softBodyDomains",
              indices: allOf(softBodyDomains),
            },
          },
        },
        "Correct the soft furnishing or the domain it hangs before compiling the shot.",
      );
    const planting: ReturnType<typeof bindingsOfEnvironment<NonNullable<IAutoMovieProductionShotProgram["plantingInstallations"]>[number]>> = bindingsOfEnvironment(
      plantingInstallations,
      environment.id,
    );
    if (planting.items.length !== 0)
      say(
        validatePlantingInstallations({
          environment,
          installations: planting.items,
          clusters: [...plantingClusters],
          domains: [...plantingDomains],
        }),
        {
          fields: {
            installations: {
              key: "plantingInstallations",
              indices: planting.indices,
            },
            clusters: {
              key: "plantingClusters",
              indices: allOf(plantingClusters),
            },
            domains: {
              key: "plantingDomains",
              indices: allOf(plantingDomains),
            },
          },
        },
        "Correct the planting installation, its cluster or its recipe before compiling the shot.",
      );
    serviceNetworks.forEach((network: NonNullable<IAutoMovieProductionShotProgram["serviceNetworks"]>[number], index: number): void => {
      if (network.environment !== environment.id) return;
      const address: IBindingAddress = { root: { key: "serviceNetworks", index } };
      say(
        validateServiceNetwork({ network, environment }),
        address,
        "Correct the port network before compiling the shot.",
      );
      say(
        validateWetZones({ network, environment }),
        address,
        "Correct the wet zone before compiling the shot.",
      );
    });
  }

  // A domain nobody bound is still a domain the production declared, and an
  // unsound one no feature happens to cite is exactly the record an author is
  // about to bind. It answers for itself here rather than staying unchecked
  // until the binding exists.
  const boundFluid: Set<string> = new Set(waterFeatures.map((feature: NonNullable<IAutoMovieProductionShotProgram["waterFeatures"]>[number]): string => feature.domain));
  fluidDomains.forEach((domain: NonNullable<IAutoMovieProductionShotProgram["fluidDomains"]>[number], index: number): void => {
    if (boundFluid.has(domain.id)) return;
    say(
      validateFluidDomain({ domain }),
      { root: { key: "fluidDomains", index } },
      "Correct the fluid domain before compiling the shot.",
    );
  });
  const boundCloth: Set<string> = new Set(
    softFurnishings.map((furnishing: NonNullable<IAutoMovieProductionShotProgram["softFurnishings"]>[number]): string => furnishing.domain),
  );
  softBodyDomains.forEach((domain: NonNullable<IAutoMovieProductionShotProgram["softBodyDomains"]>[number], index: number): void => {
    if (boundCloth.has(domain.id)) return;
    say(
      validateSoftBodyDomain({ domain }),
      { root: { key: "softBodyDomains", index } },
      "Correct the soft body domain before compiling the shot.",
    );
  });
  const boundPlanting: Set<string> = new Set(
    plantingClusters.map((cluster: NonNullable<IAutoMovieProductionShotProgram["plantingClusters"]>[number]): string => cluster.domain),
  );
  plantingDomains.forEach((domain: NonNullable<IAutoMovieProductionShotProgram["plantingDomains"]>[number], index: number): void => {
    if (boundPlanting.has(domain.id)) return;
    say(
      validatePlantingDomain({ domain }),
      { root: { key: "plantingDomains", index } },
      "Correct the planting recipe before compiling the shot.",
    );
  });
  return messages;
}
