import {
  AutoMovieHumanRigControls as Controls,
  type IAutoMovieHumanParameters,
  type IAutoMovieHumanPose,
  AutoMovieHumanLimbIk as LimbIk,
  AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** All ninety independently recorded original-film solves retain their actual FK, including unreachable poses; no production implementation is imported. */
export async function test_physical_legacy_ik(): Promise<void> {
  const record: IRecord = JSON.parse(
    await readFile(
      path.join(
        import.meta.dirname,
        "../../fixtures/physical/kickboxing-legacy.json",
      ),
      "utf8",
    ),
  );
  const solvers: Record<string, ReturnType<typeof LimbIk.prepare>> = {
    fighter: LimbIk.prepare(Skeleton.prepare(record.parameters.fighter)),
    referee: LimbIk.prepare(Skeleton.prepare(record.parameters.referee)),
  };
  const limits: NonNullable<LimbIk.IRequest["limits"]> = {};
  for (const side of ["left", "right"] as const)
    for (const kind of ["legs", "arms"] as const) {
      const names: string[] =
        kind === "legs"
          ? [
              "hip.flexion",
              "hip.abduction",
              "hip.rotation",
              "knee.flexion",
              "ankle.dorsiflexion",
            ]
          : [
              "shoulder.flexion",
              "shoulder.abduction",
              "shoulder.rotation",
              "elbow.flexion",
            ];
      const ranges: number[][] =
        kind === "legs"
          ? [
              [-17, 130],
              [-20, 40],
              [-45, 45],
              [0, 139],
              [-58, 13],
            ]
          : [
              [-60, 170],
              [-40, 180],
              [-70, 90],
              [0, 147],
            ];
      names.forEach((name: string, index: number): void => {
        limits[Controls.channel(`${kind}.${side}.${name}`)] = {
          minimum: ranges[index]![0]!,
          maximum: ranges[index]![1]!,
        };
      });
    }
  const findings: string[] = [];
  let maximum: number = 0;
  for (const sample of record.poses) {
    const before: string = JSON.stringify(sample.request);
    const result: ReturnType<ReturnType<typeof LimbIk.prepare>> = solvers[
      sample.id === "referee" ? "referee" : "fighter"
    ]!({
      ...sample.request,
      limits,
      gloveOffset: 0.065,
      symmetricSeedSide: "left",
    });
    const poses: Map<string, Skeleton.IPlacement> = new Map(
      result.output.posed.map(
        (item: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
          item.bone,
          item,
        ],
      ),
    );
    const difference: number = Math.max(
      ...sample.local.map((item: Skeleton.IPlacement): number =>
        Math.hypot(
          ...item.position.map(
            (value: number, index: number): number =>
              value - poses.get(item.bone)!.position[index]!,
          ),
        ),
      ),
    );
    maximum = Math.max(maximum, difference);
    if (difference > 1e-7)
      findings.push(`${sample.id}@${sample.seconds}: ${difference} m`);
    if (JSON.stringify(sample.request) !== before)
      findings.push(`${sample.id}@${sample.seconds}: mutated recorded request`);
  }
  assert.deepEqual(
    findings,
    [],
    `all recorded FK within 0.1 micrometre; maximum ${maximum} m`,
  );
}

/** Literal original requests and independent local FK outputs. */
interface IRecord {
  /** Fixed original bodies; they are prepared separately in this calling test. */
  parameters: Record<"fighter" | "referee", IAutoMovieHumanParameters>;
  /** Complete original authored inputs and all matching FK placements. */
  poses: {
    /** Original actor. */ id: string;
    /** Original film clock. */ seconds: number;
    /** Literal world goals and authored channels. */ request: {
      /** World root. */ root: LimbIk.IRequest["root"];
      /** Authored pose. */ pose: IAutoMovieHumanPose;
      /** Original ankle goals. */ legs?: Partial<
        Record<Controls.Side, LimbIk.IGoal>
      >;
      /** Original glove goals. */ arms?: Partial<
        Record<Controls.Side, LimbIk.IGoal>
      >;
    };
    /** Independent original solved local placements. */ local: Skeleton.IPlacement[];
  }[];
}
