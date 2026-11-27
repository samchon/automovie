import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import {
  AutoMovieMotionHumanRefusal,
  validateInitialPropMounts,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { testAffordance } from "../../internal/fixtures/testAffordance";
import { softPanel } from "../../internal/softPanel";

/** No offset. */
const AT: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/**
 * `validateInitialPropMounts` admits props mounted on another prop's socket
 * before any frame is read: each mounted prop rigid with no other placement
 * authority, on a declared prop's declared affordance, at a unit offset, and
 * no chain of mounts returning to itself.
 *
 * Scenarios, for a rack with a `peg` and a `shelf`:
 *
 * 1. A cup on the peg and a lid on the cup's own `rim` are admitted, as is a prop
 *    with no mount.
 * 2. Two props mounted on each other are refused with the path that returns.
 * 3. A mounted prop that is fixed, worn, soft or moving by itself is refused on
 *    its mount.
 * 4. A mount on a prop that does not exist, or on an affordance its prop does not
 *    declare, is refused on that field.
 * 5. An offset whose rotation is not a unit quaternion is refused on the offset.
 */
export function test_motions_perform_initial_prop_mounts(): void {
  const origin = { at: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const rack: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "rack",
    {
      affordances: [
        testAffordance("peg", "hook", { x: 0, y: 1, z: 0 }),
        testAffordance("shelf", "surface", { x: 0, y: 0.5, z: 0 }),
      ],
    },
    origin,
  );
  const holder = (
    subject: string,
    mounted?: IAutoMovieMotionHumanProp.IMounted,
  ): IAutoMovieMotionHumanProp => ({
    ...AutoMovieMotionHumanObject.prop(
      subject,
      { affordances: [testAffordance("rim", "socket", { x: 0, y: 0.1, z: 0 })] },
      origin,
    ),
    ...(mounted === undefined ? {} : { mounted }),
  });
  const map = (
    ...props: IAutoMovieMotionHumanProp[]
  ): Map<string, IAutoMovieMotionHumanProp> =>
    new Map(props.map((prop) => [prop.subject, prop]));
  const cup: IAutoMovieMotionHumanProp = holder("cup", {
    prop: "rack",
    point: "peg",
    offset: AT,
  });

  // 1. Admitted.
  validateInitialPropMounts(
    map(
      rack,
      cup,
      holder("lid", { prop: "cup", point: "rim", offset: AT }),
      holder("spare"),
    ),
  );

  // 2. A cycle.
  TestValidator.predicate(
    "a returning chain",
    refused(
      () =>
        validateInitialPropMounts(
          map(
            holder("a", { prop: "b", point: "rim", offset: AT }),
            holder("b", { prop: "a", point: "rim", offset: AT }),
          ),
        ),
      "props.a.mounted",
      (value: unknown): boolean =>
        JSON.stringify(value) === JSON.stringify(["a", "b", "a"]),
    ),
  );

  // 3. Another placement authority.
  for (const [title, change] of [
    ["fixed", { fixed: true }],
    [
      "worn",
      { worn: { subject: "actor", bone: "head", offset: AT } },
    ],
    ["soft", { soft: softPanel({ columns: 2, rows: 2 }) }],
    ["moving", { motion: (): IAutoMovieRigidTransform => AT }],
  ] as const)
    TestValidator.predicate(
      `a ${title} mounted prop`,
      refused(
        () => validateInitialPropMounts(map(rack, { ...cup, ...change })),
        "props.cup.mounted",
      ),
    );

  // 4. Missing carriers.
  TestValidator.predicate(
    "a missing prop or affordance",
    refused(
      () =>
        validateInitialPropMounts(
          map(holder("cup", { prop: "shelf", point: "peg", offset: AT })),
        ),
      "props.cup.mounted.prop",
    ) &&
      refused(
        () =>
          validateInitialPropMounts(
            map(rack, holder("cup", { prop: "rack", point: "hook", offset: AT })),
          ),
        "props.cup.mounted.point",
      ),
  );

  // 5. A bad offset.
  TestValidator.predicate(
    "an offset that is not a rigid frame",
    refused(
      () =>
        validateInitialPropMounts(
          map(
            rack,
            holder("cup", {
              prop: "rack",
              point: "peg",
              offset: { ...AT, rotation: { x: 0, y: 0, z: 0, w: 2 } },
            }),
          ),
        ),
      "props.cup.mounted.offset",
    ),
  );
}

/** Whether a task refuses on the axis, with a value the check accepts. */
function refused(
  task: () => unknown,
  axis: string,
  value: (value: unknown) => boolean = (): boolean => true,
): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return (
      error instanceof AutoMovieMotionHumanRefusal && error.axis === axis && value(error.value)
    );
  }
}
