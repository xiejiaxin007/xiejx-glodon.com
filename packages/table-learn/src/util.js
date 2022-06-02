import { getValueByPath } from 'element-ui/src/utils/util';

export const getCell = function(event) {
  let cell = event.target;

  while (cell && cell.tagName.toUpperCase() !== 'HTML') {
    if (cell.tagName.toUpperCase() === 'TD') {
      return cell;
    }
    cell = cell.parentNode;
  }

  return null;
};

const isObject = function(obj) {
  return obj !== null && typeof obj === 'object';
};

// *根据传入的排序方式进行排序，返回排序完成后的数据
export const orderBy = function(array, sortKey, reverse, sortMethod, sortBy) {
  // *如果都没有排序规则，则直接返回数据即可
  if (!sortKey && !sortMethod && (!sortBy || Array.isArray(sortBy) && !sortBy.length)) {
    return array;
  }
  // *如果是在渲染默认排序，则reverse就是一个string，表示默认排序的order
  if (typeof reverse === 'string') {
    // *-1表示降序，1表示升序
    reverse = reverse === 'descending' ? -1 : 1;
  } else {
    // TODO还没有看到这种情况
    reverse = (reverse && reverse < 0) ? -1 : 1;
  }
  // *sortMthod表示排序方法，自定义排序，用法和Array.sort比较像
  // *这里的判断是因为如果我们设置了sort-method，则sort-by属性就是失效状态，所以我们需要优先判断，是否设置了sort-method属性
  // !这个方法是拿来获取需要排序的prop对应的value值的，拿到这个value值之后进行一个排序
  const getKey = sortMethod ? null : function(value, index) {
    // *设置了sort-by的情况下
    // *在这里我们可以看到排序的规则取值顺序：sort-mothod、sort-by、
    if (sortBy) {
      if (!Array.isArray(sortBy)) {
        sortBy = [sortBy];
      }
      return sortBy.map(function(by) {
        if (typeof by === 'string') {
          return getValueByPath(value, by);
        } else {
          // *可能sort-by传入的是一个function，所以就直接将执行结果返回即可
          // TODO这个地方返回的可能是内层的对象
          return by(value, index, array);
        }
      });
    }
    // *sort-key在默认排序的情况下是传入的那个prop
    // TODO目前还不清楚这个$key是啥意思
    if (sortKey !== '$key') {
      // TODO $value
      if (isObject(value) && '$value' in value) value = value.$value;
    }
    return [isObject(value) ? getValueByPath(value, sortKey) : value];
  };
  const compare = function(a, b) {
    // *sortmethod写法和sort一样，所以可以直接返回执行后的返回值
    if (sortMethod) {
      return sortMethod(a.value, b.value);
    }
    // !这个地方挺好，巧妙
    // *排序的规则prop可能是多个，所以会进行循环，只要匹配到下面两种情况就立马返回，这样可以做到靠前的prop优先级更高
    for (let i = 0, len = a.key.length; i < len; i++) {
      if (a.key[i] < b.key[i]) {
        return -1;
      }
      if (a.key[i] > b.key[i]) {
        return 1;
      }
    }
    return 0;
  };
  return array.map(function(value, index) {
    return {
      value: value,
      index: index,
      key: getKey ? getKey(value, index) : null
    };
  }).sort(function(a, b) {
    let order = compare(a, b);
    if (!order) {
      // make stable https://en.wikipedia.org/wiki/Sorting_algorithm#Stability
      order = a.index - b.index;
    }
    // *相乘可以根据用户给的排序方式进行逆转
    return order * reverse;
  }).map(item => item.value);
};

export const getColumnById = function(table, columnId) {
  let column = null;
  table.columns.forEach(function(item) {
    if (item.id === columnId) {
      column = item;
    }
  });
  return column;
};

export const getColumnByKey = function(table, columnKey) {
  let column = null;
  for (let i = 0; i < table.columns.length; i++) {
    const item = table.columns[i];
    if (item.columnKey === columnKey) {
      column = item;
      break;
    }
  }
  return column;
};

