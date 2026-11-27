import { AutoMovieEngineKinematics } from "@automovie/engine";
import { Vector3 } from "@automovie/engine";
import type { AutoMovieHumanLimb, AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieMotionHumanChannel, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionWeaponContact, IAutoMovieMotionWeaponPath, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { poseBones } from "../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/internal/prepareHumanPostureProjection";
import { StrikingWeaponBones } from "./StrikingWeaponBones";
import { StrikingWeaponGirth } from "./StrikingWeaponGirth";
import type { StrikingWeaponRecord } from "./StrikingWeaponRecord";
import { StrikingWeaponSample } from "./StrikingWeaponSample";
import { StrikingWeaponTable } from "./StrikingWeaponTable";

/** The alternatives of `AxisChain`'s site. */
type AxisChain = "ids" | "ends";

/** The alternatives of `RadiusResult`'s site. */
type RadiusResult = "radius" | "tailRadius";

/** A capsule's radii at its two axis ends, metres. */
type RadiusRadii = readonly [number, number];

/** A chain capsule's radii at its two axis ends, metres. */
type ChainRadiiItem = readonly [number, number];

/**
 * A striking limb as the capsule weapons the performance's joint contact
 * resolution sweeps: the limb's joints read from the striking action's own free
 * course, its posture fitted at the asked second, which is what the figure
 * shows until the performance commits a stop, so the resolution meets the limb
 * as it moves, wherever along it a body is first met. The performer's displayed
 * bones cannot serve: a performer reading their own body is read as they
 * entered the action (`IHumanActionContext.performer`), which left the capsules
 * on the entry's resting limb. A limb that narrows from one joint to the next
 * is a tapered capsule between the two girths, so a capsule never carries the
 * widest girth of its segment to the joint where the shown limb has narrowed.
 */
export namespace StrikingWeapon {
  /**
   * How long past the planned contact a striking limb stays a weapon and its
   * stop is looked for, seconds, every strike's limb alike (provisional: the
   * through-travel's settling).
   */
  export const TAIL: number = 0.1;

  /**
   * The striking action's free course: its posture at a film second before any
   * committed stop moves it.
   *
   * @param seconds Film seconds.
   * @param channels Optional demands whose observed values equal the complete
   *   course; unsupported producers return the complete posture.
   * @param resolution Optional exact FK supplier borrowed only for this
   *   synchronous sample, never retained by the course.
   * @param projection Optional lazy genuine same-body ROM metadata supplier for
   *   this unchanged-table sample; never retained, and legacy courses may
   *   ignore it.
   * @returns The posture.
   */
  export type Course = (
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: () => ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture;

  /**
   * A striking arm at a film second, fitted on its action's free course: the
   * shoulder, the elbow, the wrist, and the fist's axis end one forearm radius
   * behind the knuckles, so a capsule of that radius from the wrist ends on the
   * knuckles.
   *
   * @param body The performer's body.
   * @param course The action's free course.
   * @param side The arm's side.
   * @param seconds Film seconds.
   * @returns The four axis ends, world metres.
   */
  export function arm(
    body: IAutoMovieMotionHumanBody,
    course: Course,
    side: AutoMovieHumanSide,
    seconds: number,
    near?: Parameters<typeof StrikingWeaponBones>[5],
    kept?: Parameters<typeof StrikingWeaponBones>[6],
    prepared?: Parameters<typeof StrikingWeaponBones>[7],
  ): IAutoMovieVector3[] {
    return posed(
      body,
      StrikingWeaponBones(
        body,
        course,
        seconds,
        ENDS[`${side}Arm`],
        undefined,
        near,
        kept,
        prepared,
      ),
      side,
    );
  }

  /**
   * The endpoint reader of a striking limb, prepared once by the plan whose
   * chain reads that limb at every second it scans, and passed to `arm` or
   * `leg`.
   *
   * @param body The performer's body.
   * @param limb The striking limb.
   * @returns The reader of the limb's three joint frames on a posed body.
   */
  export function frames(
    body: IAutoMovieMotionHumanBody,
    limb: AutoMovieHumanLimb,
  ): ReturnType<typeof poseBones.prepare> {
    return poseBones.prepare(body, ENDS[limb]);
  }

  /**
   * An arm's axis ends on posed bones: the shoulder, the elbow, the wrist, and
   * the fist's axis end one forearm radius behind the knuckles.
   *
   * @param body The arm's body.
   * @param bones Its posed bones, world frame.
   * @param side The arm's side.
   * @returns The four axis ends, world metres.
   */
  export function posed(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3[] {
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const knuckles: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      body.surfaces.sockets[side === "left" ? "fistLeft" : "fistRight"],
      hand,
    ).point;
    const reach: IAutoMovieVector3 = Vector3.subtract(
      knuckles,
      hand.worldPosition,
    );
    const length: number = Vector3.length(reach);
    const r: number = body.measure.forearmRadius;
    return [
      bones.get(`${side}UpperArm`)!.worldPosition,
      bones.get(`${side}LowerArm`)!.worldPosition,
      hand.worldPosition,
      Vector3.add(
        hand.worldPosition,
        Vector3.scale(reach, Math.max(0, length - r) / Math.max(1e-9, length)),
      ),
    ];
  }

  /**
   * A striking leg at a film second, fitted on its action's free course: the
   * hip, the knee, the ankle and the ball of the foot.
   *
   * @param body The performer's body.
   * @param course The action's free course.
   * @param side The leg's side.
   * @param seconds Film seconds.
   * @returns The four axis ends, world metres.
   */
  export function leg(
    body: IAutoMovieMotionHumanBody,
    course: Course,
    side: AutoMovieHumanSide,
    seconds: number,
    near?: Parameters<typeof StrikingWeaponBones>[5],
    kept?: Parameters<typeof StrikingWeaponBones>[6],
    prepared?: Parameters<typeof StrikingWeaponBones>[7],
  ): IAutoMovieVector3[] {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      StrikingWeaponBones(
        body,
        course,
        seconds,
        ENDS[`${side}Leg`],
        LEG_CHANNELS[side],
        near,
        kept,
        prepared,
      );
    const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
    return [
      bones.get(`${side}UpperLeg`)!.worldPosition,
      bones.get(`${side}LowerLeg`)!.worldPosition,
      foot.worldPosition,
      AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
        body.surfaces.sockets[side === "left" ? "ballLeft" : "ballRight"],
        foot,
      ).point,
    ];
  }

  /** A limb's capsules. */
  export interface IChain {
    /** One id per capsule, from the trunk outward. */
    ids: readonly string[];

    /** The limb that carries them. */
    limb: IAutoMovieMotionWeaponPath["limb"];

    /**
     * The radii at each capsule's two axis ends, metres: equal for a capsule of
     * one radius, unequal for a tapered capsule, as a limb narrows from one
     * joint's girth to the next.
     */
    radii: readonly ChainRadiiItem[];

    /** Film second they become live. */
    from: number;

    /** Film second they stop being live. */
    to: number;

    /**
     * The reader of the record the ends are read on: kept ends hold while it
     * returns the same object.
     */
    on: StrikingWeaponRecord;

    /**
     * The capsules' axis ends at a film second, one more than the capsules:
     * capsule `i` runs from end `i` to end `i + 1`.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    ends(seconds: number): readonly IAutoMovieVector3[];

    /**
     * The same ends with the limb's fits continued from a neighbouring second's
     * and their seeds returned (`StrikingWeaponTable.reader`); the capsules
     * read the course through it when it is given.
     */
    read?: StrikingWeaponTable.IRead;
  }

  /**
   * A limb's capsules as weapons.
   *
   * @param chain The capsules.
   * @returns One weapon per id.
   * @throws {Error} When the radii do not match the ids.
   */
  export function capsules(chain: IChain): IAutoMovieMotionWeaponPath[] {
    if (chain.radii.length !== chain.ids.length)
      throw new Error("A weapon chain has one radius per capsule");

    // The chain's ends are its action's course posed at a second: a pure
    // function of the second on the law's solved geometry. A reader of
    // several capsules of the chain reads them together (`IChain` of
    // `IAutoMovieMotionWeaponPath`, `StrikingWeaponSample.sample`), so the
    // limb is posed once a second for all of them.
    const ends = (seconds: number): readonly IAutoMovieVector3[] =>
      chain.read === undefined ? chain.ends(seconds) : chain.read(seconds).ends;
    return chain.ids.map(
      (id: string, i: number): IAutoMovieMotionWeaponPath => ({
        id,
        limb: chain.limb,
        ...radius(chain.radii[i]!),
        from: chain.from,
        to: chain.to,
        path: (seconds: number): IAutoMovieVector3 => ends(seconds)[i]!,
        tail: (seconds: number): IAutoMovieVector3 => ends(seconds)[i + 1]!,
        chain: { ends, index: i },
      }),
    );
  }

  /** A weapon's actual centre and optional other capsule end, world metres. */
  export type IAxis = readonly [
    IAutoMovieVector3,
    IAutoMovieVector3 | undefined,
  ];

  /**
   * Read both ends of one weapon in one synchronous sample.
   *
   * @param weapon The original plan weapon, before consumer adapters wrap it.
   * @param seconds The exact film second requested by the consumer.
   * @returns Its centre and optional capsule end.
   */
  export function read(
    weapon: IAutoMovieMotionWeaponPath,
    seconds: number,
  ): IAxis {
    return StrikingWeaponSample.read(weapon, seconds);
  }

  /**
   * Read requested weapons together at one exact second and context state.
   *
   * @param weapons Original plan weapons in the consumer's existing order.
   * @param seconds The exact film second of this synchronous sample.
   * @returns One axis per requested weapon, keyed by its original identity.
   */
  export function sample(
    weapons: readonly IAutoMovieMotionWeaponPath[],
    seconds: number,
  ): ReadonlyMap<IAutoMovieMotionWeaponPath, IAxis> {
    return StrikingWeaponSample.sample(weapons, seconds);
  }

  /** A shown leg's girths at its joints (`StrikingWeaponGirth.legRadii`). */
  export const legRadii: typeof StrikingWeaponGirth.legRadii =
    StrikingWeaponGirth.legRadii;

  /** A shown arm's girths at its joints (`StrikingWeaponGirth.armRadii`). */
  export const armRadii: typeof StrikingWeaponGirth.armRadii =
    StrikingWeaponGirth.armRadii;

  /**
   * A chain capsule's radius at a share of its axis
   * (`StrikingWeaponGirth.girth`).
   */
  export const girth: typeof StrikingWeaponGirth.girth =
    StrikingWeaponGirth.girth;

  /**
   * A capsule's radius members as a weapon carries them: a tail radius only
   * where the capsule tapers.
   */
  function radius(
    radii: RadiusRadii,
  ): Pick<IAutoMovieMotionWeaponPath, RadiusResult> {
    return radii[0] === radii[1]
      ? { radius: radii[0] }
      : { radius: radii[0], tailRadius: radii[1] };
  }

  /**
   * The first of an action's resolved contacts.
   *
   * @param events The action's weapons' contacts.
   * @returns The earliest, or null when the weapons met nothing.
   */
  export function first(
    events: readonly IAutoMovieMotionWeaponContact[],
  ): IAutoMovieMotionWeaponContact | null {
    let best: IAutoMovieMotionWeaponContact | null = null;
    for (const e of events)
      if (best === null || e.seconds < best.seconds) best = e;
    return best;
  }

  /**
   * The axis of one capsule of a chain.
   *
   * @param chain The capsules.
   * @param id The capsule's id.
   * @param seconds Film seconds.
   * @returns Its two axis ends, world metres.
   * @throws {Error} When the chain has no such capsule.
   */
  export function axis(
    chain: Pick<IChain, AxisChain>,
    id: string,
    seconds: number,
  ): readonly [IAutoMovieVector3, IAutoMovieVector3] {
    const i: number = chain.ids.indexOf(id);
    if (i < 0) throw new Error(`A weapon chain has no capsule "${id}"`);
    const ends: readonly IAutoMovieVector3[] = chain.ends(seconds);
    return [ends[i]!, ends[i + 1]!];
  }
}

/**
 * Fixed demanded limb outputs; FK still admits all joints and computes every
 * required ancestor.
 */
const ENDS: Readonly<
  Record<AutoMovieHumanLimb, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  leftArm: new Set<AutoMovieHumanoidBone>([
    "leftUpperArm",
    "leftLowerArm",
    "leftHand",
  ]),
  rightArm: new Set<AutoMovieHumanoidBone>([
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
  ]),
  leftLeg: new Set<AutoMovieHumanoidBone>([
    "leftUpperLeg",
    "leftLowerLeg",
    "leftFoot",
  ]),
  rightLeg: new Set<AutoMovieHumanoidBone>([
    "rightUpperLeg",
    "rightLowerLeg",
    "rightFoot",
  ]),
};

/**
 * A striking leg depends on its base and trunk, while arms are fitted later and
 * cannot move it.
 */
const LEG_CHANNELS: Readonly<
  Record<AutoMovieHumanSide, readonly AutoMovieMotionHumanChannel[]>
> = {
  left: ["root", "trunk", "leftLeg"],
  right: ["root", "trunk", "rightLeg"],
};
