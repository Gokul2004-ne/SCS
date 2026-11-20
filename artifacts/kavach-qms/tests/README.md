# Approval workflow regressions

Run from the workspace root:

```sh
pnpm --filter @workspace/kavach-qms test
pnpm --filter @workspace/kavach-qms test:typecheck
```

Vitest and React Testing Library exercise the real store and page components in
jsdom. Each test starts with isolated local storage and a deterministic fixture,
not the demo dataset's existing approvals. Only toast notifications are mocked.
The router uses an in-memory location. Downloads are captured before leaving the
page so the actual CSV/JSON payload can be asserted.

Coverage includes acceptance-before-RCA (including direct routes), simulated
role controls, rebuttal/reclassification, 8D validation and rejection/revision,
justified NA, independent iteration counters, each closure gate, four audit-scoped
declarations and revocation, objective verification, explicit closure, withdrawal,
local persistence, log chaining, and exported dossier/CSV contents.

## Security boundary

These are **role simulation tests, not authorization tests**. The current app is
a local-storage prototype: anyone can switch roles or alter stored state, and
`mutate` is a general client-side callback, not a permission-enforcing API.
Declarations and log digests are simulated, not authenticated digital signatures.
Passing this suite does not establish server-side access control, tamper resistance,
multi-user isolation, or compliance. Protected account/API tests belong with the
separate protected-accounts implementation.
