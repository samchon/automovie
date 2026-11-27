import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/**
 * Locate an intent by performer, action and next occurrence of its id: the
 * instance counts the person's placed actions and overlays of that id, plus
 * one.
 *
 * @param self The performance's state.
 * @param intent The intent.
 * @returns Its performer, action and instance.
 */
export function HumanPerformanceReadWhere(
  self: IAutoMovieMotionHumanPerformanceState,
  intent: IAutoMovieIntent,
): IAutoMovieMotionHumanRefusal.IWhere {
  const id: string = intent.anchor ?? intent.capability;
  const person: IAutoMovieMotionHumanSegment.IPerson | undefined =
    self.people.get(intent.subject);
  let instance: number = 1;
  if (person !== undefined) {
    for (const segment of person.segments) if (segment.id === id) ++instance;
    for (const overlay of person.overlays) if (overlay.id === id) ++instance;
  }
  return {
    performer: intent.subject,
    act: intent.capability,
    instance,
  };
}
