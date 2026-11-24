import { readPreparedBendClinical } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEvaluation,
  IAutoMovieQuaternion,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanBody } from "../body/createHumanBody";
import { HumanArmBendRoom } from "../posture/HumanArmBendRoom";
import type { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/** The ordinary elbow candidate and its continuation seed. */
type IAutoMovieBendResult = {
  candidate: AutoMovieMotionHumanBendSearch.ICandidate;
  seed: IAutoMovieSwivelSeed;
};

/** Exact scalar dependencies of one ordinary legality-then-strain search. */
type AutoMovieBendWord = number | string | null | undefined;

/** A completed numerical search, kept in one current/onset slot. */
interface IAutoMovieCompletedBend {
  words: readonly AutoMovieBendWord[];
  room: HumanArmBendRoom;
  score: AutoMovieMotionHumanBendSearch.IScore;
  leads: readonly number[];
  result: IAutoMovieBendResult;
}

/** Two reusable ordinary elbow searches during one projectile contact sweep. */
export class AutoMovieMotionHumanBendRepeat {
  /** Results belong to the sweep and to the actual owner of this writer. */
  readonly #plans: WeakMap<object, (IAutoMovieCompletedBend | undefined)[]> =
    new WeakMap();

  /**
   * The bend loan an evaluation carries, when it is one this owner made; an
   * evaluation without one, or with another's, borrows no completed bend.
   *
   * @param evaluation The evaluation's explicit context.
   * @returns The loan, or undefined.
   */
  public static loan(
    evaluation: IAutoMovieMotionHumanEvaluation | undefined,
  ): AutoMovieMotionHumanBendRepeat.IRead | undefined {
    const bend: IAutoMovieMotionHumanEvaluation.IBendLoan | undefined =
      evaluation?.bend;
    return bend instanceof Read ? bend : undefined;
  }

  /** Create the private per-read loan of an ordinary Bend numerical trial. */
  public read(owner: object): AutoMovieMotionHumanBendRepeat.IRead {
    let slots: (IAutoMovieCompletedBend | undefined)[] | undefined =
      this.#plans.get(owner);
    if (slots === undefined) {
      slots = [];
      this.#plans.set(owner, slots);
    }
    return new Read(slots, owner);
  }
}

export namespace AutoMovieMotionHumanBendRepeat {
  /** An operation-local loan for one actual arm writer. */
  export type IRead = Read;
}

/** Original runtime request to the exact numeric trial. */
interface IAutoMovieBendTrialInput {
  chain: AutoMovieMotionHumanBendChain.IChain;
  body: IAutoMovieMotionHumanBody;
  side: AutoMovieHumanSide;
  point: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  neutral: AutoMovieMotionHumanBendSearch.IAngles;
  clinical: Parameters<typeof readPreparedBendClinical>[0];
}
/** The alternatives of `StartRole`'s site. */
type StartRole = 0 | 1;

/** Role-indexed trial creation for one original placed posture. */
class Read implements IAutoMovieMotionHumanEvaluation.IBendLoan {
  public constructor(
    private readonly slots: (IAutoMovieCompletedBend | undefined)[],
    public readonly owner: object,
  ) {}

  /** Start an ordinary search for the original current or onset role. */
  public start(
    role: StartRole,
    input: IAutoMovieBendTrialInput,
  ): Trial | undefined {
    const measure: readonly [number, number] | undefined =
      createHumanBody.bendMeasure(input.body);
    const clinical: ReturnType<typeof readPreparedBendClinical> =
      measure === undefined
        ? undefined
        : readPreparedBendClinical(input.clinical);
    if (measure === undefined || clinical === undefined) return undefined;

    const { chain, side, point, rotation, neutral } = input;
    const prepared: AutoMovieMotionHumanBendChain.IChain["prepared"] =
      chain.prepared;
    const held: readonly PropertyDescriptor[] = [
      "flexion",
      "abduction",
      "twist",
    ].map(
      (axis: string): PropertyDescriptor =>
        Object.getOwnPropertyDescriptor(neutral, axis) ?? {},
    );
    if (
      !held.every(
        (entry: PropertyDescriptor): boolean =>
          typeof entry.value === "number" && Number.isFinite(entry.value),
      )
    )
      return undefined;
    const words: readonly AutoMovieBendWord[] = [
      side,
      ...measure,
      ...clinical,
      ...held.map((entry: PropertyDescriptor): number => entry.value),
      ...vector(point),
      ...orientation(rotation),
      ...vector(prepared.upper.worldPosition),
      ...orientation(prepared.upper.worldRotation),
      ...vector(prepared.lowerOffset),
      ...orientation(prepared.lowerRotation),
      ...vector(prepared.effectorOffset),
      ...orientation(prepared.effectorBaseRotation),
    ];
    return new Trial(this.slots, role, words);
  }
}

/** Shared fresh elbow result with no input aliases. */
function fresh(value: IAutoMovieBendResult): IAutoMovieBendResult {
  return {
    candidate: {
      ...value.candidate,
      elbow: { ...value.candidate.elbow },
      angles: { ...value.candidate.angles },
    },
    seed: { ...value.seed },
  };
}

/** Exact candidate words in explicit geometric order. */
function vector(value: IAutoMovieVector3): readonly number[] {
  return [value.x, value.y, value.z];
}

/** Exact quaternion words without sign canonicalization. */
function orientation(value: IAutoMovieQuaternion): readonly number[] {
  return [...vector(value), value.w];
}
/** The alternatives of `TrialRole`'s site. */
type TrialRole = 0 | 1;

/** One ordinary numeric search and its current first real score. */
class Trial {
  public readonly room: HumanArmBendRoom = new HumanArmBendRoom();
  readonly #repeat: object = {};
  #score: AutoMovieMotionHumanBendSearch.IScore | undefined;
  #reused: IAutoMovieBendResult | undefined;

  public constructor(
    private readonly slots: (IAutoMovieCompletedBend | undefined)[],
    private readonly role: TrialRole,
    private readonly words: readonly AutoMovieBendWord[],
  ) {}

  /** Compare after the original first actual candidate and its physical scoring. */
  public score(score: AutoMovieMotionHumanBendSearch.IScore): void {
    if (this.#score !== undefined) return;
    this.#score = score;
    const old: IAutoMovieCompletedBend | undefined = this.slots[this.role];
    if (
      old === undefined ||
      !Object.is(old.score.overshoot, score.overshoot) ||
      !Object.is(old.score.deviation, score.deviation) ||
      this.words.length !== old.words.length ||
      !this.words.every((word: AutoMovieBendWord, index: number): boolean =>
        Object.is(word, old.words[index]),
      ) ||
      !this.room.same(old.room) ||
      this.room.trial.status() === "unsupported" ||
      old.room.trial.status() !== "current"
    )
      return;

    this.room.finish(old.leads);
    this.#reused = fresh(old.result);
    throw this.#repeat;
  }

  /**
   * Publish only a completed owner-proved search, or return the actual old
   * refusal.
   */
  public complete(
    run: () => IAutoMovieBendResult | null,
  ): IAutoMovieBendResult | null {
    try {
      const result: IAutoMovieBendResult | null = run();
      const leads: readonly number[] | undefined = this.room.completed();
      if (result !== null && this.#score !== undefined && leads !== undefined)
        this.slots[this.role] = {
          words: this.words,
          score: this.#score,
          room: this.room,
          leads,
          result: fresh(result),
        };
      else this.slots[this.role] = undefined;
      return result;
    } catch (error) {
      if (error === this.#repeat) return this.#reused!;
      this.slots[this.role] = undefined;
      throw error;
    }
  }
}
