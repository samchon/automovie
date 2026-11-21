import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { HumanActionRow } from "../law/HumanActionRow";
import { fieldThrow as fieldThrowLaw } from "../sport/fieldThrow";
import { handspring } from "../sport/handspring";
import { highJump } from "../sport/highJump";
import { horizontalJump } from "../sport/horizontalJump";
import { hurdleClear as hurdleClearLaw } from "../sport/hurdleClear";
import { poleVault } from "../sport/poleVault";
import { roundOff } from "../sport/roundOff";
import { squatVault } from "../sport/squatVault";
import { vault } from "../sport/vault";

/**
 * The airborne acrobatics and jumps of gymnastics and athletics under their
 * names (#3377), each a row of the law that plans it: a round-off and a
 * handspring that roll over the hands, a handspring vault and a box vault
 * over a prop's top, the Fosbury flop over a bar and a vault on a pole. The
 * composition gives what the law leaves open: the prop vaulted over, the
 * bar's height and the landing place, the pole the hand holds.
 *
 * The laws own the physics a row inherits: each phase turns the body about
 * one axis, flights are ballistic in the centre of mass with their times
 * from the take-off speed, and a turn in the air is its kept rate times the
 * flight time. The multi-axis case (a twisting salto, a round-off's
 * overlapping twist) is #3416.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what the composition gives, whose physics a row inherits and the follow-up.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), so it is data over a law that fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per named figure; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or fixes a length in metres.
 */
export namespace HumanGymnastics {
  /** A round-off leading with the left hand, landing on both feet facing back. */
  export const roundOffLeft: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["roundOffLeft"]
  > = HumanActionRow.of("roundOffLeft", roundOff, {
    lead: "left",
  });

  /** A round-off leading with the right hand. */
  export const roundOffRight: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["roundOffRight"]
  > = HumanActionRow.of("roundOffRight", roundOff, {
    lead: "right",
  });

  /** A front handspring on the floor, lunging on the left leg; the composition may lead with the right. */
  export const frontHandspring: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["frontHandspring"]
  > = HumanActionRow.of("frontHandspring", handspring, {});

  /** A handspring vault: the hands on the top of the prop the composition names as `on`. */
  export const handspringVault: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["handspringVault"]
  > = HumanActionRow.of("handspringVault", vault, {});

  /** A two-hand box vault: the hands on the near edge of the top of the box the composition names as `on`, the body tucked over them and flying to land beyond its far edge. */
  export const boxVault: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["boxVault"]
  > = HumanActionRow.of("boxVault", squatVault, {});

  /** A Fosbury flop over the bar the composition sets, onto its landing place. */
  export const fosburyFlop: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["fosburyFlop"]
  > = HumanActionRow.of("fosburyFlop", highJump, {});

  /** A vault on the pole the hand holds, out of a run. */
  export const vaultOnPole: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["vaultOnPole"]
  > = HumanActionRow.of("vaultOnPole", poleVault, {});

  /** A long jump out of a run into the sand of the pit the composition names, to the distance it gives. */
  export const longJump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["longJump"]
  > = HumanActionRow.of("longJump", horizontalJump, {});

  /** A hurdle cleared out of a run, landing on the lead foot for the run to take the stride on. */
  export const hurdleClear: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["hurdleClear"]
  > = HumanActionRow.of("hurdleClear", hurdleClearLaw, {});

  /** A shot, discus or hammer thrown from a circle, or a javelin thrown out of a run, to the distance the composition gives. */
  export const fieldThrow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["fieldThrow"]
  > = HumanActionRow.of("fieldThrow", fieldThrowLaw, {});
}
