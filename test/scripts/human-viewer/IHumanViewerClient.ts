import type { HumanViewerRender } from "./HumanViewerRender";
import type { IHumanViewerDropProps } from "./IHumanViewerDropProps";
/** A connected resident viewer. */
export interface IHumanViewerClient {
  /** The graphics device string the server reported when it was ready. */
  renderer: string;

  /** Source revision the server was built from. */
  revision: string;

  /**
   * Offer hand-written documents to the viewer as `file:<label>/<document id>`,
   * with an optional candidate basis they are built against. Refuses with the
   * server's reason when it rejects the file.
   */
  drop(props: IHumanViewerDropProps): Promise<void>;

  /** Render one address, preserving its response revision and device authority. */
  render(fields: Record<string, string>): Promise<HumanViewerRender>;

  /**
   * The names of the meshes the address displays. A name is a material region
   * and not an anatomical part, as the server states.
   */
  parts(fields: Record<string, string>): Promise<string[]>;
}
