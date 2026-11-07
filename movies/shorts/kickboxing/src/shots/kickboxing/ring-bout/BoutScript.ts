import { BoutChoreography } from "../../../motion/choreography/BoutChoreography";
import { BoutGeometry } from "../../../motion/choreography/BoutGeometry";
import { BoutOutcome } from "../../../motion/choreography/BoutOutcome";
import { BoutTechnique } from "../../../motion/choreography/BoutTechnique";
import { BoutComposition } from "./BoutComposition";

/**
 * The performed bout every motion, contact, sound and audit module reads: the
 * screenplay {@link BoutComposition} performed for the film seed, with each
 * computed outcome's visible answer, plus the ring geography the camera and
 * stance follow.
 */
export namespace BoutScript {
  /** End of the opening glove touch, film seconds. */
  export const TOUCHED: number = BoutComposition.TOUCHED;

  /** Knockout contact, film seconds. */
  export const KNOCKOUT: number = BoutComposition.KNOCKOUT;

  /** The film's variation seed. */
  export const SEED: string = BoutComposition.SEED;

  /** The bout as composed intent, in screenplay order. */
  export const groups: readonly BoutChoreography.IGroup[] = BoutComposition.groups;

  /** Technique names, registered once in {@link BoutTechnique}. */
  export type Technique = BoutTechnique.Name;

  /** One fighter. */
  export type Fighter = BoutChoreography.Fighter;

  /** Visible answer derived from the computed outcome, consumed by the defense, reaction, contact and sound modules. */
  export type Defense = BoutOutcome.Presentation;

  /** One performed strike: composed intent, computed outcome and the answer it presents. */
  export interface Action extends BoutChoreography.IAction {
    /** Visible answer derived from the computed outcome. */ readonly defense: Defense;
  }

  /** Perform the composition for a film seed and the actual or estimated extents. */
  export function perform(options: BoutChoreography.IOptions): readonly Action[] {
    return BoutChoreography.perform(groups, options).map(
      (action: BoutChoreography.IAction): Action =>
        Object.freeze({ ...action, defense: BoutOutcome.presentation(action.answer, action.outcome) }),
    );
  }

  /** Extents of the two 180 cm fighters from stature, used before prepared colliders are measured. */
  export const extents: BoutGeometry.IExtents = BoutGeometry.anthropometric(1.8);

  /** All strikes and feints in film order, performed for the film seed. */
  export const actions: readonly Action[] = Object.freeze(perform({ seed: SEED, extents }));

  /** The knockout kick. */
  export const finish: Action = actions[actions.length - 1]!;

  /** Registered technique timing, reach and target, read by every motion module. */
  export const specs: Readonly<Record<Technique, BoutTechnique.ISpec>> = BoutTechnique.registry;

  /**
   * Ring geography: [film second, centre X, centre Z, axis angle].
   *
   * The axis angle is the world heading from A toward B (0 = +X). The pair
   * drifts and turns slowly; camera framing follows these keys.
   */
  export const geography: readonly (readonly [
    number,
    number,
    number,
    number,
  ])[] = [
    [0, 0, 0, 0],
    [15, 0.35, 0.25, 0.25],
    [30, 0.1, -0.35, -0.2],
    [45, -0.4, -0.1, 0.15],
    [60, -0.2, 0.3, 0.35],
    [75, 0.3, 0.1, -0.1],
    [90, 0.2, -0.4, -0.35],
    [105, -0.1, 0.0, 0.0],
    [120, -0.6, 0.15, 0.3],
    [135, -0.1, 0.2, 0.05],
    [150, 0.05, -0.1, -0.15],
  ];

  /**
   * Stance-origin distance when neither fighter is attacking, metres: outside
   * kicking range, so every exchange needs a step in and the heads stay about
   * 1.6 m apart between exchanges.
   */
  export const neutralRange: number = 1.82;
}
