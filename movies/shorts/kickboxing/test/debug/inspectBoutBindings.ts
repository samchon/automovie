import {
  preparePhysicalGeometry as Geometry,
  AutoMoviePhysicalPlayback as Playback,
  planPhysicalContactTargets,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { boutContactBindings } from "../../src/physics/boutContactBindings";

/** Inspect actual-bound reach before changing choreography. Compare the declared limb with all available upstream actuators in the same unchanged physical frame. */
async function main(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const geometry: Geometry.IQueries = await Geometry();
  const rows: object[] = [];
  for (const name of ["startup", "finish"]) {
    const file: string = path.resolve(`.cache/physical/${name}.amphys`);
    const manifest: {
      identity: string;
      startSeconds: number;
      profiles: Record<string, P>;
    } = JSON.parse(await readFile(`${file}.json`, "utf8"));
    const playback: Playback = await Playback.decode(
      await readFile(file),
      manifest.identity,
      { maximumBytes: 536870912, maximumFrames: 21601, maximumSegments: 78 },
    );
    for (const seconds of name === "startup"
      ? [1, 1.3, 2.5]
      : [149.8, 149.95, 150, 150.2]) {
      const frame: ReturnType<Playback["at"]> = playback.at(
        seconds - manifest.startSeconds,
      );
      const authored: ReturnType<BoutTargetSource["sample"]> =
        source.sample(seconds);
      for (const id of ["a", "b"] as const) {
        const original: Binding[] = boutContactBindings(source, id, seconds);
        if (
          !original.some(
            (binding: Binding): boolean => binding.kind === "contact",
          )
        )
          continue;
        for (const variant of ["declared", "upstream"] as const) {
          const bindings: Binding[] = structuredClone(original);
          if (variant === "upstream")
            for (const binding of bindings)
              if (binding.kind === "contact") {
                let joint: P.IJoint | undefined = manifest.profiles[
                  id
                ]!.joints.find(
                  (candidate: P.IJoint): boolean =>
                    candidate.child === binding.chain[0],
                );
                while (
                  joint &&
                  manifest.profiles[id]!.joints.some(
                    (candidate: P.IJoint): boolean =>
                      candidate.child === joint!.parent,
                  )
                ) {
                  binding.chain.unshift(joint.parent);
                  joint = manifest.profiles[id]!.joints.find(
                    (candidate: P.IJoint): boolean =>
                      candidate.child === joint!.parent,
                  );
                }
              }
          const plan: ReturnType<typeof planPhysicalContactTargets> =
            planPhysicalContactTargets({
              body: id,
              profiles: manifest.profiles,
              targets: authored[id].segments,
              actual: frame.bodies,
              bindings,
              geometry,
              floor: 0,
            });
          rows.push({
            name,
            seconds,
            id,
            variant,
            actualRoot: frame.bodies[id]!.hips!.position,
            authoredRoot: authored[id].segments.hips!.position,
            residuals: plan.residuals,
            bindings: bindings
              .filter((binding: Binding): boolean => binding.kind === "contact")
              .map((binding: Binding): object => ({
                id: binding.id,
                chain: binding.chain,
              })),
          });
        }
      }
    }
    rows.push({ name, recovery: playback.recovery });
  }
  await writeFile(
    path.resolve(".cache/physical/bindings.inspection.json"),
    JSON.stringify(rows, null, 2),
  );
  console.log(JSON.stringify(rows));
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
