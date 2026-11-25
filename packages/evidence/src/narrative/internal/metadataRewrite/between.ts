/** Tests an optional byte against an inclusive range. */
export function between(
  byte: number | undefined,
  minimum: number,
  maximum: number,
): boolean {
  return byte !== undefined && byte >= minimum && byte <= maximum;
}
