/**
 * Form a Linux identity from native boot ID and /proc/PID/stat text. The stat
 * command field is parenthesized and can contain spaces or parentheses, so
 * fields begin after its final closing parenthesis. Start time is field 22,
 * index 19 among the fields beginning with state (field 3). Preserve its decimal
 * text instead of rounding boot-relative kernel ticks through Number.
 * These inputs are the host's complete native records, not authored overrides.
 * The Linux kernel proc documentation lists start_time after it_real_value:
 * https://www.kernel.org/doc/html/latest/filesystems/proc.html
 *
 * @evidence contracts/common.md#principled-implementation Joins boot identity with the kernel's exact decimal start ticks and locates fields after the complete command name.
 * @evidence contracts/common.md#clear-and-simple-design One native-record decoder owns Linux identity formatting without file access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads supplied native facts without executable-name ownership or guessed wall-clock identity.
 * @evidence contracts/common.md#meaningful-documentation States the stat field derivation, command-name delimiter and exact tick representation.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Distinguishes Linux allocations across boots without losing kernel start-tick precision.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Decodes the actual Linux identity records supplied by the process host.
 */
export function decodeLinuxProcessIdentity(boot: string, stat: string): string {
  return boot.trim() + ":" + stat.slice(stat.lastIndexOf(")") + 2).split(" ")[19];
}
