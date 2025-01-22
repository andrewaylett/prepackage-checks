# Prepackage Checks

Looks for references to files in `package.json` and complains if they don't
exist.

## Usage

Adding this package to your `devDependencies` will give you access to a
`prepackage-checks` binary, which you can call from any npm script.

Despite the name, it's sensible to run this test routinely rather than _only_
immediately before publishing.

## Motivation

I published an NPM package, but it didn't work because the files I'd declared
in my package.json didn't actually exist.
This tool is an attempt to avoid making _that_ mistake again, although I'm sure
that I'll instead make exciting _new_ mistakes.

## Implementation

I use [Jest](https://jestjs.io) for general testing, and this package started
life as a set of Jest tests in one of my library projects.
Having copied it a couple of times, the time seemed ripe to extract the tooling
into a separate package for easier reuse.

I then rewrote the whole package to avoid Jest, as Jest, ESM, and TS don't always play well together.

Functional tests validate that the package behaves as expected. They're using node:test, rather than Jest, for the
same reasons. We can still use `expect`, though 🎉. Each test case has a file called `expect.cjs`, which is
dynamically imported to allow test-specific assertions.
