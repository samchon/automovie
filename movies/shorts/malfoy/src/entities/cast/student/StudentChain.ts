import type { StageAction } from "../../../laws/staging/StageAction";
import { EverydayChain } from "./EverydayChain";

/**
 * A student's whole fluent vocabulary: the everyday verbs plus duelling,
 * broom riding and Quidditch play, each appending one intent of the same
 * student. As with the everyday verbs, nothing here is a position or a time.
 *
 * ```ts
 * carina.onGuard(harry).jinx(harry, { aim: "wand-hand" });
 * harry.mount("broom-harry").fly(["eastSouthGap", "eastRunoff"], { speed: 15 });
 * ```
 *
 * @evidence docs/research/duelling/practice-duel.md#law Stance, footwork, casting, deflection, grip and escape.
 * @evidence docs/research/flight/broom-riding.md#law Seat, speeds, reach, hanging and transfer.
 * @evidence docs/research/quidditch/practice-play.md#law Passing, striking and stopping play.
 * @evidence docs/body/settings/world/magic.md#practice-only The practice spells.
 * @evidence contracts/development/entities.md#object-shape Immutable chain returning intent records only.
 * @evidence contracts/development/common.md#meaningful-documentation States what the class adds.
 * @evidence contracts/development/design.md#principled-representation Extends the everyday vocabulary with the same action union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The verbs the duel and Quidditch screenplays use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene is named.
 */
