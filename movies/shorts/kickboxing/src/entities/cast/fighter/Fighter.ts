import { AutoMovieChain } from "@automovie/engine";

import { KickboxingAction } from "../../../laws/kickboxing/KickboxingAction";
import type { KickboxingTechnique } from "../../../laws/kickboxing/KickboxingTechnique";
import { FighterBody } from "./FighterBody";
import { FighterChain } from "./FighterChain";
import { FighterFigure } from "./FighterFigure";
import type { IFighterBody } from "./IFighterBody";
import type { IFighterProfile } from "./IFighterProfile";

/**
 * A fighter of the bout, built from his settings record: his body, his
 * repertoire and habits, and capabilities that return intent chains. Every
 * capability states what he means to do, never where or when; exchanges,
 * the footwork and the schedule laws decide the rest.
 *
 * ```ts
 * const a = new Fighter(fighterA);
 * const b = new Fighter(fighterB, a); // same body controls: shared skeleton
 * exchange("s01-b04", a.jab().cross().hook(), b.parry().cover().roll());
 * ```
 *
 * @evidence docs/body/settings/cast/fighter-a.md#weapons Capabilities are limited to the repertoire.
 * @evidence docs/body/settings/cast/fighter-b.md#drops-left-arm `tell` answers a trigger with the habit of the settings.
 * @evidence docs/body/settings/cast/fighter-a.md#opponent The glove touch and obedience in the corner.
 * @evidence docs/body/settings/cast/fighter-a.md#through-bout The celebration.
 * @evidence docs/body/settings/cast/fighter-b.md#through-bout The fall, the failed attempts and lying still.
 */
export class Fighter {
  /** Stable subject id. */
  public readonly id: string;

  /** The settings record. */
  public readonly profile: IFighterProfile;

  /** His body. */
  public readonly body: IFighterBody;

  private readonly vocabulary: ReadonlySet<string>;

  /**
   * Build a fighter.
   *
   * @param profile His settings record.
   * @param shared Another fighter with identical body controls whose prepared skeleton is reused.
   * @param body A body realizing the same settings without the Human figure, for logic units.
   */
  public constructor(
    profile: IFighterProfile,
    shared?: Fighter,
    body?: IFighterBody,
  ) {
    this.id = profile.id;
    this.profile = profile;
    this.body =
      body ??
      new FighterBody(
        profile,
        shared?.body instanceof FighterBody ? shared.body : undefined,
      );
    this.vocabulary = new Set<string>([
      ...profile.repertoire,
      ...profile.defenses,
    ]);
    Object.freeze(this);
  }

  /** @returns An empty chain of this fighter. */
  public chain(): FighterChain {
    return new FighterChain(this.id, this.vocabulary);
  }

