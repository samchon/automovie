import { minimumJerk } from "@automovie/engine";

/**
 * The included joint angles of one horse limb at a phase of its swimming
 * stroke.
 *
 * The fore and hind strokes are distinct cycles read from two underwater-video
 * studies of free swimming horses (Santosuosso et al. 2021, Front Vet Sci
 * 8:752375, forelimb, Tables 1 and 2,
 * https://www.frontiersin.org/articles/10.3389/fvets.2021.752375/full;
 * Santosuosso et al. 2022, Front Vet Sci 8:761500, hindlimb, Tables 1 and 2,
 * https://www.frontiersin.org/articles/10.3389/fvets.2021.761500/full). Each
 * joint moves between its measured mean maximal extension and mean maximal
 * flexion, in the study's own landmark convention, on a minimum-jerk path
 * (Flash and Hogan 1985), so each extreme is reached with zero angular speed at
 * its event. The cycle starts at the fetlock's maximal extension, the forelimb
 * study's cycle definition. The forelimb's protraction spans 13.5 to 73 % of
 * the cycle (Table 2 footnote; the text gives 77.5 %). Its carpus, elbow and
 * fetlock reach maximal flexion early, midway and at the end of protraction;
 * the elbow and carpus reach maximal extension at the end of retraction. The
 * hindlimb's protraction is its measured 0.8 s of a 1.2 s cycle; its stifle,
 * fetlock and tarsus reach maximal flexion in that order and its tarsus,
 * fetlock and stifle maximal extension in mid retraction. Where the studies
 * give an order or a phase name but no percentage, the event's phase is
 * authored inside that phase and stated in `EVENTS`. Shoulder and hip were not
 * measured; the humerus and femur swing between authored slopes, `SWING`.
 *
 * @param end The fore or the hind stroke.
 * @param phase The stroke phase in cycles; any finite number, wrapped to [0,
 *   1).
 * @returns The three included angles of that end's measured joints and the
 *   slope of its upper bone, degrees.
 * @throws {RangeError} For a nonfinite phase.
 */
export function EquineSwimStroke(
  end: EquineSwimStroke.End,
  phase: number,
): EquineSwimStroke.IAngles {
  const at: number = phase - Math.floor(phase);
  const events: EquineSwimStroke.IEnd = EquineSwimStroke.EVENTS[end];
  return {
    swing: cycle(events.swing, at),
    upper: cycle(events.upper, at),
    middle: cycle(events.middle, at),
    lower: cycle(events.lower, at),
  };
}

/** Types and cited tables of {@link EquineSwimStroke}. */
export namespace EquineSwimStroke {
  /** The fore or the hind stroke. */
  export type End = "fore" | "hind";

  /** A phase interval, start and end in cycles. */
  export type Span = readonly [number, number];

  /**
   * One joint's measured extremes and the stroke phases they occur at.
   *
   * `flexion` and `extension` are included degrees in the source's convention;
   * `flexed` and `extended` are phases in cycles from the stroke's start.
   */
  export interface IJoint {
    /** Mean maximal flexion, degrees. */
    flexion: number;

    /** Mean maximal extension, degrees. */
    extension: number;

    /** Phase of maximal flexion, cycles in [0, 1). */
    flexed: number;

    /** Phase of maximal extension, cycles in [0, 1). */
    extended: number;
  }

  /**
   * One end's four channels, proximal to distal.
   *
   * Fore: `swing` the humerus slope, then the elbow's dorsal, the carpus's
   * palmar and the fetlock's palmar angles. Hind: `swing` the femur slope, then
   * the stifle's caudal, the tarsus's dorsal and the fetlock's plantar angles.
   * A slope is degrees from straight down toward the front, the convention of
   * `createHorse.STANCE`; its `flexion` is the retracted slope and its
   * `extension` the protracted one.
   */
  export interface IEnd {
    /** Upper bone slope, authored. */
    swing: IJoint;

    /** Elbow or stifle. */
    upper: IJoint;

    /** Carpus or tarsus. */
    middle: IJoint;

    /** Fetlock. */
    lower: IJoint;
  }

  /** One end's angles at one phase, degrees, named as in {@link IEnd}. */
  export interface IAngles {
    /** Upper bone slope from straight down toward the front. */
    swing: number;

    /** Elbow dorsal or stifle caudal included angle. */
    upper: number;

    /** Carpus palmar or tarsus dorsal included angle. */
    middle: number;

    /** Fore or hind fetlock palmar/plantar included angle. */
    lower: number;
  }

  /**
   * The forelimb's protraction, cycles: 13.5 to 73 % (forelimb study, Table 2
   * footnote).
   */
  export const FORE_PROTRACTION: Span = [0.135, 0.73];

  /**
   * The hindlimb's protraction, cycles: its measured 0.8 s protraction of a 1.2
   * s cycle (hindlimb study, Table 1), from the cycle start.
   */
  export const HIND_PROTRACTION: Span = [0, 0.8 / 1.2];

  /**
   * The joint extremes and their phases. Angles are the studies' Table 2
   * swimming means: fore elbow 52.8/125.9, carpus 60.9/156.7, fetlock
   * 111.4/188.3; hind stifle 60.5/111.5, tarsus 43.7/154.7, fetlock 76.8/188.9
   * (flexion/extension). Measured phase anchors are the fetlock's extension at
   * the cycle start and the protraction spans above. Phases named only as
   * early, mid or late in a phase are authored at its quarter, half and end;
   * the hind order inside mid protraction and mid retraction is the hindlimb
   * study's stated order, its phases authored. The humerus and femur slopes are
   * authored: the humerus from 55 degrees back to 25 back, the femur from 5
   * forward to 35 forward, protracted at the end of protraction and retracted
   * at the end of retraction.
   */
  export const EVENTS: Readonly<Record<End, IEnd>> = {
    fore: {
      swing: { flexion: -55, extension: -25, flexed: 0.135, extended: 0.73 },
      upper: {
        flexion: 52.8,
        extension: 125.9,
        flexed: 0.135 + (0.73 - 0.135) / 2,
        extended: 0.135,
      },
      middle: {
        flexion: 60.9,
        extension: 156.7,
        flexed: 0.135 + (0.73 - 0.135) / 4,
        extended: 0.135,
      },
      lower: { flexion: 111.4, extension: 188.3, flexed: 0.73, extended: 0 },
    },
    hind: {
      swing: { flexion: 5, extension: 35, flexed: 0, extended: 0.8 / 1.2 },
      upper: { flexion: 60.5, extension: 111.5, flexed: 0.3, extended: 0.86 },
      middle: { flexion: 43.7, extension: 154.7, flexed: 0.58, extended: 0.8 },
      lower: { flexion: 76.8, extension: 188.9, flexed: 0.36, extended: 0.86 },
    },
  };
}

/** One joint's angle on its two minimum-jerk segments between its extremes. */
function cycle(joint: EquineSwimStroke.IJoint, phase: number): number {
  const { flexion, extension, flexed, extended } = joint;
  const toFlexion: number = wrap(flexed - extended);
  const since: number = wrap(phase - extended);
  if (since <= toFlexion)
    return extension + (flexion - extension) * minimumJerk(since / toFlexion).s;
  return (
    flexion +
    (extension - flexion) * minimumJerk((since - toFlexion) / (1 - toFlexion)).s
  );
}

/** A phase difference in [0, 1). */
function wrap(value: number): number {
  return value - Math.floor(value);
}
