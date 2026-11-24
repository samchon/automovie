import {
  AutoMovieConstructionPortAddress,
  AutoMovieConstructionPortRadialRange,
  AutoMovieSolidVector as Vector,
  bracketedRoot,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanNativeRoot,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** A qualified elliptic-radius cut on the actual parent source, in its original chart branch. */
export namespace AutoMovieHumanNativeRootLevel {
  /** Existing physical point and vector representation. */
  type V = AutoMovieVector3Tuple;
  /** The explicitly supplied original bare calipers and their material site. */
  type Metric = NonNullable<IAutoMovieHumanNativeRoot.IOriginal["metric"]>;

  /** Current immutable native inputs; no other part or loft is built. */
  interface IInput {
    /** Shared original source calibration. */
    original: IAutoMovieHumanNativeRoot.ICalibration;
    /** Reused original metric/derivative preparation. */
    prepared: IAutoMovieHumanNativeRoot.ILevelOriginal;
    /** Current actual parent descriptor. */
    parent: IAutoMovieViewPart;
    /** Its already prepared full source reader. */
    reader: IAutoMovieLoftViewFullSource.IReader;
    /** Current independently generated child descriptor. */
    candidate: IAutoMovieViewPart;
    /** Independent positive root-caliper ratios. */
    scale: readonly [number, number];
  }

  /** A fixed caliper-frame elliptic-radius field and its exact world gradient. */
  interface IField {
    /** Dimensionless level. */
    value: (point: V) => number;
    /** World gradient, per mm. */
    gradient: (point: V) => V;
  }

  /** Prepare original reference levels and actual radial derivatives once per original root. */
  export function original(
    input: IAutoMovieHumanNativeRoot.IOriginal,
    reader: IAutoMovieLoftViewFullSource.IReader,
    charts: readonly (readonly [number, number])[],
    points: readonly V[],
  ): IAutoMovieHumanNativeRoot.ILevelOriginal {
    const metric: Metric | undefined = input.metric;
    if (metric === undefined)
      throw new Error("root elliptic level requires its explicit material-site calipers");
    const field: IField = radius(input.basis, metric.depth, metric.breadth);
    const levels: number[] = points.map(field.value);
    const derivatives: (number | null)[] = [];
    const unavailable: (string | null)[] = [];
    charts.forEach((at: readonly [number, number], k: number): void => {
      try {
        const jet: IAutoMovieSolidSurface.IJet = reader.jet(at[0], at[1]);
        const c: number = (2 * Math.PI * k) / input.count;
        const ray: V = Vector.add(
          Vector.scale(jet.u, input.loop.semi[0] * 1000 * Math.cos(c)),
          Vector.scale(jet.v, input.loop.sense * input.loop.semi[1] * Math.sin(c)),
        );
        derivatives.push(Vector.dot(field.gradient(points[k]!), ray));
        unavailable.push(null);
      } catch (error: unknown) {
        derivatives.push(null);
        unavailable.push(error instanceof Error ? error.message : String(error));
      }
    });
    return { metric, levels, derivatives, unavailable };
  }

  /** Solve each original chart ray on the current parent; every emitted point belongs to that source. */
  export function create(input: IInput): IAutoMovieHumanNativeRoot.ILevelResult {
    const { original: old, prepared, parent, reader, candidate, scale }: IInput = input;
    if (parent.name !== old.input.parent.name || candidate.name !== old.input.child.name)
      throw new Error("root level source identity differs from its original material owner");
    const oldLoop: IAutoMovieConstructionPortLoop = old.input.loop;
    const frame: IAutoMovieLoftSectionFrame = candidate.axis.at(prepared.metric.station);
    const field: IField = radius(
      frame,
      prepared.metric.depth * scale[0],
      prepared.metric.breadth * scale[1],
    );
    const identity: boolean = scale[0] === 1 && scale[1] === 1 &&
      ["origin", "u", "v"].every((key: string): boolean => {
        const field: "origin" | "u" | "v" = key as "origin" | "u" | "v";
        return frame[field].every((value: number, j: number): boolean =>
          Object.is(value, old.input.basis[field][j]),
        );
      }) && old.charts.every((at: [number, number], k: number): boolean =>
        reader.point(at[0], at[1]).every((value: number, j: number): boolean =>
          Object.is(value, old.parent[k]![j]),
        ),
      );
    const facing: number = oldLoop.centre[1];
    const columns: IAutoMovieHumanNativeRoot.ILevelColumn[] = [];
    const shares: number[] = [];
    for (let k: number = 0; k < old.input.count; k++) {
      const c: number = (2 * Math.PI * k) / old.input.count;
      const ds: number = oldLoop.semi[0] * 1000 * Math.cos(c);
      const dt: number = oldLoop.sense * oldLoop.semi[1] * Math.sin(c);
      const q0: number = oldLoop.shape?.[k] ?? 1;
      const reference: number = prepared.levels[k]!;
      const originalDerivative: number | null = prepared.derivatives[k]!;
      const observation: Record<string, unknown> = {
        source: parent.name, role: "parent", root: old.input.name,
        child: candidate.name, metric: prepared.metric, scale, frame,
        column: k, domain: reader.domain,
        stage: "q0", operation: "unqueried", q: q0, q0, ds, dt, reference,
        originalGq: originalDerivative, currentGq: "unavailable:not yet computed",
        address: "unavailable:not yet queried", initial: "unavailable:not yet computed",
        level: "unavailable:not yet computed", maximum: "unavailable:not yet computed",
        edge: "unavailable:not yet selected", bracket: "unavailable:not yet selected",
        edgeValue: "unavailable:not yet read", budget: "unavailable:not yet computed",
        actual: "unavailable:not yet read",
      };
      try {
      const at: (q: number) => [number, number] = (q: number): [number, number] =>
        AutoMovieConstructionPortAddress(oldLoop, c, q);
      const value: (q: number, stage: string) => number = (q: number, stage: string): number => {
        observation.stage = stage;
        observation.q = q;
        observation.currentGq = "unavailable:not evaluated by Point0";
        observation.point = "unavailable:not yet read at this query";
        observation.gradient = "unavailable:not evaluated by Point0";
        observation.ray = "unavailable:not evaluated by Point0";
        const address: [number, number] = at(q);
        observation.address = address;
        observation.operation = "point";
        observation.level = "unavailable:not yet computed at this query";
        const point: V = reader.point(address[0], address[1]);
        observation.point = point;
        observation.operation = "level";
        const result: number = field.value(point);
        observation.level = result;
        return result;
      };
      if (identity) {
        shares.push(q0);
        const actual: number = value(q0, "identity");
        columns.push({
          originalShare: q0, share: q0, reference, actual,
          signed: actual - reference, derivative: null, originalDerivative,
          bracket: null, method: "identical local source controls and caliper binding; no person selector or new branch admission",
        });
        continue;
      }
      if (originalDerivative === null || !Number.isFinite(originalDerivative) || originalDerivative === 0)
        throw new Error(old.input.name + ": original radial branch derivative unavailable: " + prepared.unavailable[k]);
      const direction: number = Math.sign(originalDerivative);
      const derivative: (q: number, stage: string) => number = (q: number, stage: string): number => {
        observation.stage = stage;
        observation.q = q;
        observation.currentGq = "unavailable:not yet computed";
        observation.level = "unavailable:derivative query does not evaluate F";
        observation.point = "unavailable:not yet read";
        observation.gradient = "unavailable:not yet computed";
        observation.ray = "unavailable:not yet computed";
        const address: [number, number] = at(q);
        observation.address = address;
        observation.operation = "point";
        const point: V = reader.point(address[0], address[1]);
        observation.point = point;
        observation.operation = "physical2";
        const jet: IAutoMovieSolidSurface.IJet = reader.jet(address[0], address[1]);
        const ray: V = Vector.add(Vector.scale(jet.u, ds), Vector.scale(jet.v, dt));
        observation.ray = ray;
        const gradient: V = field.gradient(point);
        observation.gradient = gradient;
        const g: number = Vector.dot(gradient, ray);
        observation.currentGq = g;
        observation.operation = "original-direction-guard";
        if (!(Number.isFinite(g) && direction * g > 0))
          throw new Error(old.input.name + ": radial source branch loses its original derivative direction at column " + k);
        return g;
      };
      const initial: number = value(q0, "q0");
      observation.initial = initial;
      const initialDerivative: number = derivative(q0, "q0");
      // ESTIMATE: allow accumulated binary64 error from the source spline,
      // frame projection and normalized elliptic radius, scaled to the level.
      const budget: number = 512 * Number.EPSILON * Math.max(1, Math.abs(initial), Math.abs(reference));
      observation.budget = budget;
      let q: number = q0;
      let bracket: readonly [number, number] | null = null;
      if (Math.abs(initial - reference) > budget) {
        if (!(oldLoop.centre[1] > facing - Math.PI / 2 && oldLoop.centre[1] < facing + Math.PI / 2))
          throw new Error(old.input.name + ": original chart pole is outside its root-facing source branch");
        // In chart phase the positive cosine interval is the facing half-turn
        // centred on the declared loop pole.
        const phaseDomain: readonly [number, number] = [
          facing - Math.PI / 2, facing + Math.PI / 2,
        ];
        observation.phaseDomain = phaseDomain;
        const maximum: number = AutoMovieConstructionPortRadialRange(
          oldLoop, c, reader.domain, phaseDomain, q0,
        );
        observation.maximum = maximum;
        if (!(Number.isFinite(maximum) && maximum > q0 && q0 > 0))
          throw new Error(old.input.name + ": original radial control leaves the declared source branch");
        const edge: number = direction * (initial - reference) > 0 ? 0 : maximum;
        observation.edge = edge;
        const edgeValue: number = value(edge, "edge");
        observation.edgeValue = edgeValue;
        if (!(Number.isFinite(edgeValue) && (initial - reference) * (edgeValue - reference) <= 0))
          throw new Error(old.input.name + ": no sign bracket on the original root-facing source ray at column " + k);
        const lo: number = Math.min(q0, edge);
        const hi: number = Math.max(q0, edge);
        bracket = [lo, hi];
        observation.bracket = bracket;
        // Illinois refinement of the signed bracket (Dowell and Jarratt, 1971).
        q = bracketedRoot((trial: number): number => {
          return value(trial, "trial") - reference;
        }, lo, hi, Number.EPSILON * Math.max(1, Math.abs(q0)));
      }
      const actual: number = value(q, "final");
      observation.actual = actual;
      const finalDerivative: number = q === q0 ? initialDerivative : derivative(q, "final");
      if (!(Number.isFinite(q) && q > 0 && Number.isFinite(actual) && Math.abs(actual - reference) <= budget))
        throw new Error(old.input.name + ": radial source-level root fails its numeric postcheck at column " + k);
      shares.push(q);
      columns.push({
        originalShare: q0, share: q, reference, actual, signed: actual - reference,
        derivative: finalDerivative, originalDerivative, bracket,
        method: "fixed original-side sign bracket in the actual source/phase domains; deterministic Illinois selection and final original-direction Gq/level postcheck; nearest root, connected branch and parameter homotopy are unverified",
      });
      } catch (error: unknown) {
        const reason: string = error instanceof Error ? error.message : String(error);
        throw new Error(reason + "; diagnostic=" + JSON.stringify(observation,
          (_key: string, value: unknown): unknown =>
            typeof value === "number" && !Number.isFinite(value)
              ? "nonfinite:" + String(value) : value,
        ));
      }
    }
    const same: boolean = shares.every((q: number, k: number): boolean =>
      Object.is(q, oldLoop.shape?.[k] ?? 1),
    );
    return { loop: same ? oldLoop : { ...oldLoop, shape: shares }, columns };
  }

  /** Normalize two independently supplied bare calipers in their actual fixed source frame. */
  function radius(frame: IAutoMovieLoftSectionFrame, depth: number, breadth: number): IField {
    if (![depth, breadth].every((value: number): boolean => Number.isFinite(value) && value > 0))
      throw new Error("elliptic root level needs positive finite calipers");
    const a: number = depth / 2;
    const b: number = breadth / 2;
    if (!(a > 0 && b > 0)) throw new Error("root level caliper half underflow");
    return {
      value: (point: V): number => {
        const q: V = Vector.sub(point, frame.origin);
        const u: number = Vector.dot(q, frame.u) / a;
        const v: number = Vector.dot(q, frame.v) / b;
        const result: number = u * u + v * v;
        if (!Number.isFinite(result)) throw new Error("root radius level is nonfinite");
        return result;
      },
      gradient: (point: V): V => {
        const q: V = Vector.sub(point, frame.origin);
        return Vector.add(
          Vector.scale(frame.u, 2 * (Vector.dot(q, frame.u) / a) / a),
          Vector.scale(frame.v, 2 * (Vector.dot(q, frame.v) / b) / b),
        );
      },
    };
  }
}
