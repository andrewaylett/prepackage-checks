/*
 * Copyright 2022 Andrew Aylett
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFileSync } from 'node:fs';

import glob from 'glob';
import { describe, it } from '@jest/globals';

import { expect } from './expect/index.js';

type StringOrStringRecord = string | Record<string, string>;
type NestedStringRecords =
    | number
    | boolean
    | string
    | { [s: string]: NestedStringRecords };

type PackageFile = Partial<
    Record<string, NestedStringRecords> & {
        source: string;
        main: string;
        types: string;
        bin: StringOrStringRecord;
        exports: Record<string, string>;
        imports: Record<string, StringOrStringRecord>;
        dependencies: Record<string, string>;
        devDependencies: Record<string, string>;
        peerDependencies: Record<string, string>;
    }
>;

const PACKAGE_JSON: PackageFile = JSON.parse(
    readFileSync('./package.json').toString(),
);

describe('Build output', () => {
    describe.each([
        ['source'],
        ['main'],
        ['types'],
        ['exports'],
        ['imports'],
        ['bin'],
    ])(`All %p files are present`, (fileType) => {
        const element = PACKAGE_JSON[fileType];
        if (element) {
            const object =
                typeof element == 'string' ? { default: element } : element;
            describe.each(Object.entries(object))(
                `%p entries for ${fileType}`,
                (pattern: string, v: NestedStringRecords): void => {
                    const elements = typeof v !== 'object' ? { default: v } : v;

                    if (pattern.includes('*')) {
                        // Check that we have a default and all the files for each pattern.
                        it(`${pattern} has a default value`, () => {
                            expect(Object.keys(v)).toContain('default');
                        });

                        it(`${pattern} only has one wildcard`, () => {
                            expect(pattern).toMatch(/^[^*]*\*[^*]*$/);
                        });

                        const check: Record<string, string[][]> = {};
                        for (const [type, pattern] of Object.entries(
                            elements,
                        )) {
                            if (typeof pattern === 'string') {
                                const [prefix, suffix] = pattern.split('*', 2);
                                const matches = glob.sync(
                                    pattern.replace('/*', '/**/*'),
                                );
                                for (const file of matches) {
                                    const match = file.slice(
                                        prefix.length,
                                        -suffix.length,
                                    );
                                    check[match] = check[match] ?? [];
                                    check[match].push([type, file]);
                                }
                            }
                        }
                        const types = Object.keys(elements);

                        describe.each(Object.entries(check))(
                            `%p for "${pattern}": all of [${types}] exist`,
                            (match, found) => {
                                const foundTypes = found.map((f) => f[0]);
                                it(`[${foundTypes}] matches [${types}]`, () => {
                                    expect(foundTypes).toEqual(
                                        expect.arrayContaining(types),
                                    );
                                });
                                it.each(found)(
                                    `%p for "${match}": %p exists`,
                                    (_, file) => {
                                        expect(typeof file).toEqual('string');
                                        expect(file).isAFile();
                                    },
                                );
                            },
                        );
                    } else {
                        // Simple file match
                        it.each(Object.entries(elements))(
                            `%p for "${pattern}": %p exists`,
                            (_, v) => {
                                expect(typeof v).toEqual('string');
                                expect(v).isAFile();
                            },
                        );
                    }
                },
            );
        }
    });
});
