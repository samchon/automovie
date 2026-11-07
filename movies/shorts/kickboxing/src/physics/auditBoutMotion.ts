import {
  AutoMovieMotionAudit as Audit,
  type AutoMoviePhysicsCache as Cache,
  Quaternion,
  physicalShapeBounds,
  samplePhysicalRecoverySupport,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { BoutFootsteps } from "../motion/footwork/BoutFootsteps";
import { Foot } from "../motion/rig/Foot";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";
import { BoutTargetSource } from "./BoutTargetSource";
import { auditBoutGuard } from "./auditBoutGuard";

/** Declare the bout's existing support/speed/separation limits to the shared audit; all measurement stays in Engine. */
export async function auditBoutMotion(
  source: BoutTargetSource,
  at: (seconds: number) => Cache.IFrame,
  start: number,
  end: number,
  rate: number,
  recovery: { states: Cache["recovery"]; startSeconds: number } = {
    states: {},
    startSeconds: 0,
  },
): Promise<Awaited<ReturnType<typeof Audit.run>> & { guardSamples: number }> {
  const bodies: Audit.IBody[] = (["a", "b", "referee"] as const).map(
    (id: FilmPlan.ActorId): Audit.IBody => {
      const rig: BoutTargetSource["rigs"][FilmPlan.ActorId] = source.rigs[id];
      const schedule: BoutFootsteps =
        id === "referee" ? source.referee.steps : source.fighters[id].steps;
      const constraints: Audit.IConstraint[] = [];
      for (const side of ["left", "right"] as const) {
        const bone: string = `${side}Midfoot`;
        const neutral: (typeof rig.neutral.posed)[number] =
          rig.neutral.posed.find(
            (placement: (typeof rig.neutral.posed)[number]): boolean =>
              placement.bone === bone,
          )!;
        const first: (typeof rig.neutral.posed)[number] =
          rig.neutral.posed.find(
            (placement: (typeof rig.neutral.posed)[number]): boolean =>
              placement.bone === `${side}HalluxProximal`,
          )!;
        const last: (typeof rig.neutral.posed)[number] = rig.neutral.posed.find(
          (placement: (typeof rig.neutral.posed)[number]): boolean =>
            placement.bone === `${side}Toe5Proximal`,
        )!;
        const localPoint: IAutoMovieVector3 = Quaternion.rotateVector(
          {
            x: -neutral.rotation[0],
            y: -neutral.rotation[1],
            z: -neutral.rotation[2],
            w: neutral.rotation[3],
          },
          {
            x: (first.position[0] + last.position[0]) / 2 - neutral.position[0],
            y: (first.position[1] + last.position[1]) / 2 - neutral.position[1],
            z: (first.position[2] + last.position[2]) / 2 - neutral.position[2],
          },
        );
        let cursor: number = start;
        const finish: number =
          id === "b" ? Math.min(end, BoutScript.finish.at - 1 / 120) : end;
        /** One actual planted interval; a reserved kick/check and a swing promise no fixed support. */
        const planted: (from: number, to: number) => void = (
          from: number,
          to: number,
        ): void => {
          if (to < from) return;
          constraints.push({
            kind: "goal",
            label: `${side}-planted-ball`,
            start: from,
            end: to,
            maximum: 0.03,
            point: { bone, localPoint },
            enabled: (seconds: number): boolean =>
              !samplePhysicalRecoverySupport(
                recovery.states[id],
                bone,
                seconds - recovery.startSeconds,
              ).active,
            target: (seconds: number): IAutoMovieVector3 => {
              const intent: ReturnType<
                BoutTargetSource["frames"]
              >[FilmPlan.ActorId] = source.frames(seconds)[id];
              const leg: (typeof intent.legs)[typeof side] = intent.legs[side];
              if (leg.kind !== "place")
                throw new Error(
                  `Planted audit interval has no placement: ${id}/${side}@${seconds}`,
                );
              const goal: Foot.Goals = Foot.goals(
                leg.placement,
                rig.footVector,
              );
              const states: Record<string, Cache.ISegment> =
                at(seconds).bodies[id]!;
              const endpoint: IAutoMovieVector3 = {
                x: states[bone]!.position.x,
                y: states[bone]!.position.y,
                z: states[bone]!.position.z,
              };
              const offset: IAutoMovieVector3 = Quaternion.rotateVector(
                states[bone]!.rotation,
                localPoint,
              );
              const minimum: number = Math.min(
                ...rig.profile.segments
                  .filter((segment: P.ISegment): boolean =>
                    [`${side}Foot`, `${side}Subtalar`, bone].includes(
                      segment.bone,
                    ),
                  )
                  .flatMap((segment: P.ISegment): number[] =>
                    segment.shapes.map(
                      (shape: P.IShape): number =>
                        physicalShapeBounds(states[segment.bone]!, shape).min.y,
                    ),
                  ),
              );
              const adjustment: ReturnType<
                typeof samplePhysicalRecoverySupport
              > = samplePhysicalRecoverySupport(
                recovery.states[id],
                bone,
                seconds - recovery.startSeconds,
              );
              return {
                x: goal.ball[0] + adjustment.offset.x,
                y: endpoint.y + offset.y - minimum,
                z: goal.ball[2] + adjustment.offset.z,
              };
            },
          });
          constraints.push({
            kind: "distance",
            label: `${side}-support-spread`,
            start: from,
            end: to,
            maximum: 0.75,
            horizontal: true,
            from: { bone: "hips" },
            to: { bone, localPoint },
          });
          if (id !== "referee")
            constraints.push({
              kind: "angle",
              label: `${side}-supported-knee`,
              start: from,
              end: to,
              minimum: (8 * Math.PI) / 180,
              from: { bone: `${side}UpperLeg` },
              pivot: { bone: `${side}LowerLeg` },
              to: { bone: `${side}Foot` },
            });
        };
        for (const step of schedule.steps.filter(
          (step: BoutFootsteps.Step): boolean =>
            step.side === side && step.end >= start && step.start <= finish,
        )) {
          planted(cursor, Math.min(finish, step.start - 1 / 120));
          cursor = Math.max(cursor, step.end + 1 / 120);
        }
        planted(cursor, finish);
      }
      return {
        id,
        profile: rig.profile,
        speeds: Object.fromEntries(
          rig.profile.segments.map((segment: P.ISegment): [string, number] => [
            segment.bone,
            /Arm|Hand|Leg|Foot|Subtalar|Midfoot/.test(segment.bone) ? 13 : 6,
          ]),
        ),
        supports: [],
        constraints,
        floorTolerance: Settings.floorTolerance,
        accountForCompression: true,
        overlapTolerance: 0,
        jointTolerance: Settings.jointTolerance,
      };
    },
  );
  const report: Awaited<ReturnType<typeof Audit.run>> = await Audit.run({
    bodies,
    start,
    end,
    rate,
    floor: Settings.floor,
    sample: at,
    allowed: (): boolean => false,
  });
  const guards: ReturnType<typeof auditBoutGuard> = auditBoutGuard({
    profiles: { a: source.rigs.a.profile, b: source.rigs.b.profile },
    at,
    start,
    end,
    rate: Settings.rate,
    facing: (actor: "a" | "b", seconds: number): IAutoMovieVector3 => {
      const heading: number = source.frames(seconds)[actor].heading;
      return { x: Math.cos(heading), y: 0, z: -Math.sin(heading) };
    },
  });
  return {
    samples: report.samples,
    guardSamples: guards.samples,
    findings: [...report.findings, ...guards.findings],
  };
}
