import { type IAutoMovieChannel } from "@automovie/interface";

import { type IAutoMovieSampledChannel } from "../../../../packages/engine/src/resolve/IAutoMovieSampledChannel";

/** Box supplied channel/value tuples into the existing sampled-map fixture, borrowing the records and arrays without validating them. */
export function createDriverSamples(
  entries: [string, IAutoMovieChannel, number[]][],
): Map<string, IAutoMovieSampledChannel> {
  return new Map(entries.map(([key, channel, value]: [string, IAutoMovieChannel, number[]]): [string, IAutoMovieSampledChannel] => [key, { channel, value }]));
}
