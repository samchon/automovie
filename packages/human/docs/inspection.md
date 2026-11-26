# Human inspection selectors

Use `ansur-upper-arm-envelope` to open the measured conic study in the Human inspector or capture it from the command line. The subject has one pose, `study`. [Human inspection commands](../README.md#inspection), [capture request keys](../../render/docs/capture-requests.md).

| Path or pattern | Selection |
| --- | --- |
| `ansur-upper-arm-envelope/upperarm` | The surface |
| `ansur-upper-arm-envelope/upperarm/section/*` | Section rings |
| `ansur-upper-arm-envelope/upperarm/guide/*` | Guide rails |
| `ansur-upper-arm-envelope/upperarm/axis` | The centreline |

The curve mark kinds are `curve/section`, `curve/guide` and `curve/axis`. Use `--marks 'curve/*' --surface 0` to see the curves independently and `--shade clay` for the form pass. For matched body and joint evidence, see [anatomical consistency](testing/consistency.md).
