import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  type IAutoMovieArchetypeBand,
} from "@automovie/archetypes";
import {
  autoMovieModelPartMatrices,
  measureAutoMovieModelContacts,
  realizeAutoMovieGeometry,
  validateModel,
} from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMesh,
  IAutoMovieModelContact,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";

import type { archetypeCatalog } from "./archetypeCatalog";

/**
 * Drive every band of one catalog row to both of its ends and report each end
 * that is not settable, broken, coupled or inert.
 *
 * The row is built once at its seedless middle. Every band in the middle's
 * `provenance.bands` whose `minimum` lies below its `maximum` is then driven
 * alone: the row is built with that one dimension fixed at `minimum`, then at
 * `maximum`, every other dimension left at its middle. Each end is judged
 * against the middle, in this order:
 *
 * - Coupled: the producer refuses the end with an `AutoMovieArchetypeRefusal` on
 *   another dimension's axis, a limit that dimension places on this one;
 *   reported with that axis and its feasible set, and not counted as broken;
 * - Broken: the producer throws anything else at the end;
 * - Not settable: the built end's `dimensions` value is not exactly the requested
 *   end, because the producer's params do not accept the dimension; such an end
 *   is a seedless middle draw, so nothing else is checked on it;
 * - Broken: `validateModel` fails, a part has no triangle of positive area, or a
 *   part detached: a pair that is `crossing`, `contained` or `touching` at the
 *   middle by `measureAutoMovieModelContacts` with a contact distance of
 *   {@link archetypeBandEnds.CONTACT} is `apart` at the end, and its two parts
 *   no longer reach each other through the pairs still joined there;
 * - Inert: the band's unit describes rest geometry (`m`, `degrees`, or empty for
 *   a ratio or a count) and every placed vertex of every part at the end lies
 *   within {@link archetypeBandEnds.INERT} of its position at the middle, with
 *   the same parts and vertex counts.
 *
 * A pair is measured at an end as a two-part model of the end's two parts with
 * their own transforms, which the part placement reads one part at a time, so
 * the end costs one contact pair per pair joined at the middle. A pair whose
 * part the end no longer has, as a count band removes parts, is not measured. A
 * pair that parts while both of its parts stay joined to the form through other
 * pairs is no detachment: a coarse form's primitives cross where they merely
 * overlap, as a car's rear backrest overlaps its road wheels, and such a
 * crossing may end inside a band while the backrest stays on its cushion. Bands
 * in `kg`, `N`, `m/s` and `s` describe no rest geometry and are never inert.
 *
 * @param row The catalog row; its `create` takes the seed and the dimensions to
 *   fix.
 * @returns Every finding, in band order, minimum before maximum.
 */
