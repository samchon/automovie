/**
 * Form a Linux identity from native boot ID and /proc/PID/stat text. The stat
 * command field is parenthesized and can contain spaces or parentheses, so
 * fields begin after its final closing parenthesis. Start time is field 22,
 * index 19 among the fields beginning with state (field 3). Preserve its decimal
 * text instead of rounding boot-relative kernel ticks through Number.
 * These inputs are the host's complete native records, not authored overrides.
 * The Linux kernel proc documentation lists start_time after it_real_value:
 * https://www.kernel.org/doc/html/latest/filesystems/proc.html
 */
export function decodeLinuxProcessIdentity(boot: string, stat: string): string {
  return boot.trim() + ":" + stat.slice(stat.lastIndexOf(")") + 2).split(" ")[19];
}
