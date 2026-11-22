import {
  Quaternion,
  Vector3,
  minimumJerk,
  prepareArticulatedRig,
} from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedLateralRestPlan } from "./AutoMovieArchetypeQuadrupedLateralRestPlan";
import { AutoMovieArchetypeQuadrupedRest } from "./AutoMovieArchetypeQuadrupedRest";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "./AutoMovieArchetypeQuadrupedRestPlan";
import { AutoMovieArchetypeQuadrupedSkeleton } from "./AutoMovieArchetypeQuadrupedSkeleton";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/**
 * Insert a supported lateral hold and authored roll into a sternal rest clip.
 * Lateral and sternal rest are distinct observed postures. Durations, roll
 * angle and side travel are authored rather than fitted to those observations.
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC13491436/
 *
 * @param animal The rigged animal and attached geometry to support.
 * @param restParams The existing sternal plan and its complete carrier bindings.
 * @param params Explicit rolling shape, direction and durations for this take.
 * @returns One seekable rest performance with the lateral and return cues on its own clock.
 * @throws {RangeError} For inconsistent time, geometry or support at the held side.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the input clip and world-side support, the authored time and floor and the geometry refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Insert a longitudinal roll within the sternal hold. Evaluate a common minimum-jerk roll and turn each lower-side proximal bar inward about its original joint. Carry the joined distal chain from the moved endpoint at its original folded directions, then place the model using every complete part surface.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit durations and support at both held ends, sample the existing lowering and rising through their original clip, and compose rolled placement on the middle interval.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No previous frame, guessed collider extent or altered bone length drives the performance. The caller authors coarse roll travel and time.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(B+P+A+V) FK, emission and support work in a rolling sample for B bones, P parts, A affordances and V owned geometry values. Other phases use one existing sample and the same linear support observation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The sternal clip owns lowering, carried geometry and rising. One set of posed joint frames serves lateral queries. Existing carrier emission and whole-primitive support supply current geometry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Scalar timing and snapshots of the held geometry, carrier bindings and admitted rig live only with the returned clip. Each returned frame belongs to the caller.
 */
export function AutoMovieArchetypeQuadrupedLateralRest<
  Id extends string,
  D extends string,