export class StudentChain extends EverydayChain {
  /** Take the on-guard stance facing an opponent, wand-side foot leading. */
  public onGuard(opponent: EverydayChain.Where, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "guard", at: EverydayChain.target(opponent) }, options);
  }

  /** Step toward the faced opponent, rear foot following, in 0.3–0.5 m steps. */
  public advance(opponent: EverydayChain.Where, steps: number = 1, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "footwork", move: "advance", steps, facing: EverydayChain.target(opponent) }, options);
  }

  /** Step back from the faced opponent, rear foot first; `to` retreats toward a place. */
  public retreat(
    opponent: EverydayChain.Where,
    options: EverydayChain.IOptions & { steps?: number; to?: EverydayChain.Where } = {},
  ): this {
    return this.act(
      {
        kind: "footwork",
        move: "retreat",
        steps: options.steps ?? 1,
        facing: EverydayChain.target(opponent),
        ...(options.to === undefined ? {} : { to: EverydayChain.target(options.to) }),
      },
      options,
    );
  }

  /** Circle the opponent toward one's own left or right, keeping the chest square. */
  public circle(
    opponent: EverydayChain.Where,
    toward: "left" | "right",
    options: EverydayChain.IOptions & { steps?: number; to?: EverydayChain.Where } = {},
  ): this {
    return this.act(
      {
        kind: "footwork",
        move: toward === "left" ? "circleLeft" : "circleRight",
        steps: options.steps ?? 2,
        facing: EverydayChain.target(opponent),
        ...(options.to === undefined ? {} : { to: EverydayChain.target(options.to) }),
      },
      options,
    );
  }

  /** Cast the practice jinx (*Flipendo*) at an opponent's wand hand, wand shoulder or body. */
  public jinx(
    opponent: EverydayChain.Where,
    options: EverydayChain.IOptions & { aim?: "wand-hand" | "wand-shoulder" | "body" } = {},
  ): this {
    return this.act({ kind: "cast", spell: "jinx", at: EverydayChain.target(opponent), aim: options.aim ?? "wand-hand" }, options);
  }

  /** Cast the disarming charm (*Expelliarmus*) at an opponent's wand hand. */
  public disarm(opponent: EverydayChain.Where, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "cast", spell: "disarm", at: EverydayChain.target(opponent), aim: "wand-hand" }, options);
  }

  /** Sweep the wand across the incoming streak, sending it to the floor or a landmark. */
  public deflect(toward: EverydayChain.Where | "floor" = "floor", options?: EverydayChain.IOptions): this {
    return this.act({ kind: "deflect", toward: toward === "floor" ? "floor" : EverydayChain.target(toward) }, options);
  }

  /** Raise the shield charm (*Protego*) in the faced direction and hold it. */
  public shield(seconds: number = 2, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "shield", seconds }, options);
  }

  /** Lift a loose object with the levitation charm (*Wingardium Leviosa*) toward a target. */
  public levitate(prop: EverydayChain.Ref, to: EverydayChain.Where, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "levitate", prop: EverydayChain.id(prop), to: EverydayChain.target(to) }, options);
  }

  /** Close the free left hand on another's wand wrist or forearm from the outside. */
  public grip(of: EverydayChain.Ref, options: EverydayChain.IOptions & { part?: "wrist" | "forearm" } = {}): this {
    return this.act({ kind: "grip", of: EverydayChain.id(of), part: options.part ?? "wrist" }, options);
  }

  /** Escape a grip on the wand wrist: raise the joined hands and turn a full circle beneath them. */
  public turnUnder(options?: EverydayChain.IOptions): this {
    return this.act({ kind: "turnUnder" }, options);
  }

  /** Open the gripping hand. */
  public letGo(options?: EverydayChain.IOptions): this {
    return this.act({ kind: "letGo" }, options);
  }

  /** Run at a person or place in two to four running steps (2.5 m/s, or 3 m/s at "sprint"), stopping at a distance. */
  public runAt(to: EverydayChain.Where, options: EverydayChain.IOptions & { distance?: number; wand?: "low"; pace?: "run" | "sprint" } = {}): this {
    return this.act(
      {
        kind: "run",
        to: EverydayChain.target(to),
        ...(options.distance === undefined ? {} : { distance: options.distance }),
        ...(options.wand === undefined ? {} : { wand: options.wand }),
        ...(options.pace === undefined ? {} : { pace: options.pace }),
      },
      options,
    );
  }

  /** Turn a reaching forearm aside with the free palm. */
  public parry(of: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "parry", of: EverydayChain.id(of) }, options);
  }

  /** Guide a willing partner two quick sideways steps toward a place, shoulder to chest (0.6 m in 0.4 s each, or 0.7 m in 0.35 s when quick). */
  public guideAside(partner: EverydayChain.Ref, to: EverydayChain.Where, options: EverydayChain.IOptions & { steps?: number; quick?: boolean } = {}): this {
    return this.act({ kind: "guide", partner: EverydayChain.id(partner), to: EverydayChain.target(to), steps: options.steps ?? 2, ...(options.quick ? { quick: true } : {}) }, options);
  }

  /** Be guided: two quick sideways steps toward a place beside the guiding partner (pair with the partner's guideAside). */
  public guidedTo(to: EverydayChain.Where, options: EverydayChain.IOptions & { steps?: number; quick?: boolean } = {}): this {
    return this.act({ kind: "guide", partner: this.subject, to: EverydayChain.target(to), steps: options.steps ?? 2, ...(options.quick ? { quick: true } : {}) }, options);
  }

  /** Move the wand: draw it into the hand, pocket it, lower its tip or raise it. */
  public wand(to: "hand" | "pocket" | "low" | "up", options?: EverydayChain.IOptions): this {
    return this.act({ kind: "wand", to }, options);
  }

  /** Mount a broom hovering beside one and kick off. */
  public mount(broom: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "mount", broom: EverydayChain.id(broom) }, options);
  }

  /** Fly a route of places or points at a speed in m/s, banking by the turn law; `lean` 0–1 lowers the chest. */
  public fly(
    route: EverydayChain.Where | EverydayChain.Where[],
    options: EverydayChain.IOptions & { speed?: number; lean?: number } = {},
  ): this {
    const list: EverydayChain.Where[] = Array.isArray(route) ? route : [route];
    return this.act(
      {
        kind: "fly",
        route: list.map(EverydayChain.target),
        speed: options.speed ?? 8,
        ...(options.lean === undefined ? {} : { lean: options.lean }),
      },
      options,
    );
  }

  /** Reach a hand from the seat toward a target, closing on it or holding it open. */
  public reach(
    target: EverydayChain.Where,
    options: EverydayChain.IOptions & { hand?: StageAction.Hand; close?: boolean } = {},
  ): this {
    return this.act({ kind: "reach", for: EverydayChain.target(target), hand: options.hand ?? "left", close: options.close ?? true }, options);
  }

  /** Lose the seat past the reach limit and hang under the broom by one hand. */
  public slip(options: EverydayChain.IOptions & { hang?: StageAction.Hand } = {}): this {
    return this.act({ kind: "slip", hang: options.hang ?? "right" }, options);
  }

  /** Swing the free arm up toward the shaft while hanging. */
  public swingArm(options: EverydayChain.IOptions & { hand?: StageAction.Hand } = {}): this {
    return this.act({ kind: "swingArm", hand: options.hand ?? "left" }, options);
  }

  /** Bring one's broom alongside a hanging rider and hold it steady, rear section offered. */
  public offerRear(to: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "offerRear", to: EverydayChain.id(to) }, options);
  }

  /** Move from hanging onto another rider's rear seat in the five transfer phases. */
  public transfer(onto: EverydayChain.Ref, options?: EverydayChain.IOptions): this {
    return this.act({ kind: "transfer", onto: EverydayChain.id(onto) }, options);
  }

  /** Pass the Quaffle to a teammate. */
  public pass(to: EverydayChain.Ref, options: EverydayChain.IOptions & { ball?: string } = {}): this {
    return this.act({ kind: "pass", to: EverydayChain.id(to), ball: options.ball ?? "quaffle" }, options);
  }

  /** Strike a Bludger toward a target with the bat. */
  public strike(ball: EverydayChain.Ref, toward: EverydayChain.Where, options: EverydayChain.IOptions & { hand?: StageAction.Hand } = {}): this {
    return this.act({ kind: "strike", ball: EverydayChain.id(ball), toward: EverydayChain.target(toward), ...(options.hand === undefined ? {} : { hand: options.hand }) }, options);
  }

  /** Raise the right arm straight up to stop play, and keep it up until the hand goes back to the shaft (`reach(..., { close: true })`). */
  public stopPlay(options?: EverydayChain.IOptions): this {
    return this.act({ kind: "stopPlay" }, options);
  }

  /** Brake to a hover along the heading at 3 m/s², turning the broom to face a person or place as it slows, then hang in the air at rest. */
  public hover(options: EverydayChain.IOptions & { facing?: EverydayChain.Where } = {}): this {
    return this.act({ kind: "hover", ...(options.facing === undefined ? {} : { facing: EverydayChain.target(options.facing) }) }, options);
  }

  /**
   * Fly to a station beside a moving rider at the sprint's 12 m/s and keep
   * it, matching that rider's heading, speed and height, for a number of
   * seconds: a rescuer holding 3.5 m off, then escorting alongside.
   */
  public escort(subject: EverydayChain.Ref, options: EverydayChain.IOptions & { seconds: number; distance?: number; side?: "left" | "right" }): this {
    return this.act({ kind: "escort", subject: EverydayChain.id(subject), distance: options.distance ?? 3.5, side: options.side ?? "left", seconds: options.seconds }, options);
  }
}
