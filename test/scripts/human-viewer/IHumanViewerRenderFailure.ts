/**
 * A frame refused by the viewer or its authority boundary, without PNG bytes.
 * @author Samchon
 */
export interface IHumanViewerRenderFailure {
  /** Refusal discriminator; no frame can be recorded from this result. */
  ok: false;

  /** Viewer refusal or missing/current-source authority reason. */
  error: string;
}
