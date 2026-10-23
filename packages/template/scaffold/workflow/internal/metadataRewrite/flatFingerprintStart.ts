import { REVIEW } from "./REVIEW";

/** Locates the review hash by grammar, never by an identical token in its target. */
export function flatFingerprintStart(declaration: string): number | undefined {
  const review: RegExpExecArray | null = REVIEW.exec(declaration);
  return review === null ? undefined : `@${review[1]} ${review[2]} `.length;
}
