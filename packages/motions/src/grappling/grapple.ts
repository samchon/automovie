import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanClinch,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { clinch } from "./clinch";
import { grappleMatRoll } from "./grappleMatRoll";
import { grappleStances } from "./grappleStances";

/**
 * One role of a scripted judo, wrestling or mat grappling scene. The actors
 * share an authored clock and outcome. The floor solver moves each actor
 * through changing supports and the initiator's hand goals follow the
 * displayed receiver during the declared grip window. The receiver's pose is
 * authored independently, which keeps the two performers' reads acyclic.
 * Scene events identify staging beats for cuts, camera and referee cues.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains who supplies the outcome, how the actors stay in time and which role reads the other.
 * @evidence contracts/development/design.md#principled-representation One staged scene owns a paired clock, changing floor support and time-windowed person-relative goals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The public name, plan and cuts are the only members read by registration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The support action fits the floor and the hand owner fits the goals. Sport scoring remains an authored event outside the law.
 */
export namespace grapple {
  /** Action key used by both performed roles. */
  export const name: AutoMovieMotionHumanActionKey = "grapple";

  /** Standing recoveries can stand, while settled mat roles can rise. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["recovered", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
      {
        window: ["separated", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    getUp: [
      {
        window: ["recoveredOnMat", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /** Action shares marking the reach, closed contact and withdrawal. */
  interface IWindow {
    /** When the hand begins to travel. */
    reach: number;
    /** When the palm first bears on the partner. */
    take: number;
    /** When the palm lets go. */
    release: number;
    /** When the hand returns to the support pose. */
    rest: number;
  }

  /** Timing of the visible partner contact relative to the shared floor transfer. */
  function window(p: IAutoMovieMotionHumanGrapple.IParams): IWindow {
    // A thigh contact is staged at the lowered entry. The upright approach's grip
    // window leaves its target below the available shoulder-to-wrist reach.
    if (p.kind === "singleLeg" || p.kind === "doubleLeg")
      return { reach: 0.19, take: 0.36, release: 0.4, rest: 0.55 };
    if (p.outcome === "denied")
      return { reach: 0.04, take: 0.22, release: 0.3, rest: 0.47 };
    switch (p.kind) {
      case "judoHold":
      case "wrestlingFall":
      case "guardPass":
        return { reach: 0.72, take: 0.84, release: 0.9, rest: 0.99 };
      case "grecoRoman":
      case "mmaReset":
        return { reach: 0.03, take: 0.17, release: 0.37, rest: 0.55 };
      case "seoiNage":
        return {
          reach: 0.01,
          take: 0.155,
          release: grappleStances.SHOULDER_ENTRY,
          rest: 0.42,
        };
      case "oGoshi":
      case "oSotoGari":
      case "deAshiHarai":
        return { reach: 0.02, take: 0.15, release: 0.23, rest: 0.48 };
    }
  }

