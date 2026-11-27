import { AutoMovieArchetypeBand } from "../../core";
import type { AutoMovieArchetypeCareItem } from "../AutoMovieArchetypeCareItem";
import { CareItemBandsData } from "./internal/CareItemBandsData";


/*
 * The band of each free dimension of `createCareItem`, by kind, with the
 * sources they are read at: kept apart from the producer so each file stays
 * within its size.
 */
export const CARE_ITEM_BANDS: typeof AutoMovieArchetypeCareItem.BANDS = {
  tissue: {
    length: AutoMovieArchetypeBand.metres(0.198, 0.21, CareItemBandsData.TISSUE, true),
    width: AutoMovieArchetypeBand.metres(0.203, 0.213, CareItemBandsData.TISSUE, true),
    thickness: AutoMovieArchetypeBand.metres(
      0.0005,
      0.0005,
      "a soft two-ply sheet, not read at a source",
      true,
    ),
    mass: CareItemBandsData.kg(0.001, 0.002),
  },
  comb: {
    length: AutoMovieArchetypeBand.metres(0.112, 0.154, CareItemBandsData.COMB, true),
    width: AutoMovieArchetypeBand.metres(0.025, 0.027, CareItemBandsData.COMB, true),
    thickness: AutoMovieArchetypeBand.metres(
      0.003,
      0.004,
      "comb spine thickness, not read at a source",
      true,
    ),
    mass: CareItemBandsData.kg(0.01, 0.02),
  },
  toothbrush: {
    length: AutoMovieArchetypeBand.metres(0.18, 0.197, CareItemBandsData.BRUSH, true),
    width: AutoMovieArchetypeBand.metres(0.011, 0.011, CareItemBandsData.BRUSH, true),
    mass: CareItemBandsData.kg(0.015, 0.025),
  },
  tube: {
    mass: CareItemBandsData.kg(0.02, 0.3),
  },
  razor: {
    width: AutoMovieArchetypeBand.metres(
      0.012,
      0.016,
      "the handle's diameter; the razors' pages read do not give it",
      true,
    ),
  },
  lipstick: {
    length: AutoMovieArchetypeBand.metres(0.074, 0.074, CareItemBandsData.LIPSTICK),
    width: AutoMovieArchetypeBand.metres(0.021, 0.021, CareItemBandsData.LIPSTICK),
    mass: CareItemBandsData.kg(0.01, 0.03),
  },
};
