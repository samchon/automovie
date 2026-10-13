/**
 * Hold compile withdrawal while viewer candidates load their modules.
 *
 * A candidate page and its worker request their human modules over seconds;
 * a compile withdrawn in between gave one candidate modules of two compiles,
 * and restarting such a candidate could repeat for as long as edits kept
 * arriving. While any hold is open, a withdrawal is recorded instead of
 * applied, so every module a loading candidate asks for comes from the
 * compile it started on; the last hold's release applies the recorded
 * withdrawal at once, and the next candidate loads the next compile.
 */
export function createHumanViewerCompileGate() {
  let holds = 0;
  let recorded: (() => void) | null = null;
  return {
    /** Open a hold. */
    hold: (): void => {
      ++holds;
    },

    /** Close a hold; the last one applies a recorded withdrawal. */
    release: (): void => {
      if (holds === 0) return;
      --holds;
      if (holds !== 0 || recorded === null) return;
      const withdraw = recorded;
      recorded = null;
      withdraw();
    },

    /** Withdraw the compile now, or record the withdrawal while a hold is open. */
    withdraw: (reset: () => void): void => {
      if (holds === 0) reset();
      else recorded = reset;
    },
  };
}
