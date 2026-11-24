import {
  type AutoMovieArchetype,
  type IAutoMovieArchetypeBand,
  createBag,
  createBarrel,
  createBed,
  createBox,
  createCareItem,
  createConsole,
  createDevice,
  createDrinkware,
  createHighChair,
  createLectern,
  createLoad,
  createLongTool,
  createSafe,
  createSeat,
  createShowcase,
  createSmoking,
  createStationery,
  createStorage,
  createTable,
  createTool,
} from "@automovie/archetypes";

import { archetypeCatalogBuilt } from "./archetypeCatalogBuilt";
import { archetypeCatalogCarried } from "./archetypeCatalogCarried";
import { archetypeCatalogEveryday } from "./archetypeCatalogEveryday";

/**
 * Every archetype the package produces, one row per producer and kind, each as
 * a function of the seed: the population the contract tests sweep.
 *
 * A row's name is `<producer>-<kind>`. The door's three axes (kind, hinge side,
 * hardware) are covered pairwise, not multiplied out.
 *
 * @returns The rows.
 */
export function archetypeCatalog(): archetypeCatalog.IRow[] {
  const rows: archetypeCatalog.IRow[] = [];
  // A row is fixed when every band it draws is one value and it has at most one read model to pick.
  const settled = (
    bands: Readonly<Partial<Record<string, IAutoMovieArchetypeBand>>>,
    models?: Readonly<Partial<Record<string, unknown>>>,
  ): boolean =>
    Object.values(bands).every(
      (band: IAutoMovieArchetypeBand | undefined): boolean =>
        band === undefined || band.minimum === band.maximum,
    ) && Object.keys(models ?? {}).length <= 1;
  const add = (
    name: string,
    create: (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ) => AutoMovieArchetype,
    fixed?: boolean,
  ): void => {
    rows.push({ name, create, ...(fixed === true ? { fixed } : {}) });
  };
  for (const kind of createDrinkware.KINDS)
    add(
      `drinkware-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createDrinkware({ kind, ...dimensions }, seed),
    );
  for (const kind of createDevice.KINDS)
    add(
      `device-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createDevice({ kind, ...dimensions }, seed),
    );
  for (const kind of createSmoking.KINDS)
    add(
      `smoking-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createSmoking({ kind, ...dimensions }, seed),
    );
  for (const kind of createStationery.KINDS)
    add(
      `stationery-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createStationery({ kind, ...dimensions }, seed),
      settled(createStationery.BANDS[kind], createStationery.MODELS[kind]),
    );
  for (const kind of createCareItem.KINDS)
    add(
      `careItem-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createCareItem({ kind, ...dimensions }, seed),
    );
  for (const kind of createBag.KINDS)
    add(
      `bag-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBag({ kind, ...dimensions }, seed),
    );
  add(
    "box",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createBox({ ...dimensions }, seed),
  );
  for (const kind of createTool.KINDS)
    add(
      `tool-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createTool({ kind, ...dimensions }, seed),
      settled(createTool.BANDS[kind], createTool.MODELS[kind]),
    );
  for (const kind of createLongTool.KINDS)
    add(
      `longTool-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createLongTool({ kind, ...dimensions }, seed),
      settled(createLongTool.BANDS[kind], createLongTool.MODELS[kind]),
    );
  for (const kind of createSeat.KINDS)
    add(
      `seat-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createSeat({ kind, ...dimensions }, seed),
    );
  for (const kind of createBed.KINDS)
    add(
      `bed-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBed({ kind, ...dimensions }, seed),
    );
  for (const kind of createTable.KINDS)
    add(
      `table-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createTable({ kind, ...dimensions }, seed),
    );
  for (const kind of createStorage.KINDS)
    add(
      `storage-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createStorage({ kind, ...dimensions }, seed),
    );
  for (const kind of createLoad.KINDS)
    add(
      `load-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createLoad({ kind, ...dimensions }, seed),
    );
  add(
    "highChair",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createHighChair({ ...dimensions }, seed),
  );
  add(
    "lectern",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createLectern({ ...dimensions }, seed),
  );
  add(
    "console",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createConsole({ ...dimensions }, seed),
  );
  add(
    "showcase",
    (
      seed?: number,
      dimensions?: archetypeCatalog.Dimensions,
    ): AutoMovieArchetype => createShowcase({ ...dimensions }, seed),
  );
  for (const hinge of ["left", "right"] as const)
    add(
      `safe-${hinge}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createSafe({ hinge, ...dimensions }, seed),
      true,
    );
  for (const kind of createBarrel.KINDS)
    add(
      `barrel-${kind}`,
      (
        seed?: number,
        dimensions?: archetypeCatalog.Dimensions,
      ): AutoMovieArchetype => createBarrel({ kind, ...dimensions }, seed),
    );

  archetypeCatalogBuilt(add);
  archetypeCatalogCarried(add, settled);
  archetypeCatalogEveryday(add, settled);
  return rows;
}

/** Companion type of {@link archetypeCatalog}. */
export namespace archetypeCatalog {
  /** One archetype of the catalog. */
  export interface IRow {
    /** `<producer>-<kind>`. */
    name: string;

    /**
     * The archetype for a seed; the middle of every band when the seed is
     * absent.
     *
     * @param seed The seed, or absent for every band's middle.
     * @param dimensions Dimensions to fix, each in its band's unit, forwarded
     *   into the producer's params beside the row's own. A producer whose
     *   params do not accept a dimension draws it as usual, so a caller reads
     *   the built archetype's `dimensions` to learn whether a value took.
     * @returns The archetype.
     */
    create(seed?: number, dimensions?: Dimensions): AutoMovieArchetype;

    /**
     * True when every band of the row's variant has zero width, as a
     * standardised munition's read single figures do, so no seed varies it.
     */
    fixed?: boolean;
  }

  /**
   * Dimension values a caller fixes on a row, by dimension name, each in its
   * band's unit.
   */
  export type Dimensions = Readonly<Record<string, number>>;

  /**
   * Adds one row: its name, its archetype for a seed and fixed dimensions, and
   * whether no seed varies it.
   */
  export type Add = (
    name: string,
    create: (seed?: number, dimensions?: Dimensions) => AutoMovieArchetype,
    fixed?: boolean,
  ) => void;

  /**
   * Whether a variant's bands are each one value and it has at most one read
   * model to pick.
   */
  export type Settled = (
    bands: Readonly<Partial<Record<string, IAutoMovieArchetypeBand>>>,
    models?: Readonly<Partial<Record<string, unknown>>>,
  ) => boolean;
}
