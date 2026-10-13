import { humanBodyChannelReach } from "../../body/measure/humanBodyChannelReach";
import type { IAutoMovieHumanPersonBodyReach } from "../structures/IAutoMovieHumanPersonBodyReach";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";

/**
 * Copy a solve-only body basis and intersect channel-side support with its actual head driver. Body channels touching unavailable endpoints are omitted and reported separately; remaining corrective onset/support comes from the body reach owner. Source views and authoring domains stay unchanged.
 *
 * Independent intervals admit one channel-side owner or corrective-only authored gains whose sum fits the head's positive support. Repeated channel owners, mixed channel/corrective ownership, unbounded gains and missing/non-shape/non-neutral head drivers refuse instead of inventing an independent envelope. The head positive bound applies to absolute body-side gain; this is not a general coupled-domain or anatomical reach solver.
 *
 * @evidence contracts/common.md#principled-implementation Actual endpoint ownership and neutral-containing source ranges determine copied solve intervals and their explicit omission/limit explanations.
 * @evidence contracts/common.md#clear-and-simple-design Body onset interpretation remains in humanBodyChannelReach; this adapter adds only paired head ownership/support and returns copied channel records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported coupled gain domains refuse rather than clipping runtime gains, silently modifying source endpoints or certifying clinical reach.
 * @evidence contracts/common.md#meaningful-documentation Prose states unavailable-channel omission, absolute side gains, corrective bounds, source preservation and independent-envelope limits.
 * @evidence contracts/performance.md#efficient-algorithms Each driver scans head channels, body owners/correctives and copied channels; missing-channel membership is a linear array lookup, so cost follows actual driver/channel populations rather than constant lookup claims.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The function derives a fresh solve basis from the supplied source context and owns no cross-call cache; callers may retain the returned basis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned channels, missing list and limit map scale with source channels; temporary owner/corrective arrays are local and no worker or geometry task is acquired.
 */
export function humanPersonBodyReach(
  generation: Pick<
    IAutoMovieHumanPersonGeneration,
    "body" | "face" | "drivers"
  >,
): IAutoMovieHumanPersonBodyReach {
  const { body, face }: typeof generation = generation;
  const unavailable: Set<string> = new Set(body.unavailableTargets ?? []);
  const missing: typeof body.channels = body.channels.filter(
    (channel: (typeof body.channels)[number]): boolean =>
      unavailable.has(channel.positive) ||
      (channel.negative !== null && unavailable.has(channel.negative)),
  );
  const limits: Map<string, string[]> = new Map<string, string[]>();
  const channels: typeof body.channels = body.channels
    .filter((channel: (typeof body.channels)[number]): boolean => !missing.includes(channel))
    .map((channel: (typeof body.channels)[number]): (typeof body.channels)[number] => {
      const reach: ReturnType<typeof humanBodyChannelReach> = humanBodyChannelReach(body, channel);
      if (
        !Number.isFinite(reach.minimum) ||
        !Number.isFinite(reach.maximum) ||
        reach.minimum > 0 ||
        reach.maximum < 0
      )
        throw new Error(
          "A person solve needs finite neutral-containing body support: " +
            channel.id +
            ".",
        );
      if (reach.limits.length !== 0) limits.set(channel.id, [...reach.limits]);
      return { ...channel, minimum: reach.minimum, maximum: reach.maximum };
    });
  for (const driver of generation.drivers ?? []) {
    const head: (typeof face.channels)[number] | undefined = face.channels.find((channel: (typeof face.channels)[number]): boolean => channel.id === driver.channel);
    if (
      head === undefined ||
      head.kind !== "shape" ||
      head.positive !== driver.endpoint ||
      !Number.isFinite(head.minimum) ||
      !Number.isFinite(head.maximum) ||
      head.minimum > 0 ||
      head.maximum < 0
    )
      throw new Error(
        "A person solve needs a neutral-admitting head driver of " +
          driver.endpoint +
          ".",
      );
    const owners: typeof body.channels = body.channels.filter(
      (channel: (typeof body.channels)[number]): boolean =>
        channel.positive === driver.endpoint ||
        channel.negative === driver.endpoint,
    );
    const correctives: NonNullable<typeof body.correctives> = (body.correctives ?? []).filter(
      (corrective: NonNullable<typeof body.correctives>[number]): boolean => corrective.target === driver.endpoint,
    );
    if (
      correctives.some(
        (corrective: NonNullable<typeof body.correctives>[number]): boolean =>
          !Number.isFinite(corrective.weight) ||
          corrective.weight <= 0 ||
          corrective.weight > 1,
      )
    )
      throw new Error(
        "A person solve needs bounded authored corrective gains of " +
          driver.endpoint +
          ".",
      );
    if (
      owners.length > 1 ||
      owners.some((channel: (typeof body.channels)[number]): boolean => channel.positive === channel.negative) ||
      (owners.length !== 0 && correctives.length !== 0) ||
      correctives.reduce((sum: number, corrective: NonNullable<typeof body.correctives>[number]): number => sum + corrective.weight, 0) >
        head.maximum
    )
      throw new Error(
        "The person endpoint " +
          driver.endpoint +
          " needs a coupled gain domain; independent body solve intervals cannot represent its head support.",
      );
    if (owners.length === 0 && correctives.length === 0)
      throw new Error(
        "A person solve needs the body owner of head endpoint " +
          driver.endpoint +
          ".",
      );
    for (const channel of channels) {
      const positive: boolean = channel.positive === driver.endpoint;
      const negative: boolean = channel.negative === driver.endpoint;
      if (!positive && !negative) continue;
      const bound: number = positive
        ? Math.min(channel.maximum, head.maximum)
        : Math.max(channel.minimum, -head.maximum);
      if (bound === (positive ? channel.maximum : channel.minimum)) continue;
      if (positive) channel.maximum = bound;
      else channel.minimum = bound;
      const reasons: string[] = limits.get(channel.id) ?? [];
      reasons.push(
        `${positive ? "Above" : "Below"} weight ${bound} the head driver ${driver.channel} of ${driver.endpoint} exceeds its source support [${head.minimum}, ${head.maximum}].`,
      );
      limits.set(channel.id, reasons);
    }
  }
  return { basis: { ...body, channels }, missing, limits };
}
