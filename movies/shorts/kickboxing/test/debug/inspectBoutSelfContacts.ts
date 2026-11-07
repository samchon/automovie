import {
  preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Resolve } from "../../src/motion/contact/Resolve";
import { FilmVector as V } from "../../src/motion/rig/FilmVector";
import { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { boutPhysicalTrunk } from "../../src/physics/boutPhysicalTrunk";

/** Inspect every non-neighbour self-collision in representative targets before changing either choreography fitting or native policy. */
async function main(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const geometry: Geometry.IQueries = await Geometry();
  const rows: object[] = [];
  for (const seconds of [
    0, 1, 2.5, 6.5, 8.35, 149.5, 149.8, 149.85, 149.9, 150,
  ]) {
    const samples: ReturnType<BoutTargetSource["sample"]> =
      source.sample(seconds);
    const requests: Resolve.Output = Resolve.requests(
      source.frames(seconds),
      source.rigs,
      Object.fromEntries(
        (["a", "b", "referee"] as const).map(
          (
            id: "a" | "b" | "referee",
          ): [string, ReturnType<typeof boutPhysicalTrunk>] => [
            id,
            boutPhysicalTrunk(samples[id].segments, source.rigs[id].profile),
          ],
        ),
      ),
    );
    for (const id of ["a", "b", "referee"] as const) {
      const profile: P = source.rigs[id].profile;
      const hits: object[] = [];
      for (let first: number = 0; first < profile.segments.length; first++)
        for (
          let second: number = first + 1;
          second < profile.segments.length;
          second++
        ) {
          const a: P.ISegment = profile.segments[first]!;
          const b: P.ISegment = profile.segments[second]!;
          if (
            profile.joints.some(
              (joint: P.IJoint): boolean =>
                (joint.parent === a.bone && joint.child === b.bone) ||
                (joint.parent === b.bone && joint.child === a.bone),
            ) ||
            profile.collisionExclusions?.some(
              (pair: NonNullable<P["collisionExclusions"]>[number]): boolean =>
                (pair.a === a.bone && pair.b === b.bone) ||
                (pair.a === b.bone && pair.b === a.bone),
            )
          )
            continue;
          for (const shapeA of a.shapes)
            for (const shapeB of b.shapes) {
              const receipt: ReturnType<Geometry.IQueries["contact"]> =
                geometry.contact(
                  {
                    body: id,
                    bone: a.bone,
                    shape: shapeA,
                    pose: samples[id].segments[a.bone]!,
                  },
                  {
                    body: id,
                    bone: b.bone,
                    shape: shapeB,
                    pose: samples[id].segments[b.bone]!,
                  },
                  seconds,
                );
              if (receipt && receipt.separation < -0.005)
                hits.push({ a: a.bone, b: b.bone, gap: receipt.separation });
            }
        }
      const arms: object[] = (["left", "right"] as const).flatMap(
        (side: "left" | "right"): object[] => {
          const request: (typeof requests.requests)[string]["arms"] =
            requests.requests[id]!.arms;
          const goal: NonNullable<typeof request>[typeof side] =
            request?.[side];
          if (!goal) return [];
          const hand: P.ISegment = profile.segments.find(
            (segment: P.ISegment): boolean => segment.bone === `${side}Hand`,
          )!;
          const glove: P.IShape | undefined = hand.shapes.find(
            (shape: P.IShape): boolean => shape.material === "glove",
          );
          const pose: P.ITransform = samples[id].segments[hand.bone]!;
          const point: P.ITransform["position"] = Vector3.add(
            pose.position,
            Quaternion.rotateVector(
              pose.rotation,
              glove?.transform.position ?? { x: 0, y: 0, z: 0 },
            ),
          );
          return [
            {
              side,
              error: Vector3.length(
                Vector3.subtract(point, V.vector(goal.point)),
              ),
              actual: point,
              target: goal.point,
            },
          ];
        },
      );
      rows.push({ seconds, id, hits, arms });
    }
  }
  const destination: string = path.resolve(
    ".cache/physical/self-contacts.inspection.json",
  );
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(rows));
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
