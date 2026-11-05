import { HUMAN_DEBUG_REGIONS } from "../contracts/HUMAN_DEBUG_REGIONS";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import { HumanDebugChainLoft } from "./HumanDebugChainLoft";
import type { IHumanDebugPiece } from "./IHumanDebugPiece";

/**
 * `region:<name>`: one anatomical region of `HUMAN_DEBUG_REGIONS` lofted alone, both sides, every
 * part and curve; `parts=*left*` or `curves=<chain>/*` narrows it.
 *
 * The provenance lists the person's chains that no region names, so a chain outside the registry
 * is seen rather than lost.
 */
export const HumanDebugPieceRegion: IHumanDebugPiece = {
  name: "region",
  region: "body",
  description: "One anatomical region's chains lofted alone, both sides",
  arguments: Object.keys(HUMAN_DEBUG_REGIONS),
  build: (person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument => {
    const regions: Record<string, readonly string[]> = HUMAN_DEBUG_REGIONS;
    const globs: readonly string[] | undefined =
      argument === null ? undefined : regions[argument];
    if (globs === undefined)
      throw new Error(
        "Name a region: piece=region:<" + Object.keys(regions).join("|") + ">",
      );
    const calibration: ReturnType<IHumanDebugPerson["calibration"]> = person.calibration();
    const document: IHumanDebugDocument = HumanDebugChainLoft.build(calibration, globs);
    const every: string[] = Object.values(regions).flat();
    return {
      parts: document.parts,
      provenance: {
        ...document.provenance,
        piece: "region:" + argument,
        person: person.alias,
        unassigned: calibration.chains
          .map((chain: IAutoMovieLoftChain): string => chain.name)
          .filter(
            (name: string): boolean =>
              !every.some((glob: string): boolean => HumanDebugPattern.expression(glob).test(name)),
          ),
      },
    };
  },
};
