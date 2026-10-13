

/** Encode authored XML and drawing strings as UTF-8 input bytes. */
export const utf8 = (text: string): Uint8Array => Buffer.from(text, "utf8");
