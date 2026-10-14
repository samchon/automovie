

/**
 * Full repaint role population used to refuse one image as guidance for every role.
 *
 * The current receipt gate groups authored roles by image digest and refuses any digest assigned all seven roles. It does not require each receipt to carry seven references; nonempty reference admission, role/path uniqueness, provenance and byte currentness are separate checks. The reference validator owns scans and byte checks; this shared scalar chooses no algorithm and retains no request bytes, receipt or task.
 */
export const productionProjectRepaintReferenceRoleCount: number = 7;
