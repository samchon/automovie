import type { IAutoMovieValueDriver } from "@automovie/interface";

import { channelKey } from "./channelKey";

/** Order value drivers by channel dependencies with the existing DFS tie order. */
export function orderValueDrivers(
  drivers: readonly IAutoMovieValueDriver[],
): IAutoMovieValueDriver[] {
  const producers: Map<string, number[]> = new Map();
  for (let index: number = 0; index < drivers.length; ++index)
    for (const key of outputsOf(drivers[index]!)) {
      const previous: number[] | undefined = producers.get(key);
      if (previous === undefined) producers.set(key, [index]);
      else previous.push(index);
    }
  const dependencies: number[][] = drivers.map(
    (driver: IAutoMovieValueDriver, index: number): number[] => {
      const required: Set<number> = new Set();
      for (const key of inputsOf(driver))
        for (const producer of producers.get(key) ?? [])
          if (producer !== index) required.add(producer);
      return [...required].sort(
        (left: number, right: number): number => left - right,
      );
    },
  );
  const color: number[] = new Array<number>(drivers.length).fill(0);
  const order: IAutoMovieValueDriver[] = [];
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

function trsKeys(
  node: string,
  flags: { translation: boolean; rotation: boolean; scale: boolean },
): string[] {
  const keys: string[] = [];
  if (flags.translation) keys.push(`node:${node}:translation`);
  if (flags.rotation) keys.push(`node:${node}:rotation`);
  if (flags.scale) keys.push(`node:${node}:scale`);
  return keys;
}

function outputsOf(driver: IAutoMovieValueDriver): string[] {
  return driver.type === "copy"
    ? trsKeys(driver.owner, driver)
    : [channelKey(driver.output)];
}

function inputsOf(driver: IAutoMovieValueDriver): string[] {
  return driver.type === "copy"
    ? trsKeys(driver.source, driver)
    : [channelKey(driver.source)];
}
