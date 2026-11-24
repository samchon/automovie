import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { EquineBodyPose } from "./EquineBodyPose";
import { EquineStanceRows } from "./EquineStanceRows";

/** A named instant of a ride. */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];

/**
 * An equid's standing performance after its ride halts: authored whole-body
 * responses played one after another over the halted stance.
 *
 * The halt is the base ride's own last sample (#3908's grounded halt): its four
 * hoof endpoints are the stance's anchors and its trunk the stance's rest. Each
 * response is a row of `EquineStanceRows` that gives a whole-body pose
 * (`EquineBodyPose`) at each share of its entry, held through its hold and
 * played back through its exit, the settle; a step aside ends standing where it
 * stepped, and the next response starts from there. A response requested while
 * the base ride still moves is refused, as is one whose pose a limb cannot
 * reach or that puts a part under the floor, found when the response is
 * admitted at its key instants. Before a response, and between responses, the
 * sample is the stance at rest. The ride publishes each response's
 * `<kind>:entry`, `:hold`, `:settle` and `:end` and its support events, such as
 * `leftForeOff` and `leftForeOn`.
 */
export namespace AutoMovieArchetypeEquineStance {
  /**
   * Play responses after a ride halts.
   *
   * @param animal The equid at rest, as its producer built it.
   * @param ride Its ride, ending at a halt.
   * @param cues The responses, in time order, not overlapping.
   * @returns The ride continued by the stance.
   * @throws {AutoMovieArchetypeRefusal} For a response at a gait, overlapping
   *   or malformed phases, or a pose the rig cannot take.
   */
  export function after<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    cues: readonly AutoMovieArchetypeEquineStanceCue.Cue[],
  ): AutoMovieArchetypeRide.IRide<Id, D> {
    const body: EquineBodyPose.IPrepared<Id, D> =
      EquineBodyPose.prepare(animal);
    const halt: AutoMovieArchetypeRide.ISample<Id, D> = ride.at(ride.duration);
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      halt.archetype.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const trunk: IAutoMovieTransform = frameOf(parts.get("trunk")!);
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      trunk.rotation,
      Quaternion.inverse(body.trunk.rotation),
    );
    let state: EquineStanceRows.IState = {
      trunk: {
        rotation,
        translation: Vector3.subtract(
          trunk.translation,
          Quaternion.rotateVector(rotation, body.trunk.translation),
        ),
      },
      anchors: {
        leftFore: endpoint(parts, "leftFore"),
        rightFore: endpoint(parts, "rightFore"),
        leftHind: endpoint(parts, "leftHind"),
        rightHind: endpoint(parts, "rightHind"),
      },
    };
    const rest: EquineStanceRows.IState = state;
    const plans: EquineStanceRows.IPlan[] = [];
    let last: number = -Infinity;
    for (const cue of [...cues].sort(
      (
        p: AutoMovieArchetypeEquineStanceCue.Cue,
        q: AutoMovieArchetypeEquineStanceCue.Cue,
      ): number => p.from - q.from,
    )) {
      if (!(cue.entry > 0 && cue.hold >= 0 && cue.exit > 0) || cue.from < last)
        refuse(
          animal.archetype,
          "phases",
          cue.from,
          `the ${cue.kind} has malformed or overlapping phases`,
        );
      if (
        (cue.kind === "rear" || cue.kind === "buck") &&
        !(cue.pitch > 0 && cue.pitch < 90)
      )
        refuse(
          animal.archetype,
          "pitch",
          cue.pitch,
          `a ${cue.kind} pitches the trunk between 0 and 90 degrees`,
        );
      if (
        cue.kind === "crowHops" &&
        !(cue.count >= 1 && cue.pitch > 0 && cue.pitch < 90)
      )
        refuse(
          animal.archetype,
          "count",
          cue.count,
          "crow hops are a whole number of hops from one, each pitching between 0 and 90 degrees",
        );
      if (
        cue.kind === "spin" &&
        !(cue.degrees !== 0 && Math.abs(cue.degrees) <= 360)
      )
        refuse(
          animal.archetype,
          "degrees",
          cue.degrees,
          "a spin turns a nonzero amount up to a full turn either way",
        );
      if (cue.kind === "setBack" && !(cue.pitch > 0 && cue.pitch < 45))
        refuse(
          animal.archetype,
          "pitch",
          cue.pitch,
          "a set back drops the hindquarters between 0 and 45 degrees",
        );
      if (cue.kind === "stepAside" && !(cue.width > 0))
        refuse(
          animal.archetype,
          "width",
          cue.width,
          "a step aside steps a positive width",
        );
      if (
        (cue.kind === "capriole" || cue.kind === "courbette") &&
        !(cue.hold > 0)
      )
        refuse(
          animal.archetype,
          "hold",
          cue.hold,
          `a ${cue.kind} flies through a positive hold`,
        );
      if (cue.from < ride.duration && ride.plan.at(cue.from).speed > 0)
        refuse(
          animal.archetype,
          "from",
          cue.from,
          `the ${cue.kind} is asked for while the horse is moving`,
        );
      const plan: EquineStanceRows.IPlan = EquineStanceRows.plan(
        body,
        state,
        cue,
      );
      for (const share of plan.keys)
        try {
          body.solve(plan.goal(share), halt.placement);
        } catch (error) {
          refuse(
            animal.archetype,
            cue.kind,
            share,
            `the ${cue.kind}'s pose at share ${share} is out of the rig's reach: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

      // A hold that moves is admitted at its quarters too.
      for (const quarter of plan.hold === undefined ? [] : [0.25, 0.5, 0.75])
        try {
          body.solve(plan.hold!(quarter * cue.hold), halt.placement);
        } catch (error) {
          refuse(
            animal.archetype,
            cue.kind,
            quarter,
            `the ${cue.kind}'s held motion at ${quarter} of its hold is out of the rig's reach: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      plans.push(plan);
      state = plan.end;
      last = cue.from + cue.entry + cue.hold + cue.exit;
    }

    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> => {
      let current: EquineStanceRows.IState = rest;
      for (const plan of plans) {
        const cue: AutoMovieArchetypeEquineStanceCue.Cue = plan.cue;
        const held: number = cue.from + cue.entry;
        const settle: number = held + cue.hold;
        const end: number = settle + cue.exit;
        if (seconds < cue.from) break;
        if (seconds >= end) {
          current = plan.end;
          continue;
        }
        if (plan.hold !== undefined && seconds >= held && seconds < settle)
          return pose(plan.hold(seconds - held), seconds);
        const share: number =
          seconds < held
            ? minimumJerk.share((seconds - cue.from) / cue.entry)
            : seconds < settle
              ? 1
              : plan.end === plan.start
                ? minimumJerk.share((end - seconds) / cue.exit)
                : 1 + minimumJerk.share((seconds - settle) / cue.exit);
        return pose(plan.goal(share), seconds);
      }
      if (current === rest) return ride.at(seconds);
      return pose(EquineStanceRows.still(current), seconds);
    };
    const pose = (
      goal: EquineBodyPose.IGoal,
      seconds: number,
    ): AutoMovieArchetypeRide.ISample<Id, D> => ({
      archetype: body.solve(goal, halt.placement),
      placement: AutoMovieArchetypeFrame.copy(halt.placement),
      course: ride.plan.at(seconds),
    });
    const instants: Instant[] = [
      ...ride.instants,
      ...plans.flatMap((plan: EquineStanceRows.IPlan): Instant[] => {
        const cue: AutoMovieArchetypeEquineStanceCue.Cue = plan.cue;
        const held: number = cue.from + cue.entry;
        return [
          { seconds: cue.from, label: `${cue.kind}:entry` },
          { seconds: held, label: `${cue.kind}:hold` },
          { seconds: held + cue.hold, label: `${cue.kind}:settle` },
          { seconds: held + cue.hold + cue.exit, label: `${cue.kind}:end` },
          ...plan.events.map(
            (event: EquineStanceRows.IEvent): Instant => ({
              seconds: event.entry
                ? cue.from + event.time * cue.entry
                : plan.end === plan.start
                  ? held + cue.hold + (1 - event.time) * cue.exit
                  : held + cue.hold + event.time * cue.exit,
              label: event.label,
            }),
          ),
        ];
      }),
    ].sort((p: Instant, q: Instant): number => p.seconds - q.seconds);
    return {
      plan: ride.plan,
      duration: Math.max(ride.duration, last),
      instants,
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /** A refusal of a response. */
  function refuse(
    archetype: string,
    axis: string,
    value: unknown,
    reason: string,
  ): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis,
      value,
      feasible: null,
      reason,
      fix: "Ask for the response at a halt, with positive entry and exit, not overlapping another, and within the rig's reach.",
    });
  }

  /** A bar's start frame, the origin its rig link uses. */
  function frameOf(part: IAutoMovieModelPart): IAutoMovieTransform {
    const transform: IAutoMovieTransform = part.transform!;
    return {
      ...transform,
      translation: Vector3.subtract(
        transform.translation,
        Quaternion.rotateVector(transform.rotation, {
          x: 0,
          y: height(part) / 2,
          z: 0,
        }),
      ),
    };
  }

  /** A limb's terminal endpoint, the far end of its last bar. */
  function endpoint(
    parts: ReadonlyMap<string, IAutoMovieModelPart>,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): IAutoMovieVector3 {
    const pastern: IAutoMovieModelPart = parts.get(
      AutoMovieArchetypeQuadrupedBody.BONES[limb][3]!,
    )!;
    const frame: IAutoMovieTransform = frameOf(pastern);
    return Vector3.add(
      frame.translation,
      Quaternion.rotateVector(frame.rotation, {
        x: 0,
        y: height(pastern),
        z: 0,
      }),
    );
  }

  /** A bar part's length. */
  function height(part: IAutoMovieModelPart): number {
    return part.geometry.type === "primitive" &&
      (part.geometry.shape.type === "capsule" ||
        part.geometry.shape.type === "cylinder")
      ? part.geometry.shape.height
      : NaN;
  }
}
