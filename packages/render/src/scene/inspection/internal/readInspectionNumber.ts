/** Decimal literals and unsigned binary, octal, and hexadecimal integers. */
const NUMERIC: RegExp =
  /^\s*(?:[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|0x[0-9a-f]+|0o[0-7]+|0b[01]+)\s*$/iu;

/** Read a numeric literal within the safe integer magnitude, or null. */
export function readInspectionNumber(text: string): number | null {
  if (!NUMERIC.test(text)) return null;

  const value: number = Number(text);
  return Math.abs(value) <= Number.MAX_SAFE_INTEGER ? value : null;
}
