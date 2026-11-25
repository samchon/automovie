import fs from "node:fs";
import path from "node:path";

import { repositoryRoot } from "./repositoryRoot";

/**
 * The motions safety net's coverage ledger (`MOTION_HUMAN_LEDGER.json`), read
 * fresh from its authored file on every call: the laws and the parameter rows
 * the law sweeps cover. The file is authored data, kept as written; the parsed
 * value is the declared record, neither cast nor checked, and nothing is kept
 * between calls.
 *
 * @returns The ledger's laws.
 * @throws {Error} When the file does not exist or is not JSON.
 */
export async function motionHumanLedger(): Promise<motionHumanLedger.ILedger> {
  const ledger: motionHumanLedger.ILedger = JSON.parse(
    await fs.promises.readFile(
      path.join(repositoryRoot(), motionHumanLedger.FILE),
      "utf8",
    ),
  );
  return ledger;
}

/** Companion types and constants of {@link motionHumanLedger}. */
export namespace motionHumanLedger {
  /** The ledger's file, relative to the repository root. */
  export const FILE: string =
    "test/src/features/internal/MOTION_HUMAN_LEDGER.json";

  /** What the tests read of the ledger. */
  export interface ILedger {
    /** Every law of the vocabulary. */
    laws: ILaw[];
  }

  /** One law and its rows. */
  export interface ILaw {
    /** The law's registered name. */
    law: string;

    /** Its rows: `default` or `parameter=value`. */
    rows: IRow[];
  }

  /** One row of a law. */
  export interface IRow {
    /** `default` or `parameter=value`. */
    row: string;
  }
}
