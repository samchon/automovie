import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHoldInfant,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A cradle's rocking: the infant swayed along the hold's sideways axis by the
 * authored amplitude on a sine of the authored frequency, starting at rest once
 * the arms have settled, so the sway never exceeds the amplitude and the hold
 * enters unswayed.
 *
 * @param rock The authored rocking; none when absent.
 * @param toward The hold's sideways unit axis.
 * @param settle Seconds the arms take to bring the infant in.
 * @param seconds Seconds into the hold.
 * @returns The sway, world metres.
 */
export function holdInfantSway(
  rock: IAutoMovieMotionHumanHoldInfant.IRock | undefined,
  toward: IAutoMovieVector3,
  settle: number,
  seconds: number,
): IAutoMovieVector3 {
  if (rock === undefined) return { x: 0, y: 0, z: 0 };
  return Vector3.scale(
    toward,
    rock.amplitude *
      Math.sin(2 * Math.PI * rock.frequency * Math.max(0, seconds - settle)),
  );
}
