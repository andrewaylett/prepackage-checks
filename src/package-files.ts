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
import { stat } from 'node:fs/promises';
import path from 'node:path';

import { glob } from 'glob';
import Arborist from '@npmcli/arborist';
import packlist from 'npm-packlist';

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

const PACKAGE_FILE_KEYS = [
    'source',
    'main',
    'types',
    'exports',
    'imports',
    'bin',
];

type Report = {
    success: boolean;
    messages: string[];
};

function reduceReports(reports: Report[], message: string): Report {
    return reports.reduce(
        (prev, next) => ({
            messages: prev.messages.concat(next.messages.map((m) => `  ${m}`)),
            success: prev.success && next.success,
        }),
        {
            messages: [message],
            success: true,
        },
    );
}

function fail(m: string): Report {
    return {
        messages: [m],
        success: false,
    };
}
function inform(m: string): Report {
    return {
        messages: [m],
        success: true,
    };
}

async function checkFile(pack: string[], v: unknown): Promise<Report> {
    if (typeof v != 'string') {
        return fail('Invalid structure: expected a string filename');
    }
    try {
        if (!(await stat(v)).isFile()) {
            return fail(`${v} is not a file`);
        } else {
            const absolute = path.resolve(v);
            if (pack.includes(absolute)) {
                return inform(`Found file "${v}"`);
            } else {
                return fail(`${v} is not packaged`);
            }
        }
    } catch {
        return fail(`${v} does not exist`);
    }
}

async function checkKey(
    pack: string[],
    key: string,
    value?: NestedStringRecords,
): Promise<Report> {
    if (!value) {
        return inform(`No entry for "${key}"`);
    }
    const object = typeof value == 'string' ? { default: value } : value;
    if (typeof object == 'number' || typeof object == 'boolean') {
        return fail('malformed entry');
    }

    const reports: Report[] = await Promise.all(
        Object.entries(object).map(async ([pattern, v]) => {
            const elements = typeof v !== 'object' ? { default: v } : v;
            const reports: Report[] = [];

            if (pattern.includes('*')) {
                // Check that we have a default and all the files for each pattern.
                if (!Object.keys(elements).includes('default')) {
                    reports.push(fail(`${pattern} has no default value`));
                }

                if (!pattern.match(/^[^*]*\*[^*]*$/)) {
                    reports.push(fail(`${pattern} may only have one wildcard`));
                }

                const check: Record<string, string[][]> = {};
                for (const [type, pattern] of Object.entries(elements)) {
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

                const moreReports = await Promise.all(
                    Object.entries(check).map(
                        async ([match, found]): Promise<Report> => {
                            const reports: Report[] = [];
                            const foundTypes = found.map((f) => f[0]);

                            if (
                                types.length != foundTypes.length ||
                                !types.reduce(
                                    (prev, item) =>
                                        prev && foundTypes.includes(item),
                                    true,
                                )
                            ) {
                                reports.push(
                                    fail(
                                        `expected [${foundTypes}] to match [${types}]`,
                                    ),
                                );
                            }

                            const moreReports = await Promise.all(
                                found.map(async ([k, v]) => {
                                    const reports: Report[] = [];
                                    reports.push(await checkFile(pack, v));
                                    return reduceReports(
                                        reports,
                                        `Checking ${k} for ${pattern}`,
                                    );
                                }),
                            );
                            reports.push(...moreReports);
                            return reduceReports(
                                reports,
                                `${match} for "${pattern}": checking that all of [${types}] exist`,
                            );
                        },
                    ),
                );
                reports.push(...moreReports);
            } else {
                // Simple file match
                reports.push(
                    ...(await Promise.all(
                        Object.entries(elements).map(async ([_, v]) => {
                            return checkFile(pack, v);
                        }),
                    )),
                );
            }
            return reduceReports(reports, `Checking "${pattern}":`);
        }),
    );
    return reduceReports(reports, `Checking files for "${key}":`);
}

export async function run(): Promise<Report> {
    const arborist = new Arborist({ path: '.' });
    const tree = await arborist.loadActual();
    const relativePack = await packlist(tree);
    const pack = relativePack.map((f) => path.resolve('./', f));
    const reports = await Promise.all(
        PACKAGE_FILE_KEYS.map((key) => checkKey(pack, key, PACKAGE_JSON[key])),
    );
    return reduceReports(
        reports,
        'Checking files listed in package.json actually exist:',
    );
}
