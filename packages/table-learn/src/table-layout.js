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
    // *这儿实际是在计算当前浏览器的滚动条宽度
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
      // TODO 计算表格body高度，为啥+1？？？可能是有一个border？？
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
  // *更新表格列的宽度
  // !根据width和min-width来计算是否有滚动条，同时计算出来realwidth，表示实际要渲染的宽度（因为有时候可能就算你是设置了width，渲染出来可能不是你说的那个宽度，比如说列太多了又没有滚动条，那你设置的width大概率是不会正常渲染出来的）
  updateColumnsWidth() {
    if (Vue.prototype.$isServer) return;
    // *【props属性】列的宽度是否自撑开
    const fit = this.fit;
    // *clientWidth表示容器内部的宽度，包括padding，但是不包括border、margin和垂直滚动条的宽度
    const bodyWidth = this.table.$el.clientWidth;
    let bodyMinWidth = 0;

    // *打平数据结构，获取所有的column对象，如果有分组，也要将分组的加进来
    const flattenColumns = this.getFlattenColumns();
    // *找出width设置成不能转换为数字的column，比如不给width的时候，就是undefined，则这部分column需要做均分（flex）
    let flexColumns = flattenColumns.filter((column) => typeof column.width !== 'number');
    // TODO这一步不懂
    flattenColumns.forEach((column) => {
      if (typeof column.width === 'number' && column.realWidth) column.realWidth = null;
    });
    // *fit默认就是true，所以这里我们只看是否有column为设置width
    if (flexColumns.length > 0 && fit) {
      // *计算内容宽度
      flattenColumns.forEach((column) => {
        // !这里需要注意，不是只加入了width，还加入了minwidth，但是前面只判断了width，也就是后面为什么不是直接平分剩余宽度，而且需要加上minwidth
        bodyMinWidth += column.width || column.minWidth || 80;
      });

      // *判断如果有滚动条则设置滚动条宽度
      const scrollYWidth = this.scrollY ? this.gutterWidth : 0;
      // *没有横向滚动条的情况
      if (bodyMinWidth <= bodyWidth - scrollYWidth) {
        this.scrollX = false;

        // *这里是在计算没有设置width的column应该占的宽度
        const totalFlexWidth = bodyWidth - scrollYWidth - bodyMinWidth;
        if (flexColumns.length === 1) {
          // !只有一个没有设置width的column，宽度不是flex宽度，而需要再加80，因为前面计算剩余宽度的时候减去了（minwidth || 80）
          // *解答：因为前面计算剩余宽度的时候，减去了（minwidth || 80）
          flexColumns[0].realWidth = (flexColumns[0].minWidth || 80) + totalFlexWidth;
        } else {
          // *把所有没有设置宽度的column计算一个总宽度（如果有最小宽度则使用最小宽度，否则就给一个默认值）
          const allColumnsWidth = flexColumns.reduce((prev, column) => prev + (column.minWidth || 80), 0);
          // *计算出一个比例
          // !这里计算一个比例是因为，我们这个分支里面是没有滚动条的情况，没有滚动条则需要让没有设置width的column均分剩下的宽度
          const flexWidthPerPixel = totalFlexWidth / allColumnsWidth;
          let noneFirstWidth = 0;

          flexColumns.forEach((column, index) => {
            // *如果循环到第一个则跳出循环
            // TODO why第一个要单独搞，可能是因为下面计算宽度会出现小数，所以我们锁定一个column来给剩余width？？
            if (index === 0) return;
            const flexWidth = Math.floor((column.minWidth || 80) * flexWidthPerPixel);
            noneFirstWidth += flexWidth;
            column.realWidth = (column.minWidth || 80) + flexWidth;
          });
          // *第一列的宽度是最小宽度+剩下来的宽度
          // *可能是因为下面计算宽度会出现小数，所以我们锁定一个column来给剩余width，这样才能确保剩余的宽度被全部分完，否则肯定有小数被忽略了
          flexColumns[0].realWidth = (flexColumns[0].minWidth || 80) + totalFlexWidth - noneFirstWidth;
        }
      } else {
        // *有横向滚动条的情况
        this.scrollX = true;
        // *直接将minwidth赋值给realwidth，不需要计算均分什么的
        flexColumns.forEach(function(column) {
          // *这里直接赋值minwidth，如果用户设置了，则就是用设置的，否则会直接使用默认的80，因为table-column文件里面设置了最小宽度
          column.realWidth = column.minWidth;
        });
      }

      this.bodyWidth = Math.max(bodyMinWidth, bodyWidth);
      this.table.resizeState.width = this.bodyWidth;
    } else {
      // *如果设置fit为false，则表格不会自动撑开，而是直接根据设置的width来进行渲染，也不会进行剩余宽度均分
      flattenColumns.forEach((column) => {
        if (!column.width && !column.minWidth) {
          column.realWidth = 80;
        } else {
          column.realWidth = column.width || column.minWidth;
        }

        bodyMinWidth += column.realWidth;
      });
      // *这里就是完全根据设置的宽度来决定是否有横向滚动条了
      this.scrollX = bodyMinWidth > bodyWidth;

      this.bodyWidth = bodyMinWidth;
    }

    const fixedColumns = this.store.states.fixedColumns;

    // *如果有左固定列的逻辑处理
    if (fixedColumns.length > 0) {
      let fixedWidth = 0;
      fixedColumns.forEach(function(column) {
        // *这里会根据计算后的宽度来进行选取，所以把realwidth放前面，有值就不取width了
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

  // *添加observer，使用到的是table-header、table-body、table-footer，各自一个observer
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