  /**
   * Build the pose plan for one role.
   *
   * @param context Staged role, other actor and initial support.
   * @returns The support and partner-contact plan with approach, entry, transfer and recovery events.
   * @throws {HumanRefusal} For a nonpositive duration, self as partner or a held palm outside the actor's measured reach. The support action can refuse a stance outside its own fit bounds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the result, its input and what can be refused.
   * @evidence contracts/development/implementation.md#principled-implementation The support solver fits each role's ground contacts. In the grip interval the initiator fits its palms to the receiver's named moving surface frames and releases on the same clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate participant and duration, create the role's support plan, and add the initiator's hand goals and events.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A self-pair and a named held goal beyond the limb's measured reach are refused, and the receiver's pose never reads the holder's pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms Creates a fixed set of support keys and at most two arm goals. A posture sample inside the hand interval borrows one receiver bone observation for both targets; a sample elsewhere reads no receiver posture.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates floor support to support, partner surface placement to clinch and wrist and finger transport to the shared arm movement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the finite support fits and the named goals. The borrowed receiver map belongs to one synchronous read and is restored if the posture or reach refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGrapple.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanGrapple.IParams = context.params;
    if (p.partner === context.subject)
      throw new HumanRefusal({
        kind: "participant",
        axis: "partner",
        value: p.partner,
        reason: "a grappling scene needs two different performers",
        fix: "name the other actor in the staged scene",
      });
    const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
      p.partner,
    );
    const duration: number = p.seconds ?? grappleStances.seconds(p.kind);
    HumanBound.above("seconds", duration, 0, "s");

    const keys: ReturnType<typeof grappleStances.keys> = grappleStances.keys(
      p,
      duration,
    );
    const supportPlan: IAutoMovieMotionHumanActionPlan = support.plan({
      ...context,
      params: { stances: keys },
    });
    const shoulder: boolean = p.kind === "seoiNage" && p.outcome !== "denied";
    const floor: IAutoMovieMotionHumanActionPlan =
      shoulder && p.role === "receiver"
        ? grappleMatRoll(context.body, supportPlan)
        : supportPlan;
    const ending: ReturnType<typeof grappleStances.keys>[number] =
      keys[keys.length - 1]!;
    const base: IAutoMovieMotionHumanBase = {
      kind: ending.contacts.some((contact): boolean => contact.part === "back")
        ? "lying"
        : ending.contacts.some((contact): boolean =>
              contact.part.endsWith("Knee"),
            )
          ? "kneeling"
          : "standing",
    };
    const timing: IWindow = window(p);
    const control: boolean =
      p.outcome !== "denied" &&
      (p.kind === "judoHold" ||
        p.kind === "wrestlingFall" ||
        p.kind === "guardPass");
    const beats: IAutoMovieMotionEvent[] = [
      ...floor.events,
      { name: "grip", share: timing.take },
      ...(control ? [{ name: "controlEstablished", share: timing.take }] : []),
      { name: "release", share: timing.release },
    ].sort(
      (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
        a.share - b.share,
    );
    const landing: IAutoMovieMotionEvent | undefined = floor.events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === "matTransfer",
    );

    // No mutual lookup is needed to display the receiver. Its floor support changes independently.
    if (p.role === "receiver")
      return {
        ...floor,
        base,
        events: beats,
        ...(landing === undefined
          ? {}
          : { contact: landing.share * floor.duration }),
      };

    const stagedShoulders: boolean = p.kind === "grecoRoman";
    const regions: ReturnType<typeof grappleStances.regions> =
      grappleStances.regions(p.kind, p.side ?? "right");
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      floor.duration,
      [
        { name: "reach", seconds: floor.duration * timing.reach },
        { name: "take", seconds: floor.duration * timing.take },
        { name: "release", seconds: floor.duration * timing.release },
        { name: "rest", seconds: floor.duration * timing.rest },
      ],
    );
    const needed: Set<AutoMovieHumanoidBone> = new Set();
    const arms: IAutoMovieMotionHumanPrimitive[] = [];
    const contacts: IAutoMovieMotionHumanContactWindow[] = [...floor.contacts];
    const release: number = clock.at("release");
    const rest: number = clock.at("rest");
    let observed:
      | ReturnType<IAutoMovieMotionHumanPerformerReader["bones"]>
      | undefined;
    for (const side of ["left", "right"] as const) {
      const region: AutoMovieHumanoidRegion | undefined = regions[side];
      if (region === undefined) continue;
      needed.add(partner.body.surfaces.regions[region].bone);
      const armBone: AutoMovieHumanoidBone = `${side}UpperArm`;
      const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> = new Set([
        armBone,
      ]);
      const goal: `${AutoMovieHumanSide}Arm` = `${side}Arm`;
      const sleeve: boolean = shoulder && side !== (p.side ?? "right");
      const bones: ReturnType<typeof poseBones> = poseBones(
        context.body,
        context.entry.pose,
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
      );
      const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.move({
        body: context.body,
        side,
        from: clock.at("reach"),
        to: clock.at("rest"),
        origin: AutoMovieMotionHumanArm.origin(
          context.body,
          bones,
          { origin: entry.root, yaw: entry.yaw },
          side,
          "palm",
        ),
        weight: (time: number): number =>
          clock.envelope(["reach", "take"], ["release", "rest"], time),
        // Arc around the other actor's torso instead of crossing it on the approach.
        ...(shoulder ? { curvature: 0.62 } : {}),
        target: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanArmTarget.ITarget => {
          const contact: IAutoMovieMotionHumanClinch.IPlaceResult =
            clinch.place(partner.body, observed!, region, 0);
          // The sleeve hand first separates along the material normal.
          // This offset is zero at release and at the end of withdrawal.
          if (sleeve && seconds > release && seconds < rest) {
            const phase: number = (seconds - release) / (rest - release);
            const offset: number =
              0.55 * context.body.measure.hand * Math.sin(Math.PI * phase) ** 2;
            contact.point = Vector3.add(
              contact.point,
              Vector3.scale(contact.normal, offset),
            );
          }
          return AutoMovieMotionHumanTarget.hand(
            context.body,
            posture,
            side,
            contact,
            {
              surface: "palm",
              shape: stagedShoulders ? "flat" : "relaxed",
              bend: "forward",
              // The shoulder marks use a visible open palm. Relaxed finger
              // curl folds the tips around the placed palm into the chest.
              ...(stagedShoulders ? { forward: { x: 0, y: 1, z: 0 } } : {}),
            },
          );
        },
      });
      arms.push({
        ...arm,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          before?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[2],
          resolution?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[3],
          projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
        ): IAutoMovieMotionHumanPosture => {
          const next: IAutoMovieMotionHumanPosture = arm.write(
            posture,
            seconds,
            before,
            resolution,
            projection,
          );
          if (seconds >= clock.at("take") && seconds <= clock.at("release")) {
            const wrist: IAutoMovieHumanLimbGoal = next.limbs[goal]!;
            const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(
              context.body,
              posture,
              undefined,
              resolution,
              shoulderBones,
            ).get(armBone)!.worldPosition;
            const reach: number =
              context.body.measure.upperArm + context.body.measure.forearm;
            const offset: IAutoMovieVector3 = Vector3.subtract(
              wrist.point,
              shoulder,
            );
            const distance: number = Vector3.length(offset);
            if (distance > reach)
              throw new HumanRefusal({
                kind: "reach",
                axis: "partner",
                value: p.partner,
                reason: `the staged ${side} wrist needs ${distance.toFixed(3)} m to reach the partner's ${region} at ${seconds.toFixed(3)} s, beyond its ${reach.toFixed(3)} m reach (world offset ${offset.x.toFixed(3)}, ${offset.y.toFixed(3)}, ${offset.z.toFixed(3)} m)`,
                fix: "reposition the two actors on closer marks or select a different staged scene",
              });
          }
          return next;
        },
      });
      contacts.push({
        part: `${side}Hand`,
        kind: "grip",
        from: timing.take,
        to: timing.release,
        support: { kind: "person", subject: p.partner, region },
      });
    }
    return {
      ...floor,
      base,
      events: beats,
      contacts,
      contact: clock.at("take"),
      posture: (
        ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
      ): IAutoMovieMotionHumanPosture => {
        const [time, channels, resolution, projection] = args;
        let posture: IAutoMovieMotionHumanPosture = floor.posture(
          time,
          channels,
          resolution,
          projection,
        );
        if (time <= clock.at("reach") || time >= clock.at("rest"))
          return posture;

        const previous: typeof observed = observed;
        observed = partner.bones(context.start + time, needed);
        try {
          for (const arm of arms)
            posture = arm.write(
              posture,
              time,
              undefined,
              resolution,
              projection,
            );
          return posture;
        } finally {
          observed = previous;
        }
      },
    };
  }
}
