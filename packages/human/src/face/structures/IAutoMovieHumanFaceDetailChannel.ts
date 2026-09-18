import { humanFaceRegions } from "../editor/humanFaceRegions";

/**
 * A numerical anatomical channel. Identity neutral is the versioned basis
 * value, not a universal person's dimension. Coupled geometry still requires
 * successful construction; these scalar envelopes cannot prove attachment.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Gives detailed editor channels stable anatomical semantics and signed units.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Declares scalar editing envelopes separately from coupled geometry admission.
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