>(
  animal: AutoMovieArchetype<Id, D>,
  restParams: AutoMovieArchetypeQuadrupedRestPlan.IParams,
  params: AutoMovieArchetypeQuadrupedLateralRestPlan.IParams,
): AutoMovieArchetypeQuadrupedLateralRestPlan.IClip<Id, D> {
  const { floorY } = restParams;
  const { turnSeconds, holdSeconds, side, offset, rollDegrees, tuckDegrees } =
    params;
  if (
    ![floorY, turnSeconds, holdSeconds, offset, rollDegrees, tuckDegrees].every(
      Number.isFinite,
    ) ||
    !(
      turnSeconds > 0 &&
      holdSeconds >= 0 &&
      offset >= 0 &&
      rollDegrees > 0 &&
      rollDegrees <= 180 &&
      tuckDegrees >= 0 &&
      tuckDegrees < 90
    ) ||
    (side !== "left" && side !== "right")
  )
    throw new RangeError(
      "Lateral rest requires a side, finite offset, admitted durations and roll and tuck angles",
    );
  const rest: AutoMovieArchetypeQuadrupedRestPlan.IClip<Id, D> =
    AutoMovieArchetypeQuadrupedRest(animal, restParams);
  const start: number = rest.events.riseStart;
  const sideOn: number = start + turnSeconds;
  const sideOff: number = sideOn + holdSeconds;
  const sternal: number = sideOff + turnSeconds;
  const extended: number = sternal - start;
  const end: number = rest.duration + extended;
  if (
    !(
      Number.isFinite(end) &&
      start < sideOn &&
      sideOn <= sideOff &&
      sideOff < sternal
    )
  )
    throw new RangeError("The roll clock is unrepresentable");
  const sign: number = side === "left" ? 1 : -1;

  // Both halves join the same independently sampled sternal animal.
  const held: AutoMovieArchetypeQuadrupedRestPlan.ISample<Id, D> =
    rest.sample(start);
  const base: Bound = support(held.animal, rotation(0));
  if (!held.bellySupported || Math.abs(base.lowest - floorY) > 1e-9)
    throw new RangeError(
      "Lateral rest requires an admitted sternal support at entry",
    );
  const neutral: ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Bone,
    IAutoMovieTransform
  > = prepareArticulatedRig(
    AutoMovieArchetypeQuadrupedSkeleton.of(held.animal),
  ).read();
  const partCarriers: AutoMovieArchetypeQuadrupedRestPlan.IParams["parts"] = {
    ...restParams.parts,
  };
  const contactCarriers: AutoMovieArchetypeQuadrupedRestPlan.IParams["contacts"] =
    {
      ...restParams.contacts,
    };
  const lowSide: readonly (readonly AutoMovieArchetypeQuadrupedBody.Bone[])[] =
    [
      AutoMovieArchetypeQuadrupedBody.BONES[
        side === "left" ? "leftFore" : "rightFore"
      ],
      AutoMovieArchetypeQuadrupedBody.BONES[
        side === "left" ? "leftHind" : "rightHind"
      ],
    ];
  const sideSole: Bound = support(tuck(1), rotation(1));
  if (sideSole.body > sideSole.lowest + 1e-9)
    throw new RangeError(
      `The ${side} lateral rest at ${rollDegrees} degrees rests on ${sideSole.sites.join(", ")} and leaves the flank ${sideSole.body - sideSole.lowest} m above the floor`,
    );

  return {
    duration: end,
    events: Object.freeze({
      rollStart: start,
      lateralOn: sideOn,
      lateralOff: sideOff,
      sternal,
      standing: rest.events.standing + extended,
    }),
    sample,
  };

  /** Turn each proximal bar inward and keep the attached distal fold carried by its endpoint. */
  function tuck(amount: number): AutoMovieArchetype<Id, D> {
    const joints: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    > = new Map(neutral);
    for (const [bone, next, ...distal] of lowSide) {
      const root: IAutoMovieTransform = neutral.get(bone!)!;
      const joint: IAutoMovieTransform = neutral.get(next!)!;
      const link: IAutoMovieVector3 = Vector3.subtract(
        joint.translation,
        root.translation,
      );
      const inward: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        Vector3.cross(link, { x: -sign, y: 0, z: 0 }),
        tuckDegrees * amount,
      );
      const shift: IAutoMovieVector3 = Vector3.subtract(
        Quaternion.rotateVector(inward, link),
        link,
      );
      joints.set(bone!, {
        ...root,
        rotation: Quaternion.multiply(inward, root.rotation),
      });
      for (const child of [next!, ...distal]) {
        const frame: IAutoMovieTransform = neutral.get(child)!;
        joints.set(child, {
          ...frame,
          translation: Vector3.add(frame.translation, shift),
        });
      }
    }
    return AutoMovieArchetypeQuadrupedSkeleton.apply(
      held.animal,
      neutral,
      joints,
      partCarriers,
      contactCarriers,
    );
  }

  /** Map the explicit rotation fraction to a reflected, reversible path. */
  function rotation(amount: number): IAutoMovieTransform {
    return {
      translation: { x: sign * offset * amount, y: 0, z: 0 },
      rotation: Quaternion.fromAxisAngle(
        { x: 0, y: 0, z: 1 },
        -sign * rollDegrees * amount,
      ),
      scale: { x: 1, y: 1, z: 1 },
    };
  }

  /** Return one stateless composable rest frame on the expanded time line. */
  function sample(
    seconds: number,
  ): AutoMovieArchetypeQuadrupedLateralRestPlan.ISample<Id, D> {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > end)
      throw new RangeError("Lateral rest time lies outside the authored clip");
    if (seconds < start || seconds >= sternal) {
      const original: AutoMovieArchetypeQuadrupedRestPlan.ISample<Id, D> =
        rest.sample(
          seconds < start
            ? seconds
            : Math.min(rest.duration, seconds - extended),
        );
      const placement: IAutoMovieTransform = AutoMovieArchetypeFrame.upright({
        x: 0,
        y: 0,
        z: 0,
      });
      return {
        animal: original.animal,
        placement,
        support: support(original.animal, placement).sites,
        phase: original.phase,
      };
    }
    const entering: boolean = seconds < sideOn;
    const holding: boolean = seconds >= sideOn && seconds < sideOff;
    const fraction: number = entering
      ? minimumJerk((seconds - start) / turnSeconds).s
      : holding
        ? 1
        : minimumJerk((sternal - seconds) / turnSeconds).s;
    const animal: AutoMovieArchetype<Id, D> = tuck(fraction);
    const placement: IAutoMovieTransform = rotation(fraction);
    const bound: Bound = support(animal, placement);
    placement.translation.y = floorY - bound.lowest;
    return {
      animal,
      placement,
      support: bound.sites,
      phase: entering
        ? "rolling-to-side"
        : holding
          ? "lateral"
          : "rolling-to-sternum",
    };
  }
}

/** The low surface heights and all coincident lowest part ids. */
interface Bound {
  /** Lowest supported surface before vertical placement, metres. */
  lowest: number;
  /** Lowest of the trunk and hindquarters surfaces, metres. */
  body: number;
  /** Parts supplying the lowest support. */
  sites: readonly string[];
}

/** Find the exact set support over the transformed rigid primitives. */
function support(
  animal: Pick<AutoMovieArchetype, "parts">,
  placement: IAutoMovieTransform,
): Bound {
  let lowest: number = Infinity;
  let body: number = Infinity;
  const bounds: { id: string; height: number }[] = [];
  for (const part of animal.parts) {
    if (part.transform === null || part.transform === undefined)
      throw new RangeError(`Lateral rest requires a posed part ${part.id}`);
    const posed: IAutoMovieModelPart = {
      ...part,
      transform: AutoMovieArchetypeFrame.compose(placement, part.transform),
    };
    const height: number = QuadrupedRestFloor(posed);
    lowest = Math.min(height, lowest);
    if (part.id === "trunk" || part.id === "hindquarters")
      body = Math.min(body, height);
    bounds.push({ id: part.id, height });
  }
  if (!Number.isFinite(lowest) || !Number.isFinite(body))
    throw new RangeError("Lateral rest requires the actual supported body");
  return {
    lowest,
    body,
    sites: bounds
      .filter(
        (bound: { height: number }): boolean =>
          Math.abs(bound.height - lowest) <= 1e-9,
      )
      .map((bound: { id: string }): string => bound.id),
  };
}
