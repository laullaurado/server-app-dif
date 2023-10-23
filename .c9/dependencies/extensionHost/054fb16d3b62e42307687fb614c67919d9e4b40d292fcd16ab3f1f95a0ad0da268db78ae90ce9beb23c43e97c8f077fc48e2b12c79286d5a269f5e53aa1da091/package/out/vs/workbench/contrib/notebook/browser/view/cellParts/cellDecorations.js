/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellDecorations = void 0;
    class CellDecorations extends cellPart_1.CellPart {
        constructor(rootContainer, decorationContainer) {
            super();
            this.rootContainer = rootContainer;
            this.decorationContainer = decorationContainer;
        }
        didRenderCell(element) {
            const removedClassNames = [];
            this.rootContainer.classList.forEach(className => {
                if (/^nb\-.*$/.test(className)) {
                    removedClassNames.push(className);
                }
            });
            removedClassNames.forEach(className => {
                this.rootContainer.classList.remove(className);
            });
            this.decorationContainer.innerText = '';
            const generateCellTopDecorations = () => {
                this.decorationContainer.innerText = '';
                element.getCellDecorations().filter(options => options.topClassName !== undefined).forEach(options => {
                    this.decorationContainer.append(DOM.$(`.${options.topClassName}`));
                });
            };
            this.cellDisposables.add(element.onCellDecorationsChanged((e) => {
                const modified = e.added.find(e => e.topClassName) || e.removed.find(e => e.topClassName);
                if (modified) {
                    generateCellTopDecorations();
                }
            }));
            generateCellTopDecorations();
        }
    }
    exports.CellDecorations = CellDecorations;
});
//# sourceMappingURL=cellDecorations.js.map