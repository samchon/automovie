import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSegmentState,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePoses,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import { AutoMovieEnginePhysicalCoupledTargetError } from "../AutoMovieEnginePhysicalCoupledTargetError";
import type { IPhysicalCoupledTargetGroup } from "./IPhysicalCoupledTargetGroup";
import type { IPhysicalCoupledTargetRun } from "./IPhysicalCoupledTargetRun";
import { fitPhysicalCoupledTargetGroup } from "./fitPhysicalCoupledTargetGroup";
import { physicalContactSupportGoals } from "./physicalContactSupportGoals";
import { planPhysicalContactTargets } from "./planPhysicalContactTargets";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/*
 * Evaluate one frame's coupled and ordinary relationships against the same
 * pre-binding snapshot. Geometric receipts retain null impulse.
 */
export function bindPhysicalKinematicFrame(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  step: number,
  frame: IAutoMoviePhysicalFrame,
  previous: IAutoMoviePhysicalFrame | undefined,
  geometry: IAutoMoviePreparePhysicalGeometry.IQueries,
  contacts: IAutoMovieContactReceipt[],
  profiles: Record<string, IAutoMoviePhysicalProfile> = Object.fromEntries(
    input.bodies.map(
      (
        body: IAutoMoviePhysicalSimulationInput.IBody,
      ): [string, IAutoMoviePhysicalProfile] => [body.id, body.profile],
    ),
  ),
  coupling?: IPhysicalCoupledTargetRun,
): IAutoMoviePhysicalFrame {
  const actual: IAutoMoviePhysicalFrame["bodies"] = frame.bodies;
  const fits: ReturnType<typeof fitPhysicalCoupledTargetGroup>[] | undefined =
    coupling?.schedule
      .get(step)
      ?.map(
        (
          group: IPhysicalCoupledTargetGroup,
        ): ReturnType<typeof fitPhysicalCoupledTargetGroup> => {
          if (
            group.step !== step ||
            group.bodies.some(
              (body: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
                !input.bodies.includes(body) ||
                body.targets[step]?.coupledGroup !== group.group,
            )
          )
            throw new AutoMovieEnginePhysicalCoupledTargetError({
              step,
              group: group.group,
              members: group.members,
              kind: "refused",
              reason: "declaration",
              detail:
                "The admitted group does not match this frame's authored targets.",
            });
          return fitPhysicalCoupledTargetGroup(group, {
            scene: input,
            actual,
            geometry,
            floor: input.floor - input.contactTolerance!,
            members: group.bodies.map(
              (
                body: IAutoMoviePhysicalSimulationInput.IBody,
              ): Parameters<
                typeof fitPhysicalCoupledTargetGroup
              >[1]["members"][number] => {
                const target: IAutoMoviePhysicalSimulationInput.ITarget =
                  body.targets[step]!;
                return {
                  body: body.id,
                  target,
                  supports: physicalContactSupportGoals(
                    body,
                    target,
                    input.floor,
                    input.contactTolerance!,
                    step / input.rate,
                    input.rate,
                    step,
                  ),
                };
              },
            ),
          });
        },
      );
  const grouped: Map<string, IAutoMoviePoses> | undefined =
    fits === undefined
      ? undefined
      : new Map(
          fits.flatMap(
            (
              fit: ReturnType<typeof fitPhysicalCoupledTargetGroup>,
            ): [string, IAutoMoviePoses][] => Object.entries(fit.targets),
          ),
        );
  const bodies: IAutoMoviePhysicalFrame["bodies"] = { ...actual };
  for (const body of input.bodies) {
    const target: IAutoMoviePhysicalSimulationInput.ITarget =
      body.targets[step]!;
    const coupled: IAutoMoviePoses | undefined = grouped?.get(body.id);
    if (target.coupledGroup !== undefined && coupled === undefined)
      throw new AutoMovieEnginePhysicalCoupledTargetError({
        step,
        group: target.coupledGroup ?? "",
        members: [body.id],
        kind: "refused",
        reason: "declaration",
        detail: "The frame requires an admitted coupled target group.",
      });
    if (
      coupled === undefined &&
      !target.bindings?.length &&
      !target.pointBounds?.length &&
      !body.selfAvoidance
    )
      continue;
    const planned: IAutoMoviePoses =
      coupled ??
      planPhysicalContactTargets({
        body: body.id,
        profiles,
        targets: target.segments,
        actual,
        bindings: target.bindings ?? [],
        pointBounds: target.pointBounds,
        selfAvoidance: body.selfAvoidance,
        supports: physicalContactSupportGoals(
          body,
          target,
          input.floor,
          input.contactTolerance!,
          step / input.rate,
          input.rate,
          step,
        ),
        geometry,
        floor: input.floor - input.contactTolerance!,
      }).targets;
    bodies[body.id] = Object.fromEntries(
      Object.entries(planned).map(
        ([bone, pose]: [string, IAutoMovieRigidTransform]): [
          string,
          IAutoMoviePhysicalSegmentState,
        ] => {
          const sampled: IAutoMovieSamplePhysicalTarget.IResult =
            samplePhysicalTarget(
              previous?.bodies[body.id]?.[bone] ?? pose,
              pose,
              1,
              input.rate,
            );
          return [
            bone,
            {
              ...pose,
              velocity: sampled.velocity,
              angularVelocity: sampled.angularVelocity,
            },
          ];
        },
      ),
    );
  }
  const found: Set<string> = new Set();
  for (const body of input.bodies)
    for (const binding of body.targets[step]!.bindings ?? []) {
      if (binding.kind !== "contact") continue;
      const source: IAutoMoviePhysicalShape = body.profile.segments
        .find(
          (segment: IAutoMoviePhysicalSegment): boolean =>
            segment.bone === binding.source.bone,
        )!
        .shapes.find(
          (shape: IAutoMoviePhysicalShape): boolean =>
            shape.id === binding.source.shape,
        )!;
      const target: IAutoMoviePhysicalShape = profiles[
        binding.target.body
      ]!.segments.find(
        (segment: IAutoMoviePhysicalSegment): boolean =>
          segment.bone === binding.target.bone,
      )!.shapes.find(
        (shape: IAutoMoviePhysicalShape): boolean =>
          shape.id === binding.target.shape,
      )!;
      const receipt: IAutoMovieContactReceipt | null = geometry.contact(
        {
          body: body.id,
          bone: binding.source.bone,
          shape: source,
          pose: bodies[body.id]![binding.source.bone]!,
        },
        {
          body: binding.target.body,
          bone: binding.target.bone,
          shape: target,
          pose: bodies[binding.target.body]![binding.target.bone]!,
        },
        frame.seconds,
      );
      if (receipt && !found.has(receipt.id)) {
        contacts.push(receipt);
        found.add(receipt.id);
      }
    }
  if (fits !== undefined)
    coupling?.record(
      fits.map(
        (fit: ReturnType<typeof fitPhysicalCoupledTargetGroup>) => fit.report,
      ),
    );
  return { ...frame, bodies };
}
