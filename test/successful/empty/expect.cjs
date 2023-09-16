function assert(blob, expect) {
    expect(blob).toContain('No entry for "source"');
    expect(blob).toContain('No entry for "main"');
    expect(blob).toContain('No entry for "types"');
    expect(blob).toContain('No entry for "exports"');
    expect(blob).toContain('No entry for "imports"');
    expect(blob).toContain('No entry for "bin"');
}

// eslint-disable-next-line no-undef
module.exports = { assert };
