import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";

/**
 * A striking limb as the capsule weapons the performance's joint contact
 * resolution sweeps: the limb's joints read from the performer's own shown
 * bones, which are the free path until the performance commits a stop, so
 * the resolution meets exactly the limb the figure shows, wherever along it
 * a body is first met.
 */
export namespace StrikingWeapon {
  /** Whose limb is read. */
  export type IOwner = Pick<
    IHumanActionContext,
    "subject" | "body" | "performer"
  >;

  /**
   * A performer's shown arm at a film second: the shoulder, the elbow, the
   * wrist, and the fist's axis end one forearm radius behind the knuckles, so
   * a capsule of that radius from the wrist ends on the knuckles.
   *
   * @param owner The performer.
   * @param side The arm's side.
   * @param seconds Film seconds.
   * @returns The four axis ends, world metres.
   */
  export function arm(
    owner: IOwner,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3[] {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = owner
      .performer(owner.subject)
      .bones(seconds);
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const knuckles: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      owner.body.surfaces.sockets[side === "left" ? "fistLeft" : "fistRight"],
      hand,
    ).point;
    const reach: IAutoMovieVector3 = Vector3.subtract(
      knuckles,
      hand.worldPosition,
    );
    const length: number = Vector3.length(reach);
    const r: number = owner.body.measure.forearmRadius;
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
   * A performer's shown leg at a film second: the hip, the knee, the ankle
   * and the ball of the foot.
   *
   * @param owner The performer.
   * @param side The leg's side.
   * @param seconds Film seconds.
   * @returns The four axis ends, world metres.
   */
  export function leg(
    owner: IOwner,
    side: "left" | "right",
    seconds: number,
  ): IAutoMovieVector3[] {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = owner
      .performer(owner.subject)
      .bones(seconds);
    const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
    return [
      bones.get(`${side}UpperLeg`)!.worldPosition,
      bones.get(`${side}LowerLeg`)!.worldPosition,
      foot.worldPosition,
      resolveAutoMovieHumanoidSurfaces.place(
        owner.body.surfaces.sockets[side === "left" ? "ballLeft" : "ballRight"],
        foot,
      ).point,
    ];
  }

  /** A limb's capsules. */
  export interface IChain {
    /** One id per capsule, from the trunk outward. */
    ids: readonly string[];

    /** The limb that carries them. */
    limb: IHumanActionPlan.IWeapon["limb"];

    /** One radius per capsule, metres. */
    radii: readonly number[];

    /** Film second they become live. */
    from: number;

    /** Film second they stop being live. */
    to: number;

    /**
     * The capsules' axis ends at a film second, one more than the capsules:
     * capsule `i` runs from end `i` to end `i + 1`.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     */
    ends(seconds: number): readonly IAutoMovieVector3[];
  }

  /**
   * A limb's capsules as weapons.
   *
   * @param chain The capsules.
   * @returns One weapon per id.
   * @throws {Error} When the radii do not match the ids.
   */
  export function capsules(chain: IChain): IHumanActionPlan.IWeapon[] {
    if (chain.radii.length !== chain.ids.length)
      throw new Error("A weapon chain has one radius per capsule");
    return chain.ids.map(
      (id: string, i: number): IHumanActionPlan.IWeapon => ({
        id,
        limb: chain.limb,
        radius: chain.radii[i]!,
        from: chain.from,
        to: chain.to,
        path: (seconds: number): IAutoMovieVector3 => chain.ends(seconds)[i]!,
        tail: (seconds: number): IAutoMovieVector3 =>
          chain.ends(seconds)[i + 1]!,
      }),
    );
  }

  /**
   * The first of an action's resolved contacts.
   *
   * @param events The action's weapons' contacts.
   * @returns The earliest, or null when the weapons met nothing.
   */
  export function first(
    events: readonly IHumanActionPlan.IContactEvent[],
  ): IHumanActionPlan.IContactEvent | null {
    let best: IHumanActionPlan.IContactEvent | null = null;
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
    chain: Pick<IChain, "ids" | "ends">,
    id: string,
    seconds: number,
  ): readonly [IAutoMovieVector3, IAutoMovieVector3] {
    const i: number = chain.ids.indexOf(id);
    if (i < 0) throw new Error(`A weapon chain has no capsule "${id}"`);
    const ends: readonly IAutoMovieVector3[] = chain.ends(seconds);
    return [ends[i]!, ends[i + 1]!];
  }
}
