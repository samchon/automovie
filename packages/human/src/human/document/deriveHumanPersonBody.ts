import type { IAutoMovieHumanBodyBasisDocument } from "../../body/structures/IAutoMovieHumanBodyBasisDocument";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IDeriveHumanPersonBodyProps } from "./IDeriveHumanPersonBodyProps";

/**
 * The body document a person evaluates: the person's body with the skin
 * colour derived from the face, so one person has one skin colour.
 *
 * The body colours its skin by anatomical site from a cheek albedo (linear
 * RGB, each channel in (0, 1]) and meets the face in that colour at the neck.
 * That albedo is the face's skin material colour after the face document's
 * own override, taken before any pigmentation field lifts it (the cheek is
 * the reference the site fields multiply, and a field that lightens past the
 * material is folded into the material by the face builder without changing
 * the cheek's albedo). The person therefore states its colour once, in the face
 * document, and the body follows.
 *
 * A body document that carries its own `skinColour` is refused rather than
 * overwritten or trusted: a person with two colours has no answer to which
 * one the neck should meet. A face material set without a skin material, a
 * channel outside (0, 1] (a zero channel, the body's site power law has no
 * meaning for) and a face override that names a non-finite value are refused
 * with the cause. The result is a new document; the person's are not modified.
 */
export function deriveHumanPersonBody(
  props: IDeriveHumanPersonBodyProps,
): IAutoMovieHumanBodyBasisDocument {
  const { document, faceMaterials } = props;
  if (document.body.skinColour !== undefined)
    throw new Error(
      "A person's skin colour is the face's: the body document must not state its own skinColour.",
    );
  const skin = faceMaterials.find(
    (material) => material.id === HUMAN_PERSON_SEAM.skinMaterial,
  );
  if (skin === undefined)
    throw new Error(
      "The face basis has no material '" +
        HUMAN_PERSON_SEAM.skinMaterial +
        "' to take the person's skin colour from.",
    );
  const override =
    document.face.materials?.[HUMAN_PERSON_SEAM.skinMaterial]?.color;
  const cheek = {
    r: override?.r ?? skin.baseColor.r,
    g: override?.g ?? skin.baseColor.g,
    b: override?.b ?? skin.baseColor.b,
  };
  if (
    [cheek.r, cheek.g, cheek.b].some(
      (channel) => !Number.isFinite(channel) || channel <= 0 || channel > 1,
    )
  )
    throw new Error(
      "A person's skin colour needs each linear channel in (0, 1]: " +
        JSON.stringify(cheek),
    );
  return { ...document.body, skinColour: { cheek } };
}
