import {
  type AutoMovieViewAxis,
  type IAutoMovieConstructionProfileSource,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionProfile } from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanTorsoClosure } from "./AutoMovieHumanTorsoClosure";
import type { AutoMovieHumanTorsoCollar } from "./AutoMovieHumanTorsoCollar";
import { AutoMovieHumanTorsoField } from "./AutoMovieHumanTorsoField";
import { AutoMovieHumanTorsoMeasurements } from "./AutoMovieHumanTorsoMeasurements";
import { AutoMovieHumanTorsoPlan } from "./AutoMovieHumanTorsoPlan";
import type { AutoMovieHumanTorsoRegion } from "./AutoMovieHumanTorsoRegion";
import { AutoMovieHumanTorsoThorax } from "./AutoMovieHumanTorsoThorax";
import type { AutoMovieHumanTorsoWall } from "./AutoMovieHumanTorsoWall";
import { AutoMovieHumanTrunkSectionFamily } from "./AutoMovieHumanTrunkSectionFamily";

/**
 * One original S00 section field combines the wall, two breast controls and two gluteal controls in common world-Y planes before lofting.
 *
 * Regional AP envelopes blend the same wall point toward their declared AP apex plane. The collar shares the actual neck field on and above its complete nonplanar base course. TorsoField supplies analytic phase/physical2 of these same original formulas; regularity, coupled chest/hip/course closure and ports still require verification. No missing derivative is filled with zero.
 */
export namespace AutoMovieHumanTorsoSource {
  /** An original named physical section, separate from display sampling and from a final surface. */
  export interface ISection {
    /** Stable anatomical or region-derived plane id. */
    readonly id: string;
    /** Physical world-Y station, calibration mm. */
    readonly station: number;
    /** Actual section owner; clock is unchanged radians. */
    readonly source: string;
  }

  /** Direct original curve or local-datum locus for existing inspection consumers. */
  export interface IGuide {
    /** Stable source guide identity. */
    readonly id: string;
    /** Logical region selecting this original locus. */
    readonly region: string;
    /** Actual physical station interval, calibration mm. */
    readonly domain: readonly [number, number];
    /** Original material clock; it stays fixed along this guide rather than prescribing a fixed lateral coordinate. */
    readonly clock: number;
    /** World calibration-mm original point, without a sampled construction fit. */
    point(station: number): [number, number, number];
  }

  /** A source candidate and its honest original-only completion state. */
  export interface IOutput {
    /** Actual closed profile declaration plus callable original Point0 owner. */
    readonly source: IAutoMovieConstructionProfileSource;
    /** One call-owned shared measurement/placement plan. */
    readonly plan: AutoMovieHumanTorsoPlan.IOutput;
    /** Original physical planes, including every named wall site and regional footprint end/apex. */
    readonly sections: readonly ISection[];
    /** Original guides and region datum lines, not final-loft section curves. */
    readonly guides: readonly IGuide[];
    /** Original wall controls, retained for individual contributor inspection; no separate output loft is made. */
    readonly wall: IAutoMovieViewPart;
    /** Complete original wall-plane descriptors and their call-owned independent scalar results. */
    readonly wallSections: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane>;
    /** Actual owner boundaries, in elapsed ms; definition includes shared scalar/field preparation, while explicit closure includes its complete candidate work. */
    readonly milliseconds: {
      readonly controls: number | null;
      readonly sharedScalars: number;
      readonly localField: number;
      readonly definition: number;
      readonly explicitClosure: number | null;
      readonly closureWork: Readonly<AutoMovieHumanTorsoClosure.IWork> | null;
    };
    /** Actual phase-dependent source start and both protected neck courses. */
    readonly collar: AutoMovieHumanTorsoCollar.IField;

    /** Actual common-plane component and product-rule readings, without constructing another field. */
    readonly contributors: AutoMovieHumanTorsoField.IOutput["contributors"];

