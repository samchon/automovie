import * as archetypes from "@automovie/archetypes";

/** The website's local resolver for the installed archetype package. */
export namespace ArchetypeRegistry {
  /** A model the website can display or place. */
  export type Model = archetypes.AutoMovieArchetype<
    string,
    string,
    archetypes.AutoMovieArchetypeMass.IProperties | null
  >;

  /** A factory and only the metadata website consumers use. */
  export interface IFactory {
    /** Stable package export ID (or parent ID plus variant for a child). */
    id: string;
    /** Source expression used in generated scene code. */
    expression: string;
    /** The actual package function. */
    call: (params: Record<string, unknown>, seed?: number) => Model;
    /** The selector parameter and supported variant IDs. */
    variant: IVariant;
    /** Parameters stated by the package for a gallery reference. */
    reference?: Record<string, unknown> | (() => Record<string, unknown>);
    /** Concrete factories exposed by a dispatcher. */
    producers: Readonly<Record<string, IFactory>>;
    /** Selector translation for legacy dispatcher variants. */
    producerVariants?: Readonly<Record<string, string>>;
  }

  /** A producer's selector. */
  export interface IVariant {
    /** `kind`, `frame`, `format`, or empty for one form. */
    key: string;
    /** Supported values, in package order. */
    values: readonly string[];
  }

  /** One family of actual package factories. */
  export interface IFamily {
    /** Stable group ID. */
    id: string;
    /** Factories in package export order. */
    factories: readonly IFactory[];
  }

  /** Resolves the package's model-producing family table on demand. */
  export function families(): readonly IFamily[] {
    return Object.entries(archetypes.ARCHETYPE_FAMILIES).map(
      ([id, exports]: [string, Readonly<Record<string, unknown>>]): IFamily => ({
        id,
        factories: Object.entries(exports).flatMap(
          ([name, value]: [string, unknown]): IFactory[] =>
            /^create[A-Z]/.test(name) && typeof value === "function"
              ? [
                  record(
                    name,
                    `archetypes.ARCHETYPE_FAMILIES.${id}.${name}`,
                    value,
                  ),
                ]
              : [],
        ),
      }),
    );
  }

  /** Resolves a saved producer ID against the installed root exports. */
  export function get(id: string): IFactory | undefined {
    const separator: number = id.indexOf(".");
    if (separator !== -1) {
      let found: IFactory | undefined = get(id.slice(0, separator));
      for (const part of id.slice(separator + 1).split("."))
        found = found?.producers[part];
      return found;
    }
    const value: unknown = (archetypes as Readonly<Record<string, unknown>>)[id];
    if (typeof value !== "function") return undefined;
    return record(id, `archetypes.${id}`, value);
  }

  /** Every stable root and nested factory ID in the family table. */
  export function factoryIds(): string[] {
    const collect: (factory: IFactory) => string[] = (
      factory: IFactory,
    ): string[] => [
      factory.id,
      ...Object.values(factory.producers).flatMap(collect),
    ];
    return families().flatMap((family: IFamily) =>
      family.factories.flatMap(collect),
    );
  }

  /** Root factory IDs exported by the installed package. */
  export function rootIds(): string[] {
    return Object.entries(archetypes)
      .filter(
        ([id, value]: [string, unknown]): boolean =>
          /^create[A-Z]/.test(id) && typeof value === "function",
      )
      .map(([id]: [string, unknown]): string => id);
  }

  /** Builds through the same lookup used for readiness and gallery rendering. */
  export function build(
    id: string,
    params: Record<string, unknown>,
    seed?: number,
  ): Model {
    const found: IFactory | undefined = get(id);
    if (found === undefined)
      throw new Error(
        `The installed @automovie/archetypes has no producer named ${id}`,
      );
    return found.call(params, seed);
  }

  /** A course's displayed call expression and matching live constructor. */
  export function course(id: string): ICourse | undefined {
    return COURSES[id];
  }

  /** Paired native course dispatch. */
  export interface ICourse {
    /** Expression a scene page shows. */
    expression: string;
    /** The same constructor used by live playback. */
    build: (
      model: object,
      course: archetypes.AutoMovieArchetypeCourse.ICourse,
    ) => archetypes.AutoMovieArchetypeRide.IRide<string, string>;
  }

  /** Each expression sits beside the live implementation it describes. */
  const COURSES: Readonly<Record<string, ICourse>> = {
    createCar: {
      expression: "driveCar",
      build: (model, course) =>
        archetypes.driveCar(
          model as Parameters<typeof archetypes.driveCar>[0],
          course,
        ),
    },
    createBicycle: {
      expression: "rideBicycle",
      build: (model, course) =>
        archetypes.rideBicycle(
          model as Parameters<typeof archetypes.rideBicycle>[0],
          course,
        ),
    },
    createMotorcycle: {
      expression: "rideMotorcycle",
      build: (model, course) =>
        archetypes.rideMotorcycle(
          model as Parameters<typeof archetypes.rideMotorcycle>[0],
          course,
        ),
    },
    createHorse: {
      expression: "rideQuadruped",
      build: (model, course) =>
        archetypes.rideQuadruped(
          model as Parameters<typeof archetypes.rideQuadruped>[0],
          course,
        ),
    },
    createPony: {
      expression: "rideQuadruped",
      build: (model, course) =>
        archetypes.rideQuadruped(
          model as Parameters<typeof archetypes.rideQuadruped>[0],
          course,
        ),
    },
    createCart: {
      expression: "AutoMovieArchetypeRide.along",
      build: (model, course) =>
        archetypes.AutoMovieArchetypeRide.along(
          model as Parameters<
            typeof archetypes.AutoMovieArchetypeRide.along
          >[0],
          course,
        ),
    },
  };

  /** Reads exact producer metadata and child factory references. */
  function record(
    id: string,
    expression: string,
    value: unknown,
  ): IFactory {
    const factory = value as ((
      params: Record<string, unknown>,
      seed?: number,
    ) => Model) & {
      KINDS?: readonly string[];
      FRAMES?: readonly string[];
      FORMATS?: readonly string[];
      REFERENCE?: IFactory["reference"];
      PRODUCERS?: Readonly<Record<string, unknown>>;
      PRODUCER_VARIANTS?: Readonly<Record<string, string>>;
    };
    const variant: IVariant = Array.isArray(factory.KINDS)
      ? { key: "kind", values: factory.KINDS }
      : Array.isArray(factory.FRAMES)
        ? { key: "frame", values: factory.FRAMES }
        : Array.isArray(factory.FORMATS)
          ? { key: "format", values: factory.FORMATS }
          : { key: "", values: [] };
    const producers: Record<string, IFactory> = {};
    for (const [name, child] of Object.entries(factory.PRODUCERS ?? {}))
      if (typeof child === "function")
        producers[name] = record(
          `${id}.${name}`,
          `${expression}.PRODUCERS[${JSON.stringify(name)}]`,
          child,
        );
    return {
      id,
      expression,
      call: factory,
      variant,
      ...(factory.REFERENCE === undefined ? {} : { reference: factory.REFERENCE }),
      producers,
      ...(factory.PRODUCER_VARIANTS === undefined
        ? {}
        : { producerVariants: factory.PRODUCER_VARIANTS }),
    };
  }
}
