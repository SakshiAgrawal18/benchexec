// This file is part of BenchExec, a framework for reliable benchmarking:
// https://github.com/sosy-lab/benchexec
//
// SPDX-FileCopyrightText: 2019-2020 Dirk Beyer <https://www.sosy-lab.org>
//
// SPDX-License-Identifier: Apache-2.0

import React from "react";

const emptyStateValue = "##########";

const prepareTableData = ({ head, tools, rows, stats, props }) => {
  return {
    tableHeader: head,
    tools: tools.map((tool, idx) => ({
      ...tool,
      toolIdx: idx,
      columns: tool.columns.map((column, idx) => ({
        ...column,
        colIdx: idx,
      })),
    })),
    columns: tools.map((tool) => tool.columns.map((column) => column.title)),
    table: rows,
    stats: stats,
    properties: props,
  };
};

const isNumericColumn = (column) =>
  column.type === "count" || column.type === "measure";

const isNil = (data) => data === undefined || data === null;

const getRawOrDefault = (value, def) =>
  isNil(value) || isNil(value.raw) ? def : value.raw;

const numericSortMethod = (a, b) => {
  const aValue = getRawOrDefault(a, +Infinity);
  const bValue = getRawOrDefault(b, +Infinity);
  return aValue - bValue;
};

const textSortMethod = (a, b) => {
  const aValue = getRawOrDefault(a, "").toLowerCase();
  const bValue = getRawOrDefault(b, "").toLowerCase();
  if (aValue === "") {
    return 1;
  }
  if (bValue === "") {
    return -1;
  }
  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
};

const isOkStatus = (status) => {
  return status === 0 || status === 200;
};

const omit = (keys, data) => {
  const newKeys = Object.keys(data).filter((key) => !keys.includes(key));
  return newKeys.reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {});
};

const without = (value, array) => {
  const out = [];
  for (const item of array) {
    if (item !== value) {
      out.push(item);
    }
  }
  return out;
};

// Best-effort attempt for calculating a meaningful column width
const determineColumnWidth = (column, min_width, max_width) => {
  let width = column.max_width; // number of chars in column
  if (min_width) {
    width = Math.max(width, min_width);
  }
  if (max_width) {
    width = Math.min(width, max_width);
  }
  if (!width) {
    width = 10;
  }

  return width * 8 + 20;
};

const path = (pathArr, data) => {
  let last = data;
  for (const p of pathArr) {
    last = last[p];
    if (isNil(last)) {
      return undefined;
    }
  }
  return last;
};

const pathOr = (pathArr, fallback, data) => {
  const pathRes = path(pathArr, data);

  return pathRes === undefined ? fallback : pathRes;
};

const formatColumnTitle = (column) =>
  column.unit ? (
    <>
      {column.display_title}
      <br />
      {`(${column.unit})`}
    </>
  ) : (
    column.display_title
  );

const getRunSetName = ({ tool, date, niceName }) => {
  return `${tool} ${date} ${niceName}`;
};

// Extended color list copied from
// https://github.com/uber/react-vis/blob/712ea622cf12f17bcc38bd6143fe6d22d530cbce/src/theme.js#L29-L51
// as advised in https://github.com/uber/react-vis/issues/872#issuecomment-404915958
const EXTENDED_DISCRETE_COLOR_RANGE = [
  "#19CDD7",
  "#DDB27C",
  "#88572C",
  "#FF991F",
  "#F15C17",
  "#223F9A",
  "#DA70BF",
  "#125C77",
  "#4DC19C",
  "#776E57",
  "#12939A",
  "#17B8BE",
  "#F6D18A",
  "#B7885E",
  "#FFCB99",
  "#F89570",
  "#829AE3",
  "#E79FD5",
  "#1E96BE",
  "#89DAC1",
  "#B3AD9E",
];

/**
 *
 * @param {String} [str]
 */
const getHashSearch = (str) => {
  const urlParts = (str || decodeURI(document.location.href)).split("?");
  const search = urlParts.length > 1 ? urlParts[1] : undefined;
  if (search === undefined || search.length === 0) {
    return {};
  }
  const keyValuePairs = search.split("&").map((i) => i.split("="));

  const out = {};
  for (const [key, value] of keyValuePairs) {
    out[key] = value;
  }
  return out;
};

/**
 *
 * @param {Object} params Object containing the params to be encoded as query params
 * @param {Boolean} [returnString] if true, only returns the url without setting it
 */
