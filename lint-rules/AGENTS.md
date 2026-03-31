# Custom Lint Rules

Custom oxlint rules for the intervallo project, registered via `plugin.ts`.

## Developing rules

Each rule lives in its own file and is wired up in `plugin.ts`.

Use `ast.ts` to inspect the AST of any TypeScript snippet:

```sh
echo 'const x = foo();' | bun run lint-rules/ast.ts
```

This prints the oxc AST as JSON, which shows the exact node types and field names
the plugin receives at runtime. Use this to verify assumptions before writing or
refining a rule — the oxc AST can differ from what you'd expect from ESTree.

## Workflow

1. Find a pattern in the codebase that should be flagged.
2. Pipe a minimal reproducer into `ast.ts` to understand the AST shape.
3. Write or update the rule, matching against the actual node types.
4. Run `bun run lint` to verify it catches the pattern without false positives.
