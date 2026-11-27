import * as fs from "node:fs/promises";
import * as path from "node:path";

import { readErrorCode } from "../../file/internal/readErrorCode";

/*
 * The publish lock of one render output folder: a `.render-publish` directory
 * holding exactly one process ticket, installed by an atomic rename, so two
 * renders never publish into one folder at once.
 *
 * A reservation left by a process the operating system confirms is gone is
 * reclaimed; a live or unreadable owner refuses the second render.
 */
export class AutoMovieRenderOutputReservation {
  /*
   * Claims a destination with an atomically installed process ticket.
   */
  public static async reserve(
    staging: string,
    reservation: string,
    out: string,
  ): Promise<string> {
    const pending: string = path.join(staging, "reservation");
    const ticket: string =
      "owner-" + process.pid + "-" + path.basename(staging);
    await fs.mkdir(pending);
    await fs.writeFile(path.join(pending, ticket), "");
    // Bound the number of races with another failed or completing reservation.
    for (let pass: number = 0; pass < 4; pass++) {
      try {
        await fs.rename(pending, reservation);
        return ticket;
      } catch (cause) {
        const entries: string[] = await fs
          .readdir(reservation)
          .catch((error: unknown): string[] => {
            if (readErrorCode(error) !== "ENOENT") throw cause;
            return [];
          });
        const owner: string | undefined =
          entries.length === 1 ? entries[0] : undefined;
        const pid: number = Number(
          /^owner-(\d+)-\.render-[a-z0-9]+$/iu.exec(owner ?? "")?.[1],
        );
        if (
          entries.length !== 0 &&
          (!Number.isSafeInteger(pid) ||
            pid < 1 ||
            AutoMovieRenderOutputReservation.processAlive(pid))
        )
          throw new Error("Another render has reserved " + out, { cause });
        if (owner !== undefined)
          await AutoMovieRenderOutputReservation.release(reservation, owner);
        else await AutoMovieRenderOutputReservation.removeEmpty(reservation);
      }
    }
    throw new Error(
      "Could not reserve " +
        out +
        " while another render changed its reservation",
    );
  }

  /*
   * Removes the exact process ticket and only an empty reservation directory.
   */
  public static async release(
    reservation: string,
    ticket: string,
  ): Promise<void> {
    await fs
      .unlink(path.join(reservation, ticket))
      .catch((error: unknown): void => {
        if (readErrorCode(error) !== "ENOENT") throw error;
      });
    await AutoMovieRenderOutputReservation.removeEmpty(reservation);
  }

  /*
   * Treats a process as gone only when the operating system confirms it.
   */
  private static processAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (cause) {
      return !(
        cause instanceof Error &&
        "code" in cause &&
        cause.code === "ESRCH"
      );
    }
  }

  /*
   * A later invocation may already have installed its own ticket.
   */
  private static async removeEmpty(reservation: string): Promise<void> {
    await fs.rmdir(reservation).catch((error: unknown): void => {
      const code: unknown = readErrorCode(error);
      if (code !== "ENOENT" && code !== "ENOTEMPTY" && code !== "EEXIST")
        throw error;
    });
  }
}
