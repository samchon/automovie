import type { humanFaceRegions } from "../editor/humanFaceRegions";

/**
 * A numerical anatomical channel. Identity neutral is the named basis
 * value, not a universal person's dimension. Coupled geometry still requires
 * successful construction; these scalar envelopes cannot prove attachment.
 *
 * @evidence contracts/common.md#principled-implementation Named region/path, physical-or-authoring unit and supported numeric envelope identify a detailed recipe field; its neutral comes from the document basis, and actual geometry still requires coupled construction.
 * @evidence contracts/common.md#clear-and-simple-design Identity, interpretation, interval and attachment metadata serve the editor without becoming a second profile or universal person's dimension.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Slider step does not quantize finer valid entry, count fields still require integral admission, and scalar ranges certify no attachment or physiological population envelope.
 * @evidence contracts/common.md#meaningful-documentation Members give profile path, meaning, units, inclusive bounds, source-neutral, signs, side policy and shared geometry reference.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This metadata schema performs no detail validation or geometry solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stable paths identify fields but implement no shared profile computation or cached neutral.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The editor owns channel metadata and its path array; no model/renderer handle is acquired here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceDetailChannel {
  /** Stable path beneath the detailed profile, independent of the person. */
  id: string;

  /** Anatomical profile owning this channel. */
  region: (typeof humanFaceRegions)[number];

  /** Field path beneath that profile. */
  path: readonly string[];

  /** Anatomical meaning, also shown by the editor. */
  meaning: string;

  /** Millimetres, degrees, a dimensionless ratio or a discrete count. */
  unit: string;

  /** Inclusive authoring-envelope minimum. */
  minimum: number;

  /** Inclusive authoring-envelope maximum. */
  maximum: number;

  /** Slider interval; numeric entry may retain finer valid precision. */
  step: number;

  /** The exact neutral is read from this document's inherited basis. */
  neutral: "basis";

  /** Positive and negative changes keep this interpretation for every person. */
  effect: string;

  /** Whether right and left can override this profile independently. */
  paired: boolean;

  /** Shared geometry reference used when the value is constructed. */
  attachment: string;
}
