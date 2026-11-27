import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { juggle } from "../../exercise/internal/juggle";
import { lineWalk as lineWalkLaw } from "../../exercise/internal/lineWalk";
import { stiltWalk } from "../../exercise/internal/stiltWalk";
import { trampolineBounce } from "../../exercise/internal/trampolineBounce";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_ACROBATICS_ROUND_OFF_LEFT } from "../../next/presets/HUMAN_ACROBATICS_ROUND_OFF_LEFT";
import { HUMAN_ACROBATICS_ROUND_OFF_RIGHT } from "../../next/presets/HUMAN_ACROBATICS_ROUND_OFF_RIGHT";
import { fieldThrow as fieldThrowLaw } from "../../sport/internal/fieldThrow";
import { handspring } from "../../sport/internal/handspring";
import { AutoMovieMotionHumanHighJump as highJump } from "../../sport/internal/AutoMovieMotionHumanHighJump";
import { horizontalJump } from "../../sport/internal/horizontalJump";
import { hurdleClear as hurdleClearLaw } from "../../sport/internal/hurdleClear";
import { AutoMovieMotionHumanPoleVault as poleVault } from "../../sport/poleVault/AutoMovieMotionHumanPoleVault";
import { roundOff } from "../../sport/internal/roundOff";
import { squatVault } from "../../sport/internal/squatVault";
import { vault } from "../../sport/internal/vault";

/**
 * The airborne acrobatics and jumps of gymnastics and athletics under their
 * names, each a row of the law that plans it: a round-off and a handspring that
 * roll over the hands, a handspring vault and a box vault over a prop's top,
 * the Fosbury flop over a bar and a vault on a pole. The composition gives what
 * the law leaves open: the prop vaulted over, the bar's height and the landing
 * place, the pole the hand holds.
 *
 * The laws own the physics a row inherits: each phase turns the body about one
 * axis, flights are ballistic in the centre of mass with their times from the
 * take-off speed, and a turn in the air is its kept rate times the flight time.
 * The multi-axis case (a twisting salto, a round-off's overlapping twist) is
 * not planned.
 */
export namespace HumanGymnastics {
  /**
   * A round-off leading with the left hand, landing on both feet facing back.
   * Takes 1.2 s by default (`roundOff.SECONDS`, provisional).
   */
  export const roundOffLeft: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["roundOffLeft"]
  > = AutoMovieMotionHumanActionRow.of(
    "roundOffLeft",
    roundOff,
    HUMAN_ACROBATICS_ROUND_OFF_LEFT,
  );

  /**
   * A round-off leading with the right hand. Takes 1.2 s by default
   * (`roundOff.SECONDS`, provisional).
   */
  export const roundOffRight: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["roundOffRight"]
  > = AutoMovieMotionHumanActionRow.of(
    "roundOffRight",
    roundOff,
    HUMAN_ACROBATICS_ROUND_OFF_RIGHT,
  );

  /**
   * A front handspring on the floor, lunging on the left leg; the composition
   * may lead with the right.
   */
  export const frontHandspring: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["frontHandspring"]
  > = AutoMovieMotionHumanActionRow.of("frontHandspring", handspring, {});

  /**
   * A handspring vault: the hands on the top of the prop the composition names
   * as `on`.
   */
  export const handspringVault: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["handspringVault"]
  > = AutoMovieMotionHumanActionRow.of("handspringVault", vault, {});

  /**
   * A two-hand box vault: the hands on the near edge of the top of the box the
   * composition names as `on`, the body tucked over them and flying to land
   * beyond its far edge.
   */
  export const boxVault: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["boxVault"]
  > = AutoMovieMotionHumanActionRow.of("boxVault", squatVault, {});

  /** A Fosbury flop over the bar the composition sets, onto its landing place. */
  export const fosburyFlop: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["fosburyFlop"]
  > = AutoMovieMotionHumanActionRow.of("fosburyFlop", highJump, {});

  /** A vault on the pole the hand holds, out of a run. */
  export const vaultOnPole: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["vaultOnPole"]
  > = AutoMovieMotionHumanActionRow.of("vaultOnPole", poleVault, {});

  /**
   * A long jump out of a run into the sand of the pit the composition names, to
   * the distance it gives.
   */
  export const longJump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["longJump"]
  > = AutoMovieMotionHumanActionRow.of("longJump", horizontalJump, {});

  /**
   * A hurdle cleared out of a run, landing on the lead foot for the run to take
   * the stride on.
   */
  export const hurdleClear: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["hurdleClear"]
  > = AutoMovieMotionHumanActionRow.of("hurdleClear", hurdleClearLaw, {});

  /**
   * A shot, discus or hammer thrown from a circle, or a javelin thrown out of a
   * run, to the distance the composition gives. The delivery takes 0.25 s from
   * the end of the turn to the release and the recovery 0.8 s
   * (`fieldThrow.DELIVER`, `fieldThrow.RECOVER`, provisional); the throw's
   * speed follows from the distance.
   */
  export const fieldThrow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["fieldThrow"]
  > = AutoMovieMotionHumanActionRow.of("fieldThrow", fieldThrowLaw, {});

  /**
   * A walk heel to toe along a beam or a rope, arms out for balance. A step
   * takes 0.9 s, a careful balance walk's (`lineWalk.PERIOD`, provisional),
   * about 67 steps a minute.
   */
  export const lineWalk: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["lineWalk"]
  > = AutoMovieMotionHumanActionRow.of("lineWalk", lineWalkLaw, {});

  /** Toss juggling: a cascade or a shower. */
  export const juggling: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["juggling"]
  > = AutoMovieMotionHumanActionRow.of("juggling", juggle, {});

  /**
   * A walk on stilts. A step takes 0.8 s and is 0.35 hip heights long
   * (`stiltWalk.PERIOD`, `stiltWalk.STEP`, provisional), so about 0.4 m/s at
   * the reference hip.
   */
  export const stilts: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["stilts"]
  > = AutoMovieMotionHumanActionRow.of("stilts", stiltWalk, {});

  /**
   * Bouncing on a trampoline. Four bounces by default, the bed returning 0.9 of
   * the energy (`trampolineBounce.KEEP`, provisional).
   */
  export const trampoline: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gymnastics"]["trampoline"]
  > = AutoMovieMotionHumanActionRow.of("trampoline", trampolineBounce, {});
}
