import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanPutDown,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMoviePose,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";

/**
 * The rigid frame a prop is set on: a bone of the performer or another
 * prop's socket. The placement and the grasp chosen for it read this same
 * frame, with both sockets posed by their articulations at the entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two frame owners, the consumers and the instant at which articulations are read.
 * @evidence contracts/development/design.md#principled-representation Rigid composition in SE(3): the placed prop P and its socket V satisfy P V = S at the receiving socket S.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One frame reader, shared by putDown's plan and demands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop or body size is named; sockets and bones are the authored data.
 */
export namespace putDownTarget {
  /**
   * Check the source socket's displayed fit at the moving transfer.
   *
   * @param body The performer whose grip carries the source.
   * @param posture The placement plan's contact posture.
   * @param tool The source in its kept grip frame.
   * @param target The grip frame that aligns the sockets at contact.
   * @throws {HumanRefusal} If the fitted source exceeds the shared held-tool bound.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the displayed source and planned target, and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the same posture presented at transfer and compares the fitted grip against the contact target.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve once, read the grip and apply the held-tool bound.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Compares the resolved hand, including its joint limits, rather than the requested wrist.
   * @evidence contracts/development/implementation.md#efficient-algorithms One displayed solve at prepare time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the held-tool error measure and limit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Does not retain the solved bones.
   */
  export function checkContact(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    target: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  ): void {
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, posture),
    );
    const missed: number = StrikingHeld.strayed(
      tool,
      {
        point: HumanHand.frame(body, bones, tool.side, "grip").point,
        rotation: bones.get(`${tool.side}Hand`)!.worldRotation,
      },
      target,
      0,
    );
    if (!(missed <= StrikingRoll.MISS))
      throw new HumanRefusal({
        kind: "reach",
        axis: "onto",
        value: missed,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: StrikingRoll.MISS,
          unit: "m",
        },
        reason:
          "the fitted hand cannot align the held socket at the moving transfer",
        fix: "take a grasp that aligns both sockets, or bring the carrier closer",
      });
  }

  /**
   * Admit horizontal translation of a directly placed rigid receiver.
   * The displayed socket is checked at intervals of at most 1/120 s, including
   * when it rides another prop's authored track. Fixed sockets keep their
   * original placement path.
   *
   * @param context The placement and its film-clock prop readers.
   * @param duration Full placement duration, in seconds.
   * @param aperture The optional registered insertion path.
   * @returns The displacement from entry as a function of local seconds, or undefined for fixed destinations.
   * @throws {HumanRefusal} When motion leaves the admitted path or the displayed socket lacks a rigid authored carrier.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the admitted track, interval, clock and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Fits the velocity from the two endpoint transforms and compares interior samples against that straight line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the displayed socket, checks its path against its declared carrier, and returns one displacement function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Checks film-clock transforms within one micrometre and one microradian. Only direct rigid placements may follow a moving carrier.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bounded scan during preparation and constant displacement arithmetic per seek.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same frame reader as the entry target.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The sampler retains only the velocity vector.
   */
  export function translation(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
    duration: number,
    aperture: IAutoMovieVector3 | undefined,
  ): ((seconds: number) => IAutoMovieVector3) | undefined {
    const onto: IAutoMovieMotionHumanPutDown.IParams["onto"] =
      context.params.onto;
    if (onto === undefined) return undefined;
    const receiver: IAutoMovieMotionHumanPropReader = context.prop(onto.prop);
    const carrier: IAutoMovieMotionHumanPropReader | undefined = track(
      context,
      onto.prop,
    );
    const at = (seconds: number): IAutoMovieRigidTransform =>
      worldSocket(receiver, onto.point, context.start + seconds);
    const entry: IAutoMovieRigidTransform = at(0);
    const end: IAutoMovieRigidTransform = at(duration);
    const velocity: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(end.position, entry.position),
      1 / duration,
    );
    const samples: number = Math.ceil(duration * 120);
    const samePosition = (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): boolean => Vector3.length(Vector3.subtract(a, b)) <= 1e-6;
    const carrierEntry: IAutoMovieRigidTransform | undefined = carrier?.frame(
      context.start,
    );
    let moving: boolean = false;
    let followsCarrier: boolean = true;
    for (let index: number = 0; index <= samples; ++index) {
      const time: number = (index / samples) * duration;
      const frame: IAutoMovieRigidTransform = at(time);
      const expected: IAutoMovieVector3 = Vector3.add(
        entry.position,
        Vector3.scale(velocity, time),
      );
      moving ||= !samePosition(frame.position, entry.position);
      if (
        !(
          Math.abs(frame.position.y - entry.position.y) <= 1e-6 &&
          samePosition(frame.position, expected) &&
          Quaternion.angle(entry.rotation, frame.rotation) <= 1e-6
        )
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis: "onto",
          value: onto.prop,
          reason: `the receiving socket leaves its horizontal constant-velocity track at ${context.start + time} s`,
          fix: "give the receiver a fixed rotation and a constant horizontal velocity throughout the placement",
        });

      // Compare the displayed socket with its declared carrier's translation.
      // A hand or articulation taking over the socket cannot borrow that track.
      if (
        followsCarrier &&
        carrier !== undefined &&
        carrierEntry !== undefined
      ) {
        const carried: IAutoMovieRigidTransform = carrier.frame(
          context.start + time,
        );
        followsCarrier =
          finite(carried) &&
          finite(carrierEntry) &&
          samePosition(
            Vector3.subtract(carried.position, carrierEntry.position),
            Vector3.subtract(frame.position, entry.position),
          ) &&
          Quaternion.angle(carrierEntry.rotation, carried.rotation) <= 1e-6;
      }
    }
    if (!moving) return undefined;
    if (
      aperture !== undefined ||
      carrier === undefined ||
      !followsCarrier ||
      context.entry.holds.left === onto.prop ||
      context.entry.holds.right === onto.prop ||
      receiver.prop.soft !== undefined ||
      (receiver.prop.hasArticulations ?? receiver.prop.articulate !== undefined)
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "onto",
        value: onto.prop,
        reason:
          "the moving socket requires direct placement on a rigid receiver carried by an authored track",
        fix: "use a rigid tracked receiver for direct placement, or keep the socket static until withdrawal",
      });
    return (seconds: number): IAutoMovieVector3 =>
      Vector3.scale(velocity, seconds);
  }

  /**
   * Find an authored motion track behind the receiver's declared mount chain.
   * The placement still verifies the displayed socket against this track.
   *
   * @param context Prop lookup on the performance.
   * @param subject The receiving prop.
   * @returns The authored carrier, if any.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the declared mount lookup and its result.
   * @evidence contracts/development/implementation.md#principled-implementation Follows one parent per mount, with a cycle guard.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads one prop per hop until the track or chain end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not infer a motion track from the rest pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of declared mount links.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares lookup between placement and earlier grasp demands.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The visited set is local to the lookup.
   */
  export function track(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop">,
    subject: string,
  ): IAutoMovieMotionHumanPropReader | undefined {
    const visited: Set<string> = new Set();
    let name: string | undefined = subject;
    while (name !== undefined && !visited.has(name)) {
      visited.add(name);
      const reader: IAutoMovieMotionHumanPropReader = context.prop(name);
      if (reader.prop.motion !== undefined) return reader;
      name = reader.prop.mounted?.prop;
    }
    return undefined;
  }

  /**
   * The prop's fixed placing frame, or undefined for a free world placement.
   *
   * @param context The authored destination, body, props and entry second.
   * @param pose The body at that entry, including a prospective grasp's stance.
   * @returns The placing frame, world metres and a unit quaternion.
   * @throws {HumanRefusal} On onto when either named socket is absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames, instant, missing-destination result and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Composes a worn offset with its posed bone; for a socket placement composes the receiver frame and socket, then the inverse of the placed prop's own socket.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The bone case, the receiving socket, then the inverse source socket.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each socket is read from its prop's posed affordances, rather than substituting its rest frame.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics read for a worn destination, or one linear affordance lookup on each of two props.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanPropFrame's rigid composition and the props' articulation owners.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure reader that retains nothing.
   */
  export function of(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
      "params" | "body" | "prop" | "start"
    >,
    pose: IAutoMoviePose,
  ): IAutoMovieRigidTransform | undefined {
    const onto: IAutoMovieMotionHumanPutDown.IParams["onto"] =
      context.params.onto;
    if (onto === undefined) {
      const on: IAutoMovieMotionHumanPutDown.IParams["on"] = context.params.on;
      if (on === undefined) return undefined;
      return HumanPropFrame.compose(
        HumanPropFrame.bone(poseBones(context.body, pose).get(on.bone)!),
        on.offset,
      );
    }

    const destination: IAutoMovieRigidTransform = worldSocket(
      context.prop(onto.prop),
      onto.point,
      context.start,
    );
    if (onto.via === undefined) return destination;

    const source: IAutoMovieAffordance = socket(
      context.prop(context.params.prop),
      onto.via,
      context.start,
    );
    const rotation: IAutoMovieRigidTransform["rotation"] = Quaternion.normalize(
      Quaternion.multiply(
        destination.rotation,
        Quaternion.inverse(source.frame.rotation),
      ),
    );
    return {
      position: Vector3.subtract(
        destination.position,
        Quaternion.rotateVector(rotation, source.frame.translation),
      ),
      rotation,
    };
  }

  /** The authored socket at the receiver's displayed articulation state. */
  function socket(
    reader: IAutoMovieMotionHumanPropReader,
    id: string,
    seconds: number,
  ): IAutoMovieAffordance {
    const prop: string = reader.prop.subject;
    const contacts: readonly IAutoMovieAffordance[] =
      reader.prop.articulate === undefined
        ? (reader.prop.affordances ?? [])
        : reader.prop.articulate(reader.state?.(seconds) ?? {}).affordances;
    const found: IAutoMovieAffordance | undefined = contacts.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "onto",
        value: `${prop}.${id}`,
        feasible: {
          kind: "alternatives",
          values: contacts.map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `${prop} has no socket named ${id}`,
        fix: "name a socket the prop declares",
      });
    return found;
  }

  /** Read the socket in world metres at a film second. */
  function worldSocket(
    reader: IAutoMovieMotionHumanPropReader,
    id: string,
    seconds: number,
  ): IAutoMovieRigidTransform {
    const local: IAutoMovieAffordance = socket(reader, id, seconds);
    const world: IAutoMovieRigidTransform = reader.frame(seconds);
    const relative: IAutoMovieRigidTransform = {
      position: local.frame.translation,
      rotation: local.frame.rotation,
    };
    if (!(finite(world) && finite(relative)))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "onto",
        value: `${reader.prop.subject}.${id}`,
        reason: `the receiving socket has a non-finite frame at ${seconds} s`,
        fix: "give the receiver a finite frame throughout the placement",
      });
    return HumanPropFrame.compose(world, relative);
  }

  /** Whether the position and quaternion components are finite. */
  function finite(frame: IAutoMovieRigidTransform): boolean {
    const { x, y, z } = frame.position;
    const q: IAutoMovieRigidTransform["rotation"] = frame.rotation;
    return [x, y, z, q.x, q.y, q.z, q.w].every(Number.isFinite);
  }
}
