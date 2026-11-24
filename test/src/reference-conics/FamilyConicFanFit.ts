import {
  AutoMovieSolidVector as V,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSplit,
  IAutoMovieHumanConicLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { FamilyConicFanInput as Fan } from "./FamilyConicFanInput";
import { FamilyConicFit as Fit } from "./FamilyConicFit";
import { FamilyConicJunctionModel } from "./FamilyConicJunctionModel";

/**
 * Fit a prepared fan's supplied material, using curve-space trials and the
 * actual split to seal an accepted state.
 */
export namespace FamilyConicFanFit {
  /**
   * An authority's affine bound on a digit's free material ordinates, in the
   * relevant field units.
   */
  export interface IBound {
    /**
     * Hard rows must hold at the start. Inside rows may enter the elastic
     * phase.
     */
    kind: "hard" | "inside";
    /** Terms summed before comparison with the upper bound. */
    terms: readonly {
      digit: string;
      field: number;
      knot: number;
      weight: number;
    }[];
    /** Greatest allowed sum of the terms. */
    maximum: number;
  }

  /** Numerical and realization scope for one explicit fan invocation. */
  export interface IOptions {
    /** Incidence tolerance in the model's signed row units. */
    tolerance: number;
    /** Maximum accepted group updates. */
    updates: number;
    /**
     * Optional relative objective and predicted-decrease exit on feasible
     * steps.
     */
    convergence?: { tolerance: number; steps: number };

    /** Certify the terminal feasible state once when the publisher keeps the prior stock. */
    finalOnly?: boolean;
    /** Clearance of the fitted polygon from the exact host rail, millimetres. */
    hostRailReserve?: number;
    /** Maximum accepted raw restoration updates. */
    restorationUpdates: number;
    /** Realization chord length in metres. */
    chord: number;
    /** Stations across each skin strip. */
    rows: number;
    /** Additional material bounds supplied by the current geometry authority. */
    bounds?: readonly IBound[];
    /** Optional solver progress and geometry observations. */
    observe?: (event: object) => void;
  }

  /** Exact terminal skin and the reason it could not be admitted, if any. */
  export interface ISeal {
    /** Engine realization when its sources were constructed. */
    realization: IAutoMovieConstructionRealization.IRealization | null;
    /** Named engine diagnostics or absent source ownership. */
    refusal: string | null;
  }

  /**
   * The numerical receipt and the corresponding expanded, protected digit
   * families.
   */
  export interface IResult {
    /**
     * The group solver's complete receipt, including its terminal skin seal
     * when attempted.
     */
    result: Exclude<ReturnType<typeof Fit.fitGroup<ISeal>>, string>;
    /** Final digit material by source name, evaluated at the receipt's vector. */
    families: Map<string, IAutoMovieHumanConicLoft.IFamily>;
  }

  /**
   * Prepare the shared reduced variable scope, restore raw source inequalities,
   * then run the group solver.
   *
   * @returns The full fit receipt and its final digit families, or the reason
   *   an initial source or solve failed.
   */
  export function fit(
    input: Fan.IRequest,
    options: IOptions,
  ): IResult | string {
    if (
      !(
        Number.isFinite(options.tolerance) &&
        options.tolerance > 0 &&
        Number.isFinite(options.chord) &&
        options.chord > 0
      ) ||
      !Number.isInteger(options.rows) ||
      options.rows < 1 ||
      !Number.isInteger(options.updates) ||
      options.updates < 0 ||
      !Number.isInteger(options.restorationUpdates) ||
      options.restorationUpdates < 0
    )
      throw new Error("invalid fan fit or realization scope");
    const prepared = Fan.prepare(input);
    const initial: number[] = [];
    const fields: { stock: string; step: number }[] = [];
    const members = new Map(
      prepared.digits.map(({ digit, tail, expand }) => {
        const name: string = digit.family.name;
        const offset: number = initial.length;
        const steps: number[] = Fit.sectionSteps(digit.family.layout);
        tail.initial.forEach((row: number[], f: number): void => {
          for (const index of tail.free) {
            initial.push(row[index]!);
            fields.push({ stock: name, step: steps[f]! });
          }
        });
        const frame = AutoMovieHumanConicLoft.axis(digit.family).at(
          tail.knots[0]!,
        );
        const plane: [number, number, number] = [
          V.dot(
            V.sub(
              frame.origin as [number, number, number],
              prepared.plane.point,
            ),
            prepared.plane.normal,
          ),
          V.dot(frame.u as [number, number, number], prepared.plane.normal),
          V.dot(frame.v as [number, number, number], prepared.plane.normal),
        ];
        // The conic's own positive leg, orientation and share rules govern this stock. No empirical meeting margin is added.
        const section = Fit.prepareGroupMember(
          digit.stations.map(
            (s: number): Fit.IRow => ({
              s,
              heldout: s >= tail.mark,
              points: [],
            }),
          ),
          tail,
          digit.family,
          0,
        );
        return [
          name,
          {
            name,
            digit,
            tail,
            expand,
            offset,
            plane,
            readMargins: section.raw,
          },
        ] as const;
      }),
    );
    const stockAt = (
      state: readonly number[],
      name: string,
    ): IAutoMovieHumanConicLoft.IFamily => {
      const member = members.get(name);
      if (member === undefined) throw new Error("unknown fan stock " + name);
      const width: number = member.tail.free.length;
      return member.expand(
        member.tail.initial.map((_, f: number): number[] =>
          state.slice(
            member.offset + f * width,
            member.offset + (f + 1) * width,
          ),
        ),
      );
    };
    const stocks = (
      state: readonly number[],
    ): Map<string, IAutoMovieHumanConicLoft.IFamily> =>
      new Map(
        [...members.keys()].map(
          (name: string) => [name, stockAt(state, name)] as const,
        ),
      );
    const bounds = (options.bounds ?? []).map(({ kind, terms, maximum }) => {
      const gradient = new Map<number, number>();
      if (terms.length === 0 || !Number.isFinite(maximum))
        throw new Error(
          "a fan bound needs finite coefficients and a right-hand side",
        );
      for (const { digit, field, knot, weight } of terms) {
        const member = members.get(digit);
        if (
          member === undefined ||
          !Number.isInteger(field) ||
          field < 0 ||
          field >= member.tail.initial.length ||
          !Number.isInteger(knot) ||
          knot < 0 ||
          knot >= member.tail.free.length ||
          !Number.isFinite(weight)
        )
          throw new Error(
            "a fan bound uses an unknown independent field ordinate",
          );
        const index: number =
          member.offset + field * member.tail.free.length + knot;
        gradient.set(index, (gradient.get(index) ?? 0) + weight);
      }
      return { kind, gradient, maximum };
    });

    /**
     * The fixed field space supplies raw, exact section guards before any
     * coupled geometry is read.
     */
    const material = (
      families: ReadonlyMap<string, IAutoMovieHumanConicLoft.IFamily>,
      derivatives: boolean,
    ) => {
      const margins: Fit.IStartMargin[] = [];
      let fault: string | null = null;
      for (const member of members.values()) {
        const found = member.readMargins(
          families.get(member.name)!.values,
          member.offset,
          derivatives,
          member.plane,
          true,
        );
        if (typeof found === "string") return member.name + ": " + found;
        if (found.fault !== null && fault === null)
          fault = member.name + ": " + found.fault;
        margins.push(...found.margins);
      }
      return { margins, fault };
    };
    const restored = Fit.restoreGroup(
      initial,
      (state, derivatives) => material(stocks(state), derivatives),
      options.restorationUpdates,
      options.observe,
    );
    if (restored.stopped !== null) return restored.stopped;

    const name: string = input.kind + ".fan";
    const host: string = input.host.family.name;
    const model = FamilyConicJunctionModel.prepare({
      name,
      plane: {
        origin: prepared.plane.point,
        x: prepared.host.basis.x,
        y: prepared.host.basis.y,
        z: prepared.plane.normal,
      },
      count: input.count,
      children: [...members.values()].map(
        ({ digit, tail, name }): FamilyConicJunctionModel.IChild => ({
          face: name,
          stock: name,
          family: digit.family,
          tail,
          rail: digit.rail,
          stations: digit.stations,
          into: 1,
        }),
      ),
      hostRailReserve: options.hostRailReserve,
      host: {
        face: host,
        stock: host,
        family: input.host.family,
        station: prepared.host.station,
      },
      fields,
      seeds: stocks(restored.values),
      stockAt,
      log: (event: string, detail: object): void =>
        options.observe?.({ event, ...detail }),
    });

    /**
     * Carry the stock expansion and undifferentiated margins into the actual
     * trial.
     */
    const screen = (
      state: readonly number[],
    ): string | (() => Fit.GroupTrial) => {
      try {
        const candidate = stocks(state);
        const guards = material(candidate, false);
        if (typeof guards === "string") return guards;
        if (guards.fault !== null) return guards.fault;
        const invalid = guards.margins.find(({ value, closed }): boolean =>
          closed ? value < 0 : value <= 0,
        );
        if (invalid !== undefined) return invalid.label + ": " + invalid.value;
        const hard: Fit.IGroupRow[] = [],
          inside: Fit.IGroupRow[] = [];
        for (const bound of bounds) {
          let value: number = -bound.maximum;
          for (const [index, weight] of bound.gradient)
            value += weight * state[index]!;
          if (bound.kind === "hard" && value > 0)
            return "the trial exceeds a supplied hard material bound";
          (bound.kind === "hard" ? hard : inside).push({
            value,
            gradient: bound.gradient,
          });
        }
        return () =>
          (derivatives): ReturnType<Fit.GroupTrial> => {
            const current = derivatives ? material(candidate, true) : guards;
            if (typeof current === "string") return current;
            const native: Fit.IGroupRow[] = current.margins.map(
              ({ value, scale, gradient }): Fit.IGroupRow => ({
                value: -value / scale,
                gradient: new Map(
                  [...gradient].map(([k, slope]): [number, number] => [
                    k,
                    -slope / scale,
                  ]),
                ),
              }),
            );
            return model(
              state,
              derivatives,
              candidate,
              [...hard, ...native],
              inside,
            );
          };
      } catch (error: unknown) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    const read = (
      state: readonly number[],
      derivatives: boolean,
    ): ReturnType<Fit.GroupTrial> => {
      const prepared = screen(state);
      return typeof prepared === "string" ? prepared : prepared()(derivatives);
    };

    const seal = (
      state: readonly number[],
    ): { admitted: boolean; receipt: ISeal } => {
      try {
        const families = stocks(state);
        const sources = new Map<string, IAutoMovieViewPart>([
          [host, prepared.hostView],
        ]);
        const source = (name: string): IAutoMovieConstructionNode => ({
          type: "source",
          name,
          source: name,
        });
        const children = input.digits.map(
          (digit): IAutoMovieConstructionSplit.IChild => {
            const name: string = digit.family.name;
            sources.set(
              name,
              Fan.view({ ...digit, family: families.get(name)! }),
            );
            return {
              part: source(name),
              partFace: name,
              partEnd: "bottom",
              band: name + ".web",
              rail: digit.rail / 1000,
              // An oblique web loop can fail a polar address around its distal rail. Equal arclength keeps its full loop.
              correspondence: "length",
            };
          },
        );
        // Authored phases are inactive under compose. The declaration still requires a nested placeholder for each seam.
        const phases = (j: number): [number, number] => {
          const half: number = (Math.PI * (j + 1)) / children.length;
          return [-half, half];
        };
        const root: IAutoMovieConstructionSplit = {
          type: "split",
          name,
          host: source(host),
          hostFace: host,
          hostEnd: "top",
          compose: prepared.compose,
          seam: phases(0),
          outer: children
            .slice(2)
            .map((_, i: number) => ({ seam: phases(i + 1) })),
          children: [children[0]!, children[1]!, ...children.slice(2)],
          rows: options.rows,
          count: input.count,
        };
        const realization = realizeAutoMovieConstruction(
          { name, root },
          { sources, chord: options.chord },
        );
        const required: string[] = [
          host,
          ...children.flatMap(({ partFace, band }): string[] => [
            partFace,
            band,
          ]),
        ];
        const used: Set<string> = new Set();
        for (const i of realization.mesh.indices)
          used.add(
            realization.mesh.owners[realization.mesh.coordinates[3 * i]!]!,
          );
        const missing: string[] = required.filter(
          (owner: string): boolean => !used.has(owner),
        );
        const refusal: string | null =
          realization.diagnostics.length > 0
            ? JSON.stringify(realization.diagnostics)
            : missing.length > 0
              ? "terminal fan has no indexed skin for " + missing.join(", ")
              : null;
        return {
          admitted: refusal === null,
          receipt: { refusal, realization },
        };
      } catch (error: unknown) {
        return {
          admitted: false,
          receipt: {
            refusal: error instanceof Error ? error.message : String(error),
            realization: null,
          },
        };
      }
    };
    const starting = screen(restored.values);
    if (typeof starting === "string") return starting;
    const result = Fit.fitGroup(
      restored.values,
      read,
      options.tolerance,
      options.updates,
      options.observe,
      screen,
      {
        transfer: () => null,
        certify: seal,
        initial: starting(),
        finalOnly: options.finalOnly,
      },
      options.convergence,
    );
    return typeof result === "string"
      ? result
      : { result, families: stocks(result.values) };
  }
}
