import {
  Quaternion,
  Vector3,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { measurePhysicalJointLimits } from "../../../../../packages/engine/src/physics/measurePhysicalJointLimits";
import { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { boutSupportPattern } from "../../src/physics/boutSupportPattern";

/** Inspect authored-to-native targets at all representative bout states in one preparation round, without integrating a solver. */
async function main(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const rows: object[] = [];
  for (const seconds of [0, 0.2, 0.5, 1, 6.5, 149, 149.5, 150, 158, 160]) {
    const samples: ReturnType<BoutTargetSource["sample"]> =
      source.sample(seconds);
    for (const id of ["a", "b", "referee"] as const) {
      const rig: (typeof source.rigs)[typeof id] = source.rigs[id];
      const sample: (typeof samples)[typeof id] = samples[id];
      const joints: object[] = [];
      let maximumAnchor: number = 0;
      for (const joint of rig.profile.joints) {
        const parent: P.ITransform = sample.segments[joint.parent]!;
        const child: P.ITransform = sample.segments[joint.child]!;
        const a: IAutoMovieVector3 = Vector3.add(
          parent.position,
          Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
        );
        const b: IAutoMovieVector3 = Vector3.add(
          child.position,
          Quaternion.rotateVector(child.rotation, joint.childFrame.position),
        );
        maximumAnchor = Math.max(
          maximumAnchor,
          Vector3.length(Vector3.subtract(a, b)),
        );
        for (const coordinate of measurePhysicalJointLimits(
          joint,
          parent,
          child,
        ))
          if (coordinate.violation > 1e-8)
            joints.push({ joint: joint.id, ...coordinate });
      }
      const supports: object[] = boutSupportPattern(rig, id).limbs.map(
        (
          limb: ReturnType<typeof boutSupportPattern>["limbs"][number],
          index: number,
        ): object => {
          const point: IAutoMovieVector3 = physicalSupportPoint(
            sample.segments[limb.bone]!,
            limb.localPoint,
          );
          const minimum: number = Math.min(
            ...rig.profile.segments
              .filter((segment: P.ISegment): boolean =>
                limb.contacts!.includes(segment.bone),
              )
              .flatMap((segment: P.ISegment): number[] =>
                segment.shapes.map(
                  (shape: P.IShape): number =>
                    physicalShapeBounds(sample.segments[segment.bone]!, shape)
                      .min.y,
                ),
              ),
          );
          const side: "left" | "right" = index === 0 ? "left" : "right";
          const intent: (typeof sample.frame.legs)[typeof side] =
            sample.frame.legs[side];
          return {
            bone: limb.bone,
            point,
            minimum,
            phase: (id === "referee"
              ? source.referee.steps
              : source.fighters[id].steps
            ).at(side, seconds).phase,
            horizontalError:
              intent.kind === "place"
                ? Math.hypot(
                    point.x - intent.placement.ball[0],
                    point.z - intent.placement.ball[1],
                  )
                : null,
          };
        },
      );
      rows.push({
        seconds,
        id,
        ballHeight: rig.ballHeight,
        clinicalResidual: sample.fitted.error,
        groundingLift: sample.groundingLift,
        maximumAnchor,
        joints,
        hips: sample.segments.hips!.position,
        head: sample.segments.head!.position,
        supports,
      });
    }
  }
  const destination: string = path.resolve(
    process.argv[2] ?? ".cache/physical/targets.inspection.json",
  );
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(rows, null, 2));
  console.log(JSON.stringify({ destination, rows: rows.length }));
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