    /** Same whole original family in its native radian clock, including signed material-guide clocks. */
    point(station: number, clock: number): [number, number];
    /** Actual whole-family phase capability, independently of a physical2 request. */
    phase(
      station: number,
      clock: number,
    ): IAutoMovieConstructionProfileSource.IPhase | null;
    /** Exact regional membership on this original, separate from conservative piece inventory. */
    active(region: string, station: number, clock: number): boolean;
    /** Explicit original-plane observations; this does not solve or mutate the plan's semantic constraints. */
    measurements(): readonly AutoMovieHumanTorsoMeasurements.IReading[];
    /** Provided derivative functions are distinct from whole-domain regularity or shape acceptance. */
    readonly capability: {
      readonly point: true;
      /** Actual phase1/2 is available on regular physical stations, independently of total2. */
      readonly phase: "regular-stations";
      readonly total2: "provided-on-regular-stations-unverified";
      readonly coupledConstraints: "unrequested" | "partially-source-closed";
      readonly ports: "unrequested";
      readonly loft: "not-run";
    };
  }

  /**
   * Author the first actual common-plane source without lofting or querying any completed surface.
   *
   * Wall scalars and their actual neck connection use the existing original owner. Regional apex correspondence is read on that same source once per region. Its original material clock then supplies the whole guide, including a collapsed pole. This is preloft curve correspondence, not a contact search between finished lofts. The complete ring remains an original formula for every physical station, not a finite union of independently sampled sections.
   */
  export function create(parameters: IAutoMovieHumanParameters, definition?: AutoMovieHumanTorsoPlan.IDefinition, shared?: Parameters<typeof AutoMovieHumanTorsoPlan.create>[1]): IOutput {
    const started: number = performance.now();
    const plan: AutoMovieHumanTorsoPlan.IOutput =
      definition === undefined ? AutoMovieHumanTorsoPlan.create(parameters, shared) : AutoMovieHumanTorsoPlan.close(definition);
    const chest: (typeof plan.wall.sites)[number] | undefined =
      plan.wall.sites.find(
        (site: (typeof plan.wall.sites)[number]): boolean =>
          site.site === "chest",
      );
    if (chest === undefined)
      throw new Error("The actual thorax has no original chest height");
    const authored: AutoMovieHumanTorsoPlan.IOutput =
      AutoMovieHumanTorsoThorax.prepare(plan).at(chest.y);
    const controls: number = performance.now() - started;
    const original: IOutput = define(authored);
    return { ...original, milliseconds: { ...original.milliseconds, controls } };
  }

  /** Fresh caller-owned numerical observations, separate from immutable source inputs. */
  export function work(): AutoMovieHumanTorsoClosure.IWork {
    return {
      elapsed: null,
      rangeRead: 0, sharedScalars: 0, field: 0, hull: 0, course: 0,
      heightTrials: 0, fieldTrials: 0,
      heightRevisitsAfterOtherTrial: 0, trials: [],
    };
  }

  /** Explicitly request the coupled chest/course inversion; refusal propagates and never replaces the observable candidate. */
  export function close(original: IOutput, observations?: AutoMovieHumanTorsoClosure.IWork): IOutput {
    const started: number = performance.now();
    const stats: AutoMovieHumanTorsoClosure.IWork = observations ?? work();
    let closed: IOutput;
    try {
      closed = AutoMovieHumanTorsoClosure.create(original.plan, define, original.wallSections, stats);
    } finally {
      stats.elapsed = performance.now() - started;
    }
    return {
      ...closed,
      milliseconds: {
        ...closed.milliseconds,
        explicitClosure: stats.elapsed,
        closureWork: stats,
      },
    };
  }

