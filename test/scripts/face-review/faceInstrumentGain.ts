/**
 * Whether the photograph's instrument sees each index's control.
 *
 * An index is read on a photograph from the detector's landmarks and on the
 * model from the landmark anchors on its surface, and the identity solve
 * moves each index's control until the anchored model has the photograph's
 * value. That presumes the detector would read the control's change as the
 * anchors do. It need not: the detector regresses all its landmarks from the
 * whole face, and where the skin offers no edge of its own (the chin's
 * outline against the neck in a frontal view, the nasal sidewall, the lower
 * lip's lower border) it places a landmark where the rest of the face
 * predicts it. On a photograph such an index reports the detector's
 * expectation for that face, not the subject's anatomy, and a control fitted
 * to it fits the expectation.
 *
 * So the instrument is calibrated as the expression units are
 * (`faceExpressionObservable`): on the reference head, each index's control
 * is set to its envelope's two ends and rendered through the product editor
 * under each subject's camera (`faceInstrumentDocuments`), and the
 * detector's reading of each render is set against the anchored model's
 * reading of the same geometry. The gain is the detector's change over the
 * anchored change. The detector follows a local change of image content by
 * the same fraction on photographs as on these renders (README
 * "Instrument"), so the gain carries over. What the detector sees depends
 * on the view (a chin's height has no outline of its own from the front
 * and one in a turned view), so an index is observed under a camera when
 * its gain there lies within [bound, 1 / bound]: the two instruments see the
 * control move the index the same way, neither more than 1 / bound times the
 * other. Otherwise the photograph taken from that camera cannot measure the
 * control (the detector holds its place, reads the change reversed, or reads
 * a change the anchored geometry does not make), and the control is not
 * fitted to it. Nor is a control whose whole envelope changes the
 * detector's reading by less than twice the reading's own deviation under
 * half a pixel of error in every point (`resolution`,
 * `faceInstrumentResolution`): that change is below what the image
 * resolves, and its gain is a ratio of two changes too small to read (the
 * epicanthal fold moves the medial lower lid's slope, a rise over a run of a
 * few pixels, by less than the jitter does). A control too short to reach
 * every photograph is still observed: it reaches as far as it goes, and a
 * bound it is held at is recorded.
 *
 * A state of the face is calibrated where it reads: the incisal edges read
 * only where the lips part over the teeth, which the reference head at rest
 * does not show (with the upper lip raised the upper edge rests on the lower
 * teeth), so at its envelope's two ends the jaw's index read at the open end
 * alone and was unobserved under every camera. The states' controls are
 * stepped over their envelope (`steps`), and the gain is taken between the
 * widest pair of steps both instruments read (`faceInstrumentPair`). The
 * upper incisal edge rests on the lower teeth with the jaw closed and never
 * reads there, so the upper lip raiser's index is stepped again with the jaw
 * at each of its steps (`uncoveredBy`) and read at the most closed that
 * shows it (`faceInstrumentState`).
 *
 * Pure: reads caller-owned values and returns new ones.
 */
import {
  type FaceAnthropometryPoint,
  type IFaceAnthropometryIndex,
  faceAnthropometryWeights,
} from "./faceAnthropometry";

/** One calibration render: an index's control at one value under one camera. */
export interface IFaceInstrumentProbe {
  /**
   * Document id, `inst-<camera>-<index>-<step>`, the step `lower` and
   * `upper` at the envelope's ends and its position between them.
   */
  id: string;
  camera: string;
  index: string;
  value: number;
  /**
   * The uncovering index's control value (`uncoveredBy`), its step the
   * id's `at<step>`; absent for an index nothing uncovers.
   */
  uncovered?: number;
}

/**
 * The calibration documents: under each camera, every index's control at
 * `steps` values spread evenly over its envelope (`envelope`; two, its
 * ends, by default), the reference head otherwise at rest, a state of the
 * face (`expression`) written as expression. An index another uncovers
 * (`uncoveredBy`) is stepped again with that index's control at each of its
 * own steps.
 */
