<!--
 * @description: 
 * @author: xiejiaxin
 * @e-mail: xiejx@glodon.com
 * @Date: 2021-12-09 17:47:30
 * @desc: 
-->
<template>
  <div style="margin: 20px;">
    <el-table-learn
    :data="tableData"
    :indent="30"
    row-key="id"
    height="550"
    default-expand-all
    :default-sort = "{prop: 'date', order: 'descending'}"
    :tree-props="{children: 'children', hasChildren: 'hasChildren'}">
      <el-table-column
        type="index"
        fixed>
        <template slot="header" slot-scope="scope">这是一个表头</template>
      </el-table-column>
      <!-- <el-table-column
        type="selection">
      </el-table-column> -->
      <!-- <el-table-column
        label="测试左固定"
        fixed
        prop="province">
      </el-table-column> -->
      <el-table-column
        v-for="item in tbLabel"
        :key="item.prop"
        :prop="item.prop"
        :filtered-value="(item.prop === 'age') ? ['2'] : []"
        :filter-method="(item.prop === 'age') ? dataFilter : null"
        :width="(item.prop === 'address' || item.prop === 'name' || item.prop === 'zip' || item.prop === 'age') ? 400 : ''"
        :label="item.name">
        <template slot-scope="scope">
          <el-input v-if="item.prop === 'address' || item.prop === 'name' || item.prop === 'zip' || item.prop === 'age'" v-model="scope.row[item.prop]" />
          <el-select v-else-if="item.prop === 'city'" v-model="scope.row[item.prop]" placeholder="请选择">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
          <el-select v-else-if="item.prop === 'sex'" v-model="scope.row[item.prop]" placeholder="请选择">
            <el-option
              v-for="item in sexOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
          <!-- <el-date-picker
            v-else-if="item.prop === 'date'"
            v-model="scope.row[item.prop]"
            type="date"
            placeholder="选择日期">
          </el-date-picker> -->
          <span v-else>{{scope.row[item.prop]}}</span>
        </template>
      </el-table-column>
    </el-table-learn>
  </div>
</template>

<script>
  import {mockData} from './mock';
  // 表头
  const tbLabel = [
    {
      prop: 'date',
      name: '日期'
    },
    {
      prop: 'name',
      name: '姓名'
    },
    {
      prop: 'city',
      name: '城市'
    },
    {
      prop: 'address',
      name: '地址'
    },
    {
      prop: 'zip',
      name: '邮政编码'
    },
    {
      prop: 'sex',
      name: '性别'
    },
    {
      prop: 'age',
      name: '年龄'
    }
  ]
  export default {
    data() {
      return {
        tableData: mockData,
        tbLabel: tbLabel,
        form: {
          date: '',
          name: '',
          city: '',
          address: '',
          zip: ''
        },
        sexOptions: [
          {
            label: '男',
            value: '1'
          },
          {
            label: '女',
            value: '2'
          }
        ],
        options: [
          {
            label: '普陀区',
            value: '1'
          },
          {
            label: '普陀区2',
            value: '2'
          },
          {
            label: '普陀区3',
            value: '3'
          },
          {
            label: '普陀区4',
            value: '4'
          },
          {
            label: '普陀区5',
            value: '5'
          }
        ]
      };
    },
    mounted() {},
    methods: {
      dataFilter(value, row, column) {
        return row[column.property] === value;
      },
      // *测试column的render-header属性是否有用，测试结果是无用，只会有一个warn提示
      renderHeader(h) {
        return h('div', 'test')
      }
    }
  };
</script>
