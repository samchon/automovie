import {
  type AutoMoviePhysicsCache as Cache,
  preparePhysicalGeometry as Geometry,
  auditPhysicalOutcomes as audit,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import { filmContactIntent } from "../motion/contact/filmContactIntent";
import { Strike } from "../motion/striking/Strike";
import { FilmEvents } from "../runtime/FilmEvents";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import type { AudioMix } from "../sound/AudioMix";

/** Adapt explicit screenplay promises to shared physical receipts, retaining every failed outcome for one inspection round. */
export namespace BoutReceipts {
  /** Production audio identities and the actual episodes which justify them. */
  export interface IResult {
    /** Accepted strike/touch audio events. */
    contacts: AudioMix.Contact[];
    /** Actual hip and shoulder arrivals. */
    mats: AudioMix.FloorContact[];
    /** Actual striking episodes, classified by their measured receiver. */
    impacts: {
      actionId: string;
      relation: AudioMix.Contact["relation"];
      receipt: Receipt;
    }[];
    /** Every failed scripted promise. */
    findings: audit.IFinding[];
  }
  /** Measure a complete or explicitly bounded review interval without promoting a gap to contact. */
  export async function measure(input: {
    /** Same physical profiles as the solver and display. */ profiles: Record<
      FilmPlan.ActorId,
      P
    >;
    /** Completed physical or explicitly geometric observations. */ contacts: readonly Receipt[];
    /** Actual displayed states in absolute film seconds. */ at: (
      seconds: number,
    ) => Cache.IFrame;
    /** First absolute review second. */ start: number;
    /** Last absolute review second. */ end: number;
    /** Required observation provenance. */ source: "solver" | "geometric";
    /** Declared comparison estimates remain separate from solver measurements. */ geometricImpulses?: Readonly<
      Record<string, number>
    >;
  }): Promise<IResult> {
    const geometry: Geometry.IQueries = await Geometry();
    const planned: BoutScript.Action[] = BoutScript.actions.filter(
      (action: BoutScript.Action): boolean => {
        const [start, end]: readonly [number, number] = Strike.window(action);
        return start <= input.end && end >= input.start;
      },
    );
    const promises: audit.IAction[] = planned.map(
      (action: BoutScript.Action): audit.IAction => {
        const actor: BoutScript.Fighter = action.actor;
        const target: BoutScript.Fighter = actor === "a" ? "b" : "a";
        const intent: filmContactIntent.IIntent = filmContactIntent(action);
        const relation: AudioMix.Contact["relation"] | null =
          FilmEvents.relation(action);
        const bones: string[] =
          relation === "head"
            ? ["head"]
            : relation === "body"
              ? BoutScript.specs[action.technique].target === "leg"
                ? [
                    "leftUpperLeg",
                    "rightUpperLeg",
                    "leftLowerLeg",
                    "rightLowerLeg",
                  ]
                : ["spine", "chest"]
              : relation === "guard"
                ? [
                    "leftHand",
                    "rightHand",
                    "leftLowerArm",
                    "rightLowerArm",
                    "leftUpperArm",
                    "rightUpperArm",
                  ]
                : relation === "shin-check"
                  ? ["leftLowerLeg"]
                  : input.profiles[target].segments.map(
                      (segment: P.ISegment): string => segment.bone,
                    );
        const [start, end]: readonly [number, number] = Strike.window(action);
        return {
          id: action.id,
          actor,
          target,
          seconds: action.at,
          tolerance: Math.max(action.at - start, end - action.at),
          actorShapes: shapes(
            input.profiles[actor],
            intent.kick && relation === null
              ? ["UpperLeg", "LowerLeg", "Foot", "Subtalar", "Midfoot"].map(
                  (part: string): string => `${intent.side}${part}`,
                )
              : [intent.sourceBone],
            !intent.kick,
          ),
          targetShapes: shapes(input.profiles[target], bones),
          expected: relation ? "contact" : "miss",
          source: input.source,
        };
      },
    );
    for (const promise of [...promises]) {
      const action: BoutScript.Action = planned.find(
        (candidate: BoutScript.Action): boolean => candidate.id === promise.id,
      )!;
      const relation: AudioMix.Contact["relation"] | null =
        FilmEvents.relation(action);
      if (relation !== "guard" && relation !== "shin-check") continue;
      promises.push({
        ...promise,
        id: `${promise.id}:protected-trunk`,
        expected: "miss",
        actorShapes: filmContactIntent(action).kick
          ? shapes(
              input.profiles[promise.actor as FilmPlan.ActorId],
              ["UpperLeg", "LowerLeg", "Foot", "Subtalar", "Midfoot"].map(
                (part: string): string =>
                  `${filmContactIntent(action).side}${part}`,
              ),
            )
          : promise.actorShapes,
        targetShapes: shapes(
          input.profiles[promise.target as FilmPlan.ActorId],
          ["head", "neck", "atlas", "spine", "chest"],
        ),
      });
    }
    if (input.start <= 1 && input.end >= 1)
      promises.unshift({
        id: "touch",
        seconds: 1,
        tolerance: 0.4,
        actor: "a",
        target: "b",
        actorShapes: shapes(input.profiles.a, ["leftHand"], true),
        targetShapes: shapes(input.profiles.b, ["leftHand"], true),
        expected: "contact",
        source: input.source,
      });
    const contacts: AudioMix.Contact[] = [];
    const impacts: IResult["impacts"] = [];
    for (const promise of promises) {
      if (promise.expected === "miss") continue;
      const receipts: Receipt[] = input.contacts
        .filter((receipt: Receipt): boolean => matches(promise, receipt))
        .map((receipt: Receipt): Receipt => {
          const samples: Receipt["samples"] = receipt.samples?.filter(
            (sample: NonNullable<Receipt["samples"]>[number]): boolean =>
              Math.abs(sample.seconds - promise.seconds) <= promise.tolerance &&
              sample.impulse > 0 &&
              sample.separation <= 0,
          );
          if (!samples?.length) return receipt;
          return {
            ...receipt,
            id: `${receipt.id}/${promise.id}`,
            seconds: samples[0]!.seconds,
            endSeconds: samples.at(-1)!.seconds,
            point: samples[0]!.point,
            normal: samples[0]!.normal,
            samples,
            impulse: samples.reduce(
              (
                sum: number,
                sample: NonNullable<Receipt["samples"]>[number],
              ): number => sum + sample.impulse,
              0,
            ),
            separation: Math.min(
              ...samples.map(
                (sample: NonNullable<Receipt["samples"]>[number]): number =>
                  sample.separation,
              ),
            ),
            compression: Math.max(
              ...samples.map(
                (sample: NonNullable<Receipt["samples"]>[number]): number =>
                  sample.compression,
              ),
            ),
          };
        });
      const receipt: Receipt | undefined = receipts.sort(
        (a: Receipt, b: Receipt): number => a.seconds - b.seconds,
      )[0];
      if (!receipt) continue;
      const action: BoutScript.Action | undefined = planned.find(
        (candidate: BoutScript.Action): boolean => candidate.id === promise.id,
      );
      const relation: AudioMix.Contact["relation"] = action
        ? FilmEvents.relation(action)!
        : "guard";
      contacts.push({
        eventId: promise.id === "touch" ? "touch" : `contact:${promise.id}`,
        actionId: promise.id,
        actorId: promise.actor as FilmPlan.ActorId,
        targetId: promise.target as FilmPlan.ActorId,
        seconds: receipt.seconds,
        relation,
        provenance: `${receipt.source} episode ${receipt.id}; ${receipt.impulse === null ? `comparison normal impulse estimate ${input.geometricImpulses?.[receipt.id] ?? "unavailable"}` : `measured normal impulse ${receipt.impulse}`} N s; separation ${receipt.separation} m`,
      });
      if (action)
        for (const actual of receipts)
          impacts.push({ actionId: action.id, relation, receipt: actual });
    }
    const mats: AudioMix.FloorContact[] = [];
    for (const [bodyPart, bones] of [
      ["hip", ["hips", "rightUpperLeg"]],
      ["shoulder", ["rightUpperArm"]],
    ] as const) {
      const receipt: Receipt | undefined = input.contacts
        .filter(
          (candidate: Receipt): boolean =>
            candidate.source === input.source &&
            candidate.seconds >= BoutScript.finish.at &&
            candidate.separation <= 0 &&
            (input.source === "geometric"
              ? candidate.impulse === null
              : (candidate.impulse ?? 0) > 0) &&
            ((candidate.a.body === "b" &&
              bones.some(
                (bone: string): boolean => bone === candidate.a.bone,
              ) &&
              candidate.b.body === "floor") ||
              (candidate.b.body === "b" &&
                bones.some(
                  (bone: string): boolean => bone === candidate.b.bone,
                ) &&
                candidate.a.body === "floor")),
        )
        .sort((a: Receipt, b: Receipt): number => a.seconds - b.seconds)[0];
      if (receipt)
        mats.push({
          eventId: `fall:${bodyPart}`,
          actorId: "b",
          seconds: receipt.seconds,
          bodyPart,
          provenance: `${receipt.source} floor episode ${receipt.id}; impulse ${receipt.impulse} N s`,
        });
    }
    const findings: audit.IFinding[] = audit({
      actions: promises.filter(
        (promise: audit.IAction): boolean =>
          promise.expected === "miss" ||
          (promise.seconds - promise.tolerance >= input.start &&
            promise.seconds + promise.tolerance <= input.end),
      ),
      contacts: [...input.contacts],
      falls:
        input.end >= 152
          ? [{ id: "finish-fall", body: "b", seconds: 151, tolerance: 1 }]
          : [],
      observedFalls: mats.some(
        (mat: AudioMix.FloorContact): boolean => mat.bodyPart === "hip",
      )
        ? {
            b: mats.find(
              (mat: AudioMix.FloorContact): boolean => mat.bodyPart === "hip",
            )!.seconds,
          }
        : {},
      allowUnplanned: (receipt: Receipt): boolean =>
        receipt.a.body === "floor" ||
        receipt.b.body === "floor" ||
        receipt.a.body === receipt.b.body ||
        promises.some(
          (promise: audit.IAction): boolean =>
            Math.abs(receipt.seconds - promise.seconds) <= promise.tolerance &&
            ((receipt.a.body === promise.actor &&
              receipt.b.body === promise.target) ||
              (receipt.b.body === promise.actor &&
                receipt.a.body === promise.target)),
        ),
      missDistance: (promise: audit.IAction): number => {
        let distance: number = Infinity;
        for (let sample: number = 0; sample <= 8; sample++) {
          const seconds: number = Math.max(
            input.start,
            Math.min(
              input.end,
              promise.seconds + (sample / 4 - 1) * promise.tolerance,
            ),
          );
          const frame: Cache.IFrame = input.at(seconds);
          for (const a of colliders(
            input.profiles[promise.actor as FilmPlan.ActorId],
            promise.actor,
            frame,
            promise.actorShapes,
          ))
            for (const b of colliders(
              input.profiles[promise.target as FilmPlan.ActorId],
              promise.target,
              frame,
              promise.targetShapes,
            ))
              distance = Math.min(
                distance,
                geometry.contact(a, b, seconds, 10)?.separation ?? Infinity,
              );
        }
        return distance;
      },
    });
    if (input.end >= 152) {
      const hip: AudioMix.FloorContact | undefined = mats.find(
        (mat: AudioMix.FloorContact): boolean => mat.bodyPart === "hip",
      );
      const shoulder: AudioMix.FloorContact | undefined = mats.find(
        (mat: AudioMix.FloorContact): boolean => mat.bodyPart === "shoulder",
      );
      if (
        !hip ||
        !shoulder ||
        shoulder.seconds < hip.seconds ||
        shoulder.seconds > 152
      )
        findings.push({
          actionId: "finish-shoulder",
          kind: "wrong-fall",
          seconds: shoulder?.seconds ?? 152,
          missDistance: null,
          message:
            "Finish requires actual hip then shoulder floor arrivals by 152 seconds",
        });
    }
    return { contacts, mats, impacts, findings };
  }
}

/** Select exact scoped colliders; a punch uses the declared equipment instead of the hand's skin capsule. */
function shapes(
  profile: P,
  bones: readonly string[],
  gloves: boolean = false,
): string[] {
  return profile.segments
    .filter((segment: P.ISegment): boolean => bones.includes(segment.bone))
    .flatMap((segment: P.ISegment): string[] =>
      segment.shapes
        .filter(
          (shape: P.IShape): boolean => !gloves || shape.material === "glove",
        )
        .map((shape: P.IShape): string => shape.id),
    );
}

/** Match a positive native episode only within the explicit weapon, receiver and time promise. */
function matches(action: audit.IAction, receipt: Receipt): boolean {
  return (
    audit({
      actions: [action],
      contacts: [receipt],
      falls: [],
      observedFalls: {},
      missDistance: (): number => 0,
      allowUnplanned: (): boolean => true,
    }).length === 0
  );
}

/** Borrow actual profile shapes in the displayed physical frame for diagnostic distances. */
function colliders(
  profile: P,
  body: string,
  frame: Cache.IFrame,
  selected: readonly string[],
): Geometry.ICollider[] {
  return profile.segments.flatMap((segment: P.ISegment): Geometry.ICollider[] =>
    segment.shapes
      .filter((shape: P.IShape): boolean => selected.includes(shape.id))
      .map(
        (shape: P.IShape): Geometry.ICollider => ({
          body,
          bone: segment.bone,
          pose: frame.bodies[body]![segment.bone]!,
          shape,
        }),
      ),
  );
}
