import { IAutoMoviePlantingCluster, IAutoMoviePlantingDomain, IAutoMoviePlantingInstallation, IAutoMovieSoftAnalysis } from "@automovie/interface";
import { arrangePlantingCluster } from "./arrangePlantingCluster";
import { growPlanting } from "./growPlanting";
import { validatePlantingCluster } from "./validatePlantingCluster";
import { validatePlantingDomain } from "./validatePlantingDomain";
import { IAutoMoviePlantingFrame } from "./IAutoMoviePlantingFrame";

/**
 * Lower one bound installation to everything a renderer needs, beside an honest
 * account of what was derived.
 *
 * One structure is grown and every member instances it, which is what makes a
 * bed of forty ferns forty transforms rather than forty trees. A recipe that
 * does not validate, a cluster that does not validate, a cluster paired with a
 * recipe it does not cite, and an installation paired with a cluster it does
 * not place each produce `not-run` with a reason and no geometry at all: a
 * plant nobody could derive must never arrive looking like a plant somebody
 * did.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Lowers a valid recipe and cluster into prototype structure and member placement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Produces the renderer boundary while preserving not-run outcomes.
 * @author Samchon
 */
export const lowerPlantingInstallation = (props: {
  installation: IAutoMoviePlantingInstallation;
  cluster: IAutoMoviePlantingCluster;
  domain: IAutoMoviePlantingDomain;
}): IAutoMoviePlantingFrame => {
  const { installation, cluster, domain } = props;
  const analysis = (
    status: IAutoMovieSoftAnalysis["status"],
    reason: string | null,
  ): IAutoMovieSoftAnalysis => ({
    domain: domain.id,
    kind: "planting",
    status,
    reason,
    unsupported: [],
  });
  if (validatePlantingDomain({ domain }).success === false)
    return {
      installation: installation.id,
      analysis: analysis(
        "not-run",
        `planting recipe "${domain.id}" did not validate, so nothing was grown`,
      ),
      plant: null,
      arrangement: null,
    };
  if (validatePlantingCluster({ cluster }).success === false)
    return {
      installation: installation.id,
      analysis: analysis(
        "not-run",
        `planting cluster "${cluster.id}" did not validate, so nothing was arranged`,
      ),
      plant: null,
      arrangement: null,
    };
  // The three records arrive separately, so every pairing is checked rather
  // than trusted: arranging one recipe by another's seed, or reporting one
  // bed's members under another installation's identity, would produce a frame
  // that looks derived and answers for nothing that was authored.
  if (cluster.domain !== domain.id)
    return {
      installation: installation.id,
      analysis: analysis(
        "not-run",
        `planting cluster "${cluster.id}" grows recipe "${cluster.domain}", not the supplied "${domain.id}"`,
      ),
      plant: null,
      arrangement: null,
    };
  if (installation.cluster !== cluster.id)
    return {
      installation: installation.id,
      analysis: analysis(
        "not-run",
        `planting installation "${installation.id}" places cluster "${installation.cluster}", not the supplied "${cluster.id}"`,
      ),
      plant: null,
      arrangement: null,
    };
  return {
    installation: installation.id,
    analysis: analysis("derived", null),
    plant: growPlanting(domain),
    arrangement: arrangePlantingCluster(cluster),
  };
};
