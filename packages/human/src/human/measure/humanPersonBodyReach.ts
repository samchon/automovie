import { humanBodyChannelReach } from "../../body/measure/humanBodyChannelReach";
import type { IAutoMovieHumanPersonBodyReach } from "../structures/IAutoMovieHumanPersonBodyReach";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";

/**
 * Read the body domain of a paired head/body evaluator from its real endpoint
 * dependencies. A body channel side supplies its absolute weight to the head's
 * driver of that endpoint, so both supports must contain each trial. Body
 * unavailable endpoints and corrective onsets remain owned by
 * `humanBodyChannelReach`. The original views and their authoring domains stay
 * unchanged; this copied basis is for solves that evaluate the whole person.
 *
 * Independent channel intervals apply only when a driven endpoint has one
 * channel-side owner or corrective-only contributions whose summed authored
 * upper bounds fit the head driver. Body corrective factors and normalization
 * never exceed one, so their authored weights bound those contributions.
 * A shared channel/corrective endpoint, repeated channel owner, or a corrective
 * sum requiring a coupled head constraint refuses by endpoint instead of being
 * represented by an invented axis envelope. A missing, non-shape or non-neutral
 * head driver also refuses. No gain is clipped and no endpoint is removed.
 */
export function humanPersonBodyReach(
  generation: Pick<
    IAutoMovieHumanPersonGeneration,
    "body" | "face" | "drivers"
  >,
): IAutoMovieHumanPersonBodyReach {
  const { body, face } = generation;
  const unavailable = new Set(body.unavailableTargets ?? []);
  const missing = body.channels.filter(
    (channel) =>
      unavailable.has(channel.positive) ||
      (channel.negative !== null && unavailable.has(channel.negative)),
  );
  const limits = new Map<string, string[]>();
  const channels = body.channels
    .filter((channel) => !missing.includes(channel))
    .map((channel) => {
      const reach = humanBodyChannelReach(body, channel);
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
    const head = face.channels.find((channel) => channel.id === driver.channel);
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
    const owners = body.channels.filter(
      (channel) =>
        channel.positive === driver.endpoint ||
        channel.negative === driver.endpoint,
    );
    const correctives = (body.correctives ?? []).filter(
      (corrective) => corrective.target === driver.endpoint,
    );
    if (
      correctives.some(
        (corrective) =>
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
      owners.some((channel) => channel.positive === channel.negative) ||
      (owners.length !== 0 && correctives.length !== 0) ||
      correctives.reduce((sum, corrective) => sum + corrective.weight, 0) >
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
      const positive = channel.positive === driver.endpoint;
      const negative = channel.negative === driver.endpoint;
      if (!positive && !negative) continue;
      const bound = positive
        ? Math.min(channel.maximum, head.maximum)
        : Math.max(channel.minimum, -head.maximum);
      if (bound === (positive ? channel.maximum : channel.minimum)) continue;
      if (positive) channel.maximum = bound;
      else channel.minimum = bound;
      const reasons = limits.get(channel.id) ?? [];
      reasons.push(
        `${positive ? "Above" : "Below"} weight ${bound} the head driver ${driver.channel} of ${driver.endpoint} exceeds its source support [${head.minimum}, ${head.maximum}].`,
      );
      limits.set(channel.id, reasons);
    }
  }
  return { basis: { ...body, channels }, missing, limits };
}
