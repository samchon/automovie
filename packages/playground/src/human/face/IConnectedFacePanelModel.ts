import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type {
  IAutoMovieHumanFaceContactSummary,
  summarizeHumanFaceArticulation,
} from "@automovie/human";

/**
 * What the connected face panel reads of a built model: its part count and,
 * when the viewport measured them, articulation, contact and crossings.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes the part count and articulation, contact and crossing readings the editor reports.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Carries the viewport's measured readings beside the published model.
 * @author Samchon
 */
export interface IConnectedFacePanelModel {
  /** The number of material regions drawn. */
  parts: number;

  /** The articulation summary, when measured. */
  articulation?: ReturnType<typeof summarizeHumanFaceArticulation>;

  /** The contact summary, when measured. */
  contact?: IAutoMovieHumanFaceContactSummary | null;

  /** Triangle crossings, when measured. */
  crossings?: IAutoMovieModelCrossing[] | null;
}
