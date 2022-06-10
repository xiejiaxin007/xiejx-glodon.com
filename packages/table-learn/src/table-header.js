import Vue from 'vue';
import { hasClass, addClass, removeClass } from 'element-ui/src/utils/dom';
import ElCheckbox from 'element-ui/packages/checkbox';
import FilterPanel from './filter-panel.vue';
import LayoutObserver from './layout-observer';
import { mapStates } from './store/helper';
// *打平column
const getAllColumns = (columns) => {
  const result = [];
  columns.forEach((column) => {
    if (column.children) {
      result.push(column);
      result.push.apply(result, getAllColumns(column.children));
    } else {
      result.push(column);
    }
  });
  return result;
};
// *将列数据转换为行数据，用于循环render函数中的th标签
const convertToRows = (originColumns) => {
  let maxLevel = 1;
  const traverse = (column, parent) => {
    // *多级表头的话，需要计算表头深度
    if (parent) {
      column.level = parent.level + 1;
      if (maxLevel < column.level) {
        maxLevel = column.level;
      }
    }
    // *多级表头需要计算colspan，横跨列的数量
    if (column.children) {
      let colSpan = 0;
      column.children.forEach((subColumn) => {
        traverse(subColumn, column);
        colSpan += subColumn.colSpan;
      });
      column.colSpan = colSpan;
    } else {
      column.colSpan = 1;
    }
  };
  originColumns.forEach((column) => {
    column.level = 1;
    traverse(column);
  });
  const rows = [];
  for (let i = 0; i < maxLevel; i++) {
    rows.push([]);
  }
  const allColumns = getAllColumns(originColumns);
  // *多级表头需要计算rowspan，横跨行的数量
  allColumns.forEach((column) => {
    if (!column.children) {
      column.rowSpan = maxLevel - column.level + 1;
    } else {
      column.rowSpan = 1;
    }
    rows[column.level - 1].push(column);
  });
  return rows;
};
export default {
  name: 'ElTableHeader',
  mixins: [LayoutObserver],
  render(h) {
    // *originColumns应该是原本的column，没有区分固定的区分
    // *columns应该是所有数据中的列表，包括了如果有子列，也在里头
    const originColumns = this.store.states.originColumns;
    // *将所有列都放入到一个一维数组中，词义：将列转换为行
    const columnRows = convertToRows(originColumns, this.columns);
    // *是否拥有多级表头
    const isGroup = columnRows.length > 1;
    if (isGroup) this.$parent.isGroup = true;
    return (
      <table
        class="el-table__header"
        cellspacing="0"
        cellpadding="0"
        border="0">
        <colgroup>
          {
            this.columns.map(column => <col name={ column.id } key={column.id} />)
          }
          {
            // *留出滚动条的宽度，这个地方是如果未固定才能有
            this.hasGutter ? <col name="gutter" /> : ''
          }
        </colgroup>
        <thead class={ [{ 'is-group': isGroup, 'has-gutter': this.hasGutter }] }>
          {
            // *vue中自带的方法，renderList，大概是批量render的意思
            this._l(columnRows, (columns, rowIndex) =>
              <tr
                style={ this.getHeaderRowStyle(rowIndex) }
                class={ this.getHeaderRowClass(rowIndex) }
              >
                {
                  // *如果isGroup是false，那就是正常表格（非多级表头），则thead应该只有一行，即只有一个tr，然后tr里面循环多列出来即可
                  columns.map((column, cellIndex) => (<th
                    colspan={ column.colSpan }
                    rowspan={ column.rowSpan }
                    on-mousemove={ ($event) => this.handleMouseMove($event, column) }
                    on-mouseout={ this.handleMouseOut }
                    on-mousedown={ ($event) => this.handleMouseDown($event, column) }
                    on-click={ ($event) => this.handleHeaderClick($event, column) }
                    on-contextmenu={ ($event) => this.handleHeaderContextMenu($event, column) }
                    style={ this.getHeaderCellStyle(rowIndex, cellIndex, columns, column) }
                    class={ this.getHeaderCellClass(rowIndex, cellIndex, columns, column) }
                    key={ column.id }>
                    <div class={ ['cell', column.filteredValue && column.filteredValue.length > 0 ? 'highlight' : '', column.labelClassName] }>
                      {
                        // *这个地方传出去的参数，经过测试，store会引起浏览器死循环
                        column.renderHeader
                          ? column.renderHeader.call(this._renderProxy, h, { column, $index: cellIndex, store: this.store, _self: this.$parent.$vnode.context })
                          : column.label
                      }
                      {
                        column.sortable ? (<span
                          class="caret-wrapper"
                          on-click={ ($event) => this.handleSortClick($event, column) }>
                          <i class="sort-caret ascending"
                            on-click={ ($event) => this.handleSortClick($event, column, 'ascending') }>
                          </i>
                          <i class="sort-caret descending"
                            on-click={ ($event) => this.handleSortClick($event, column, 'descending') }>
                          </i>
                        </span>) : ''
                      }
                      {
                        column.filterable ? (<span
                          class="el-table__column-filter-trigger"
                          on-click={ ($event) => this.handleFilterClick($event, column) }>
                          <i class={ ['el-icon-arrow-down', column.filterOpened ? 'el-icon-arrow-up' : ''] }></i>
                        </span>) : ''
                      }
                    </div>
                  </th>))
                }
                {
                  this.hasGutter ? <th class="gutter"></th> : ''
                }
              </tr>
            )
          }
        </thead>
      </table>
    );
  },

  props: {
    fixed: String,
    store: {
      required: true
    },
    border: Boolean,
    defaultSort: {
      type: Object,
      default() {
        return {
          prop: '',
          order: ''
        };
      }
    }
  },

  components: {
    ElCheckbox
  },

  computed: {
    table() {
      // *父级才是真的table
      return this.$parent;
    },

    hasGutter() {
      // *如果不是fixed，则返回滚动条宽度，因为table-header如果设置了fixed，是不会出现滚动条的，只会在左右固定的模块里面
      return !this.fixed && this.tableLayout.gutterWidth;
    },

    ...mapStates({
      columns: 'columns',
      isAllSelected: 'isAllSelected',
      leftFixedLeafCount: 'fixedLeafColumnsLength',
      rightFixedLeafCount: 'rightFixedLeafColumnsLength',
      columnsCount: states => states.columns.length,
      leftFixedCount: states => states.fixedColumns.length,
      rightFixedCount: states => states.rightFixedColumns.length
    })
  },

  created() {
    this.filterPanels = {};
  },

  mounted() {
    // nextTick 是有必要的 https://github.com/ElemeFE/element/pull/11311
    this.$nextTick(() => {
      // *获取默认的排列顺序，prop表示要根据哪一列排序，而order则表示排列属性：升序、降序（ascending, descending）
      // *在表头table中，有箭头icon需要展示
      const { prop, order } = this.defaultSort;
      const init = true;
      // *放入自己的store中存储
      // ?开始进行sort排序
      this.store.commit('sort', { prop, order, init });
    });
  },

  beforeDestroy() {
    // TODO需要再看看
    const panels = this.filterPanels;
    for (let prop in panels) {
      if (panels.hasOwnProperty(prop) && panels[prop]) {
        panels[prop].$destroy(true);
      }
    }
  },

  methods: {
    // *设置行样式，如果没有嵌套，这个rowIndex永远都是0，也就是只能修改唯一的一个表头样式
    // !如果是嵌套column，也就是多级表头的话，rowIndex就不是永远为0，所以function方式支持用户设定多级表头的某一级的样式
    getHeaderRowStyle(rowIndex) {
      const headerRowStyle = this.table.headerRowStyle;
      if (typeof headerRowStyle === 'function') {
        return headerRowStyle.call(null, { rowIndex });
      }
      return headerRowStyle;
    },

    getHeaderRowClass(rowIndex) {
      const classes = [];

      const headerRowClassName = this.table.headerRowClassName;
      if (typeof headerRowClassName === 'string') {
        classes.push(headerRowClassName);
      } else if (typeof headerRowClassName === 'function') {
        classes.push(headerRowClassName.call(null, { rowIndex }));
      }

      return classes.join(' ');
    },

    // *header头单元格样式
    getHeaderCellStyle(rowIndex, columnIndex, row, column) {
      const headerCellStyle = this.table.headerCellStyle;
      if (typeof headerCellStyle === 'function') {
        return headerCellStyle.call(null, {
          rowIndex,
          columnIndex,
          row,
          column
        });
      }
      return headerCellStyle;
    },
    // *判断是否是隐藏单元格
    // *隐藏的情况应该是有固定列出现，用is-hidden类名来进行样式设定，那这个单元格就只是起到一个占位的作用，所以el-table有fixed的时候会多渲染好几个table标签
    isCellHidden(index, columns) {
      let start = 0;
      // TODO干啥的，估计是因为如果有合并的，那index这个数量就不准确了，这里还需要计算未合并的个数
      for (let i = 0; i < index; i++) {
        start += columns[i].colSpan;
      }
      // !这里减1的原因？？
      const after = start + columns[index].colSpan - 1;
      if (this.fixed === true || this.fixed === 'left') {
        return after >= this.leftFixedLeafCount;
      } else if (this.fixed === 'right') {
        return start < this.columnsCount - this.rightFixedLeafCount;
      } else {
        return (after < this.leftFixedLeafCount) || (start >= this.columnsCount - this.rightFixedLeafCount);
      }
    },
    // *给header的cell添加class名字
    getHeaderCellClass(rowIndex, columnIndex, row, column) {
      const classes = [column.id, column.order, column.headerAlign, column.className, column.labelClassName];

      // *如果是第一行表头并且
      // TODO为啥一定是第一行，我看html结构还真是没有is-hidden，我看就算所有都没有is-hidden似乎也没问题
      if (rowIndex === 0 && this.isCellHidden(columnIndex, row)) {
        classes.push('is-hidden');
      }

      if (!column.children) {
        classes.push('is-leaf');
      }

      if (column.sortable) {
        classes.push('is-sortable');
      }

      const headerCellClassName = this.table.headerCellClassName;
      if (typeof headerCellClassName === 'string') {
        classes.push(headerCellClassName);
      } else if (typeof headerCellClassName === 'function') {
        classes.push(headerCellClassName.call(null, {
          rowIndex,
          columnIndex,
          row,
          column
        }));
      }

      return classes.join(' ');
    },

    toggleAllSelection(event) {
      event.stopPropagation();
      this.store.commit('toggleAllSelection');
    },

    handleFilterClick(event, column) {
      event.stopPropagation();
      const target = event.target;
      let cell = target.tagName === 'TH' ? target : target.parentNode;
      // *如果有这个类名，则不能进行其他操作
      if (hasClass(cell, 'noclick')) return;
      // *表头筛选的那个小三角
      cell = cell.querySelector('.el-table__column-filter-trigger') || cell;
      const table = this.$parent;

      let filterPanel = this.filterPanels[column.id];

      if (filterPanel && column.filterOpened) {
        filterPanel.showPopper = false;
        return;
      }

      // *实例化一个筛选下拉，并且插入到dom中
      if (!filterPanel) {
        // *新实例化一个vue组件
        filterPanel = new Vue(FilterPanel);
        this.filterPanels[column.id] = filterPanel;
        // *设置筛选下拉框的位置，跟tooltip的placement属性一样
        if (column.filterPlacement) {
          filterPanel.placement = column.filterPlacement;
        }
        filterPanel.table = table;
        filterPanel.cell = cell;
        filterPanel.column = column;
        !this.$isServer && filterPanel.$mount(document.createElement('div'));
      }

      setTimeout(() => {
        filterPanel.showPopper = true;
      }, 16);
    },

    // *这个方法是绑定到th上的，所以都能触发
    handleHeaderClick(event, column) {
      // *没有筛选但是有排序的情况
      if (!column.filters && column.sortable) {
        this.handleSortClick(event, column);
      } else if (column.filterable && !column.sortable) {
        // *有筛选但是没有排序的情况
        this.handleFilterClick(event, column);
      }

      this.$parent.$emit('header-click', column, event);
    },

    // *尝试打开上下文菜单，主要就是鼠标右键或者按下键盘上的菜单键时被触发
    handleHeaderContextMenu(event, column) {
      this.$parent.$emit('header-contextmenu', column, event);
    },

    handleMouseDown(event, column) {
      if (this.$isServer) return;
      // *如果有多级表头，则不能进行拖拽，只能再子表头进行拖拽
      if (column.children && column.children.length > 0) return;
      /* istanbul ignore if */
      // *当前条件表示正则拖拽宽度中
      // TODO我觉得这个地方可以不用border的判断，因为前面已经判断了
      if (this.draggingColumn && this.border) {
        this.dragging = true;

        // *拖拽中的那根线出现
        this.$parent.resizeProxyVisible = true;

        const table = this.$parent;
        const tableEl = table.$el;
        const tableLeft = tableEl.getBoundingClientRect().left;
        const columnEl = this.$el.querySelector(`th.${column.id}`);
        const columnRect = columnEl.getBoundingClientRect();
        // *计算能向左移动的最小距离
        const minLeft = columnRect.left - tableLeft + 30;

        // *添加类名‘noclick’
        addClass(columnEl, 'noclick');

        this.dragState = {
          startMouseLeft: event.clientX,
          startLeft: columnRect.right - tableLeft,
          startColumnLeft: columnRect.left - tableLeft,
          tableLeft
        };

        // *拖拽宽度的那根虚线dom
        const resizeProxy = table.$refs.resizeProxy;
        // *设置left为当前鼠标move的地方
        resizeProxy.style.left = this.dragState.startLeft + 'px';

        // TODO可能是禁止select事件和拖拽事件
        document.onselectstart = function() { return false; };
        document.ondragstart = function() { return false; };

        // *mouseMove事件
        const handleMouseMove = (event) => {
          // *记录水平移动的距离
          const deltaLeft = event.clientX - this.dragState.startMouseLeft;
          // !计算水平移动的距离：表格列右侧拖拽线的距离到表格左侧的距离（估计是定位是相对于表格的）+移动距离（可正可负）
          const proxyLeft = this.dragState.startLeft + deltaLeft;

          // *限制拖动宽度的的范围，向左侧移动的距离不能低于列左侧线向右30px
          resizeProxy.style.left = Math.max(minLeft, proxyLeft) + 'px';
        };

        // *mouseup事件
        const handleMouseUp = () => {
          if (this.dragging) {
            const {
              startColumnLeft,
              startLeft
            } = this.dragState;
            // *获取鼠标最后的left值
            const finalLeft = parseInt(resizeProxy.style.left, 10);
            // *获取最后column应该设置的宽度
            const columnWidth = finalLeft - startColumnLeft;
            column.width = column.realWidth = columnWidth;
            // *抛出header宽度变化emit，用户可以使用该回调，传入变更后的宽度，变更前的宽度、当前的column和event对象
            table.$emit('header-dragend', column.width, startLeft - startColumnLeft, column, event);

            this.store.scheduleLayout();

            document.body.style.cursor = '';
            this.dragging = false;
            this.draggingColumn = null;
            this.dragState = {};

            table.resizeProxyVisible = false;
          }

          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.onselectstart = null;
          document.ondragstart = null;

          setTimeout(function() {
            removeClass(columnEl, 'noclick');
          }, 0);
        };

        // !这是在mouseDown事件中，给document添加mousemove事件！
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    },

    handleMouseMove(event, column) {
      // *如果有children，则代表还有树形结构
      // TODO但是我测试出来：有children的column也会触发
      if (column.children && column.children.length > 0) return;
      let target = event.target;
      while (target && target.tagName !== 'TH') {
        // !为什么在div.cell里面加了其他dom，但是parentNode还是th呢？？
        // *解答：因为这个mousemove的事件冒泡，就算是子元素，也会触发绑定事件元素的方法
        // TODO既然如此，那是不是不用获取parentNode了，因为都会冒泡上去？？？反正现在我测试了是可以去掉的
        target = target.parentNode;
      }
      // *默认resizable是true
      if (!column || !column.resizable) return;
      // *默认情况下是不触发的
      if (!this.dragging && this.border) {
        // *返回元素的大小及其相对于视口的位置
        let rect = target.getBoundingClientRect();

        const bodyStyle = document.body.style;
        // *两个条件：1、容器宽度必须>12；2、鼠标所在地方必须是每一个th右侧的border
        // ! rect.right表示容器右侧距离视口的距离（整个所以的这个right值都是一个），pageX是鼠标位置距离视口左侧的距离，所以当两个距离接近的时候，表示已经到th右侧的border了
        if (rect.width > 12 && rect.right - event.pageX < 8) {
          // *确实有这个属性，表示可设置宽度提示
          bodyStyle.cursor = 'col-resize';
          if (hasClass(target, 'is-sortable')) {
            target.style.cursor = 'col-resize';
          }
          this.draggingColumn = column;
        } else if (!this.dragging) {
          // *如果没有设置border，dragging是false，则表示表格宽度不能修改
          bodyStyle.cursor = '';
          if (hasClass(target, 'is-sortable')) {
            target.style.cursor = 'pointer';
          }
          this.draggingColumn = null;
        }
      }
    },

    handleMouseOut() {
      if (this.$isServer) return;
      document.body.style.cursor = '';
    },

    toggleOrder({ order, sortOrders }) {
      // *order和sortOrders关系：order来自于default-sort
      // *sort-orders表示排序的选项顺序数组，比如给出来这样的排序['ascending', 'descending']，那在我们点击字段的时候会按照这个顺序进行排序，第一次是升，第二次是降（跟点击小箭头无关哈）
      if (order === '') return sortOrders[0];
      const index = sortOrders.indexOf(order || null);
      // *这个地方length-2，是因为如果是数组中的最后一个，那就不能直接index+1了，所以直接赋值为0就好了
      return sortOrders[index > sortOrders.length - 2 ? 0 : index + 1];
    },

    // *处理排序点击事件
    // *主要就是给states的sort相关的属性赋上当前column的sort相关属性，然后在watcher.js中统一进行排序动作
    handleSortClick(event, column, givenOrder) {
      event.stopPropagation();
      // *计算出当前应该的排序规则
      let order = column.order === givenOrder
        ? null
        : (givenOrder || this.toggleOrder(column));

      let target = event.target;
      while (target && target.tagName !== 'TH') {
        target = target.parentNode;
      }

      if (target && target.tagName === 'TH') {
        // TODO后续看看
        if (hasClass(target, 'noclick')) {
          removeClass(target, 'noclick');
          return;
        }
      }

      // *使用排序，必须腰sortable为true才能生效
      if (!column.sortable) return;

      const states = this.store.states;
      // *默认排序里头的prop
      let sortProp = states.sortProp;
      let sortOrder;
      // *默认排序的column，或者是上一次排序的column
      const sortingColumn = states.sortingColumn;

      // *如果前一个排序column跟现在不相同或者是相同但是排序的order是null
      // TODO没明白这么做的意义是什么，为什么不直接赋值呢？？
      if (sortingColumn !== column || (sortingColumn === column && sortingColumn.order === null)) {
        if (sortingColumn) {
          sortingColumn.order = null;
        }
        states.sortingColumn = column;
        sortProp = column.property;
      }

      // *没有排序规则
      if (!order) {
        sortOrder = column.order = null;
      } else {
        sortOrder = column.order = order;
      }

      states.sortProp = sortProp;
      states.sortOrder = sortOrder;

      this.store.commit('changeSortCondition');
    }
  },

  data() {
    return {
      draggingColumn: null,
      dragging: false,
      dragState: {}
    };
  }
};
