import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

/** Authored builds need no physical cache. Copy complete optional archive pairs and refuse a partially published pair. */
export async function copyBoutPhysicalArchives(
  source: string,
  destination: string,
): Promise<void> {
  for (const basename of ["bout", "kinematic"]) {
    const names: string[] = [`${basename}.amphys`, `${basename}.amphys.json`];
    const present: boolean[] = await Promise.all(
      names.map(async (name: string): Promise<boolean> => {
        try {
          return (await stat(path.join(source, name))).isFile();
        } catch (error: unknown) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
          throw error;
        }
      }),
    );
    if (present.every((value: boolean): boolean => !value)) continue;
    if (!present.every(Boolean))
      throw new Error(
        `Incomplete optional physics archive ${basename}: regenerate its binary and manifest together`,
      );
    await mkdir(destination, { recursive: true });
    for (const name of names)
      await copyFile(path.join(source, name), path.join(destination, name));
  }
}
