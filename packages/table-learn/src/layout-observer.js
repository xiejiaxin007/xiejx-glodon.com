export default {
  created() {
    // 加入监听
    this.tableLayout.addObserver(this);
  },
  destroyed() {
    // 移除监听
    this.tableLayout.removeObserver(this);
  },
  computed: {
    // *获取父级组件的layout对象
    tableLayout() {
      let layout = this.layout;
      if (!layout && this.table) {
        layout = this.table.layout;
      }
      if (!layout) {
        throw new Error('Can not find table layout.');
      }
      return layout;
    }
  },
  mounted() {
    this.onColumnsChange(this.tableLayout);
    this.onScrollableChange(this.tableLayout);
  },

  updated() {
    if (this.__updated__) return;
    this.onColumnsChange(this.tableLayout);
    this.onScrollableChange(this.tableLayout);
    this.__updated__ = true;
  },

  methods: {
    onColumnsChange(layout) {
      const cols = this.$el.querySelectorAll('colgroup > col');
      if (!cols.length) return;
      // *获取传入的column数组
      const flattenColumns = layout.getFlattenColumns();
      const columnsMap = {};
      flattenColumns.forEach((column) => {
        columnsMap[column.id] = column;
      });
      for (let i = 0, j = cols.length; i < j; i++) {
        const col = cols[i];
        const name = col.getAttribute('name');
        const column = columnsMap[name];
        if (column) {
          col.setAttribute('width', column.realWidth || column.width);
        }
      }
    },

    onScrollableChange(layout) {
      const cols = this.$el.querySelectorAll('colgroup > col[name=gutter]');
      for (let i = 0, j = cols.length; i < j; i++) {
        const col = cols[i];
        col.setAttribute('width', layout.scrollY ? layout.gutterWidth : '0');
      }
      const ths = this.$el.querySelectorAll('th.gutter');
      for (let i = 0, j = ths.length; i < j; i++) {
        const th = ths[i];
        th.style.width = layout.scrollY ? layout.gutterWidth + 'px' : '0';
        th.style.display = layout.scrollY ? '' : 'none';
      }
    }
  }
};