  /** Jab. @returns The chain. */
  public jab(): FighterChain {
    return this.chain().jab();
  }
  /** Cross. @returns The chain. */
  public cross(): FighterChain {
    return this.chain().cross();
  }
  /** Lead hook. @returns The chain. */
  public hook(): FighterChain {
    return this.chain().hook();
  }
  /** Lead uppercut. @returns The chain. */
  public uppercut(): FighterChain {
    return this.chain().uppercut();
  }
  /** Rear straight to the body. @returns The chain. */
  public bodyCross(): FighterChain {
    return this.chain().bodyCross();
  }
  /** Lead hook to the body. @returns The chain. */
  public bodyHook(): FighterChain {
    return this.chain().bodyHook();
  }
  /** Rear low kick. @returns The chain. */
  public lowKick(): FighterChain {
    return this.chain().lowKick();
  }
  /** Rear body kick. @returns The chain. */
  public bodyKick(): FighterChain {
    return this.chain().bodyKick();
  }
  /** Rear high kick. @returns The chain. */
  public highKick(): FighterChain {
    return this.chain().highKick();
  }
  /** Switch kick. @returns The chain. */
  public switchKick(): FighterChain {
    return this.chain().switchKick();
  }
  /** Brazilian kick. @returns The chain. */
  public brazilianKick(): FighterChain {
    return this.chain().brazilianKick();
  }
  /** Teep. @returns The chain. */
  public teep(): FighterChain {
    return this.chain().teep();
  }
  /** Clinch knee. @returns The chain. */
  public clinchKnee(): FighterChain {
    return this.chain().clinchKnee();
  }
  /** Pump-jab feint. @returns The chain. */
  public feintJab(): FighterChain {
    return this.chain().feintJab();
  }
  /** Low-kick feint. @returns The chain. */
  public feintLowKick(): FighterChain {
    return this.chain().feintLowKick();
  }
  /** Body-kick feint. @returns The chain. */
  public feintBodyKick(): FighterChain {
    return this.chain().feintBodyKick();
  }
  /** Parry. @returns The chain. */
  public parry(): FighterChain {
    return this.chain().parry();
  }
  /** Cover. @returns The chain. */
  public cover(): FighterChain {
    return this.chain().cover();
  }
  /** Slip. @returns The chain. */
  public slip(): FighterChain {
    return this.chain().slip();
  }
  /** Roll. @returns The chain. */
  public roll(): FighterChain {
    return this.chain().roll();
  }
  /** Sway. @returns The chain. */
  public sway(): FighterChain {
    return this.chain().sway();
  }
  /** Elbow block. @returns The chain. */
  public elbowBlock(): FighterChain {
    return this.chain().elbowBlock();
  }
  /** High block. @returns The chain. */
  public highBlock(): FighterChain {
    return this.chain().highBlock();
  }
  /** Check. @returns The chain. */
  public check(): FighterChain {
    return this.chain().check();
  }
  /** Take the blow. @returns The chain. */
  public take(): FighterChain {
    return this.chain().take();
  }

  /**
   * His habitual answer to a technique he sees, from his settings habits.
   *
   * @param seen The opponent's technique.
   * @returns The chain with the habit's answer.
   * @throws When no habit triggers on it.
   */
  public tell(seen: KickboxingTechnique.Name): FighterChain {
    const habit: IFighterProfile.IHabit | undefined = this.profile.habits.find(
      (h) => h.trigger.includes(seen),
    );
    if (!habit) throw new Error(`${this.id} has no habit triggered by ${seen}`);
    return new FighterChain(
      this.id,
      this.vocabulary,
      AutoMovieChain.of(
        KickboxingAction.intent(this.id, {
          kind: "defend",
          answer: habit.response,
        }),
      ),
    );
  }

  /**
   * A ring movement of whole steps.
   *
   * @param movement The movement.
   * @param steps Whole steps, at least two so both feet restore the stance.
   * @param range For approach and separation, the stance-origin distance to reach.
   * @returns The chain.
   */
  public move(
    movement: KickboxingAction.Movement,
    steps: number,
    range?: number,
  ): AutoMovieChain {
    if (!Number.isInteger(steps) || steps < 2)
      throw new Error(`A movement takes at least two whole steps: ${steps}`);
    return AutoMovieChain.of(
      KickboxingAction.intent(this.id, {
        kind: "move",
        movement,
        steps,
        ...(range === undefined ? {} : { range }),
      }),
    );
  }

  /**
   * The opening glove touch.
   *
   * @param reach Seconds to the gloves meeting.
   * @param seconds Seconds until back at kicking distance.
   * @returns The chain.
   */
  public touch(reach: number, seconds: number): AutoMovieChain {
    return AutoMovieChain.of(
      KickboxingAction.intent(this.id, { kind: "touch", reach, seconds }),
    );
  }

  /**
   * A whole-body phase: guard, fall, attempt to rise, lying still or victory.
   *
   * @param phase The phase.
   * @param seconds Its length.
   * @param anchor Optional anchor id.
   * @returns The chain.
   */
  public phase(
    phase: "guard" | "fall" | "attempt" | "lie" | "victory",
    seconds: number,
    anchor?: string,
  ): AutoMovieChain {
    return AutoMovieChain.of(
      KickboxingAction.intent(
        this.id,
        { kind: "phase", phase, seconds },
        anchor,
      ),
    );
  }

  /**
   * His displayed figure.
   *
   * @returns A new figure owned by the caller.
   */
  public figure(): FighterFigure {
    if (!(this.body instanceof FighterBody))
      throw new Error(`${this.id}'s body has no Human figure`);
    return new FighterFigure(this.profile, this.body);
  }
}
