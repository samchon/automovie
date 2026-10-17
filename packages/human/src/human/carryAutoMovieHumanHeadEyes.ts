import { IAutoMovieHumanPartGenerator } from "../parts/IAutoMovieHumanPartGenerator";
import { AutoMovieHumanEyeGenerator } from "../parts/eye/AutoMovieHumanEyeGenerator";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";

/**
 * Carry the eyeballs after a head's own attachments, preserving its actual host.
 *
 * The optional provider is captured and bound to the selected head, so a
 * decorator does not erase the capability or replace its receiver. No default
 * host is invented for a head that does not expose one.
 *
 * @param head The actual selected head owner
 * @param eyes The independent eye attachment generator
 * @returns Delegated head geometry, ordered attachments and optional owned host
 */
export function carryAutoMovieHumanHeadEyes(
  head: IAutoMovieHumanPartGenerators["head"],
  eyes: AutoMovieHumanEyeGenerator,
): IAutoMovieHumanPartGenerators["head"] {
  const provider: IAutoMovieHumanPartGenerators["head"]["eyeHairHost"] =
    head.eyeHairHost?.bind(head);
  return {
    part: "head",
    generate: (
      props: IAutoMovieHumanPartGenerator.IProps<"head">,
    ): ReturnType<IAutoMovieHumanPartGenerator<"head">["generate"]> =>
      head.generate(props),
    attachments: (
      props: IAutoMovieHumanPartGenerator.IAttachmentProps<"head">,
    ): IAutoMovieHumanPartGenerator.IAttachment[] => [
      ...(head.attachments?.(props) ?? []),
      ...eyes.generate(props),
    ],
    ...(provider === undefined ? {} : { eyeHairHost: provider }),
  };
}
