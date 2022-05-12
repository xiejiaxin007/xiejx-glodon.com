<!--
 * @description: 
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc: 
-->
<template>
  <section class="el-container" :class="{ 'is-vertical': isVertical }">
    <slot></slot>
  </section>
</template>

<script>
/*eslint-disable */
export default {
  name: 'ElContainer',

  componentName: 'ElContainer',

  props: {
    direction: String
  },

  computed: {
    isVertical() {
      if (this.direction === 'vertical') {
        return true
      } else if (this.direction === 'horizontal') {
        return false
      }
      return this.$slots && this.$slots.default
        ? this.$slots.default.some(vnode => {
            const tag = vnode.componentOptions && vnode.componentOptions.tag
            return tag === 'el-header' || tag === 'el-footer'
          })
        : false
    }
  }
}
</script>
