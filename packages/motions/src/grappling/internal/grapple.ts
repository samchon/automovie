import type {
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
} from "@automovie/interface";

import { support } from "../../actions/internal/support";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanBound } from "../../law/internal/HumanBound";
import { grappleArms } from "./grappleArms";
import { grappleFront } from "./grappleFront";
import { grappleMatRoll } from "./grappleMatRoll";
import { grappleStances } from "./grappleStances";
import { grappleSumo } from "./grappleSumo";

/*
 * One role of a scripted judo, wrestling or mat grappling scene. The actors
 * share an authored clock and outcome. The floor solver moves each actor
 * through changing supports and the initiator's hand goals follow the displayed
 * receiver during the declared grip window. The receiver's pose is authored
 * independently, which keeps the two performers' reads acyclic. Scene events
 * identify staging beats for cuts, camera and referee cues.
 */
export namespace grapple {
  /*
   * Action key used by both performed roles.
   */
  export const name: AutoMovieMotionHumanActionKey = "grapple";

  /*
   * Standing recoveries can stand, while settled mat roles can rise.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: { start: "recovered", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
      {
        window: { start: "separated", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    getUp: [
      {
        window: { start: "recoveredOnMat", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /*
   * The least distance between two partners' marks at which their heads and
   * chests cannot meet when both lean into the scene's entry stance: each
   * body's head and chest fronts stand forward of its hips by the stance's
   * trunk pitch about the hip over their heights above it, plus the head's
   * radius or half the chest's depth, and the two partners' farther fronts meet
   * at their sum. A staged scene's marks derived from it suit both bodies,
   * where a fixed spacing let the leaning heads overlap (the MMA reset's 4.3
   * cm).
   * Parameter kind: The scene.
   * Parameter initiator: The initiating body.
   * Parameter receiver: The receiving body.
   * Returns: Metres between the two marks along the initiator's facing.
   */
  export function spacing(
    kind: IAutoMovieMotionHumanGrapple.Kind,
    initiator: IAutoMovieMotionHumanBody,
    receiver: IAutoMovieMotionHumanBody,
  ): number {
    const front = (
      role: IAutoMovieMotionHumanGrapple.Role,
      body: IAutoMovieMotionHumanBody,
    ): number => {
      const lean: number =
        grappleStances
          .keys(
            { kind, role, partner: role },
            grappleStances.seconds(kind),
            body,
            role === "initiator" ? receiver : initiator,
          )
          .find(
            (stance: ReturnType<typeof grappleStances.keys>[number]): boolean =>
              stance.event === "entry",
          )?.prefer?.pitch ?? 0;
      return Math.max(
        grappleFront.head(body, lean),
        grappleFront.chest(body, lean),
      );
    };
    return front("initiator", initiator) + front("receiver", receiver);
  }

  /*
   * Build the pose plan for one role.
   * Parameter context: Staged role, other actor and initial support.
   * Returns: The support and partner-contact plan with approach, entry,
   * transfer and recovery events.
   * For a nonpositive duration, self as partner or a
   * held palm outside the actor's measured reach. The support action can
   * refuse a stance outside its own fit bounds.
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

    const duration: number = p.duration ?? grappleStances.seconds(p.kind);
    HumanBound.above("duration", duration, 0, "s");

    const partnerBody: IAutoMovieMotionHumanBody = context.performer(
      p.partner,
    ).body;
    const stancesAt = (
      pitch?: number,
    ): ReturnType<typeof grappleStances.keys> =>
      grappleStances.keys(p, duration, context.body, partnerBody, pitch);
    let keys: ReturnType<typeof grappleStances.keys> = stancesAt();
    let supportPlan: IAutoMovieMotionHumanActionPlan = support.plan({
      ...context,
      params: { stances: keys },
    });
    // A sumo tachiai's contact gap is read at the trunk's pitch the support
    // fit takes there, not the charge pose's asked one: asked 35 degrees, the
    // fit took 28 on the small body and the chests stopped 37 mm apart. The
    // keys are laid again on that pitch.
    if (grappleSumo.is(p.kind)) {
      const fitted: number | undefined = supportPlan.posture(
        duration * grappleSumo.window().take,
      ).pitch;
      if (fitted !== undefined) {
        keys = stancesAt(fitted);
        supportPlan = support.plan({ ...context, params: { stances: keys } });
      }
    }
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

    const regions: ReturnType<typeof grappleStances.regions> =
      grappleStances.regions(p.kind, p.side ?? "right");
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(floor.duration, [
      { name: "reach", seconds: floor.duration * timing.reach },
      { name: "take", seconds: floor.duration * timing.take },
      { name: "release", seconds: floor.duration * timing.release },
      { name: "rest", seconds: floor.duration * timing.rest },
    ]);
    const contacts: IAutoMovieMotionHumanContactWindow[] = [...floor.contacts];
    for (const side of ["left", "right"] as const) {
      const region: AutoMovieHumanoidRegion | undefined = regions[side];
      if (region === undefined) continue;
      contacts.push({
        part: `${side}Hand`,
        kind: "grip",
        from: timing.take,
        to: timing.release,
        support: { kind: "person", subject: p.partner, region },
      });
    }
    // The hands are laid on the partner as one course (`grappleArms`).
    const armed: IAutoMovieMotionHumanActionPlan = grappleArms({
      context,
      floor,
      regions,
      clock,
      ...(shoulder
        ? { sleeve: (p.side ?? "right") === "left" ? "right" : "left" }
        : {}),
    });
    return {
      ...armed,
      base,
      events: beats,
      contacts,
      contact: clock.at("take"),
    };
  }

  /*
   * Action shares marking the reach, closed contact and withdrawal.
   */
  interface IWindow {
    /*
     * When the hand begins to travel.
     */
    reach: number;
    /*
     * When the palm first bears on the partner.
     */
    take: number;
    /*
     * When the palm lets go.
     */
    release: number;
    /*
     * When the hand returns to the support pose.
     */
    rest: number;
  }
  /*
   * Timing of the visible partner contact relative to the shared floor
   * transfer.
   */
  function window(p: IAutoMovieMotionHumanGrapple.IParams): IWindow {
    if (grappleSumo.is(p.kind)) return grappleSumo.window();
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
      default:
        return { reach: 0.02, take: 0.15, release: 0.23, rest: 0.48 };
    }
  }
}
