import { between } from "./between";

/** Tests one UTF-8 continuation byte without accepting absent bytes. */
export function continuation(byte: number | undefined): boolean {
  return between(byte, 0x80, 0xbf);
}