export function archetypeBandEnds(
  row: Pick<archetypeCatalog.IRow, "name" | "create">,
): archetypeBandEnds.IFinding[] {
  const middle: AutoMovieArchetype = row.create();
  const joined: IAutoMovieModelContact[] = measureAutoMovieModelContacts(
    middle,
    { contact: archetypeBandEnds.CONTACT },
  ).filter(
    (contact: IAutoMovieModelContact): boolean => contact.relation !== "apart",
  );
  const rest: Map<string, IAutoMovieMesh> = placedMeshes(middle);
  const findings: archetypeBandEnds.IFinding[] = [];
  const bands: [string, IAutoMovieArchetypeBand | undefined][] = Object.entries(
    middle.provenance.bands,
  );
  for (const [dimension, band] of bands) {
    if (band === undefined || !(band.minimum < band.maximum)) continue;
    for (const end of ["minimum", "maximum"] as const) {
      const report: (kind: archetypeBandEnds.Kind, detail: string) => void = (
        kind: archetypeBandEnds.Kind,
        detail: string,
      ): void => {
        findings.push({ row: row.name, dimension, end, kind, detail });
      };
      const value: number = band[end];
      let built: AutoMovieArchetype;
      try {
        built = row.create(undefined, { [dimension]: value });
      } catch (error) {
        if (
          error instanceof AutoMovieArchetypeRefusal &&
          error.axis !== dimension
        )
          report(
            "coupled",
            `refused on ${error.axis}, feasible ${
              error.feasible === null
                ? "none"
                : AutoMovieArchetypeRefusal.describe(error.feasible)
            }`,
          );
        else
          report(
            "broken",
            `throws ${error instanceof Error ? error.message : String(error)}`,
          );
        continue;
      }
      if (built.dimensions[dimension] !== value) {
        report(
          "not settable",
          `asked ${value}, built ${String(built.dimensions[dimension])}`,
        );
        continue;
      }
      const validation: IAutoMovieValidation = validateModel({ model: built });
      if (!validation.success) {
        report(
          "broken",
          `invalid: ${validation.violations
            .slice(0, 3)
            .map(
              (v: IAutoMovieConstraintViolation): string =>
                `${v.path} ${v.expected}`,
            )
            .join("; ")}`,
        );
        continue;
      }
      const placed: Map<string, IAutoMovieMesh> = placedMeshes(built);
      const flat: string[] = [...placed]
        .filter(([, mesh]: [string, IAutoMovieMesh]): boolean => !hasArea(mesh))
        .map(([id]: [string, IAutoMovieMesh]): string => id);
      if (flat.length !== 0)
        report("broken", `no triangle of positive area: ${flat.join(", ")}`);
      for (const [pair, gap] of detached(built, joined))
        report(
          "broken",
          `${pair.part} detached from ${pair.other}: ${pair.relation} at the middle, gap ${gap} m`,
        );
      if (GEOMETRIC.has(band.unit) && same(rest, placed))
        report("inert", "no placed vertex moved");
    }
  }
  return findings;
}

/** Constants and records of {@link archetypeBandEnds}. */
export namespace archetypeBandEnds {
  /**
   * The contact distance, metres: two parts at most this far apart touch, as
   * #4071 sets it.
   */
  export const CONTACT: number = 1e-6;

  /**
   * The distance, metres, within which a vertex at a band's end has not moved
   * from the middle.
   */
  export const INERT: number = 1e-9;

  /** What is wrong with one band end. */
  export type Kind = "not settable" | "broken" | "coupled" | "inert";

  /** One band end that is not a working, responsive form. */
  export interface IFinding {
    /** The catalog row, `<producer>-<kind>`. */
    row: string;

    /** The dimension driven to its end. */
    dimension: string;

    /** Which end of its band. */
    end: "minimum" | "maximum";

    /** The finding. */
    kind: Kind;

    /**
     * What was measured: the refusal, the exception, the detached pair or the
     * value that did not take.
     */
    detail: string;
  }
}

/**
 * The pairs joined at the middle that a built end detached, each with its gap
 * at the end: apart there, and with its two parts in different groups of the
 * parts the end's still joined pairs connect.
 */
const detached: (
  built: AutoMovieArchetype,
  joined: readonly IAutoMovieModelContact[],
) => [IAutoMovieModelContact, number][] = (
  built: AutoMovieArchetype,
  joined: readonly IAutoMovieModelContact[],
): [IAutoMovieModelContact, number][] => {
  const parts: Map<string, IAutoMovieModelPart> = new Map(
    built.parts.map(
      (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
        part.id,
        part,
      ],
    ),
  );

  // Union-find over part ids: each id points at another of its group, a root at itself or nothing.
  const group: Map<string, string> = new Map();
  const root: (id: string) => string = (id: string): string => {
    let at: string = id;
    while (group.has(at) && group.get(at) !== at) at = group.get(at)!;
    return at;
  };
  const apart: [IAutoMovieModelContact, number][] = [];
  for (const pair of joined) {
    const part: IAutoMovieModelPart | undefined = parts.get(pair.part);
    const other: IAutoMovieModelPart | undefined = parts.get(pair.other);
    if (part === undefined || other === undefined) continue;
    const contact: IAutoMovieModelContact = measureAutoMovieModelContacts(
      { ...built, parts: [part, other] },
      { contact: archetypeBandEnds.CONTACT },
    )[0]!;
    if (contact.relation === "apart") apart.push([pair, contact.gap]);
    else {
      const a: string = root(pair.part);
      const b: string = root(pair.other);
      if (a !== b) group.set(a, b);
    }
  }
  return apart.filter(
    ([pair]: [IAutoMovieModelContact, number]): boolean =>
      root(pair.part) !== root(pair.other),
  );
};

