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
 */
export function deriveHumanPersonGenerationFace(
  props: IAutoMovieHumanPersonGenerationFaceProps,
): IAutoMovieHumanFaceBasisDocument {
  const { document, gains, aliases, drivers } = props;
  if (aliases.length === 0 && drivers.length === 0)
    return deriveHumanPersonFace(document);
  const shape = { ...document.face.shape };
  for (const alias of aliases)
    if (
      Object.hasOwn(document.face.shape, alias.face) ||
      Object.hasOwn(document.face.shape, alias.body)
    )
      throw new Error(
        "The generation defines " +
          alias.face +
          " once through the body channel " +
          alias.body +
          "; the face document must not state either.",
      );
  for (const driver of drivers) {
    if (Object.hasOwn(document.face.shape, driver.channel))
      throw new Error(
        "The face document must not state the body endpoint driver " +
          driver.channel +
          ".",
      );
    shape[driver.channel] = gains.get(driver.endpoint) ?? 0;
  }
  return { ...document.face, shape };
}
