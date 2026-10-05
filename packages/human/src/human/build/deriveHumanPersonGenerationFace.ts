import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import { deriveHumanPersonFace } from "../document/deriveHumanPersonFace";
import type { IAutoMovieHumanPersonGenerationFaceProps } from "../structures/IAutoMovieHumanPersonGenerationFaceProps";

/**
 * The face document a one-skin generation evaluates for a person.
 *
 * Without aliases or drivers it is the person's derived face
 * (`deriveHumanPersonFace`). Otherwise the face subtree must state neither an
 * aliased face channel nor its body owner, since the generation defines that
 * quantity once through the body channel, and must not state a driver
 * channel. Each driver channel then takes the body's own gain of its endpoint,
 * zero when the body does not move it.
 *
 * @evidence contracts/common.md#principled-implementation An aliased quantity has one owner, and a driver carries the body's own gain instead of a second face value.
 * @evidence contracts/common.md#clear-and-simple-design Refuse the stated owners, then copy each driver's gain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A face document stating an aliased or driver channel is refused by name, never silently overwritten.
 * @evidence contracts/common.md#meaningful-documentation States both cases and every refusal.
 * @evidence contracts/modeling.md#parameter-channels Writes only the driver channels and leaves every authored face channel as stated.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function carries no value with a unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The face builder admits the document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function adds no input.
 */
export function deriveHumanPersonGenerationFace(
  props: IAutoMovieHumanPersonGenerationFaceProps,
): IAutoMovieHumanFaceBasisDocument {
  const { document, gains, aliases, drivers } = props;
  if (aliases.length === 0 && drivers.length === 0) return deriveHumanPersonFace(document);
  const shape = { ...document.face.shape };
  for (const alias of aliases)
    if (Object.hasOwn(document.face.shape, alias.face) || Object.hasOwn(document.face.shape, alias.body))
      throw new Error(
        "The generation defines " + alias.face + " once through the body channel " + alias.body +
          "; the face document must not state either.",
      );
  for (const driver of drivers) {
    if (Object.hasOwn(document.face.shape, driver.channel))
      throw new Error("The face document must not state the body endpoint driver " + driver.channel + ".");
    shape[driver.channel] = gains.get(driver.endpoint) ?? 0;
  }
  return { ...document.face, shape };
}
