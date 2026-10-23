/** Recognizes an acknowledgement heading and an optional inline reason. */
export const HEADING_ACKNOWLEDGEMENT: RegExp =
  /^(#{2,4}) @(evidence|evidenceExclude) (\S+)(?: (\S(?:.*\S)?))?$/u;
