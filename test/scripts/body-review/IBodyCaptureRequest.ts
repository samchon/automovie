import type { HumanObservationPass } from "@automovie/playground/src/human/common/observation/HumanObservationPass";
import type { HumanObservationView } from "@automovie/playground/src/human/common/observation/HumanObservationView";

/**
 * The parsed body capture selection; omitted CLI options become the defaults
 * described here before any document is submitted to the viewer.
 * @author Samchon
 */
export interface IBodyCaptureRequest {
  /** Run name used under the selected storage's `body-review/editor-<name>/`. */
  name: string;

  /** State keys to select, or null to draw every state in the document source. */
  states: string[] | null;

  /** Camera views in draw order; defaults to the six horizon views. */
  views: HumanObservationView[];

  /** Drawing passes in order; defaults to beauty and clay. */
  passes: HumanObservationPass[];

  /** Authored state JSON file, or null to use the standard review states. */
  documents: string | null;

  /** Explicit candidate basis path, or null to use the viewer's admitted published body. */
  basis: string | null;
}
