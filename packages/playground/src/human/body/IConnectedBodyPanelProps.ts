import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

import type { BodyPosePreset } from "./BodyPosePreset";
import type { IConnectedBodySimpleSolvers } from "./IConnectedBodySimpleSolvers";
import type { IConnectedBodyViewport } from "./IConnectedBodyViewport";

/**
 * What the connected body panel is mounted with: the admitted basis, the initial document and pose presets, the viewport factory, the head seat, the off-thread solvers and the download sink. Pose presets are example inputs, not clinical range authority. The viewport owns prepared frames, the panel owns document admission and history, and the companion seat evaluates the head from the admitted document.
 *
 * @evidence contracts/common.md#principled-implementation The panel is mounted from an admitted basis and initial document, with numerical solvers and frame lifecycle injected separately from example pose inputs.
 * @evidence contracts/common.md#clear-and-simple-design The mount groups required application seams while leaving GPU display to the viewport and reusable numerical inversion to Human workers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Presets are identified as examples rather than clinical authority, and companion geometry is evaluated from the body document rather than a fixed rendered fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns basis, frame, document and companion responsibilities and distinguishes example poses from clinical capacity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This panel mount type selects no history, inverse-solver or rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Injected solvers and viewport factories declare no shared document-build cache at this structural boundary.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no viewport or worker; their lifecycle belongs to the factory implementations and mounted panel.
 *
 * @author Samchon
 */
export interface IConnectedBodyPanelProps<Model> {
  /** The admitted body basis. */
  basis: IAutoMovieHumanBodyBasis;

  /** The document the panel opens. */
  initial: IAutoMovieHumanBodyBasisDocument;

  /** Pose presets. */
  poses: BodyPosePreset[];

  /**
   * Create the body viewport bound to the panel-owned canvas; its implementation owns frame preparation and retirement.
   *
   * @evidence contracts/common.md#principled-implementation The actual panel canvas is the rendering target, and viewport frame operations expose preparation separately from transaction publication.
   * @evidence contracts/common.md#clear-and-simple-design A canvas factory keeps renderer construction outside document and control mounting logic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory receives the live consumer canvas rather than a fixture renderer or precomputed body display.
   * @evidence contracts/common.md#meaningful-documentation The factory comment identifies canvas ownership and the implementation's prepared-frame cleanup responsibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This viewport factory signature chooses no renderer creation or frame-build strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Viewport acquisition is an effect with no declared reuse across canvas instances.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned viewport implementation owns its renderer resources; this callable type acquires no handles itself.
   */
  viewport: (canvas: HTMLCanvasElement) => IConnectedBodyViewport<Model>;

  /**
   * Seat the head on the published body for this body document, or hide it (`null`); the head is evaluated from the document, not from the model.
   *
   * @evidence contracts/common.md#principled-implementation Companion evaluation uses the admitted body document, while a null model explicitly requests hiding rather than inventing a replacement body frame.
   * @evidence contracts/common.md#clear-and-simple-design The panel supplies publication state and document context without owning the head worker or companion renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Seating does not infer authored head geometry from a display model or replace failed evaluation with fixed subject content.
   * @evidence contracts/common.md#meaningful-documentation The seat comment states document-based evaluation and the exact null-model hiding meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This seat callback type implements no head generation or placement calculation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Companion updates are effects whose generation checks belong to the supplied seat implementation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Head worker and renderer frame retention remain owned by the seat behind this callback.
   */
  seat: (
    model: Model | null,
    document: IAutoMovieHumanBodyBasisDocument,
  ) => void;

  /** The simple tier and measurement inverse, solved off the page's thread. */
  simple: IConnectedBodySimpleSolvers;

  /**
   * Deliver explicitly saved document or export bytes with their filename and MIME type.
   *
   * @evidence contracts/common.md#principled-implementation Explicit byte delivery separates document or model encoding from the browser's user-file download mechanism.
   * @evidence contracts/common.md#clear-and-simple-design A generic sink serves body saves and exports without exposing URL or link management to the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts File delivery preserves the encoded payload and does not establish anatomical or visual validity.
   * @evidence contracts/common.md#meaningful-documentation The member identifies explicit save/export delivery and accompanying filename and media metadata.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This body-file sink declares no serialization or download-buffer algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Downloading a user file is an effect and declares no sharing based on matching bytes.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Temporary browser URLs and link cleanup belong to the supplied file-delivery implementation.
   */
  download: (filename: string, bytes: BlobPart, mime: string) => void;
}
