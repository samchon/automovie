import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";

import { boutCacheInterval } from "./boutCacheInterval";

/** Index actual foot/floor measurements by their containing cache interval. A solver episode's positive aggregate cannot establish an impulse at every intervening second; only its positive samples or an instantaneous positive receipt supply that association. */
export function boutFootfallObservations(
  contacts: readonly Receipt[],
  actor: string,
  bones: readonly string[],
  startSeconds: number,
  rate: number,
): {
  samples: { solver: Set<number>; geometric: Set<number> };
  positive: Map<number, { seconds: number; receipt: string }[]>;
  geometry: Map<number, { seconds: number; receipt: string }[]>;
} {
  const receipts: Receipt[] = contacts.filter(
    (receipt: Receipt): boolean =>
      (receipt.a.body === actor &&
        receipt.b.body === "floor" &&
        bones.includes(receipt.a.bone)) ||
      (receipt.b.body === actor &&
        receipt.a.body === "floor" &&
        bones.includes(receipt.b.bone)),
  );
  const samples: { solver: Set<number>; geometric: Set<number> } = {
    solver: new Set(),
    geometric: new Set(),
  };
  const positive: Map<number, { seconds: number; receipt: string }[]> =
    new Map();
  const geometry: Map<number, { seconds: number; receipt: string }[]> =
    new Map();
  /** Retain the actual measurement timestamp independently from its enclosing frame. */
  function append(seconds: number, receipt: string): void {
    const frame: number = boutCacheInterval(seconds, startSeconds, rate);
    samples.solver.add(frame);
    const values: { seconds: number; receipt: string }[] =
      positive.get(frame) ?? [];
    values.push({ seconds, receipt });
    positive.set(frame, values);
  }
  for (const receipt of receipts) {
    if (receipt.source === "solver") {
      if (receipt.samples)
        for (const sample of receipt.samples) {
          if (sample.impulse > 0 && sample.separation <= 0)
            append(sample.seconds, receipt.id);
        }
      else if (
        receipt.seconds === receipt.endSeconds &&
        (receipt.impulse ?? 0) > 0 &&
        receipt.separation <= 0
      )
        append(receipt.seconds, receipt.id);
    } else if (receipt.separation <= 0) {
      for (
        let frame: number = boutCacheInterval(
          receipt.seconds,
          startSeconds,
          rate,
        );
        frame <= boutCacheInterval(receipt.endSeconds, startSeconds, rate);
        frame++
      ) {
        samples.geometric.add(frame);
        const values: { seconds: number; receipt: string }[] =
          geometry.get(frame) ?? [];

        // An episode starts at its actual observation, even inside a cache bin.
        values.push({
          seconds:
            frame === boutCacheInterval(receipt.seconds, startSeconds, rate)
              ? receipt.seconds
              : Math.min(receipt.endSeconds, startSeconds + frame / rate),
          receipt: receipt.id,
        });
        geometry.set(frame, values);
      }
    }
  }
  return { samples, positive, geometry };
}
