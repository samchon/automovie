import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { KickForm } from "./KickForm";

/**
 * A striking limb as the capsule weapons the performance's joint contact
 * resolution sweeps: the limb's joints read from the performer's own shown
 * bones, which are the free path until the performance commits a stop, so
 * the resolution meets the limb the figure shows, wherever along it a body
 * is first met. A limb that narrows from one joint to the next is a tapered
 * capsule between the two girths, so a capsule never carries the widest
 * girth of its segment to the joint where the shown limb has narrowed.
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
    return posed(
      owner.body,
      owner.performer(owner.subject).bones(seconds),
      side,
    );
  }

  /**
   * An arm's axis ends on posed bones: the shoulder, the elbow, the wrist,
   * and the fist's axis end one forearm radius behind the knuckles.
   *
   * @param body The arm's body.
   * @param bones Its posed bones, world frame.
   * @param side The arm's side.
   * @returns The four axis ends, world metres.
   */
  export function posed(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): IAutoMovieVector3[] {
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const knuckles: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
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

    /**
     * One radius per capsule, metres: one number for a capsule of one
     * radius, or the radii at its two axis ends for a tapered capsule, as a
     * limb narrows from one joint's girth to the next.
     */
    radii: readonly (number | readonly [number, number])[];

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
        ...radius(chain.radii[i]!),
        from: chain.from,
        to: chain.to,
        path: (seconds: number): IAutoMovieVector3 => chain.ends(seconds)[i]!,
        tail: (seconds: number): IAutoMovieVector3 =>
          chain.ends(seconds)[i + 1]!,
      }),
    );
  }

  /**
   * A shown leg's girths at its joints, metres, as its tapered capsules'
   * radii: the thigh narrows from its own radius at the hip to the shank's
   * at the knee, where the shown thigh meets the shank, and the shank from
   * there to the foot capsule's radius at the ankle (half the foot's depth,
   * `KickForm.FOOT_RADIUS_SHARE`), which the foot keeps to the ball.
   *
   * @param body The leg's body.
   * @returns The thigh's, the shank's and the foot's radii.
   */
  export function legRadii(
    body: IHumanBody,
  ): [readonly [number, number], readonly [number, number], number] {
    const m: IHumanBody["measure"] = body.measure;
    const foot: number = KickForm.FOOT_RADIUS_SHARE * m.ankleHeight;
    return [[m.thighRadius, m.shankRadius], [m.shankRadius, foot], foot];
  }

  /**
   * A shown arm's girths at its joints, metres, as its capsules' radii: the
   * upper arm narrows from its own radius at the shoulder to the forearm's
   * at the elbow, where the shown upper arm meets the forearm; the forearm
   * and the fist keep the forearm's radius, which places the fist's axis end
   * one radius behind the knuckles ({@link posed}).
   *
   * @param body The arm's body.
   * @returns The upper arm's, the forearm's and the fist's radii.
   */
  export function armRadii(
    body: IHumanBody,
  ): [readonly [number, number], number, number] {
    const m: IHumanBody["measure"] = body.measure;
    return [
      [m.upperArmRadius, m.forearmRadius],
      m.forearmRadius,
      m.forearmRadius,
    ];
  }

  /**
   * A chain capsule's radius at a share of its axis from its first end.
   *
   * @param radii The capsule's radius or its two end radii.
   * @param share 0 at the first end, 1 at the other.
   * @returns Metres.
   */
  export function girth(
    radii: number | readonly [number, number],
    share: number,
  ): number {
    return typeof radii === "number"
      ? radii
      : radii[0] + (radii[1] - radii[0]) * share;
  }

  /** A capsule's radius members as a weapon carries them. */
  function radius(
    radii: number | readonly [number, number],
  ): Pick<IHumanActionPlan.IWeapon, "radius" | "tailRadius"> {
    return typeof radii === "number"
      ? { radius: radii }
      : { radius: radii[0], tailRadius: radii[1] };
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
