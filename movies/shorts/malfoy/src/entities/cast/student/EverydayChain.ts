import { AutoMovieChain, type AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Gait } from "../../../laws/everyday/Gait";
import { BendShape } from "../../../laws/everyday/BendShape";
import { EverydayLaw } from "../../../laws/everyday/EverydayLaw";
import { StageAction } from "../../../laws/staging/StageAction";

/**
 * A student's fluent everyday vocabulary: each call appends one intent of
 * the same student and returns a new chain, so a scene writes what a person
 * does as it reads, `harry.walkTo("bench.right").sit("bench.right")`. Every
 * capability names a place, a person or a prop and never a coordinate or a
 * time, except the optional absolute `start` or `contact` second that pins a
 * screenplay anchor. Timing, positions and outcomes come from the laws when
 * the film's composition resolves.
 *
 * ```ts
 * carina.walkTo(harry, { distance: "handing" }).offer(note, harry).release(note, { contact: 51 });
 * ```
 *
 * @evidence docs/research/everyday/walking.md#pace Walks take a pace by intent.
 * @evidence docs/research/everyday/handover.md#phases Offers, receipts and releases are separate intents the handover interaction aligns.
 * @evidence docs/body/settings/cast/carina-malfoy.md#hides-the-personal `hide`.
 * @evidence docs/body/settings/cast/carina-malfoy.md#forehead-touch `touchForehead`.
 * @evidence docs/body/settings/cast/harry-potter.md#gives-room `giveRoom`.
 * @evidence docs/body/settings/cast/harry-potter.md#pushes-glasses `pushGlasses`.
 * @evidence contracts/development/entities.md#object-shape Immutable chain whose methods return intent records only.
 * @evidence contracts/development/common.md#meaningful-documentation States the vocabulary's shape and its absolute-time option.
 * @evidence contracts/development/design.md#principled-representation Wraps the engine chain; targets are the action module's union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The verbs the four screenplays use; the duel, flight and Quidditch verbs extend it in `StudentChain`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene is named.
 */
export class EverydayChain extends AutoMovieChain {
  /** The acting student's id. */
  public readonly subject: string;

  /**
   * A chain of one student's intents.
   *
   * @param node The composition so far.
   * @param subject The student's id.
   */
  public constructor(node: AutoMovieComposition, subject: string) {
    super(node);
    this.subject = subject;
  }

  /** A new chain of this class holding another node, keeping the subject. */
  protected override derive(node: AutoMovieComposition): this {
    const make = this.constructor as new (
      node: AutoMovieComposition,
      subject: string,
    ) => this;
    return new make(node, this.subject);
  }

  /**
   * Append one action of this student.
   *
   * @param action The action.
   * @param options Absolute start or contact seconds and an anchor id.
   * @returns The chain.
   */
  public act(action: StageAction.Action, options: EverydayChain.IOptions = {}): this {
    const timed: StageAction.Action = {
      ...action,
      ...(options.start === undefined ? {} : { start: options.start }),
      ...(options.contact === undefined ? {} : { contact: options.contact }),
    };
    return this.next(StageAction.intent(this.subject, timed, options.anchor));
  }

  /** Stand at a place or point from the film's first frame, optionally seated, riding or holding props. */
  public enter(at: EverydayChain.Where, options: EverydayChain.IEnter = {}): this {
    return this.act({
      kind: "enter",
      at: EverydayChain.target(at),
      ...(options.facing === undefined ? {} : { facing: EverydayChain.target(options.facing) }),
      ...(options.heading === undefined ? {} : { heading: options.heading }),
      ...(options.seat ? { seat: true } : {}),
      ...(options.holds === undefined ? {} : { holds: options.holds }),
      ...(options.pockets ? { pockets: true } : {}),
      ...(options.riding === undefined ? {} : { riding: options.riding }),
    });
  }

