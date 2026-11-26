/**
 * Read the case-insensitive suffix of the final project-relative path
 * component.
 */
export function fileExtension(value: string): string {
  const name: string = value.slice(value.lastIndexOf("/") + 1);
  const index: number = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index).toLowerCase();
}
