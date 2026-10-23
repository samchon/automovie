/** Recognizes a flat evidence acknowledgement with its required reason. */
export const ACKNOWLEDGEMENT: RegExp =
  /^@(evidence|evidenceExclude) (\S+) (\S(?:.*\S)?)$/u;
