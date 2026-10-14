import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Midline sternum with manubrium, body and xiphoid as one bony complex.
 *
 * Its anterior surface anchors pectoralis major and its costal articulations help orient the rib cage. A measured whole-bone length or volume does not yield all costal cartilage junctions or an anterior thorax skin contour.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty whole-sternum length or volume keeps manubrium, body and xiphoid under one midline bony owner with shared acquisition provenance.
 * @evidence contracts/common.md#clear-and-simple-design Shared length/volume carriers own physical units while this record names the anterior bony complex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-bone scalar measurements cannot recover costal cartilage junctions, pectoral attachments or anterior chest skin shape.
 * @evidence contracts/common.md#meaningful-documentation Members define the manubrial-to-xiphoid span and osseous-only volume, and prose gives articulation/attachment limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Sternum typing performs no costal-junction reconstruction or pectoral footprint fit.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The midline sternum schema holds no completed anterior thoracic geometry to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Sternum scalar inputs acquire no cartilage assembly, bone buffer or chest-shape task.
 * @author Samchon
 */
export type IAutoMovieHumanBodySternumMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Superior manubrial to inferior xiphoid osseous span. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Sternum alone, excluding ribs and costal cartilages. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
