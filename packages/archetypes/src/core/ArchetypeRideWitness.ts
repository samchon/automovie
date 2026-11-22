import type { AutoMovieArchetypeCourse } from "./AutoMovieArchetypeCourse";
import type { AutoMovieArchetypeRide } from "./AutoMovieArchetypeRide";

/**
 * Internal native ride authentication and one same-time geometry handoff.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the native producer identity and private exact-input geometry handoff.
 * @evidence contracts/development/design.md#principled-representation An actual registered ride guards its original observation descriptors. A local witness pairs exact scalar inputs with private geometry from the same producer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the native quadruped producer and tow consumer use this module.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The weak registry contains only reader provenance. Geometry can live only in a current operation witness.
 */
export namespace ArchetypeRideWitness {
  /**
   * Read fresh current output using an owning operation's exact geometry witness.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the seconds input, owning witness and original typed ride output.
   * @evidence contracts/development/design.md#principled-representation The reader binds an actual native producer and keeps its affordance and dimension types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the private tow consumer can obtain this reader from the live native binding.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The same solver admission and fresh public output still apply.
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

  /** The actual const-data method of a registered object. Accessors are not sampled. */
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

  /**
   * Recognize a writer created by the actual quadruped producer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the bounded writer identity.
   * @evidence contracts/development/implementation.md#principled-implementation The private writer is registered before the core constructs its ride.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One insertion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The entry carries no observation.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) registration.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Core admission can recognize the unchanged genuine writer before inspecting any plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One weak identity.
   */
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

  /**
   * Bind the actual core-constructed ride to its original native writer and plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the writer and plan identity needed for binding.
   * @evidence contracts/development/implementation.md#principled-implementation The core binds only its actual output, after matching the producer's plan and prespecified method identities.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate the private authorization, then record one current check for the native reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An intercepted constructor cannot substitute a plan or method for the authorized native input.
   * @evidence contracts/development/implementation.md#efficient-algorithms One constant-time lookup and insertion.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A successful binding permits the same producer to share exact current geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak entries carry only capability and provenance for the life of the writer or ride.
   */
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

  /**
   * Recover the original native reader, declining changed and opaque sources.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes owner validation and the undecided return.
   * @evidence contracts/development/implementation.md#principled-implementation Lookup precedes descriptor checks so unregistered objects receive no new reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one bound original-method check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No mutable method or accessors validate an old binding.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(1) provenance and descriptor checks.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The exact registered object supplies its matching typed reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The lookup keeps no observation.
   */
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
   * Open role-separated witnesses for contiguous reads at one exact solver time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains the ahead, behind and centre roles and strict time boundary.
   * @evidence contracts/development/implementation.md#principled-implementation Only genuine native inputs can open a scope, and a new binary64 time replaces all three roles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three named roles and one exact time check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No retained slope, advanced state, approximate time or opaque observer enters the scope.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and space per solver stage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exactly repeated times retain the same three witnesses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The enclosing synchronous integration owns the last three roles.
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
   * One private successful geometry result for one producer in a synchronous operation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact dependencies, opaque successful geometry and scope.
   * @evidence contracts/development/design.md#principled-representation The producer identity brings its own private input schema and output type. Object.is preserves exact binary64 and signed zeros.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One current record is overwritten at a different demand; no timeline is indexed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No public model, time series, authored reader result, guessed period or unproved frame is kept.
   */
  export class Witness {
    /** The current one-use geometry, following its actual successful admission. */
    #entry?: IGeometry;

    /** Whether this pose serves only a synchronous differential hitch demand. */
    public readonly ode: boolean;

    /** Create one operation witness with its actual caller's demand. */
    public constructor(ode: boolean = false) {
      this.ode = ode;
    }

    /**
     * Use exactly the same admitted geometry or run its unchanged private solve.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the exact equality and unchanged solve alternatives.
     * @evidence contracts/development/implementation.md#principled-implementation Only the same producer with all Object.is-equal inputs can receive previously admitted geometry.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Compare one prior witness, else run and record the native solve.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No failed admission, public model or approximate equality can seed the witness.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(N) comparisons for N inputs; the original solve runs on a miss.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work An equality hit uses the exact prior numerical solve for this demand.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One successful geometry and its exact inputs live only with the operation.
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
