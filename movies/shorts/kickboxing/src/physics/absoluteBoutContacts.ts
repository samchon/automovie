import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";

/** A bounded offline review archive has a local cache clock and an explicit screenplay offset. */
export function absoluteBoutContacts(
  contacts: readonly Receipt[],
  offset: number,
): Receipt[] {
  return contacts.map(
    (receipt: Receipt): Receipt => ({
      ...receipt,
      seconds: receipt.seconds + offset,
      endSeconds: receipt.endSeconds + offset,
      samples: receipt.samples?.map(
        (
          sample: NonNullable<Receipt["samples"]>[number],
        ): NonNullable<Receipt["samples"]>[number] => ({
          ...sample,
          seconds: sample.seconds + offset,
        }),
      ),
    }),
  );
}
