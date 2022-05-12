/*
 * @description:
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc:
 */
/*eslint-disable */
export default {
  name: 'ElCol',

  props: {
    span: {
      type: Number,
      default: 24,
    },
    tag: {
      type: String,
      default: 'div',
    },
    // ? 栅格左侧的间隔格数
    offset: Number,
    // ? 栅格向左移动格数
    pull: Number,
    // ? 栅格向右移动格数
    push: Number,
    // ? 兼容不同设备
    xs: [Number, Object],
    sm: [Number, Object],
    md: [Number, Object],
    lg: [Number, Object],
    xl: [Number, Object],
  },

  computed: {
    // ? 继承父级ElRow的getter
    gutter() {
      let parent = this.$parent;
      // ? 找上级是el-row，也就是parent就是el-row标签
      while (parent && parent.$options.componentName !== 'ElRow') {
        parent = parent.$parent;
      }
      return parent ? parent.gutter : 0;
    },
  },
  render(h) {
    let classList = [];
    let style = {};

    if (this.gutter) {
      style.paddingLeft = this.gutter / 2 + 'px';
      style.paddingRight = style.paddingLeft;
    }

    ['span', 'offset', 'pull', 'push'].forEach((prop) => {
      if (this[prop] || this[prop] === 0) {
        classList.push(
          prop !== 'span'
            ? `el-col-${prop}-${this[prop]}`
            : `el-col-${this[prop]}`
        );
      }
    });

    ['xs', 'sm', 'md', 'lg', 'xl'].forEach((size) => {
      if (typeof this[size] === 'number') {
        classList.push(`el-col-${size}-${this[size]}`);
      } else if (typeof this[size] === 'object') {
        let props = this[size];
        Object.keys(props).forEach((prop) => {
          classList.push(
            prop !== 'span'
              ? `el-col-${size}-${prop}-${props[prop]}`
              : `el-col-${size}-${props[prop]}`
          );
        });
      }
    });

    return h(
      this.tag,
      {
        class: ['el-col', classList],
        style,
      },
      this.$slots.default
    );
  },
};
