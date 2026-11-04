import { AutoMovieHumanArmPrior } from "../../../../../packages/human/src/generation/AutoMovieHumanArmPrior";
import { AutoMovieHumanArmAxis } from "../../../../../packages/human/src/generation/arm/AutoMovieHumanArmAxis";
import { AutoMovieHumanArmBones } from "../../../../../packages/human/src/generation/arm/AutoMovieHumanArmBones";
import { AutoMovieHumanArmGirth } from "../../../../../packages/human/src/generation/arm/AutoMovieHumanArmGirth";
import { AutoMovieHumanArmPieces } from "../../../../../packages/human/src/generation/arm/AutoMovieHumanArmPieces";
import type { IAutoMovieHumanArmPiece } from "../../../../../packages/human/src/generation/arm/IAutoMovieHumanArmPiece";
import type { IAutoMovieHumanBodyAnatomy } from "../../../../../packages/human/src/structures/body/IAutoMovieHumanBodyAnatomy";
import { HumanPeople } from "../HumanPeople";

/**
 * One left arm's spans built alone from the person's public arm inputs in
 * world millimetres: the bones placed from acromion-radiale and
 * radiale-stylion at the bind's directions (`AutoMovieHumanArmBones.place`),
 * the walk on them, the five spans (`AutoMovieHumanArmPieces.build`) and
 * their girth law (`AutoMovieHumanArmGirth`), with no body, trunk, hand or
 * skeleton generated. Built once per person per process.
 */
export namespace HumanArmPieces {
  /** The pieces of one arm. */
  export interface IPieces {
    /** Person, in findings. */
    person: string;

    /** The four tapes, world mm. */
    tapes: IAutoMovieHumanArmPiece.ITapes;

    /** The bones. */
    bones: AutoMovieHumanArmBones.IBones;

    /** The spans, proximal to distal. */
    spans: IAutoMovieHumanArmPiece[];

    /** Walk length of the upper arm tape's site, midway from acromion to olecranon, mm. */
    bicep: number;

    /** Walk length of the elbow centre, mm. */
    elbow: number;

    /** Walk length of stylion, mm. */
    stylion: number;

    /** Radiale-stylion, mm. */
    forearm: number;

    /** The girth law along the walk. */
    girth: (s: number) => number;
  }

  /** One person's arm pieces, built on first use. */
  export function of(person: string): IPieces {
    return build(person);
  }

  /** Every person of the run's arm pieces. */
  export function all(): IPieces[] {
    return HumanPeople.names().map(of);
  }
}


/** A person's arm pieces from their public inputs. */
function build(person: string): HumanArmPieces.IPieces {
  const c: IAutoMovieHumanBodyAnatomy = HumanPeople.params(person).body.anatomy;
  const prior: typeof AutoMovieHumanArmPrior.PRIOR = AutoMovieHumanArmPrior.PRIOR;
  const unit: (v: readonly number[]) => [number, number, number] = (v: readonly number[]): [number, number, number] => {
    const l: number = Math.hypot(v[0]!, v[1]!, v[2]!);
    return [v[0]! / l, v[1]! / l, v[2]! / l];
  };
  const tapes: IAutoMovieHumanArmPiece.ITapes = { bicep: c.upperArmCircumference!, elbow: c.elbowCircumference!, forearm: c.forearmCircumference!, wrist: c.wristCircumference! };
  const ar: number = c.upperArmLength!;
  const rs: number = c.forearmLength!;
  const bones: AutoMovieHumanArmBones.IBones = AutoMovieHumanArmBones.place([0, 0, 0], unit(prior.arm.upper), unit(prior.arm.lower), ar, rs);
  const axis: AutoMovieHumanArmAxis.IAxis = AutoMovieHumanArmAxis.walk(bones, (prior.arm.softness * tapes.elbow) / (2 * Math.PI));
  const spans: IAutoMovieHumanArmPiece[] = AutoMovieHumanArmPieces.build(AutoMovieHumanArmPieces.inputs(bones, axis, tapes));
  const knots: [number, number][] = AutoMovieHumanArmGirth.knots(spans);
  const elbow: number = bones.humerus;
  return {
    person,
    tapes,
    bones,
    spans,
    bicep: (bones.humerus - AutoMovieHumanArmBones.ACROMION * ar) / 2,
    elbow,
    stylion: elbow + AutoMovieHumanArmBones.RADIALE * ar + rs,
    forearm: rs,
    girth: (s: number): number => AutoMovieHumanArmGirth.at(knots, s),
  };
}
