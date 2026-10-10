import type { IAutoMovieHumanFaceOral } from "../../structures/IAutoMovieHumanFaceOral";
import type { IHumanFaceOralLiningDimensions } from "./IHumanFaceOralLiningDimensions";

/**
 * Resolve one arch's lining dimensions from the oral document, in metres.
 *
 * A value the document states is used as given. An omitted value takes the
 * default below; the defaults are authored dimensions of a generic adult
 * lining and neither a clinical normal range nor a person's anatomy.
 *
 * - Palatal vault 15 mm. Huang et al. 2024 (Head Face Med, PMC10821571)
 *   measured the height of the palate's three-dimensional bounding box on
 *   CBCT in 85 skeletal Class I Mongolian adults aged 18–35: 16.38 ± 1.76 mm
 *   in men and 14.52 ± 1.55 mm in women of the normodivergent group. Their
 *   reference is the horizontal plane through the lowest point of the
 *   anterior maxillary alveolar ridge; this lining rises from the local
 *   cervical ring, and the offset between the two references is unmeasured.
 * - Gingival collar 4.25 mm. Moosa et al. 2024 (Heliyon, PMC10826647)
 *   measured the mid-facial width of keratinized gingiva at the maxillary
 *   central incisors of 510 periodontally healthy Pakistani adults aged
 *   20–35 as 4.25 ± 1.17 mm. That is one tooth, one surface and one tissue
 *   band. Using it as the cervical-to-fornix reach of every tooth of both
 *   arches is an authored extension: the alveolar mucosa beyond the
 *   keratinized band and every other site are unmeasured here.
 * - Collar thickness 1.5 mm and floor depth 8 mm are authored without a
 *   read source. Moosa et al. classify gingival thickness only as thick or
 *   thin by probe transparency, and no read study gives the depth of the
 *   sublingual sulcus below the lingual gingival margin.
 * - The vestibular wall clearance defaults to the collar thickness, and the
 *   posterior reach to the wall clearance.
 */
export function resolveHumanFaceOralLiningDimensions(
  oral: IAutoMovieHumanFaceOral,
  mandibular: boolean,
): IHumanFaceOralLiningDimensions {
  const metres = (value: number | undefined, fallback: number): number => {
    const result = value === undefined ? fallback : value / 1000;
    if (!Number.isFinite(result) || result <= 0)
      throw new Error(
        "Oral lining needs positive finite representable dimensions.",
      );
    return result;
  };
  const arch = mandibular ? oral.mandibular : oral.maxillary;
  const collarThicknessMetres = metres(arch?.gingivalThicknessMm, 0.0015);
  const collarHeightMetres = metres(arch?.gingivalHeightMm, 0.00425);
  const wallClearanceMetres = metres(
    oral.space?.wallClearanceMm,
    collarThicknessMetres,
  );
  const vaultMetres = mandibular
    ? metres(oral.space?.floorDepthMm, 0.008)
    : metres(oral.space?.palateHeightMm, 0.015);
  const posteriorReachMetres = metres(
    oral.space?.posteriorReachMm,
    wallClearanceMetres,
  );
  return {
    collarHeightMetres,
    collarThicknessMetres,
    wallClearanceMetres,
    vaultMetres,
    posteriorReachMetres,
  };
}
