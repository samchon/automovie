import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineMath,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedJoints } from "./AutoMovieArchetypeQuadrupedJoints";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "./AutoMovieArchetypeQuadrupedRestPlan";
import { QuadrupedPose } from "./quadruped/QuadrupedPose";
import type { QuadrupedPosePlan } from "./quadruped/QuadrupedPosePlan";
import { QuadrupedRestFloor } from "./quadruped/QuadrupedRestFloor";
import { QuadrupedRestLimb } from "./quadruped/QuadrupedRestLimb";

/** Plans an authored standing, sternal-rest and rise cycle for a quadruped. */
export namespace AutoMovieArchetypeQuadrupedRest {
  /**
   * Plans a symmetric sternal-rest cycle at fixed foot footprints.
   *
   * Each terminal-bar cap keeps its source X/Z position and adjusts height
   * for sole clearance as it rotates. The trunk determines the resting
   * height. The declared carriers keep attached parts and contacts on their
   * bones throughout the cycle. Descent reverses the authored rise geometry.
   *
   * @param animal Source rest model. Sample poses use independent records.
   * @param params Floor, clock, distal settings, phase windows and carriers.
   * @returns A finite clip with belly-contact, rise and standing event times
   *   and independently evaluated samples.
   * @throws {RangeError} If clock or geometry admission fails, or if a
   *   requested sample misses a foot goal or penetrates the floor.
   */
  export function plan<
    Id extends string,
    Dimension extends string,
  >(
    animal: AutoMovieArchetype<Id, Dimension>,
    params: AutoMovieArchetypeQuadrupedRestPlan.IParams,
  ): AutoMovieArchetypeQuadrupedRestPlan.IClip<Id, Dimension> {
    const floorY: number = params.floorY;
    if (!Number.isFinite(floorY))
      throw new RangeError("Rest floor height must be finite");
    const lowering: number = positive(params.loweringSeconds, "loweringSeconds");
    const resting: number = params.restingSeconds;
    const rising: number = positive(params.risingSeconds, "risingSeconds");
    const pitch: number = params.restPitch;
    const tailAngle: number = params.tailDirection;
    if (!(Math.abs(tailAngle) <= 180))
      throw new RangeError(
        "Rest tail direction must be within [-180, 180] degrees",
      );
    if (!Number.isFinite(resting) || resting < 0 || !(Math.abs(pitch) < 90))
      throw new RangeError(
        "Rest requires finite nonnegative hold time and |restPitch| < 90 degrees",
      );
    const riseStart: number = lowering + resting;
    const duration: number = riseStart + rising;
    if (!Number.isFinite(duration))
      throw new RangeError("Rest cycle duration must be finite");
    const windows: Record<
      "body" | "fore" | "hind",
      AutoMovieArchetypeQuadrupedRestPlan.IWindow
    > = {
      body: window(params.windows.body),
      fore: window(params.windows.fore),
      hind: window(params.windows.hind),
    };
    const folded: Record<"fore" | "hind", readonly [number, number]> = {
      fore: directions(params.folded.fore),
      hind: directions(params.folded.hind),
    };
    const partCarriers: Readonly<
      Record<string, AutoMovieArchetypeQuadrupedBody.Bone>
    > = {
      ...params.parts,
    };
    const contactCarriers: Readonly<
      Record<string, AutoMovieArchetypeQuadrupedBody.Bone>
    > = {
      ...params.contacts,
    };
    const prepared: QuadrupedPosePlan.IPrepared<Id, Dimension> = QuadrupedPose(
      animal,
      partCarriers,
      contactCarriers,
    );
    const neutral: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    > = prepared.read().frames;
    const neutralTail: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      neutral.get("tail")!.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const tailTurn: IAutoMovieTransform["rotation"] = AutoMovieEngineMath.rotationBetween(
      neutralTail,
      {
        x: 0,
        y: -Math.cos((tailAngle * Math.PI) / 180),
        z: Math.sin((tailAngle * Math.PI) / 180),
      },
    );
    const source: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read> =
      AutoMovieArchetypeQuadrupedJoints.read(animal.parts);
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          structuredClone(part),
        ],
      ),
    );
    const cells: AutoMovieArchetype["convexCells"] = animal.convexCells;
    for (const part of animal.parts) QuadrupedRestFloor(part, cells);
    const trunk: IAutoMovieModelPart = bar("trunk");
    const restTurn: IAutoMovieTransform["rotation"] = AutoMovieEngineQuaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      pitch,
    );
    const rotatedTrunk: IAutoMovieModelPart = {
      ...trunk,
      transform: AutoMovieArchetypeFrame.move(
        { rotation: restTurn, translation: { x: 0, y: 0, z: 0 } },
        trunk.transform!,
      ),
    };
    const lowRoot: number = floorY - QuadrupedRestFloor(rotatedTrunk);

    // The smallest sole correction preserves the reach of a source limb that
    // already stands straight; the remaining legs flex onto their own soles.
    // Raising every root by the largest correction could overextend that limb.
    const highRoot: number =
      floorY -
      Math.max(
        ...AutoMovieArchetypeQuadrupedBody.LIMBS.map(
          (limb: AutoMovieArchetypeQuadrupedBody.Limb): number =>
            QuadrupedRestFloor(
              bar(AutoMovieArchetypeQuadrupedBody.BONES[limb][3]),
            ),
        ),
      );
    if (!(lowRoot < highRoot))
      throw new RangeError(
        "The actual trunk support does not lie below standing support",
      );
    const scale: number = Math.max(
      1,
      Math.abs(floorY),
      ...[...neutral.values()].map((frame: IAutoMovieTransform): number =>
        AutoMovieEngineVector3.length(frame.translation),
      ),
    );

    // A fixed number of rigid compositions and circle operations accumulates
    // binary64 error. This budget scales with coordinates, never with a desired
    // floor gap or a missed contact that should instead be refused.
    const roundoff: number = 256 * Number.EPSILON * scale;
    const standing: number =
      riseStart +
      rising *
        Math.max(
          windows.body.endShare,
          windows.fore.endShare,
          windows.hind.endShare,
        );
    return {
      duration,
      events: Object.freeze({
        bellyOn: lowering * (1 - windows.body.startShare),
        riseStart,
        bellyOff: riseStart + rising * windows.body.startShare,
        standing,
      }),
      sample,
    };

    /*
     * Evaluate the complete independently posed sample from its finite clock.
     */
    function sample(
      seconds: number,
    ): AutoMovieArchetypeQuadrupedRestPlan.ISample<Id, Dimension> {
      if (!(seconds >= 0 && seconds <= duration))
        throw new RangeError(
          `Rest sample time must be in [0, ${duration}] seconds`,
        );
      const phase: AutoMovieArchetypeQuadrupedRestPlan.ISample<
        Id,
        Dimension
      >["phase"] =
        seconds < lowering
          ? "lowering"
          : seconds < riseStart
            ? "resting"
            : seconds < standing
              ? "rising"
              : "standing";
      const u: number =
        phase === "lowering"
          ? 1 - seconds / lowering
          : phase === "resting"
            ? 0
            : (seconds - riseStart) / rising;
      const body: number = progress(u, windows.body);
      const root: IAutoMovieTransform = {
        translation: { x: 0, y: lowRoot + (highRoot - lowRoot) * body, z: 0 },
        rotation: AutoMovieEngineQuaternion.fromAxisAngle(
          { x: 1, y: 0, z: 0 },
          pitch * (1 - body),
        ),
        scale: { x: 1, y: 1, z: 1 },
      };
      const placed: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        IAutoMovieTransform
      > = prepared.read(root).frames;
      const feet: Map<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3> =
        new Map();
      const limbs: Map<
        AutoMovieArchetypeQuadrupedBody.Limb,
        readonly IAutoMovieVector3[]
      > = new Map();
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
          AutoMovieArchetypeQuadrupedBody.BONES[limb];
        const end: "fore" | "hind" = limb.endsWith("Fore") ? "fore" : "hind";
        const current: number = progress(u, windows[end]);
        const points: readonly IAutoMovieVector3[] = source.limbs[limb];
        const angle: (index: 2 | 3) => number = (index: 2 | 3): number => {
          const vector: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
            points[index + 1]!,
            points[index]!,
          );
          const neutralAngle: number = Math.atan2(vector.z, -vector.y);
          const rest: number = folded[end][index - 2]!;
          const shortest: number = Math.atan2(
            Math.sin(neutralAngle - rest),
            Math.cos(neutralAngle - rest),
          );
          return rest + shortest * current;
        };
        const distal: [number, number] = [angle(2), angle(3)];
        if (Math.cos(distal[1]) <= 0)
          throw new RangeError(`Rest requires a downward terminal ${limb} bar`);
        const terminal: IAutoMovieModelPart = bar(chain[3]!);
        const shape: IAutoMovieModelPart["geometry"] = terminal.geometry;
        if (
          shape.type !== "primitive" ||
          (shape.shape.type !== "cylinder" && shape.shape.type !== "capsule")
        )
          throw new RangeError(`Rest requires an actual terminal ${limb} bar`);
        const clearance: number =
          shape.shape.radius *
          (shape.shape.type === "capsule" ? 1 : Math.abs(Math.sin(distal[1])));
        const foot: IAutoMovieVector3 = {
          x: points[4]!.x,
          y: floorY + clearance,
          z: points[4]!.z,
        };
        feet.set(limb, foot);
        limbs.set(
          limb,
          QuadrupedRestLimb(
            points,
            placed.get(chain[0]!)!.translation,
            foot,
            distal,
            end === "fore" ? -1 : 1,
          ),
        );
      }
      const tail: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.slerp(tailTurn, AutoMovieEngineQuaternion.identity(), body),
        neutralTail,
      );
      const axial: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal> =
        new Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>([
          ["tail", { kind: "direction", direction: tail }],
        ]);
      const samplePose: QuadrupedPosePlan.ISample<Id, Dimension> =
        prepared.sample(limbs, root, axial);
      const joints: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        AutoMovieArchetypeQuadrupedRestPlan.Rotation
      > = samplePose.joints;
      const posed: AutoMovieArchetype<Id, Dimension> = samplePose.animal;
      const currentFrames: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        IAutoMovieTransform
      > = samplePose.frames;
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
          AutoMovieArchetypeQuadrupedBody.BONES[limb];
        const frame: IAutoMovieTransform = currentFrames.get(chain[3]!)!;
        const neutralEnd: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
          source.limbs[limb][4]!,
          source.limbs[limb][3]!,
        );
        const actual: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          frame.translation,
          AutoMovieEngineQuaternion.rotateVector(frame.rotation, {
            x: 0,
            y: AutoMovieEngineVector3.length(neutralEnd),
            z: 0,
          }),
        );
        const error: number = AutoMovieEngineVector3.length(
          AutoMovieEngineVector3.subtract(actual, feet.get(limb)!),
        );
        if (error > roundoff)
          throw new RangeError(
            `Rest ${limb} misses its terminal goal by ${error} m`,
          );
      }
      let lowest: number = Infinity;
      let belly: number = Infinity;
      for (const part of posed.parts) {
        const clearance: number = QuadrupedRestFloor(part, cells) - floorY;
        lowest = Math.min(lowest, clearance);
        if (part.id === "trunk") belly = clearance;
        if (clearance < -roundoff)
          throw new RangeError(
            `Rest ${part.id} penetrates its floor by ${-clearance} m`,
          );
      }
      if (phase === "resting" && Math.abs(belly) > roundoff)
        throw new RangeError(`Rest trunk misses its belly support by ${belly} m`);
      return {
        kind: "sternal",
        animal: posed,
        joints,
        root,
        feet,
        floorClearance: lowest,
        bellySupported: Math.abs(belly) <= roundoff,
        phase,
      };
    }

    /*
     * Require the source's bar rather than rebuilding a species profile.
     */
    function bar(
      bone: AutoMovieArchetypeQuadrupedBody.Bone,
    ): IAutoMovieModelPart {
      const part: IAutoMovieModelPart | undefined = parts.get(bone);
      if (
        part === undefined ||
        part.transform === null ||
        part.transform === undefined ||
        part.geometry.type !== "primitive" ||
        (part.geometry.shape.type !== "cylinder" &&
          part.geometry.shape.type !== "capsule")
      )
        throw new RangeError(`Rest requires actual ${bone} bar geometry`);
      return part;
    }
  }
}

