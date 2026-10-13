import type { AutoMovieHumanBodyNonemptyMeasurements } from "./AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "./IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "./IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Named carpal, tarsal, metapodial or phalangeal bone scalar observations.
 *
 * The enclosing finger, toe or arch names the exact bone and side. Its maximum length and segmented volume cannot establish an articular surface or a 3D vertex path; one generator may reuse topology across homologous digits while retaining independent person-specific dimensions.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty small-bone record keeps maximum bony length and segmented volume independently supplied.
 * @evidence contracts/common.md#clear-and-simple-design The enclosing ray/arch supplies exact bone identity and side; shared scalar schemas supply acquisition semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Homologous topology cannot justify copying one person's dimensions or inventing articular surfaces from scalars.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish end-to-end osseous length, bone-only volume and unresolved joint/vertex geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Small-bone typing runs no digit topology generation or carpal/tarsal segmentation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This quantity record coordinates no reusable homologous bone reconstruction work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The small-bone schema retains no digit mesh, scan masks or reconstruction handles.
 * @author Samchon
 */
export type IAutoMovieHumanBodySmallBoneMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum osseous end-to-end length along the named bone. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented volume of only this bone, excluding cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
