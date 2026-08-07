---
name: write-script
description: Patterns and guidelines for writing reliable crawler scripts under src/scripts/, including error handling, retries, checkpointing, and idempotency.
---

# Reliable crawler-script pattern

Use this pattern when adding a long-running Arkham (or similar external API)
crawler under `src/scripts/`. It is derived from
`crawl-arkham-entity-transfer-addresses.ts`.

## Non-negotiable rules

1. **Fail closed.** If an error is not explicitly known to be recoverable,
   rethrow it. Do not skip the item, silently substitute a value, advance a
   checkpoint, or continue with the next item.
2. **Abort and report unexpected failures.** Let the error reach the
   `import.meta.main` handler. That handler must log a useful error, send the
   failure notification, and set `process.exitCode = 1`. Failure to send the
   notification is logged but must not hide the original error.
3. **Retry only known transient operations.** Wrap network and database work in
   `retryTransient` when retrying is safe. Preserve its operation description
   and pass the `TerminationController`. Do not retry malformed responses,
   changed API invariants, validation errors, or exhausted retry failures.
4. **Make writes idempotent.** A rerun may repeat completed or boundary work.
   Use natural keys and upserts, and use monotonic updates (for example,
   `$max` for timestamps) where appropriate.
5. **Checkpoint only after durable work succeeds.** Write a complete unit of
   work first, then atomically advance its checkpoint. A write or checkpoint
   failure leaves that unit eligible for a safe retry on the next run.
6. **Validate external data and assumptions.** Validate CLI input, response
   counts/shapes, pagination bounds, and persisted-state bounds. Treat an
   impossible or changing invariant as a fatal error.
7. **Handle only documented exceptional cases.** For example, rotate a cookie
   only for a 429 response, and split a time window only for the explicit
   pagination-overflow error. Rethrow every other error unchanged.
8. **Stop safely on termination.** Check the termination controller before new
   work and during long loops. Stop scheduling new work, allow only the work
   needed to reach a consistent checkpoint to finish, then throw a clear
   termination error so the run is reported as interrupted.
9. **Keep concurrent progress ordered.** Concurrent fetches may finish out of
   order, but persist/checkpoint units in cursor order. On the first failure,
   stop scheduling work, retain the relevant failure, and abort after active
   work has settled; never leap over a failed checkpoint.
10. **Always clean up.** Create the termination controller before work, and in
    `finally` dispose it and close the database, including after startup,
    validation, or notification errors.

## Script shape

```ts
export async function crawlExample(): Promise<void> {
  const termination = new TerminationController(
    "Termination requested; no further example work will start.",
  );

  try {
    const options = parseExampleOptions(); // reject unknown/invalid input
    await connectDatabase();
    await ensureExampleIndexes();

    const state = await getOrCreateExampleState(options);
    if (state.completed) return;

    while (hasWork(state)) {
      termination.throwIfRequested(
        "Termination requested; work was checkpointed.",
      );

      const unit = getNextUnit(state, options);
      const result = await retryTransient(
        () => fetchAndValidateUnit(unit),
        `Example request for ${describe(unit)}`,
        termination,
      );

      await persistUnitAndCheckpoint(
        () => writeIdempotently(result),
        () => advanceCheckpoint(state, unit),
      );
    }
  } finally {
    termination.dispose();
    await closeDatabase();
  }
}

if (import.meta.main) {
  void crawlExample().catch(async (error: unknown) => {
    console.error(getErrorMessage(error));
    try {
      await sendTelegramMessage(
        ["Example crawl failed.", `Error: ${getErrorMessage(error)}`].join(
          "\n",
        ),
      );
    } catch (notificationError: unknown) {
      console.error(
        `Unable to send failure notification: ${getErrorMessage(notificationError)}`,
      );
    }
    process.exitCode = 1;
  });
}
```

## Review checklist

- [ ] Unknown CLI options and positional arguments fail immediately.
- [ ] Every retry is safe, bounded, and limited to a known transient failure.
- [ ] Every external response is validated before it is written or used as a
      cursor.
- [ ] A checkpoint cannot move ahead of a failed or unwritten unit.
- [ ] Re-running after interruption or failure is safe and resumes correctly.
- [ ] A non-recoverable error stops the script, is logged, triggers the failure
      notification, and exits non-zero.
- [ ] Database and signal-handler resources are released on every exit path.
