import {
  type Archetype,
  type IArchetypeBand,
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
 * Every archetype the package produces, one row per producer and kind, each as a function of the seed: the population the contract tests sweep.
 *
 * A row's name is `<producer>-<kind>`. The door's three axes (kind, hinge side, hardware) are covered pairwise, not multiplied out.
 *
 * @returns The rows.
 */
export function archetypeCatalog(): archetypeCatalog.IRow[] {
  const rows: archetypeCatalog.IRow[] = [];
  // A row is fixed when every band it draws is one value and it has at most one read model to pick.
  const settled = (
    bands: Readonly<Partial<Record<string, IArchetypeBand>>>,
    models?: Readonly<Partial<Record<string, unknown>>>,
  ): boolean =>
    Object.values(bands).every(
      (band: IArchetypeBand | undefined): boolean =>
        band === undefined || band.minimum === band.maximum,
    ) && Object.keys(models ?? {}).length <= 1;
  const add = (
    name: string,
    create: (seed?: number | string) => Archetype,
    fixed?: boolean,
  ): void => {
    rows.push({ name, create, ...(fixed === true ? { fixed } : {}) });
  };
  for (const kind of createDrinkware.KINDS)
    add(
      `drinkware-${kind}`,
      (seed?: number | string): Archetype => createDrinkware({ kind }, seed),
    );
  for (const kind of createDevice.KINDS)
    add(
      `device-${kind}`,
      (seed?: number | string): Archetype => createDevice({ kind }, seed),
    );
  for (const kind of createSmoking.KINDS)
    add(
      `smoking-${kind}`,
      (seed?: number | string): Archetype => createSmoking({ kind }, seed),
    );
  for (const kind of createStationery.KINDS)
    add(
      `stationery-${kind}`,
      (seed?: number | string): Archetype => createStationery({ kind }, seed),
      settled(createStationery.BANDS[kind], createStationery.MODELS[kind]),
    );
  for (const kind of createCareItem.KINDS)
    add(
      `careItem-${kind}`,
      (seed?: number | string): Archetype => createCareItem({ kind }, seed),
    );
  for (const kind of createBag.KINDS)
    add(
      `bag-${kind}`,
      (seed?: number | string): Archetype => createBag({ kind }, seed),
    );
  add("box", (seed?: number | string): Archetype => createBox({}, seed));
  for (const kind of createTool.KINDS)
    add(
      `tool-${kind}`,
      (seed?: number | string): Archetype => createTool({ kind }, seed),
      settled(createTool.BANDS[kind], createTool.MODELS[kind]),
    );
  for (const kind of createLongTool.KINDS)
    add(
      `longTool-${kind}`,
      (seed?: number | string): Archetype => createLongTool({ kind }, seed),
      settled(createLongTool.BANDS[kind], createLongTool.MODELS[kind]),
    );
  for (const kind of createSeat.KINDS)
    add(
      `seat-${kind}`,
      (seed?: number | string): Archetype => createSeat({ kind }, seed),
    );
  for (const kind of createBed.KINDS)
    add(
      `bed-${kind}`,
      (seed?: number | string): Archetype => createBed({ kind }, seed),
    );
  for (const kind of createTable.KINDS)
    add(
      `table-${kind}`,
      (seed?: number | string): Archetype => createTable({ kind }, seed),
    );
  for (const kind of createStorage.KINDS)
    add(
      `storage-${kind}`,
      (seed?: number | string): Archetype => createStorage({ kind }, seed),
    );
  for (const kind of createLoad.KINDS)
    add(
      `load-${kind}`,
      (seed?: number | string): Archetype => createLoad({ kind }, seed),
    );
  add(
    "highChair",
    (seed?: number | string): Archetype => createHighChair({}, seed),
  );
  add(
    "lectern",
    (seed?: number | string): Archetype => createLectern({}, seed),
  );
  add(
    "console",
    (seed?: number | string): Archetype => createConsole({}, seed),
  );
  add(
    "showcase",
    (seed?: number | string): Archetype => createShowcase({}, seed),
  );
  for (const hinge of ["left", "right"] as const)
    add(
      `safe-${hinge}`,
      (seed?: number | string): Archetype => createSafe({ hinge }, seed),
      true,
    );
  for (const kind of createBarrel.KINDS)
    add(
      `barrel-${kind}`,
      (seed?: number | string): Archetype => createBarrel({ kind }, seed),
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

    /** The archetype for a seed; the middle of every band when the seed is absent. */
    create(seed?: number | string): Archetype;

    /** True when every band of the row's variant has zero width, as a standardised munition's read single figures do, so no seed varies it. */
    fixed?: boolean;
  }

  /** Adds one row: its name, its archetype for a seed, and whether no seed varies it. */
  export type Add = (
    name: string,
    create: (seed?: number | string) => Archetype,
    fixed?: boolean,
  ) => void;

  /** Whether a variant's bands are each one value and it has at most one read model to pick. */
  export type Settled = (
    bands: Readonly<Partial<Record<string, IArchetypeBand>>>,
    models?: Readonly<Partial<Record<string, unknown>>>,
  ) => boolean;
}
