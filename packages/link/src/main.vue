<!--
 * @description: 
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc: 
-->
<template>
  <!-- $attrs其实就是能够让父组件使用时，可以直接设置本组件的原生属性，比如a链接有一个target，但是本组件没有props，所以直接使用$attrs -->
  <a
    :class="[
      'el-link',
      type ? `el-link--${type}` : '',
      disabled && 'is-disabled',
      underline && !disabled && 'is-underline'
    ]"
    :href="disabled ? null : href"
    v-bind="$attrs"
    @click="handleClick"
  >
    <i :class="icon" v-if="icon"></i>

    <span v-if="$slots.default" class="el-link--inner">
      <slot></slot>
    </span>

    <template v-if="$slots.icon">
      <slot v-if="$slots.icon" name="icon"></slot>
    </template>
  </a>
</template>

<script>
/*eslint-disable */
export default {
  name: 'ElLink',

  props: {
    type: {
      type: String,
      default: 'default'
    },
    underline: {
      type: Boolean,
      default: true
    },
    disabled: Boolean,
    href: String,
    icon: String
  },

  methods: {
    handleClick(event) {
      if (!this.disabled) {
        if (!this.href) {
          this.$emit('click', event)
        }
      }
    }
  }
}
</script>
