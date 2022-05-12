<!--
 * @description: 
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc: 
-->
<template>
  <footer class="el-footer" :style="{ height }">
    <slot></slot>
  </footer>
</template>

<script>
/*eslint-disable */
export default {
  name: 'ElFooter',

  componentName: 'ElFooter',

  props: {
    height: {
      type: String,
      default: '60px'
    }
  }
}
</script>
