import { declarationKind } from "./declarationKind";

/** Recognizes one exact acknowledgement or review declaration. */
export function isDeclaration(line: string): boolean {
  return declarationKind(line) !== undefined;
}
