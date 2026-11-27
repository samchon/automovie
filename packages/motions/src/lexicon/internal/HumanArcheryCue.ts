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

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Hand the staged arrow or bolt to a scene-authored animation carrier on the
 * same cue that returns the visible string to its rest pose. The carrier
 * supplies all post-cue prop movement. The performer keeps the carrier's pose.
 */
export function HumanArcheryCue(
  context: IAutoMovieMotionHumanActionContext,
  continuation: IAutoMovieMotionHumanLexiconArcheryParams.IContinuation,
  crossbow: boolean,
): IAutoMovieMotionHumanActionPlan {
  const { source, prop, onto, point } = continuation;
  if (source === prop || source === onto || prop === onto)
    throw refusal(
      prop,
      "the source, transferable prop and animation carrier must be distinct",
    );
  const carrier: IAutoMovieMotionHumanPropReader = context.prop(onto);
  if (
    !carrier.prop.affordances?.some(
      (a: IAutoMovieAffordance): boolean =>
        a.id === point && a.kind === "socket",
    )
  )
    throw refusal(
      `${onto}.${point}`,
      "the animation carrier must declare the selected socket",
    );

  const beat: number = AutoMovieMotionHumanTiming.PAUSES.brief;
  const cue: string = crossbow ? "strokeStart" : "open";
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(3 * beat, [
    { name: cue, seconds: beat },
    { name: "relax", seconds: 2 * beat },
  ]);
  const at: number = context.start + clock.at(cue);
  const fixture: IAutoMovieMotionHumanPropReader = context.prop(source);
  const moved: IAutoMovieMotionHumanPropReader = context.prop(prop);
  if (
    moved.prop.motion !== undefined ||
    moved.prop.fixed === true ||
    moved.prop.soft !== undefined
  )
    throw refusal(
      prop,
      "the transferable prop must allow a rigid socket mount",
    );
  if (moved.launchAt?.(at) !== undefined)
    throw refusal(prop, "this prop already has an active continuation");
  const byId: ReadonlyMap<string, IAutoMovieAffordance> = new Map(
    (fixture.prop.affordances ?? []).map(
      (a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a],
    ),
  );
  const state: Readonly<Record<string, number>> = fixture.state?.(at) ?? {};
  const articulation: string | null = AffordanceArticulation.leader(
    byId,
    "string",
  );
  const start: number | null =
    articulation === null
      ? null
      : AffordanceArticulation.travel(byId, state, articulation);
  if (
    articulation === null ||
    start === null ||
    start <= 0 ||
    fixture.prop.articulate === undefined
  )
    throw refusal(
      source,
      "the staged string must already be held away from its rest pose",
    );

  const nock: IAutoMovieAffordance | undefined = fixture.prop
    .articulate(state)
    .affordances.find(
      (a: IAutoMovieAffordance): boolean =>
        a.id === "nock" && a.kind === "socket",
    );
  const tail: IAutoMovieVector3 | undefined = moved.prop.points.nock?.point;
  if (
    nock === undefined ||
    tail === undefined ||
    Vector3.distance(
      worldPoint(fixture.frame(at), nock.frame.translation),
      worldPoint(moved.frame(at), tail),
    ) > SEATING_TOLERANCE
  )
    throw refusal(
      prop,
      `the prop must be seated at ${source}.nock when the cue occurs`,
    );

  const from: number = clock.at(cue) / clock.duration;
  const drives: IAutoMovieMotionPropDrive[] = [
    {
      prop: source,
      articulation,
      from,
      to: clock.at("relax") / clock.duration,
      travel: (seconds: number): number =>
        start * (1 - clock.progress(cue, "relax", seconds)),
    },
  ];
  if (crossbow) {
    const trigger: IAutoMovieAffordance | undefined = byId.get("trigger");
    if (trigger?.kind !== "trigger" || trigger.travel === undefined)
      throw refusal(
        source,
        "the depicted crossbow must declare a trigger articulation",
      );
    const travel: number = trigger.travel;
    const press: (seconds: number) => number =
      AutoMovieMotionClock.prepareEnvelope(
        clock,
        ["start", cue],
        ["relax", "end"],
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

/*
 * Provisional screen-continuity allowance between the two displayed contact
 * points, in metres.
 */
const SEATING_TOLERANCE: number = 0.002;

/*
 * Place an authored local mark on a displayed prop frame.
 */
function worldPoint(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}

/*
 * Report a missing or inconsistent subject in the staged transfer.
 */
function refusal(value: string, reason: string): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "affordance",
    axis: "continuation",
    value,
    reason,
    fix: "stage the named prop on the source socket and give its continuation a separate animation carrier",
  });
}
