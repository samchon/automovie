/** Private identities of the default clinical tables, recorded before exposure. */
export namespace BendClinicalNodes {
  /** The engine's allocated chart nodes. */
  const NODES: WeakSet<object> = new WeakSet();

  /** Record the identities of one freshly allocated built-in clinical table. */
  export function record(value: unknown): void {
    if (typeof value !== "object" || value === null || NODES.has(value)) return;
    NODES.add(value);
    for (const child of Object.values(value)) record(child);
  }

  /** Identify a node from an original engine chart by identity alone. */
  export function owns(value: unknown): value is object {
    return typeof value === "object" && value !== null && NODES.has(value);
  }
}
