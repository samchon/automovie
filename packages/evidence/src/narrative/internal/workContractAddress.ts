const WORK_FAMILIES = [
  "principles",
  "naturalness",
  "obligations",
  "discovery",
  "targets",
] as const;

interface IWorkContractAddress {
  path: string;
  family: (typeof WORK_FAMILIES)[number] | undefined;
}

/*
 * Canonicalizes separator spelling before checking one exact local address.
 * Each claim builder decides which of the recognized families it can own.
 */
export function workContractAddress(document: string): IWorkContractAddress {
  const path: string = document.replaceAll("\\", "/");
  const parts: string[] = path.split("/");
  const exact: boolean =
    parts.length >= 3 &&
    parts[0] === "work" &&
    parts.every(
      (part: string): boolean => part !== "" && part !== "." && part !== "..",
    ) &&
    !/[[\]*?#]/u.test(path) &&
    path.endsWith(".md") &&
    !path.toLowerCase().endsWith("/skill.md");
  return {
    path,
    family: exact
      ? WORK_FAMILIES.find((family) => family === parts[1])
      : undefined,
  };
}
