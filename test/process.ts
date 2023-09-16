/*
 * Copyright 2022-2023 Andrew Aylett
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

import { ChildProcess } from 'child_process';

import type {
    ExpectationResult,
    MatchersFor,
    MatcherState,
} from 'extend-expect';

async function toSpawnSuccessfully(
    this: MatcherState,
    received: unknown,
    expected: unknown,
): Promise<ExpectationResult> {
    const options = {
        comment: 'Check that a process succeeded',
        isNot: this.isNot,
        promise: this.promise,
    };

    if (typeof expected !== 'undefined' && typeof expected !== 'boolean') {
        // Prepend maybe not only for backward compatibility.
        const matcherString = (options ? '' : '[.not]') + 'toSpawnSuccessfully';
        throw new Error(
            this.utils.matcherErrorMessage(
                this.utils.matcherHint(matcherString, undefined, '', options),
                // Because expected is omitted in hint above,
                // expected is black instead of green in message below.
                'this matcher must have a boolean expected argument, if one is provided',
                this.utils.printWithType(
                    'Expected',
                    expected,
                    this.utils.printExpected,
                ),
            ),
        );
    }

    const matcherHint = this.utils.matcherHint(
        'toSpawnSuccessfully',
        undefined,
        undefined,
        options,
    );

    if (!(received instanceof ChildProcess)) {
        return {
            pass: false,
            message: () =>
                this.utils.matcherErrorMessage(
                    matcherHint,
                    `${this.utils.RECEIVED_COLOR(
                        'received',
                    )} value must be a ChildProcess`,
                    this.utils.printWithType(
                        'Received',
                        received,
                        this.utils.printReceived,
                    ),
                ),
        };
    }

    function pass(code: number | null) {
        if (typeof expected === 'boolean') {
            return (code === 0) === expected;
        }
        return code === 0;
    }

    return new Promise((resolve) => {
        received.on('exit', (code, signal) => {
            const status = pass(code) ? 'success' : 'failure';
            resolve({
                pass: pass(code),
                message: () =>
                    this.utils.matcherErrorMessage(
                        matcherHint,
                        `${this.utils.RECEIVED_COLOR(
                            'received',
                        )} value indicates process ${status}`,
                        `Exit code: ${code}, signal: ${signal}`,
                    ),
            });
        });
    });
}

export interface ProcessMatchers {
    toSpawnSuccessfully(success?: boolean): Promise<void>;
}

export const processMatchers: MatchersFor<ProcessMatchers> = {
    toSpawnSuccessfully,
};