const setHashSearch = (
  params = {},
  options = { returnString: false, baseUrl: null },
) => {
  const optionTemplate = { returnString: false, baseUrl: null };
  const { returnString, baseUrl } = { ...optionTemplate, ...options };
  const url = (baseUrl || document.location.href).split("?")[0];
  const pairs = Object.keys(params).map((key) => `${key}=${params[key]}`);
  const searchString = `?${pairs.join("&")}`;
  const hrefString = encodeURI(`${url}${searchString}`);
  if (returnString) {
    return hrefString;
  }
  document.location.href = hrefString;
};

/**
 * Adds or update given key-value pairs to the query params
 *
 * @param {Object} param The Key-Value pair to be added to the current query param list
 */
const setParam = (param) => {
  setHashSearch({ ...getHashSearch(), ...param });
};

const stringAsBoolean = (str) => str === "true";

const deepEquals = (a, b) => {
  for (const key in a) {
    if (typeof a[key] === "function" && typeof b[key] === "function") {
      continue;
    }
    if (typeof a[key] !== typeof b[key]) {
      return false;
    } else if (Array.isArray(a[key]) || typeof a[key] === "object") {
      if (!deepEquals(a[key], b[key])) {
        return false;
      }
    } else {
      if (a[key] !== b[key]) {
        console.log(`${a[key]} !== ${b[key]}`);
        return false;
      }
    }
  }
  return true;
};

// TODO Add extraction of human-readable task id part names once they are being exported from python
/**
 * Function to extract the names of the task id parts and to provide a mapping for filtering.
 *
 * @param {*} rows - the rows array of the dataset
 */
const getTaskIdParts = (rows) =>
  pathOr(["0", "id"], [], rows).reduce(
    (acc, curr, idx) => ({ ...acc, [idx]: curr }),
    {},
  );

/**
 * Builds and configures a formatting function that can format a number based on
 * the significant digits of the dataset for its column.
 * If whitespaceFormat in the returned function is set to true, the number will be
 * whitespace formatted as described on Page 24 in
 * https://www.sosy-lab.org/research/pub/2019-STTT.Reliable_Benchmarking_Requirements_and_Solutions.pdf
 *
 * @param {Number} significantDigits - Number of significant digits for this column
 */
class NumberFormatterBuilder {
  constructor(significantDigits) {
    this.significantDigits = significantDigits;
    this.maxPositiveDecimalPosition = -1;
    this.maxNegativeDecimalPosition = -1;
  }

  addDataItem(item) {
    const [positive, negative] = item.split(/\.|,/);
    this.maxPositiveDecimalPosition = Math.max(
      this.maxPositiveDecimalPosition,
      positive ? positive.length : 0,
    );
    this.maxNegativeDecimalPosition = Math.max(
      this.maxNegativeDecimalPosition,
      negative ? negative.length : 0,
    );
  }

  build() {
    return (number, whitespaceFormat = false) => {
      let significantPart = "";
      let addedNumbers = 0;
      let numsBeforeDecimal = 0;
      let positive = true;
      let foundFirstNonNull = false;
      for (const num of number) {
        const isDecimalPoint = num === "." || num === ",";
        if (isDecimalPoint) {
          positive = false;
          significantPart += ".";
          continue;
        }
        significantPart += num;
        if (num !== "0") {
          if (!foundFirstNonNull) {
            foundFirstNonNull = true;
          }
        }
        if (foundFirstNonNull) {
          if (positive) {
            numsBeforeDecimal += 1;
          }
          addedNumbers += 1;
        }
        if (!positive && addedNumbers >= this.significantDigits) {
          break;
        }
      }
      if (!numsBeforeDecimal) {
        significantPart = `.${significantPart.split(/\.|,/)[1]}`;
      }

      if (whitespaceFormat) {
        const [positivePart, negativePart] = significantPart.split(/\.|,/);
        const deltaNeg =
          this.maxNegativeDecimalPosition -
          (negativePart ? negativePart.length : 0);
        const deltaPos =
          this.maxPositiveDecimalPosition -
          (positivePart ? positivePart.length : 0);

        const spacesPositive = " ".repeat(deltaPos);
        let spacesNegative = " ".repeat(deltaNeg);
        if (positive) {
          spacesNegative += " "; // in case we don't have a decimal point
        }
        significantPart = `${spacesPositive}${significantPart}${spacesNegative}`;
      }

      return significantPart;
    };
  }
}
/**
 * Creates an object with an entry for each of the tools, identified by the index of the tool, that stores the hidden columns defined in the URL.
 * Each property contains an array of integers which represent the indexes of the columns of the corresponding runset that will be hidden.
 */
