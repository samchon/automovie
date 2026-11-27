/*
 * Film intervals less one interval: each piece cut at the removed interval's
 * ends, its part before `from` and its part after `to` kept where they are of
 * positive length (`solvedHumanAuditSpans.unsolved`, which removes each span a
 * solved window owns).
 * Parameter pieces: The intervals, each a first and last film second, in order.
 * Parameter from: The removed interval's first film second.
 * Parameter to: The removed interval's last film second.
 * Returns: What is left, in order.
 */
export function subtractHumanAuditInterval(
  pieces: readonly subtractHumanAuditInterval.Interval[],
  from: number,
  to: number,
): subtractHumanAuditInterval.Interval[] {
  return pieces.flatMap(
    ([
      a,
      b,
    ]: subtractHumanAuditInterval.Interval): subtractHumanAuditInterval.Interval[] => {
      const before: subtractHumanAuditInterval.Interval = [
        a,
        Math.min(b, from),
      ];
      const after: subtractHumanAuditInterval.Interval = [Math.max(a, to), b];
      return [before, after].filter(
        ([c, d]: subtractHumanAuditInterval.Interval): boolean => d > c,
      );
    },
  );
}

/*
 * Companion types of subtractHumanAuditInterval.
 */
export namespace subtractHumanAuditInterval {
  /*
   * A first and last film second.
   */
  export type Interval = readonly [number, number];
}
