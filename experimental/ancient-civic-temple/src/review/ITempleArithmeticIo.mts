/** Explicit document and assertion/report ports for the ordered roof audit.
 * The CLI owns file acquisition and stdout. Tests provide immutable text and
 * collect the same assertions without filesystem or process access. */
export interface ITempleArithmeticIo {
  h2: (file: string, anchor: string) => string;
  space: (file: string) => string;
  n: (body: string, pattern: RegExp, group?: number) => number;
  near: (label: string, actual: number, expected: number, eps?: number) => void;
  pass: (label: string, condition: boolean, detail?: string) => void;
  log: (...values: (string | number)[]) => void;
}
