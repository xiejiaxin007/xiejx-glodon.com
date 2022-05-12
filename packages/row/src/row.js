/*
 * @description:
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc:
 */
/*eslint-disable */
export default {
  name: 'ElRow',

  componentName: 'ElRow',

  props: {
    tag: {
      type: String,
      default: 'div',
    },
    gutter: Number,
    type: String,
    justify: {
      type: String,
      default: 'start',
    },
    align: {
      type: String,
      default: 'top',
    },
  },

  computed: {
    style() {
      const ret = {};
      // ! 这个是负值，主要是拿来平衡一个row左右跟父容器的边距的，因为里面的col是paading-left和padding-right同时作用的，所以为了让row两边的间距跟col中间一样，所以弄得
      if (this.gutter) {
        ret.marginLeft = `-${this.gutter / 2}px`;
        ret.marginRight = ret.marginLeft;
      }

      return ret;
    },
  },

  render(h) {
    return h(
      this.tag,
      {
        class: [
          'el-row',
          this.justify !== 'start' ? `is-justify-${this.justify}` : '',
          this.align !== 'top' ? `is-align-${this.align}` : '',
          { 'el-row--flex': this.type === 'flex' },
        ],
        style: this.style,
      },
      this.$slots.default
    );
  },
};
