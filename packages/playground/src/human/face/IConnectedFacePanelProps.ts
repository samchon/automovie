import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceComponentTree,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import type { IConnectedFaceExpressionPreset } from "./IConnectedFaceExpressionPreset";
import type { IConnectedFaceViewport } from "./IConnectedFaceViewport";

/**
 * What the connected face panel is mounted with: the admitted basis and its optional control map and component tree, the initial document, studies and presets, the viewport factory and the download sink.
 *
 * Missing studies supplies no authored study choices; missing map or tree changes only control presentation. Studies and expression presets are application parameters admitted like ordinary edits. The mounted panel closes its acquired viewport; the viewport implementation owns numerical and display resources.
 *
 * @evidence contracts/common.md#principled-implementation An admitted basis and explicit initial document anchor editing, optional map/tree control presentation, and application-authored studies/presets still enter ordinary face admission.
 * @evidence contracts/common.md#clear-and-simple-design The panel receives only authored content and application seams while Human owns numerical semantics and the injected viewport owns frame/display lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Studies and named expressions are example parameters rather than prebuilt geometry or numerical admission bypasses.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes optional presentation and study content, ordinary preset admission and mounted-viewport closure ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This panel input contract selects no control, history or numerical builder algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The structure exposes content and factories without implementing shared document or frame cache equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No viewport or download URL is acquired by this schema itself; the mounted panel and supplied implementations own those lifetimes.
 *
 * @author Samchon
 */
export interface IConnectedFacePanelProps<Model> {
  /** Admitted basis; the panel reads its channels and measures their scale. */
  basis: IAutoMovieHumanFaceBasis;

  /** The document the panel opens. */
  initial: IAutoMovieHumanFaceBasisDocument;

  /** The simple coordinate map, when the basis has one. */
  controlMap?: IAutoMovieHumanFaceControlMap;

  /** The component tree that groups fine controls. */
  componentTree?: IAutoMovieHumanFaceComponentTree;

  /** Application-owned studies; never embedded in the numerical package. */
  studies?: readonly IAutoMovieHumanFaceBasisDocument[];

  /** Expression presets. */
  presets: IConnectedFaceExpressionPreset[];

  /**
   * Acquire a face viewport on this panel's canvas, transferred to the mounted panel's close path.
   *
   * @evidence contracts/common.md#principled-implementation The actual consumer canvas anchors frame preparation and display before the panel admits document publication.
   * @evidence contracts/common.md#clear-and-simple-design Renderer and worker construction stay behind the factory instead of entering history/control code.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory receives the real mounted canvas rather than a fixture display or pre-rendered subject frame.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies acquisition, canvas association and transfer to the panel close path.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This factory signature chooses no renderer setup or numerical build algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Canvas acquisition is an effect and does not promise sharing across distinct mounts.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Acquired viewport cleanup is owned by the actual factory and panel, not this type declaration.
   */
  viewport: (canvas: HTMLCanvasElement) => IConnectedFaceViewport<Model>;

  /**
   * Deliver explicitly saved JSON or encoded GLB bytes under the supplied filename and media type.
   *
   * @evidence contracts/common.md#principled-implementation Byte handoff separates numerical document/model encoding from the browser's file delivery seam.
   * @evidence contracts/common.md#clear-and-simple-design One sink serves save and export without making the panel own object URL implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts File delivery preserves encoded bytes and does not certify visual or anatomical validity.
   * @evidence contracts/common.md#meaningful-documentation The member identifies explicit save/export delivery, filename and MIME metadata.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This sink signature chooses no encoding or browser Blob allocation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work User file delivery is an effect and promises no shared handoff based on byte equality.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary URLs and anchors belong to the supplied browser sink implementation.
   */
  download: (filename: string, bytes: BlobPart, mime: string) => void;
}
