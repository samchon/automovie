import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { subscribeHumanViewerSources } from "../../../scripts/human-viewer/subscribeHumanViewerSources";

/**
 * Source publication coalesces reached edits and keeps local inputs distinct.
 *
 * Scenarios:
 * 1. Unread files are ignored and local input edits rescan without a source batch.
 * 2. Repeated reached edits coalesce in order, refresh basis authority first,
 *    publish only changed generations and notify browser only when it moved.
 * 3. A failed refresh reports its cause and clears updating; disposal cancels
 *    pending work, including the production scheduler's cancellable timer.
 */
export const test_human_viewer_source_subscription = (): void => {
  const root = path.resolve("source-subscription-inputs");
  const input = path.join(root, "local");
  const face = path.join(root, "face.gz"), body = path.join(root, "body.gz");
  const module = path.join(root, "read.ts");
  let watch: (event: string, file: string) => void = () => {};
  let run: () => void = () => {};
  let cancels = 0, rescans = 0, browsers = 0;
  let fail = false;
  let failInputs = false;
  let moved: string[] = ["browser", "face"];
  const order: string[] = [];
  const updates: boolean[] = [];
  const errors: unknown[] = [];
  const published: string[][] = [];
  const props: Parameters<typeof subscribeHumanViewerSources>[0] = {
    source: { inputsDirectory: input, watched: [module], basisFiles: { face, body },
      documentsFile: path.join(root, "documents.json"), slash: (file) => file.replaceAll("\\", "/"),
      refreshBases: () => { order.push("bases"); if (fail) throw new Error("broken basis"); },
      revisions: { reaches: (file) => file === module.replaceAll("\\", "/"),
        changed: () => { order.push("revisions"); return { moved }; } },
    },
    add: (files) => { TestValidator.equals("watched inputs", files,
      [input, module, face, body, path.join(root, "documents.json")]); },
    watch: (handler) => { watch = handler; }, inputs: () => {
      if (failInputs) throw new Error("broken input catalogue");
      ++rescans;
    },
    publish: (files) => { order.push("publish"); published.push(files); },
    updating: (value) => { updates.push(value); }, browser: () => { ++browsers; },
    error: (error) => { errors.push(error); },
    schedule: (callback) => { run = callback; return () => { ++cancels; }; },
  };
  const stop = subscribeHumanViewerSources(props);
  watch("change", path.join(root, "unread.ts"));
  TestValidator.equals("unread ignored", updates, []);
  watch("change", path.join(input, "draft.json"));
  TestValidator.equals("local rescan", rescans, 1);
  failInputs = true;
  watch("change", path.join(input, "draft.json"));
  TestValidator.equals("input rescan error reported", errors.length, 1);
  failInputs = false;
  watch("change", module); watch("change", face); watch("change", module);
  run();
  TestValidator.equals("one ordered batch", published[0], [module, face]);
  TestValidator.equals("authority before publication", order, ["bases", "revisions", "publish"]);
  TestValidator.equals("browser notification", browsers, 1);
  moved = [];
  watch("change", body); run();
  TestValidator.equals("unchanged generation not published", published.length, 1);
  moved = ["body"];
  watch("change", props.source.documentsFile); run();
  TestValidator.equals("body publication", published.length, 2);
  TestValidator.equals("body does not reload browser", browsers, 1);
  fail = true;
  watch("change", module); run();
  TestValidator.equals("refresh error reported", errors.length, 2);
  TestValidator.equals("failed update released", updates[updates.length - 1], false);
  stop();
  TestValidator.predicate("batch timers cancelled", cancels > 0);
  const productionTimer = subscribeHumanViewerSources({ ...props, schedule: undefined });
  watch("change", module);
  productionTimer();
};
