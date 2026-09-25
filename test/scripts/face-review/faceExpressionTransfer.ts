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
 * score, and that increment curve is shared by every subject. A unit with a
 * partner on the other side is rendered with it (`faceExpressionPartner`,
 * `faceExpressionCalibrationDocuments`), each reading its own score: the
 * detector reads one side of a face against the other, so a side acting
 * alone reads weaker than the same side acting with its partner, which is
 * how a face moves and how the photographs show it. A subject's
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
 * instrument cannot carry across is not guessed. A unit and its partner are
 * judged as one pair on their mean span and spread, so the identity's
 * expression is never lateralised by the test itself. An increment
 * beyond the curve's end is held at weight one and reported, and a negative
 * increment (the photograph reads less of a unit than the identity at rest)
 * is weight zero, because the channels are one-sided.
 *
 * An increment is evidence of expression only beyond what identity alone
 * moves the reading. The rest renders of the population's documents read
 * each unit with a spread across identities (`noise`, their standard
 * deviation); the photograph's reading of its own face differs from its
 * model's rest reading by an identity mismatch of that order, so an
 * increment under twice that deviation (the 95% band) is indistinct from it
 * and transfers nothing. A unit and its partner are judged together: the
 * pair transfers, each side its own reading, when either side stands out,
 * so the bound neither lateralises a symmetric expression nor erases a wink
 * whose other side is still. Without that bound the calibration's flat low end
 * turned detector noise into weight: a mouth shift read at 0.002 over rest,
 * a third of the rest readings' deviation, became 0.14 of the channel.
 *
 * Pure: reads caller-owned values and returns new ones.
 */

/**
 * Each unit's reading deviation across a population's rest renders (the
 * sample standard deviation), for `transferFaceExpression`'s `noise`.
 */
export function faceExpressionRestNoise(
  rests: readonly Readonly<Record<string, number>>[],
): Record<string, number> {
  const units = new Set(rests.flatMap((one) => Object.keys(one)));
  return Object.fromEntries(
    [...units].map((unit) => {
      const values = rests.flatMap((one) =>
        one[unit] === undefined ? [] : [one[unit]!],
      );
      if (values.length < 2) return [unit, 0];
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      return [
        unit,
        Math.sqrt(
          values.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
            (values.length - 1),
        ),
      ];
    }),
  );
}

/** One channel's calibration: its own score at increasing weights. */
export interface IFaceExpressionCalibration {
  weights: readonly number[];
  scores: readonly (number | null)[];
}

/** One channel's transferred weight and how it was obtained. */
export interface IFaceExpressionTransferRow {
  channel: string;
  weight: number;
  status: "transferred" | "held" | "unobservable" | "absent" | "indistinct";
}

export function transferFaceExpression(props: {
  calibration: Readonly<Record<string, IFaceExpressionCalibration>>;
  observable: readonly string[];
  photo: Readonly<Record<string, number>>;
  rest: Readonly<Record<string, number>>;
  /** Each unit's rest-reading deviation across the population's renders. */
  noise?: Readonly<Record<string, number>>;
}): IFaceExpressionTransferRow[] {
  const units = Object.keys(props.calibration);
  // Whether a unit, or its partner, stands out from the spread identity
  // alone gives the rest readings: a pair transfers together, each side its
  // own reading, when either side does.
  const distinct = (channel: string): boolean => {
    const partner = faceExpressionPartner(channel, units);
    const group = partner === null ? [channel] : [channel, partner];
    return group.some((one) => {
      const score = props.photo[one];
      const rest = props.rest[one];
      return (
        score === undefined ||
        rest === undefined ||
        score - rest >= 2 * (props.noise?.[one] ?? 0)
      );
    });
  };
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
    if (!distinct(channel))
      return { channel, weight: 0, status: "indistinct" as const };
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
 * scores (see `transferFaceExpression`); a channel and its partner
 * (`faceExpressionPartner`) are judged on their mean span and mean spread
 * and pass or fail together.
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
  const channels = Object.keys(calibration);
  return channels.filter((channel) => {
    const pair = [channel, faceExpressionPartner(channel, channels)].filter(
      (one): one is string => one !== null,
    );
    const mean = (f: (one: string) => number) =>
      pair.reduce((sum, one) => sum + f(one), 0) / pair.length;
    return mean(span) >= mean(spread) && mean(span) > 0;
  });
}

/**
 * The calibration documents of the reference head: `cal-rest` with no
 * expression, and for every expression channel one document per weight,
 * `cal-<channel>-<percent>`, setting the channel and, when it has one
 * (`faceExpressionPartner`), its partner at the same weight (see
 * `transferFaceExpression`).
 */
export function faceExpressionCalibrationDocuments(props: {
  basis: string;
  channels: readonly string[];
  weights: readonly number[];
}): {
  id: string;
  name: string;
  basis: string;
  shape: Record<string, number>;
  expression: Record<string, number>;
}[] {
  const document = (name: string, expression: Record<string, number>) => ({
    id: `${name}-connected`,
    name,
    basis: props.basis,
    shape: {},
    expression,
  });
  return [
    document("cal-rest", {}),
    ...props.channels.flatMap((channel) =>
      props.weights.map((weight) => {
        if (!(weight > 0 && weight <= 1))
          throw new Error("A calibration weight lies in (0, 1].");
        const other = faceExpressionPartner(channel, props.channels);
        return document(
          `cal-${channel}-${String(Math.round(weight * 100)).padStart(3, "0")}`,
          {
            [channel]: weight,
            ...(other === null ? {} : { [other]: weight }),
          },
        );
      }),
    ),
  ];
}

/**
 * The unit a face moves together with `channel` on the other side, among
 * `channels`, by the ARKit face-unit names the basis uses: the same muscle
 * on the other side (`mouthSmileLeft` with `mouthSmileRight`), and for the
 * eyes the conjugate gaze, since both eyes turn one way (`eyeLookInLeft` with
 * `eyeLookOutRight`; up and down pair by side). `mouthLeft`, `mouthRight`,
 * `jawLeft` and `jawRight` name directions of one midline part, not sides,
 * so they have none, nor does a unit whose partner the basis lacks.
 */
export function faceExpressionPartner(
  channel: string,
  channels: readonly string[],
): string | null {
  const match = /^(.+?)(Left|Right)$/u.exec(channel);
  if (match === null || match[1] === "mouth" || match[1] === "jaw") return null;
  const side = match[2] === "Left" ? "Right" : "Left";
  const gaze = /^eyeLook(In|Out)$/u.exec(match[1]!);
  const other =
    gaze === null
      ? `${match[1]}${side}`
      : `eyeLook${gaze[1] === "In" ? "Out" : "In"}${side}`;
  return channels.includes(other) ? other : null;
}
