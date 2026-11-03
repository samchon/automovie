import { AutoMovieHumanFootConstruction } from "../../../../../packages/human/src/generation/AutoMovieHumanFootConstruction";
import { AutoMovieHumanFootPrior } from "../../../../../packages/human/src/generation/AutoMovieHumanFootPrior";
import { AutoMovieHumanFootBody } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootBody";
import { AutoMovieHumanFootBones } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootBones";
import { AutoMovieHumanFootContactLateralGuide } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootContactLateralGuide";
import { AutoMovieHumanFootContactMedialGuide } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootContactMedialGuide";
import { AutoMovieHumanFootCrestForefoot } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootCrestForefoot";
import { AutoMovieHumanFootCrestGuide } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootCrestGuide";
import type { AutoMovieHumanFootFrame } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootFrame";
import { AutoMovieHumanFootLateralGuide } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootLateralGuide";
import { AutoMovieHumanFootMedialGuide } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootMedialGuide";
import { AutoMovieHumanFootToeSpan } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootToeSpan";
import { AutoMovieHumanFootWebLine } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootWebLine";
import { AutoMovieHumanFootWebRing } from "../../../../../packages/human/src/generation/foot/AutoMovieHumanFootWebRing";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanOnce } from "../HumanOnce";
import { HumanPeople } from "../HumanPeople";

/**
 * One foot's construction pieces built alone from the person's three foot
 * inputs (foot length, foot breadth, lateral malleolus height), in the left
 * foot's frame as the foot's composer builds both sides, with no body, leg or
 * skeleton generated. Each person and side is built once per process.
 */
export namespace HumanFootPieces {
  /** The pieces of one foot. */
  export interface IPieces {
    /** Person, in findings. */
    person: string;

    /** Side whose inputs built it. */
    side: "left" | "right";

    /** The three inputs in world millimetres. */
    dimensions: AutoMovieHumanFootFrame.IDimensions;

    /** The anatomical centres and the frame. */
    centres: AutoMovieHumanFootBones.ICentres;

    /** The fan of section planes. */
    line: AutoMovieHumanFootWebLine.IWebLine;

    /** The five guides. */
    guides: AutoMovieHumanFootBody.IGuides;

    /** The body: its stations and its section at any station. */
    body: AutoMovieHumanFootBody.IBody;

    /** The toes' arcs of the web ring. */
    web: AutoMovieHumanFootWebRing.IWebRing;

    /** Each toe on its line, hallux first. */
    toes: AutoMovieHumanFootToeSpan.IToe[];
  }

  /**
   * A person's foot inputs for one side, world mm: the side's own measures, or
   * what the body's stature and sex expect when the side has none.
   */
  export function dimensions(person: string, side: "left" | "right"): AutoMovieHumanFootFrame.IDimensions {
    const params: IAutoMovieHumanParameters = HumanPeople.params(person);
    const given: { footLength: number; footBreadth: number; ankleHeight: number } | undefined = params.extremities?.feet?.[side];
    if (given !== undefined) return { length: given.footLength, breadth: given.footBreadth, ankle: given.ankleHeight };
    return AutoMovieHumanFootConstruction.expected(params.body.controls.height.value!, params.body.controls.masculineFeminine.value ?? 0, 1);
  }

  /** One foot's pieces, built on first use. */
  export function of(person: string, side: "left" | "right"): IPieces {
    return cache.read(`${person}/${side}`, (): IPieces => build(person, side, dimensions(person, side)));
  }

  /**
   * One foot's pieces from given inputs, the way the foot's composer builds
   * them: centres, the web line, the five guides, the body, the web ring and
   * the toes.
   */
  export function build(person: string, side: "left" | "right", dimensions: AutoMovieHumanFootFrame.IDimensions): IPieces {
    const centres: AutoMovieHumanFootBones.ICentres = AutoMovieHumanFootBones.of(dimensions, 1);
    const k: AutoMovieHumanFootFrame.IFrame = centres.frame;
    const line: AutoMovieHumanFootWebLine.IWebLine = AutoMovieHumanFootWebLine.of({ frame: k, depth: AutoMovieHumanFootCrestForefoot.depth });
    const guides: AutoMovieHumanFootBody.IGuides = {
      crest: AutoMovieHumanFootCrestGuide.of(k, line),
      lateral: AutoMovieHumanFootLateralGuide.of(k, line),
      contactLateral: AutoMovieHumanFootContactLateralGuide.of(k, line),
      contactMedial: AutoMovieHumanFootContactMedialGuide.of(k, line),
      medial: AutoMovieHumanFootMedialGuide.of(k, line),
    };
    const body: AutoMovieHumanFootBody.IBody = AutoMovieHumanFootBody.of({ frame: k, line, guides });
    const web: AutoMovieHumanFootWebRing.IWebRing = AutoMovieHumanFootWebRing.of(k, body);
    const toes: AutoMovieHumanFootToeSpan.IToe[] = AutoMovieHumanFootPrior.PRIOR.toes.map(
      (_: AutoMovieHumanFootPrior.IToe, i: number): AutoMovieHumanFootToeSpan.IToe =>
        AutoMovieHumanFootToeSpan.of({ frame: k, lines: centres.lines, index: i }),
    );
    return { person, side, dimensions, centres, line, guides, body, web, toes };
  }

  /** Every foot of the run's people, left then right per person. */
  export function all(): IPieces[] {
    return HumanPeople.names().flatMap((name: string): IPieces[] => [of(name, "left"), of(name, "right")]);
  }
}

/** One build per person and side. */
const cache: HumanOnce<HumanFootPieces.IPieces> = new HumanOnce();
