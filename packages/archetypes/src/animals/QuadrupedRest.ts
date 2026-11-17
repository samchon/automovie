import {
  type IArticulatedRigReader,
  Quaternion,
  Vector3,
  minimumJerk,
  prepareArticulatedRig,
  rotationBetween,
} from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedJoints } from "./QuadrupedJoints";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedRestLimb } from "./QuadrupedRestLimb";
import type { QuadrupedRestPlan } from "./QuadrupedRestPlan";
import { QuadrupedRestPose } from "./QuadrupedRestPose";
import { QuadrupedSkeleton } from "./QuadrupedSkeleton";

/**
 * Plan a deterministic standing-to-sternal-rest hold and supported rise.
 *
 * Four foot footprints stay at their source X/Z coordinates. Their terminal
 * cap centres follow the exact sole clearance of their actual bar shape as it
 * rotates; this permits geometric rolling, not a claimed no-slip material
 * contact. The actual trunk surface determines the supported belly height.
 * All source contact ids and semantics follow their explicitly declared bones.
 *
 * Ellis et al. 2018, Frontiers in Bioengineering and Biotechnology 6:162,
 * doi:10.3389/fbioe.2018.00162, motivates symmetric belly-lying and fixed foot
 * placements. Their measured greyhound hip/knee/ankle extension windows were
 * approximately 0–20%, 10–50%, 25–60% of rising. This rig's goal fit couples the
 * proximal joints; it does not reproduce those clinical curves, forces or
 * other species' behavior. Distal windows, pitch and durations remain authored.
 * Descent reverses the authored geometric path; side rolling is unsupported.
 *
 * @param animal The actual independently built quadruped; never modified.
 * @param params Explicit floor, cycle clock, distal carriage, pitch and complete carriers.
 * @returns A finite cycle with named contact/standing events and time-only sampling.
 * @throws {RangeError} For malformed authoring input, inconsistent source geometry, unsupported parts, impossible reach, a goal miss or below-floor geometry at a requested sample.
 * @evidence contracts/development/common.md#meaningful-documentation States actual-bar ownership, units, geometric rolling support, explicit authoring provenance, source citation, phases, sample refusal and biological limits.
 * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk authored windows move the one root from standing clearance to the actual trunk support height and return the distal carriage to neutral. Each fixed footprint determines a sole-cleared terminal target; an exact two-circle proximal fit preserves all actual lengths. Generic FK then poses actual parts and source contacts and verifies their surface clearance and terminal targets.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Snapshot authoring values and actual rigid-tree metadata once; each sample evaluates its clock, one root, four supported IK chains, actual generic FK and the resulting primitive support checks. Floor extrema, limb fitting and coordinate lowering each have one small pure owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No animal kind, fixture, human bone, root-per-limb correction, stretched segment or clamped missed contact selects a pose. Only a scale-derived binary64 roundoff budget admits arithmetic noise. ROM, forces, balance dynamics and exact greyhound sequence fidelity remain unclaimed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Plan preparation is O(P+B+A); each sample is O(P+B+A) for actual parts, rig bones and affordances with four fixed-size analytic fits. Storage is O(P+B+A) for metadata and one independently returned model, with no frame table or iteration history.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Source joint measurements, admitted generic rig, neutral frames, source bar lookup, scalar clock and carrier copies are shared by all samples; every requested pose and its floor measurement are freshly computed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the clip lifetime, which retains the source animal and O(P+B+A) metadata; samples retain new transforms and immutable source geometry/material data under reposed's contract. No global cache, process, file or external handle is acquired.
 */
