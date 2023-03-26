"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortDirection = exports.LogicalOperator = exports.FilterOperator = void 0;
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["IS_EQUAL_TO"] = "$eq";
    FilterOperator["IS_EQUAL_TO_CASE_INSENSITIVE"] = "$eqi";
    FilterOperator["IS_NOT_EQUAL_TO"] = "$ne";
    FilterOperator["IS_LESS_THAN"] = "$lt";
    FilterOperator["IS_LESS_THAN_OR_EQUAL_TO"] = "$lte";
    FilterOperator["IS_GREATER_THAN"] = "$gt";
    FilterOperator["IS_GREATER_THAN_OR_EQUAL_TO"] = "$gte";
    FilterOperator["IN"] = "$in";
    FilterOperator["NOT_IN"] = "$notIn";
    FilterOperator["CONTAINS"] = "$contains";
    FilterOperator["NOT_CONTAINS"] = "$notContains";
    FilterOperator["CONTAINS_CASE_INSENSITIVE"] = "$containsi";
    FilterOperator["NOT_CONTAINS_CASE_INSENSITIVE"] = "$notContainsi";
    FilterOperator["IS_NULL"] = "$null";
    FilterOperator["IS_NOT_NULL"] = "$notNull";
    FilterOperator["IS_BETWEEN"] = "$between";
    FilterOperator["STARTS_WITH"] = "$startsWith";
    FilterOperator["STARTS_WITH_CASE_INSENSITIVE"] = "$startsWithi";
})(FilterOperator = exports.FilterOperator || (exports.FilterOperator = {}));
var LogicalOperator;
(function (LogicalOperator) {
    LogicalOperator["AND"] = "and";
    LogicalOperator["OR"] = "or";
    LogicalOperator["BOTH"] = "both";
    LogicalOperator["NONE"] = "none";
})(LogicalOperator = exports.LogicalOperator || (exports.LogicalOperator = {}));
var SortDirection;
(function (SortDirection) {
    SortDirection[SortDirection["ASC"] = 0] = "ASC";
    SortDirection[SortDirection["DESC"] = 1] = "DESC";
})(SortDirection = exports.SortDirection || (exports.SortDirection = {}));
