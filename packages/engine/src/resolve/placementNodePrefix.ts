/**
 * Append slash to a placement id for scene lowering, profile binding, actor
 * clips and articulated-object channels. This is the shared literal naming law;
 * concrete graph admission still owns uniqueness.
 */
export const placementNodePrefix: (placement: string) => string = (
  placement: string,
): string => `${placement}/`;
