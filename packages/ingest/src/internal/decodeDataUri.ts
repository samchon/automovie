/**
 * Decode an RFC 2397 data URI into exact payload octets.
 *
 * Canonical base64 spelling includes zero unused padding bits under RFC 4648
 * section 3.5 (https://www.rfc-editor.org/rfc/rfc4648.html#section-3.5);
 * complete percent-octet escapes determine bytes, and literal Unicode chunks
 * are encoded as UTF-8.
 */
export const decodeDataUri: (uri: string, path: string) => Uint8Array = (
  uri: string,
  path: string,
): Uint8Array => {
  const comma: number = uri.indexOf(",");
  if (comma < 5) throw new Error(`${path} is not a complete data URI.`);
  const metadata: string = uri.slice(5, comma);
  const payload: string = uri.slice(comma + 1);
  try {
    if (metadata.split(";").includes("base64")) {
      if (
        payload.length % 4 !== 0 ||
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/][AQgw]==|[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=)?$/u.test(
          payload,
        ) === false
      )
        throw new Error("base64 payload is not canonical");
      const binary: string = atob(payload);
      const bytes: Uint8Array = new Uint8Array(binary.length);
      for (let index: number = 0; index < binary.length; ++index)
        bytes[index] = binary.charCodeAt(index);
      return bytes;
    }
    const encoder: InstanceType<typeof TextEncoder> = new TextEncoder();
    const chunks: Uint8Array[] = [];
    let literal: number = 0;
    for (let index: number = 0; index < payload.length; ++index) {
      if (payload.charCodeAt(index) !== 0x25) continue;
      const hex: string = payload.slice(index + 1, index + 3);
      if (/^[0-9A-Fa-f]{2}$/u.test(hex) === false)
        throw new Error("percent escape is incomplete");
      chunks.push(
        encoder.encode(payload.slice(literal, index)),
        Uint8Array.of(Number.parseInt(hex, 16)),
      );
      index += 2;
      literal = index + 1;
    }
    chunks.push(encoder.encode(payload.slice(literal)));
    const output: Uint8Array = new Uint8Array(
      chunks.reduce(
        (total: number, chunk: Uint8Array): number => total + chunk.byteLength,
        0,
      ),
    );
    let offset: number = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output;
  } catch (error) {
    throw new Error(
      `${path} has an invalid data payload: ${(error as Error).message}.`,
    );
  }
};
