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
 * fitted to it.
 *
 * Pure: reads caller-owned values and returns new ones.
 */
import {
  type IFaceAnthropometryIndex,
  faceAnthropometryWeights,
} from "./faceAnthropometry";

/** One calibration render: an index's control at one end under one camera. */
export interface IFaceInstrumentProbe {
  /** Document id, `inst-<camera>-<index>-<lower|upper>`. */
  id: string;
  camera: string;
  index: string;
  value: number;
}

/**
 * The calibration documents: under each camera, every index's control at
 * its envelope's two ends (`envelope`), the reference head otherwise at
 * rest, a state of the face (`expression`) written as expression.
 */
export function faceInstrumentDocuments(props: {
  basis: string;
  indices: readonly IFaceAnthropometryIndex[];
  envelope: (index: IFaceAnthropometryIndex) => readonly [number, number];
  cameras: readonly string[];
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
  const probes = props.cameras.flatMap((camera) =>
    props.indices.flatMap((index) => {
      const [lower, upper] = props.envelope(index);
      if (!(lower < upper))
        throw new Error(`The envelope of ${index.id} is empty.`);
      return (
        [
          ["lower", lower],
          ["upper", upper],
        ] as const
      ).map(([end, value]) => ({
        id: `inst-${camera}-${index.id}-${end}`,
        camera,
        index: index.id,
        value,
      }));
    }),
  );
  const byId = new Map(props.indices.map((one) => [one.id, one]));
  const documents = probes.map((probe) => {
    const index = byId.get(probe.index)!;
    const weights = Object.fromEntries(
      faceAnthropometryWeights(index, probe.value).filter(([, w]) => w !== 0),
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

/** One index's control at two values under one camera. */
export interface IFaceInstrumentReading {
  index: string;
  /** The control's two values, lower first. */
  values: readonly [number, number];
  /** The anchored model's index at each value, null when unmeasured. */
  model: readonly [number | null, number | null];
  /** The detector's index on the render at each value, null when unread. */
  detector: readonly [number | null, number | null];
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
 * per index; an index missing from a camera, unread there or whose anchored
 * reading does not change is not observed there.
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
    const gains = cameras.map((camera) => {
      const reading = camera.find((one) => one.index === index);
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
        (gain) => gain !== null && gain >= bound && gain <= 1 / bound,
      ),
    };
  });
}
