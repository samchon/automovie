import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One talus between the tibial/fibular ankle mortise and calcaneus.
 *
 * Its separate CT/MRI volume cannot determine the trochlear, subtalar or talonavicular articular geometry; those surfaces require validated anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Required talar volume uses the anatomical target/observation union; scalar volume leaves joint shape unresolved.
 * @evidence contracts/common.md#clear-and-simple-design The talus record owns one bone quantity without absorbing calcaneus or cartilage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither ankle dimensions nor a volume scalar are converted into invented articular surfaces.
 * @evidence contracts/common.md#meaningful-documentation Comments identify talar ownership and distinguish trochlear, subtalar and talonavicular geometry limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Talar volume declaration executes no ankle surface generation or volume integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This hindfoot quantity schema schedules no shared tomographic reconstruction work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The talus interface acquires no segmented bone buffers or viewer resources.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyTalusMeasurements {
  /** Talus bone only, excluding calcaneus and articular cartilage. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
