# AGENTS.md

## Project Overview

This is a fun side-project to learn about Music Theory and how it fits on the guitar.

## Development Workflow

### Commands

- `bun run dev` - Starts Vite dev server with Vite + ReScript watch mode

### Important Notes

**ReScript compilation**: When `bun run dev` is running, ReScript compilation happens via the Vite plugin. You cannot run two ReScript processes simultaneously due to technical limitations. Never suggest running `bunx rescript` commands when the dev server is active.

**Compiler output**: When `bun run dev` is running, ReScript compiler hints and errors can be found in the terminal where the dev server is running.

## Styling

- **Tailwind CSS v4**: Ensure all classes reflect this version
- **Daisy UI v5**: Always try to propose fitting Daisy component solutions when possible

## ReScript Guidelines

### Core Language Rules

- Uses ReScript v12
- Never use the `Belt` or `Js` modules - these are legacy
- Always use the `JSON.t` type for JSON
- Favor the new `dict{}` pattern matching syntax for JSON object destructuring over `Dict.get()` calls

```rescript
// ✅ Preferred - concise and readable
let decodePokemonImage = (json: JSON.t) => {
  switch json {
  | JSON.Object(dict{"sprites": JSON.Object(dict{"front_default": JSON.String(url)})}) => Some(url)
  | _ => None
  }
}

// ❌ Avoid - verbose and harder to read
let decodePokemonImage = (json: JSON.t) => {
  switch json {
  | JSON.Object(obj) =>
    switch Dict.get(obj, "sprites") {
    | Some(JSON.Object(sprites)) =>
      switch Dict.get(sprites, "front_default") {
      | Some(JSON.String(url)) => Some(url)
      | _ => None
      }
    | _ => None
    }
  | _ => None
  }
}
```

### Async & Promises

- When dealing with promises, prefer using `async/await` syntax

### String Interpolation

- Every expression inside an interpolated string must be of type string
- Can't do `` `age = ${42}` ``
- Must convert: `` `age = ${(42)->Int.toString}` ``

### Generic Type Parameters

ReScript does **not** support F#-style generic type parameters. Generics are always inferred automatically by the compiler.

```rescript
// ✅ Correct
let id: int => int = x => x

// ❌ Wrong (F# style)
let id<'a> = x => x
let y = id<int>(5)
```

### Code Style Preferences

When there is a switch or if/else expression, prefer the first branch to be the smallest (like an early return), UNLESS it would create unreachable code patterns:

```rescript
// ✅ Preferred
switch foo {
  | None => 1
  | Some(bar) => {
    // long code block
    0
  }
}

// Exception: Specific patterns must come before catch-all
switch json {
  | JSON.Object(dict{"name": JSON.String(name)}) => Some(name)
  | _ => None  // catch-all must come after specific patterns
}
```

### Module Functions

When you see `include` in ReScript source code, it means a module function was used. This brings additional symbols into the current module scope that aren't visible in the original source.

## External Bindings

### `@send` Method Calls

External bindings with `@send` that return a value do not require `()` to be invoked:

```rescript
type t

@send
external foo: t => string = "foo"
external i: t = "t"
let b = i->foo // Notice no `()` here!
```

### `@send` with Optional Labeled Arguments

When a `@send` method has optional labeled arguments, you cannot use `()` - omit the argument entirely or use labeled syntax:

```rescript
@send external trim: (t, ~options: trimOptions=?) => t = "trim"

// ✅ Correct - omit optional argument
instance->Sharp.trim

// ✅ Also correct - explicitly omit with ?
instance->Sharp.trim(~options=?)

// ❌ Wrong - empty () doesn't work with optional labeled args
instance->Sharp.trim()
```

### `@new` Constructor Pattern

When you see `@new` on an external function, it generates a JavaScript constructor call (`new ClassName(...)`). The return type can be a ReScript record, but at runtime you get the full JavaScript object with all its methods and properties.

Example: `WebAPI.File.make()` returns a `file` record type but generates `new File(...)` in JavaScript, giving you a proper File object with methods like `arrayBuffer()`, `text()`, etc.

### `@module` Scoping

The `@module("name")` attribute imports a symbol from a specific JavaScript module (like a node_modules package).

```rescript
@new @module("pocketbase")
external make: (~errData: unknown=?) => t = "ClientResponseError"
```

Without `@module("pocketbase")`, ReScript would look for `ClientResponseError` in the global scope. With `@module("pocketbase")`, it imports from the `pocketbase` npm package.

Note: Globally available classes (like `File`, `Date`, etc.) don't need `@module` as they're accessed from the global scope.

### Record Type vs Abstract Type with `@new`

You can use a record type with `@new` for convenient field access:

```rescript
type t = { status: int, url: string }
@new external make: unit => t = "SomeClass"
let obj = make() // Runtime: instance of SomeClass, Compile-time: record
let status = obj.status // Convenient field access via record
```

Or use abstract types with `@get`/`@set`:

```rescript
type t
@get external status: t => int = "status"
@new external make: unit => t = "SomeClass"
```

### Optional Record Fields

When defining optional fields in records for external bindings, use `?` syntax:

```rescript
type resizeOption = {
  width: int,
  height: int,
  fit: string,
  background?: {r: int, g: int, b: int, alpha: int},  // Optional field
}
```
