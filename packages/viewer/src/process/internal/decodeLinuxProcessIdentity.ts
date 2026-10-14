/**
 * Form a Linux identity from native boot ID and /proc/PID/stat text. The stat command field is parenthesized and can contain spaces or parentheses, so fields begin after its final closing parenthesis. Start time is field 22, index 19 among the fields beginning with state (field 3). Preserve its decimal text instead of rounding boot-relative kernel ticks through Number. These inputs are the host's complete native records, not authored overrides. The Linux kernel proc documentation lists start_time after it_real_value: https://www.kernel.org/doc/html/latest/filesystems/proc.html
 *
 * @evidence contracts/common.md#principled-implementation Finds the final parenthesized command terminator, reads field22's unsigned decimal start text after state and joins it with the nonempty native boot identity without Number rounding.
 * @evidence contracts/common.md#clear-and-simple-design One pure decoder interprets native text while filesystem acquisition, absence classification and stop effects retain their host owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing delimiter/start text, nondecimal ticks or empty boot refuse rather than returning an identity ending in undefined; boot text is treated as supplied native identity rather than an invented asset.
 * @evidence contracts/common.md#meaningful-documentation Documentation cites the read Kernel proc field table and explains command-name parsing, exact start text and malformed-record refusal.
 * @evidence contracts/performance.md#efficient-algorithms Delimiter search and splitting are linear in the native record bytes, with one field array and small identity string rather than process enumeration.
 * @evidence contracts/performance.md#reuse-equivalent-work Every supplied native record is interpreted independently; equal pid text alone does not share a birth identity across reboot or start-tick change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The decoder borrows text and returns one string, acquiring no proc descriptor, subprocess or native process handle.
 */
export function decodeLinuxProcessIdentity(boot: string, stat: string): string {
  const bootId: string = boot.trim();
  const closing: number = stat.lastIndexOf(")");
  const start: string | undefined = closing === -1 ? undefined : stat.slice(closing + 2).split(" ")[19];
  if (bootId === "" || start === undefined || !/^\d+$/.test(start))
    throw new Error("The native Linux process record has no boot/start identity.");
  return bootId + ":" + start;
}
