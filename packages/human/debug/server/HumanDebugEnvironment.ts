import path from "node:path";

import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import type { IHumanDebugEnvironment } from "./IHumanDebugEnvironment";

/**
 * Read the viewer server's environment once into a typed record.
 *
 * Every default lives here. Paths derive from the package directory, the directory holding
 * `vite.config.ts`: evidence goes under the package's ignored `.shots` folder, and the people are
 * the typed parameters of the playground package beside it.
 *
 * - `AUTOMOVIE_HUMAN_PORT`: port, 1024 to 65535; default `HUMAN_DEBUG_ROUTES.port`.
 * - `AUTOMOVIE_HUMAN_CHECK_LOG`: the `ttsc --watch` log the compiler route reads.
 * - `AUTOMOVIE_HUMAN_SLOTS`: concurrent person generations on the machine, default 2.
 * - `AUTOMOVIE_HUMAN_SLOT_ROOT`: directory of the generation slots.
 *
 * @param directory The package directory.
 * @returns The environment; an invalid value throws naming the variable.
 */
export function HumanDebugEnvironment(directory: string): IHumanDebugEnvironment {
  const port: number = Number(process.env.AUTOMOVIE_HUMAN_PORT ?? HUMAN_DEBUG_ROUTES.port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("AUTOMOVIE_HUMAN_PORT must be an integer port from 1024 to 65535");
  const slots: number = Number(process.env.AUTOMOVIE_HUMAN_SLOTS ?? 2);
  if (!Number.isInteger(slots) || slots < 1)
    throw new Error("AUTOMOVIE_HUMAN_SLOTS must be a positive integer");
  const shots: string = path.join(directory, ".shots");
  return {
    directory,
    repository: path.resolve(directory, "../.."),
    people: path.resolve(directory, "../playground/src/human-parameters"),
    port,
    checkLog: process.env.AUTOMOVIE_HUMAN_CHECK_LOG ?? path.join(shots, "debug", "ttsc-debug-watch.log"),
    slots,
    slotRoot: process.env.AUTOMOVIE_HUMAN_SLOT_ROOT ?? path.join(shots, "locks", "generation"),
    evidence: path.join(shots, "debug"),
  };
}
