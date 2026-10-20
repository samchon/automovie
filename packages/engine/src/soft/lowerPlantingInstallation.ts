import {
  AutoMovieSoftAnalysisStatus,
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingInstallation,
  IAutoMovieSoftAnalysis,
} from "@automovie/interface";

import { IAutoMoviePlantingFrame } from "./IAutoMoviePlantingFrame";
import { arrangePlantingCluster } from "./arrangePlantingCluster";
import { growPlanting } from "./growPlanting";
import { validatePlantingCluster } from "./validatePlantingCluster";
import { validatePlantingDomain } from "./validatePlantingDomain";

/** Join one typed installation, cluster and recipe into a derived plant, arrangement and explicit analysis. Invalid records or mismatched ids return not-run with null geometry; derivation cap/numeric failures may propagate. This public lowering API currently has test-only runtime reach.
 *
 * @evidence contracts/common.md#principled-implementation Canonical recipe/cluster admission precedes id pairing, then one grow operation and seeded spacing arrangement produce the supplied recipe-local tree and cluster placements. Installation visibility or exact final rendered clearance is not computed here.
 * @evidence contracts/common.md#clear-and-simple-design Analysis and pairing stay with this join, while growth and arrangement own their independent declared inputs and outputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid pairings cannot acquire another record's geometry under a plausible status; counted arrangement rejections remain visible rather than duplicated or squeezed into an authored region.
 * @evidence contracts/common.md#meaningful-documentation States pairing, not-run geometry, derivation failures and unwired rendering host.
 * @evidence contracts/performance.md#efficient-algorithms Validation plus one B-branch/L-leaf derivation and N-member/A-attempt arrangement are charged together; no per-member tree is grown, but actual spacing bucket occupancy determines arrangement comparison work.
 * @evidence contracts/performance.md#reuse-equivalent-work One derived plant serves all returned member placements; recipe, cluster and installation mutation do not have a retained cross-call result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh tree/placement arrays transfer with the analysis; admission failure returns no geometry and no renderer/native task is acquired.
 */
export const lowerPlantingInstallation: (props: {
  installation: IAutoMoviePlantingInstallation;
  cluster: IAutoMoviePlantingCluster;
  domain: IAutoMoviePlantingDomain;
}) => IAutoMoviePlantingFrame = (props: {
  installation: IAutoMoviePlantingInstallation;
  cluster: IAutoMoviePlantingCluster;
  domain: IAutoMoviePlantingDomain;
}): IAutoMoviePlantingFrame => {
  const { installation, cluster, domain }: typeof props = props;
  /** Create one recipe-attributed planting derivation status without retaining a partial tree. */
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
};
