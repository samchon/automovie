import { IAutoMovieCopyDriver, IAutoMovieDrivenDriver } from "@automovie/interface";

import { channelKey } from "./channelKey";

type ValueDriver = IAutoMovieCopyDriver | IAutoMovieDrivenDriver;

/**
 * Order value drivers by channel dependencies with the existing DFS tie order.
 *
 * @evidence contracts/common.md#principled-implementation Index producers by exact channel key, collect each driver's other producers and visit dependencies by original driver index; gray DFS nodes refuse cycles and black nodes run once. Self-input is excluded as in the existing one-step driver contract.
 * @evidence contracts/common.md#clear-and-simple-design The channel-space resolver delegates only dependency ordering here; copy/driven evaluation and world-driver deferral stay with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every producing driver of a consumed channel is retained, including duplicate outputs; the numeric dependency sort preserves the old all-pairs scan order rather than choosing a fixture-specific winner.
 * @evidence contracts/common.md#meaningful-documentation Docs identify exact channel keys, self-input policy, stable DFS order, cycle refusal and borrowed driver records; the returned array is fresh and contains each driver once.
 * @evidence contracts/performance.md#efficient-algorithms D drivers have at most three input/output keys each; producer indexing plus E matched dependency edges replaces unrelated all-pairs scans. Deduplication and per-driver dependency sorting cost O(D+E+sum(degree*log degree)); recursive DFS still has O(D) stack-depth limits.
 * @evidence contracts/performance.md#reuse-equivalent-work One producer index serves all input lookups and one DFS color array shares completed dependencies across dependents; no graph cache persists across mutable driver fields or order.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output retains D borrowed driver references; producer/dependency/color maps are call-local and no sampled channel, scene graph, handle or task survives here.
 */
export function orderValueDrivers(drivers: readonly ValueDriver[]): ValueDriver[] {
  const producers: Map<string, number[]> = new Map();
  for (let index: number = 0; index < drivers.length; ++index)
    for (const key of outputsOf(drivers[index]!)) {
      const previous: number[] | undefined = producers.get(key);
      if (previous === undefined) producers.set(key, [index]);
      else previous.push(index);
    }
  const dependencies: number[][] = drivers.map((driver: ValueDriver, index: number): number[] => {
    const required: Set<number> = new Set();
    for (const key of inputsOf(driver))
      for (const producer of producers.get(key) ?? [])
        if (producer !== index) required.add(producer);
    return [...required].sort((left: number, right: number): number => left - right);
  });
  const color: number[] = new Array<number>(drivers.length).fill(0);
  const order: ValueDriver[] = [];
  function visit(index: number): void {
    if (color[index] === 2) return;
    if (color[index] === 1) throw new Error("driver dependency cycle");
    color[index] = 1;
    for (const dependency of dependencies[index]!) visit(dependency);
    color[index] = 2;
    order.push(drivers[index]!);
  }
  for (let index: number = 0; index < drivers.length; ++index) visit(index);
  return order;
}

function trsKeys(node: string, flags: { translation: boolean; rotation: boolean; scale: boolean }): string[] {
  const keys: string[] = [];
  if (flags.translation) keys.push(`node:${node}:translation`);
  if (flags.rotation) keys.push(`node:${node}:rotation`);
  if (flags.scale) keys.push(`node:${node}:scale`);
  return keys;
}

function outputsOf(driver: ValueDriver): string[] {
  return driver.type === "copy" ? trsKeys(driver.owner, driver) : [channelKey(driver.output)];
}

function inputsOf(driver: ValueDriver): string[] {
  return driver.type === "copy" ? trsKeys(driver.source, driver) : [channelKey(driver.source)];
}
