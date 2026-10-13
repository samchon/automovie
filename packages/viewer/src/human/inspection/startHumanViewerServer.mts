import fs from "node:fs";
import path from "node:path";

import type { IStartHumanViewerServerProps } from "./IStartHumanViewerServerProps.js";
import { humanViewerLaunch } from "./humanViewerLaunch.js";
import { judgeViewerRenderer } from "./judgeViewerRenderer.js";
import { subscribeHumanViewerSources } from "./subscribeHumanViewerSources.js";
import { writeHumanViewerRecord } from "./writeHumanViewerRecord.js";
import { ProcessOwnership } from "../../process/ProcessOwnership.js";

/**
 * Own one server's listening socket, source subscription and shutdown. The
 * launcher retains its public process record; a directly started server owns
 * its own record. Readiness still requires the original hardware predicate.
 * Only after owning its listening socket does it publish an empty compilation
 * report bound to its actual OS creation. The previous owner's failure or
 * success cannot become this process's startup authority; model inputs, PNGs
 * and historical logs remain separate from this per-owner status.
 */
export async function startHumanViewerServer(
  props: IStartHumanViewerServerProps,
): Promise<void> {
  const { source, instance, owner } = props;
  const vite = await props.createVite();
  await vite.listen();
  const processStartedAt = ProcessOwnership.read(process.pid);
  if (processStartedAt === null)
    throw new Error("The listening viewer has no process creation identity.");
  fs.mkdirSync(source.storage, { recursive: true });
  fs.writeFileSync(path.join(source.storage, instance.sourceStatus), JSON.stringify({
    pid: process.pid, processStartedAt, error: null, goodAt: null,
  }));
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
    browser: props.publishRevision,
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
    if (owner === null)
      fs.rmSync(path.join(source.storage, instance.record), { force: true });
    await vite.close();
    process.exit(0);
  };
  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
  console.log("human-viewer ready " + instance.origin + "/view", process.pid);
}
