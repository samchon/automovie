import type { HumanViewerRender } from "./HumanViewerRender";
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
  drop(props: {
    label: string;
    documents: { id: string }[];
    candidateBasis?: string | null;
  }): Promise<void>;

  /** Render one address (the display fields of the address grammar). */
  render(fields: Record<string, string>): Promise<HumanViewerRender>;

  /**
   * The names of the meshes the address displays. A name is a material region
   * and not an anatomical part, as the server states.
   */
  parts(fields: Record<string, string>): Promise<string[]>;
}
