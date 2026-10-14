/**
 * Reserve body editor intent in the order the user acts, before a preset or file read can wait. The panel owns the draft, transactional editor, and viewport; this gate only decides whether an asynchronous result may enter that state. Every edit, undo, reset, and load reserves a new ticket so both a late success and a late failure leave a newer intent alone. Ticket zero names the initial state. Reserving beyond Number.MAX_SAFE_INTEGER throws before changing the gate, so distinct supported intents never collapse to the same floating-point ticket.
 *
 * @evidence contracts/common.md#principled-implementation A monotonic safe-integer generation represents user action order, and equality against the current generation gates both late success and late refusal independently of asynchronous completion order.
 * @evidence contracts/common.md#clear-and-simple-design The gate owns only intent identity; document drafts, history, worker cancellation and viewport publication remain panel responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No timer or shape-equality heuristic substitutes for edit ordering, and precision exhaustion refuses rather than repeating a ticket under an overflowed counter.
 * @evidence contracts/common.md#meaningful-documentation The comment states pre-await reservation, separate panel state ownership, initial ticket zero and exhaustion before mutation.
 * @evidence contracts/performance.md#efficient-algorithms Reservation and validity checks each perform constant scalar work with one retained numeric generation and no per-intent allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each reservation represents a distinct authored effect, so equal-looking edits do not share a ticket or numerical result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One scalar generation is retained for the gate's lifetime without a history of tickets, native handles or running tasks.
 */
export function createBodyIntentGate(): {
  /** Reserve a newer safe-integer ticket; throws on exhaustion without changing the current ticket. */
  reserve: () => number;

  /** Whether the supplied ticket still names the latest user intent. */
  isCurrent: (ticket: number) => boolean;

  /** Observe the current ticket without reserving a new intent. */
  currentTicket: () => number;
} {
  let revision: number = 0;
  return {
    reserve: (): number => {
      if (revision === Number.MAX_SAFE_INTEGER)
        throw new Error("Body editor intent identities are exhausted.");
      return ++revision;
    },
    isCurrent: (ticket: number): boolean => ticket === revision,
    currentTicket: (): number => revision,
  };
}
