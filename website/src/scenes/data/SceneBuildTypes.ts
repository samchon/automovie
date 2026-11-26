import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionParams,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionObstacleAperture,
} from "@automovie/interface";
import type { AutoMovieMotionHumanCarryPerson } from "@automovie/motions";
import type { HumanSocial, shoulderClasp } from "@automovie/motions/internal";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";

/**
 * The scene authoring boundary's types: each action name the site can call
 * paired with its law's own inputs, so the website type check rejects a
 * stale scene input the moment a law changes.
 */
export namespace SceneBuildTypes {
  /** Registration names that differ from their canonical family export keys. */
  type LexiconAliases = {
    stageFight: { HumanStageProp: "stageProp" };
    ride: {
      HumanHandrimStroke: "handrimStroke";
      HumanBicycleEffort: "bicycleEffort";
      HumanBikeTransfer: "bikeTransfer";
      HumanBikeGuide: "bikeGuide";
      HumanLeadHorse: "leadHorse";
      HumanLunge: "lungeHorse";
      HumanHoldHandles: "holdHandles";
      HumanFloatBeside: "floatBeside";
      HumanMounted: "mounted";
      HumanUnseat: "unseat";
      HumanPolo: "polo";
      HumanBoard: "board";
      HumanClasp: "clasp";
      HumanDrape: "drape";
      HumanTrick: "trick";
      HumanRoman: "roman";
      HumanLasso: "lasso";
      HumanSabre: "sabre";
      HumanLanceCouch: "lanceCouch";
    };
    sport: { HumanSittingVolley: "sittingVolley" };
    support: {
      HumanAidWalk: "aidWalk";
      HumanAssistedTransfer: "assistedTransferBody";
    };
    sword: {
      cut: "swordCut";
      guard: "swordGuard";
      parry: "swordParry";
      thrust: "swordThrust";
    };
    weaponFirearm: {
      present: "presentFirearm";
      fire: "fireFirearm";
      draw: "drawFirearm";
      holster: "holsterFirearm";
    };
    weaponMelee: { reload: "reloadFirearm" };
    manipulate: { sequence: "manipulate" };
    upperPhrase: { phrase: "armPhrase" };
    revolver: { cock: "cockRevolver" };
  };

  /** A lexicon family the motions package installs. */
  type Family = keyof IAutoMovieMotionHumanLexiconParams;

  /** One family's rows keyed by their registered names, each with its law inputs. */
  type FamilyRows<F extends Family> = {
    [K in keyof IAutoMovieMotionHumanLexiconParams[F] as F extends keyof LexiconAliases
      ? K extends keyof LexiconAliases[F]
        ? LexiconAliases[F][K] & string
        : K
      : K]: IAutoMovieMotionHumanLexiconParams[F][K];
  };

  /** Every registered lexicon row name across the families. */
  type LexiconName = { [F in Family]: keyof FamilyRows<F> }[Family];

  /** The installed vocabulary and lexicon names a scene can call. */
  export type ActionName =
    | keyof IAutoMovieMotionHumanActionParams
    | LexiconName;

  /** The law inputs of a built-in action, or of the lexicon row registered under the name. */
  type LawParams<N extends ActionName> =
    N extends keyof IAutoMovieMotionHumanActionParams
      ? IAutoMovieMotionHumanActionParams[N]
      : {
          [F in Family]: N extends keyof FamilyRows<F>
            ? FamilyRows<F>[N]
            : never;
        }[Family];

  /** An object's seat, resolved by the playground adapter before planning. */
  export interface ISeatReference {
    /** Subject id of the object carrying the seat. */
    $seat: string;

    /** Seat affordance id when the object has several. */
    id?: string;
  }

  /** An object's opening, resolved by the playground adapter before planning. */
  interface IApertureReference {
    /** Subject id of the object carrying the opening. */
    $aperture: string;

    /** Aperture affordance id when the object has several. */
    id?: string;
  }