/**
 * The band units that describe rest geometry: lengths, angles, and ratios or
 * counts.
 */
const GEOMETRIC: ReadonlySet<string> = new Set(["m", "degrees", ""]);

/**
 * Every part's realized mesh carried into the model frame, by part id, as model
 * crossings and contacts place it: through the part's column-major matrix from
 * `autoMovieModelPartMatrices`, or in its own coordinates when it has none.
 */
const placedMeshes: (
  model: AutoMovieArchetype,
) => Map<string, IAutoMovieMesh> = (
  model: AutoMovieArchetype,
): Map<string, IAutoMovieMesh> => {
  const matrices: Map<IAutoMovieModelPart, number[] | null> =
    autoMovieModelPartMatrices(model);
  const placed: Map<string, IAutoMovieMesh> = new Map();
  for (const part of model.parts) {
    const mesh: IAutoMovieMesh = realizeAutoMovieGeometry(part.geometry).mesh;
    const m: number[] | null = matrices.get(part) ?? null;
    if (m === null) {
      placed.set(part.id, mesh);
      continue;
    }
    const local: number[] = mesh.positions;
    const positions: number[] = new Array<number>(local.length);
    for (let at: number = 0; at < local.length; at += 3) {
      const x: number = local[at]!;
      const y: number = local[at + 1]!;
      const z: number = local[at + 2]!;
      positions[at] = m[0]! * x + m[4]! * y + m[8]! * z + m[12]!;
      positions[at + 1] = m[1]! * x + m[5]! * y + m[9]! * z + m[13]!;
      positions[at + 2] = m[2]! * x + m[6]! * y + m[10]! * z + m[14]!;
    }
    placed.set(part.id, { ...mesh, positions });
  }
  return placed;
};

/**
 * Whether a placed mesh has at least one triangle of positive area; a mesh
 * without indices is read as consecutive triangles.
 */
const hasArea: (mesh: IAutoMovieMesh) => boolean = (
  mesh: IAutoMovieMesh,
): boolean => {
  const p: number[] = mesh.positions;
  const indices: number[] =
    mesh.indices ??
    Array.from(
      { length: p.length / 3 },
      (_: unknown, index: number): number => index,
    );
  for (let at: number = 0; at + 2 < indices.length; at += 3) {
    const a: number = indices[at]! * 3;
    const b: number = indices[at + 1]! * 3;
    const c: number = indices[at + 2]! * 3;
    const u: number[] = [
      p[b]! - p[a]!,
      p[b + 1]! - p[a + 1]!,
      p[b + 2]! - p[a + 2]!,
    ];
    const v: number[] = [
      p[c]! - p[a]!,
      p[c + 1]! - p[a + 1]!,
      p[c + 2]! - p[a + 2]!,
    ];
    if (
      Math.hypot(
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      ) > 0
    )
      return true;
  }
  return false;
};

/**
 * Whether two placements have the same parts in the same order, the same vertex
 * counts, and every vertex within {@link archetypeBandEnds.INERT} of its
 * counterpart.
 */
const same: (
  rest: ReadonlyMap<string, IAutoMovieMesh>,
  end: ReadonlyMap<string, IAutoMovieMesh>,
) => boolean = (
  rest: ReadonlyMap<string, IAutoMovieMesh>,
  end: ReadonlyMap<string, IAutoMovieMesh>,
): boolean => {
  if (rest.size !== end.size) return false;
  const ids: string[] = [...end.keys()];
  let order: number = 0;
  for (const [id, mesh] of rest) {
    if (ids[order++] !== id) return false;
    const before: number[] = mesh.positions;
    const after: number[] = end.get(id)!.positions;
    if (after.length !== before.length) return false;
    for (let at: number = 0; at < before.length; at += 3)
      if (
        Math.hypot(
          after[at]! - before[at]!,
          after[at + 1]! - before[at + 1]!,
          after[at + 2]! - before[at + 2]!,
        ) > archetypeBandEnds.INERT
      )
        return false;
  }
  return true;
};
