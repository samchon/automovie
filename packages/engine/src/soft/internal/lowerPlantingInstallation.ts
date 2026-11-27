import {
  AutoMovieSoftAnalysisStatus,
  type IAutoMovieLowerPlantingInstallation,
  type IAutoMoviePlantingFrame,
  IAutoMovieSoftAnalysis,
} from "@automovie/interface";

import { arrangePlantingCluster } from "./arrangePlantingCluster";
import { growPlanting } from "./growPlanting";
import { validatePlantingCluster } from "./validatePlantingCluster";
import { validatePlantingDomain } from "./validatePlantingDomain";

/*
 * Join one typed installation, cluster and recipe into a derived plant,
 * arrangement and explicit analysis. Invalid records or mismatched ids return
 * not-run with null geometry; derivation cap/numeric failures may propagate.
 * This public lowering API currently has test-only runtime reach.
 */
export function lowerPlantingInstallation(
  props: IAutoMovieLowerPlantingInstallation.IProps,
): IAutoMoviePlantingFrame {
  const { installation, cluster, domain }: typeof props = props;
  /*
   * Create one recipe-attributed planting derivation status without retaining a
   * partial tree.
   */
  const analysis: (
    status: AutoMovieSoftAnalysisStatus,
    reason: string | null,
  ) => IAutoMovieSoftAnalysis = (
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
}
