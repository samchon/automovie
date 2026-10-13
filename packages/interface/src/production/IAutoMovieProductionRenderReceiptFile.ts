import { IAutoMovieProductionDeliverableFile } from "./IAutoMovieProductionDeliverableFile";
import { IAutoMovieProductionMediaProbe } from "./IAutoMovieProductionMediaProbe";

/** One file record independently derived by the renderer-owned receipt gate. */
export interface IAutoMovieProductionRenderReceiptFile extends IAutoMovieProductionDeliverableFile {
  /** Deliverable that exclusively owns this path. */
  deliverable: string;

  /** Parser-derived media facts. */
  probe: IAutoMovieProductionMediaProbe;
}
