import type { IAutoMovieContactReceipt } from "@automovie/interface";

import { contactReceiptFault } from "./contactReceiptFault";

/**
 * Admit a contact receipt and return completed measurements no later than the
 * nonnegative film second. The default Infinity reads the whole valid episode.
 * Geometric events carry no solved impulse or completed solver samples. A
 * malformed receipt or cutoff throws before the caller receives any events.
 */
export function samplePhysicalContactEvents(
  receipt: IAutoMovieContactReceipt,
  seconds: number = Infinity,
): IAutoMovieContactReceipt[] {
  if (!(seconds >= 0)) throw new Error("Invalid causal contact event");
  switch (contactReceiptFault(receipt)) {
    case "identity":
      throw new Error("Invalid contact event identity");
    case "episode":
      throw new Error("Invalid causal contact event");
    case "geometric-impulse":
    case "geometric-samples":
      throw new Error("Geometric contact cannot assert solved impulses");
    case "solver-impulse":
      throw new Error("Invalid solver contact impulse");
    case "sample":
      throw new Error("Invalid completed contact sample");
    case null:
      break;
  }

  if (receipt.source === "geometric" || receipt.samples === undefined)
    return receipt.seconds <= seconds ? [receipt] : [];
  const events: IAutoMovieContactReceipt[] = [];
  for (const sample of receipt.samples) {
    if (sample.seconds > seconds) break;
    events.push({
      ...receipt,
      ...sample,
      endSeconds: sample.seconds,
      samples: undefined,
    });
  }
  return events;
}
