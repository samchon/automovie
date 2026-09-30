import fs from "node:fs";
import path from "node:path";

import { openReviewEditor } from "../review/openReviewEditor";
import { reviewFileName } from "../review/reviewFileName";
import type { IBodyObservationFrame } from "./IBodyObservationFrame";

type Editor = Awaited<ReturnType<typeof openReviewEditor>>;
type Hooks = Record<
  string,
  {
    document: () => object;
    change: (value: object) => unknown;
    snapshot: () =>
      | {
          status?: string;
          error?: string | null;
          document: { id: string };
        }
      | undefined;
    view: (name: string) => void;
    pass: (name: string) => void;
    isolate: (names: string[] | null) => string[];
    companion: () => Promise<void>;
    finish: () => void;
  }
>;

/**
 * Draw the requested frames of the product body editor, applying each state
 * once for the run of frames that share it, and write the PNGs.
 *
 * A state is applied through the page's own `change`, the transaction a slider
 * commits, and its frames are drawn through the observation hooks (`view`,
 * `pass`, `isolate`, then `finish`) and read from the canvas as PNG. A
 * document the editor refuses leaves the previous one applied, so the wait
 * ends on the editor's error as well as on a built document. With
 * `onRefused: "throw"` the refusal stops the run with its text; with
 * `"record"` the state's remaining frames are skipped and the refusal is
 * returned with the state name, so an extreme the validator still refuses is
 * visible in the record instead of hanging the run or vanishing.
 *
 * Frame files are named from the state, the view and the pass, with the
 * isolated parts in the state so an isolated and an assembled frame of the
 * same state never share a file. Frames are returned in the order drawn with
 * their bytes; the caller builds the record from them. The caller owns the
 * editor and closes it.
 *
 * @param input The open editor, the frames in drawing order, the output
 * directory, and how a refusal is handled.
 */
export async function captureBodyFrames(input: {
  editor: Editor;
  frames: readonly IBodyObservationFrame[];
  output: string;
  onRefused: "throw" | "record";
}): Promise<{
  drawn: {
    state: string;
    view: string;
    pass: string;
    file: string;
    bytes: Buffer;
    isolate: string[] | null;
  }[];
  refused: { state: string; reason: string }[];
}> {
  const { editor, output } = input;
  const { page, hook, canvas } = editor;
  fs.mkdirSync(output, { recursive: true });
  const base = await page.evaluate(
    (name) => (window as unknown as Hooks)[name].document(),
    hook,
  );
  const drawn: Awaited<ReturnType<typeof captureBodyFrames>>["drawn"] = [];
  const refused: { state: string; reason: string }[] = [];
  let applied: string | null = null;
  let skip: string | null = null;
  for (const frame of input.frames) {
    const key = JSON.stringify([frame.state, frame.document]);
    if (key === skip) continue;
    if (key !== applied) {
      await page.evaluate(
        ([name, document]) =>
          (window as unknown as Hooks)[name as string].change(
            document as object,
          ),
        [
          hook,
          { ...base, id: frame.state, name: frame.state, ...frame.document },
        ],
      );
      await page.waitForFunction(
        ([name, id]) => {
          const snapshot = (window as unknown as Hooks)[
            name as string
          ].snapshot();
          return (
            snapshot !== undefined &&
            ((snapshot.status === "ready" && snapshot.document.id === id) ||
              (snapshot.error !== undefined && snapshot.error !== null))
          );
        },
        [hook, frame.state],
        { timeout: 300000 },
      );
      const reason = await page.evaluate(
        (name) => (window as unknown as Hooks)[name].snapshot()?.error ?? null,
        hook,
      );
      applied = key;
      // the face beside the body is seated asynchronously; a frame taken
      // before it arrives would show a different figure than the next one
      await page.evaluate(
        (name) => (window as unknown as Hooks)[name].companion(),
        hook,
      );
      if (reason !== null) {
        if (input.onRefused === "throw")
          throw new Error(
            `The editor refused state "${frame.state}": ${reason}`,
          );
        refused.push({ state: frame.state, reason });
        skip = key;
        continue;
      }
    }
    const shot = await page.evaluate(
      ([name, view, pass, isolate, selector]) => {
        const hooks = (window as unknown as Hooks)[name as string];
        const unmatched = hooks.isolate(isolate as string[] | null);
        hooks.view(view as string);
        hooks.pass(pass as string);
        hooks.finish();
        return {
          unmatched,
          url: (
            document.querySelector(selector as string) as HTMLCanvasElement
          ).toDataURL("image/png"),
        };
      },
      [hook, frame.view, frame.pass, frame.isolate, canvas] as [
        string,
        string,
        string,
        string[] | null,
        string,
      ],
    );
    // a name no displayed part carries would draw an empty frame and record it
    if (shot.unmatched.length !== 0)
      throw new Error(
        `No displayed part is named ${shot.unmatched.join(", ")}; isolating it would draw a blank frame.`,
      );
    const bytes = Buffer.from(
      shot.url.slice(shot.url.indexOf(",") + 1),
      "base64",
    );
    const state =
      frame.isolate === null
        ? frame.state
        : `${frame.state}-only-${frame.isolate.join("-")}`;
    const file = reviewFileName({ state, view: frame.view, pass: frame.pass });
    fs.writeFileSync(path.join(output, file), bytes);
    drawn.push({
      state,
      view: frame.view,
      pass: frame.pass,
      file,
      bytes,
      isolate: frame.isolate,
    });
  }
  await page.evaluate((name) => {
    const hooks = (window as unknown as Hooks)[name];
    hooks.isolate(null);
    hooks.pass("beauty");
  }, hook);
  return { drawn, refused };
}
