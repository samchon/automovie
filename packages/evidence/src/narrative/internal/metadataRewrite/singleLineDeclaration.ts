import { isDeclaration } from "./isDeclaration";

/** Recognizes one complete one-line comment and returns its declaration. */
export function singleLineDeclaration(line: string): string | undefined {
  if (!line.startsWith("<!-- ") || !line.endsWith(" -->")) return undefined;
  const declaration: string = line.slice(5, -4);
  return isDeclaration(declaration) ? declaration : undefined;
}
