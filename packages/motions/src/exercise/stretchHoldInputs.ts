import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanStretch,
} from "@automovie/interface";


/** A captured data record and the direct fields its native reader can observe. */
interface IRecord {
  owner: object;
  fields: readonly IField[];
}
interface IField {
  key: string;
  value: unknown;
}

/**
 * Admit the law's own standing entry without borrowing an outside posture
 * reader. The body factory requires a new body after a rig or profile edit.
 * Capture only its actual reader identities and the ordinary entry data this
 * law borrows.
 */
export function stretchHoldInputs(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStretch.IParams>,
): (() => boolean) | undefined {
  const body: IAutoMovieMotionHumanBody | undefined =
    Object.getOwnPropertyDescriptor(context, "body")?.value;
  const entry: IAutoMovieMotionHumanEntryState | undefined =
    Object.getOwnPropertyDescriptor(context, "entry")?.value;
  const params: IAutoMovieMotionHumanStretch.IParams | undefined =
    Object.getOwnPropertyDescriptor(context, "params")?.value;
  if (
    body === undefined ||
    entry === undefined ||
    params === undefined
  )
    return undefined;

  // These two records are consumed at authoring, before either phase reader is published.
  const pose: IAutoMovieMotionHumanEntryState["pose"] | undefined =
    Object.getOwnPropertyDescriptor(entry, "pose")?.value;
  if (
    pose === undefined ||
    !capture(pose, [], new Set()) ||
    !capture(params, [], new Set())
  )
    return undefined;

  const records: IRecord[] = [];
  const seen: Set<object> = new Set();
  const roots: IField[] = [];
  for (const key of [
    "posture",
    "feet",
    "supports",
    "holds",
    "uses",
    "base",
  ] as const) {
    const descriptor: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(entry, key);
    if (
      descriptor === undefined ||
      !("value" in descriptor) ||
      !capture(descriptor.value, records, seen)
    )
      return undefined;
    roots.push({ key, value: descriptor.value });
  }
  if (
    entry.base.kind !== "standing" ||
    Object.keys(entry.holds).length !== 0 ||
    Object.keys(entry.uses).length !== 0 ||
    entry.supports.some((support) => support.support.kind !== "ground") ||
    entry.posture.digits !== undefined ||
    entry.posture.rotation !== undefined ||
    Object.values(entry.posture.limbs).some(
      (goal) =>
        goal !== undefined &&
        (goal.on !== undefined ||
          goal.clear !== undefined ||
          goal.rests !== undefined ||
          goal.clearanceOn !== undefined),
    )
  )
    return undefined;

  const matches = (owner: object, field: IField): boolean => {
    const descriptor: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(owner, field.key);
    return (
      descriptor !== undefined &&
      "value" in descriptor &&
      Object.is(descriptor.value, field.value)
    );
  };
  return (): boolean =>
    Object.getOwnPropertyDescriptor(context, "body")?.value === body &&
    Object.getOwnPropertyDescriptor(context, "entry")?.value === entry &&
    roots.every((field: IField): boolean => matches(entry, field)) &&
    records.every(
      (record: IRecord): boolean =>
        Object.keys(record.owner).length === record.fields.length &&
        record.fields.every((field: IField): boolean =>
          matches(record.owner, field),
        ),
    );
}
/**
 * Reject non-data input without evaluating an accessor on behalf of the compact
 * clock.
 */
function capture(
  input: unknown,
  records: IRecord[],
  seen: Set<object>,
): boolean {
  if (input === null || typeof input !== "object")
    return typeof input !== "function" && typeof input !== "symbol";
  if (seen.has(input)) return true;
  const prototype: unknown = Object.getPrototypeOf(input);
  if (
    prototype !== Object.prototype &&
    prototype !== Array.prototype &&
    prototype !== null
  )
    return false;
  seen.add(input);
  const fields: IField[] = [];
  for (const key of Reflect.ownKeys(input)) {
    if (Array.isArray(input) && key === "length") continue;
    const descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(
      input,
      key,
    )!;
    if (
      typeof key !== "string" ||
      !descriptor.enumerable ||
      !("value" in descriptor) ||
      !capture(descriptor.value, records, seen)
    )
      return false;
    fields.push({ key, value: descriptor.value });
  }
  records.push({ owner: input, fields });
  return true;
}
