import type {
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanArmPlanned,
} from "@automovie/interface";

/**
 * The span one problem of a group is solved over: the first member's, or, where
 * the members' own spans differ (a hold handed from one hand to the other),
 * from the earliest start and reach to the latest release and end, each arm
 * keeping its own hold (`AutoMovieMotionHumanArmPlanned.planned`); its knots
 * are every member's.
 *
 * @param carries The group's members.
 * @param span The span of the member prepared first.
 * @returns The group's span.
 */
export function AutoMovieMotionHumanArmCarrySpan(
  carries: readonly IAutoMovieMotionHumanArmCarry.ICarry[],
  span: IAutoMovieMotionHumanArmPlanned.ISpan,
): IAutoMovieMotionHumanArmPlanned.ISpan {
  const spans: IAutoMovieMotionHumanArmPlanned.ISpan[] = carries.map(
    (
      member: IAutoMovieMotionHumanArmCarry.ICarry,
    ): IAutoMovieMotionHumanArmPlanned.ISpan => member.span ?? span,
  );

  // Every member's constrained instants are waypoints of the one problem.
  const knots: number[] = [
    ...new Set<number>(
      spans.flatMap(
        (s: IAutoMovieMotionHumanArmPlanned.ISpan): number[] => s.knots ?? [],
      ),
    ),
  ].sort((a: number, b: number): number => a - b);
  if (
    spans.every(
      (s: IAutoMovieMotionHumanArmPlanned.ISpan): boolean =>
        s.start === span.start &&
        s.ready === span.ready &&
        s.relax === span.relax &&
        s.end === span.end,
    )
  )
    return knots.length === 0 ? span : { ...span, knots };
  return {
    ...(knots.length === 0 ? {} : { knots }),
    start: Math.min(
      ...spans.map(
        (s: IAutoMovieMotionHumanArmPlanned.ISpan): number => s.start,
      ),
    ),
    ready: Math.min(
      ...spans.map(
        (s: IAutoMovieMotionHumanArmPlanned.ISpan): number => s.ready,
      ),
    ),
    relax: Math.max(
      ...spans.map(
        (s: IAutoMovieMotionHumanArmPlanned.ISpan): number => s.relax,
      ),
    ),
    end: Math.max(
      ...spans.map((s: IAutoMovieMotionHumanArmPlanned.ISpan): number => s.end),
    ),
  };
}
