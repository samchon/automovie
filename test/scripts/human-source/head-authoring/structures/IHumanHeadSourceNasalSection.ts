import type { IHumanSourceAuthoredBinding } from "../../structures/IHumanSourceAuthoredBinding.ts";
import type { IHumanHeadNasalSectionRecipe } from "./IHumanHeadNasalSectionRecipe.ts";

/** Actual native nasal patch extrusion and its inherited point/cell lineage.
 * Original patch incidence supplies the terminal cap; no fan or projected
 * triangulation invents missing interior support or clinical airway geometry.
 * @author Samchon
 */
export interface IHumanHeadSourceNasalSection {
  side: "left" | "right";

  /** Original numerical section recipe in millimetres. */
  dimensions: IHumanHeadNasalSectionRecipe;

  /** Cells replaced by this source section, in original source order. */
  removedNativePolygonOrdinals: number[];

  /** Native rim shared exactly with the unchanged exterior host. */
  sharedNativeRim: number[];

  /** Appended first section and terminal rim, following the original rim order. */
  generatedRings: number[][];

  /** Original interior and boundary native supports in ascending native order. */
  capNativeParents: number[];

  /** Original source cells mapped one-to-one to the terminal cap. */
  capSourceCells: number[];

  /** Actual terminal cap cell incidence in output source IDs. */
  terminalCapCells: number[][];

  /** Exact inherited native source support and constant rest offsets. */
  appendedBindings: IHumanSourceAuthoredBinding[];

  /** Fitted original unit source direction, never a personal inferred axis. */
  outwardSourceAxis: number[];

  /** Minimum current native facet cosine with the registered extrusion axis. */
  minimumCurrentNativeNormalDot: number;

  /** Original source representation convention. */
  chart: string;

  /** Explicit unavailable clinical aperture/airway qualification. */
  qualification: string;
}