  /** Stay as one is for some seconds: standing, seated or riding, breathing. */
  public hold(seconds: number, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "hold", seconds }, options);
  }

  /** Stay as one is until an absolute film second. */
  public until(seconds: number): this {
    return this.act({ kind: "until", seconds });
  }

  /** Speak a line: a silent entry whose start and words a test reads; the body keeps doing nothing new. */
  public say(words: string, options: EverydayChain.IOptions & { seconds?: number } = {}): this {
    // Speaking time: about 2.5 words per second for unhurried conversational English, a production choice.
    const seconds: number = options.seconds ?? Math.max(0.6, words.split(/\s+/).length / 2.5);
    return this.act({ kind: "say", words, seconds }, options);
  }

  /** Walk to a place, a person or a point in whole steps. */
  public walkTo(to: EverydayChain.Where, options: EverydayChain.IWalk = {}): this {
    const offset: { forward: number; left: number } | undefined =
      options.at === "behindLeftShoulder" ? { forward: -0.6, left: 0.5 } : options.at === "behindRightShoulder" ? { forward: -0.6, left: -0.5 } : options.at === "front" ? { forward: EverydayLaw.CONVERSATION, left: 0 } : options.offset;
    const distance: number | undefined =
      options.distance === "conversation"
        ? EverydayLaw.CONVERSATION
        : options.distance === "handing"
          ? EverydayLaw.HANDING
          : options.distance === "faceToFace"
            ? EverydayLaw.FACE_TO_FACE
            : options.distance;
    const gesture = options.gesture;
    return this.act(
      {
        kind: "walk",
        to: EverydayChain.target(to),
        pace: options.pace ?? "ordinary",
        ...(options.facing === undefined ? {} : { facing: EverydayChain.target(options.facing) }),
        ...(distance === undefined ? {} : { distance }),
        ...(offset === undefined ? {} : { offset }),
        ...(options.hands === "pockets" ? { pockets: true } : {}),
        ...(options.mood === undefined ? {} : { mood: options.mood }),
        ...(gesture === undefined
          ? {}
          : { gesture: { kind: gesture.kind, hand: gesture.hand ?? (gesture.kind === "touchForehead" ? "left" : "right"), after: gesture.after ?? 0.3 } }),
      },
      options,
    );
  }

  /** Turn in place to face a place, a person or a point. */
  public turnTo(toward: EverydayChain.Where, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "turn", toward: EverydayChain.target(toward) }, options);
  }

  /** Step a distance backward, forward or sideways without turning; `away` steps back from a person. */
  public step(
    direction: "back" | "forward" | "left" | "right",
    metres: number,
    options: EverydayChain.IOptions & { away?: EverydayChain.Where; quick?: boolean } = {},
  ): this {
    return this.act(
      {
        kind: "step",
        direction,
        metres,
        ...(options.away === undefined ? {} : { away: EverydayChain.target(options.away) }),
        ...(options.quick ? { quick: true } : {}),
      },
      options,
    );
  }

  /** Sit on a seat place (its calves already at the seat edge; walk there first). */
  public sit(seat: string, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "sit", seat }, options);
  }

  /** Stand up from a seat. */
  public stand(options?: EverydayChain.IOptions): this {
    return this.act({ kind: "rise" }, options);
  }

  /** Shift along a seat toward one's own left or right. */
  public shift(toward: "left" | "right", metres: number = 0.5, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "shift", toward, metres }, options);
  }

  /** Turn head and eyes to a place, person or point; null looks ahead. */
  public lookAt(at: EverydayChain.Where | null, options: EverydayChain.IOptions & { part?: "head" | "leftHand" | "rightHand" } = {}): this {
    return this.act({ kind: "look", at: at === null ? null : EverydayChain.target(at), ...(options.part === undefined ? {} : { part: options.part }) }, options);
  }

  /** Turn at the waist to look back at a place while seated or standing. */
  public lookBack(at: EverydayChain.Where, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "look", at: EverydayChain.target(at), waist: true }, options);
  }

  /** Hold a prop out toward a person or a place. */
  public offer(
    prop: EverydayChain.Ref,
    to: EverydayChain.Where,
    options: EverydayChain.IOptions & { hand?: StageAction.Hand; height?: "chest" | "seatedChest" | "waist" } = {},
  ): this {
    return this.act(
      {
        kind: "offer",
        prop: EverydayChain.id(prop),
        to: EverydayChain.target(to),
        hand: options.hand ?? "right",
        ...(options.height === undefined ? {} : { height: options.height }),
      },
      options,
    );
  }

  /** Draw an extended hand, with what it holds, back to the chest. */
  public withdraw(options: EverydayChain.IOptions & { hand?: StageAction.Hand } = {}): this {
    return this.act({ kind: "withdraw", hand: options.hand ?? "right" }, options);
  }

  /** Reach to a prop another person holds out and close the hand on it; `pull` tugs it once. */
  public receive(
    prop: EverydayChain.Ref,
    from: EverydayChain.Ref,
    options: EverydayChain.IOptions & { hand?: StageAction.Hand; pull?: boolean } = {},
  ): this {
    return this.act(
      {
        kind: "receive",
        prop: EverydayChain.id(prop),
        from: EverydayChain.id(from),
        hand: options.hand ?? "right",
        ...(options.pull ? { pull: true } : {}),
      },
      options,
    );
  }

  /** Open the hand on a held prop and let it go; whoever holds it then owns it, else it falls. */
  public release(prop: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "release", prop: EverydayChain.id(prop) }, options);
  }

  /** Hold an open palm up toward a person or place and keep it there. */
  public openPalm(toward: EverydayChain.Where, options: EverydayChain.IOptions & { hand?: StageAction.Hand } = {}): this {
    return this.act({ kind: "openPalm", hand: options.hand ?? "right", toward: EverydayChain.target(toward) }, options);
  }

  /** Lower a hand to the side. */
  public lowerHand(hand: StageAction.Hand, options: EverydayChain.IOptions & { to?: "side" | "knee" } = {}): this {
    return this.act({ kind: "lowerHand", hand, ...(options.to === undefined ? {} : { to: options.to }) }, options);
  }

  /** Put empty hands into the trouser or robe pockets. */
  public pocketHands(hands: StageAction.Hand[] = ["left", "right"], options?: EverydayChain.IOptions): this {
    return this.act({ kind: "pocket", hands }, options);
  }

  /** Sweep a held prop behind the right hip. */
  public hide(prop: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "hide", prop: EverydayChain.id(prop) }, options);
  }

  /** Let a held prop fall. */
  public drop(prop: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "drop", prop: EverydayChain.id(prop) }, options);
  }

  /** Pick up one prop (right hand) or two (one per hand) from where they rest: the floor, a sill or a seat. */
  public pickUp(props: EverydayChain.Ref | EverydayChain.Ref[], options?: EverydayChain.IOptions): this {
    const list: string[] = (Array.isArray(props) ? props : [props]).map(EverydayChain.id);
    const hands: StageAction.Hand[] = list.length === 1 ? ["right"] : ["right", "left"];
    return this.act({ kind: "pickUp", props: list, hands }, options);
  }

  /** Lay a held prop flat on a place such as a sill. */
  public putDown(prop: EverydayChain.Ref, on: string, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "putDown", prop: EverydayChain.id(prop), on }, options);
  }

  /** Unfold a paper prop with both hands, halfway or fully. */
  public unfold(prop: EverydayChain.Ref, options: EverydayChain.IOptions & { until?: "half" | "open" } = {}): this {
    return this.act({ kind: "unfold", prop: EverydayChain.id(prop), until: options.until ?? "open" }, options);
  }

  /** Fold an opened sheet once. */
  public fold(prop: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "fold", prop: EverydayChain.id(prop) }, options);
  }

  /** Lift a held cup a little toward the person faced. */
  public raise(prop: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "raise", prop: EverydayChain.id(prop) }, options);
  }

  /** Drink from a held cup: lift to the mouth, sip, lower. */
  public drink(prop: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "drink", prop: EverydayChain.id(prop) }, options);
  }

  /** Bring a held paper up in front of the face and read it. */
  public read(prop: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "read", prop: EverydayChain.id(prop) }, options);
  }

  /** Push a charmed paper crane off the fingertip toward a person or place. */
  public launch(prop: EverydayChain.Ref, toward: EverydayChain.Where, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "launch", prop: EverydayChain.id(prop), toward: EverydayChain.target(toward) }, options);
  }

  /** Let the emptied hand follow a launched prop a handspan, without a step. */
  public reachAfter(prop: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "reachAfter", prop: EverydayChain.id(prop) }, options);
  }

  /** Draw an extended empty hand back to the chest. */
  public drawBack(options: EverydayChain.IOptions & { hand?: StageAction.Hand } = {}): this {
    return this.act({ kind: "drawBack", hand: options.hand ?? "right" }, options);
  }

  /** Close a hand on a gliding prop as it arrives. */
  public catch(prop: EverydayChain.Ref, options: EverydayChain.IOptions & { hand?: StageAction.Hand } = {}): this {
    return this.act({ kind: "catch", prop: EverydayChain.id(prop), hand: options.hand ?? "left" }, options);
  }

  /** Touch the forehead with an empty hand for about a second. */
  public touchForehead(options: EverydayChain.IOptions & { hand?: StageAction.Hand } = {}): this {
    return this.act({ kind: "touchForehead", hand: options.hand ?? "left" }, options);
  }

  /** Lift the chin about 10° with the shoulders square and hold it for some seconds (1 by default). */
  public liftChin(options: EverydayChain.IOptions & { seconds?: number } = {}): this {
    return this.act({ kind: "liftChin", seconds: options.seconds ?? 1 }, options);
  }

  /** Push the glasses up the nose with the index finger of a free hand. */
  public pushGlasses(options: EverydayChain.IOptions & { hand?: StageAction.Hand } = {}): this {
    return this.act({ kind: "pushGlasses", hand: options.hand ?? "right" }, options);
  }

  /** Lift both open palms toward a person and step half a metre back from them. */
  public giveRoom(from: EverydayChain.Where, options: EverydayChain.IOptions & { metres?: number } = {}): this {
    return this.act({ kind: "giveRoom", from: EverydayChain.target(from), metres: options.metres ?? EverydayLaw.GIVE_ROOM }, options);
  }

  /** Bend knees and hinge at the hips toward a point on the floor; depth "full" (1) reaches it, "half" (0.6) or "lean" (0.45, the start of a bend that reads at full-shot size) or a share stops short; meet bends exactly as far as the head meets that person's bending head halfway. */
  public bend(toward: EverydayChain.Where, options: EverydayChain.IOptions & { depth?: BendShape.Depth; meet?: EverydayChain.Ref } = {}): this {
    return this.act({ kind: "bend", toward: EverydayChain.target(toward), depth: BendShape.depth(options.depth ?? "full"), ...(options.meet === undefined ? {} : { meet: EverydayChain.id(options.meet) }) }, options);
  }

  /** Straighten from a bend. */
  public straighten(options?: EverydayChain.IOptions): this {
    return this.act({ kind: "straighten" }, options);
  }
}
export namespace EverydayChain {
  /** A subject or prop: an entity with an id, or the id itself. */
  export type Ref = string | { readonly id: string };

