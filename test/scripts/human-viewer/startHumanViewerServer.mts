import fs from "node:fs";
import path from "node:path";

import type { IStartHumanViewerServerProps } from "./IStartHumanViewerServerProps";
import { createHumanViewerViteServer } from "./createHumanViewerViteServer.mjs";
import { humanViewerLaunch } from "./humanViewerLaunch";
import { judgeViewerRenderer } from "./judgeViewerRenderer";
import { subscribeHumanViewerSources } from "./subscribeHumanViewerSources";
import { writeHumanViewerRecord } from "./writeHumanViewerRecord";

/**
 * Own one server's listening socket, source subscription and shutdown. The
 * launcher retains its public process record; a directly started server owns
 * its own record. Readiness still requires the original hardware predicate.
 *
 * @evidence contracts/common.md#principled-implementation The same ownership record and renderer predicate govern startup and session-owned shutdown.
 * @evidence contracts/common.md#clear-and-simple-design Listening, subscription and shutdown form one lifetime separate from mutable GPU/catalogue state.
 * @evidence contracts/common.md#meaningful-documentation States launcher versus direct ownership and hardware readiness.
 */
export async function startHumanViewerServer(
  props: IStartHumanViewerServerProps,
): Promise<void> {
  const { source, instance, owner } = props;
  const vite = await createHumanViewerViteServer(props.middleware);
  await vite.listen();
  if (owner === null)
    writeHumanViewerRecord(path.join(source.storage, instance.record), instance.port);
  else {
    const address = vite.httpServer?.address();
    if (address === null || address === undefined || typeof address === "string")
      throw new Error("The development server did not report its internal port");
    console.log(humanViewerLaunch.upstreamPrefix + address.port);
  }
  fs.mkdirSync(source.inputsDirectory, { recursive: true });
  const stopSources = subscribeHumanViewerSources({
    ...props.watching,
    source,
    add: (files) => vite.watcher.add(files),
    watch: (changed) => { vite.watcher.on("all", changed); },
    browser: () => vite.ws.send({
      type: "custom", event: "human:revision",
      data: { revision: props.inventory().revision },
    }),
  });
  props.phase("launching the browser");
  void props.openPage().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
  await props.firstReady;
  props.phase("ready");
  if (!judgeViewerRenderer(props.renderer()).real)
    throw new Error("Software renderer refused");
  props.ready();
  const close = async (): Promise<void> => {
    stopSources();
    await props.closeRenderer();
    await vite.close();
    if (owner === null)
      fs.rmSync(path.join(source.storage, instance.record), { force: true });
    process.exit(0);
  };
  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
  console.log("human-viewer ready " + instance.origin + "/view", process.pid);
}
