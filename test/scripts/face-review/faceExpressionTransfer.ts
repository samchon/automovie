/**
 * Expression weights of a published document from its photograph's detector
 * scores, one channel from its own score through a shared calibration.
 *
 * The detector reports the photograph's expression as ARKit face-unit scores
 * and the basis names its expression channels after the same units, but the
 * two scales differ: a channel at full weight on the basis does not read as a
 * score of one. So each channel is calibrated once on the reference head,
 * `derive-face-documents.ts` rendering it through the product editor at
 * weights 0, 1/4, 1/2, 3/4 and 1 under a frontal camera and reading its own
 * score, and that increment curve is shared by every subject. A subject's
 * photograph asks for the increment its score shows over the score the
 * subject's own identity reads at rest (the identity is solved first; a head
 * whose brows sit low reads as a lowered brow before any expression), and the
 * weight is that increment read back through the monotone curve.
 *
 * A channel is transferred only when it is `observable`
 * (`faceExpressionObservable`): its full-weight increment on the reference
 * head must be at least the spread the same detector reports for that unit
 * across the population's photographs (twice their standard deviation, the
 * 95% band). The detector's scale differs between a render and a
 * photograph, and a channel whose whole range is narrower than the variation
 * real faces show cannot receive a photograph's reading: every face would
 * saturate it, which is no measurement. Such a unit stays zero; a unit the
 * instrument cannot carry across is not guessed. Left and right units are
 * judged as one pair on their mean span and spread, so the identity's
 * expression is never lateralised by the test itself. An increment
 * beyond the curve's end is held at weight one and reported, and a negative
 * increment (the photograph reads less of a unit than the identity at rest)
 * is weight zero, because the channels are one-sided.
 *
 * Pure: reads caller-owned values and returns new ones.
 */

/** One channel's calibration: its own score at increasing weights. */
export interface IFaceExpressionCalibration {
  weights: readonly number[];
  scores: readonly (number | null)[];
}

/** One channel's transferred weight and how it was obtained. */
export interface IFaceExpressionTransferRow {
  channel: string;
  weight: number;
  status: "transferred" | "held" | "unobservable" | "absent";
}

export function transferFaceExpression(props: {
  calibration: Readonly<Record<string, IFaceExpressionCalibration>>;
  observable: readonly string[];
  photo: Readonly<Record<string, number>>;
  rest: Readonly<Record<string, number>>;
}): IFaceExpressionTransferRow[] {
  return Object.entries(props.calibration).map(([channel, curve]) => {
    const points = curve.weights
      .map((w, k) => [w, curve.scores[k]] as const)
      .filter((p): p is readonly [number, number] => p[1] !== null);
    if (points.length < 2 || points[0]![0] !== 0)
      throw new Error(
        `The calibration of ${channel} needs its rest score and a weight.`,
      );
    // The increment curve, made monotone by a running maximum: a detector's
    // score may dip between two samples, and a weight is read back from the
    // first place the curve reaches the asked increment.
    const base = points[0]![1];
    let top = 0;
    const increments = points.map(([w, s]) => {
      top = Math.max(top, s - base);
      return [w, top] as const;
    });
    const span = increments[increments.length - 1]![1];
    const score = props.photo[channel];
    const rest = props.rest[channel];
    if (score === undefined || rest === undefined)
      return { channel, weight: 0, status: "absent" as const };
    if (!props.observable.includes(channel))
      return { channel, weight: 0, status: "unobservable" as const };
    const asked = score - rest;
    if (asked <= 0)
      return { channel, weight: 0, status: "transferred" as const };
    if (asked >= span) return { channel, weight: 1, status: "held" as const };
    for (let k = 1; k < increments.length; ++k) {
      const [w1, d1] = increments[k]!;
      const [w0, d0] = increments[k - 1]!;
      if (asked <= d1 && d1 > d0)
        return {
          channel,
          weight: w0 + ((asked - d0) / (d1 - d0)) * (w1 - w0),
          status: "transferred" as const,
        };
    }
    return { channel, weight: 1, status: "held" as const };
  });
}

/**
 * The channels whose calibrated span reaches the spread of the photographs'
 * scores (see `transferFaceExpression`); a `...Left`/`...Right` pair is
 * judged on its mean span and mean spread and passes or fails together.
 */
export function faceExpressionObservable(
  calibration: Readonly<Record<string, IFaceExpressionCalibration>>,
  photographs: readonly Readonly<Record<string, number>>[],
): string[] {
  if (photographs.length < 2)
    throw new Error("The photograph spread needs at least two photographs.");
  const span = (channel: string): number => {
    const scores = calibration[channel]!.scores.filter(
      (s): s is number => s !== null,
    );
    return Math.max(0, ...scores.map((s) => s - scores[0]!));
  };
  const spread = (channel: string): number => {
    const values = photographs.map((one) => one[channel] ?? 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return (
      2 *
      Math.sqrt(
        values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1),
      )
    );
  };
  const partner = (channel: string): string | null => {
    const other = channel.endsWith("Left")
      ? channel.replace(/Left$/u, "Right")
      : channel.endsWith("Right")
        ? channel.replace(/Right$/u, "Left")
        : null;
    return other !== null && other in calibration ? other : null;
  };
  return Object.keys(calibration).filter((channel) => {
    const pair = [channel, partner(channel)].filter(
      (one): one is string => one !== null,
    );
    const mean = (f: (one: string) => number) =>
      pair.reduce((sum, one) => sum + f(one), 0) / pair.length;
    return mean(span) >= mean(spread) && mean(span) > 0;
  });
}
