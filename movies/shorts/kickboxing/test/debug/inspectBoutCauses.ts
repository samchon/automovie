import {
  AutoMoviePhysicalSimulation as Simulation,
  physicalShapeBounds,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { BoutFootsteps as Footsteps } from "../../src/motion/footwork/BoutFootsteps";
import type { Foot } from "../../src/motion/rig/Foot";
import type { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { createBoutPhysicalInput } from "../../src/physics/createBoutPhysicalInput";

/** Gather every planner assertion and actual sole discrepancy after the bounded Node round, using the already prepared real movie source and no native integration. Errors remain observations, so one failed assertion cannot conceal the remaining causes. */
export function inspectBoutCauses(source: BoutTargetSource): {
  planner: object;
  soles: object[];
  supportFailures: string[];
  input: object;
} {
  /** The existing walking test's independently specified three-metre route. */
  const walking: (seconds: number) => Record<Footsteps.Side, Foot.Placement> = (
    seconds: number,
  ): Record<Footsteps.Side, Foot.Placement> => {
    const x: number = Math.max(0, Math.min(3, seconds - 1));
    return {
      left: { ball: [x + 0.1, 0.11], yaw: 0, heel: 0, lift: 0 },
      right: { ball: [x + 0.1, -0.11], yaw: 0, heel: 0, lift: 0 },
    };
  };
  const common: Footsteps.Input = {
    start: 0,
    end: 6,
    desired: walking,
    heading: (): number => 0,
    busy: [],
    duration: 0.3,
    threshold: 0.1,
    height: 0.06,
    lead: "left",
  };
  const walk: Footsteps = new Footsteps(common);
  const still: Footsteps = new Footsteps({
    ...common,
    end: 3,
    desired: (): Record<Footsteps.Side, Foot.Placement> => walking(0),
  });
  const reserved: Footsteps = new Footsteps({
    ...common,
    busy: [{ side: "right", start: 2, end: 2.6 }],
  });
  const findings: string[] = [];
  for (let seconds: number = 0; seconds <= 6; seconds += 0.05)
    for (const side of ["left", "right"] as const)
      if (
        Math.abs(
          walk.at(side, seconds).placement.ball[0] -
            walking(seconds)[side].ball[0],
        ) > 0.95
      )
        findings.push(`${side} trailing@${seconds}`);
  const swings: readonly Footsteps.Step[] = walk.steps.filter(
    (step: Footsteps.Step): boolean => step.start > 1.05 && step.end < 3.9,
  );
  if (swings.length < 4) findings.push(`only ${swings.length} walking steps`);
  for (let index: number = 1; index < swings.length; index++)
    if (swings[index]!.side === swings[index - 1]!.side)
      findings.push(`same-foot consecutive swings@${swings[index]!.start}`);
  for (const step of walk.steps)
    if (
      Math.hypot(
        step.to.ball[0] - step.from.ball[0],
        step.to.ball[1] - step.from.ball[1],
      ) >
      0.9 + 1e-9
    )
      findings.push(`walking stride over0.9m@${step.start}`);
  if (still.steps.length)
    findings.push(`stationary stance has ${still.steps.length} steps`);
  const overlaps: readonly Footsteps.Step[] = reserved.steps.filter(
    (step: Footsteps.Step): boolean => step.end > 2 && step.start < 2.6,
  );
  if (reserved.at("right", 2.3).phase !== "busy")
    findings.push("reserved foot is not busy");
  const afterReservation: number = reserved.at("right", 2.65).placement.ball[0];
  if (Math.abs(afterReservation - walking(2.6).right.ball[0]) >= 1e-9)
    findings.push(
      `reservation endpoint drift: ${afterReservation} vs ${walking(2.6).right.ball[0]}`,
    );
  const supportFailures: string[] = [];
  for (const id of ["a", "b", "referee"] as const) {
    const steps: typeof source.referee.steps =
      id === "referee" ? source.referee.steps : source.fighters[id].steps;
    const end: number = id === "b" ? 150 : 180;
    for (let frame: number = 0; frame < end * 120; frame++)
      if (
        (["left", "right"] as const).every(
          (side: "left" | "right"): boolean =>
            steps.at(side, frame / 120).phase !== "planted",
        )
      )
        supportFailures.push(`${id}@${frame / 120}`);
  }
  const soles: object[] = [];
  for (const seconds of [0, 0.5, 1, 6.5, 149, 150]) {
    const sample: ReturnType<BoutTargetSource["sample"]> =
      source.sample(seconds);
    for (const id of ["a", "b", "referee"] as const)
      for (const side of ["left", "right"] as const) {
        const leg: (typeof sample)[typeof id]["frame"]["legs"][typeof side] =
          sample[id].frame.legs[side];
        if (leg.kind !== "place" || leg.placement.lift !== 0) continue;
        const minimum: number = Math.min(
          ...source.rigs[id].profile.segments
            .filter((segment: P.ISegment): boolean =>
              [`${side}Foot`, `${side}Subtalar`, `${side}Midfoot`].includes(
                segment.bone,
              ),
            )
            .flatMap((segment: P.ISegment): number[] =>
              segment.shapes.map(
                (shape: P.IShape): number =>
                  physicalShapeBounds(sample[id].segments[segment.bone]!, shape)
                    .min.y,
              ),
            ),
        );
        soles.push({
          id,
          side,
          seconds,
          minimum,
          placement: leg.placement,
          groundingLift: sample[id].groundingLift,
          failed: minimum > 0 || minimum < -0.0002,
        });
      }
  }
  let input: object;
  try {
    const prepared: Simulation.IInput = createBoutPhysicalInput(
      source,
      1,
      "simulated",
      149.5,
    );
    input = {
      identity: Simulation.identity(prepared),
      bodies: prepared.bodies.map((body: Simulation.IBody): object => ({
        id: body.id,
        maximumBindings: body.maximumBindings,
        release: body.releaseOnContact,
        strengths: [
          ...new Set(
            body.targets.map(
              (target: Simulation.ITarget): number => target.strength,
            ),
          ),
        ],
      })),
    };
  } catch (error: unknown) {
    input = {
      error:
        error instanceof Error ? (error.stack ?? error.message) : String(error),
    };
  }
  return {
    planner: {
      findings,
      overlaps,
      afterReservation,
      expectedAfterReservation: walking(2.6).right.ball[0],
    },
    soles,
    supportFailures,
    input,
  };
}
