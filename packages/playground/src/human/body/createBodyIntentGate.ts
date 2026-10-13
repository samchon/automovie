/**
 * Reserve body editor intent in the order the user acts, before a preset or
 * file read can wait. The panel owns the draft, transactional editor, and
 * viewport; this gate only decides whether an asynchronous result may enter
 * that state. Every edit, undo, reset, and load reserves a new ticket so both
 * a late success and a late failure leave a newer intent alone.
 */
export const createBodyIntentGate = (): {
  reserve: () => number;
  isCurrent: (ticket: number) => boolean;
  currentTicket: () => number;
} => {
  let revision = 0;
  return {
    reserve: () => ++revision,
    isCurrent: (ticket) => ticket === revision,
    currentTicket: () => revision,
  };
};
