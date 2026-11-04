import type { AutoMovieViewLoft, IAutoMovieLoftChain, IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../../src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanEarPlace } from "../../src/generation/AutoMovieHumanEarPlace";
import { AutoMovieHumanFacePlan } from "../../src/generation/AutoMovieHumanFacePlan";
import { AutoMovieHumanHeadArcs } from "../../src/generation/AutoMovieHumanHeadArcs";
import type { AutoMovieHumanHeadConstruction } from "../../src/generation/AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadLandmarks } from "../../src/generation/AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadPass } from "../../src/generation/AutoMovieHumanHeadPass";
import { AutoMovieHumanHeadComposer } from "../../src/generation/head/AutoMovieHumanHeadComposer";
import type { IAutoMovieHumanHeadBuilt } from "../../src/generation/IAutoMovieHumanHeadBuilt";
import type { IAutoMovieHumanEar } from "../../src/structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanParameters } from "../../src/structures/IAutoMovieHumanParameters";
import type { AutoMovieHumanSex } from "../../src/typings/AutoMovieHumanSex";
import { HumanDebugViewTap } from "./HumanDebugViewTap";

/**
 * Every view part of one person as the current source builds it, with its loft, for the view
 * comparison.
 *
 * The body's parts are the ones `AutoMovieHumanBodyLaw.calibrate` lofts (the body lane: the
 * trunk and its masses, legs, arms, hands, digits, feet and toes). The head's are the ones the
 * head composer lofts from the head pass's first build, the way the `head.parts` piece builds
 * them: the head mass, the neck and every face part. Both run under `HumanDebugViewTap`, so each
 * part is exactly what the production operator received; a part lofted twice keeps its last loft.
 *
 * Every coordinate is calibration millimetres; `scale` takes them to the person's millimetres
 * about the floor origin, as the model's own stature scale does.
 */
export namespace HumanDebugViewParts {
  /** One built part. */
  export interface IPart {
    /** The part's name. */
    name: string;

    /** The part as handed to the operator. */
    part: IAutoMovieViewPart;

    /** The operator's result. */
    loft: AutoMovieViewLoft.IResult;
  }

  /** A person's parts. */
  export interface IOutput {
    /** Parts by first appearance, each with its last loft. */
    parts: IPart[];

    /** Person millimetres per calibration millimetre. */
    scale: number;

    /** Why the head's parts are missing, or null when they were built. */
    headFailure: string | null;

    /** How many times each part lofted more than once was lofted; only its last loft is kept. */
    repeats: Record<string, number>;
  }

  /**
   * Build one person's view parts.
   *
   * @param parameters The person's public inputs.
   * @returns The parts, the scale and the head's failure if any.
   */
  export function of(parameters: IAutoMovieHumanParameters): IOutput {
    const body: { value: AutoMovieHumanBodyLaw.IOutput; records: HumanDebugViewTap.IRecord[] } = HumanDebugViewTap(
      (): AutoMovieHumanBodyLaw.IOutput => AutoMovieHumanBodyLaw.calibrate(parameters),
    );
    const records: HumanDebugViewTap.IRecord[] = [...body.records];
    let headFailure: string | null = null;
    const neckChain: IAutoMovieLoftChain | undefined = body.value.body.chains.find((c: IAutoMovieLoftChain): boolean => c.name === "head");
    if (neckChain === undefined) headFailure = "the calibration has no neck chain `head`";
    else
      try {
        records.push(...HumanDebugViewTap((): void => head(parameters, neckChain)).records);
      } catch (error) {
        headFailure = error instanceof Error ? (error.stack ?? error.message) : String(error);
      }
    const byName: Map<string, IPart> = new Map();
    const counts: Map<string, number> = new Map();
    for (const r of records) {
      byName.set(r.part.name, { name: r.part.name, part: r.part, loft: r.loft });
      counts.set(r.part.name, (counts.get(r.part.name) ?? 0) + 1);
    }
    const repeats: Record<string, number> = Object.fromEntries([...counts].filter(([, n]: [string, number]): boolean => n > 1));
    const stature: number = AutoMovieHumanBodyAnatomy.resolve(parameters).stature;
    return { parts: [...byName.values()], scale: stature / body.value.body.stature, headFailure, repeats };
  }

  /** The head composer's run, as the `head.parts` piece makes it. */
  function head(parameters: IAutoMovieHumanParameters, neckChain: IAutoMovieLoftChain): void {
    const inputs: AutoMovieHumanHeadConstruction.IInputs = AutoMovieHumanBodyLaw.headInputs(parameters);
    const built: IAutoMovieHumanHeadBuilt = AutoMovieHumanHeadPass.build(AutoMovieHumanHeadPass.prepare(neckChain, inputs), AutoMovieHumanHeadLandmarks.NONE);
    const sex: AutoMovieHumanSex = AutoMovieHumanBodyAnatomy.sexOf(parameters);
    const k: number = built.plan.scale;
    const tragion: number = built.plan.vertex - AutoMovieHumanHeadArcs.tragionDrop(inputs.head, sex) * k;
    const top = (ear: IAutoMovieHumanEar): number => tragion + AutoMovieHumanEarPlace.aboveTragion(ear, sex) * k;
    AutoMovieHumanHeadComposer.compose(built.plan, inputs.head.earPair, neckChain, {
      tragion,
      ears: { left: top(inputs.head.earPair.left), right: top(inputs.head.earPair.right) },
      faceExponent: AutoMovieHumanFacePlan.exponent(inputs.head, sex),
    });
  }
}
