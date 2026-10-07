import { resolveHumanBodyForefootParts } from "../lower-limb/resolveHumanBodyForefootParts";
import { resolveHumanBodyHindfootParts } from "../lower-limb/resolveHumanBodyHindfootParts";
import { resolveHumanBodyKneeParts } from "../lower-limb/resolveHumanBodyKneeParts";
import { resolveHumanBodyLegParts } from "../lower-limb/resolveHumanBodyLegParts";
import { resolveHumanBodyThighParts } from "../lower-limb/resolveHumanBodyThighParts";
import { resolveHumanBodyPelvisParts } from "../pelvis/resolveHumanBodyPelvisParts";
import { resolveHumanBodyShoulderParts } from "../shoulder/resolveHumanBodyShoulderParts";
import { resolveHumanBodyTrunkParts } from "../thorax/resolveHumanBodyTrunkParts";
import { resolveHumanBodyCarpusParts } from "../upper-limb/resolveHumanBodyCarpusParts";
import { resolveHumanBodyDigitParts } from "../upper-limb/resolveHumanBodyDigitParts";
import { resolveHumanBodyForearmParts } from "../upper-limb/resolveHumanBodyForearmParts";
import { resolveHumanBodyUpperArmParts } from "../upper-limb/resolveHumanBodyUpperArmParts";
import type { IAutoMovieHumanBodyRegionPartResolver } from "./IAutoMovieHumanBodyRegionPartResolver";

/**
 * Every region resolver `assembleHumanBodyGeneratedAnatomy` combines.
 *
 * Each region owner appends its own resolver. Order does not change the
 * report, because two answers for one part refuse.
 *
 * @author Samchon
 */
export const HUMAN_BODY_REGION_PART_RESOLVERS: readonly IAutoMovieHumanBodyRegionPartResolver[] =
  [
    resolveHumanBodyPelvisParts,
    resolveHumanBodyThighParts,
    resolveHumanBodyKneeParts,
    resolveHumanBodyLegParts,
    resolveHumanBodyHindfootParts,
    resolveHumanBodyForefootParts,
    resolveHumanBodyTrunkParts,
    resolveHumanBodyShoulderParts,
    resolveHumanBodyUpperArmParts,
    resolveHumanBodyForearmParts,
    resolveHumanBodyCarpusParts,
    resolveHumanBodyDigitParts,
  ];
