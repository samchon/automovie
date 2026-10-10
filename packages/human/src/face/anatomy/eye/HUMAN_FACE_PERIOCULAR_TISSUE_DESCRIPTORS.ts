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
