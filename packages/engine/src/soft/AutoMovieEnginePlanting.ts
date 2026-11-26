import { type IAutoMoviePlantingArrangement, type IAutoMoviePlantingCluster, type IAutoMoviePlantingState, type IAutoMoviePlantingDomain, type IAutoMoviePlantingFrame, type IAutoMovieLowerPlantingInstallation, type IAutoMoviePlantingBudget, type IAutoMoviePlantingBudgetInput, type IAutoMovieSoftBounds, type IAutoMoviePlantingBranch, type IAutoMoviePlantingLeaf, type IAutoMoviePruningEnvelope, type IAutoMovieVector3, type IAutoMovieQuaternion, type IAutoMovieValidation, type IAutoMovieValidatePlantingCluster, type IAutoMovieValidatePlantingDomain, type IAutoMovieValidatePlantingInstallations } from "@automovie/interface";
import { arrangePlantingCluster as arrangePlantingClusterImplementation } from "./internal/arrangePlantingCluster";
import { growPlanting as growPlantingImplementation } from "./internal/growPlanting";
import { lowerPlantingInstallation as lowerPlantingInstallationImplementation } from "./internal/lowerPlantingInstallation";
import { plantingBudget as plantingBudgetImplementation } from "./internal/plantingBudget";
import { plantingCanopyBounds as plantingCanopyBoundsImplementation } from "./internal/plantingCanopyBounds";
import { plantingContainsPoint as plantingContainsPointImplementation } from "./internal/plantingContainsPoint";
import { plantingPruningDistance as plantingPruningDistanceImplementation } from "./internal/plantingPruningDistance";
import { plantingStateDigest as plantingStateDigestImplementation } from "./internal/plantingStateDigest";
import { plantingYaw as plantingYawImplementation } from "./internal/plantingYaw";
import { validatePlantingCluster as validatePlantingClusterImplementation } from "./internal/validatePlantingCluster";
import { validatePlantingDomain as validatePlantingDomainImplementation } from "./internal/validatePlantingDomain";
import { validatePlantingInstallations as validatePlantingInstallationsImplementation } from "./internal/validatePlantingInstallations";

/** Public operations for Auto Movie Engine Planting. */
export namespace AutoMovieEnginePlanting {
  /**
   * Generate seeded full-TRS members in authored slot order, counting slots
   * rejected after their attempt limit. A minSpacing grid tests nearby accepted
   * positions; returned bounds enclose placement origins, not scaled plant
   * geometry. Production planting validation consumes the arrangement.
   */
  export function arrangePlantingCluster(cluster: IAutoMoviePlantingCluster): IAutoMoviePlantingArrangement {
    return arrangePlantingClusterImplementation(cluster);
  }

  /**
   * Derive recipe-local depth-first branches and leaves at one normalized growth
   * stage. Level extension is
   * clamp((stage-onset_level)/(1-onset_(levels-1)),0,1); child-path seeds fix
   * jitter independently of traversal count. Analytic pruning cuts emitted
   * branches, and declared branch/leaf caps throw during emission. Production
   * planting validation consumes this geometry.
   */
  export function growPlanting(domain: IAutoMoviePlantingDomain): IAutoMoviePlantingState {
    return growPlantingImplementation(domain);
  }

  /**
   * Join one typed installation, cluster and recipe into a derived plant,
   * arrangement and explicit analysis. Invalid records or mismatched ids return
   * not-run with null geometry; derivation cap/numeric failures may propagate.
   * This public lowering API currently has test-only runtime reach.
   */
  export function lowerPlantingInstallation(props: IAutoMovieLowerPlantingInstallation.IProps): IAutoMoviePlantingFrame {
    return lowerPlantingInstallationImplementation(props);
  }

  /**
   * Measure a planting recipe's complete-tree branch/leaf upper counts and
   * optional requested member products without deriving geometry. Callers admit
   * bounded depth first; numeric products can overflow for unsupported huge
   * ungated values.
   */
  export function plantingBudget(props: IAutoMoviePlantingBudgetInput): IAutoMoviePlantingBudget {
    return plantingBudgetImplementation(props);
  }

  /**
   * Enclose emitted recipe-local stems and leaf cards for installation
   * containment.
   *
   * Stem endpoints carry radial support perpendicular to their axis. The larger
   * authored end radius covers both the declared taper and the viewer's averaged
   * cylinder.
   *
   * Leaves use the viewer's unit XY card transformed by their emitted scale,
   * rotation and translation; local Z scale does not thicken that card.
   */
  export function plantingCanopyBounds(branches: readonly IAutoMoviePlantingBranch[], leaves: readonly IAutoMoviePlantingLeaf[]): IAutoMovieSoftBounds | null {
    return plantingCanopyBoundsImplementation(branches, leaves);
  }

  /**
   * Test a recipe-local point against the authored none, closed box or closed
   * sphere pruning envelope.
   */
  export function plantingContainsPoint(envelope: IAutoMoviePruningEnvelope, point: IAutoMovieVector3): boolean {
    return plantingContainsPointImplementation(envelope, point);
  }

  /**
   * Find the forward distance where an inside-base unit-axis segment leaves an
   * authored box or sphere, or null when the exit is not before the segment end.
   */
  export function plantingPruningDistance(envelope: IAutoMoviePruningEnvelope, base: IAutoMovieVector3, axis: IAutoMovieVector3, length: number): number | null {
    return plantingPruningDistanceImplementation(envelope, base, axis, length);
  }

  /**
   * Produce a deterministic 32-bit FNV-1a diagnostic of selected branch and leaf
   * geometry encoded as little-endian float64 bytes. Equal digests can collide
   * and omit ids, domain metadata and authored relationships.
   */
  export function plantingStateDigest(state: IAutoMoviePlantingState): string {
    return plantingStateDigestImplementation(state);
  }

  /**
   * Map a seeded sample to a rational-circle +Y turn, then normalized quaternion
   * interpolation toward identity by the admitted jitter fraction.
   */
  export function plantingYaw(sample: number, amount: number): IAutoMovieQuaternion {
    return plantingYawImplementation(sample, amount);
  }

  /**
   * Admit a typed cluster's finite region, positive scale intervals, safe seed
   * and bounded member/attempt counts. It does not prove all requested placements
   * fit; arrangement returns explicit rejected slots when sampling cannot satisfy
   * spacing.
   */
  export function validatePlantingCluster(props: IAutoMovieValidatePlantingCluster.IProps): IAutoMovieValidation {
    return validatePlantingClusterImplementation(props);
  }

  /**
   * Validate a typed planting recipe's scalar law, child identities, pruning and
   * emission budgets.
   */
  export function validatePlantingDomain(props: IAutoMovieValidatePlantingDomain.IProps): IAutoMovieValidation {
    return validatePlantingDomainImplementation(props);
  }

  /**
   * Join planting recipes, clusters and installation references, then inspect
   * member canopy bounds in authored rooms.
   */
  export function validatePlantingInstallations(props: IAutoMovieValidatePlantingInstallations.IProps): IAutoMovieValidation {
    return validatePlantingInstallationsImplementation(props);
  }
}