export function QuadrupedRest<Id extends string, Dimension extends string>(
  animal: Archetype<Id, Dimension>,
  params: QuadrupedRestPlan.IParams,
): QuadrupedRestPlan.IClip<Id, Dimension> {
  const floorY: number = finite(params.floorY, "floorY");
  const lowering: number = positive(params.loweringSeconds, "loweringSeconds");
  const resting: number = finite(params.restingSeconds, "restingSeconds");
  const rising: number = positive(params.risingSeconds, "risingSeconds");
  const pitch: number = finite(params.restPitch, "restPitch");
  const tailAngle: number = finite(params.tailDirection, "tailDirection");
  if (Math.abs(tailAngle) > 180)
    throw new RangeError("Rest tail direction must be within [-180, 180] degrees");
  if (resting < 0 || Math.abs(pitch) >= 90)
    throw new RangeError("Rest requires nonnegative hold time and |restPitch| < 90 degrees");
  const riseStart: number = lowering + resting;
  const duration: number = riseStart + rising;
  if (!Number.isFinite(duration))
    throw new RangeError("Rest cycle duration must be finite");
  const windows: Record<"body" | "fore" | "hind", QuadrupedRestPlan.Window> = {
    body: window(params.windows.body),
    fore: window(params.windows.fore),
    hind: window(params.windows.hind),
  };
  const folded: Record<"fore" | "hind", readonly [number, number]> = {
    fore: directions(params.folded.fore),
    hind: directions(params.folded.hind),
  };
  const partCarriers: Readonly<Record<string, QuadrupedBody.Bone>> = { ...params.parts };
  const contactCarriers: Readonly<Record<string, QuadrupedBody.Bone>> = { ...params.contacts };
  const rig: IAutoMovieArticulatedRig<QuadrupedBody.Bone> = QuadrupedSkeleton.of(animal);
  const reader: IArticulatedRigReader<QuadrupedBody.Bone> = prepareArticulatedRig(rig);
  const neutral: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> = reader.read();
  const neutralTail: IAutoMovieVector3 = Quaternion.rotateVector(neutral.get("tail")!.rotation, { x: 0, y: 1, z: 0 });
  const tailTurn: IAutoMovieTransform["rotation"] = rotationBetween(neutralTail, {
    x: 0, y: -Math.cos(tailAngle * Math.PI / 180), z: Math.sin(tailAngle * Math.PI / 180),
  });
  const source: ReturnType<typeof QuadrupedJoints.read> = QuadrupedJoints.read(animal.parts);
  const parts: Map<string, IAutoMovieModelPart> = new Map(
    animal.parts.map((part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [part.id, part]),
  );
  for (const part of animal.parts) QuadrupedRestFloor(part);
  const trunk: IAutoMovieModelPart = bar("trunk");
  const restTurn: IAutoMovieTransform["rotation"] = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, pitch);
  const rotatedTrunk: IAutoMovieModelPart = {
    ...trunk,
    transform: ArchetypeFrame.move({ rotation: restTurn, translation: { x: 0, y: 0, z: 0 } }, trunk.transform!),
  };
  const lowRoot: number = floorY - QuadrupedRestFloor(rotatedTrunk);

  // The smallest sole correction preserves the reach of a source limb that
  // already stands straight; the remaining legs flex onto their own soles.
  // Raising every root by the largest correction could overextend that limb.
  const highRoot: number = floorY - Math.max(
    ...QuadrupedBody.LIMBS.map((limb: QuadrupedBody.Limb): number =>
      QuadrupedRestFloor(bar(QuadrupedBody.BONES[limb][3])),
    ),
  );
  if (!(lowRoot < highRoot))
    throw new RangeError("The actual trunk support does not lie below standing support");
  const scale: number = Math.max(
    1,
    Math.abs(floorY),
    ...[...neutral.values()].map((frame: IAutoMovieTransform): number => Vector3.length(frame.translation)),
  );

  // A fixed number of rigid compositions and circle operations accumulates
  // binary64 error. This budget scales with coordinates, never with a desired
  // floor gap or a missed contact that should instead be refused.
  const roundoff: number = 256 * Number.EPSILON * scale;
  const standing: number = riseStart + rising * Math.max(windows.body[1], windows.fore[1], windows.hind[1]);
  return {
    duration,
    events: Object.freeze({
      bellyOn: lowering * (1 - windows.body[0]),
      riseStart,
      bellyOff: riseStart + rising * windows.body[0],
      standing,
    }),
    sample,
  };

  /** Evaluate the complete independently posed sample from its finite clock. */
  function sample(seconds: number): QuadrupedRestPlan.ISample<Id, Dimension> {
    if (!(Number.isFinite(seconds) && seconds >= 0 && seconds <= duration))
      throw new RangeError(`Rest sample time must be in [0, ${duration}] seconds`);
    const phase: QuadrupedRestPlan.ISample<Id, Dimension>["phase"] =
      seconds < lowering ? "lowering" : seconds < riseStart ? "resting" : seconds < standing ? "rising" : "standing";
    const u: number =
      phase === "lowering" ? 1 - seconds / lowering :
        phase === "resting" ? 0 : (seconds - riseStart) / rising;
    const body: number = progress(u, windows.body);
    const root: IAutoMovieTransform = {
      translation: { x: 0, y: lowRoot + (highRoot - lowRoot) * body, z: 0 },
      rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, pitch * (1 - body)),
      scale: { x: 1, y: 1, z: 1 },
    };
    const placed: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> = reader.read(undefined, root);
    const feet: Map<QuadrupedBody.Limb, IAutoMovieVector3> = new Map();
    const limbs: Map<QuadrupedBody.Limb, readonly IAutoMovieVector3[]> = new Map();
    for (const limb of QuadrupedBody.LIMBS) {
      const chain: readonly QuadrupedBody.Bone[] = QuadrupedBody.BONES[limb];
      const end: "fore" | "hind" = limb.endsWith("Fore") ? "fore" : "hind";
      const current: number = progress(u, windows[end]);
      const points: readonly IAutoMovieVector3[] = source.limbs[limb];
      const angle: (index: 2 | 3) => number = (index: 2 | 3): number => {
        const vector: IAutoMovieVector3 = Vector3.subtract(points[index + 1]!, points[index]!);
        const neutralAngle: number = Math.atan2(vector.z, -vector.y);
        const rest: number = folded[end][index - 2]!;
        const shortest: number = Math.atan2(Math.sin(neutralAngle - rest), Math.cos(neutralAngle - rest));
        return rest + shortest * current;
      };
      const distal: [number, number] = [angle(2), angle(3)];
      if (Math.cos(distal[1]) <= 0)
        throw new RangeError(`Rest requires a downward terminal ${limb} bar`);
      const terminal: IAutoMovieModelPart = bar(chain[3]!);
      const shape: IAutoMovieModelPart["geometry"] = terminal.geometry;
      if (shape.type !== "primitive" || (shape.shape.type !== "cylinder" && shape.shape.type !== "capsule"))
        throw new RangeError(`Rest requires an actual terminal ${limb} bar`);
      const clearance: number = shape.shape.radius * (shape.shape.type === "capsule" ? 1 : Math.abs(Math.sin(distal[1])));
      const foot: IAutoMovieVector3 = { x: points[4]!.x, y: floorY + clearance, z: points[4]!.z };
      feet.set(limb, foot);
      limbs.set(limb, QuadrupedRestLimb(points, placed.get(chain[0]!)!.translation, foot, distal, end === "fore" ? -1 : 1));
    }
    const tail: IAutoMovieVector3 = Quaternion.rotateVector(Quaternion.slerp(tailTurn, Quaternion.identity(), body), neutralTail);
    const joints: Map<QuadrupedBody.Bone, QuadrupedRestPlan.Rotation> = QuadrupedRestPose(rig, neutral, placed, limbs, tail);
    const posed: Archetype<Id, Dimension> = QuadrupedSkeleton.pose(animal, joints, partCarriers, contactCarriers, root);
    const currentFrames: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> = reader.read(joints, root);
    for (const limb of QuadrupedBody.LIMBS) {
      const chain: readonly QuadrupedBody.Bone[] = QuadrupedBody.BONES[limb];
      const frame: IAutoMovieTransform = currentFrames.get(chain[3]!)!;
      const neutralEnd: IAutoMovieVector3 = Vector3.subtract(source.limbs[limb][4]!, source.limbs[limb][3]!);
      const actual: IAutoMovieVector3 = Vector3.add(frame.translation, Quaternion.rotateVector(frame.rotation, { x: 0, y: Vector3.length(neutralEnd), z: 0 }));
      const error: number = Vector3.length(Vector3.subtract(actual, feet.get(limb)!));
      if (error > roundoff)
        throw new RangeError(`Rest ${limb} misses its terminal goal by ${error} m`);
    }
    let lowest: number = Infinity;
    let belly: number = Infinity;
    for (const part of posed.parts) {
      const clearance: number = QuadrupedRestFloor(part) - floorY;
      lowest = Math.min(lowest, clearance);
      if (part.id === "trunk") belly = clearance;
      if (clearance < -roundoff)
        throw new RangeError(`Rest ${part.id} penetrates its floor by ${-clearance} m`);
    }
    if (phase === "resting" && Math.abs(belly) > roundoff)
      throw new RangeError(`Rest trunk misses its belly support by ${belly} m`);
    return { animal: posed, joints, root, feet, floorClearance: lowest, bellySupported: Math.abs(belly) <= roundoff, phase };
  }

  /** Require the source's actual bar rather than rebuilding a species profile. */
  function bar(bone: QuadrupedBody.Bone): IAutoMovieModelPart {
    const part: IAutoMovieModelPart | undefined = parts.get(bone);
    if (part === undefined || part.transform == null || part.geometry.type !== "primitive" || (part.geometry.shape.type !== "cylinder" && part.geometry.shape.type !== "capsule"))
      throw new RangeError(`Rest requires actual ${bone} bar geometry`);
    return part;
  }
}

