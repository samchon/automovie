import { link, mkdtemp, open, rmdir, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Publish one admitted artifact as complete JSON at an unused destination.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is committed and that the destination must be unused.
 * @evidence contracts/development/implementation.md#principled-implementation Stages the serialized artifact on the destination volume and links it in one exclusive operation after sync and close. Never truncates an existing take and does not fall back to a partial direct write.
 * @evidence contracts/development/implementation.md#efficient-algorithms Serialization, temporary write and publication have distinct steps with local cleanup. Serializes and writes the artifact once without copying it again during publication. Each call must commit the given artifact to a distinct destination. Closes the write handle and cleans up the file and directory owned by this invocation.
 */
export async function writeMotionTakeArtifact(
  destination: string,
  value: object,
): Promise<void> {
  const text: string = `${JSON.stringify(value, null, 2)}\n`;
  const staging: string = await mkdtemp(
    path.join(path.dirname(destination), ".motion-take-"),
  );
  const temporary: string = path.join(staging, "take.json");
  try {
    const handle: Awaited<ReturnType<typeof open>> = await open(
      temporary,
      "wx",
    );
    try {
      await handle.writeFile(text, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }

    // A link publishes the whole file and refuses any existing directory entry.
    await link(temporary, destination);
  } finally {
    await unlink(temporary).catch((error: NodeJS.ErrnoException): void => {
      if (error.code !== "ENOENT") throw error;
    });
    await rmdir(staging);
  }
}
