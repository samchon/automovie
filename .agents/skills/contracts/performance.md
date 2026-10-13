# Performance

Judge the owning operation together with its helpers; moving work to another layer does not remove its cost.

## Cost and Resources

Use the cheapest correct method for the supported workload, without needless traversal, allocation, or recomputation. Reuse completed work only when its inputs decide equivalence and an invalidation keeps it valid, and release every retained resource (GPU objects, workers, handles, cached state) on completion, failure, cancellation, and transfer. State the dominant cost and the input sizes that drive it, any cache with its key and invalidation, and each retained resource with its owner, release point, and bound, or that the bound is absent.
