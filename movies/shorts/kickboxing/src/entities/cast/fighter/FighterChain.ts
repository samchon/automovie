import { AutoMovieChain, type AutoMovieComposition } from "@automovie/engine";

import { KickboxingAction } from "../../../laws/kickboxing/KickboxingAction";
import { KickboxingTechnique } from "../../../laws/kickboxing/KickboxingTechnique";

/**
 * A fighter's fluent vocabulary: each call appends one intent of the same
 * fighter and returns a new chain, so a scene writes a combination as it is
 * spoken, `a.jab().cross().hook().lowKick()`, and a defense as
 * `b.parry().cover().roll().check()`. A punch remembers the punch before it,
 * which is how the timing law chains a combination. The chain is immutable
 * and wraps the engine's `AutoMovieChain`; `next` and `with` join other parts.
 *
 * @evidence docs/body/settings/cast/fighter-a.md#weapons The vocabulary is the repertoire of the settings; a technique outside the fighter's repertoire throws.
 * @evidence docs/body/settings/cast/fighter-b.md#weapons B's repertoire.
 * @evidence docs/research/kickboxing/techniques.md#punch-timing A punch inside a combination follows the previous punch's impact.
 */
export class FighterChain {
  /** The engine chain this vocabulary wraps. */
  public readonly chain: AutoMovieChain;

  /** The composition, so the chain is an engine part. */
  public readonly node: AutoMovieComposition;

  private readonly subject: string;

  private readonly repertoire: ReadonlySet<string>;

  private readonly last: KickboxingTechnique.Name | undefined;

  /**
   * A chain of one fighter's intents.
   *
   * @param subject The fighter's id.
   * @param repertoire Techniques and answers he may perform.
   * @param chain The engine chain so far, or none.
   * @param last The last strike of a combination in progress.
   */
  public constructor(
    subject: string,
    repertoire: ReadonlySet<string>,
    chain?: AutoMovieChain,
    last?: KickboxingTechnique.Name,
  ) {
    this.subject = subject;
    this.repertoire = repertoire;
    this.chain = chain ?? AutoMovieChain.of({ kind: "sequence", parts: [] });
    this.node = this.chain.node;
    this.last = last;
    Object.freeze(this);
  }

  /** Jab. @returns The chain with it. */
  public jab(): FighterChain {
    return this.strike("jab");
  }
  /** Cross. @returns The chain with it. */
  public cross(): FighterChain {
    return this.strike("cross");
  }
  /** Lead hook to the head. @returns The chain with it. */
  public hook(): FighterChain {
    return this.strike("hook");
  }
  /** Lead uppercut. @returns The chain with it. */
  public uppercut(): FighterChain {
    return this.strike("uppercut");
  }
  /** Rear straight to the body. @returns The chain with it. */
  public bodyCross(): FighterChain {
    return this.strike("body-cross");
  }
  /** Lead hook to the body or liver. @returns The chain with it. */
  public bodyHook(): FighterChain {
    return this.strike("body-hook");
  }
  /** Rear round kick to the lead thigh. @returns The chain with it. */
  public lowKick(): FighterChain {
    return this.strike("low-kick");
  }
  /** Rear round kick to the ribs. @returns The chain with it. */
  public bodyKick(): FighterChain {
    return this.strike("body-kick");
  }
  /** Rear round kick to the head. @returns The chain with it. */
  public highKick(): FighterChain {
    return this.strike("high-kick");
  }
  /** Switch kick with the lead leg to the body. @returns The chain with it. */
  public switchKick(): FighterChain {
    return this.strike("switch-kick");
  }
  /** Rear Brazilian kick from the body-kick chamber. @returns The chain with it. */
  public brazilianKick(): FighterChain {
    return this.strike("brazilian-kick");
  }
  /** Lead teep to the stomach. @returns The chain with it. */
  public teep(): FighterChain {
    return this.strike("teep");
  }
  /** Clinch for one rear knee and release. @returns The chain with it. */
  public clinchKnee(): FighterChain {
    return this.strike("knee");
  }
  /** Pump-jab feint. @returns The chain with it. */
  public feintJab(): FighterChain {
    return this.strike("feint-jab");
  }
  /** Drag feint of the low kick. @returns The chain with it. */
  public feintLowKick(): FighterChain {
    return this.strike("feint-low-kick");
  }
  /** Knee-rise feint of the body kick. @returns The chain with it. */
  public feintBodyKick(): FighterChain {
    return this.strike("feint-body-kick");
  }

  /** Rear-glove parry. @returns The chain with it. */
  public parry(): FighterChain {
    return this.defend("parry");
  }
  /** Glove-and-forearm cover. @returns The chain with it. */
  public cover(): FighterChain {
    return this.defend("cover");
  }
  /** Slip outside the punch. @returns The chain with it. */
  public slip(): FighterChain {
    return this.defend("slip");
  }
  /** Roll under the hook. @returns The chain with it. */
  public roll(): FighterChain {
    return this.defend("roll");
  }
  /** Sway back over the rear foot. @returns The chain with it. */
  public sway(): FighterChain {
    return this.defend("sway");
  }
  /** Elbow block over the ribs. @returns The chain with it. */
  public elbowBlock(): FighterChain {
    return this.defend("elbow-block");
  }
  /** Forearm block beside the head. @returns The chain with it. */
  public highBlock(): FighterChain {
    return this.defend("high-block");
  }
  /** Lead-shin check. @returns The chain with it. */
  public check(): FighterChain {
    return this.defend("check");
  }
  /** No defense: the blow lands. @returns The chain with it. */
  public take(): FighterChain {
    return this.defend("take");
  }

  /**
   * Append parts after this chain, ending any combination.
   *
   * @param parts Other parts.
   * @returns The joined chain.
   */
  public next(...parts: AutoMovieComposition.Part[]): FighterChain {
    return new FighterChain(
      this.subject,
      this.repertoire,
      this.chain.next(...parts),
    );
  }

  /**
   * Join parts in parallel with this chain.
   *
   * @param parts Other parts.
   * @returns The joined chain.
   */
  public with(...parts: AutoMovieComposition.Part[]): FighterChain {
    return new FighterChain(
      this.subject,
      this.repertoire,
      this.chain.with(...parts),
    );
  }

  private strike(technique: KickboxingTechnique.Name): FighterChain {
    if (!this.repertoire.has(technique))
      throw new Error(`${this.subject} does not throw ${technique}`);
    const spec: KickboxingTechnique.ISpec =
      KickboxingTechnique.table[technique];
    const previous: KickboxingTechnique.ISpec | undefined =
      this.last === undefined
        ? undefined
        : KickboxingTechnique.table[this.last];
    const follows: KickboxingTechnique.Name | undefined =
      previous !== undefined && previous.family === "punch"
        ? previous.name
        : undefined;
    return new FighterChain(
      this.subject,
      this.repertoire,
      this.chain.next(
        KickboxingAction.intent(this.subject, {
          kind: "strike",
          technique,
          ...(follows ? { follows } : {}),
        }),
      ),
      spec.family === "feint" ? undefined : technique,
    );
  }

  private defend(answer: KickboxingAction.Answer): FighterChain {
    if (!this.repertoire.has(answer))
      throw new Error(`${this.subject} does not ${answer}`);
    return new FighterChain(
      this.subject,
      this.repertoire,
      this.chain.next(
        KickboxingAction.intent(this.subject, { kind: "defend", answer }),
      ),
    );
  }
}
