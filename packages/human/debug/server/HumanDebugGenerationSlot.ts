import fs from "node:fs";
import path from "node:path";

/** Milliseconds between attempts while every slot is held. */
const POLL: number = 2000;

/** A slot whose owner file never appeared within this many milliseconds is abandoned. */
const UNOWNED: number = 30_000;

/** A slot held longer than this many milliseconds is reclaimed whatever its owner. */
const STALE: number = 7_200_000;

/**
 * The machine-wide limit on concurrent person generations, shared with every viewer and probe.
 *
 * A slot is a directory `slot-<n>` under the slot root, made atomically with `mkdir`, holding the
 * owner's `owner.json` (PID, label, UTC). A slot whose owner process no longer runs, whose owner
 * file never appeared, or that is older than two hours is reclaimed. `release` frees a slot and a
 * process exit frees what it still holds. The root and count come from `HumanDebugEnvironment`.
 */
export class HumanDebugGenerationSlot {
  /**
   * Hold one slot, waiting while every slot is held.
   *
   * @param root Slot directory.
   * @param count Number of slots.
   * @param label Free text naming the holder in `owner.json`.
   * @returns The held slot; its `release` is idempotent.
   */
  public static async acquire(root: string, count: number, label: string): Promise<HumanDebugGenerationSlot> {
    fs.mkdirSync(root, { recursive: true });
    for (;;) {
      for (let index: number = 0; index < count; ++index) {
        const directory: string = path.join(root, "slot-" + index);
        if (make(directory) || (reclaim(directory) && make(directory))) return new HumanDebugGenerationSlot(directory, label);
      }
      await new Promise<undefined>((resolve: (value: undefined) => void): void => {
        setTimeout(resolve, POLL, undefined);
      });
    }
  }

  /**
   * Current holders, for the status route.
   *
   * @param root Slot directory.
   * @returns One record per slot directory.
   */
  public static holders(root: string): { slot: string; owner: unknown }[] {
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root)
      .filter((name: string): boolean => name.startsWith("slot-"))
      .map((slot: string): { slot: string; owner: unknown } => ({ slot, owner: owner(path.join(root, slot)) ?? null }));
  }

  private released: boolean = false;
  private readonly onExit: () => void = (): void => this.release();

  /**
   * Record ownership of a freshly made slot directory.
   *
   * @param directory The slot directory this process made.
   * @param label Holder label.
   */
  private constructor(
    private readonly directory: string,
    label: string,
  ) {
    fs.writeFileSync(
      path.join(directory, "owner.json"),
      JSON.stringify({ pid: process.pid, label, acquiredUtc: new Date().toISOString() }),
    );
    process.once("exit", this.onExit);
  }

  /** Free the slot when this process still owns it. */
  public release(): void {
    if (this.released) return;
    this.released = true;
    process.off("exit", this.onExit);
    if (owner(this.directory)?.pid !== process.pid) return;
    fs.rmSync(path.join(this.directory, "owner.json"), { force: true });
    vacate(this.directory);
  }
}

/** Make a slot directory atomically; false when it exists. */
function make(directory: string): boolean {
  try {
    fs.mkdirSync(directory);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw error;
  }
}

/** Remove a slot whose owner is gone; true when it is free afterwards. */
function reclaim(directory: string): boolean {
  let age: number;
  try {
    age = Date.now() - fs.statSync(directory).mtimeMs;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT";
  }
  const held: { pid?: number; acquiredUtc?: string } | undefined = owner(directory);
  const acquired: number = held?.acquiredUtc === undefined ? NaN : Date.parse(held.acquiredUtc);
  const stale: boolean =
    held === undefined ? age > UNOWNED : !alive(held.pid) || (Number.isFinite(acquired) && Date.now() - acquired > STALE);
  if (!stale) return false;
  fs.rmSync(path.join(directory, "owner.json"), { force: true });
  return vacate(directory);
}

/** Remove an emptied slot directory; false while another process still uses it. */
function vacate(directory: string): boolean {
  try {
    fs.rmdirSync(directory);
    return true;
  } catch (error) {
    const code: string | undefined = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return true;
    if (code === "ENOTEMPTY" || code === "EBUSY" || code === "EPERM") return false;
    throw error;
  }
}

/** A slot's owner record; undefined while absent or partly written. */
function owner(directory: string): { pid?: number; acquiredUtc?: string } | undefined {
  const file: string = path.join(directory, "owner.json");
  if (!fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
}

/** Whether a PID names a running process. */
function alive(pid: number | undefined): boolean {
  if (pid === undefined || !Number.isInteger(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}
