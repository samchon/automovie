import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

/**
 * A motion's span from `from` to `to` as a motion of its own: its seconds start
 * at `from`, and its actions' spans are moved by as much (`AutoMovieMotionHumanVerdicts`).
 *
 * @param motion The motion, in film seconds.
 * @param from The span's first film second.
 * @param to The span's last film second, at or after `from`.
 * @returns The motion itself for its whole film, otherwise a motion of `to -
 *   from` seconds that reads `motion` at `from` plus its own seconds.
 */
export function HumanVerdictsSpan(
  motion: IAutoMovieMotionHumanAuditMotion,
  from: number,
  to: number,
): IAutoMovieMotionHumanAuditMotion {
  return from === 0 && to === motion.duration
    ? motion
    : {
        duration: to - from,
        bones: (
          subject: string,
          seconds: number,
        ): ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> =>
          motion.bones(subject, from + seconds),
        ...(motion.support === undefined
          ? {}
          : {
              support: (
                support: IAutoMovieMotionHumanContactWindow.Support,
                seconds: number,
              ): IAutoMovieRigidTransform =>
                motion.support!(support, from + seconds),
            }),
        ...(motion.water === undefined
          ? {}
          : {
              water: (subject: string, seconds: number): boolean =>
                motion.water!(subject, from + seconds),
            }),
        segments: (subject: string): IAutoMovieMotionHumanAuditMotion.ISpan[] =>
          motion.segments(subject).map(
            (
              span: IAutoMovieMotionHumanAuditMotion.ISpan,
            ): IAutoMovieMotionHumanAuditMotion.ISpan => ({
              ...span,
              start: span.start - from,
              entryTime: span.entryTime - from,
              end: span.end - from,
            }),
          ),
      };
}
