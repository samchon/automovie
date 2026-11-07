import {
  AutoMoviePhysicalPlayback as Playback,
  Quaternion,
  Vector3,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { measurePhysicalJointLimits } from "../../../../../packages/engine/src/physics/measurePhysicalJointLimits";
import { BoutReceipts } from "../../src/physics/BoutReceipts";

/** Inspect every completed frame and all review findings without rebuilding Human geometry or advancing another physical world. */
async function main(): Promise<void> {
  const file: string = path.resolve(
    process.argv[2] ?? ".cache/physical/opening.amphys",
  );
  const manifest: {
    identity: string;
    startSeconds: number;
    duration: number;
    rate: number;
    profiles: Record<string, P>;
  } = JSON.parse(await readFile(`${file}.json`, "utf8"));
  const playback: Playback = await Playback.decode(
    await readFile(file),
    manifest.identity,
    { maximumBytes: 536870912, maximumFrames: 21601, maximumSegments: 78 },
  );
  const review: {
    outcome: BoutReceipts.IResult;
    motion: {
      findings: {
        body: string;
        kind: string;
        label: string;
        actual: number;
        limit: number;
        seconds: number;
      }[];
    };
    recovery: object;
  } = JSON.parse(await readFile(`${file}.review.json`, "utf8"));
  const maxima: Record<
    string,
    { actual: number; seconds: number; label: string }
  > = {};
  const samples: object[] = [];
  for (
    let step: number = 0;
    step <= Math.round(manifest.duration * manifest.rate);
    step++
  ) {
    const local: number = step / manifest.rate;
    const frame: ReturnType<Playback["at"]> = playback.at(local);
    const seconds: number = local + manifest.startSeconds;
    for (const [id, profile] of Object.entries(manifest.profiles)) {
      const segments: (typeof frame.bodies)[string] = frame.bodies[id]!;
      for (const joint of profile.joints) {
        const parent: P.ITransform = segments[joint.parent]!;
        const child: P.ITransform = segments[joint.child]!;
        const a: IAutoMovieVector3 = Vector3.add(
          parent.position,
          Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
        );
        const b: IAutoMovieVector3 = Vector3.add(
          child.position,
          Quaternion.rotateVector(child.rotation, joint.childFrame.position),
        );
        record(
          `${id}/anchor`,
          Vector3.length(Vector3.subtract(a, b)),
          seconds,
          joint.id,
        );
        for (const coordinate of measurePhysicalJointLimits(
          joint,
          parent,
          child,
        ))
          record(
            `${id}/joint`,
            coordinate.violation,
            seconds,
            `${joint.id}/${coordinate.axis}`,
          );
      }
      for (const segment of profile.segments)
        for (const shape of segment.shapes) {
          const outer: number = -physicalShapeBounds(
            segments[segment.bone]!,
            shape,
          ).min.y;
          const compression: number =
            profile.materials.find(
              (material: P.IMaterial): boolean =>
                material.id === shape.material,
            )?.maximumCompression ?? 0;
          record(`${id}/outer-floor`, Math.max(0, outer), seconds, shape.id);
          record(
            `${id}/core-floor`,
            Math.max(0, outer - compression),
            seconds,
            shape.id,
          );
        }
      if (
        step % manifest.rate === 0 ||
        step === Math.round(manifest.duration * manifest.rate)
      )
        samples.push({
          seconds,
          id,
          hips: segments.hips!.position,
          head: segments.head!.position,
          supports: (["left", "right"] as const).map(
            (side: "left" | "right"): object => {
              const bone: string = `${side}Midfoot`;
              const sole: number = Math.min(
                ...profile.segments
                  .filter((segment: P.ISegment): boolean =>
                    [`${side}Foot`, `${side}Subtalar`, bone].includes(
                      segment.bone,
                    ),
                  )
                  .flatMap((segment: P.ISegment): number[] =>
                    segment.shapes.map(
                      (shape: P.IShape): number =>
                        physicalShapeBounds(segments[segment.bone]!, shape).min
                          .y,
                    ),
                  ),
              );
              return {
                bone,
                point: physicalSupportPoint(segments[bone]!),
                sole,
              };
            },
          ),
        });
    }
  }
  const motion: Record<
    string,
    { count: number; maximum: number; first: object }
  > = {};
  for (const finding of review.motion.findings) {
    const key: string = `${finding.body}/${finding.kind}`;
    const group: (typeof motion)[string] = (motion[key] ??= {
      count: 0,
      maximum: -Infinity,
      first: finding,
    });
    group.count++;
    group.maximum = Math.max(group.maximum, finding.actual);
  }
  const output: object = {
    file,
    identity: manifest.identity,
    maxima,
    samples,
    motion,
    outcomes: review.outcome.findings,
    accepted: review.outcome.contacts.length,
    mats: review.outcome.mats,
    recovery: review.recovery,
  };
  await writeFile(`${file}.inspection.json`, JSON.stringify(output, null, 2));
  if (process.argv[3])
    await writeFile(
      path.resolve(process.argv[3]),
      JSON.stringify({
        identity: playback.identity,
        step: playback.duration * playback.rate,
        frames: Array.from(
          { length: Math.round(manifest.duration * manifest.rate) + 1 },
          (_: unknown, step: number): ReturnType<Playback["at"]> =>
            playback.at(step / manifest.rate),
        ),
      }),
    );
  console.log(
    JSON.stringify({
      file,
      maxima,
      motion,
      outcomes: review.outcome.findings.length,
      accepted: review.outcome.contacts.length,
      mats: review.outcome.mats,
    }),
  );

  /** Keep the worst actual frame independently for each physical quantity. */
  function record(
    key: string,
    actual: number,
    seconds: number,
    label: string,
  ): void {
    if (!maxima[key] || actual > maxima[key]!.actual)
      maxima[key] = { actual, seconds, label };
  }
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
