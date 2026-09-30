/**
 * Render published face documents through the product face editor on a real
 * GPU and write one PNG per document at its measured camera. Run from the
 * test package with the playground dev server up
 * (`pnpm --filter @automovie/playground dev`):
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/capture-editor-views.ts STUDY OUTPUT POSE_FILE [BASE_URL]
 *
 * `capture-articulation.ts` draws exported meshes with its own lights and
 * materials, which is enough for geometry (landmarks, hair silhouettes) but
 * not for appearance: the editor shows the same builder output through its
 * own stage (a linear display exposed on a grey card, a softbox key, a fill
 * and rim with soft shadows, a hemisphere), transmissive optics and
 * alpha-to-coverage cut-outs. This runner shows each document the way an
 * author does, by writing it into the editor's document field and applying it,
 * then places the display camera with `window.__connectedFace.look` at the
 * pose file's yaw, pitch, distance, target and field of view (28 degrees when
 * omitted), exactly as `capture-articulation.ts` places its own, and reads the
 * canvas pixels after `finish`.
 *
 * The editor is opened by the shared `openReviewEditor`, which refuses a human
 * browser build older than its source, a server that is not the playground and
 * a software renderer, and answers the page's request for its basis with
 * STUDY's `basis.json.gz` so a candidate study renders without replacing the
 * published one (it must keep the published basis identity, and the editor's
 * control map and study list stay the published ones). STUDY also holds
 * `subjects.json`. The canvas is 900 by 900 pixels at device pixel ratio 1. The
 * `RENDERER` string is logged and written into `captures.json` beside each
 * camera, in the format the measurement reads, with the view named
 * `reference-yaw`. With `OCCLUSION=off` in the environment the editor's
 * Occlusion box is cleared before the first document, so every capture is built
 * without its baked ambient occlusion (rounds compared with ones measured
 * before it existed); `captures.json` records which.
 */
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { openReviewEditor } from "../review/openReviewEditor";

type FaceHook = {
  look: (view: {
    position: number[];
    target: number[];
    fov: number;
  }) => void;
  finish: () => void;
  document: () => { id: string } | undefined;
};

async function main(): Promise<void> {
  const [study, output, poseFile, base] = process.argv.slice(2);
  if (study === undefined || output === undefined || poseFile === undefined)
    throw new Error(
      "Supply a study directory, an output directory and a pose file.",
    );
  const documents = JSON.parse(
    fs.readFileSync(path.join(study, "subjects.json"), "utf8"),
  ) as IAutoMovieHumanFaceBasisDocument[];
  const poseBytes = fs.readFileSync(poseFile);
  const poses = JSON.parse(poseBytes.toString("utf8")) as Record<
    string,
    | {
        yaw?: number;
        pitch?: number;
        distance?: number;
        target?: [number, number, number];
        fov?: number;
      }
    | undefined
  >;
  fs.mkdirSync(output, { recursive: true });
  const editor = await openReviewEditor("face", {
    base,
    basisFile: path.join(study, "basis.json.gz"),
  });
  try {
    const { page, renderer } = editor;
    console.log("RENDERER:", renderer);
    const occlusion = process.env.OCCLUSION !== "off";
    if (!occlusion)
      await page.evaluate(() => {
        const box = document.querySelector<HTMLInputElement>("#occlusion");
        if (box !== null) box.checked = false;
      });
    const captures: Record<string, unknown>[] = [];
    const refused: { model: string; reason: string | null }[] = [];
    for (const document_ of documents) {
      const subject = document_.id.replace(/-connected$/u, "");
      const pose = poses[subject];
      if (pose === undefined) continue;
      // The document field sits in a collapsed panel section; writing it and
      // pressing Apply from script runs the same handler an author's click does.
      await page.evaluate((text) => {
        document.querySelector<HTMLTextAreaElement>("#document-json")!.value =
          text;
        document.querySelector<HTMLButtonElement>("#document-apply")!.click();
      }, JSON.stringify(document_));
      await page.waitForFunction(
        (id) => {
          const status = document.querySelector<HTMLElement>("#face-status");
          // A refused document leaves the previous one applied, so an error
          // ends the wait as well as a built document does.
          return (
            status?.dataset.state === "error" ||
            (status?.dataset.state !== "building" &&
              (
                window as unknown as Record<string, FaceHook>
              ).__connectedFace!.document()?.id === id)
          );
        },
        document_.id,
        { timeout: 600_000 },
      );
      const state = await page.evaluate(
        () =>
          document.querySelector<HTMLElement>("#face-status")!.dataset.state,
      );
      if (state === "error") {
        const reason = await page.textContent("#face-status");
        console.error(`${subject} refused: ${reason}`);
        refused.push({ model: subject, reason });
        continue;
      }
      const target = pose.target ?? [0, 0, 0.06];
      const distance = pose.distance ?? 0.62;
      const yaw = ((pose.yaw ?? 0) * Math.PI) / 180;
      const pitch = ((pose.pitch ?? 0) * Math.PI) / 180;
      const camera = {
        position: [
          target[0] + distance * Math.sin(yaw) * Math.cos(pitch),
          target[1] + distance * Math.sin(pitch),
          target[2] + distance * Math.cos(yaw) * Math.cos(pitch),
        ],
        target,
        fov: pose.fov ?? 28,
      };
      const size = await page.evaluate((view) => {
        const hook = (window as unknown as Record<string, FaceHook>)
          .__connectedFace!;
        hook.look(view);
        hook.finish();
        const canvas = document.querySelector<HTMLCanvasElement>("#face-canvas")!;
        return [canvas.width, canvas.height];
      }, camera);
      if (size[0] !== 900 || size[1] !== 900)
        throw new Error(`The editor canvas is ${size.join("x")}, not 900x900.`);
      const url = await page.evaluate(() =>
        document
          .querySelector<HTMLCanvasElement>("#face-canvas")!
          .toDataURL("image/png"),
      );
      const file = `${subject}__reference-yaw.png`;
      fs.writeFileSync(
        path.join(output, file),
        Buffer.from(url.slice(url.indexOf(",") + 1), "base64"),
      );
      captures.push({
        model: subject,
        view: "reference-yaw",
        file,
        camera: {
          yaw: pose.yaw ?? 0,
          pitch: pose.pitch ?? 0,
          distance,
          target,
          ...(pose.fov === undefined ? {} : { fov: pose.fov }),
        },
      });
      console.log(subject, "captured");
    }
    fs.writeFileSync(
      path.join(output, "captures.json"),
      JSON.stringify(
        {
          renderer,
          occlusion,
          poseFileSha256: createHash("sha256").update(poseBytes).digest("hex"),
          captures,
          refused,
        },
        null,
        2,
      ) + "\n",
    );
  } finally {
    await editor.close();
  }
}
void main();