/*
 * Admit a positive transition clock without supplying a biological duration.
 */
function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`Rest ${name} must be finite and positive`);
  return value;
}

/*
 * Copy one normalized movement window; zero-duration movement is not admitted.
 */
function window(
  value: AutoMovieArchetypeQuadrupedRestPlan.IWindow,
): AutoMovieArchetypeQuadrupedRestPlan.IWindow {
  const start: number = value.startShare;
  const end: number = value.endShare;
  if (!(start >= 0 && end <= 1 && start < end))
    throw new RangeError("Rest movement windows require 0 <= start < end <= 1");
  return { startShare: start, endShare: end };
}

/*
 * Copy degree carriage as radians in a single-turn chart; terminal bars point
 * down.
 */
function directions(
  value: AutoMovieArchetypeQuadrupedRestPlan.IFoldedDirections,
): readonly [number, number] {
  const a: number = value.thirdDegrees;
  const b: number = value.fourthDegrees;
  if (!(Math.abs(a) <= 180 && Math.abs(b) < 90))
    throw new RangeError(
      "Rest distal directions require |third| <= 180 and |fourth| < 90 degrees",
    );
  return [(a * Math.PI) / 180, (b * Math.PI) / 180];
}

/*
 * A window holds either endpoint outside its movement and follows minimum jerk
 * inside.
 */
function progress(
  value: number,
  span: AutoMovieArchetypeQuadrupedRestPlan.IWindow,
): number {
  if (value <= span.startShare) return 0;
  if (value >= span.endShare) return 1;
  return AutoMovieEngineMotionSampling.minimumJerk(
    (value - span.startShare) / (span.endShare - span.startShare),
  ).s;
}
