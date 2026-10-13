

/** Transform an authored PDF input without changing its byte-to-character Latin-1 identity. */
export const latin1 = (
  bytes: Uint8Array,
  edit: (text: string) => string,
): Uint8Array =>
  Buffer.from(edit(Buffer.from(bytes).toString("latin1")), "latin1");
