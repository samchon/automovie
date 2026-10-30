import { parentPort } from "node:worker_threads";

import type { HumanImageProcess } from "./HumanImageProcess.ts";

/** Serve the original lifecycle worker's private parent-port commands.
 *
 * @evidence contracts/common.md#principled-implementation Dispatches the original start/request/close operations to the supplied process owner; publication path is read only after that same owner's start completes.
 * @evidence contracts/common.md#clear-and-simple-design This listener owns lifecycle IPC dispatch, while Process owns its child and temporary directory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuses the supplied owner and original command IDs without acquiring another child or substituting failed output.
 * @evidence contracts/common.md#meaningful-documentation The caller installs this only inside the existing lifecycle Worker and supplies its exact owned publication path.
 * @evidence contracts/performance.md#efficient-algorithms One listener routes fixed control records and existing command results; no geometry processing is introduced.
 * @evidence contracts/performance.md#reuse-equivalent-work Every operation reaches the same process owner and its shared startup/close promises.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The existing parent port and owner remain borrowed; successful close sends its original result before closing the port, while failures retain uncertain owner state.
 */
export function serveHumanImageLifecycle(
  owner: HumanImageProcess,
  publicationPath: () => string,
): void {
  parentPort!.on("message", (message: unknown): void => {
    const command: {
      id: number;
      operation: string;
      value: Record<string, unknown>;
    } = message as typeof command;
    const run: () => Promise<void> = async (): Promise<void> => {
      if (!command || !Number.isSafeInteger(command.id))
        throw new Error("Malformed Human lifecycle command");
      let result: Record<string, unknown>;
      if (command.operation === "start") {
        await owner.start(String(command.value.root));
        result = {
          path: publicationPath(),
        };
      } else if (command.operation === "request")
        result = await owner.request(command.value);
      else if (command.operation === "close") {
        await owner.close();
        result = {};
      } else throw new Error("Unknown Human lifecycle operation");
      parentPort!.postMessage({
        id: command.id,
        result,
        active: owner.isActive(),
      });
      if (command.operation === "close") parentPort!.close();
    };
    void run().catch((error: unknown): void => {
      parentPort!.postMessage({
        id: command?.id,
        error: error instanceof Error ? error.message : String(error),
        active: owner.isActive(),
      });
    });
  });

}