  /** A place name, an entity, or a world point. */
  export type Where = string | { readonly id: string } | IAutoMovieVector3;

  /** Absolute timing and an anchor. */
  export interface IOptions {
    /** Absolute film second the action starts. */
    start?: number;

    /** Absolute film second of the action's contact instant. */
    contact?: number;

    /** Anchor id other parts may align to. */
    anchor?: string;
  }

  /** Options of `enter`. */
  export interface IEnter {
    /** What to face. */
    facing?: Where;

    /** Heading in radians, when no facing is given. */
    heading?: number;

    /** Start seated on the place. */
    seat?: boolean;

    /** Props held from the start, by hand. */
    holds?: Partial<Record<StageAction.Hand, string>>;

    /** Hands start in the pockets. */
    pockets?: boolean;

    /** Broom ridden from the start. */
    riding?: string;
  }

  /** Options of `walkTo`. */
  export interface IWalk extends IOptions {
    /** Pace; ordinary by default. */
    pace?: Gait.Pace;

    /** What to face on arrival, or throughout when walking backward. */
    facing?: Where;

    /** Stop this far from a person: conversation 1.0 m, handing 0.7 m, a hand's breadth chest to chest (0.32 m between pelvis points), or metres. */
    distance?: "conversation" | "handing" | "faceToFace" | number;

    /** A forehead touch or a glasses push made while walking, starting some seconds into the walk (0.3 by default). */
    gesture?: { kind: "touchForehead" | "pushGlasses"; hand?: StageAction.Hand; after?: number };

    /** Stop at this offset in the target person's own frame, metres. */
    offset?: { forward: number; left: number };

    /** Stop at a named place relative to the target person: behind a shoulder (0.6 m back, 0.5 m aside) or in front at conversational distance. */
    at?: "behindLeftShoulder" | "behindRightShoulder" | "front";

    /** Walk with hands in the pockets. */
    hands?: "pockets";

    /** Walk bound in flow: shorter steps, elbows in. */
    mood?: "embarrassed";
  }

  /**
   * A target from a place name, an entity or a point.
   *
   * @param where The target.
   * @returns The action target.
   */
  export function target(where: Where): StageAction.Target {
    if (typeof where === "string") return { place: where };
    if ("id" in where) return { subject: where.id };
    return { point: { x: where.x, y: where.y, z: where.z } };
  }

  /**
   * The id of a reference.
   *
   * @param ref An entity or an id.
   * @returns The id.
   */
  export function id(ref: Ref): string {
    return typeof ref === "string" ? ref : ref.id;
  }
}
