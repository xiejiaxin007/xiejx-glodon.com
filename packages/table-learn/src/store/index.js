import Vue from 'vue';
import Watcher from './watcher';
import { arrayFind } from 'element-ui/src/utils/util';

Watcher.prototype.mutations = {
  // *表格出入data后，进行组装
  setData(states, data) {
    const dataInstanceChanged = states._data !== data;
    states._data = data;

    // TODO之后看
    this.execQuery();
    // 数据变化，更新部分数据。
    // 没有使用 computed，而是手动更新部分数据 https://github.com/vuejs/vue/issues/6660#issuecomment-331417140
    // TODO之后看
    this.updateCurrentRowData();
    // TODO之后看
    this.updateExpandRows();
    if (states.reserveSelection) {
      this.assertRowKey();
      this.updateSelectionByRowKey();
    } else {
      if (dataInstanceChanged) {
        this.clearSelection();
      } else {
        this.cleanSelection();
      }
    }
    this.updateAllSelected();

    this.updateTableScrollY();
  },
  /**
   * @description: 对table-column进行渲染
   * @param {Object} states 整个states数据对象，在apply的时候放进来的
   * @param {Object} column 当前column的属性数据对象
   * @param {Number} index 当前column应该在的索引位置
   * @param {Object} parent 当前column的父级对象，一般就是在column进行嵌套的时候会有值
   */
  insertColumn(states, column, index, parent) {
    let array = states._columns;
    // *这里巧妙利用数组的引用类型特点，如果是column嵌套，则给该column设置children属性
    if (parent) {
      array = parent.children;
      // !如果是column嵌套，则会将parent.children赋值给array进行column添加，这样同时就是给parent设置了一个children属性了
      if (!array) array = parent.children = [];
    }
    // !就是在这个地方！！！！把column的信息跟table打通了！！终于找到了
    // *el-table和el-table-column两个组件进行数据沟通，所以我们在el-table的store里面拿到了column的数据信息
    if (typeof index !== 'undefined') {
      array.splice(index, 0, column);
    } else {
      // TODO 这个地方不知道什么时候会触发
      array.push(column);
    }

    if (column.type === 'selection') {
      states.selectable = column.selectable;
      states.reserveSelection = column.reserveSelection;
    }

    if (this.table.$ready) {
      this.updateColumns(); // hack for dynamics insert column
      this.scheduleLayout();
    }
  },

  removeColumn(states, column, parent) {
    let array = states._columns;
    if (parent) {
      array = parent.children;
      if (!array) array = parent.children = [];
    }
    if (array) {
      array.splice(array.indexOf(column), 1);
    }

    if (this.table.$ready) {
      this.updateColumns(); // hack for dynamics remove column
      this.scheduleLayout();
    }
  },

  // *排序方法
  sort(states, options) {
    const { prop, order, init } = options;
    if (prop) {
      // *有对应的prop，才能进行排序动作
      const column = arrayFind(states.columns, column => column.property === prop);
      if (column) {
        column.order = order;
        // *更新sort对象属性
        this.updateSort(column, prop, order);
        this.commit('changeSortCondition', { init });
      }
    }
  },

  changeSortCondition(states, options) {
    // 修复 pr https://github.com/ElemeFE/element/pull/15012 导致的 bug
    const { sortingColumn: column, sortProp: prop, sortOrder: order } = states;
    if (order === null) {
      states.sortingColumn = null;
      states.sortProp = null;
    }
    const ingore = { filter: true };
    this.execQuery(ingore);

    // TODO后续继续看
    if (!options || !(options.silent || options.init)) {
      this.table.$emit('sort-change', {
        column,
        prop,
        order
      });
    }

    // TODO排序之后感觉不需要进行高度渲染啊？？
    this.updateTableScrollY();
  },

  filterChange(states, options) {
    let { column, values, silent } = options;
    // *生成filters，包括传入的filtered-value
    const newFilters = this.updateFilters(column, values);

    this.execQuery();

    // TODO 后续再看
    if (!silent) {
      this.table.$emit('filter-change', newFilters);
    }

    this.updateTableScrollY();
  },

  toggleAllSelection() {
    this.toggleAllSelection();
  },

  rowSelectedChanged(states, row) {
    this.toggleRowSelection(row);
    this.updateAllSelected();
  },

  setHoverRow(states, row) {
    states.hoverRow = row;
  },

  setCurrentRow(states, row) {
    this.updateCurrentRow(row);
  }
};
// this.store.commit('setData', value);
Watcher.prototype.commit = function(name, ...args) {
  const mutations = this.mutations;
  if (mutations[name]) {
    mutations[name].apply(this, [this.states].concat(args));
  } else {
    throw new Error(`Action not found: ${name}`);
  }
};

Watcher.prototype.updateTableScrollY = function() {
  Vue.nextTick(this.table.updateScrollY);
};

export default Watcher;
