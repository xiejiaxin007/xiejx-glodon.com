<!--
 * @description: 
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc: 
-->
<template>
  <aside class="el-aside" :style="{ width }">
    <slot></slot>
  </aside>
</template>

<script>
/*eslint-disable */
export default {
  name: 'ElAside',

  componentName: 'ElAside',

  props: {
    width: {
      type: String,
      default: '300px'
    }
  }
}
</script>
