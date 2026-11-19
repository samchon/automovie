import { AffordanceArticulation, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanLexiconArcheryParams,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Hand the staged arrow or bolt to a scene-authored animation carrier on the
 * same cue that returns the visible string to its rest pose. The carrier
 * supplies all post-cue prop movement. The performer keeps the carrier's pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the shared scene cue, performer posture source, and owners of visible recovery and continuation.
 * @evidence contracts/development/implementation.md#principled-implementation Read the posed nock, verify the named prop is seated there, resolve the string's authored articulation coordinate, and publish a mount and recovery from the same instant.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read and admit the scene subjects first, then compute the cue's clock, current contact, and outputs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The brief timings are provisional film cues. The continuation is the scene's authored motion with a continuity offset carried by the standard mount. The seating check uses the named scene points.
 * @evidence contracts/development/implementation.md#efficient-algorithms One cue-time geometry read per source and prop, one index of the source's affordances, and constant work per articulation sample.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each planned cue has its own clock and displayed starting travel.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The drive callbacks retain timing and scalar travel only. The shared posture plan and mount retain their standard records.
 */
export function HumanArcheryCue(
  context: IAutoMovieMotionHumanActionContext,
  continuation: IAutoMovieMotionHumanLexiconArcheryParams.IContinuation,
  crossbow: boolean,
): IAutoMovieMotionHumanActionPlan {
  const { source, prop, onto, point } = continuation;
  if (source === prop || source === onto || prop === onto)
    throw refusal(prop, "the source, transferable prop and animation carrier must be distinct");
  const carrier: IAutoMovieMotionHumanPropReader = context.prop(onto);
  if (!carrier.prop.affordances?.some((a: IAutoMovieAffordance): boolean =>
    a.id === point && a.kind === "socket"))
    throw refusal(`${onto}.${point}`, "the animation carrier must declare the selected socket");

  const beat: number = AutoMovieMotionHumanTiming.PAUSES.brief;
  const cue: string = crossbow ? "strokeStart" : "open";
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(3 * beat, [
    { name: cue, seconds: beat },
    { name: "relax", seconds: 2 * beat },
  ]);
  const at: number = context.start + clock.at(cue);
  const fixture: IAutoMovieMotionHumanPropReader = context.prop(source);
  const moved: IAutoMovieMotionHumanPropReader = context.prop(prop);
  if (moved.prop.motion !== undefined || moved.prop.fixed === true || moved.prop.soft !== undefined)
    throw refusal(prop, "the transferable prop must allow a rigid socket mount");
  if (moved.launchAt?.(at) !== undefined)
    throw refusal(prop, "this prop already has an active continuation");
  const byId: ReadonlyMap<string, IAutoMovieAffordance> = new Map(
    (fixture.prop.affordances ?? []).map(
      (a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a],
    ),
  );
  const state: Readonly<Record<string, number>> = fixture.state?.(at) ?? {};
  const articulation: string | null = AffordanceArticulation.leader(byId, "string");
  const start: number | null = articulation === null
    ? null
    : AffordanceArticulation.travel(byId, state, articulation);
  if (articulation === null || start === null || start <= 0 || fixture.prop.articulate === undefined)
    throw refusal(source, "the staged string must already be held away from its rest pose");

  const nock: IAutoMovieAffordance | undefined = fixture.prop.articulate(state).affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "nock" && a.kind === "socket",
  );
  const tail: IAutoMovieVector3 | undefined = moved.prop.points.nock?.point;
  if (nock === undefined || tail === undefined || Vector3.distance(
    worldPoint(fixture.frame(at), nock.frame.translation),
    worldPoint(moved.frame(at), tail),
  ) > SEATING_TOLERANCE)
    throw refusal(prop, `the prop must be seated at ${source}.nock when the cue occurs`);

  const from: number = clock.at(cue) / clock.duration;
  const drives: IAutoMovieMotionPropDrive[] = [
    {
      prop: source,
      articulation,
      from,
      to: clock.at("relax") / clock.duration,
      travel: (seconds: number): number => start * (1 - clock.progress(cue, "relax", seconds)),
    },
  ];
  if (crossbow) {
    const trigger: IAutoMovieAffordance | undefined = byId.get("trigger");
    if (trigger?.kind !== "trigger" || trigger.travel === undefined)
      throw refusal(source, "the depicted crossbow must declare a trigger articulation");
    const travel: number = trigger.travel;
    const press: (seconds: number) => number = AutoMovieMotionClock.prepareEnvelope(
      clock, ["start", cue], ["relax", "end"],
    );
    drives.push({
      prop: source,
      articulation: trigger.id,
      from: 0,
      to: 1,
      travel: (seconds: number): number => travel * press(seconds),
    });
  }

  return {
    ...composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      contact: cue,
      primitives: [],
    }),
    drives,
    mounts: [{ prop, onto, point, from }],
  };
}

/** Provisional screen-continuity allowance between the two displayed contact points, in metres. */
const SEATING_TOLERANCE: number = 0.002;

/** Place an authored local mark on a displayed prop frame. */
function worldPoint(frame: IAutoMovieRigidTransform, local: IAutoMovieVector3): IAutoMovieVector3 {
  return Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, local));
}

/** Report a missing or inconsistent subject in the staged transfer. */
function refusal(value: string, reason: string): HumanRefusal {
  return new HumanRefusal({
    kind: "affordance",
    axis: "continuation",
    value,
    reason,
    fix: "stage the named prop on the source socket and give its continuation a separate animation carrier",
  });
}
