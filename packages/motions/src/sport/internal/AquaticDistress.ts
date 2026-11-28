import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanBound } from "../../law/internal/HumanBound";
import { AquaticPosture } from "./AquaticPosture";

/**
 * Stages upright aquatic distress and submersion.
 *
 * The lateral arm press and unsupported legs follow the behavior described by
 * Pia (1974), as summarized by Vittone and Pia in "It Doesn't Look Like They're
 * Drowning", US Coast Guard On Scene, Fall 2006. The press cycle and descent
 * timing are staging estimates.
 */
export namespace AquaticDistress {
  /**
   * Vertical amplitude in metres of the staged distress bob.
   */
  export const BAND: number = 0.05;

  /**
   * Stage an upright distress press followed by submersion.
   *
   * The root stays at the entered horizontal position. The mouth bobs at the
   * water plane while both arms press laterally. The press lasts 20 to 60
   * seconds and defaults to 30. Submersion then lowers the body over two
   * seconds.
   *
   * @param context Entered body and posture, with an optional press duration.
   * @param water World height of the water plane in metres.
   * @returns The elapsed-time posture, opening `distress` and `relax` cues,
   *   the `submerge` cue at the end of the press, and the final `under` cue.
   * @throws {AutoMovieMotionHumanRefusal} For a press duration outside 20 to
   *   60 seconds.
   */
  export function plan(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const struggle: number = params.duration ?? STRUGGLE;
    HumanBound.within("seconds", struggle, 20, 60);
    const duration: number = struggle + SINK;
    const key = (raise: number): IAutoMovieMotionHumanPosture =>
      AquaticPosture.key(
        entry.posture,
        ExerciseKey.from(
          body,
          { neck: 25 },
          { hip: 15, knee: 30, shoulder: 0, raise, elbow: 10 },
        ),
      );
    const high: IAutoMovieMotionHumanPosture = key(85);
    const press: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      high,
      key(55),
    );
    const mouth: number =
      HumanTrunk.region(body, high, "mouth").point.y - high.root.y;
    return {
      duration,
      contacts: [],
      events: [
        // A rescuer may take the swimmer at any point of the struggle.
        { name: "relax", share: 0 },
        { name: "distress", share: 0 },
        { name: "submerge", share: struggle / duration },
        { name: "under", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, seconds));
        const cycle: number = (t / PRESS) % 1;
        const down: number = Math.sin(Math.PI * cycle) ** 2;
        const shaped: IAutoMovieMotionHumanPosture = press(down);
        const sink: number = Math.max(0, (t - struggle) / SINK);
        return AquaticPosture.translate(shaped, {
          ...entry.posture.root,
          y:
            water -
            mouth +
            AquaticDistress.BAND * Math.cos(2 * Math.PI * cycle) -
            UNDER * Math.min(1, sink),
        });
      },
    };
  }
}

/*
 * Seconds before submersion when the author gives none: inside Pia's 20 to 60
 * s.
 */
const STRUGGLE: number = 30;

/*
 * Seconds over which the head goes under at the end: provisional.
 */
const SINK: number = 2;

/*
 * Metres the mouth goes under at submersion: enough to take the crown under.
 */
const UNDER: number = 0.3;

/*
 * Seconds of one lateral arm press: provisional.
 */
const PRESS: number = 1.1;
