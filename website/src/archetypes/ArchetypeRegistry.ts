import * as archetypes from "@automovie/archetypes";

/** Stable authored IDs whose package owners are namespaces with `.create`. */
const STABLE_PRODUCER_IDS: Readonly<Record<string, string>> = {
  AutoMovieArchetypeCar: "createCar",
  AutoMovieArchetypeBicycle: "createBicycle",
  AutoMovieArchetypeMotorcycle: "createMotorcycle",
  AutoMovieArchetypeBoat: "createBoat",
  AutoMovieArchetypeCamera: "createCamera",
  AutoMovieArchetypeDinghy: "createDinghy",
  AutoMovieArchetypeKayak: "createKayak",
  AutoMovieArchetypePhone: "createPhone",
  AutoMovieArchetypeRemote: "createRemote",
  AutoMovieArchetypeTablet: "createTablet",

  AutoMovieArchetypeCarriage: "createCarriage",
  AutoMovieArchetypeChariot: "createChariot",
  AutoMovieArchetypeHorseCart: "createHorseCart",
  AutoMovieArchetypeLimber: "createLimber",
  AutoMovieArchetypeRickshaw: "createRickshaw",
  AutoMovieArchetypeShoppingTrolley: "createShoppingTrolley",
  AutoMovieArchetypeWagon: "createWagon",
  AutoMovieArchetypeWheelbarrow: "createWheelbarrow",

  AutoMovieArchetypeDiscus: "createDiscus",
  AutoMovieArchetypeHammerThrow: "createHammerThrow",
  AutoMovieArchetypeJavelin: "createJavelin",
  AutoMovieArchetypeOvalBall: "createOvalBall",
  AutoMovieArchetypePuck: "createPuck",
  AutoMovieArchetypeShot: "createShot",
  AutoMovieArchetypeShuttlecock: "createShuttlecock",
  AutoMovieArchetypeSphericalBall: "createSphericalBall",

  AutoMovieArchetypeBeerTap: "createBeerTap",
  AutoMovieArchetypeKerb: "createKerb",
  AutoMovieArchetypeValve: "createValve",
  AutoMovieArchetypeAtm: "createAtm",
  AutoMovieArchetypeBollard: "createBollard",
  AutoMovieArchetypeCrosstie: "createCrosstie",
  AutoMovieArchetypeCrowdBarrier: "createCrowdBarrier",
  AutoMovieArchetypeFireHydrant: "createFireHydrant",
  AutoMovieArchetypeJerseyBarrier: "createJerseyBarrier",
  AutoMovieArchetypeLampPost: "createLampPost",
  AutoMovieArchetypePayStation: "createPayStation",
  AutoMovieArchetypeRopeStanchions: "createRopeStanchions",
  AutoMovieArchetypeSandbag: "createSandbag",
  AutoMovieArchetypeSignPost: "createSignPost",
  AutoMovieArchetypeTrafficCone: "createTrafficCone",
  AutoMovieArchetypeVendingMachine: "createVendingMachine",

  AutoMovieArchetypeBunkBed: "createBunkBed",
  AutoMovieArchetypeCrib: "createCrib",
  AutoMovieArchetypeDrawerUnit: "createDrawerUnit",
  AutoMovieArchetypeGurney: "createGurney",
  AutoMovieArchetypeHingedCabinet: "createHingedCabinet",
  AutoMovieArchetypeHospitalBed: "createHospitalBed",
  AutoMovieArchetypeMattress: "createMattress",
  AutoMovieArchetypePlatformBed: "createPlatformBed",
  AutoMovieArchetypeGolfClub: "createGolfClub",
  AutoMovieArchetypePoloMallet: "createPoloMallet",
};

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
    /** Stable authored producer ID, or its parent ID plus a variant. */
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

  /** Metadata a producer or its owning namespace publishes for dispatch. */
  interface IFactoryMetadata {
    KINDS?: readonly string[];
    FRAMES?: readonly string[];
    FORMATS?: readonly string[];
    REFERENCE?: IFactory["reference"];
    PRODUCERS?: Readonly<Record<string, unknown>>;
    PRODUCER_VARIANTS?: Readonly<Record<string, string>>;
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
      ([id, exports]: [
        string,
        Readonly<Record<string, unknown>>,
      ]): IFamily => ({
        id,
        factories: Object.entries(exports).flatMap(
          ([name, value]: [string, unknown]): IFactory[] => {
            const stableId: string | undefined = STABLE_PRODUCER_IDS[name];
            if (stableId !== undefined && isRecord(value)) {
              const create: unknown = Reflect.get(value, "create");
              if (isFactory(create))
                return [
                  record(
                    stableId,
                    `archetypes.${name}.create`,
                    create,
                  ),
                ];
            }
            return /^create[A-Z]/.test(name) && isFactory(value)
              ? [
                  record(
                    name,
                    `archetypes.ARCHETYPE_FAMILIES.${id}.${name}`,
                    value,
                  ),
                ]
              : [];
          },
        ),
      }),
    );
  }

  /** Resolves a saved producer ID against the installed package and aliases. */
  export function get(id: string): IFactory | undefined {
    const separator: number = id.indexOf(".");
    if (separator !== -1) {
      let found: IFactory | undefined = get(id.slice(0, separator));
      for (const part of id.slice(separator + 1).split(".")) {
        if (found === undefined || !Object.hasOwn(found.producers, part))
          return undefined;
        found = found.producers[part];
      }
      return found;
    }
    const value: unknown = Object.hasOwn(archetypes, id)
      ? (archetypes as Readonly<Record<string, unknown>>)[id]
      : undefined;
    if (isFactory(value)) return record(id, `archetypes.${id}`, value);
    return families()
      .flatMap((family: IFamily) => family.factories)
      .find((factory: IFactory) => factory.id === id);
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

  /** Stable top-level producer IDs available through the installed package. */
  export function rootIds(): string[] {
    const roots: string[] = Object.entries(archetypes)
      .filter(
        ([id, value]: [string, unknown]): boolean =>
          /^create[A-Z]/.test(id) && typeof value === "function",
      )
      .map(([id]: [string, unknown]): string => id);
    for (const family of families())
      for (const factory of family.factories)
        if (!roots.includes(factory.id)) roots.push(factory.id);
    return roots;
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

  /**
   * Resolve a course's displayed expression and matching live constructor.
   *
   * @throws {Error} When the producer has no native vehicle course.
   */
  export function course(id: string): ICourse {
    if (!Object.hasOwn(COURSES, id))
      throw new Error(`"${id}" does not supply a vehicle course.`);
    return COURSES[id]!;
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

  /** Find the namespace metadata by the function used in dispatcher tables. */
  const NAMESPACE_OWNERS: ReadonlyMap<IFactory["call"], string> = new Map(
    Object.keys(STABLE_PRODUCER_IDS).flatMap(
      (name: string): [IFactory["call"], string][] => {
        const owner: unknown = Reflect.get(archetypes, name);
        if (!isRecord(owner)) return [];
        const create: unknown = Reflect.get(owner, "create");
        return isFactory(create) ? [[create, name]] : [];
      },
    ),
  );

  /** Reads exact producer metadata and child factory references. */
  function record(
    id: string,
    expression: string,
    factory: IFactory["call"],
  ): IFactory {
    const owner: string | undefined = NAMESPACE_OWNERS.get(factory);
    const table: string = owner === undefined ? expression : `archetypes.${owner}`;
    const metadata: IFactoryMetadata = factoryMetadata(
      owner === undefined ? factory : Reflect.get(archetypes, owner),
    );
    const variant: IVariant =
      metadata.KINDS !== undefined
        ? { key: "kind", values: metadata.KINDS }
        : metadata.FRAMES !== undefined
          ? { key: "frame", values: metadata.FRAMES }
          : metadata.FORMATS !== undefined
            ? { key: "format", values: metadata.FORMATS }
            : { key: "", values: [] };
    const producers: Record<string, IFactory> = {};
    for (const [name, child] of Object.entries(metadata.PRODUCERS ?? {}))
      if (isFactory(child))
        producers[name] = record(
          `${id}.${name}`,
          `${table}.PRODUCERS[${JSON.stringify(name)}]`,
          child,
        );
    return {
      id,
      expression: owner === undefined ? expression : `${table}.create`,
      call: factory,
      variant,
      ...(metadata.REFERENCE === undefined
        ? {}
        : { reference: metadata.REFERENCE }),
      producers,
      ...(metadata.PRODUCER_VARIANTS === undefined
        ? {}
        : { producerVariants: metadata.PRODUCER_VARIANTS }),
    };
  }

  /** A producer the registry can call. */
  function isFactory(value: unknown): value is IFactory["call"] {
    return typeof value === "function";
  }

  /** Reads recognized metadata safely from a producer or producer namespace. */
  function factoryMetadata(value: unknown): IFactoryMetadata {
    if (
      (typeof value !== "function" && typeof value !== "object") ||
      value === null
    )
      return {};
    const owner: object = value;
    const kinds: unknown = Reflect.get(owner, "KINDS");
    const frames: unknown = Reflect.get(owner, "FRAMES");
    const formats: unknown = Reflect.get(owner, "FORMATS");
    const reference: unknown = Reflect.get(owner, "REFERENCE");
    const producers: unknown = Reflect.get(owner, "PRODUCERS");
    const producerVariants: unknown = Reflect.get(owner, "PRODUCER_VARIANTS");
    return {
      ...(isStringArray(kinds) ? { KINDS: kinds } : {}),
      ...(isStringArray(frames) ? { FRAMES: frames } : {}),
      ...(isStringArray(formats) ? { FORMATS: formats } : {}),
      ...(isReference(reference) ? { REFERENCE: reference } : {}),
      ...(isRecord(producers) ? { PRODUCERS: producers } : {}),
      ...(isStringRecord(producerVariants)
        ? { PRODUCER_VARIANTS: producerVariants }
        : {}),
    };
  }

  /** Whether a value is a non-array object with string-keyed properties. */
  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  /** Whether a value contains only string values. */
  function isStringArray(value: unknown): value is readonly string[] {
    return (
      Array.isArray(value) &&
      value.every((item: unknown) => typeof item === "string")
    );
  }

  /** Whether a value maps string keys to string values. */
  function isStringRecord(
    value: unknown,
  ): value is Readonly<Record<string, string>> {
    return (
      isRecord(value) &&
      Object.values(value).every((item: unknown) => typeof item === "string")
    );
  }

  /** Whether a value can be used as a producer's gallery reference. */
  function isReference(
    value: unknown,
  ): value is NonNullable<IFactory["reference"]> {
    return typeof value === "function" || isRecord(value);
  }
}
