import type { IAutoMovieHumanFacePeriocularScalarDescriptor } from "../../structures/IAutoMovieHumanFacePeriocularScalarDescriptor";
import type { IAutoMovieHumanFacePeriocularTissueDescriptor } from "../../structures/IAutoMovieHumanFacePeriocularTissueDescriptor";

const SURVE =
  "Surve et al. 2018, Indian J Ophthalmol 66(3):383 (PMC5859591): 50 MHz ultrasound biomicroscopy, vertical scan through the corneal centre, primary gaze, 19 healthy Indian subjects, upper lid";
const HWANG =
  "Hwang, Kim and Hwang 2006, J Craniofac Surg 17(1):54-56 (PMID16432408), abstract read; reported in the read Hwang 2013 review (PMC3713284): left upper eyelids of 10 fresh Korean cadavers (9 male, 1 female), trichrome sections measured microscopically, skin near the ciliary margin 320 +/- 49 micrometres";
const LOWER =
  " No read source measures the lower lid; the upper-lid value is reused as an authored extension.";

const scalar = (
  defaultMm: number,
  minimumMm: number,
  maximumMm: number,
  kind: IAutoMovieHumanFacePeriocularScalarDescriptor["kind"],
  ground: string,
): IAutoMovieHumanFacePeriocularScalarDescriptor => ({
  defaultMm,
  minimumMm,
  maximumMm,
  kind,
  ground,
});

/**
 * Default lid tissue stack and its authoring envelopes, with the ground of
 * every value.
 *
 * The defaults form an authored stack using different measurement sites.
 * Surve et al. 2018 report 1.612 +/- 0.205 mm for
 * the upper eyelid, 0.907 +/- 0.098 mm for the tarsus and 0.336 +/- 0.083 mm
 * for the orbicularis. Their Methods measure tarsus midway between its borders,
 * but full lid and orbicularis just above the upper tarsal border, in primary
 * gaze with the imaged eye closed. Those means do not partition one measured
 * site. The following combination is an authored cross-site convention:
 *
 * - skin, 0.32 mm (Hwang et al. 2006, near the ciliary margin, reported in
 *   Hwang 2013). Taking this as a muscle offset across its complete strip
 *   omits the unmeasured connective tissue and is an authored extension;
 * - orbicularis, 0.336 mm, so its outer face is 0.32 mm below the skin;
 * - tarsal body, 0.907 mm, outer face at 0.32 + 0.336 = 0.656 mm;
 * - conjunctiva, the remainder 1.612 - 0.656 - 0.907 = 0.049 mm, outer face
 *   at 1.563 mm. No read source measures conjunctival thickness, so the
 *   remainder is authored arithmetic and not a conjunctival measurement.
 *
 * The septal support lies behind the orbicularis above the tarsal plate, so
 * its outer face shares the tarsal body's depth; its thickness of 0.3 mm is
 * authored, with no source.
 *
 * These values hold for the quantity, site and population of their sources:
 * one group of 19 adults, one site of the upper lid, one gaze. Using them as
 * defaults for every person and for the lower lid is an authored extension.
 * The envelopes are the measured mean plus and minus three standard
 * deviations where a standard deviation was read, and authored otherwise;
 * they are editing envelopes and not clinical ranges. A stack that the
 * constructed lid cannot hold is refused by the lid frame with its shortfall.
 *
 * @evidence contracts/common.md#principled-implementation The stack is arithmetically consistent as an authored cross-site convention; the cited study's different acquisition sites prevent treating the sum or its remainder as measured anatomy, and emitted-lid admission remains necessary.
 * @evidence contracts/common.md#clear-and-simple-design One constant owns every default and envelope; the catalogue reads it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values come from sources and their arithmetic, not from a subject, a document or a refusal to be cleared.
 * @evidence contracts/common.md#meaningful-documentation Gives the stack arithmetic, the source of each term, what is derived or authored, and the limits of the sources.
 * @evidence contracts/modeling.md#parameter-channels Each tissue keeps two independent absolute dimensions; the defaults are coupled only by the stated arithmetic.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres, measured through the lid from its skin.
 * @evidence contracts/anatomy.md#anatomical-source Surve et al. 2018 and Hwang 2013 were read in full text; the cited Hwang et al. 2006 original abstract supplies its cadaver population and microscopy protocol. Means from different sites supply authored offsets and the unknown conjunctival thickness remains an authored remainder.
 * @evidence contracts/anatomy.md#permitted-range Envelopes are three standard deviations around read means or authored; admission of a combination against the lid belongs to the lid frame.
 * @evidence contracts/anatomy.md#parametric-authority Describes the named tissue dimensions of the public tissue section; adds no input.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Describes dimensions of existing tissue identities.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue builder owns the displayed result.
 */
export const HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS: IAutoMovieHumanFacePeriocularTissueDescriptor[] =
  (["upper", "lower"] as const).flatMap((lid) => {
    const note = lid === "upper" ? "" : LOWER;
    const authored = lid === "upper" ? undefined : "authored";
    return [
      {
        tissue: `${lid}Orbicularis` as const,
        inwardOffset: scalar(
          0.32,
          0.17,
          0.47,
          "authored",
          HWANG +
            "; using that skin thickness as whole-strip muscle depth without the connective layer is authored, not a measured muscle offset." +
            note,
        ),
        thickness: scalar(
          0.336,
          0.09,
          0.585,
          authored ?? "measured",
          SURVE + ", orbicularis oculi 0.336 +/- 0.083 mm." + note,
        ),
      },
      {
        tissue: `${lid}TarsalBody` as const,
        inwardOffset: scalar(
          0.656,
          0.26,
          1.055,
          "authored",
          "Authored cross-site sum: skin 0.32 mm (Hwang 2013) plus orbicularis 0.336 mm (Surve et al. 2018); the quantities were not measured together." +
            note,
        ),
        thickness: scalar(
          0.907,
          0.613,
          1.201,
          authored ?? "measured",
          SURVE + ", tarsus 0.907 +/- 0.098 mm." + note,
        ),
      },
      {
        tissue: `${lid}SeptalSupport` as const,
        inwardOffset: scalar(
          0.656,
          0.26,
          1.055,
          "authored",
          "Authored placement at the tarsal body's outer-face depth, behind the orbicularis." +
            note,
        ),
        thickness: scalar(
          0.3,
          0.1,
          1,
          "authored",
          "Authored; no read source measures the orbital septum's thickness.",
        ),
      },
      {
        tissue: `${lid}Conjunctiva` as const,
        inwardOffset: scalar(
          1.563,
          0.87,
          2.26,
          "authored",
          "Authored cross-site sum of skin 0.32 mm, orbicularis 0.336 mm and tarsus 0.907 mm; no same-site depth was measured." +
            note,
        ),
        thickness: scalar(
          0.049,
          0.01,
          0.2,
          "authored",
          "Authored arithmetic remainder of 1.612 mm after measurements at different sites (" +
            SURVE +
            "); conjunctival thickness remains unknown." +
            note,
        ),
      },
    ];
  });
