import {
  AutoMovieConstructionViews,
  type AutoMovieLoftContract,
  type AutoMovieLoftFrame,
  AutoMovieLoftSectionNative,
  type AutoMovieLoftSectionSource,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import type { AutoMovieHumanSiteViewPart as Site } from "../limb/AutoMovieHumanSiteViewPart";
import type { AutoMovieHumanHeadNeckCurves } from "../head/AutoMovieHumanHeadNeckCurves";

/** A physical-station scalar value and its available first two derivatives. */
type Scalar = readonly [number, number, number];

/** Transfer the canonical regular neck family into the trunk's original sources, before either loft or tree publication. */
export namespace AutoMovieHumanTrunkConnection {
  /** Actual original section plane and its available physical-station derivatives; no coefficient layer is manufactured. */
  export interface IBoundary {
    /** Physical world-height station, calibration millimetres. */
    y: number;

    /** Original world origin and fixed +X/+Z basis. */
    frame: AutoMovieLoftFrame.IFrame;

    /** Actual first derivative in physical station millimetres. */
    frameSlopes: AutoMovieLoftFrame.IFrame;

    /** Actual second derivative in the same physical station. */
    frameCurvatures: AutoMovieLoftFrame.IFrame;
  }

  /** One actual native generating boundary and frame2; this original view declares no additional phase lift. */
  export interface IDefinition {
    /** Actual regular neck boundary, before any coefficient layer exists. */
    boundary: IBoundary;

    /** Whole phase family, not just four supports or fitted coefficients. */
    field: Extract<
      AutoMovieLoftSectionSource.IEndpoint["field"],
      { kind: "native" }
    >;
  }

  /** A boundary read from an actual interval part additionally retains that part's original declarations. */
  export interface IConnection extends IDefinition {
    /** Actual preloft source ownership retained by both original consumers. */
    original: {
      part: IAutoMovieViewPart;
      source: AutoMovieLoftViewSource.ISource;
    };
  }

  /** Direct normal-cylinder boundary, including the valid zero-height plane case; no lower radius or interval is invented. */
  export function normal(definition: AutoMovieHumanHeadNeckCurves.IDefinition): IDefinition {
    const y: number = definition.band[1];
    const x: number = definition.planeOrigin[0] + definition.slope * (y - definition.planeOrigin[1]);
    return {
      boundary: { y,
        frame: { origin: [x, y, 0], u: [1, 0, 0], v: [0, 0, 1] },
        frameSlopes: { origin: [definition.slope, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
        frameCurvatures: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
      },
      field: { kind: "native", inputs: {
        extents: definition.extents.map((value: number): Scalar => [value, 0, 0]),
        shoulders: definition.extents.map((): Scalar => [AutoMovieViewSection.ELLIPSE, 0, 0]),
      } },
    };
  }

  /** Read the complete original regular family and its actual frame2 before constructing either adjoining loft. */
  export function captureOriginal(
    part: IAutoMovieViewPart,
    station: number,
  ): IConnection {
    const prepared: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(part);
    if (prepared?.source === null || prepared === null)
      throw new Error(
        `Canonical neck needs its actual direct original: ${JSON.stringify(prepared?.diagnostics ?? [])}`,
      );
    const source: AutoMovieLoftViewSource.ISource = prepared.source;
    const inputs: AutoMovieLoftViewRead.IJets | string =
      AutoMovieLoftViewRead.jets(source, station);
    if (typeof inputs === "string") throw new Error(inputs);
    AutoMovieLoftSectionNative.jet(inputs)(0);
    const frame: ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> =
      part.axis.jet?.(station) ?? null;
    if (
      frame === null ||
      [frame.value, frame.first, frame.second].some(
        (row: NonNullable<typeof frame>["value"]): boolean =>
          [...row.origin, ...row.u, ...row.v].some(
            (value: number): boolean => !Number.isFinite(value),
          ),
      )
    )
      throw new Error(
        "Canonical neck needs its actual complete finite physical frame2",
      );
    if (
      frame.value.origin[1] !== station ||
      frame.first.origin[1] !== 1 ||
      frame.second.origin[1] !== 0 ||
      frame.value.origin[2] !== 0 ||
      frame.first.origin[2] !== 0 ||
      frame.second.origin[2] !== 0 ||
      frame.value.u.some(
        (v: number, i: number): boolean => v !== [1, 0, 0][i],
      ) ||
      frame.value.v.some(
        (v: number, i: number): boolean => v !== [0, 0, 1][i],
      ) ||
      [
        ...frame.first.u,
        ...frame.first.v,
        ...frame.second.u,
        ...frame.second.v,
      ].some((v: number): boolean => v !== 0)
    )
      throw new Error(
        "Canonical neck needs its actual unit-height, fixed +X/+Z regular frame2",
      );
    return {
      boundary: {
        y: station,
        frame: frame.value,
        frameSlopes: frame.first,
        frameCurvatures: frame.second,
      },
      field: { kind: "native", inputs },
      original: { part, source },
    };
  }

  /**
   * Replace the named neck boundary only after preparing the unchanged old
   * sources. Copying all old parameter jets preserves their lower polynomial
   * spans; only spans incident to this boundary receive new conditions.
   * Native quarter fullness and actual axis origin remain independent owners.
   */
  export function apply(
    definition: Site.IDefinition,
    connection: IDefinition,
  ): Site.IDefinition {
    if (definition.part === null || definition.view === null) return definition;
    try {
      const original: IAutoMovieViewPart = definition.part;
      const view: NonNullable<Site.IDefinition["view"]> = definition.view;
      const at: number = connection.boundary.y;
      if (
        view.axis.type !== "parallel" ||
        original.fullness.kind !== "shoulder" ||
        original.fullness.departures !== undefined
      )
        throw new Error(
          "Trunk connection needs its existing parallel/common-shoulder source",
        );
      if (
        !original.front.positive.knots.some(
          (k: IAutoMovieViewPart.IKnot): boolean =>
            k.site === "neck" && k.station === at,
        )
      )
        throw new Error(
          "Canonical neck station does not equal the trunk's named connection",
        );
      const ends: AutoMovieViewOutline.IEnds = {};
      if (original.pole === "bottom" || original.pole === "both")
        ends.bottom = original.stations[0]!;
      if (original.pole === "top" || original.pole === "both")
        ends.top = original.stations.at(-1)!;
      const inputs: IConnection["field"]["inputs"] = connection.field.inputs;
      const edge: (
        outline: IAutoMovieViewPart.IOutline,
        q: number,
      ) => IAutoMovieViewPart.IOutline = (
        outline: IAutoMovieViewPart.IOutline,
        q: number,
      ): IAutoMovieViewPart.IOutline => {
        const jet: Scalar = inputs.extents[q]!;
        return replace(
          outline,
          ends,
          at,
          q < 2 ? jet : [-jet[0], -jet[1], -jet[2]],
        );
      };
      const frame: AutoMovieLoftFrame.IFrame = connection.boundary.frame;
      const first: AutoMovieLoftFrame.IFrame = connection.boundary.frameSlopes;
      const second: AutoMovieLoftFrame.IFrame =
        connection.boundary.frameCurvatures;

      // Keep the actual asymmetric origin; back+anterior radius would recenter it.
      const oldX: IAutoMovieViewPart.IOutline = AutoMovieViewOutline.scale(
        view.axis.origin.x,
        1000,
        1000,
      );
      const axis: typeof view.axis = {
        ...view.axis,
        origin: {
          ...view.axis.origin,
          x: AutoMovieHumanConstructionView.length(
            replace(oldX, {}, at, [
              frame.origin[0],
              first.origin[0],
              second.origin[0],
            ]),
          ),
        },
      };
      const evaluated: ReturnType<typeof AutoMovieConstructionViews.frame> =
        AutoMovieConstructionViews.frame(axis);
      if (typeof evaluated === "string") throw new Error(evaluated);
      const common: IAutoMovieViewPart.IOutline = original.fullness.shoulder;
      const shoulders: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> =
        [0, 1, 2, 3].map(
          (q: number): IAutoMovieViewPart.IOutline =>
            replace(common, {}, at, inputs.shoulders[q]!),
        ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;
      const part: IAutoMovieViewPart = {
        ...original,
        stations: original.stations.filter(
          (station: number): boolean => station <= at,
        ),
        pole:
          original.pole === "both"
            ? "bottom"
            : original.pole === "top"
              ? undefined
              : original.pole,
        axis: evaluated,
        front: {
          positive: edge(original.front.positive, 0),
          negative: edge(original.front.negative, 2),
        },
        side: {
          positive: edge(original.side.positive, 1),
          negative: edge(original.side.negative, 3),
        },
        fullness: { kind: "top", shoulders },
      };
      return {
        part,
        view: AutoMovieHumanConstructionView.of(part, axis),
        diagnostics: [...definition.diagnostics],
      };
    } catch (error: unknown) {
      const diagnostic: AutoMovieLoftContract.IDiagnostic = {
        producer: "view.trunk",
        level: 2,
        contract: "canonical neck source",
        detail: error instanceof Error ? error.message : String(error),
      };
      return {
        part: null,
        view: null,
        diagnostics: [...definition.diagnostics, diagnostic],
      };
    }
  }
}

/** Reproduce every old polynomial span by its value/two jets, changing only this named boundary in the same source clock. */
function replace(
  outline: IAutoMovieViewPart.IOutline,
  ends: AutoMovieViewOutline.IEnds,
  at: number,
  target: Scalar,
): IAutoMovieViewPart.IOutline {
  const prepared:
    | AutoMovieViewOutline.IOutline
    | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
    outline,
    ends,
  );
  if ("detail" in prepared) throw new Error(prepared.detail);
  if (
    !prepared.knots.some(
      (k: IAutoMovieViewPart.IKnot): boolean => k.station === at,
    )
  )
    throw new Error("Connection is not an existing source partition");
  const span: number =
    AutoMovieViewParameter.at(prepared.parameter, prepared.domain[1]) -
    AutoMovieViewParameter.at(prepared.parameter, prepared.domain[0]);
  const inverse: [number, number] | null = AutoMovieViewParameter.inverseJet(
    prepared.parameter,
    at,
  );
  if (inverse === null || !(span > 0))
    throw new Error("Connection needs a regular source-coordinate transfer");
  const knots: IAutoMovieViewPart.IKnot[] = prepared.knots.map(
    (knot: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => {
      const old: AutoMovieViewOutline.IReading | string =
        AutoMovieViewOutline.at(prepared, knot.station);
      if (typeof old === "string") throw new Error(old);
      const own: boolean = knot.station === at;
      const first: number = own ? target[1] * inverse[0] : old.parameterJet[0];
      const second: number = own
        ? target[2] * inverse[0] ** 2 + target[1] * inverse[1]
        : old.parameterJet[1];
      return {
        site: knot.site,
        station: knot.station,
        value: own ? target[0] : old.value,
        jet: { first: first * span, second: second * span * span },
      };
    },
  );
  return { ...outline, parameter: prepared.parameter, knots };
}
