import { Singleton } from "tstl";

/** What one production gave: its value, or the error it threw. */
type Outcome<Value> = { success: true; value: Value } | { success: false; error: unknown };

/**
 * A keyed once-only cache of test producers, one `tstl` `Singleton` per key:
 * each generated person, skin or curve set is produced once per process and
 * shared by every test and observer that asks for the same key.
 *
 * A `Singleton` runs its closure again when the closure throws, since it
 * keeps no value then. A failed generation is as immutable an outcome as a
 * successful one, and rerunning it would cost a whole generation per
 * consumer, so each singleton's closure returns the outcome record instead
 * of throwing; `read` rethrows the original error object to every consumer.
 * The producer passed on a key's first `read` is the one that runs; later
 * producers for that key are ignored, as the key names one immutable input.
 */
export class HumanOnce<Value> {
  /** One singleton per key, each holding the outcome of its first producer. */
  private readonly singletons: Map<string, Singleton<Outcome<Value>>> = new Map();

  /**
   * Evaluate a synchronous producer once per key.
   *
   * @param key The immutable input identity, such as a person's alias.
   * @param producer Produces the value on the key's first read only.
   * @returns The value of the key's one production.
   * @throws The error the key's one production threw, the same object every time.
   */
  public read(key: string, producer: () => Value): Value {
    let singleton: Singleton<Outcome<Value>> | undefined = this.singletons.get(key);
    if (singleton === undefined) {
      singleton = new Singleton((): Outcome<Value> => {
        try {
          return { success: true, value: producer() };
        } catch (error) {
          return { success: false, error };
        }
      });
      this.singletons.set(key, singleton);
    }

    const outcome: Outcome<Value> = singleton.get();
    if (outcome.success) return outcome.value;
    throw outcome.error;
  }
}
