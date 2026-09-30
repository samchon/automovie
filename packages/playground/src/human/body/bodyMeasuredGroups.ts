/**
 * The channel groups whose controls the body panel can state in millimetres.
 *
 * A channel is measurable when its measurement rule evaluated at neutral and at
 * its positive endpoint, and at its negative endpoint when it has one; a
 * channel whose rule the basis cannot evaluate (a landmark missing, a plane
 * with no closed loop) reports null values and is not offered as a measured
 * control. A group is listed once, in the order its first measurable channel
 * appears in the basis, so the panel's group menu follows the basis and not an
 * alphabetical or hand-kept list. Pure; the panel owns the DOM it builds from
 * this.
 */
export function bodyMeasuredGroups(
  channels: readonly {
    id: string;
    group: string;
    negative: unknown;
  }[],
  scales: ReadonlyMap<
    string,
    {
      measurement?: {
        neutral: unknown;
        positive: unknown;
        negative: unknown;
      } | null;
    }
  >,
): string[] {
  return [
    ...new Set(
      channels
        .filter((channel) => {
          const measurement = scales.get(channel.id)?.measurement;
          return (
            measurement !== null &&
            measurement !== undefined &&
            measurement.neutral !== null &&
            measurement.positive !== null &&
            (channel.negative === null || measurement.negative !== null)
          );
        })
        .map((channel) => channel.group),
    ),
  ];
}
