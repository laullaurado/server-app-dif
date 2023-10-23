/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersContextKeys = exports.Markers = exports.MarkersViewMode = void 0;
    var MarkersViewMode;
    (function (MarkersViewMode) {
        MarkersViewMode["Table"] = "table";
        MarkersViewMode["Tree"] = "tree";
    })(MarkersViewMode = exports.MarkersViewMode || (exports.MarkersViewMode = {}));
    var Markers;
    (function (Markers) {
        Markers.MARKERS_CONTAINER_ID = 'workbench.panel.markers';
        Markers.MARKERS_VIEW_ID = 'workbench.panel.markers.view';
        Markers.MARKERS_VIEW_STORAGE_ID = 'workbench.panel.markers';
        Markers.MARKER_COPY_ACTION_ID = 'problems.action.copy';
        Markers.MARKER_COPY_MESSAGE_ACTION_ID = 'problems.action.copyMessage';
        Markers.RELATED_INFORMATION_COPY_MESSAGE_ACTION_ID = 'problems.action.copyRelatedInformationMessage';
        Markers.FOCUS_PROBLEMS_FROM_FILTER = 'problems.action.focusProblemsFromFilter';
        Markers.MARKERS_VIEW_FOCUS_FILTER = 'problems.action.focusFilter';
        Markers.MARKERS_VIEW_CLEAR_FILTER_TEXT = 'problems.action.clearFilterText';
        Markers.MARKERS_VIEW_SHOW_MULTILINE_MESSAGE = 'problems.action.showMultilineMessage';
        Markers.MARKERS_VIEW_SHOW_SINGLELINE_MESSAGE = 'problems.action.showSinglelineMessage';
        Markers.MARKER_OPEN_ACTION_ID = 'problems.action.open';
        Markers.MARKER_OPEN_SIDE_ACTION_ID = 'problems.action.openToSide';
        Markers.MARKER_SHOW_PANEL_ID = 'workbench.action.showErrorsWarnings';
        Markers.MARKER_SHOW_QUICK_FIX = 'problems.action.showQuickFixes';
        Markers.TOGGLE_MARKERS_VIEW_ACTION_ID = 'workbench.actions.view.toggleProblems';
    })(Markers = exports.Markers || (exports.Markers = {}));
    var MarkersContextKeys;
    (function (MarkersContextKeys) {
        MarkersContextKeys.MarkersViewModeContextKey = new contextkey_1.RawContextKey('problemsViewMode', "tree" /* MarkersViewMode.Tree */);
        MarkersContextKeys.MarkersViewSmallLayoutContextKey = new contextkey_1.RawContextKey(`problemsView.smallLayout`, false);
        MarkersContextKeys.MarkersTreeVisibilityContextKey = new contextkey_1.RawContextKey('problemsVisibility', false);
        MarkersContextKeys.MarkerFocusContextKey = new contextkey_1.RawContextKey('problemFocus', false);
        MarkersContextKeys.MarkerViewFilterFocusContextKey = new contextkey_1.RawContextKey('problemsFilterFocus', false);
        MarkersContextKeys.RelatedInformationFocusContextKey = new contextkey_1.RawContextKey('relatedInformationFocus', false);
    })(MarkersContextKeys = exports.MarkersContextKeys || (exports.MarkersContextKeys = {}));
});
//# sourceMappingURL=markers.js.map