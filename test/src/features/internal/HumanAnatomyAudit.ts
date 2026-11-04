import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyArm } from "./HumanAnatomyArm";
import { HumanAnatomyFoot } from "./HumanAnatomyFoot";
import { HumanAnatomyHand } from "./HumanAnatomyHand";
import { HumanAnatomyHead } from "./HumanAnatomyHead";
import { HumanAnatomyHeadConsistency } from "./HumanAnatomyHeadConsistency";
import { HumanAnatomyTrunkSilhouette } from "./HumanAnatomyTrunkSilhouette";
import { HumanAnatomyLeg } from "./HumanAnatomyLeg";
import { HumanAnatomyPose } from "./HumanAnatomyPose";
import { HumanAnatomyTrunk } from "./HumanAnatomyTrunk";
import { HumanPeople } from "./HumanPeople";

const A: typeof HumanAnatomy = HumanAnatomy;


/**
 * Anatomical measurements of a generated person, each taken on the skin at a
 * site its published definition locates, against an expectation from the
 * public inputs or from published anthropometry. Nothing reads the
 * construction's constants or fields.
 */
export namespace HumanAnatomyAudit {
  /** One measurement against its expectation. */
  export interface IRow {
    /** Person. */
    person: string;

    /** What was measured, and where. */
    site: string;

    /** Measured value; NaN when the site could not be found. */
    value: number;

    /** Least value that passes. */
    low: number;

    /** Largest value that passes. */
    high: number;

    /** Unit of the value. */
    unit: string;
  }

  /**
   * What a region's audit measures: a closed skin and the public inputs it
   * should honour. A generated person and a reference body are both subjects,
   * so one observer reads both and a reference proves the observer green.
   */
  export interface ISubject {
    /** Name in findings. */
    name: string;

    /** Public inputs the skin should honour. */
    params: IAutoMovieHumanParameters;

    /** The skin as built or as captured, joints located. */
    bind: () => HumanAnatomy.ISkin;

    /** The skin at the anatomical neutral, hands and feet straightened; a reference stands in its own pose. */
    neutral: () => HumanAnatomy.ISkin;

    /** The skin under a pose, for a generated subject. */
    posed?: (pose: IAutoMovieHumanPose) => HumanAnatomy.ISkin;

    /** The rigged person, for a generated subject. */
    person?: () => HumanPeople.IRigged;

    /** Every skin view of a generated subject, held by the subject. */
    views?: () => HumanAnatomy.IViews;

    /** Whether the subject carries an oral cavity whose teeth the closed lips must hide. */
    mouth: boolean;

    /**
     * Whether the subject comes from the one Human construction, so the
     * construction's own contracts bind it: mirror symmetry of sides built
     * from shared inputs, and any other row that holds by how the figure is
     * made rather than by anatomy. A captured real body does not.
     */
    construction: boolean;

    /**
     * Whether `neutral()` straightens the hands and feet to the anatomical
     * neutral. A captured body stands in its own pose, so rows defined on
     * straightened digits cannot be read on it.
     */
    straightened: boolean;
  }

  /**
   * A generated person as a subject: its skins are made on first read and
   * kept on this subject alone, so a test that holds the subject reads one
   * generation and drops it with the subject.
   */
  export function subject(name: string): ISubject {
    let views: HumanAnatomy.IViews | undefined;
    const own: () => HumanAnatomy.IViews = (): HumanAnatomy.IViews => (views ??= A.views(name));
    return {
      name,
      params: HumanPeople.params(name),
      bind: (): HumanAnatomy.ISkin => own().bind(),
      neutral: (): HumanAnatomy.ISkin => own().posed({}),
      posed: (pose: IAutoMovieHumanPose): HumanAnatomy.ISkin => own().posed(pose),
      person: (): HumanPeople.IRigged => own().person,
      views: own,
      mouth: true,
      construction: true,
      straightened: true,
    };
  }

  /** Whether a row passes. */
  export function passes(row: IRow): boolean {
    return row.value >= row.low && row.value <= row.high;
  }

  /** Every region's audit by name. */
  export const REGIONS: Record<string, (subject: ISubject) => IRow[]> = {
    trunk: (s: ISubject): IRow[] => HumanAnatomyTrunk.trunk(s),
    arm: (s: ISubject): IRow[] => HumanAnatomyArm.arm(s),
    hand: (s: ISubject): IRow[] => HumanAnatomyHand.hand(s),
    leg: (s: ISubject): IRow[] => HumanAnatomyLeg.leg(s),
    foot: (s: ISubject): IRow[] => HumanAnatomyFoot.foot(s),
    head: (s: ISubject): IRow[] => HumanAnatomyHead.head(s),
    headConsistency: (s: ISubject): IRow[] => HumanAnatomyHeadConsistency.rows(s),
    trunkSilhouette: (s: ISubject): IRow[] => HumanAnatomyTrunkSilhouette.rows(s),
    pose: (s: ISubject): IRow[] => HumanAnatomyPose.pose(s),
  };

  /** The poses the pose audit reads. */
  export const POSES: Record<string, IAutoMovieHumanPose> = HumanAnatomyPose.POSES;
}
