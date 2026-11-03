import { AutoMovieHumanFootPrior } from "../../../../../packages/human/src/generation/AutoMovieHumanFootPrior";
import { AutoMovieHumanLegBones } from "../../../../../packages/human/src/generation/leg/AutoMovieHumanLegBones";
import { AutoMovieHumanLegCrotchHeight } from "../../../../../packages/human/src/generation/leg/AutoMovieHumanLegCrotchHeight";
import { AutoMovieHumanLegGirth } from "../../../../../packages/human/src/generation/leg/AutoMovieHumanLegGirth";
import { AutoMovieHumanLegReliefs } from "../../../../../packages/human/src/generation/leg/AutoMovieHumanLegReliefs";
import type { AutoMovieHumanLegStations } from "../../../../../packages/human/src/generation/leg/AutoMovieHumanLegStations";
import type { IAutoMovieHumanRelief } from "../../../../../packages/human/src/network/IAutoMovieHumanRelief";
import type { IAutoMovieHumanBodyControls } from "../../../../../packages/human/src/structures/body/IAutoMovieHumanBodyControls";
import { HumanFootPieces } from "../foot/HumanFootPieces";
import { HumanOnce } from "../HumanOnce";
import { HumanPeople } from "../HumanPeople";

/**
 * One left leg's construction pieces built alone from the person's public
 * inputs in world millimetres (scale 1): the joint centres
 * (`AutoMovieHumanLegBones`), the girth law (`AutoMovieHumanLegGirth`) and the
 * fourteen relief windows (`AutoMovieHumanLegReliefs`), with no body, trunk,
 * foot chain or skeleton generated. Built once per person per process.
 */
export namespace HumanLegPieces {
  /** The pieces of one leg. */
  export interface IPieces {
    /** Person, in findings. */
    person: string;

    /** The tapes the law reads, world mm. */
    tapes: AutoMovieHumanLegGirth.ITapes;

    /** The joint centres of the left leg. */
    bones: AutoMovieHumanLegBones.IBones;

    /** The joints' heights the stations read. */
    heights: AutoMovieHumanLegStations.IBones;

    /** The lateral malleolus height input, mm. */
    ankleHeight: number;

    /** The crotch height by the inseam's definition, mm. */
    crotch: number;

    /** The ankle ring's height, where the leg takes the foot's ring, mm. */
    ring: number;

    /** The girth law. */
    girth: (s: number) => number;

    /** The relief windows on the leg's own span. */
    reliefs: IAutoMovieHumanRelief[];
  }

  /** One person's leg pieces, built on first use. */
  export function of(person: string): IPieces {
    return cache.read(person, (): IPieces => build(person));
  }

  /** Every person of the run's leg pieces. */
  export function all(): IPieces[] {
    return HumanPeople.names().map(of);
  }
}

/** One build per person. */
const cache: HumanOnce<HumanLegPieces.IPieces> = new HumanOnce();

/** A person's leg pieces from their public inputs. */
function build(person: string): HumanLegPieces.IPieces {
  const c: IAutoMovieHumanBodyControls = HumanPeople.params(person).body.controls;
  const ankleHeight: number = HumanFootPieces.dimensions(person, "left").ankle;
  const bones: AutoMovieHumanLegBones.IBones = AutoMovieHumanLegBones.of({
    stature: c.height.value!,
    scale: 1,
    ankleHeight,
    medial: AutoMovieHumanFootPrior.PRIOR.malleoli.medial.height,
    hipForward: 0,
    ankleForward: 0,
  });
  const heights: AutoMovieHumanLegStations.IBones = { hip: bones.hip[1], knee: bones.knee[1], ankle: bones.ankle[1] };
  const tapes: AutoMovieHumanLegGirth.ITapes = { thigh: c.thigh.value!, knee: c.knee.value!, calf: c.calf.value! };
  const girth: (s: number) => number = AutoMovieHumanLegGirth.of({ tapes, bones: heights, scale: 1 });
  const crotch: number = AutoMovieHumanLegCrotchHeight.of({ inseam: c.inseam.value!, ankleHeight });
  const ring: number = AutoMovieHumanFootPrior.PRIOR.ring * ankleHeight;
  return { person, tapes, bones, heights, ankleHeight, crotch, ring, girth, reliefs: AutoMovieHumanLegReliefs.of(heights, girth, [ring, crotch]) };
}
