import {
  AutoMovieLoftSectionNative as Native,
  AutoMovieLoftViewRead as Read,
  AutoMovieConicFieldJet as Scalar,
  AutoMovieViewSection as Section,
  AutoMovieLoftViewSource as Source,
  AutoMovieNaturalSpline as Spline,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieConicFieldJet,
  IAutoMovieLoftSectionConnect,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

/**
 * The original medial proximal-thigh course. Its tape-conserving shoulders
 * belong to this person's sections. The proximal source is hidden before the
 * anatomical receiving ring; the distal handoff retains the original two-jet.
 */
export namespace AutoMovieHumanLegMedialSource {
  /** Value and two station derivatives in the existing conic field algebra. */
  type Jet = IAutoMovieConicFieldJet.IJet;
  const { fromStation, AD } = Scalar;

  /** The original thigh and its actual held pelvic receiving section. */
  export interface IRail {
    /** Native section authority. */
    part: IAutoMovieViewPart;

    /** Its prepared original point and differential reader. */
    field: IAutoMovieLoftViewFullSource.IReader;

    /** Physical receiving station in mm. */
    station: number;

    /** Unit direction away from the person's sagittal division. */
    outward: P3;
  }

  /**
   * Open the medial leg from its anatomical perineal plane to its own lower
   * thigh. The wearer supplies all station, axis and tape values. The sole
   * ESTIMATE takes the middle of the common tape-feasible reach interval,
   * maximizing its distance from the two measured bounds.
   */
  export function fromRail(
    { part, field, outward, station }: IRail,
    datum: P3,
    chordMm: number,
  ): IAutoMovieViewPart {
    const landmarks = part.front.positive.knots;
    const named = landmarks.find(({ site }) => site === "thigh")?.station;
    const distal = landmarks.find(({ site }) => site === "lowerThigh")?.station;
    const knee = landmarks.find(({ site }) => site === "knee")?.station;
    if (named === undefined || distal === undefined || knee === undefined)
      throw new Error(
        `${part.name}: the proximal medial source needs its thigh, suprapatellar and knee measurements`,
      );
    const axis = part.axis.jet?.(distal);
    const bone =
      axis === null || axis === undefined ? null : Vec.unit(axis.first.origin);
    if (bone === null)
      throw new Error(
        `${part.name}: the actual lower-thigh axis needs a physical tangent`,
      );
    const frame = part.axis.at(distal);
    const onset = distal + Vec.dot(Vec.sub(datum, frame.origin), bone);
    const length = distal - onset;
    if (
      !(
        onset > (field.regular?.[0] ?? Infinity) &&
        onset < named &&
        named < distal
      )
    )
      throw new Error(
        `${part.name}: the anatomical medial course lies outside its original source`,
      );
    const next = part.stations.find((s) => s > station && s < knee);
    const phase = (-Math.sign(Vec.dot(frame.v, outward)) * Math.PI) / 2;
    const reach = (s: number): number =>
      Vec.dot(Vec.sub(field.jet(s, phase).p, datum), outward);
    const originalOnset = reach(onset);
    const course = (s: number) => {
      const q = Math.sqrt((s - onset) / length);
      const remaining = (1 - q) ** 3;
      return {
        base: reach(s) - originalOnset * remaining * (1 + 3 * q),
        basis: q * remaining,
      };
    };
    const stations = [
      ...new Set([...part.stations, named, station, next ?? station]),
    ].filter((s) => onset < s && s < distal);
    const envelope = stations.map((s) => {
      const frame = part.axis.at(s);
      const row = field.pointAt(s);
      const sign = Math.sign(Vec.dot(frame.v, outward));
      const halfTape =
        tape((angle) => row(-sign * angle), part.samples / 2, chordMm).length /
        2;
      const fore = Vec.dot(Vec.sub(row(0), frame.origin), frame.u);
      const rear = -Vec.dot(Vec.sub(row(Math.PI), frame.origin), frame.u);
      const halfChord = (fore + rear) / 2;
      const offset = (fore - rear) / 2;
      const shallow = halfTape - halfChord;
      const deep = Math.sqrt(
        (halfTape ** 2 - halfChord ** 2) * (1 - (offset / halfTape) ** 2),
      );
      const center = Vec.dot(Vec.sub(frame.origin, datum), outward);
      const projection = Math.abs(Vec.dot(frame.v, outward));
      const { base, basis } = course(s);
      return [
        (Math.max(0, center - projection * deep) - base) / basis,
        (center - projection * shallow - base) / basis,
      ] as const;
    });
    const lower = Math.max(0, ...envelope.map(([minimum]) => minimum));
    const upper = Math.min(...envelope.map(([, maximum]) => maximum));
    if (!(lower < upper && Number.isFinite(upper)))
      throw new Error(
        `${part.name}: no medial reach satisfies both original tapes and separation`,
      );
    const amplitude = (lower + upper) / 2;
    const interval = part.stations[1]! - part.stations[0]!;
    const shape = stations
      .filter((s) => named <= s && distal - s >= interval)
      .sort((a, b) => a - b)
      .map((s) => {
        const frame = part.axis.at(s);
        const row = field.pointAt(s);
        const projection = Vec.dot(frame.v, outward);
        const extents = [
          frame.u,
          frame.v,
          Vec.scale(frame.u, -1),
          Vec.scale(frame.v, -1),
        ].map((direction, i) =>
          Vec.dot(Vec.sub(row((i * Math.PI) / 2), frame.origin), direction),
        ) as [number, number, number, number];
        const { base, basis } = course(s);
        extents[projection > 0 ? 3 : 1] =
          (Vec.dot(Vec.sub(frame.origin, datum), outward) -
            (base + amplitude * basis)) /
          Math.abs(projection);
        const girth = [-1, 1].reduce(
          (sum, direction) =>
            sum +
            tape((angle) => row(direction * angle), part.samples / 2, chordMm)
              .length,
          0,
        );
        const fitted = Section.solve(part.name, { extents }, girth);
        if (fitted.section === null || fitted.diagnostics.length > 0)
          throw new Error(
            `${part.name}: the held whole tape cannot carry its medial curve at ${s}`,
          );
        return { s, shoulder: fitted.section.shoulders[0]! };
      });
    return {
      ...part,
      originalSection: prepare({
        part,
        outward,
        start: named,
        end: distal,
        onset,
        originalOnset,
        amplitude,
        shape,
      }),
    };
  }

  /**
   * Refine one native half-tape to the shared geometric tolerance. Doubling the
   * chord count quarters the leading smooth-arc error. The finer polygon
   * therefore leaves one third of the measured coarse-to-fine gap.
   */
  export function tape(
    point: (phase: number) => P3,
    columns: number,
    chordMm: number,
  ): { length: number; delta: number; columns: number } {
    const read = (count: number): number => {
      let previous = point(0);
      let length = 0;
      for (let j = 1; j <= count; ++j) {
        const next = point((Math.PI * j) / count);
        length += Vec.norm(Vec.sub(next, previous));
        previous = next;
      }
      return length;
    };
    let lower = read(columns);
    let upper = read(columns * 2);
    while (upper - lower > chordMm / 2) {
      lower = upper;
      columns *= 2;
      upper = read(columns * 2);
    }
    return {
      length: upper + (upper - lower) / 3,
      delta: upper - lower,
      columns: columns * 2,
    };
  }

  /**
   * The same medial support curve with one native girth shoulder for the whole
   * section.
   */
  export function prepare(input: {
    part: IAutoMovieViewPart;
    outward: P3;
    start: number;
    end: number;
    onset: number;
    originalOnset: number;
    amplitude: number;
    shape: readonly { s: number; shoulder: number }[];
  }): IAutoMovieLoftSectionConnect.IOriginal {
    const { part, outward, start, end, onset, shape } = input;
    const original = Source.create(part)?.source;
    if (
      original === null ||
      original === undefined ||
      shape.length < 2 ||
      !(onset < start && start < end)
    )
      throw new Error(
        "The shared native section needs its original bounds and lower-thigh transfer",
      );
    const field = Read.prepare(original);
    const span = end - onset;
    const side = Math.sign(Vec.dot(part.axis.at(start).v, outward));
    const medial = side > 0 ? 3 : 1;
    const held = Spline.create(
      shape.map(({ s }) => s),
      shape.map(({ s, shoulder }) => {
        const stock = field.values(s);
        if (typeof stock === "string") throw new Error(stock);
        const q = Math.sqrt((s - onset) / span);
        const h = (end - s) / (span * (1 + q));
        return (shoulder - stock.shoulders[0]!) / h ** 3;
      }),
    );
    const control = (s: number) => {
      if (s <= onset || s >= end) return null;
      const frame = part.axis.jet?.(s);
      if (frame === null || frame === undefined)
        throw new Error("The native thigh extent lacks its axis jet");
      const { h3, delta } = continuation(input, s);
      const projection = fromStation(
        [frame.value, frame.first, frame.second].map(
          ({ v }) => side * Vec.dot(v, outward),
        ) as [number, number, number],
      );
      return {
        extent: AD.divide(delta, projection),
        shoulder: AD.multiply(h3, fromStation(Spline.read(held, s))),
      };
    };
    const pointAt = (s: number) => {
      const raw = field.values(s);
      if (typeof raw === "string") throw new Error(raw);
      const correction = control(s);
      if (correction !== null) {
        raw.extents[medial] = raw.extents[medial]! - correction.extent[0];
        raw.shoulders = raw.shoulders.map(
          (value) => value + correction.shoulder[0],
        );
      }
      return Native.point(raw);
    };
    const jetAt = (s: number) => {
      const raw = field.jets(s);
      if (typeof raw === "string") throw new Error(raw);
      const correction = control(s);
      if (correction !== null) {
        const add = (
          left: readonly [number, number, number],
          right: Jet,
          sign: number,
        ): [number, number, number] => [
          left[0] + sign * right[0],
          left[1] + sign * right[1],
          left[2] + sign * right[3],
        ];
        raw.extents[medial] = add(raw.extents[medial]!, correction.extent, -1);
        raw.shoulders = raw.shoulders.map((value) =>
          add(value, correction.shoulder, 1),
        );
      }
      return Native.jet(raw);
    };
    return {
      name: `${part.name}.shared-medial-source`,
      domain: [onset, end],
      interior: true,
      pointAt,
      jetAt,
      point: (s, p) => pointAt(s)(p),
      jet: (s, p) => jetAt(s)(p),
      phase: (s, p) => {
        const { p: point, t, tt } = jetAt(s)(p);
        return { p: point, t, tt };
      },
    };
  }

  function continuation(
    {
      start,
      end,
      onset,
      originalOnset,
      amplitude,
    }: {
      start: number;
      end: number;
      onset: number;
      originalOnset: number;
      amplitude: number;
    },
    s: number,
  ) {
    const span = end - onset;
    const a = fromStation([s, 1, 0]);
    const q = AD.sqrt(
      AD.divide(AD.subtract(a, AD.constant(onset)), AD.constant(span)),
    );
    const h = AD.divide(
      AD.subtract(AD.constant(end), a),
      AD.multiply(AD.constant(span), AD.add(AD.constant(1), q)),
    );
    let h3 = AD.multiply(h, AD.multiply(h, h));
    if (s < start) {
      // This piece is clipped away by the named receiving section. Match
      // the existing original through two jets with the minimum quintic.
      const t = AD.divide(
        AD.subtract(a, AD.constant(onset)),
        AD.constant(start - onset),
      );
      const t2 = AD.multiply(t, t);
      h3 = AD.multiply(
        h3,
        AD.multiply(
          AD.multiply(t, t2),
          AD.add(
            AD.constant(10),
            AD.add(
              AD.multiply(AD.constant(-15), t),
              AD.multiply(AD.constant(6), t2),
            ),
          ),
        ),
      );
    }
    const delta = AD.multiply(
      h3,
      AD.subtract(
        AD.multiply(AD.constant(amplitude), q),
        AD.multiply(
          AD.constant(originalOnset),
          AD.add(AD.constant(1), AD.multiply(AD.constant(3), q)),
        ),
      ),
    );
    return { h3, delta };
  }
}