export function faceInstrumentDocuments(props: {
  basis: string;
  indices: readonly IFaceAnthropometryIndex[];
  envelope: (index: IFaceAnthropometryIndex) => readonly [number, number];
  cameras: readonly string[];
  steps?: (index: IFaceAnthropometryIndex) => number;
}): {
  documents: {
    id: string;
    name: string;
    basis: string;
    shape: Record<string, number>;
    expression: Record<string, number>;
  }[];
  probes: IFaceInstrumentProbe[];
} {
  const byId = new Map(props.indices.map((one) => [one.id, one]));
  const values = (index: IFaceAnthropometryIndex): number[] => {
    const [lower, upper] = props.envelope(index);
    if (!(lower < upper))
      throw new Error(`The envelope of ${index.id} is empty.`);
    const steps = props.steps?.(index) ?? 2;
    if (!(Number.isInteger(steps) && steps >= 2))
      throw new Error(`${index.id} needs two steps or more.`);
    return [...new Array(steps).keys()].map((k) =>
      k === steps - 1 ? upper : lower + ((upper - lower) * k) / (steps - 1),
    );
  };
  const name = (k: number, count: number) =>
    k === 0 ? "lower" : k === count - 1 ? "upper" : `${k}`;
  const probes = props.cameras.flatMap((camera) =>
    props.indices.flatMap((index): IFaceInstrumentProbe[] => {
      const own = values(index);
      const at = (value: number, k: number) =>
        own
          .map((one, j) => ({ one, j }))
          .map(({ one, j }) => ({
            id: `inst-${camera}-${index.id}-${k === -1 ? "" : `at${k}-`}${name(j, own.length)}`,
            camera,
            index: index.id,
            value: one,
            ...(k === -1 ? {} : { uncovered: value }),
          }));
      if (index.uncoveredBy === undefined) return at(0, -1);
      const uncovering = byId.get(index.uncoveredBy);
      if (uncovering === undefined)
        throw new Error(`No index ${index.uncoveredBy} uncovers ${index.id}.`);
      return values(uncovering).flatMap((value, k) => at(value, k));
    }),
  );
  const documents = probes.map((probe) => {
    const index = byId.get(probe.index)!;
    const weights = Object.fromEntries(
      [
        ...(probe.uncovered === undefined
          ? []
          : faceAnthropometryWeights(
              byId.get(index.uncoveredBy!)!,
              probe.uncovered,
            )),
        ...faceAnthropometryWeights(index, probe.value),
      ].filter(([, w]) => w !== 0),
    );
    return {
      id: probe.id,
      name: probe.id,
      basis: props.basis,
      shape: index.expression ? {} : weights,
      expression: index.expression ? weights : {},
    };
  });
  return { documents, probes };
}

/**
 * The widest pair of an index's calibration values at which both the
 * anchored model and the detector read it, as positions in `values`
 * (ascending), the lower pair on a tie; null when no pair reads. An index
 * that reads only where the lips part over the teeth (the incisal edges) is
 * calibrated where it reads.
 */
export function faceInstrumentPair(
  values: readonly number[],
  model: readonly (number | null)[],
  detector: readonly (number | null)[],
): [number, number] | null {
  const reads = values.flatMap((_, k) =>
    model[k] === null || detector[k] === null ? [] : [k],
  );
  let best: [number, number] | null = null;
  let span = -Infinity;
  for (let a = 0; a < reads.length; ++a)
    for (let b = a + 1; b < reads.length; ++b) {
      const width = values[reads[b]!]! - values[reads[a]!]!;
      if (width > span) {
        span = width;
        best = [reads[a]!, reads[b]!];
      }
    }
  return best;
}

/**
 * Which of an index's calibration states to read, and its pair of steps:
 * the first state (the uncovering control nearest rest) with a pair both
 * instruments read (`faceInstrumentPair`), else the first state's ends.
 */