const createHiddenColsFromURL = (tools) => {
  const urlParams = getHashSearch();
  // Object containing all hidden runsets from the URL (= param "hidden")
  let hiddenTools = [];
  if (urlParams.hidden) {
    hiddenTools = urlParams.hidden
      .split(",")
      .filter(
        (hiddenTool) =>
          Number.isInteger(parseInt(hiddenTool)) &&
          tools.some((tool) => tool.toolIdx === parseInt(hiddenTool)),
      )
      .map((hiddenTool) => parseInt(hiddenTool));
  }

  // Object containing all hidden columns from the URL with an individual entry for each runset (= params of the form "hiddenX" for runset X)
  const hiddenCols = {};
  const hiddenParams = Object.keys(urlParams).filter((param) =>
    /hidden[0-9]+/.test(param),
  );
  hiddenParams.forEach((hiddenParam) => {
    const toolIdx = parseInt(hiddenParam.replace("hidden", ""));
    const tool = tools.find((tool) => tool.toolIdx === toolIdx);
    if (Number.isInteger(toolIdx) && tool) {
      hiddenCols[toolIdx] = urlParams[hiddenParam]
        .split(",")
        .filter(
          (hiddenCol) =>
            Number.isInteger(parseInt(hiddenCol)) &&
            tool.columns.some((col) => col.colIdx === parseInt(hiddenCol)),
        )
        .map((col) => parseInt(col));
    }
  });

  // Set all columns of a hidden runset to hidden
  hiddenTools.forEach((hiddenToolIdx) => {
    hiddenCols[hiddenToolIdx] = tools
      .find((tool) => tool.toolIdx === hiddenToolIdx)
      .columns.map((column) => column.colIdx);
  });

  // Leave hidden columns for not mentioned tools empty
  tools.forEach((tool) => {
    if (!hiddenCols[tool.toolIdx]) {
      hiddenCols[tool.toolIdx] = [];
    }
  });

  return hiddenCols;
};

/**
 * Returns the index of the first runset that has a column that is not hidden and not of the type status, as well as the index
 * of the corresponding column. In case there is no such column, returns the index of the first runset that has a status column
 * that is not hidden, as well as the index of this column. In case there is also no such column, i.e. all columns of all runsets
 * are hidden, returns undefined for those values.
 **/
const getFirstVisibles = (tools, hiddenCols) => {
  let visibleCol;
  let visibleTool = tools.find((tool) => {
    visibleCol = tool.columns.find(
      (col) =>
        col.type !== "status" && !hiddenCols[tool.toolIdx].includes(col.colIdx),
    );
    return visibleCol;
  });

  if (!visibleCol) {
    visibleTool = tools.find(
      (tool) =>
        (visibleCol = tool.columns.find(
          (col) =>
            col.type === "status" &&
            !hiddenCols[tool.toolIdx].includes(col.colIdx),
        )),
    );
  }

  return visibleTool && visibleCol
    ? [visibleTool.toolIdx, visibleCol.colIdx]
    : [undefined, undefined];
};

/**
 * Checks if all distinct elements of the data param also
 * exist in the compare param.
 * Only to be used with primitives. Objects will be compared by reference.
 *
 *
 * @param {Any[]} compare The array to compare elements to
 * @param {Any[]} data The array to check
 */
const hasSameEntries = (compare, data) => {
  const compareObj = {};

  for (const elem of compare) {
    compareObj[elem] = true;
  }
  for (const elem of data) {
    if (isNil(compareObj[elem])) {
      return false;
    }
  }

  return true;
};

export {
  prepareTableData,
  getRawOrDefault,
  isNumericColumn,
  numericSortMethod,
  textSortMethod,
  determineColumnWidth,
  formatColumnTitle,
  getRunSetName,
  isOkStatus,
  isNil,
  EXTENDED_DISCRETE_COLOR_RANGE,
  getHashSearch,
  setHashSearch,
  setParam,
  createHiddenColsFromURL,
  stringAsBoolean,
  without,
  pathOr,
  path,
  omit,
  deepEquals,
  NumberFormatterBuilder,
  emptyStateValue,
  getTaskIdParts,
  getFirstVisibles,
  hasSameEntries,
};
