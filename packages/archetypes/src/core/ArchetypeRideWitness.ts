import type { AutoMovieArchetypeCourse } from "./AutoMovieArchetypeCourse";
import type { AutoMovieArchetypeRide } from "./AutoMovieArchetypeRide";

/** Internal native ride authentication and one same-time geometry handoff. */
export namespace ArchetypeRideWitness {
  /**
   * Read fresh current output using an owning operation's exact geometry
   * witness.
   */
  export type Reader<Id extends string, D extends string> = (
    second: number,
    witness: Witness,
  ) => AutoMovieArchetypeRide.ISample<Id, D>;

  /** One authored source and its original public observation descriptors. */
  interface Binding {
    readonly reader: Reader<string, string>;
    readonly original: () => boolean;
  }

  /** The const-data method of a registered object. Accessors are not sampled. */
  function own(object: object, key: string): unknown {
    return Object.getOwnPropertyDescriptor(object, key)?.value;
  }

  /** Bounded native capabilities, with no dynamic geometry or time results. */
  const readers: WeakMap<object, Binding> = new WeakMap();

  /** The private writers of genuinely prepared quadruped geometry. */
  const writers: WeakMap<object, IWriter> = new WeakMap();

  interface IWriter {
    readonly plan: AutoMovieArchetypeCourse.IPlan;
    readonly at: AutoMovieArchetypeCourse.IPlan["at"];
    readonly when: AutoMovieArchetypeCourse.IPlan["when"];
    readonly reader: Reader<string, string>;
  }

  /** Recognize a writer created by the quadruped producer. */
  export function authorize<Id extends string, D extends string>(
    writer: object,
    plan: AutoMovieArchetypeCourse.IPlan,
    reader: Reader<Id, D>,
  ): void {
    writers.set(writer, {
      plan,
      at: plan.at,
      when: plan.when,
      reader: reader as Reader<string, string>,
    });
  }

  /** Bind the core-constructed ride to its original native writer and plan. */
  export function constructed<Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    writer: object,
  ): void {
    const native: IWriter | undefined = writers.get(writer);
    if (native === undefined) return;
    const { plan, at, frame } = ride;
    const samePlan = (): boolean =>
      plan === native.plan &&
      own(plan, "at") === native.at &&
      own(plan, "when") === native.when;
    if (!samePlan()) return;
    readers.set(ride, {
      reader: native.reader,
      original: (): boolean =>
        own(ride, "plan") === plan &&
        own(ride, "at") === at &&
        own(ride, "frame") === frame &&
        samePlan(),
    });
  }

  /** Recover the original native reader, declining changed and opaque sources. */
  export function of<Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
  ): Reader<Id, D> | undefined {
    const entry: Binding | undefined = readers.get(ride);
    return entry?.original() ? (entry.reader as Reader<Id, D>) : undefined;
  }

  interface IGeometry {
    readonly owner: object;
    readonly inputs: readonly number[];
    readonly value: unknown;
  }

  /**
   * Open role-separated witnesses for contiguous reads at one exact solver
   * time.
   */
  export function stages<Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
  ): (second: number) => IProbes | undefined {
    if (of(ride) === undefined) return () => undefined;
    let previous: number | undefined;
    let probes: IProbes | undefined;
    return (second: number): IProbes | undefined => {
      if (!Object.is(previous, second)) {
        previous = second;
        probes = {
          ahead: new Witness(true),
          behind: new Witness(true),
          centre: new Witness(true),
        };
      }
      return probes;
    };
  }

  interface IProbes {
    readonly ahead: Witness;
    readonly behind: Witness;
    readonly centre: Witness;
  }

  /**
   * One private successful geometry result for one producer in a synchronous
   * operation.
   */
  export class Witness {
    /** The current one-use geometry, following its successful admission. */
    #entry?: IGeometry;

    /** Whether this pose serves only a synchronous differential hitch demand. */
    public readonly ode: boolean;

    /** Create one operation witness with its caller's demand. */
    public constructor(ode: boolean = false) {
      this.ode = ode;
    }

    /**
     * Use exactly the same admitted geometry or run its unchanged private
     * solve.
     */
    geometry<T>(owner: object, inputs: readonly number[], solve: () => T): T {
      const old = this.#entry;
      if (
        old?.owner === owner &&
        old.inputs.length === inputs.length &&
        inputs.every((value: number, i: number): boolean =>
          Object.is(value, old.inputs[i]),
        )
      )
        return old.value as T;
      const value: T = solve();
      this.#entry = { owner, inputs, value };
      return value;
    }
  }
}