  /** Give an interface the record shape used for serialization without adding keys. */
  type PlainParams<P> = P extends object
    ? keyof P extends never
      ? Record<string, never>
      : { [K in keyof P]: P[K] }
    : never;

  /** Law inputs whose `seat` and `through` also accept the site's object references. */
  type ObjectReferences<P> = P extends object
    ? {
        [K in keyof P]: K extends "seat"
          ?
              | P[K]
              | (IAutoMovieMotionHumanSeated.ISeat extends P[K]
                  ? ISeatReference
                  : never)
          : K extends "through"
            ?
                | P[K]
                | (IAutoMovieMotionObstacleAperture extends P[K]
                    ? IApertureReference
                    : never)
            : P[K];
      }
    : never;

  /** An action's law inputs with the object references resolved by the site. */
  export type ActionParams<N extends ActionName> = ObjectReferences<
    PlainParams<LawParams<N>>
  >;

  /** Action names whose law takes no required arguments. */
  export type OptionalActionName = {
    [N in ActionName]: {} extends ActionParams<N> ? N : never;
  }[ActionName];

  /** Chain operators applied to an authored action. */
  export interface IActionOptions extends Pick<
    IPlaygroundComposition.IAction,
    "anchor" | "sync"
  > {
    /** Where the action is interrupted, in the schedule's tagged form. */
    until?: IAutoMovieIntent.IUntil;

    /** Actions layered over this one after their own inputs have been checked. */
    over?: AuthoredAction[];
  }

  /** A built-in or registered action paired with its own law inputs. */
  export type AuthoredAction = {
    [N in ActionName]: { name: N; params: ActionParams<N> } & IActionOptions;
  }[ActionName];

  /** The mutual law records the site's scenes call, by name. */
  type MutualLaws = Pick<
    typeof HumanSocial,
    | "armWrestle"
    | "rockPaperScissors"
    | "thumbWrestle"
    | "toast"
    | "toastOfFour"
  > &
    Pick<typeof AutoMovieMotionHumanCarryPerson.HumanCoupled, "grappling"> & {
      shoulderClasp: typeof shoulderClasp;
      assistedTransfer: NonNullable<
        (typeof AutoMovieMotionHumanCarryPerson.HumanAssistedTransfer)["mutual"]
      >;
    };

  /** Mutual actions supplied by the installed records used in scene data. */
  type MutualName = keyof MutualLaws;

  /** The role names given by a mutual law. */
  type MutualCast<N extends MutualName> = Parameters<MutualLaws[N]["act"]>[2];

  /** Common inputs given by a mutual law. */
  type MutualParams<N extends MutualName> = PlainParams<
    Parameters<MutualLaws[N]["act"]>[1]
  >;

  /** A mutual name with that law's cast and required or optional inputs. */
  export type MutualArguments = {
    [N in MutualName]: {} extends MutualParams<N>
      ? [name: N, cast: MutualCast<N>, params?: MutualParams<N>]
      : [name: N, cast: MutualCast<N>, params: MutualParams<N>];
  }[MutualName];

  /** A mutual action paired with its cast and common inputs. */
  export type AuthoredMutual = {
    [N in MutualName]: {
      name: N;
      cast: MutualCast<N>;
      params: MutualParams<N>;
    };
  }[MutualName];

  /** An authored performer whose actions have matching law inputs. */
  export interface IAuthoredPerformer extends Omit<
    IPlaygroundComposition.IPerformer,
    "actions"
  > {
    /** The performer's own action chain. */
    actions: AuthoredAction[];
  }

  /** The authored data before it enters the playground's serializable format. */
  export interface IAuthoredComposition extends Omit<
    IPlaygroundComposition,
    "performers" | "mutuals"
  > {
    /** The people and their law-checked actions. */
    performers: IAuthoredPerformer[];

    /** The law-checked shared actions. */
    mutuals: AuthoredMutual[];
  }
}
