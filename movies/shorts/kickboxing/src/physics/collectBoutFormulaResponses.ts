import {
  Quaternion,
  Vector3,
  physicalSupportPoint,
  preparePhysicalGeometry,
  resolveImpact,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import { filmContactIntent } from "../motion/contact/filmContactIntent";
import { BoutFormulaResponse } from "../motion/reactions/BoutFormulaResponse";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";

/** Observe real profile surfaces on the authored performance. Each adopted response starts at its measurement, so preparing later contacts can include earlier responses without changing the past. */
export async function collectBoutFormulaResponses(input: {
  /** The same provider descriptions used by fitting and drawing. */
  profiles: Readonly<Record<FilmPlan.ActorId, P>>;
  /** Actual completed world frames; this callback never places a display or runs a dynamics world. */
  at: (seconds: number) => collectBoutFormulaResponses.IFrames;
  /** Install the complete causal prefix before observing the next interaction. */
  adopt: (contacts: readonly BoutFormulaResponse.IContact[]) => void;
  /** Closed absolute source interval. */
  start: number;
  /** Last admitted source second. */
  end: number;
  /** Existing product progress reporting, independent of acceptance. */
  progress?: (action: string, completed: number, total: number) => void;
}): Promise<BoutFormulaResponse.IContact[]> {
  if (
    !Number.isFinite(input.start) ||
    !Number.isFinite(input.end) ||
    input.start < 0 ||
    input.end < input.start ||
    input.end > 180
  )
    throw new Error("Invalid comparison response interval");
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  const actions: BoutScript.Action[] = BoutScript.actions
    .filter(
      (action: BoutScript.Action): boolean =>
        action.at >= input.start && action.at <= input.end,
    )
    .sort(
      (a: BoutScript.Action, b: BoutScript.Action): number =>
        a.at - b.at || a.id.localeCompare(b.id),
    );
  const result: BoutFormulaResponse.IContact[] = [];
  input.adopt(result);
  for (const [index, action] of actions.entries()) {
    const intent: filmContactIntent.IIntent = filmContactIntent(action);
    if (!intent.relation) continue;
    const actor: BoutScript.Fighter = action.actor;
    const other: BoutScript.Fighter = actor === "a" ? "b" : "a";
    const source: P.ISegment = segment(
      input.profiles[actor],
      intent.sourceBone,
    );
    const receiver: P.ISegment = segment(
      input.profiles[other],
      intent.targetBone,
    );
    const seconds: number = action.at;
    const previousSeconds: number = Math.max(
      input.start,
      seconds - 1 / Settings.rate,
    );
    const previous: collectBoutFormulaResponses.IFrames =
      input.at(previousSeconds);
    const actual: collectBoutFormulaResponses.IFrames = input.at(seconds);
    let selected: BoutFormulaResponse.IContact | undefined;
    for (const own of source.shapes.filter(
      (shape: P.IShape): boolean => intent.kick || shape.material === "glove",
    ))
      for (const target of receiver.shapes.filter(
        (shape: P.IShape): boolean =>
          !intent.targetBone.endsWith("Hand") || shape.material === "glove",
      )) {
        const receipt: Receipt | null = geometry.contact(
          {
            body: actor,
            bone: source.bone,
            shape: own,
            pose: actual[actor][source.bone]!,
          },
          {
            body: other,
            bone: receiver.bone,
            shape: target,
            pose: actual[other][receiver.bone]!,
          },
          seconds,
        );
        if (!receipt || receipt.separation > 0) continue;
        const estimate: number = collectBoutFormulaResponses.estimate(
          receipt,
          input.profiles,
          previous,
          actual,
          seconds - previousSeconds,
        );
        if (selected && selected.normalImpulseEstimate >= estimate) continue;
        selected = {
          receiptId: receipt.id,
          actionId: action.id,
          actorId: other,
          seconds: receipt.seconds,
          relation: intent.relation,
          normalImpulseEstimate: estimate,
          source: "geometric",
        };
      }
    if (selected) {
      result.push(selected);
      input.adopt(result);
    }
    input.progress?.(action.id, index + 1, actions.length);
    if (index % 8 === 7)
      await new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 0);
      });
  }
  return BoutFormulaResponse.admit(result);
}

/** No local collision, impulse or articulated mass algorithm is introduced here. */
export namespace collectBoutFormulaResponses {
  /** World carrier transforms from the actual source, independent of a render history. */
  export type IFrames = Record<
    FilmPlan.ActorId,
    Readonly<Record<string, P.ITransform>>
  >;

  /** Estimate normal impulse with the existing public two-segment formula and measured witness velocities. Rotation is included by carrying each contact witness through both actual poses. */
  export function estimate(
    receipt: Receipt,
    profiles: Readonly<Record<string, P>>,
    previous: Readonly<Record<string, Readonly<Record<string, P.ITransform>>>>,
    actual: Readonly<Record<string, Readonly<Record<string, P.ITransform>>>>,
    duration: number,
  ): number {
    if (receipt.source !== "geometric" || receipt.impulse !== null)
      throw new Error("Comparison recoil requires a geometric contact");
    if (duration === 0) return 0;
    if (!Number.isFinite(duration) || duration < 0)
      throw new Error(
        "Comparison velocity interval must be finite and nonnegative",
      );
    const body: (side: Receipt["a"]) => Parameters<typeof resolveImpact>[0] = (
      side: Receipt["a"],
    ): Parameters<typeof resolveImpact>[0] => {
      const profile: P = profiles[side.body]!;
      const carrier: P.ISegment = segment(profile, side.bone);
      const pose: P.ITransform = actual[side.body]![side.bone]!;
      const local: P.ITransform["position"] = Quaternion.rotateVector(
        Quaternion.inverse(pose.rotation),
        Vector3.subtract(receipt.point, pose.position),
      );
      const before: P.ITransform["position"] = physicalSupportPoint(
        previous[side.body]![side.bone]!,
        local,
      );
      return {
        mass: carrier.mass,
        velocity: Vector3.scale(
          Vector3.subtract(receipt.point, before),
          1 / duration,
        ),
        restitution: profile.materials.find(
          (material: P.IMaterial): boolean => material.id === side.material,
        )!.restitution,
        hardness: 1,
        penetrability: 0,
      };
    };
    return Vector3.length(
      resolveImpact(body(receipt.a), body(receipt.b), receipt.normal).impulse,
    );
  }
}

/** Exact profile lookup; missing production input is refused rather than replaced with a guessed mass or shape. */
function segment(profile: P, bone: string): P.ISegment {
  const found: P.ISegment | undefined = profile.segments.find(
    (candidate: P.ISegment): boolean => candidate.bone === bone,
  );
  if (!found) throw new Error(`Unknown comparison carrier ${bone}`);
  return found;
}
