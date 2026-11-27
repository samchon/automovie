import type { IAutoMovieMotionTake } from "@automovie/interface";
import { AutoMovieRenderPicture } from "@automovie/render";
import { AutoMovieCliCaptureHost } from "automovie";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

import { fixture } from "./source";

/**
 * Raster proof drawn through the software backend with the installed capture
 * host.
 */
export async function draw(
  take: IAutoMovieMotionTake | null,
): Promise<string[]> {
  const host: AutoMovieCliCaptureHost = await AutoMovieCliCaptureHost.open({
    root: process.cwd(),
    module: `${fixture.directory}/subjects.ts`,
    backend: "software",
    env: process.env,
  });
  try {
    const session: Awaited<ReturnType<AutoMovieCliCaptureHost["session"]>> =
      await host.session({ subject: "stage", props: take });
    try {
      const digests: string[] = [];
      const seconds: number =
        take?.anchor.sourceSeconds ?? fixture.sourceSeconds;
      for (const [index, second] of [
        seconds - 0.04,
        seconds,
        seconds + 0.04,
      ].entries()) {
        const frames: Awaited<ReturnType<typeof session.frame>> =
          await session.frame(second, ["beauty"]);
        const { picture } = frames[0]!;
        digests.push(createHash("sha256").update(picture.pixels).digest("hex"));
        await writeFile(
          `${fixture.directory}/${take === null ? "uninterrupted" : "reopened"}-${index}.png`,
          await AutoMovieRenderPicture.encodeRasterPng(picture),
        );
      }
      assert.equal(
        new Set(digests).size,
        3,
        "the rendered ball and hand move across the saved frame",
      );
      return digests;
    } finally {
      await session.close();
    }
  } finally {
    await host.close();
  }
}
