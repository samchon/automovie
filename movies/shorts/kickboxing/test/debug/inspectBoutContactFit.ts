import {
  physicalSupportPoint,
  planPhysicalContactTargets,
  preparePhysicalGeometry,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { writeFile } from "node:fs/promises";

import { isPhysicalProfilePairExcluded } from "../../../../../packages/engine/src/physics/isPhysicalProfilePairExcluded";
import { BoutPhysicalSettings as Settings } from "../../src/physics/BoutPhysicalSettings";
import { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { boutContactBindings } from "../../src/physics/boutContactBindings";
import { boutSupportPattern } from "../../src/physics/boutSupportPattern";

/** Measure complete simultaneous fitting against unchanged authored scenes; this advances no native world and cannot establish a successful strike. */
async function main(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  const profiles: Record<string, P> = Object.fromEntries(
    Object.entries(source.rigs).map(
      ([id, rig]: [string, BoutTargetSource["rigs"]["a"]]): [string, P] => [
        id,
        rig.profile,
      ],
    ),
  );
  const rows: object[] = [];
  for (const seconds of [0, 1, 149, 149.5, 150]) {
    const sample: ReturnType<BoutTargetSource["sample"]> =
      source.sample(seconds);
    const actual: Record<
      string,
      Record<string, P.ITransform>
    > = Object.fromEntries(
      Object.entries(sample).map(
        ([id, value]: [string, BoutTargetSource.ISample]): [
          string,
          Record<string, P.ITransform>,
        ] => [id, value.segments],
      ),
    );
    for (const id of ["a", "b", "referee"] as const) {
      let queries: number = 0;
      const pattern: ReturnType<typeof boutSupportPattern> = boutSupportPattern(
        source.rigs[id],
        id,
      );
      const schedule: typeof source.referee.steps =
        id === "referee" ? source.referee.steps : source.fighters[id].steps;
      const started: number = performance.now();
      const result: ReturnType<typeof planPhysicalContactTargets> =
        planPhysicalContactTargets({
          body: id,
          profiles,
          targets: sample[id].segments,
          actual,
          bindings: boutContactBindings(source, id, seconds),
          selfAvoidance: {
            iterations: Settings.targetIterations,
            tolerance: Settings.targetTolerance,
          },
          supports: pattern.limbs
            .filter(
              (limb: (typeof pattern.limbs)[number]): boolean =>
                schedule.at(
                  limb.bone.startsWith("left") ? "left" : "right",
                  seconds,
                ).phase !== "busy",
            )
            .map(
              (
                limb: (typeof pattern.limbs)[number],
              ): NonNullable<
                Parameters<typeof planPhysicalContactTargets>[0]["supports"]
              >[number] => ({
                bone: limb.bone,
                localPoint: limb.localPoint,
                point: physicalSupportPoint(
                  sample[id].segments[limb.bone]!,
                  limb.localPoint,
                ),
              }),
            ),
          geometry: {
            ...geometry,
            contact: (
              ...args: Parameters<typeof geometry.contact>
            ): ReturnType<typeof geometry.contact> => {
              queries++;
              return geometry.contact(...args);
            },
          },
          floor: 0,
        });
      const milliseconds: number = performance.now() - started;
      const row: object = {
        seconds,
        id,
        milliseconds,
        queries,
        residuals: result.residuals,
        initialSelf: selfContact(profiles[id]!, sample[id].segments),
        fittedSelf: selfContact(profiles[id]!, result.targets),
      };
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  }
  await writeFile(
    ".cache/physical/contact-fitting.inspection.json",
    JSON.stringify(rows, null, 2),
  );

  /** Read every enabled pair independently through native signed separation. */
  function selfContact(
    profile: P,
    poses: Readonly<Record<string, P.ITransform>>,
  ): { penetration: number; pair?: [string, string] } {
    const result: { penetration: number; pair?: [string, string] } = {
      penetration: 0,
    };
    for (const [index, a] of profile.segments.entries())
      for (const b of profile.segments.slice(index + 1)) {
        if (isPhysicalProfilePairExcluded(profile, a.bone, b.bone)) continue;
        for (const first of a.shapes)
          for (const second of b.shapes) {
            const penetration: number = -(
              geometry.contact(
                {
                  body: "subject",
                  bone: a.bone,
                  shape: first,
                  pose: poses[a.bone]!,
                },
                {
                  body: "subject",
                  bone: b.bone,
                  shape: second,
                  pose: poses[b.bone]!,
                },
                0,
              )?.separation ?? 0
            );
            if (penetration > result.penetration) {
              result.penetration = penetration;
              result.pair = [a.bone, b.bone];
            }
          }
      }
    return result;
  }
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