/** Keep malformed source-independent authoring input out of a retained plan. */
function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`Rest ${name} must be finite`);
  return value;
}

/** Admit a positive transition clock without supplying a biological duration. */
function positive(value: number, name: string): number {
  if (!(finite(value, name) > 0)) throw new RangeError(`Rest ${name} must be positive`);
  return value;
}

/** Copy one normalized movement window; zero-duration movement is not admitted. */
function window(value: QuadrupedRestPlan.Window): QuadrupedRestPlan.Window {
  const start: number = value[0];
  const end: number = value[1];
  if (!(Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end <= 1 && start < end))
    throw new RangeError("Rest movement windows require 0 <= start < end <= 1");
  return [start, end];
}

/** Copy degree carriage as radians in a single-turn chart; terminal bars point down. */
function directions(value: readonly [number, number]): readonly [number, number] {
  const a: number = finite(value[0], "folded direction");
  const b: number = finite(value[1], "folded terminal direction");
  if (Math.abs(a) > 180 || Math.abs(b) >= 90)
    throw new RangeError("Rest distal directions require |third| <= 180 and |fourth| < 90 degrees");
  return [(a * Math.PI) / 180, (b * Math.PI) / 180];
}

/** A window holds either endpoint outside its movement and follows minimum jerk inside. */
function progress(value: number, span: QuadrupedRestPlan.Window): number {
  if (value <= span[0]) return 0;
  if (value >= span[1]) return 1;
  return minimumJerk((value - span[0]) / (span[1] - span[0])).s;
}
