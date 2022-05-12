<!--
 * @description: 
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc: 
-->
<template>
  <label
    class="el-radio"
    :class="[
      border && radioSize ? 'el-radio--' + radioSize : '',
      { 'is-disabled': isDisabled },
      { 'is-focus': focus },
      { 'is-bordered': border },
      { 'is-checked': model === label }
    ]"
    role="radio"
    :aria-checked="model === label"
    :aria-disabled="isDisabled"
    :tabindex="tabIndex"
    @keydown.space.stop.prevent="model = isDisabled ? model : label"
  >
    <span
      class="el-radio__input"
      :class="{
        'is-disabled': isDisabled,
        'is-checked': model === label
      }"
    >
      <span class="el-radio__inner"></span>
      <input
        ref="radio"
        class="el-radio__original"
        :value="label"
        type="radio"
        aria-hidden="true"
        v-model="model"
        @focus="focus = true"
        @blur="focus = false"
        @change="handleChange"
        :name="name"
        :disabled="isDisabled"
        tabindex="-1"
      />
    </span>
    <span class="el-radio__label" @keydown.stop>
      <slot></slot>
      <template v-if="!$slots.default">{{label}}</template>
    </span>
  </label>
</template>
<script>
/*eslint-disable */
import Emitter from 'element-ui/src/mixins/emitter'

export default {
  name: 'ElRadio',

  mixins: [Emitter],

  inject: {
    elForm: {
      default: ''
    },

    elFormItem: {
      default: ''
    }
  },

  componentName: 'ElRadio',

  props: {
    value: {},
    label: {},
    disabled: Boolean,
    name: String,
    border: Boolean,
    size: String
  },

  data() {
    return {
      focus: false
    }
  },
  computed: {
    isGroup() {
      let parent = this.$parent
      while (parent) {
        if (parent.$options.componentName !== 'ElRadioGroup') {
          parent = parent.$parent
        } else {
          this._radioGroup = parent
          return true
        }
      }
      return false
    },
    model: {
      get() {
        return this.isGroup ? this._radioGroup.value : this.value
      },
      set(val) {
        //? 区分是否是checkBox组，如果是组，则v-model绑定应该是加入到el-radio-group组的v-mode里面，而不是单纯放这个el-radio的value里面了
        //? <el-radio-group>
        //?    <el-radio></el-radio>
        //? </el-radio-group>
        if (this.isGroup) {
          this.dispatch('ElRadioGroup', 'input', [val])
        } else {
          this.$emit('input', val)
        }
        this.$refs.radio &&
          (this.$refs.radio.checked = this.model === this.label)
      }
    },
    _elFormItemSize() {
      return (this.elFormItem || {}).elFormItemSize
    },
    radioSize() {
      const temRadioSize =
        this.size || this._elFormItemSize || (this.$ELEMENT || {}).size
      return this.isGroup
        ? this._radioGroup.radioGroupSize || temRadioSize
        : temRadioSize
    },
    isDisabled() {
      return this.isGroup
        ? this._radioGroup.disabled ||
            this.disabled ||
            (this.elForm || {}).disabled
        : this.disabled || (this.elForm || {}).disabled
    },
    tabIndex() {
      return this.isDisabled || (this.isGroup && this.model !== this.label)
        ? -1
        : 0
    }
  },

  methods: {
    handleChange() {
      this.$nextTick(() => {
        this.$emit('change', this.model)
        this.isGroup &&
          this.dispatch('ElRadioGroup', 'handleChange', this.model)
      })
    }
  }
}
</script>
