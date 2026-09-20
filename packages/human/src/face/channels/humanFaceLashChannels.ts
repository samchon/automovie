import { portraitEyelashParameters } from "../anatomy/lash/portraitEyelashParameters";
import { IAutoMovieHumanFaceDetailChannel } from "../structures/IAutoMovieHumanFaceDetailChannel";
import { portraitPoint as p } from "../mesh/portraitPoint";
import { createHumanFaceDetailChannel as channel } from "../editor/createHumanFaceDetailChannel";

/**
 * Declare lashes scalar controls for the common document editor.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Connects the native eyelash parameter vocabulary to upper lash profile editing.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Prefixes each native lash parameter with upperLashProfile while retaining its units, bounds, step and effect.
 */
export const humanFaceLashChannels: readonly IAutoMovieHumanFaceDetailChannel[] =
  [
    ...portraitEyelashParameters.map((p) =>
      channel(
        "eye",
        `upperLashProfile.${p.id}`,
        p.meaning,
        p.unit,
        p.minimum,
        p.maximum,
        p.step,
        p.effect,
      ),
    ),
  ];