export const getColumnByCell = function(table, cell) {
  const matches = (cell.className || '').match(/el-table_[^\s]+/gm);
  if (matches) {
    return getColumnById(table, matches[0]);
  }
  return null;
};

export const getRowIdentity = (row, rowKey) => {
  if (!row) throw new Error('row is required when get row identity');
  if (typeof rowKey === 'string') {
    if (rowKey.indexOf('.') < 0) {
      return row[rowKey];
    }
    let key = rowKey.split('.');
    let current = row;
    for (let i = 0; i < key.length; i++) {
      current = current[key[i]];
    }
    return current;
  } else if (typeof rowKey === 'function') {
    return rowKey.call(null, row);
  }
};

export const getKeysMap = function(array, rowKey) {
  const arrayMap = {};
  (array || []).forEach((row, index) => {
    arrayMap[getRowIdentity(row, rowKey)] = { row, index };
  });
  return arrayMap;
};

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
/**
 * @description: 合并两个对象，为空的时候不做合并
 * @param 合并的主对象
 * @param 往其他对象合并的对象，如果这个对象里头有undefined，则不往人家里头合并
 * @return 合并完成后的对象
 */
export function mergeOptions(defaults, config) {
  const options = {};
  let key;
  for (key in defaults) {
    options[key] = defaults[key];
  }
  for (key in config) {
    if (hasOwn(config, key)) {
      const value = config[key];
      if (typeof value !== 'undefined') {
        options[key] = value;
      }
    }
  }
  return options;
}
// *获取传入值的数字部分
export function parseWidth(width) {
  if (width !== undefined) {
    // *parseInt有一个特殊的情况在于，会最大限度将传入的值转换为数字，如果从第一个字符串就数字类型，则会在第一个不是数字类型字符串地方停止，比如‘12aa’会被转换为12
    // *这个地方主要就是把width属性转入的值转换为数字类型
    width = parseInt(width, 10);
    if (isNaN(width)) {
      width = null;
    }
  }
  return width;
}

export function parseMinWidth(minWidth) {
  if (typeof minWidth !== 'undefined') {
    minWidth = parseWidth(minWidth);
    if (isNaN(minWidth)) {
      minWidth = 80;
    }
  }
  return minWidth;
};

export function parseHeight(height) {
  if (typeof height === 'number') {
    return height;
  }
  if (typeof height === 'string') {
    if (/^\d+(?:px)?$/.test(height)) {
      return parseInt(height, 10);
    } else {
      return height;
    }
  }
  return null;
}

// https://github.com/reduxjs/redux/blob/master/src/compose.js
export function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

export function toggleRowStatus(statusArr, row, newVal) {
  let changed = false;
  const index = statusArr.indexOf(row);
  const included = index !== -1;

  const addRow = () => {
    statusArr.push(row);
    changed = true;
  };
  const removeRow = () => {
    statusArr.splice(index, 1);
    changed = true;
  };

  if (typeof newVal === 'boolean') {
    if (newVal && !included) {
      addRow();
    } else if (!newVal && included) {
      removeRow();
    }
  } else {
    if (included) {
      removeRow();
    } else {
      addRow();
    }
  }
  return changed;
}

export function walkTreeNode(root, cb, childrenKey = 'children', lazyKey = 'hasChildren') {
  const isNil = (array) => !(Array.isArray(array) && array.length);

  function _walker(parent, children, level) {
    cb(parent, children, level);
    children.forEach(item => {
      if (item[lazyKey]) {
        cb(item, null, level + 1);
        return;
      }
      const children = item[childrenKey];
      if (!isNil(children)) {
        _walker(item, children, level + 1);
      }
    });
  }

  root.forEach(item => {
    if (item[lazyKey]) {
      cb(item, null, 0);
      return;
    }
    const children = item[childrenKey];
    if (!isNil(children)) {
      _walker(item, children, 0);
    }
  });
}
