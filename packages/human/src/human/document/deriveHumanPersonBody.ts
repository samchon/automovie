import type { IAutoMovieHumanBodyBasisDocument } from "../../body/structures/IAutoMovieHumanBodyBasisDocument";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import type { IDeriveHumanPersonBodyProps } from "./IDeriveHumanPersonBodyProps";

/**
 * Derive the body document's cheek albedo from the face's existing skin material and optional per-channel colour override, so person skin has one colour authority.
 *
 * Linear RGB channels must lie in (0,1]; zero is outside the body site's power-law domain. The value precedes face pigmentation-field lifting, retaining the face material owner's original albedo meaning. Body site colour and later face pigmentation keep their own optical conventions; this shared numerical colour is not a measured tissue property or proof of current matching appearance.
 *
 * Explicit body skinColour, missing face skin material and nonfinite/out-of-domain channels refuse rather than being overridden or clamped. The result owns a shallow body wrapper and cheek record while borrowing unchanged document members; inputs remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Exact existing skin material identity and actual face override precedence yield the single admitted linear cheek albedo consumed by body site colouring.
 * @evidence contracts/common.md#clear-and-simple-design One derivation owns shared colour precedence; body site fields and face pigmentation/material evaluation remain with their original optical owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conflicting body colour and unsupported zero/nonfinite channels refuse without clamping; shared coefficients are not advertised as measured tissue optics or observed render equivalence.
 * @evidence contracts/common.md#meaningful-documentation Prose states linear (0,1] channels, pre-pigmentation timing, unchanged inputs and borrowed versus newly owned records.
 * @evidence contracts/performance.md#efficient-algorithms A short-circuit O(M) material search and three scalar checks precede a shallow document copy; no texture or vertex population is traversed here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each document/palette supplies its own override-dependent cheek, with no cross-document colour cache or request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned body wrapper and cheek record escape; palette lookup retains no material resource, image buffer or task.
 */
export function deriveHumanPersonBody(
  props: IDeriveHumanPersonBodyProps,
): IAutoMovieHumanBodyBasisDocument {
  const { document, faceMaterials }: IDeriveHumanPersonBodyProps = props;
  if (document.body.skinColour !== undefined)
    throw new Error(
      "A person's skin colour is the face's: the body document must not state its own skinColour.",
    );
  const skin: IDeriveHumanPersonBodyProps["faceMaterials"][number] | undefined =
    faceMaterials.find(
      (
        material: IDeriveHumanPersonBodyProps["faceMaterials"][number],
      ): boolean => material.id === HUMAN_PERSON_SEAM.skinMaterial,
    );
  if (skin === undefined)
    throw new Error(
      "The face basis has no material '" +
        HUMAN_PERSON_SEAM.skinMaterial +
        "' to take the person's skin colour from.",
    );
  const override:
    | NonNullable<IAutoMovieHumanBodyBasisDocument["skinColour"]>["cheek"]
    | undefined =
    document.face.materials?.[HUMAN_PERSON_SEAM.skinMaterial]?.color;
  const cheek: NonNullable<
    IAutoMovieHumanBodyBasisDocument["skinColour"]
  >["cheek"] = {
    r: override?.r ?? skin.baseColor.r,
    g: override?.g ?? skin.baseColor.g,
    b: override?.b ?? skin.baseColor.b,
  };
  if (
    [cheek.r, cheek.g, cheek.b].some(
      (channel: number): boolean =>
        !Number.isFinite(channel) || channel <= 0 || channel > 1,
    )
  )
    throw new Error(
      "A person's skin colour needs each linear channel in (0, 1]: " +
        JSON.stringify(cheek),
    );
  return { ...document.body, skinColour: { cheek } };
}