  /** Consume one immutable plan directly, so an editor's changed constraints own a fresh source family. */
  export function define(
    plan: AutoMovieHumanTorsoPlan.IOutput,
    sections?: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane>,
  ): IOutput {
    const started: number = performance.now();
    const wallSections: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane> =
      sections ?? AutoMovieHumanTrunkSectionFamily.define(plan.wall);

    // These native box/tape constraints are the shared preparation stage.
    // The local field and all subsequent point queries consume their result.
    for (const plane of wallSections.values()) plane.resolve();
    const scalarDone: number = performance.now();
    const field: AutoMovieHumanTorsoField.IOutput =
      AutoMovieHumanTorsoField.create(plan, wallSections);
    const fieldDone: number = performance.now();
    const wall: AutoMovieHumanTorsoWall.IOutput = field.wall;
    const original: IAutoMovieViewPart = wall.part;
    const domain: readonly [number, number] = plan.domain;
    const fields: readonly AutoMovieHumanTorsoRegion.IField[] = field.regions;

    /** One continuous original section formula, including both regional sides and all concavities it actually authors. */
    const point: AutoMovieHumanTorsoField.IOutput["point"] = field.point;

    /** Analytic phase product rule of the same convex AP envelope; unavailable physical2 stays separate. */
    const phase: AutoMovieHumanTorsoField.IOutput["phase"] = field.phase;
    const curves: Map<string, IAutoMovieConstructionProfileSource.ICurve> =
      new Map();
    const pieces: IAutoMovieConstructionProfile.IPiece[] = [];
    for (let quarter: number = 0; quarter < 4; quarter++) {
      const id: string = "S00.outer.q" + quarter;
      const clock: [number, number] = [
        (quarter * Math.PI) / 2,
        ((quarter + 1) * Math.PI) / 2,
      ];
      curves.set(id, { domain, clock, point, phase, jet: field.jet });
      pieces.push({ id, source: id, clock, direction: 1, branch: "torso" });
    }
    const plane: AutoMovieViewAxis.IAxis = {
      at: (station: number): ReturnType<AutoMovieViewAxis.IAxis["at"]> => ({
        origin: [0, station, 0],
        u: [1, 0, 0],
        v: [0, 0, 1],
      }),
      jet: (
        station: number,
      ): ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>> => ({
        value: { origin: [0, station, 0], u: [1, 0, 0], v: [0, 0, 1] },
        first: { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
        second: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
      }),
    };
    const active: (name: string, station: number, clock: number) => boolean = (
      name: string,
      station: number,
      clock: number,
    ): boolean => {
      const region: AutoMovieHumanTorsoPlan.IRegion | undefined =
        plan.regions.find(
          (candidate: AutoMovieHumanTorsoPlan.IRegion): boolean =>
            candidate.name === name,
        );
      if (region === undefined)
        throw new Error("S00 has no original region " + name);
      if (
        station < Math.max(domain[0], region.apex[1] - region.footprint[2]) ||
        station > Math.min(domain[1], region.apex[1] + region.footprint[0])
      )
        return false;
      return (
        fields
          .find(
            (field: AutoMovieHumanTorsoRegion.IField): boolean =>
              field.region === region,
          )!
          .weight(station, wall.point(station, clock)[1], clock) > 0
      );
    };
    const memberships: ReadonlyMap<
      string,
      IAutoMovieConstructionProfileSource.IRegion
    > = new Map(
      plan.regions.map(
        (
          region: AutoMovieHumanTorsoPlan.IRegion,
        ): [string, IAutoMovieConstructionProfileSource.IRegion] => [
          region.name + ".active",
          {
            domain: [
              Math.max(domain[0], region.apex[1] - region.footprint[2]),
              Math.min(domain[1], region.apex[1] + region.footprint[0]),
            ],
            contains: (station: number, clock: number): boolean =>
              active(region.name, station, clock),
            intervals: (): null => null,
          },
        ],
      ),
    );
    const named: Map<string, number> = new Map(
      plan.wall.sites.map(
        (site: (typeof plan.wall.sites)[number]): [string, number] => [
          site.site,
          site.y,
        ],
      ),
    );
    for (const region of plan.regions)
      for (const [suffix, station] of [
        ["lower", region.apex[1] - region.footprint[2]],
        ["apex", region.apex[1]],
        ["upper", region.apex[1] + region.footprint[0]],
      ] as const)
        if (station > domain[0] && station < domain[1])
          named.set(region.name + "." + suffix, station);
    const definition: IAutoMovieConstructionProfile = {
      name: "S00",
      domain: [domain[0] / 1000, domain[1] / 1000],
      plane: "S00.world-Y",
      loops: [
        {
          id: "S00.outer",
          kind: "outer",
          orientation: 1,
          surfaceOrientation: 1,
          pole: "bottom",
          domain: [domain[0] / 1000, domain[1] / 1000],
          pieces,
        },
      ],
      guides: pieces.map(
        (
          piece: IAutoMovieConstructionProfile.IPiece,
        ): IAutoMovieConstructionProfile.IGuide => ({
          id: piece.id + ".start",
          piece: piece.id,
          clock: piece.clock[0],
        }),
      ),
      regions: [
        {
          id: "S00.wall",
          logicalParts: ["trunk", "neck"],
          pieces: pieces.map(
            (piece: IAutoMovieConstructionProfile.IPiece): string => piece.id,
          ),
          material: "torso.skin",
          binding: "torso.skin",
        },
        ...plan.regions.map(
          (
            region: AutoMovieHumanTorsoPlan.IRegion,
          ): IAutoMovieConstructionProfile.IRegion => ({
            id: region.name,
            logicalParts: [region.name],
            domain: [
              Math.max(domain[0], region.apex[1] - region.footprint[2]) / 1000,
              Math.min(domain[1], region.apex[1] + region.footprint[0]) / 1000,
            ],
            trim: region.name + ".active",
            pieces: pieces
              .filter(
                (piece: IAutoMovieConstructionProfile.IPiece): boolean =>
                  region.outward *
                    Math.cos((piece.clock[0] + piece.clock[1]) / 2) >
                  0,
              )
              .map(
                (piece: IAutoMovieConstructionProfile.IPiece): string =>
                  piece.id,
              ),
            material: "torso.skin",
            binding: "torso.skin",
          }),
        ),
      ],
      revisions: {
        source: JSON.stringify({
          domain,
          scale: plan.scale,
          wall: {
            perineum: plan.wall.perineum,
            sites: plan.wall.sites,
            backProfile: plan.wall.backProfile,
          },
          neck: {
            boundary: plan.neck.boundary,
            inputs: plan.neck.field.inputs,
            controls: plan.neckFamily.controls,
            support: plan.neckFamily.support,
            collarStart: plan.collarStart,
            jointDatum: plan.neckJointDatum,
          },
          regions: plan.regions,
        }),
        constraints: JSON.stringify(plan.constraints),
        topology: "S00.original-outer;ports-unrequested",
      },
    };
    const guides: IGuide[] = pieces.map(
      (piece: IAutoMovieConstructionProfile.IPiece): IGuide => ({
        id: piece.id + ".start",
        region: "trunk",
        domain,
        clock: piece.clock[0],
        point: (station: number): [number, number, number] => {
          const p: [number, number] = point(station, piece.clock[0]);
          return [p[0], station, p[1]];
        },
      }),
    );
    for (const field of fields)
      guides.push({
        id: field.region.name + ".apex-meridian",
        region: field.region.name,
        clock: field.clock,
        domain: [
          Math.max(domain[0], field.region.apex[1] - field.region.footprint[2]),
          Math.min(domain[1], field.region.apex[1] + field.region.footprint[0]),
        ],
        point: (station: number): [number, number, number] => {
          const p: [number, number] = point(station, field.clock);
          return [p[0], station, p[1]];
        },
      });
    return {
      source: {
        definition,
        plane: { id: definition.plane, axis: plane },
        curves,
        regions: memberships,
      },
      plan,
      wall: original,
      wallSections,
      milliseconds: {
        controls: null,
        sharedScalars: scalarDone - started,
        localField: fieldDone - scalarDone,
        definition: performance.now() - started,
        explicitClosure: null,
        closureWork: null,
      },
      collar: field.collar,
      contributors: field.contributors,
      point,
      phase,
      active,
      measurements: (): readonly AutoMovieHumanTorsoMeasurements.IReading[] =>
        AutoMovieHumanTorsoMeasurements.read({ plan, point, guides }),
      sections: [...named]
        .sort(
          (a: [string, number], b: [string, number]): number =>
            a[1] - b[1] || a[0].localeCompare(b[0]),
        )
        .map(
          ([name, station]: [string, number]): ISection => ({
            id: "S00.plane." + name,
            station,
            source: "S00.outer",
          }),
        ),
      guides,
      capability: {
        point: true,
        phase: "regular-stations",
        total2: "provided-on-regular-stations-unverified",
        coupledConstraints: plan.constraints.some(
          (constraint: AutoMovieHumanTorsoPlan.IConstraint): boolean =>
            constraint.state === "sampled-source-closed",
        )
          ? "partially-source-closed"
          : "unrequested",
        ports: "unrequested",
        loft: "not-run",
      },
    };
  }
}