export function faceInstrumentState(
  states: readonly {
    values: readonly number[];
    model: readonly (number | null)[];
    detector: readonly (number | null)[];
  }[],
): { state: number; pair: [number, number] } {
  for (let k = 0; k < states.length; ++k) {
    const pair = faceInstrumentPair(
      states[k]!.values,
      states[k]!.model,
      states[k]!.detector,
    );
    if (pair !== null) return { state: k, pair };
  }
  return { state: 0, pair: [0, states[0]!.values.length - 1] };
}

/** One index's control at two values under one camera. */
export interface IFaceInstrumentReading {
  index: string;
  /** The control's two values, lower first. */
  values: readonly [number, number];
  /** The anchored model's index at each value, null when unmeasured. */
  model: readonly [number | null, number | null];
  /** The detector's index on the render at each value, null when unread. */
  detector: readonly [number | null, number | null];
  /**
   * The detector's reading's deviation under half a pixel of point error
   * (`faceInstrumentResolution`), absent when not known.
   */
  resolution?: number | null;
}

/** One index's gain and observation under each calibration camera. */
export interface IFaceInstrumentIndex {
  index: string;
  /** The detector's change over the anchored change, null when unread. */
  gains: (number | null)[];
  /** Whether a photograph from that camera observes the index. */
  observed: boolean[];
}

/**
 * Each index's gain under every camera and whether a photograph from that
 * camera observes it. `cameras` lists, per calibration camera, one reading
 * per index; an index missing from a camera, unread there, whose anchored
 * reading does not change, or whose detector reading changes by less than
 * twice its `resolution` is not observed there.
 */
export function faceInstrumentGains(
  cameras: readonly (readonly IFaceInstrumentReading[])[],
  bound: number,
): IFaceInstrumentIndex[] {
  if (!(bound > 0 && bound < 1))
    throw new Error("The gain bound lies between zero and one.");
  const indices = [
    ...new Set(cameras.flatMap((one) => one.map((reading) => reading.index))),
  ];
  return indices.map((index) => {
    const readings = cameras.map((camera) =>
      camera.find((one) => one.index === index),
    );
    const gains = readings.map((reading) => {
      if (reading === undefined) return null;
      const [m0, m1] = reading.model;
      const [d0, d1] = reading.detector;
      if (m0 === null || m1 === null || d0 === null || d1 === null) return null;
      return m1 === m0 ? null : (d1 - d0) / (m1 - m0);
    });
    return {
      index,
      gains,
      observed: gains.map(
        (gain, k) =>
          gain !== null &&
          gain >= bound &&
          gain <= 1 / bound &&
          Math.abs(readings[k]!.detector[1]! - readings[k]!.detector[0]!) >=
            2 * (readings[k]!.resolution ?? 0),
      ),
    };
  });
}

/**
 * Each index's standard deviation under a jitter of every point by an
 * independent normal error of `sigma` pixels on each axis, over `draws`
 * draws from a generator seeded with `seed` (mulberry32, Box-Muller): the
 * least change the detector's reading of that index resolves. Null for an
 * index the points do not read.
 */
export function faceInstrumentResolution(
  points: readonly FaceAnthropometryPoint[],
  measure: (
    points: readonly FaceAnthropometryPoint[],
  ) => Record<string, number | null>,
  props: { sigma: number; draws: number; seed: number },
): Record<string, number | null> {
  if (!(props.draws >= 2)) throw new Error("A deviation needs two draws.");
  let state = props.seed >>> 0;
  const uniform = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296;
  };
  const normal = (): number =>
    Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
  const readings = [...new Array(props.draws).keys()].map(() =>
    measure(
      points.map((point) =>
        point === undefined
          ? undefined
          : ([
              point[0] + props.sigma * normal(),
              point[1] + props.sigma * normal(),
            ] as const),
      ),
    ),
  );
  const base = measure(points);
  return Object.fromEntries(
    Object.keys(base).map((id) => {
      const values = readings.flatMap((one) =>
        one[id] === null || one[id] === undefined ? [] : [one[id]!],
      );
      if (values.length < 2) return [id, null];
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      return [
        id,
        Math.sqrt(
          values.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
            (values.length - 1),
        ),
      ];
    }),
  );
}
