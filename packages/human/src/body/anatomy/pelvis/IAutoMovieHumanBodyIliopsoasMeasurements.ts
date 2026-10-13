import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { IAutoMovieHumanBodyIliacusMeasurements } from "./IAutoMovieHumanBodyIliacusMeasurements";
import type { IAutoMovieHumanBodyPsoasMajorMeasurements } from "./IAutoMovieHumanBodyPsoasMajorMeasurements";

/**
 * One side's iliopsoas group with separately owned psoas and iliacus bellies.
 *
 * A combined iliopsoas segmentation does not identify the two child muscle volumes. The optional group volume preserves such an observation without inventing a split or copying it into both children. A consuming resolver must reconcile independently observed child volumes against a compatible combined total; the schema alone does not perform that reconciliation.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty iliopsoas record preserves combined volume and independently measured psoas/iliacus quantities without an invented split.
 * @evidence contracts/common.md#clear-and-simple-design The group owns combined totals while named child muscle records retain their independent anatomical identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Combined segmentation is counted once; schema presence does not perform reconciliation with child volumes.
 * @evidence contracts/common.md#meaningful-documentation Comments state combined-versus-child meaning, compatible total reconciliation and lumbar/iliac child ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Iliopsoas typing executes no segmentation partition or child-volume reconciliation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This group record shares quantity definitions rather than completed muscle partition work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Iliopsoas metadata owns no combined scan masks, per-muscle mesh buffers or reconciliation tasks.
 * @author Samchon
 */
export type IAutoMovieHumanBodyIliopsoasMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Combined psoas-major and iliacus belly volume, counted once. */
    combinedMuscleVolume?: IAutoMovieHumanBodyAnatomicalVolume;

    /** Lumbar-origin psoas major when independently segmented. */
    psoasMajor?: IAutoMovieHumanBodyPsoasMajorMeasurements;

    /** Iliac-fossa iliacus when independently segmented. */
    iliacus?: IAutoMovieHumanBodyIliacusMeasurements;
  }>;
