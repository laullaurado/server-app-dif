/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/workbench/contrib/audioCues/browser/observable"], function (require, exports, arrays_1, errors_1, lifecycle_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.leftJoin = exports.applyObservableDecorations = exports.setStyle = exports.n = exports.ReentrancyBarrier = void 0;
    class ReentrancyBarrier {
        constructor() {
            this.isActive = false;
        }
        makeExclusive(fn) {
            return ((...args) => {
                if (this.isActive) {
                    return;
                }
                this.isActive = true;
                try {
                    return fn(...args);
                }
                finally {
                    this.isActive = false;
                }
            });
        }
        runExclusively(fn) {
            if (this.isActive) {
                return;
            }
            this.isActive = true;
            try {
                fn();
            }
            finally {
                this.isActive = false;
            }
        }
        runExclusivelyOrThrow(fn) {
            if (this.isActive) {
                throw new errors_1.BugIndicatingError();
            }
            this.isActive = true;
            try {
                fn();
            }
            finally {
                this.isActive = false;
            }
        }
    }
    exports.ReentrancyBarrier = ReentrancyBarrier;
    function n(tag, ...args) {
        let attributes;
        let children;
        if (Array.isArray(args[0])) {
            attributes = {};
            children = args[0];
        }
        else {
            attributes = args[0] || {};
            children = args[1];
        }
        const [tagName, className] = tag.split('.');
        const el = document.createElement(tagName);
        if (className) {
            el.className = className;
        }
        const result = {};
        if (children) {
            for (const c of children) {
                if (c instanceof HTMLElement) {
                    el.appendChild(c);
                }
                else if (typeof c === 'string') {
                    el.append(c);
                }
                else {
                    Object.assign(result, c);
                    el.appendChild(c.root);
                }
            }
        }
        for (const [key, value] of Object.entries(attributes)) {
            if (key === '$') {
                result[value] = el;
                continue;
            }
            el.setAttribute(key, value);
        }
        result['root'] = el;
        return result;
    }
    exports.n = n;
    function setStyle(element, style) {
        Object.entries(style).forEach(([key, value]) => {
            element.style.setProperty(key, toSize(value));
        });
    }
    exports.setStyle = setStyle;
    function toSize(value) {
        return typeof value === 'number' ? `${value}px` : value;
    }
    function applyObservableDecorations(editor, decorations) {
        const d = new lifecycle_1.DisposableStore();
        let decorationIds = [];
        d.add((0, observable_1.autorun)(reader => {
            const d = decorations.read(reader);
            editor.changeDecorations(a => {
                decorationIds = a.deltaDecorations(decorationIds, d);
            });
        }, 'Update Decorations'));
        d.add({
            dispose: () => {
                editor.changeDecorations(a => {
                    decorationIds = a.deltaDecorations(decorationIds, []);
                });
            }
        });
        return d;
    }
    exports.applyObservableDecorations = applyObservableDecorations;
    function* leftJoin(left, right, compare) {
        const rightQueue = new arrays_1.ArrayQueue(right);
        for (const leftElement of left) {
            rightQueue.takeWhile(rightElement => arrays_1.CompareResult.isGreaterThan(compare(leftElement, rightElement)));
            const equals = rightQueue.takeWhile(rightElement => arrays_1.CompareResult.isNeitherLessOrGreaterThan(compare(leftElement, rightElement)));
            yield { left: leftElement, rights: equals || [] };
        }
    }
    exports.leftJoin = leftJoin;
});
//# sourceMappingURL=utils.js.map