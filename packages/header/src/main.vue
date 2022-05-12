<!--
 * @description: 
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc: 
-->
<template>
  <header class="el-header" :style="{ height }">
    <slot></slot>
  </header>
</template>

<script>
/*eslint-disable */
export default {
  name: 'ElHeader',

  componentName: 'ElHeader',

  props: {
    height: {
      type: String,
      default: '60px'
    }
  }
}
</script>
