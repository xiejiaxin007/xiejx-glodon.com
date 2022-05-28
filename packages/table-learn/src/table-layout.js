import Vue from 'vue';
import scrollbarWidth from 'element-ui/src/utils/scrollbar-width';
import { parseHeight } from './util';

class TableLayout {
  constructor(options) {
    this.observers = [];
    this.table = null;
    this.store = null;
    this.columns = null;
    this.fit = true;
    this.showHeader = true;

    this.height = null;
    this.scrollX = false;
    this.scrollY = false;
    this.bodyWidth = null;
    this.fixedWidth = null;
    this.rightFixedWidth = null;
    this.tableHeight = null;
    this.headerHeight = 44; // Table Header Height
    this.appendHeight = 0; // Append Slot Height
    this.footerHeight = 44; // Table Footer Height
    this.viewportHeight = null; // Table Height - Scroll Bar Height
    this.bodyHeight = null; // Table Height - Table Header Height
    this.fixedBodyHeight = null; // Table Height - Table Header Height - Scroll Bar Height
    this.gutterWidth = scrollbarWidth();

    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name];
      }
    }

    if (!this.table) {
      throw new Error('table is required for Table Layout');
    }
    if (!this.store) {
      throw new Error('store is required for Table Layout');
    }
  }

  updateScrollY() {
    const height = this.height;
    // *如果没有传入height，则表示表格可以无限往下延伸，不需要渲染scrollY
    if (height === null) return false;
    const bodyWrapper = this.table.bodyWrapper;
    if (this.table.$el && bodyWrapper) {
      const body = bodyWrapper.querySelector('.el-table__body');
      const prevScrollY = this.scrollY;
      const scrollY = body.offsetHeight > this.bodyHeight;
      this.scrollY = scrollY;
      return prevScrollY !== scrollY;
    }
    return false;
  }

  setHeight(value, prop = 'height') {
    if (Vue.prototype.$isServer) return;
    const el = this.table.$el;
    value = parseHeight(value);
    this.height = value;

    if (!el && (value || value === 0)) return Vue.nextTick(() => this.setHeight(value, prop));

    if (typeof value === 'number') {
      el.style[prop] = value + 'px';
      this.updateElsHeight();
    } else if (typeof value === 'string') {
      el.style[prop] = value;
      this.updateElsHeight();
    }
  }

  setMaxHeight(value) {
    this.setHeight(value, 'max-height');
  }

  getFlattenColumns() {
    const flattenColumns = [];
    const columns = this.table.columns;
    columns.forEach((column) => {
      if (column.isColumnGroup) {
        flattenColumns.push.apply(flattenColumns, column.columns);
      } else {
        flattenColumns.push(column);
      }
    });

    return flattenColumns;
  }
  // *修改表格高度，渲染表格的整体高度
  updateElsHeight() {
    // *如果表格未渲染完成，则将这个方法放到下一个事件循环中
    if (!this.table.$ready) return Vue.nextTick(() => this.updateElsHeight());
    const { headerWrapper, appendWrapper, footerWrapper } = this.table.$refs;
    this.appendHeight = appendWrapper ? appendWrapper.offsetHeight : 0;

    if (this.showHeader && !headerWrapper) return;

    // fix issue (https://github.com/ElemeFE/element/pull/16956)
    const headerTrElm = headerWrapper ? headerWrapper.querySelector('.el-table__header tr') : null;
    const noneHeader = this.headerDisplayNone(headerTrElm);
    // *获取header的高度
    // *这里需要注意，三元表达式前面的表达式是一个赋值语句，所以这个表达式的结果应该是赋值语句右边计算的值！！！
    // *所以简单看，headerHeight的值就是根据showHeader的布尔值来判断的
    const headerHeight = this.headerHeight = !this.showHeader ? 0 : headerWrapper.offsetHeight;
    // *如果有应该有header，但是header还没有渲染完成，则将本次方法放入下一个事件循环中去
    if (this.showHeader && !noneHeader && headerWrapper.offsetWidth > 0 && (this.table.columns || []).length > 0 && headerHeight < 2) {
      return Vue.nextTick(() => this.updateElsHeight());
    }
    // *获取到header的高度
    const tableHeight = this.tableHeight = this.table.$el.clientHeight;
    const footerHeight = this.footerHeight = footerWrapper ? footerWrapper.offsetHeight : 0;
    if (this.height !== null) {
      // TODO 计算表格body高度，为啥+1？？？
      this.bodyHeight = tableHeight - headerHeight - footerHeight + (footerWrapper ? 1 : 0);
    }
    // * fixedBodyHeight和bodyHeight的区别就在于滚动条是否存在
    this.fixedBodyHeight = this.scrollX ? (this.bodyHeight - this.gutterWidth) : this.bodyHeight;

    const noData = !(this.store.states.data && this.store.states.data.length);
    // * 如果没有数据，则直接展示tb的clientHeight，如果有数据，则跟fixedHeight一样
    this.viewportHeight = this.scrollX ? tableHeight - (noData ? 0 : this.gutterWidth) : tableHeight;

    // *渲染水平滚动条，通过body实际高度跟视口高度的差别来判断是否需要y滚动条
    this.updateScrollY();
    // *如果水平可以滚动，则根据gutterWidth给出一个滚动条的宽度
    this.notifyObservers('scrollable');
  }
  headerDisplayNone(elm) {
    if (!elm) return true;
    let headerChild = elm;
    // *循环到获取div就会停止while循环
    while (headerChild.tagName !== 'DIV') {
      if (getComputedStyle(headerChild).display === 'none') {
        return true;
      }
      // *逐级向上查找
      headerChild = headerChild.parentElement;
    }
    return false;
  }
  updateColumnsWidth() {
    if (Vue.prototype.$isServer) return;
    // *【props属性】列的宽度是否自撑开
    const fit = this.fit;
    const bodyWidth = this.table.$el.clientWidth;
    let bodyMinWidth = 0;

    const flattenColumns = this.getFlattenColumns();
    let flexColumns = flattenColumns.filter((column) => typeof column.width !== 'number');

    flattenColumns.forEach((column) => { // Clean those columns whose width changed from flex to unflex
      if (typeof column.width === 'number' && column.realWidth) column.realWidth = null;
    });

    if (flexColumns.length > 0 && fit) {
      flattenColumns.forEach((column) => {
        bodyMinWidth += column.width || column.minWidth || 80;
      });

      const scrollYWidth = this.scrollY ? this.gutterWidth : 0;

      if (bodyMinWidth <= bodyWidth - scrollYWidth) { // DON'T HAVE SCROLL BAR
        this.scrollX = false;

        const totalFlexWidth = bodyWidth - scrollYWidth - bodyMinWidth;

        if (flexColumns.length === 1) {
          flexColumns[0].realWidth = (flexColumns[0].minWidth || 80) + totalFlexWidth;
        } else {
          const allColumnsWidth = flexColumns.reduce((prev, column) => prev + (column.minWidth || 80), 0);
          const flexWidthPerPixel = totalFlexWidth / allColumnsWidth;
          let noneFirstWidth = 0;

          flexColumns.forEach((column, index) => {
            if (index === 0) return;
            const flexWidth = Math.floor((column.minWidth || 80) * flexWidthPerPixel);
            noneFirstWidth += flexWidth;
            column.realWidth = (column.minWidth || 80) + flexWidth;
          });

          flexColumns[0].realWidth = (flexColumns[0].minWidth || 80) + totalFlexWidth - noneFirstWidth;
        }
      } else { // HAVE HORIZONTAL SCROLL BAR
        this.scrollX = true;
        flexColumns.forEach(function(column) {
          column.realWidth = column.minWidth;
        });
      }

      this.bodyWidth = Math.max(bodyMinWidth, bodyWidth);
      this.table.resizeState.width = this.bodyWidth;
    } else {
      flattenColumns.forEach((column) => {
        if (!column.width && !column.minWidth) {
          column.realWidth = 80;
        } else {
          column.realWidth = column.width || column.minWidth;
        }

        bodyMinWidth += column.realWidth;
      });
      this.scrollX = bodyMinWidth > bodyWidth;

      this.bodyWidth = bodyMinWidth;
    }

    const fixedColumns = this.store.states.fixedColumns;

    if (fixedColumns.length > 0) {
      let fixedWidth = 0;
      fixedColumns.forEach(function(column) {
        fixedWidth += column.realWidth || column.width;
      });

      this.fixedWidth = fixedWidth;
    }

    const rightFixedColumns = this.store.states.rightFixedColumns;
    if (rightFixedColumns.length > 0) {
      let rightFixedWidth = 0;
      rightFixedColumns.forEach(function(column) {
        rightFixedWidth += column.realWidth || column.width;
      });

      this.rightFixedWidth = rightFixedWidth;
    }

    this.notifyObservers('columns');
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }
  // scrollable
  notifyObservers(event) {
    const observers = this.observers;
    observers.forEach((observer) => {
      switch (event) {
        case 'columns':
          observer.onColumnsChange(this);
          break;
        case 'scrollable':
          observer.onScrollableChange(this);
          break;
        default:
          throw new Error(`Table Layout don't have event ${event}.`);
      }
    });
  }
}

export default TableLayout;
