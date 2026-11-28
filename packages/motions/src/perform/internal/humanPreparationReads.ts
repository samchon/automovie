/* Observe the performer inputs of a native plan's synchronous preparation. */
export namespace humanPreparationReads {
  const observers: WeakMap<object, Observer> = new WeakMap();
  const retained: WeakMap<object, WeakMap<object, Set<string>>> = new WeakMap();

  export function begin(state: object): void {
    retained.set(state, new WeakMap());
  }

  export function end(state: object): void {
    retained.delete(state);
  }

  export function watch(
    state: object,
    observe: Observer,
    prepare: () => void,
  ): void {
    const previous: Observer | undefined = observers.get(state);
    observers.set(state, observe);
    try {
      prepare();
    } finally {
      if (previous === undefined) observers.delete(state);
      else observers.set(state, previous);
    }
  }

  export function performer(state: object, subject: string): void {
    observers.get(state)?.(subject);
  }

  /* A law may keep an anchor's plan after its original placement read. */
  export function retain(
    state: object,
    context: object,
    subject: string,
  ): void {
    const actions: WeakMap<object, Set<string>> | undefined =
      retained.get(state);
    if (actions === undefined) return;
    let subjects: Set<string> | undefined = actions.get(context);
    if (subjects === undefined) {
      subjects = new Set();
      actions.set(context, subjects);
    }
    subjects.add(subject);
  }

  export function anchors(
    state: object,
    context: object,
  ): ReadonlySet<string> | undefined {
    return retained.get(state)?.get(context);
  }
}

type Observer = (subject: string) => void;
